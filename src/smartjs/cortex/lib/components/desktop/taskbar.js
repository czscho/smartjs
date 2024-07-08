import { ReactWrapper } from "/smartjs/cortex/lib/reactwrapper";
import { CONF } from "/smartjs/cortex/conf/appmenu";

function _launchApp ( bus, ns, label, executable ) {
    ns.exec( "/smartjs/cortex/bin/launch-app.js", ns.getHostname(), 1, executable );
}

function _mkAppLauncher ( bus, ns, onLaunch, label, executable ) {
    return React.createElement( "div", {
            class: "cortex-button-base",
            style: {
                display: "flex",
                padding: "4px"
            },
            onClick: () => {
                _launchApp( bus, ns, label, executable );
                onLaunch();
            }
        },
        React.createElement( "div", {
                style: {
                    padding: "4px",
                    display: "inline-block"
                }
            },
            React.createElement( "svg", {
                width: 22,
                height: 22,
                fill: "#ffffff",
                viewBox: "0 0 32 32",
                dangerouslySetInnerHTML: { __html: `<path d="M31,0H1A1,1,0,0,0,0,1V7.67a1,1,0,0,0,1,1H31a1,1,0,0,0,1-1V1A1,1,0,0,0,31,0ZM28.67,3.67H30V5H28.67ZM2,2H26.93a1,1,0,0,0-.26.67V6a1,1,0,0,0,.26.67H2Z"></path> <path d="M31,11.67H1a1,1,0,0,0-1,1v6.66a1,1,0,0,0,1,1H31a1,1,0,0,0,1-1V12.67A1,1,0,0,0,31,11.67ZM18.67,15.33H30v1.34H18.67ZM2,13.67H16.93a1,1,0,0,0-.26.66v3.34a1,1,0,0,0,.26.66H2Z"></path> <path d="M31,23.33H1a1,1,0,0,0-1,1V31a1,1,0,0,0,1,1H31a1,1,0,0,0,1-1V24.33A1,1,0,0,0,31,23.33ZM28.67,27H30v1.33H28.67ZM2,25.33H26.93a1,1,0,0,0-.26.67v3.33a1,1,0,0,0,.26.67H2Z"></path>` }
            } )
        ),
        React.createElement( "div", {
                style: {
                    flex: 1,
                    margin: "0 0 0 6px",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "1.1rem",
                    fontWeight: 400
                }
            },
            React.createElement( "div", { style: { flex: 1 } }, label )
        )
    );
}

function CortexAppMenu ( bus, ns ) {
    const w = ReactWrapper();
    let state = false;
    w.content( () => {
        return React.createElement( "div", {},
            React.createElement( "p", {
                    class: "cortex-button-base",
                    style: {
                        display: "inline-block",
                        padding: 0,
                        margin: 0
                    },
                    onClick: () => {
                        state = !state;
                        w.trigger();
                    }
                },
                React.createElement( "svg", {
                    width: 36,
                    height: 36,
                    fill: "#ffffff",
                    viewBox: "0 0 512 512",
                    dangerouslySetInnerHTML: { __html: `<rect x="48" y="48" width="112" height="112" rx="8" ry="8"></rect><rect x="200" y="48" width="112" height="112" rx="8" ry="8"></rect><rect x="352" y="48" width="112" height="112" rx="8" ry="8"></rect><rect x="48" y="200" width="112" height="112" rx="8" ry="8"></rect><rect x="200" y="200" width="112" height="112" rx="8" ry="8"></rect><rect x="352" y="200" width="112" height="112" rx="8" ry="8"></rect><rect x="48" y="352" width="112" height="112" rx="8" ry="8"></rect><rect x="200" y="352" width="112" height="112" rx="8" ry="8"></rect><rect x="352" y="352" width="112" height="112" rx="8" ry="8"></rect>` }
                } )
            ),
            React.createElement( "div", {
                    style: {
                        minWidth: 512,
                        minHeight: 512,
                        padding: 12,
                        display: state ? "block" : "none",
                        position: "absolute",
                        left: 0,
                        bottom: 48,
                        backgroundColor: "black",
                        borderRadius: "5px",
                        color: "white"
                    }
                },
                React.createElement( "div", {}, "Applications" ),
                React.createElement( "div", {
                        style: {
                            overflow: "scroll",
                            margin: "12px 0 0 0"
                        }
                    },
                    CONF.apps.map( info => _mkAppLauncher( bus, ns, () => { state = !state; w.trigger(); }, info.label, `${info.executable}.js` ) )
                )
            )
        )
    } );
    return w.finalize();
}

function CortexAppLauncher () {
    const w = ReactWrapper();
    w.content( () => {
        return React.createElement( "div", {} );
    } );
    return w.finalize();
}

export function CortexTaskbar ( bus, ns ) {
    const w = ReactWrapper();
    const menu = CortexAppMenu( bus, ns );
    const launcher = CortexAppLauncher();
    w.content( () => {
        return React.createElement( "div", {
                style: {
                    zIndex: 1000,
                    position: "absolute",
                    left: 8,
                    bottom: 8,
                    height: 44,
                    minWidth: "calc(100% - 16px)",
                    backgroundColor: "black",
                    borderRadius: "5px"
                }
            },
            React.createElement( "div", {
                    style: {
                        padding: 4
                    }
                },
                React.createElement( menu.element )
            )
        );
    } );
    return w.finalize();
}