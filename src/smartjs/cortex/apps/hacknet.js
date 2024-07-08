import { App } from "/smartjs/cortex/lib/app";
import { Util } from "/smartjs/lib/common";
import { CortexDOM } from "/smartjs/cortex/lib/app/dom";

const nfmt = Util.Format.nfmt;

async function HacknetApp ( ns ) {
    const a = await App( ns, "Hacknet" );
    a.init( async () => {
        await a.bus().linkByPort(3);
        const win = await a.createWindow("Hacknet");
        a.bus().loop( async () => {
            let s = await a.rpc("Hacknet.GetState");
            if ( !s ) return;
            win.content( CortexDOM.createElement( "div", {},
                CortexDOM.createElement( "div",
                    {
                        style: {
                            padding: "0 0 6px 0"
                        }
                    },
                    CortexDOM.createElement( "b", {}, "Node cost: " ),
                    `$${ nfmt( s.purchaseNodeCost, "0.00a" ) }`
                ),
                CortexDOM.createElement( "div",
                    {
                        style: {
                            padding: "0 0 6px 0"
                        }
                    },
                    CortexDOM.createElement( "b", {}, "Total production: " ),
                    ( s.nodes[0] && s.nodes[0].stats.name.startsWith("hacknet-node") ) ?
                        `$${ nfmt( s.nodes.reduce( ( prev, cur ) => prev + ( cur.stats.production * cur.stats.timeOnline ), 0 ), "0.00a" ) } ( $${ nfmt( s.nodes.reduce( ( prev, cur ) => prev + cur.stats.production, 0 ), "0.00a" ) } /sec )` :
                        `${ nfmt( s.nodes.reduce( ( prev, cur ) => prev + ( cur.stats.production * cur.stats.timeOnline ), 0 ), "0.00a" ) } hashes ( ${ nfmt( s.nodes.reduce( ( prev, cur ) => prev + cur.stats.production, 0 ), "0.00a" ) } hashes /sec )`
                ),
                s.hashes ? CortexDOM.createElement( "div",
                    {
                        style: {
                            padding: "0 0 6px 0"
                        }
                    },
                    CortexDOM.createElement( "b", {}, "Hashes: " ),
                    `${ nfmt( s.hashes, "0.00a" ) } / ${ nfmt( s.hashCapacity, "0.00a" ) }`
                ) : [],
                CortexDOM.createElement( "table",
                    {
                        class: "cortex-infotable",
                        style: {
                            width: "100%",
                            textAlign: "left"
                        }
                    },
                    CortexDOM.createElement( "tr",
                        {
                            style: {
                                textAlign: "center",
                            }
                        },
                        CortexDOM.createElement( "th", {}, "#" ),
                        CortexDOM.createElement( "th", {}, "LEVEL" ),
                        CortexDOM.createElement( "th", {}, "RAM" ),
                        CortexDOM.createElement( "th", {}, "CORES" ),
                        CortexDOM.createElement( "th", {}, "CACHE" )
                    ),
                    CortexDOM.createElement( "tr", {
                        style: {
                            height: "8px"
                        }
                    } ),
                    ...s.nodes.map( ( node, i ) => CortexDOM.createElement( "tr", {},
                        CortexDOM.createElement( "td", {}, `${i}` ),
                        CortexDOM.createElement( "td", {},
                            `${ node.stats.level } (`,
                            CortexDOM.createElement( "u", {}, `+$${ nfmt( node.costs.levelUpgradeCost, "0.00a" ) }` ),
                            ")"
                        ),
                        CortexDOM.createElement( "td", {},
                            `${ nfmt( node.stats.ram * 1_000_000_000, "0.00b" ) } (`,
                            CortexDOM.createElement( "u", {}, `+$${ nfmt( node.costs.ramUpgradeCost, "0.00a" ) }` ),
                            ")"
                        ),
                        CortexDOM.createElement( "td", {},
                            `${ node.stats.cores } (`,
                            CortexDOM.createElement( "u", {}, `+$${ nfmt( node.costs.coresUpgradeCost, "0.00a" ) }` ),
                            ")"
                        ),
                        CortexDOM.createElement( "td", {},
                            `${ node.stats.cache } (`,
                            CortexDOM.createElement( "u", {}, `+$${ nfmt( node.costs.cacheUpgradeCost, "0.00a" ) }` ),
                            ")"
                        )
                    ) )
                )
            ) );
            win.refresh();
        }, 1000 );
    } );
    return a.finalize();
}

export { HacknetApp as init };