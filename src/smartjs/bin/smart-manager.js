import { NSEventBus } from "/smartjs/lib/netscript/nseventbus";
import { sleep } from "/smartjs/lib/sleep";
import { StatusCode, StatusCodeMessages } from "/smartjs/lib/enums";

export async function main ( ns ) {
    ns.disableLog("ALL");
    let bus = await NSEventBus( ns, 2, { globalNamespace: "SmartManager", serviceName: "smart-manager" } );
    let services = {};
    let statuses = {};
    let defaultBufferSize = 250;
    let logs = {};
    let cont = true;

    function setupLog ( uuid ) {
        logs[ uuid ] = {
            uuid,
            bufferSize: defaultBufferSize,
            buffer: []
        };
    }

    bus.respond( "Manager.Ping", () => "pong" );
    
    bus.intercept( "Manager.Log", ( id, record ) => {
        if ( !logs[ record.uuid ] ) {
            setupLog( record.uuid );
        }

        let buffer = logs[ record.uuid ].buffer;

        buffer.unshift( record );

        while ( buffer.length > logs[ record.uuid ].size ) {
            buffer.pop();
        }
    } );

    bus.respond( "Manager.ServiceList", ( src, data ) => {
        let list = {};
        let keys = Object.keys( services );

        for ( let i = 0, k = keys[0]; i < keys.length; k = keys[++i] ) {
            let it = list[k] = {};
            let svc = services[k];
            let stat = statuses[k];
            it.name = svc.name;
            it.status = stat || { code: StatusCode.UNKNOWN, message: StatusCodeMessages.byKeys()[ StatusCode.UNKNOWN ] };
        }

        return list;
    } );

    bus.respond( "Manager.StartService", ( id, request ) => {
        //
    } );

    bus.respond( "Manager.Status", ( id, request ) => {
        //
    } );

    bus.respond( "Manager.StopService", ( id, request ) => {
        //
    } );

    bus.respond( "Manager.Shutdown", async ( src, req ) => {
        if ( req.force ) {
            //
        }

        let keys = Object.keys( services );
        for ( let i = 0, uuid = keys[0]; i < keys.length; uuid = keys[ ++i ] ) {
            let svc = services[ uuid ];
            await bus.openPort( svc.txPort );
        };
    } );

    bus.subscribe( "SmartService.ShutdownNotification", ( src, uuid ) => { console.log('owo')
        delete services[ uuid ];
        delete statuses[ uuid ];
        delete logs[ uuid ];
    } );

    bus.loop( async () => {
        await bus.apoll( "SmartService.ServicePoll", {}, ( descs ) => {
            descs.forEach( desc => {
                let svc = services[ desc.data.uuid ] = {};
                svc.name = desc.data.name;
                svc.txPort = desc.data.txPort;
                svc.lastActivity = new Date().getTime();
                setupLog( desc.data.uuid );
            } );
        } );

        await bus.apoll( "SmartService.StatusPoll", {}, ( descs ) => {
            descs.forEach( desc => {
                statuses[ desc.data.uuid ] = desc.data.status;
            } );
        } );

        Object.keys( services ).forEach( service => {
            if ( new Date().getTime() - service.lastActivity > 5000 ) {
                //
            }
        } );

        return true;
    }, 2_000 );

    while ( cont ) {
        bus.digest();
        await sleep(10);
    }

    await bus.shutdown();
}