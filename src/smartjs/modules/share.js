import * as SJS from "/smartjs/lib/common";

function ShareModule ( registrar, nse ) {
    const m = SJS.Modules.Module( registrar, "Share" );

    m.options( [
        m.mkArrOption( "ServerPool", [], { label: "Server pool", description: "Pool of servers to use for sharing processing power." } ),
        m.mkBoolOption( "UseServerPool", true, { label: "Use 'Server Pool'", description: "Whether or not to use 'Server pool' to choose which servers to use for sharing processing power." } )
    ] );
    
    m.init( async () => {
        m.bus().loop( async () => {
            if ( await m.get("ServerPool").length > 0 ) {
                m.post( "FileSync.FileSyncRequest", {
                    files: [
                        new SynchronizeRequest( "home", "/smartjs/scripts/share.js", m.get("ServerPool") )
                    ]
                } );
            }
        }, 60_000 );
    } );

    m.update( () => {
        //
    } );

    return m.finalize();
}

export { ShareModule as init };