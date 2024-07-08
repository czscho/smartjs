import { App } from "/smartjs/cortex/lib/app";
import { CortexDOM } from "/smartjs/cortex/lib/app/dom";

async function ServicesApp ( ns ) {
    const a = await App( ns, "Services" );
    a.init( async () => {
        await a.bus().linkByPort(3);
        const win = await a.createWindow("Services");
        a.bus().loop( async () => {
            let s = await a.bus().arequest( "Daemon.ServiceList", null, ( _, r ) => r );
            if ( !s ) return;
            win.content( CortexDOM.createElement( "div", {
                    style: {
                        maxHeight: "512px",
                        overflow: "scroll"
                    }
                },
                CortexDOM.createElement( "div",
                    {
                        style: {
                            padding: "6px 0 0 0"
                        }
                    },
                    CortexDOM.createElement( "b", {}, "services" )
                ),
                CortexDOM.createElement( "ul", {},
                    ...Object.keys( s.services ).map( key => CortexDOM.createElement( "li",
                        {
                            style: {
                                padding: "4px"
                            }
                        },
                        `${ s.services[ key ].name }`,
                        CortexDOM.createElement("br"),
                        `\u00a0\u00a0uuid  ${key}`,
                        CortexDOM.createElement("br"),
                        `\u00a0\u00a0status  ${ s.services[ key ].status.message }`,
                        CortexDOM.createElement("br")
                    ) )
                ),
                CortexDOM.createElement( "div",
                    {
                        style: {
                            padding: "6px 0 0 0"
                        }
                    },
                    CortexDOM.createElement( "b", {}, "inactive" )
                ),
                CortexDOM.createElement( "ul", {},
                    ...Object.keys( s.inactive ).map( key => CortexDOM.createElement( "li",
                        {
                            style: {
                                padding: "4px"
                            }
                        },
                        `${ s.inactive[ key ].name }`,
                        CortexDOM.createElement("br"),
                        `\u00a0\u00a0service uuid ${key}`,
                        CortexDOM.createElement("br")
                    ) )
                )
            ) );
            win.refresh();
        }, 2000 );
    } );
    return a.finalize();
}

export { ServicesApp as init };