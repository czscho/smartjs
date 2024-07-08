import { TabWrapper } from "/smartjs/lib/ui/tabwrapper";

function CorporationTab ( registrar ) {
    const w = TabWrapper( registrar, "Corporation" );

    w.title("CORPORATION");
    w.activationKey("CORPORATION");
    w.content( props => {
        return React.createElement( "div", {} );
    } );
    return w.finalize();
}

export { CorporationTab as init };