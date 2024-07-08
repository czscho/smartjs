export function Resizable ( { width = null, height = null, minWidth = 0, maxWidth = null, minHeight = 0, maxHeight = null } = {} ) {
    const proxy = {};

    let sw, setSw = () => {};

    const trigger = () => setSw( !sw );

    const containerRef = React.createRef();

    let isResizing = false;
    let size = {
        width,
        height
    };

    let onResizeEnd = () => {};

    Object.assign( proxy, {
        element: props => {
            [ sw, setSw ] = React.useState(false);

            return React.createElement( "div",
                {
                    ref: containerRef,
                    className: props.className,
                    style: {
                        overflow: "hidden",
                        resize: "both",
                        width: size.width || "fit-content",
                        height: size.height || "fit-content",
                        minWidth: minWidth || "inherit",
                        minHeight: minHeight || "inherit",
                        maxWidth: maxWidth || "inherit",
                        maxHeight: maxHeight || "inherit",
                        ...props.style
                    }
                },
                props.children
            );
        },
        onResizeEnd: cb => onResizeEnd = cb,
        resizing: () => isResizing
    } );

    return Object.freeze( proxy );
}