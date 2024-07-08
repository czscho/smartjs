import { doc } from "/smartjs/lib/common";

export function Draggable ( posLeft, posRight ) {
    const proxy = {};
    const containerRef = React.createRef();

    let sw, setSw;

    const trigger = () => setSw( !sw );

    let isDragging = false;
    let pos = {
        left: posLeft || 0,
        right: posRight || 0
    };

    let onDragEnd = () => {};

    Object.assign( proxy, {
        element: props => {
            [ sw, setSw ] = React.useState( false );

            return React.createElement( "div",
                {
                    ref: containerRef,
                    class: props.class,
                    style: {
                        position: "fixed",
                        left: pos.left,
                        top: pos.top,
                        ...props.style
                    },
                    onMouseDown: props.onMouseDown,
                    onClick: props.onClick
                },
                props.children
            );
        },
        onDragEnd: cb => onDragEnd = cb,
        dragging: () => isDragging,
        beginDrag: e => {
            let abortController = new AbortController();
            let targetRect = e.target.getBoundingClientRect();
            
            isDragging = true;

            let off = {
                left: e.clientX - targetRect.x,
                top: e.clientY - targetRect.y
            };

            doc.addEventListener( "mousemove", e2 => {
                let x = e2.clientX - off.left;
                let y = e2.clientY - off.top;
                let rect = containerRef.current.getBoundingClientRect();

                pos.left = ( x > 0 ) ? ( ( x + rect.width < innerWidth ) ? x : innerWidth - rect.width ) : 0;
                pos.top = ( y > 0 ) ? ( ( y + rect.height < innerHeight ) ? y : innerHeight - rect.height ) : 0;
                trigger();
            }, { signal: abortController.signal } );
            doc.addEventListener( "mouseup", () => {
                isDragging = false;
                onDragEnd();
                abortController.abort();
            }, { signal: abortController.signal } );
            trigger();
        }
    } );

    return Object.freeze( proxy );
}