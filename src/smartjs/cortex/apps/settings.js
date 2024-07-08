import { TabWrapper } from "/smartjs/lib/ui/tabwrapper";

function SettingsTab ( registrar ) {
    const w = TabWrapper( registrar, "Settings" );

    w.title("SETTINGS");
    w.activationKey("SETTINGS");
    w.content( () => {
        return React.createElement( "div", {} );
    } );
    return w.finalize();
}

export { SettingsTab as init };