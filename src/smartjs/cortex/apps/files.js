import { App } from "/smartjs/cortex/lib/app";
import { deepscan } from "/smartjs/lib/netscript/deepscan";

async function FilesApp ( ns ) {
    const a = await App( ns, "Files" );
    a.init( async () => {
        await a.bus().linkByPort(4);
        const win = await a.createWindow( "Files", { renderOnClient: true } );
        let servers = deepscan( ns );
        let server = ns.getHostname();
        let path = "";
        win.content( () => React.createElement( "div", {},
                React.createElement( "div", {
                        style: {
                            display: "flex"
                        }
                    },
                    React.createElement( "div", {
                            style: {
                                display: "inline-block",
                                flex: 1,
                                background: "green",
                                color: "black",
                                padding: "3px",
                                borderRadius: "3px"
                            }
                        },
                        React.createElement( "div", {
                                style: {
                                    display: "inline"
                                },
                                onClick: () => {
                                    path = "";
                                    win.refresh();
                                }
                            },
                            `${server}:`
                        ),
                        path.split("/").map( ( dir, idx, arr ) => React.createElement( "div", {
                                style: {
                                    display: "inline",
                                },
                                onClick: () => {
                                    path = arr.slice( 0, idx + 1 ).join("/");
                                    win.refresh();
                                }
                            },
                            dir ? `${dir}/` : ""
                        ) )
                    )
                ),
                React.createElement( "div", {
                        style: {
                            display: "flex"
                        }
                    },
                    React.createElement( "div", {
                            style: {
                                display: "inline-block",
                                maxHeight: "512px",
                                minWidth: "fit-content",
                                flex: 1,
                                overflow: "scroll"
                            }
                        },
                        React.createElement( "ul", {},
                            servers.map( s => React.createElement( "li", {
                                    onClick: () => {
                                        server = s;
                                        path = "";
                                        win.refresh();
                                    }
                                },
                                s
                            ) )
                        )
                    ),
                    React.createElement( "div", {
                            style: {
                                display: "inline-block",
                                maxHeight: "512px",
                                minWidth: "fit-content",
                                flex: 1,
                                overflow: "scroll"
                            }
                        },
                        React.createElement( "ul", {
                                style: {
                                    listStyle: "none"
                                }
                            },
                            ( () => {
                                let stack = ns.ls( server, path );
                                let cache = {};
                                let items = [];
        
                                while ( stack.length > 0 ) {
                                    let file = stack.shift().slice( path ? path.length + 1 : 0 );
                                    let name = file;
                                    let idx = name.indexOf("/");
        
                                    if ( idx > 0 ) {
                                        name = name.slice( 0, idx );
                                        if ( cache[ name ] ) continue;
                                        cache[ name ] = true;
                                        items.push( React.createElement( "li", {
                                                onClick: () => {
                                                    path = path ? `${path}/${name}` : `${name}`;
                                                    win.refresh();
                                                }
                                            },
                                            name
                                        ) );
                                        continue;
                                    }
        
                                    items.push( React.createElement( "li", {
                                            onClick: /.*\.(js)|(txt)|(script)|(ns)^/.test( file ) && ( () => a.bus().post( "CortexDesktop.LaunchApp", { path: "/smartjs/cortex/apps/editor", args: [ server, path ? `${path}/${file}` : file ] } ) ) || null
                                        },
                                        name
                                    ) );
                                }
        
                                return items;
                            } )()
                        )
                    )
                )
            )
        );
    } );
    return a.finalize();
}

export { FilesApp as init };