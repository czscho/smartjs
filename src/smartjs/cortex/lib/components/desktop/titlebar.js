import { Proxy } from "/smartjs/lib/proxy";
import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";
import { Button } from "/smartjs/cortex/lib/components/button";

export function Titlebar () {
    const p = Proxy();
    const w = ReactWrapper();
    const minimize = Button();
    minimize.content( () => React.createElement( "svg", { style: { padding: 0, margin: "0 2px 0 2px", /*backgroundColor: "black", borderRadius: "33px"*/ }, height: 24, width: 24, viewBox: "0 0 24 24", dangerouslySetInnerHTML: { __html: `<path fill="khaki" fill-rule="evenodd" clip-rule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM17 11H7V13H17V11Z"></path>` } } ) );
    const close = Button();
    close.content( () => React.createElement( "svg", { style: { padding: 0, margin: "0 2px 0 2px", /*backgroundColor: "black", borderRadius: "33px"*/ }, height: 24, width: 24, viewBox: "0 0 24 24", dangerouslySetInnerHTML: { __html: `<path fill="darkred" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM8.29289 8.29289C8.68342 7.90237 9.31658 7.90237 9.70711 8.29289L12 10.5858L14.2929 8.29289C14.6834 7.90237 15.3166 7.90237 15.7071 8.29289C16.0976 8.68342 16.0976 9.31658 15.7071 9.70711L13.4142 12L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L12 13.4142L9.70711 15.7071C9.31658 16.0976 8.68342 16.0976 8.29289 15.7071C7.90237 15.3166 7.90237 14.6834 8.29289 14.2929L10.5858 12L8.29289 9.70711C7.90237 9.31658 7.90237 8.68342 8.29289 8.29289Z"></path>` } } ) );
    let _onMinimize = [];
    let _onClose = [];
    minimize.action( () => _onMinimize.forEach( fn => fn() ) );
    close.action( () => _onClose.forEach( fn => fn() ) );
    let title = "New window";
    w.content( props => {
        return React.createElement( "div", {
                class: "cortex-titlebar-root",
                style: props.style,
                onMouseDown: props.onMouseDown
            },
            React.createElement( "div", {
                    style: {
                        display: "flex",
                        width: "100%",
                        userSelect: "none"
                    }
                },
                React.createElement( "div", {
                        style: {
                            flex: 1,
                            display: "inline-flex",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "ellipsis"
                        }
                    },
                    React.createElement( "div", { style: { flex: 1 } }, title )
                ),
                React.createElement( minimize.element ),
                React.createElement( close.element )
            )
        );
    } );
    return p.final( {
        ...w.finalize(),
        onMinimize: fn => _onMinimize.push( fn ),
        onClose: fn => _onClose.push( fn ),
        title: t => title = t
    } );
}