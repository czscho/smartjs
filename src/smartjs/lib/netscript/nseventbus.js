import { Proxy } from "/smartjs/lib/proxy";
import { EventBus } from "/smartjs/lib/eventbus";
import { generateUUID } from "/smartjs/lib/uuid";
import { sleep } from "/smartjs/lib/sleep";
import { startNSAsyncLoop } from "/smartjs/lib/netscript/nsasyncloop";

export async function NSEventBus ( ns, rxPort, { globalNamespace = "NSEvents", chunkSize = 100 } = {} ) {
    const p = Proxy();
    const local = EventBus( globalNamespace );
    const broker = ns.getPortHandle(1);
    const initUUID = local.uuid();
    const connUUIDs = [];
    const conns = {};
    const stack = [];

    let handle = rxPort > 0 ? ns.getPortHandle( rxPort ) : null;

    async function _init () {
        let req = rxPort > 0 ? { uuid: initUUID, action: "init", rxPort } : { uuid: initUUID, action: "init", type: "ephemeral" };
        let file = `/smartjs/tmp/broker/${initUUID}.txt`;
        let cont = true;
        await Promise.all( [
            ( async () => {
                while ( cont ) {
                    broker.write( JSON.stringify( req ) );
                    await sleep(500);
                }
            } )(),
            ( async () => {
                while (true) {
                    if ( ns.fileExists( file ) ) {
                        let d = JSON.parse( ns.read( file ) );
                        if ( d.status == "ok" ) {
                            cont = false;
                            if ( rxPort < 1 ) {
                                rxPort = d.txPort;
                                handle = ns.getPortHandle( rxPort );
                            }
                            handle.clear();
                            break;
                        } else {
                            cont = false;
                            throw new Error(`received error from broker (status: ${d.status}, msg: ${d.message})`);
                        }
                    }
                    await sleep(50);
                }
            } )()
        ] );
    }

    function _flush () {
        let n = 0;
        
        while ( !handle.empty() && n++ < 20 ) {
            let i = JSON.parse( handle.read() );

            if ( i.action == "open" ) {
                _openIn(i);
            } else if ( i.action == "open-ack" ) {
                _openAck(i);
            } else if ( i.action == "close" ) {
                _closeIn(i);
            } else if ( i.action == "broadcast" ) {
                _broadcastIn(i);
            }
        }

        for ( let i = 0, uuid = connUUIDs[0], conn = conns[ uuid ]; i < connUUIDs.length; i++, uuid = connUUIDs[i], conn = conns[ uuid ] ) {
            let chunk = [];

            while ( conn.outbuffer.length > 0 && chunk.length < chunkSize ) {
                let m = conn.outbuffer.shift();
                chunk.push( m );
            }

            chunk.length > 0 && conn.status == "ready" && ( ns.tryWritePort( conn.txPort, JSON.stringify( { action: "broadcast", type: "chunk", data: chunk/*.filter( item => item.origin != conn.bus )*/ } ) ) || console.log(`failed write to port ${conn.txPort}`) );
        }

        while ( stack.length > 0 ) stack.shift()();
    }

    function _digest () {
        _flush();
        local.digest();
    }

    async function _linkByPort ( port, { handle = p.this } = {} ) {
        let fl = true;
        let uuid = generateUUID();
        let conn = conns[ uuid ] = {
            status: "waiting",
            outbuffer: []
        };
        await Promise.all( [
            new Promise( res => {
                conn.setReady = () => {
                    fl = false;
                    conn.txPort = port;
                    conn.status = "ready";
                    res();
                };
                ns.writePort( port, JSON.stringify( { uuid, action: "open", rxPort } ) );
            } ),
            ( async () => {
                while ( fl ) {
                    _digest();
                    await sleep(10);
                }
            } )()
        ] );
        connUUIDs.push( uuid );
        handle.observe( null, ( name, data, extra ) => {
            conn.outbuffer.push( {
                name,
                data,
                namespace: extra.namespace,
                origin: extra.origin,
                hops: extra.hops,
                trace: extra.trace,
                meta: extra.meta
            } );
        } );
    }

    async function _linkByName ( name, { handle = p.this } = {} ) {
        //
    }

    function _openIn ( data ) {
        let conn = conns[ data.uuid ] = {
            status: "ready",
            txPort: data.rxPort,
            outbuffer: []
        };
        connUUIDs.push( data.uuid );
        p.this.observe( null, ( name, data, extra ) => {
            if ( extra.meta.ns || ( extra.hops > 0 && extra.origin == data.uuid ) || typeof extra.trace[ data.uuid ] != "undefined" ) return;
            conn.outbuffer.push( {
                name,
                data,
                namespace: extra.namespace,
                origin: extra.origin,
                hops: extra.hops,
                trace: extra.trace,
                meta: extra.meta
            } );
        } );
        ns.writePort( data.rxPort, JSON.stringify( { ns: globalNamespace, uuid: data.uuid, action: "open-ack" } ) );
    }

    function _openAck ( data ) {
        let conn = conns[ data.uuid ];
        conn.setReady();
    }

    function _close ( uuid ) {
        stack.push( () => {
            connUUIDs.splice( connUUIDs.findIndex( u => u == uuid ) );
            let conn = conns[ uuid ];
            ns.writePort( conn.txPort, JSON.stringify( { uuid, action: "close" } ) );
            delete conns[ uuid ];
        } );
    }

    function _closeIn ( data ) {
        connUUIDs.splice( connUUIDs.findIndex( u => u == data.uuid ) );
        delete conns[ data.uuid ];
    }

    function _broadcastIn ( chunk ) {
        chunk.data.forEach( e => {
            local.inject(
                e.name,
                e.data,
                {
                    namespace: e.namespace,
                    origin: e.origin,
                    hops: e.hops,
                    trace: e.trace,
                    meta: {
                        ...e.meta,
                        ns: true
                    }
                }
            );
        } );
    }

    function _shutdown () {
        Object.keys( conns ).forEach( uuid => _close( uuid ) );
        broker.write( JSON.stringify( { uuid: initUUID, action: "destroy" } ) );
        _digest();
        local.shutdown();
    }

    function _registrar ( containerNamespace, { slots = 1 } = {} ) {
        const inner = local.registrar( containerNamespace, { slots } );

		return function ( localNamespace ) {
            const unqualified = containerNamespace ? `${containerNamespace}.${localNamespace}` : localNamespace;
			const p2 = Proxy();
            const inner2 = inner( localNamespace );

			return p2.final( {
                ...inner2,
                registrar: ( containerNs, { slots = 1 } = {} ) => _registrar( containerNs ? `${unqualified}.${containerNs}` : unqualified, { slots } ),
				linkByPort: port => _linkByPort( port, { handle: p2.this } ),
                linkByName: name => _linkByName( name, { handle: p2.this } )
			} );
		};
	}

    await _init();

    return p.final( {
        uuid: () => local.uuid(),
        globalNamespace: () => local.globalNamespace(),
        namespace: () => local.namespace(),
        enqueue: cb => local.enqueue( cb ),
        loop: ( cb, ms ) => local.loop( cb, ms ),
        inject: ( event, data, { namespace = undefined, origin = undefined, hops = undefined, trace = undefined, meta = undefined } = {} ) => local.inject( event, data, { namespace, origin, hops, trace, meta } ),
        relay: ( event, bus, { direction = undefined, once = undefined } = {} ) => local.relay( event, bus, { direction, once } ),
        observe: ( event, cb, { namespace = undefined, once = false } = {} ) => local.observe( event, cb, { namespace, once } ),
        intercept: ( event, cb, { namespace = undefined, once = false, meta = {} } = {} ) => local.intercept( event, cb, { namespace, once, meta } ),
        post: ( event, data ) => local.post( event, data ),
        subscribe: ( event, cb ) => local.subscribe( event, cb ),
        request: ( event, data, cb, { namespace = undefined, onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => local.request( event, data, cb, { namespace, onTimeout, retries, timeout } ),
        arequest: ( event, data, cb, { namespace = undefined, onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => local.arequest( event, data, cb, { namespace, onTimeout, retries, timeout } ),
        poll: ( event, data, cb, { namespace = undefined, max = undefined, wait = undefined } = {} ) => local.poll( event, data, cb, { namespace, max, wait } ),
        apoll: ( event, data, cb, { namespace = undefined, max = undefined, wait = undefined } = {} ) => local.apoll( event, data, cb, { namespace, max, wait } ),
        respond: ( event, cb, { namespace = undefined, once = false } = {} ) => local.respond( event, cb, { namespace, once } ),
        digest: () => _digest(),
        registrar: ( containerNamespace, { slots = 1 } = {} ) => _registrar( containerNamespace, { slots } ),
        linkByPort: port => _linkByPort( port ),
        linkByName: name => _linkByName( name ),
        shutdown: () => _shutdown()
    } );
}