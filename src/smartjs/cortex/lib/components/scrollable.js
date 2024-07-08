export function Scrollable () {
    const proxy = {};

    let sw, setSw = () => {};

    const trigger = () => setSw( !sw );

    let scrollTop = 0;

    Object.assign( proxy, {
        element: props => {
            [ sw, setSw ] = React.useState(false);

            return React.createElement( "div",
                {
                    class: props.class || "smartjs-scrollable",
                    style: {
                        ...props.style
                    }
                },
                props.children
            );
        },
        scrollToTop: () => {},
        scrollToBottom: () => {},
        stick: () => {},
        stickToTop: () => {},
        stickToBottom: () => {}
    } );

    return Object.freeze( proxy );
}