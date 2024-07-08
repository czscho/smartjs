export function Collapsible () {
    const proxy = {};

    let sw, setSw;

    const trigger = () => setSw( !sw );

    let collapsed = false;

    Object.assign( proxy, {
        element: props => {
            [ sw, setSw ] = React.useState( false );

            return React.createElement(
                "div",
                {
                    style: {
                        ...( props.style || {} ),
                        display: collapsed ? "none" : ( props.style && props.style.display ? props.style.display : "inherit" )
                    }
                },
                props.children
            );
        },
        collapsed: () => collapsed,
        setCollapsed: b => {
            collapsed = b;
            trigger();
        },
        toggle: () => {
            collapsed = !collapsed;
            trigger();
        }
    } );

    return Object.freeze( proxy );
}