import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";
import { App } from "/smartjs/cortex/lib/app";
import { Scrollable } from "/smartjs/cortex/lib/components/scrollable";
import { ShellEnvironment } from "/smartjs/lib/shell";
import { Logging, Util } from "/smartjs/lib/common";

function CommandLine () {
    const w = ReactWrapper();
    const proxy = {};

    function preprocess ( command ) {
        switch ( command ) {
            case "clear":
                history = [ "" ];
                index = 0;
                onClear();
                return true;
        }

        return false;
    }

    let inputRef = React.createRef();
    let isPending = false;
    let history = [ "" ];
    let index = 0;

    let onClear = () => {};
    let onSubmit = () => {};

    w.content( () => {
        React.useEffect( () => {
            inputRef.current.value = history[ index ];
            inputRef.current.focus();
        } );

        return React.createElement( "div",
            {
                style: {
                    display: "flex",
                    border: "1px solid green",
                    backgroundColor: "black"
                }
            },
            React.createElement( "div", {
                    style: {
                        display: "flex",
                        flexFlow: "column nowrap",
                        justifyContent: "center",
                        alignContent: "center",
                        fontSize: "0.95em"
                    }
                },
                React.createElement( "div", { style: { display: "inline", height: "fit-content", width: "fit-content", lineHeight: "100%" } }, "\u00a0\u00a0>>\u00a0\u00a0" ),
            ),
            React.createElement( "input", {
                ref: inputRef,
                class: "smartui-selectable",
                spellcheck: "false",
                style: {
                    flex: 1,
                    height: "fit-content",
                    outline: "none",
                    border: "none",
                    margin: "2px",
                    padding: "2px 0 2px 0",
                    backgroundColor: "black",
                    color: "green",
                    lineHeight: "100%",
                    fontWeight: "550",
                    fontSize: "1em"
                },
                onKeyDown: e => {
                    if ( index == 0 ) {
                        history[0] = inputRef.current.value;
                    }

                    if ( e.key == "ArrowUp" ) {
                        if ( index < history.length - 1 ) {
                            index++;
                            w.trigger();
                        }
                    } else if ( e.key == "ArrowDown" ) {
                        if ( index > 0 ) {
                            index--;
                            w.trigger();
                        }
                    }

                    e.stopPropagation();
                },
                onKeyPress: e => {
                    if ( e.key == "Enter" ) {
                        if ( e.target.value ) {
                            history[0] = e.target.value;
                            history.unshift("");
                            index = 0;

                            if ( !preprocess( e.target.value ) ) {
                                isPending = true;
                                onSubmit( e.target.value );
                            }

                            w.trigger();
                        }
                    }

                    e.stopPropagation();
                },
                disabled: isPending
            } )
        );
    } );

    Object.assign( proxy, {
        ...w.finalize(),
        pending: () => isPending,
        onClear: cb => onClear = cb,
        onSubmit: cb => onSubmit = cb,
        complete: () => {
            isPending = false;
            w.trigger();
        }
    } );

    return Object.freeze( proxy );
}

function ShellInstance ( env, bus ) {
    const w = ReactWrapper();
    const proxy = {};
    const commandLine = CommandLine();
    const scrollable = Scrollable();
    
    let records = [];

    async function _submit ( str ) {
        records.push( { type: "command", content: str } );
        w.trigger();
        let arr = await env.process( str );
        arr.forEach( r => {
            records.push( { type: "output", content: ( r.message || ( r.data && JSON.stringify( r.data, null, 2 ) ) ) || "" } );
            records.push( { type: "output", content: `${r.time}ms` } );
        } );
        commandLine.complete();
        w.trigger();
    }

    commandLine.onClear( item => {
        records = [];
        w.trigger();
    } );
    commandLine.onSubmit( async item => _submit( item ) );
    w.content( () => {
        return React.createElement( "div", {},
            React.createElement( scrollable.element,
                {
                    class: "smartjs-scrollable smartjs-select",
                    style: {
                        margin: 0,
                        padding: "4px 4px 4px 4px",
                        maxWidth: "1000px",
                        width: "800px",
                        maxHeight: "500px",
                        height: "350px",
                        userSelect: "text",
                        border: "1px solid green"
                    }
                },
                ...records.map(
                    record => {
                        if ( record.type == "command" ) {
                            return React.createElement( "div", {
                                    style: {
                                        padding: "6px 0 6px 0"
                                    }
                                },
                                `\u00a0>\u00a0${ record.content }`
                            );
                        }

                        record.content = record.content.replaceAll( / /g, "\u00a0" );
                        return React.createElement( "div", {
                                style: {
                                    padding: "6px 0 6px 0"
                                }
                            },
                            record.content.toString().split("\n").map( line => React.createElement( "div", {}, line ) )
                        );
                    }
                ),
            ),
            React.createElement( commandLine.element )
        );
    } );
    Object.assign( proxy, {
        ...w.finalize(),
        submit: str => _submit( str ),
    } );
    return Object.freeze( proxy );
}

async function ShellApp ( ns ) {
    const a = await App( ns, "Shell" );
    const log = Logging.Logger( a.bus() );
    const instances = {};

    function newInstance () {
        let key = Util.generateUUID();
        let short = key.slice( 0, 8 );
        log.info(`creating new shell instance with key ${short}`);
        return instances[ key ] = ShellInstance( ShellEnvironment( short, a.bus().registrar("Environments")( short ), log ), a.bus() );
    }

    let dfault = newInstance();

    a.init( async () => {
        await a.bus().linkByPort(3);
        const win = await a.createWindow( "Shell", { renderOnClient: true } );
        win.content( () => React.createElement( "div",
            {
                margin: "4px",
                padding: "4px"
            },
            React.createElement( dfault.element )
        ) );
        a.bus().enqueue( () => {
            let content;
    
            if ( ns.fileExists("/userscript.js") && ( content = ns.read("/userscript.js") ) ) {
                dfault.submit( content );
            }
        } );
    } );
    return a.finalize();
}

export { ShellApp as init };