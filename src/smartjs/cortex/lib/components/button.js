import { Proxy } from "/smartjs/lib/proxy";
import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";

export function Button () {
    const p = Proxy();
    const w = ReactWrapper();
    let content = null;
    let action = () => {};
    w.content( () => {
        return React.createElement( "div", {
                class: "cortex-button-base",
                onClick: e => action(e)
            },
            content()
        );
    } );
    return p.final( {
        ...w.finalize(),
        content: c => content = c,
        action: fn => action = fn
    } );
}