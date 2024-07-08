import * as SJS from "/smartjs/lib/common";

function CorporationModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Corporation" );

    m.init( () => {} );

    m.update( ctx => {} );

    return m.finalize();
}

export { CorporationModule as init };