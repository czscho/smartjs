import { Proxy } from "/smartjs/lib/proxy";
import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";
import { Draggable } from "/smartjs/cortex/lib/components/draggable";
import { Titlebar } from "/smartjs/cortex/lib/components/desktop/titlebar";

export function Window () {
    const p = Proxy();
    const w = ReactWrapper();
    const draggable = Draggable();
    draggable.onDragEnd( () => w.trigger() );
    const titlebar = Titlebar();
    let content = null;
    let state = true;
    let focused = false;
    let _onEnterFocus = () => {};
    titlebar.onMinimize( () => state = false );
    w.content( () => {
        React.useEffect( () => {
            focused = true;
            _onEnterFocus();
            w.trigger();
        }, [] );
        return React.createElement( draggable.element, {
                class: "cortex-window-root" + ( focused ? " cortex-window-focused" : "" ),
                style: {
                    display: state ? undefined : "none"
                },
                onMouseDown: () => {
                    if ( !focused ) {
                        focused = true;
                        _onEnterFocus();
                        w.trigger();
                    }
                }
            },
            React.createElement( titlebar.element, {
                style: {
                    cursor: draggable.dragging() ? "grabbing" : "grab"
                },
                onMouseDown: e => {
                    draggable.beginDrag(e);
                    w.trigger();
                }
            } ),
            React.createElement( "div", {
                    class: "cortex-window-content-root"
                },
                content && content()
            )
        );
    } );
    return p.final( {
        ...w.finalize(),
        content: c => {
            content = c;
            w.trigger();
        },
        refresh: () => w.trigger(),
        title: t => titlebar.title(t),
        focused: () => focused,
        unfocus: () => { focused = false; w.trigger() },
        focus: () => { focused = true; w.trigger() },
        onEnterFocus: fn => _onEnterFocus = fn,
        onMinimize: fn => titlebar.onMinimize( fn ),
        onClose: fn => titlebar.onClose( fn )
    } );
}