import * as SJS from "/smartjs/lib/common";
import { LogLevelLabels, FilterDesc } from "/smartjs/lib/log";

function LogModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Log" );
    
    let buffer = [];
    let gLogLevel = SJS.Logging.LogLevel.DEBUG;
    let filterMap = {};

    m.expose( "Log.GetBuffer", () => {
        return { status: 0, data: buffer, message: "ok" };
    } );

    m.expose( "Log.Filter", ( _, desc ) => {
        FilterDesc.assert( desc );

        if ( desc.level == null || typeof LogLevelLabels.byKeys()[ desc.level ] == "undefined" ) {
            return { status: 1, message: `error: invalid log level` };
        }

        if ( desc.namespaces == null ) {
            gLogLevel = desc.level;
            return { status: 0, message: `set log level to ${ LogLevelLabels.byKeys()[ gLogLevel ] }` };
        }

        desc.namespaces.forEach( ns => filterMap[ ns ] = filterMap[ ns ] || desc.level );
        return { status: 0, message: `set log level to ${ LogLevelLabels.byKeys()[ desc.level ] } for ${ desc.namespaces.reduce( ( p, n ) => p ? `${p}, ${n}` : n ) }` };
    } );

    m.subscribe( "Daemon.Log", async ( ns, record ) => {
        if ( ns != m.bus().globalNamespace() ) {
            let filter;
            ns.split(".").some( ( _, i , a ) => {
                let q = ( i == a.length - 1 ? "" : "." ) + a.slice( 0 - ( i + 1 ) ).join(".");
                filter = filterMap[q];
                return typeof filter !== "undefined";
            } );

            if ( typeof filter == "undefined" && record.level < gLogLevel ) {
                return;
            }

            if ( record.level < filter ) {
                return;
            }

            if ( ns.startsWith( m.bus().globalNamespace() ) ) {
                ns = ns.slice( m.bus().globalNamespace().length + 1 );
            }
        }

        let msg = `[${ new Date().toISOString() }] [${ns}] ${ LogLevelLabels.byKeys()[ record.level ] }:  ${ record.msg }`;

        buffer.push( msg );

        if ( buffer.length >= await m.get("BufferSize") ) {
            buffer = buffer.slice(1);
        }
    } );

    m.options( [ 
        m.mkIntOption( "BufferSize", 800, { label: "Buffer size", description: "The maximum number of most recent records to keep in memory." } )
    ] );

    m.init( async () => {
        //
    } );

    m.update( () => {
        //
    } );
    return m.finalize();
}

export { LogModule as init };