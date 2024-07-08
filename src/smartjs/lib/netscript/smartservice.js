import { Proxy } from "/smartjs/lib/proxy";
import { NSEventBus } from "/smartjs/lib/netscript/nseventbus";
import { StatusCode, StatusCodeMessages } from "/smartjs/lib/enums";

export async function SmartService ( ns, rxPort, globalNamespace, serviceName ) {
    const p = Proxy();
    const bus = await NSEventBus( ns, rxPort, { globalNamespace, serviceName } );
    const linkage = bus.registrar("SmartService.Linkage")();
    const serviceUUID = bus.uuid();

    let _getStatus = () => {
        return {
            code: StatusCode.UNKNOWN,
            message: StatusCodeMessages.byKeys()[ StatusCode.UNKNOWN ]
        };
    }

    function update () {
        bus.digest();
    }

    function _shutdown () {
        linkage.post( "SmartService.ShutdownNotification", serviceUUID );
        bus.digest();
        bus.shutdown();
    }

    linkage.respond( "SmartService.ServicePoll", () => ( {
        uuid: serviceUUID,
        name: serviceName
    } ) );

    linkage.respond( "SmartService.StatusPoll", () => {
        return {
            uuid: serviceUUID,
            status: _getStatus()
        };
    } );

    await linkage.linkByPort(2);

    return p.final( {
        uuid: () => bus.uuid(),
        globalNamespace: () => bus.globalNamespace(),
        namespace: () => bus.namespace(),
        enqueue: cb => bus.enqueue( cb ),
        loop: ( cb, ms ) => bus.loop( cb, ms ),
        status: fn => _getStatus = fn,
        log: record => {
            bus.broadcast( "Log", {
                uuid,
                ...record
            } );
        },
        update,
        observe: ( event, cb, { once = undefined } = {} ) => bus.observe( event, cb, { once } ),
        intercept: ( event, cb, { namespace = undefined, once = false } = {} ) => bus.intercept( event, cb, { namespace, once } ),
        inject: ( event, data, { namespace = undefined, origin = undefined, messenger = undefined, meta = undefined } = {} ) => bus.inject( event, data, { namespace, origin, messenger, meta } ),
        relay: ( event, out, { direction = undefined, once = undefined, meta = undefined } = {} ) => bus.relay( event, out, { direction, once, meta } ),
        post: ( event, data ) => bus.post( event, data ),
        subscribe: ( event, cb ) => bus.subscribe( event, cb ),
        request: ( event, data, cb, { namespace = undefined, onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => bus.request( event, data, cb, { namespace, onTimeout, retries, timeout } ),
        arequest: ( event, data, cb, { namespace = undefined, onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => bus.arequest( event, data, cb, { namespace, onTimeout, retries, timeout } ),
        poll: ( event, data, cb, { namespace = undefined, max = undefined, wait = undefined } = {} ) => bus.poll( event, data, cb, { namespace, max, wait } ),
        apoll: ( event, data, cb, { namespace = undefined, max = undefined, wait = undefined } = {} ) => bus.apoll( event, data, cb, { namespace, max, wait } ),
        respond: ( event, cb, { namespace = undefined, once = false } = {} ) => bus.respond( event, cb, { namespace, once } ),
        linkByPort: port => bus.linkByPort( port ),
        linkByName: name => bus.linkByName( name ),
        registrar: ( containerNamespace, { slots = 1 } = {} ) => bus.registrar( containerNamespace, { slots } ),
        shutdown: () => _shutdown()
    } );
}