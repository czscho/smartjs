import { TabWrapper } from "/smartjs/lib/ui/tabwrapper";

function TasksTab ( registrar ) {
    const w = TabWrapper( registrar, "Tasks" );

    w.title("TASKS");
    w.activationKey("TASKS");
    w.content( props => {
        return React.createElement( "div", {} );
    } );
    return w.finalize();
}

export { TasksTab as init };