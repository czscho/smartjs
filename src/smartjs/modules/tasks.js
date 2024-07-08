import * as SJS from "/smartjs/lib/common";

export function TasksModule ( registrar, nse ) {
    const m = SJS.Modules.Module( registrar, "Tasks" );

    m.expose( "Tasks.Add", ( _, data ) => {} );

    m.expose( "Tasks.Remove", ( _, data ) => {} );

    m.init( () => {
        //
    } );

    m.update( ms => {
        //
    } );
    return m.finalize();
}

export { TasksModule as init };