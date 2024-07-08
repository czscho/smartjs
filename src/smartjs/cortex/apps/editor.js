import { App } from "/smartjs/cortex/lib/app";

async function EditorApp ( ns, args ) {
    const a = await App( ns, "Editor" );
    a.init( async () => {
        let win;

        if ( !ns.fileExists( args[1], args[0] ) ) {
            win = await a.createWindow( "Error!", { renderOnClient: true } );
            win.content( () => React.createElement( "div", {}, `The file ${args[0]}:${args[1]} does not exist` ) );
            return;
        }
        
        win = await a.createWindow( `Editor - ${args[0]}:${args[1]}`, { renderOnClient: true } );
        win.content( () => React.createElement( "div", {
                style: {
                    display: "flex",
                    flexFlow: "column",
                    height: "800px",
                    width: "512px"
                }
            },
            React.createElement( "div", {
                    style: {
                        width: "100%",
                        display: "block",
                        backgroundColor: "green",
                        borderRadius: "3px",
                        marginBottom: "4px",
                        padding: "2px",
                        color: "black"
                    }
                },
                `${args[0]}:${args[1]}`
            ),
            React.createElement( "div", {
                    style: {
                        flex: 1,
                        display: "flex"
                    }
                },
                React.createElement( "textarea", {
                    spellcheck: "false",
                    style: {
                        flex: 1,
                        height: "100%",
                        color: "inherit",
                        font: "inherit",
                        background: "inherit",
                        border: "inherit",
                        padding: "2px",
                        overflow: "scroll",
                        whiteSpace: "nowrap",
                    }
                },
                ns.read( args[1], args[0] )
            )
            )
        ) );
    } );
    return a.finalize();
}

export { EditorApp as init };