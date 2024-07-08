import { doc, Util } from "/smartjs/lib/common";
import { SmartService } from "/smartjs/lib/netscript/smartservice";
import { StatusCode, StatusCodeMessages } from "/smartjs/lib/enums";
import { CortexDrawerButton } from "/smartjs/cortex/lib/components/desktop/drawerbutton";
import { CortexDesktop } from "/smartjs/cortex/lib/components/desktop/desktop";
import { initStyle } from "/smartjs/cortex/style";

const sleep = Util.sleep;

function rm ( selector ) {
    let existing = doc.querySelector( selector );
    if ( existing ) existing.remove();
}

export async function main ( ns ) {
    const service = await SmartService( ns, 4, "Cortex", "cortex" );
    const dbridge = service.registrar()("DaemonLinkage");
    const inner = service.registrar()("Internal");

    await dbridge.linkByPort(3);

    service.status( () => ( {
		code: StatusCode.OK,
		message: StatusCodeMessages.byKeys()[ StatusCode.OK ]
	} ) );

    ns.run("/smartjs/cortex/bin/renderer.js");

    const drawer = doc.querySelector(".MuiList-root.MuiList-padding.css-1ontqvh");
    const bbRoot = doc.querySelector(".MuiBox-root.css-1ik4laa");
    const bbContentContainer = doc.querySelector(".MuiBox-root.css-1mojy8p-root");
    const bbOverview = doc.querySelector(".MuiPaper-root.MuiPaper-elevation.MuiPaper-elevation1.react-draggable.react-draggable-dragged.css-1m2n216-overviewContainer");
    const desktopContainer = doc.createElement("div");
    desktopContainer.id = "cortex-desktop-container";
    desktopContainer.className = "MuiBox-root css-0";
    desktopContainer.style = "flex-grow: 1;min-height: 100vh;display: none;";
    let show = false;
    let tmp1, tmp2;

    service.subscribe( "DrawerButton.Fire", () => {
        if ( show ) {
            bbContentContainer.style.display = tmp1;
            bbOverview.style.display = tmp2;
            desktopContainer.style.display = "none";
        } else {
            tmp1 = bbContentContainer.style.display;
            bbContentContainer.style.display = "none";
            tmp2 = bbOverview.style.display;
            bbOverview.style.display = "none";
            desktopContainer.style.display = "inherit";
        }

        show = !show;
    } );

    rm("#cortex-drawer-container");
    rm("#cortex-desktop-container");
    initStyle();
    let drawerContainer = doc.createElement("div");
    drawerContainer.id = "cortex-drawer-container";
    drawer.prepend( drawerContainer );
    bbRoot.appendChild( desktopContainer );
    ReactDOM.render( React.createElement( CortexDrawerButton( inner.registrar("DrawerButton")() ).element ), drawerContainer );
    ReactDOM.render( React.createElement( CortexDesktop( inner.registrar("Desktop")(), ns ).element ), desktopContainer );

    service.subscribe( "CortexDesktop.LaunchApp", ( _, args ) => {
        ns.exec( "/smartjs/cortex/bin/launch-app.js", ns.getHostname(), 1, args.path, ...args.args );
    } );
    
    let cont = true;
    
    while ( cont ) {
        service.update();
        await sleep(10);
    }

    rm("#cortex-drawer-container");
    rm("#cortex-desktop-container");
    await service.shutdown();
}