import * as SJS from "/smartjs/lib/common";

function StanekModule ( registrar, nse ) {
    const m = SJS.Modules.Module( registrar, "Stanek" );

    m.init( () => {} );

    m.update( ctx => {} );

    return m.finalize();
}

export { StanekModule as init };