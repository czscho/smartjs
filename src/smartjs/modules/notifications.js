import * as SJS from "/smartjs/lib/common";

function NotificationsModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Notifications" );

    m.init( () => {} );

    m.update( () => {} );
    
    return m.finalize();
}

export { NotificationsModule as init };