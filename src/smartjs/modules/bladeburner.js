import * as SJS from "/smartjs/lib/common";

function BladeburnerModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Bladeburner" );

    let tabActivated = false;

    m.init( () => {
        m.request( "SmartUI.TabActivation", "BLADEBURNER", ( _, b ) => tabActivated = b );
    } );

    m.update( ctx => {} );

    return m.finalize();
}

export { BladeburnerModule as init };