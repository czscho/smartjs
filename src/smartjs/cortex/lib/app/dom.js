export const CortexDOM = {
    createScrollable: ( props, ...children ) => ( { type: "scrollable", props, children } ),
    createElement: ( name, props, ...children ) => ( { type: "raw", name, props, children } )
};