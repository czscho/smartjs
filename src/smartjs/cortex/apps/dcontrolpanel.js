import { App } from "/smartjs/cortex/lib/app";
import { CortexDOM } from "/smartjs/cortex/lib/app/dom";
import { Util } from "/smartjs/lib/common";

const nfmt = Util.Format.nfmt;
const dhms = Util.Format.dhms;

async function DControlPanelApp ( ns ) {
    const a = await App( ns, "DaemonControlPanel" );
    let win;
    a.init( async () => {
        await a.bus().linkByPort(3);
        win = await a.createWindow("Daemon Control Panel");
        a.bus().loop( async () => {
            let u = await a.bus().arequest( "Daemon.GetMetrics", null, ( _, r ) => r );
            if ( !u ) return;
            win.content(
                CortexDOM.createElement( "div", {},
                    CortexDOM.createElement( "div", {}, `Total Used RAM: ${ nfmt( u.usedRam * 1_000_000_000, "0.00b" ) } / ${ nfmt( u.maxRam * 1_000_000_000, "0.00b" ) }` ),
                    CortexDOM.createElement( "div", {}, `Total Income: $${ nfmt( u.income * ( u.time / 1_000 ) , "0.00a" ) } ($${ nfmt( u.income, "0.00a" ) }/sec)` ),
                    CortexDOM.createElement( "div", {}, `Running for ${ dhms( u.time ) }` )
                )
            );
        }, 1000 );
    } );
    return a.finalize();
}

export { DControlPanelApp as init };