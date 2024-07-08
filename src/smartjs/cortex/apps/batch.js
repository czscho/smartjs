import { App } from "/smartjs/cortex/lib/app";
import { CortexDOM } from "/smartjs/cortex/lib/app/dom";
import { Util } from "/smartjs/lib/common";

const nfmt = Util.Format.nfmt;
const dhms = Util.Format.dhms;

async function BatchApp ( ns ) {
    const a = await App( ns, "Batch" );
    a.init( async () => {
        await a.bus().linkByPort(3);
        const win = await a.createWindow("Batch");
        a.bus().loop( async () => {
            let s = await a.rpc("Batch.GetState");
            if ( !s ) return;
            s.jobs = s.jobs.sort( ( a, b ) => b.profit - a.profit );
            win.content( CortexDOM.createScrollable( {
                    style: {
                        maxWidth: "inherit",
                        maxHeight: "inherit"
                    }
                },
                CortexDOM.createElement( "div",
                    {
                        style: {
                            margin: "8px 0 8px 0",
                            padding: 0
                        }
                    },
                    CortexDOM.createElement( "b", {}, "JOBS: " ),
                    `${s.jobs.length} / ${s.maxJobs}`
                ),
                CortexDOM.createElement( "table",
                    {
                        class: "cortex-infotable",
                        style: {
                            width: "100%"
                        }
                    },
                    CortexDOM.createElement( "tr",
                        {
                            style: {
                                textAlign: "center",
                                border: "1px solid green",
                                maxWidth: "400px"
                            }
                        },
                        CortexDOM.createElement( "th", {}, "TARGET" ),
                        CortexDOM.createElement( "th", {}, "MONEY" ),
                        CortexDOM.createElement( "th", {}, "PROFIT" ),
                        CortexDOM.createElement( "th", {}, "TYPE"),
                        CortexDOM.createElement( "th", {}, "STAT" ),
                        CortexDOM.createElement( "th", {}, "TASK" ),
                        CortexDOM.createElement( "th", {}, "STAGE" ),
                        CortexDOM.createElement( "th", {}, "UP" )
                    ),
                    CortexDOM.createElement( "tr", {
                        style: {
                            height: "8px"
                        }
                    } ),
                    ...s.jobs.map( j => {
                        return CortexDOM.createElement( "tr", {},
                            CortexDOM.createElement( "td", {}, j.target ),
                            CortexDOM.createElement( "td", {}, j.stats ? `$${ nfmt( j.stats.money, "0.00a" ) } / $${ nfmt( j.stats.maxMoney, "0.00a" ) }` : "--" ),
                            CortexDOM.createElement( "td", {}, j.stats ? `$${ nfmt( j.stats.profit, "0.00a" ) }/sec` : "--" ),
                            CortexDOM.createElement( "td", {}, j.type || "--" ),
                            CortexDOM.createElement( "td", {}, j.status ),
                            CortexDOM.createElement( "td", {}, `${j.task}, ${ j.taskStarted > 0 ? dhms( s.time - j.taskStarted ) : "--" } / ${ j.taskDuration ? dhms( j.taskDuration ) : "--" }` ),
                            CortexDOM.createElement( "td", {}, j.stage || "--" ),
                            CortexDOM.createElement( "td", {}, j.status == "waiting" ? "--" : dhms( j.running ) )
                        );
                    } )
                )
            ) );
        }, 1000 );
    } );
    return a.finalize();
}

export { BatchApp as init };