import { SmartService } from "/smartjs/lib/netscript/smartservice";
import { StatusCode, StatusCodeMessages } from "/smartjs/lib/enums";
import { Window } from "/smartjs/cortex/lib/components/desktop/window";
import { doc, Util } from "/smartjs/lib/common";
import { Scrollable } from "/smartjs/cortex/lib/components/scrollable";

const sleep = Util.sleep;
const generateUUID = Util.generateUUID;

function _parse ( data, children ) {
    children = children.sort( ( a, b ) => a[0] - b[0] ).map( c => c[1] );

    if ( data.type == "scrollable" ) {
        return React.createElement( "div", { class: "smartjs-scrollable", ...data.props }, children );
    } else if ( data.type == "raw" ) {
        return React.createElement( data.name, data.props, children.length && children || null );
    }
}

function _parseDOM ( data ) {
    let stack = [];
    let cache = {};

    cache["root"] = { data, results: [] };
    
    for ( let i = 0; i < data.children.length; i++ ) {
        let child = data.children[i];
        stack.push( { op: "parse", parent: "root", current: child, index: i } );
    }

    while ( stack.length > 0 ) {
        let tk = stack.shift();

        if ( tk.op == "parse" ) {
            let uuid = generateUUID();
            let c = cache[ uuid ] = { data: tk.current, index: tk.index, parent: tk.parent, results: [] };

            if ( typeof c.data == "string" ) {
                cache[ c.parent ].results.push( [ tk.index, c.data ] );

                if ( cache[ c.parent ].results.length == cache[ c.parent ].data.children.length ) {
                    stack.push( { op: "finalize", key: c.parent } );
                }
            } else if ( c.data.children && c.data.children.length > 0 ) {
                for ( let i = 0; i < c.data.children.length; i++ ) {
                    let child = c.data.children[i];
                    stack.push( { op: "parse", parent: uuid, current: child, index: i } );
                }

                continue;
            } else {
                stack.push( { op: "finalize", key: uuid } );
            }
        } else if ( tk.op == "finalize" ) {
            let parentKey = cache[ tk.key ].parent;
            let parent = parentKey && cache[ parentKey ];
            let data = cache[ tk.key ].data;
            let results = cache[ tk.key ].results;
            
            if ( parent ) {
                parent.results.push( [ cache[ tk.key ].index, _parse( data, results ) ] );

                if ( parent.results.length == parent.data.children.length ) {
                    stack.push( { op: "finalize", key: parentKey } );
                }
            }
        }
    }

    return _parse( data, cache["root"].results.length && cache["root"].results || null );
}

export async function main ( ns ) {
    const service = await SmartService( ns, 5, "CortexRenderer", "cortex-renderer" );
    const renderMap = {};
    const desktopContainer = doc.getElementById("cortex-desktop-container");
    const destroyQ = [];

    service.status( () => ( {
        code: StatusCode.OK,
        message: StatusCodeMessages.byKeys()[ StatusCode.OK ]
    } ) );

    service.respond( "CortexRenderer.CreateWindow", ( _, args ) => {
        let uuid = generateUUID();
        let meta = renderMap[ uuid ] = {
            _container: doc.createElement("div"),
            _window: null,
            contentRenderer: args.contentRenderer,
            _destroy: null,
            _destroyed: null
        };
        meta._container.id = uuid;
        desktopContainer.appendChild( meta._container );

        if ( meta.contentRenderer == "server" ) {
            meta._destroyed = new Promise( res => meta._destroy = res );
            meta._window = Window();
            meta._window.onClose( () => destroyQ.push( uuid ) );
            args.title && meta._window.title( args.title );
            ReactDOM.render( React.createElement( meta._window.element ), meta._container );
        }

        return { status: 0, data: uuid, message: "ok" };
    } );

    service.respond( "CortexRenderer.SetWindowTitle", ( _, args ) => {
        //
    } );

    service.subscribe( "CortexRenderer.UpdateWindow", ( _, args ) => {
        let meta = renderMap[ args.uuid ];
        if ( !meta ) return;
        let parsed = _parseDOM( args.content );
        meta._window.content( () => parsed );
        meta._window.refresh();
    } );

    service.subscribe( "CortexRenderer.RefreshWindow", ( _, args ) => {
        //
    } );

    service.respond( "CortexRenderer.DestroyWindow", async ( _, uuid ) => {
        destroyQ.push( uuid );
        await renderMap[ uuid ].destroyed;
        return { status: 0, message: "ok" };
    } );

    let cont = true;

    while ( cont ) {
        while ( destroyQ.length > 0 ) {
            let uuid = destroyQ.shift();
            let meta = renderMap[ uuid ];
            delete renderMap[ uuid ];
            meta._container.remove();
            service.post( "CortexRenderer.WindowClose", uuid );
            meta.contentRenderer == "server" && meta._destroy();
        }

        service.update();
        await sleep(10);
    }

    service.shutdown();
}