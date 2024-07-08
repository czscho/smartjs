import * as SJS from "/smartjs/lib/common";
import { SyncRequest } from "/smartjs/lib/filesync";

function FileSyncModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "FileSync" );

    let servers = [];
    let list = [];

    m.expose( "FileSync.Sync", async ( src, request ) => {
        SyncRequest.assert( request );

        if ( await m.get("AllowModuleRequests") ) {
            m.info(`ACCEPTING request from ${ src } to sync ${ JSON.stringify( request.files ) } from ${ request.source } to ${ JSON.stringify( request.destinations ) }` );
            list.push( request );
            return { status: 0, message: "ok" };
        } else {
            m.notice(`DENYING request from ${ src } to sync ${ JSON.stringify( request.files ) } from ${ request.source } to ${ JSON.stringify( request.destinations ) }` );
            return { status: 1, message: "request denied" };
        }
    } );

    m.bus().loop( async () => {
        servers.length > 0 && list.forEach( request => {
            servers.forEach( server => {
                if ( request.destination == "ALL" || request.destination == server ) {
                    request.files.forEach( filename => {
                        if ( !ns.fileExists( filename, server ) ) {
                            ns.scp( file.filename, server, request.source );
                        }
                    } );
                }
            } )
        } );

        return true;
    }, 1_000 );

    m.options( [
        m.mkBoolOption( "AllowModuleRequests", true, { label: "Allow module requests", description: "Whether or not to allow file sync requests from other modules." } )
    ] );
    
    m.init( async () => {
        //
    } );

    m.update( async ctx => {
        servers = ctx.servers;
    } );
    return m.finalize();
}

export { FileSyncModule as init };