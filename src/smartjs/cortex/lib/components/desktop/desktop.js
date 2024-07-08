import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";
import { CortexTaskbar } from "/smartjs/cortex/lib/components/desktop/taskbar";

export function CortexDesktop ( bus, ns ) {
    const w = ReactWrapper();
    const taskbar = CortexTaskbar( bus.registrar("Taskbar")(), ns );
    w.content( () => {
        return React.createElement( "div", {
                className: "cortex-root-base",
                style: {
                    position: "relative",
                    background: "url('https://4kwallpapers.com/images/walls/thumbs_3t/8324.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    minHeight: "100%",
                    minWidth: "100%"
                }
            },
            React.createElement( "div", {
                    style: {
                        minHeight: "100%",
                        minWidth: "100%"
                    }
                },
                React.createElement( taskbar.element )
            )
        );
    } );
    return w.finalize();
}