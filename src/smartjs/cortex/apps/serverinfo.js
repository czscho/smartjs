import { App } from "/smartjs/cortex/lib/app";
import { Tabs } from "/smartjs/cortex/lib/components/tabs";
import { Util } from "/smartjs/lib/common";

const nfmt = Util.Format.nfmt;

async function ServerInfoApp ( ns ) {
    const a = await App( ns, "ServerInfo" );
    a.init( async () => {
        const info = {
            purchased: {
                serverCost: 0,
                servers: []
            }
        };
        await a.bus().linkByPort(3);
        const win = await a.createWindow( "Server Information", { renderOnClient: true } );
        const tabs = Tabs();
        const purchasedTab = React.createElement( () => {
            return React.createElement( "div", {},
                React.createElement( "div",
                    {
                        style: {
                            padding: "0 0 6px 0"
                        }
                    },
                    React.createElement( "b", {}, "Server cost: " ),
                    `$${ nfmt( info.purchased.serverCost, "0.00a" ) } (${ nfmt( info.purchased.startingRam * 1_000_000_000, "0.00b" ) })`
                ),
                React.createElement( "div",
                    {
                        style: {
                            padding: "0 0 6px 0"
                        }
                    },
                    React.createElement( "b", {}, "Total used RAM: " ),
                    `${ nfmt( info.purchased.servers.reduce( ( prev, cur ) => prev + cur.usedRam, 0 ) * 1_000_000_000, "0.00b" ) } / ${ nfmt( info.purchased.servers.reduce( ( prev, cur ) => prev + cur.maxRam, 0 ) * 1_000_000_000, "0.00b" ) }`
                ),
                React.createElement( "table",
                    {
                        className: "cortex-infotable",
                        style: {
                            width: "100%",
                            textAlign: "left"
                        }
                    },
                    React.createElement( "tr",
                        {
                            style: {
                                textAlign: "center"
                            }
                        },
                        React.createElement( "th", {}, "NAME" ),
                        React.createElement( "th", {}, "USED RAM" ),
                        React.createElement( "th", {}, "UPGRADE COST" )
                    ),
                    React.createElement( "tr", {
                        style: {
                            height: "8px"
                        }
                    } ),
                    ...info.purchased.servers.map( server => React.createElement( "tr", {},
                        React.createElement( "td", {}, server.hostname ),
                        React.createElement( "td", {}, `${ nfmt( server.usedRam * 1_000_000_000, "0.00b" ) } / ${ nfmt( server.maxRam * 1_000_000_000, "0.00b" ) }` ),
                        React.createElement( "td", {}, `$${ nfmt( server.upgradeCost, "0.00a" ) }` )
                    ) )
                )
            )
        } );
        tabs.addTab( "Purchased", purchasedTab );
        win.content( () => React.createElement( tabs.element ) );
        a.bus().loop( async () => {
            let s = await a.rpc("PurchasedServers.GetState");
            if ( !s ) return;
            Object.keys( s ).forEach( key => info.purchased[ key ] = s[ key ] );
            win.refresh();
        }, 1000 );
    } );
    return a.finalize();
}

export { ServerInfoApp as init };