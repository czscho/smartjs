import { App } from "/smartjs/cortex/lib/app";
import { CortexDOM } from "/smartjs/cortex/lib/app/dom";

async function LogApp ( ns ) {
    const a = await App( ns, "Log" );
    a.init( async () => {
        await a.bus().linkByPort(3);
        const win = await a.createWindow("Log");
        a.bus().loop( async () => {
            let b = await a.rpc( "Log.GetBuffer" );
            if ( !b ) return;
            win.content( CortexDOM.createScrollable( {
                    style: {
                        border: "1px solid green",
                        maxHeight: "800px",
                        maxWidth: "1600px",
                        margin: "3px",
                        paddingLeft: "12px",
                        textIndent: "-12px"
                    }
                },
                ...b.map( r => CortexDOM.createElement( "div", {}, `:${r}` ) )
            ) );
        }, 3000 );
    } );
    return a.finalize();
}

export { LogApp as init };