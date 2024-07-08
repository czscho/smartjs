import { Proxy } from "/smartjs/lib/proxy";
import { generateUUID } from "/smartjs/lib/uuid";
import { sleep } from "/smartjs/lib/sleep";
import { startAsyncLoop } from "/smartjs/lib/asyncloop";

export function EventBus ( globalNamespace, { requestRetries = 3, requestTimeout = 5_000, pollMax = 0, pollWait = 500 } = {} ) {
	const p = Proxy();
	let busUUID = generateUUID();
	let cstack = [];
	let estack = [];
	let events = {};
	let namespaces = {};
	let namespacesByKeys = {};
	let namespaceKeys = [];
	let filters = [];
	let observers = [];
	let requestBuffer = [];
	let requestMap = {};
	let pollBuffer = [];
	let pollMap = {};
	let responseMap = {};
	let state = "up";

	function _addEvent ( name ) {
		if ( events[ name ] === undefined ) {
			events[ name ] = {
				subscriptions: [],
				relays: []
			};
		}
	}

	function _addNamespace ( str, { visibility = "open" } = {} ) {
		//
	}

	function _enqueue ( callback ) {
		cstack.push( callback );
	}

	function _exec ( callback ) {
		return new Promise( res => cstack.push( async () => res( await callback() ) ) );
	}

	function _loop ( callback, ms ) {
		startAsyncLoop( async () => {
			await _exec( callback )
			await sleep( ms );
		}, () => state == "up" );
	}

	function _inject ( name, data, { namespace = globalNamespace, origin = undefined, hops = 0, trace = {}, meta = { type: "post" } } = {} ) {
		if ( hops > 0 && ( origin == busUUID || typeof trace[ busUUID ] != "undefined" ) ) {
			return;
		}

		trace[ busUUID ] = hops++;
		estack.push( {
			name,
			data,
			namespace,
			origin: origin || busUUID,
			hops,
			trace,
			meta
		} );
	}

	function _broadcast ( name, data, { namespace = globalNamespace, meta = { type: "post" } } = {} ) {
		estack.push( {
			name,
			data,
			namespace,
			origin: busUUID,
			hops: 0,
			trace: {},
			meta
		} );
	}

	function _subscribe ( name, callback, { namespace = globalNamespace, once = false } = {} ) {
		_addEvent( name );
		events[ name ].subscriptions.push( {
			namespace,
			callback,
			once
		} );
	}

	function _unsubscribe ( name, { namespace = globalNamespace } = {} ) {
		if ( events[ name ] ) {
			events[ name ].subscriptions = events[ name ].subscriptions.filter( subscription => subscription.namespace == namespace );
		}
	}

	function _request ( name, data, callback, { namespace = globalNamespace, onTimeout = () => {}, retries = requestRetries, timeout = requestTimeout } = {} ) {
		let uuid = generateUUID();
		let proxy = {
			name,
			callback: async src => {
				await callback( src, proxy.response );
				delete requestMap[ uuid ];
			},
			namespace,
			data: {
				uuid,
				data
			},
			response: null,
			onTimeout,
			params: {
				retries,
				timeout
			},
			tries: 0,
			start: null,
			completed: false
		};
		requestBuffer.push( uuid );
		requestMap[ uuid ] = proxy;
	}

	function _arequest ( name, data, callback, { namespace = globalNamespace, onTimeout = () => {}, retries = requestRetries, timeout = requestTimeout } = {} ) {
		let uuid = generateUUID();
		let proxy = {
			name,
			callback: async src => {
				proxy.resolve( await callback( src, proxy.response ) );
				delete requestMap[ uuid ];
			},
			namespace,
			data: {
				uuid,
				data
			},
			response: null,
			onTimeout: async () => {
				proxy.resolve( await onTimeout() );
				delete requestMap[ uuid ];
			},
			params: {
				retries,
				timeout
			},
			tries: 0,
			start: null,
			completed: false
		};
		return new Promise( ( resolve, reject ) => {
			proxy.resolve = resolve;
			proxy.reject = reject;
			requestBuffer.push( uuid );
			requestMap[ uuid ] = proxy;
		} );
	}

	function _respond ( name, callback, { namespace = globalNamespace, once = false } = {} ) {
		responseMap[ name ] = {
			callback,
			namespace,
			once
		};
	}

	function _poll ( name, data, callback, { namespace = globalNamespace, max = pollMax, wait = pollWait } = {} ) {
		let uuid = generateUUID();
		let proxy = {
			name,
			data: {
				uuid,
				data
			},
			responses: [],
			callback: async () => {
				await callback( proxy.responses );
				delete pollMap[ uuid ];
			},
			namespace,
			max,
			wait
		};
		pollMap[ uuid ] = proxy;
		pollBuffer.push( uuid );
	}

	function _apoll ( name, data, callback, { namespace = globalNamespace, max = pollMax, wait = pollWait } = {} ) {
		let uuid = generateUUID();
		let proxy = {
			name,
			data: {
				uuid,
				data
			},
			callback: async () => {
				proxy.resolve( await callback( proxy.responses ) );
				delete pollMap[ uuid ];
			},
			responses: [],
			namespace,
			max,
			wait,
			start: null
		};
		return new Promise( ( res, rej ) => {
			proxy.resolve = res;
			proxy.reject = rej;
			pollMap[ uuid ] = proxy;
			pollBuffer.push( uuid );
		} );
	}

	function _relay ( name, bus, { handle = p.this, namespace = globalNamespace, direction = "both", once = false } = {} ) {
		if ( direction == "both" || direction == "out" ) {
			_addEvent( name );

			events[ name ].relays.push( {
				namespace,
				bus,
				once
			} );
		}

		if ( direction == "both" || direction == "in" ) {
			bus.relay( name, handle, { direction: "out", once } );
		}
	}

	function _intercept ( name, callback, { namespace = globalNamespace, once = false } = {} ) {
		filters.push( {
			name,
			callback,
			namespace,
			once
		} );
	}

	function _observe ( name, callback, { namespace = globalNamespace, once = false } = {} ) {
		observers.push( {
			name,
			callback,
			namespace,
			once
		} );
	}

	function _flush () {
		while ( cstack.length > 0 ) {
			cstack.shift()();
		}
	}

	function _digest () {
		requestBuffer = requestBuffer.filter( uuid => {
			if ( !requestMap[ uuid ] ) return false;
			let r = requestMap[ uuid ];
			let now = new Date().getTime();

			if ( r.completed ) {
				return false;
			}
			
			if ( r.tries > 0 && r.tries > r.params.retries ) {
				cstack.push( () => r.onTimeout() );
				return false;
			}
			
			if ( r.start && now - r.start < r.params.timeout ) {
				return true;
			}

			r.tries++;
			r.start = now;
			_broadcast( r.name, r.data, { namespace: r.namespace, meta: { type: "request" } } );
			return true;
		} );

		pollBuffer = pollBuffer.filter( uuid => {
			if ( !pollMap[ uuid ] ) return false;
			let p = pollMap[ uuid ];
			let now = new Date().getTime();
			
			if ( !p.start ) {
				_broadcast( p.name, p.data, { namespace: p.namespace, meta: { type: "poll" } } );
			}

			p.start = p.start || now;

			if ( ( p.max < 1 || p.responses.length < p.max ) && now - p.start < p.wait ) {
				return true;
			}

			cstack.push( () => p.callback() );
			return false;
		} );

		_flush();
		
		while ( estack.length > 0 ) {
			let e = estack.shift();

			filters = filters.filter( f => {
				if ( f.name == e.name ) {
					cstack.push( () => f.callback( e.name, e.data, { namespace: e.namespace, origin: e.origin, hops: e.hops, trace: e.trace, meta: e.meta } ) );
					return !f.once;
				}

				return true;
			} );

			observers = observers.filter( o => {
				if ( !o.event || o.event == e.event ) {
					cstack.push( () => o.callback( e.name, e.data, { namespace: e.namespace, origin: e.origin, hops: e.hops, trace: e.trace, meta: e.meta } ) );
					return !o.once;
				}

				return true;
			} );

			if ( e.meta.type == "response" ) {
				let p;
				if ( requestMap[ e.data.uuid ] ) {
					p = requestMap[ e.data.uuid ];
					p.completed = true;
					p.response = e.data.data;
					cstack.push( () => p.callback( e.namespace ) );
					continue;
				} else if ( pollMap[ e.data.uuid ] ) {
					p = pollMap[ e.data.uuid ];
					if ( p.max > 0 && p.responses.length >= p.max ) continue;
					p.responses.push( { namespace: e.namespace, data: e.data.data } );
					continue;
				}
			}

			if ( ( e.meta.type == "request" || e.meta.type == "poll" ) && responseMap[ e.name ] ) {
				let p = responseMap[ e.name ];

				cstack.push( () => {
					cstack.push( async () => _broadcast( e.name, { uuid: e.data.uuid, data: await p.callback( e.namespace, e.data.data ) }, { namespace: p.namespace, meta: { type: "response" } } ) );

					if ( p.once ) {
						delete responseMap[ e.name ];
					}
				} );
				continue;
			}

			if ( events[ e.name ] ) {
				let info = events[ e.name ];

				info.subscriptions = info.subscriptions.filter( s => {
					cstack.push( () => s.callback( e.namespace, e.data ) );
					return !s.once;
				} );

				info.relays = info.relays.filter( r => {
					//console.log(`(${globalNamespace}) ${r.bus.uuid()} ${e.name} ${JSON.stringify(e.trace)}`)
					if ( ( !e.namespace || e.namespace.startsWith( r.namespace ) ) && e.hops < 1 || ( e.origin != r.bus.uuid() && typeof e.trace[ r.bus.uuid() ] == "undefined" ) ) {
						cstack.push( () => r.bus.inject( e.name, e.data, { namespace: e.namespace, origin: e.origin, hops: e.hops, trace: e.trace, meta: e.meta } ) );
						return !r.once;
					}

					return true;
				} );
			}

			_flush();
		}

		_flush();
	}

	function _registrar ( containerNamespace, { slots = 1 } = {} ) {
		let remaining = slots;

		return function ( localNamespace ) {
			const p2 = Proxy();

			if ( remaining < 1 ) {
				throw new Error("no remaining slots");
			}

			remaining--;

			let qualified = containerNamespace ? `${globalNamespace}.${containerNamespace}.${localNamespace}` : `${globalNamespace}.${localNamespace}`;
			let unqualified = containerNamespace ? `${containerNamespace}.${localNamespace}` : localNamespace;

			return p2.final( {
				uuid: () => busUUID,
				globalNamespace: () => globalNamespace,
				namespace: () => qualified,
				enqueue: cb => _enqueue( cb ),
				observe: ( event, cb, { once = undefined } = {} ) => _observe( event, cb, { namespace: qualified, once } ),
				loop: ( cb, ms ) => _loop( cb, ms ),
				inject: ( event, data, { namespace = undefined, origin = undefined, hops = undefined, trace = undefined, meta = undefined } = {} ) => _inject( event, data, { namespace, origin, hops, trace, meta } ),
				relay: ( event, bus, { namespace = qualified, direction = "both", once = false, meta = {} } = {} ) => _relay( event, bus, { handle: p2.this, namespace, direction, once, meta } ),
				post: ( event, data ) => _broadcast( event, data, { namespace: qualified, meta: { type: "post" } } ),
				subscribe: ( event, callback, { once = false } = {} ) => _subscribe( event, callback, { namespace: qualified, once } ),
				once: ( event, callback ) => _subscribe( event, callback, { namespace: qualified, once: true } ),
				unsubscribe: event => _unsubscribe( event, { namespace: qualified } ),
				request: ( event, data, callback, { onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => _request( event, data, callback, { namespace: qualified, onTimeout, retries, timeout } ),
				arequest: ( event, data, callback, { onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => _arequest( event, data, callback, { namespace: qualified, onTimeout, retries, timeout } ),
				poll: ( event, data, cb, { max = undefined, wait = undefined } ) => _poll( event, data, cb, { namespace: qualified, max, wait } ),
				apoll: ( event, data, cb, { max = undefined, wait = undefined } ) => _apoll( event, data, cb, { namespace: qualified, max, wait } ),
				respond: ( event, callback, { once = false } = {} ) => _respond( event, callback, { namespace: qualified, once } ),
				registrar: ( containerNs, { slots = 1 } = {} ) => p.this.registrar( containerNs ? `${unqualified}.${containerNs}` : unqualified, { slots } )
			} );
		};
	}

	function _shutdown () {
		state = "shutdown";
	}

	return p.final( {
		uuid: () => busUUID,
		globalNamespace: () => globalNamespace,
		namespace: () => globalNamespace,
		enqueue: cb => _enqueue( cb ),
		loop: ( cb, ms ) => _loop( cb, ms ),
		inject: ( event, data, { namespace = undefined, origin = undefined, hops = undefined, trace = undefined, meta = undefined } = {} ) => _inject( event, data, { namespace, origin, hops, trace, meta } ),
		observe: ( event, cb, { namespace = undefined, once = undefined } = {} ) => _observe( event, cb, { namespace, once } ),
		relay: ( event, bus, { namespace = globalNamespace, direction = "both", once = false, meta = {} } = {} ) => _relay( event, bus, { namespace, direction, once, meta } ),
		intercept: ( event, cb, { namespace = globalNamespace, once = false, meta = {} } = {} ) => _intercept( event, cb, { namespace, once, meta } ),
		post: ( event, data ) => _broadcast( event, data, { namespace: globalNamespace, meta: { type: "post" } } ),
		subscribe: ( event, cb, { once = undefined } = {} ) => _subscribe( event, cb, { once } ),
		unsubscribe: event => _unsubscribe( event ),
		request: ( event, data, cb, { namespace = undefined, onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => _request( event, data, cb, { namespace, onTimeout, retries, timeout } ),
		arequest: ( event, data, cb, { namespace = undefined, onTimeout = undefined, retries = undefined, timeout = undefined } = {} ) => _arequest( event, data, cb, { namespace, onTimeout, retries, timeout } ),
		poll: ( event, data, cb, { namespace = undefined, max = undefined, wait = undefined } ) => _poll( event, data, cb, { namespace, max, wait } ),
		apoll: ( event, data, cb, { namespace = undefined, max = undefined, wait = undefined } ) => _apoll( event, data, cb, { namespace, max, wait } ),
		respond: ( event, cb, { namespace = globalNamespace, once = false } = {} ) => _respond( event, cb, { namespace, once } ),
		digest: () => _digest(),
		registrar: ( container, { slots = 1 } = {} ) => _registrar( container, { slots } ),
		shutdown: () => _shutdown()
	} );
}