import { Proxy } from "/smartjs/lib/proxy";

export function ReactWrapper () {
    const p = Proxy();
    let sw, setSw = () => {};
    let content = () => React.createElement("div");

    return p.final( {
        finalize: () => Object.freeze( {
            element: props => {
                [ sw, setSw ] = React.useState(false);

                return content( props );
            }
        } ),
        content: fn => content = fn,
        trigger: () => setSw( !sw )
    } );
}