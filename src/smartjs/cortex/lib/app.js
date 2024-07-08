import { Proxy } from "/smartjs/lib/proxy";
import { SmartService } from "/smartjs/lib/netscript/smartservice";
import { Window } from "/smartjs/cortex/lib/components/desktop/window";
import { StatusCode, StatusCodeMessages } from "/smartjs/lib/enums";

const doc = eval("document");

function _serverWindow ( service, uuid ) {
    let _onClose = [];
    service.subscribe( "CortexRenderer.WindowClose", ( _, u ) => {
        if ( u == uuid ) {
            _onClose.forEach( fn => fn() );
        }
    } );
    return Proxy().final( {
        onClose: fn => _onClose.push( fn ),
        title: title => service.arequest( "CortexRenderer.SetWindowTitle", { uuid, title }, ( _, r ) => r ),
        content: ( content, element ) => service.post( "CortexRenderer.UpdateWindow", { uuid, content, element }, ( _, r ) => r ),
        refresh: () => service.post( "CortexRenderer.RefreshWindow", uuid ),
        focus: () => service.arequest( "CortexRenderer.FocusWindow", uuid, ( _, r ) => r ),
        destroy: () => service.arequest( "CortexRenderer.DestroyWindow", uuid, ( _, r ) => r )
    } );
}

function _clientWindow ( service, uuid ) {
    const p = Proxy();
    let container = doc.getElementById( uuid );
    let win = Window();
    win.onClose( () => p.this.destroy() );
    ReactDOM.render( React.createElement( win.element ), container );
    return p.final( {
        onClose: fn => win.onClose( fn ),
        title: title => win.title( title ),
        content: fn => win.content( fn ),
        refresh: () => win.refresh(),
        focus: () => service.arequest( "CortexRenderer.FocusWindow", uuid, ( _, r ) => r ),
        destroy: () => {
            ReactDOM.unmountComponentAtNode( container );
            service.arequest( "CortexRenderer.DestroyWindow", uuid, ( _, r ) => r );
        }
    } );
}

export async function App ( ns, name ) {
    const service = await SmartService( ns, 0, `CortexApp-${name}`, `cortex-app-${name}` );
    const windows = {};
    let windowKeys = [];
    let destroyQ = [];
    let _doInit = () => {};
    let _onQuit = [];
    await service.linkByPort(5);
    function _quit () {
        Promise.all( windowKeys.map( async key => {
            await windows[ key ].destroy();
            delete windows[ key ];
        } ) ).then( () => _onQuit.forEach( fn => fn() ) );
    }
    service.status( () => ( {
        code: StatusCode.OK,
        message: StatusCodeMessages.byKeys()[ StatusCode.OK ]
    } ) );
    service.respond( `CortexApp-${name}.Quit`, () => _quit() );
    return Proxy().final( {
        finalize: () => Proxy().final( {
            onQuit: fn => _onQuit.push( fn ),
            init: () => service.enqueue( () => _doInit() ),
            update: () => {
                while ( destroyQ.length > 0 ) {
                    let uuid = destroyQ.shift();
                    windowKeys = windowKeys.filter( key => key != uuid );
                    delete windows[ uuid ];
                    if ( windowKeys.length == 0 ) {
                        _quit();
                    }
                }

                service.update();
            },
            shutdown: () => service.shutdown()
        } ),
        bus: () => service,
        onQuit: fn => _onQuit.push( fn ),
        createWindow: async ( title, { renderOnClient = false } = {} ) => {
            let uuid = await service.arequest( "CortexRenderer.CreateWindow", { title, contentRenderer: renderOnClient ? "client" : "server" }, ( _, r ) => r.data );
            let win = windows[ uuid ] = renderOnClient ? _clientWindow( service, uuid ) : _serverWindow( service, uuid );
            title && win.title( title );
            win.onClose( () => destroyQ.push( uuid ) );
            windowKeys.push( uuid );
            return win;
        },
        rpc: ( name, args ) => service.arequest( "Daemon.RPC", { name, args }, ( _, r ) => r.data ),
        init: fn => _doInit = fn
    } );
}