import { Proxy } from "/smartjs/lib/proxy";

export function Module ( registrar, qualifier, { ms = 1_000 } = {} ) {
	const p = Proxy();
	const bus = registrar( qualifier );
	const procedures = {};

	let config = null;
	let _logger = Logger( bus );
	let _doInit = () => {};
	let _doUpdate = () => {};

	let _sched_taskStartQ = {};
	let _sched_taskCompleteQ = {};

	bus.subscribe( "Scheduler.TaskStart", ( _, key ) => {
		if ( _sched_taskStartQ[ key ] ) {
			_sched_taskStartQ[ key ].resolveFn();
			delete _sched_taskStartQ[ key ];
		}
	} );

	bus.subscribe( "Scheduler.TaskCompletion", ( _, key ) => {
		if ( _sched_taskCompleteQ[ key ] ) {
			_sched_taskCompleteQ[ key ].resolveFn();
			delete _sched_taskCompleteQ[ key ];
		}
	} );

	return p.final( {
		init: cb => _doInit = cb,
		update: cb => _doUpdate = cb,
		option: ( key, type, initial, { label = undefined, description = undefined, delimiter = undefined, labels = {} } ) => config.define( key, type, initial, { label, description, delimiter, labels } ),
		options: arr => arr.forEach( option => proxy.option( option.key, option.type, option.initial, { label: option.label, description: option.description, delimiter: option.delimiter, labels: option.labels } ) ),
		get: key => config.get( key ),
		set: ( key, value ) => config.set( key, value ),
		rpc: ( name, cb ) => {
			procedures[ name ] = cb;
			bus.post( "RpcExposure", name );
			bus.respond( `Rpc.${ name }`, cb );
		},
		subscribe: ( event, cb ) => bus.subscribe( event, cb ),
		post: ( event, data ) => bus.post( event, data ),
		respond: ( event, cb ) => bus.respond( event, cb ),
		request: ( event, data, cb ) => bus.request( event, data, cb ),
		requestAsync: async ( event, data, cb ) => await bus.requestAsync( event, data, cb ),
		bus: () => bus,
		time: async () => {
			let time;
			await bus.requestAsync( "Daemon.GetTime", null, ( _, r ) => time = r );
			return time;
		},
		log: _logger.log,
		debug: _logger.debug,
		info: _logger.info,
		notice: _logger.notice,
		warn: _logger.warn,
		error: _logger.error,
		logger: _logger,
		scheduling: {
			schedule: async ( descs ) => {
				let keys;
				await bus.requestAsync( "Scheduler.Schedule", descs, ( _, r ) => keys = r );
				return keys;
			},
			cancel: async ( key ) => {
				let result;
				await bus.requestAsync( "Scheduler.Cancel", key, ( _, r ) => result = r );
				return result;
			},
			taskInfo: async key => {
				let result;
				await bus.requestAsync( "Scheduler.TaskInfo", key, ( _, r ) => result = r );
				return result;
			},
			taskStart: key => new Promise( async ( res, rej ) => {
				let tmp;

				await bus.requestAsync( "Scheduler.TaskInfo", key, ( _, r ) => tmp = r );

				if ( tmp && tmp.status == 0 ) {
					_sched_taskStartQ[ key ] = { resolveFn: res };
					return;
				}

				res();
			} ),
			taskComplete: key => new Promise( async ( res, rej ) => {
				let tmp;

				await bus.requestAsync( "Scheduler.TaskInfo", key, ( _, r ) => tmp = r );

				if ( tmp && tmp.status == 0 ) {
					_sched_taskCompleteQ[ key ] = { resolveFn: res };
					return;
				}

				res();
			} ),
			share: {
				create: async ( desc ) => {
					let key;
					await bus.requestAsync( "Scheduler.Share.Create", desc, ( _, r ) => key = r );
					return key;
				},
				schedule: async ( desc ) => {
					let keys;
					await bus.requestAsync( "Scheduler.Share.Schedule", desc, ( _, r ) => keys = r );
					return keys;
				},
				cancel: async ( key )  => {
					let result;
					await bus.requestAsync( "Scheduler.Share.Cancel", key, ( _, r ) => result = r );
					return result;
				}
			},
			partition: {
				info: async ( key ) => {
					let info;
					await bus.requestAsync( "Scheduler.Partition.Info", key, ( _, r ) => info = r );
					return info;
				},
				create: async ( desc ) => {
					let key;
					await bus.requestAsync( "Scheduler.Partition.Create", desc, ( _, r ) => key = r );
					return key;
				},
				layout: async ( desc ) => {
					let keys;
					await bus.requestAsync( "Scheduler.Partition.CreateLayout", desc, ( _, r ) => keys = r );
					return keys;
				},
				schedule: async ( desc ) => {
					let keys;
					await bus.requestAsync( "Scheduler.Partition.Schedule", desc, ( _, r ) => keys = r );
					return keys;
				},
				cancel: async ( key )  => {
					let result;
					await bus.requestAsync( "Scheduler.Partition.Cancel", key, ( _, r ) => result = r );
					return result;
				}
			}
		},
		finalize: () => Object.freeze( {
			init: cfg => {
				config = cfg;
				bus.addTask( _doInit );
			},
			update: time => bus.addTask( () => _doUpdate( time ) ),
			qualified: () => bus.namespace(),
			qualifier: () => qualifier,
			interval: () => ms
		} )
	} );
}