import { TabWrapper } from "/smartjs/lib/ui/tabwrapper";

export function BladeburnerTab ( registrar ) {
    const w = TabWrapper( registrar, "Bladeburner" );

    w.title("BLADEBURNER");
    w.activationKey("BLADEBURNER");
    w.content( props => {
        return React.createElement( "div", {} );
    } );
    return w.finalize();
}

export { BladeburnerTab as init };