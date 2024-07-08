import { Proxy } from "/smartjs/lib/proxy";
import { createEnum, createLabels } from "/smartjs/lib/enums";
import { Configuration, OptionType } from "/smartjs/lib/configuration";
import { Logger } from "/smartjs/lib/log";

export { Configuration, OptionType };

/*
    Fund types
    PERCENT - PERCENTage; Multiply a given decimal number by a provided amount of money to calculate the amount of money in this fund
    FIXED - FIXED; Take the maximum of: the given decimal number, or a provided amount of money to calculate the amount of money in this fund
*/
export const FundType = createEnum( [
    "PERCENT",
    "FIXED"
] );

export const FundTypeLabels = createLabels( {
    "Decimal percentage": FundType.PERCENT,
    "Fixed": FundType.FIXED
} );

/*
    Pool types
    INCLUDE - INCLUDE; Only include the given pool members from a provided pool
    EXCLUDE - EXCLUDE; Include all members from a provided pool except the given members
*/
export const PoolType = createEnum( [
    "INCLUDE",
    "EXCLUDE"
] );

export const PoolTypeLabels = createLabels( {
    "Inclusive": PoolType.INCLUDE,
    "Exclusive": PoolType.EXCLUDE
} );

/*
    Target selection types
    HMOT - Highest Money Over Time; Prioritize targets with the highest ratios of hack() money over the amount of time hack() will take to complete
*/
export const TargetSelectionType = createEnum( [
    "HMOT"
] );

export const TargetSelectionTypeLabels = createLabels( {
    "Highest money over time": TargetSelectionType.HMOT
} );

/*
    Naming system types
    INCR - INCRemental; Name units by appending an incrementally increasing number to a given prefix
    UNIQUE - UNIQUE; Name units by randomly drawing from a pool of given names
*/
export const NamingSystemType = createEnum( [
    "INCR",
    "UNIQUE"
] );

export const NamingSystemTypeLabels = createLabels( {
    "Incremental": NamingSystemType.INCR,
    "Unique names": NamingSystemType.UNIQUE
} );

export function SmartModule ( registrar, qualifier, { ms = 1_000 } = {} ) {
	const p = Proxy();
	const bus = registrar( qualifier );
	const options = [];

	let _logger = Logger( bus, { eventPrefix: "Daemon" } );
	let _doInit = () => {};
	let _doUpdate = () => {};

	let _reqs_map = {};
	let _reqs_promises = [];

	let _sched_taskStartQ = {};
	let _sched_taskCompleteQ = {};

	async function _rpc ( name, args ) {
		return await bus.arequest( "Daemon.RPC", { name, args }, ( _, r ) => r.data );
	}

	bus.subscribe( "Module.InitCompletion", ( _, qualifier ) => {
		let req = _reqs_map[ qualifier ];
		if ( req && req.status == "waiting" ) {
			req.status = "done";
			req.resolve();
		}
	} );

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
		option: ( key, type, initial, { label = undefined, description = undefined, delimiter = undefined, labels = {} } = {} ) => options.push( { key, type, initial, label, description, delimiter, labels } ),
		mkOption: ( key, type, initial, { label = undefined, description = undefined, delimiter = undefined, labels = {} } = {} ) => ( { key, type, initial, label, description, delimiter, labels } ),
		mkStringOption: ( key, initial, { label = undefined, description = undefined } = {} ) => p.this.mkOption( key, OptionType.STR, initial, { label, description } ),
		mkBoolOption: ( key, initial, { label = undefined, description = undefined } = {} ) => p.this.mkOption( key, OptionType.BOOL, initial, { label, description } ),
		mkIntOption: ( key, initial, { label = undefined, description = undefined } = {} ) => p.this.mkOption( key, OptionType.INT, initial, { label, description } ),
		mkFloatOption: ( key, initial, { label = undefined, description = undefined } = {} ) => p.this.mkOption( key, OptionType.FLOAT, initial, { label, description } ),
		mkArrOption: ( key, initial, { label = undefined, description = undefined } = {} ) => p.this.mkOption( key, OptionType.ARR, initial, { label, description } ),
		mkEnumOption: ( key, type, initial, { label = undefined, description = undefined, labels = {} } = {} ) => p.this.mkOption( key, type, initial, { label, description, labels } ),
		options: arr => arr.map( option => p.this.option( option.key, option.type, option.initial, { label: option.label, description: option.description, delimiter: option.delimiter, labels: option.labels } ) ),
		get: key => bus.arequest( "Daemon.Config.Get", `Modules.${qualifier}.${key}`, ( _, r ) => r.data ),
		set: async ( key, value ) => await bus.arequest( "Daemon.Config.Set", { key: `Modules.${qualifier}.${key}`, value }, ( _, r ) => r ),
		loader: {
			require: async qualifier => {
				let req = _reqs_map[ qualifier ] = {};
				let loaded = await bus.arequest( "Daemon.ListModules", null, ( _, r ) => r );
				if ( loaded[ qualifier ] ) return;
				req.status = "waiting";
				_reqs_promises.push( new Promise( res => req.resolve = res ) );
			}
		},
		expose: ( name, cb ) => {
			bus.post( "Daemon.RPCExposure", name );
			bus.respond( `Daemon.RPC.${name}`, cb );
		},
		subscribe: ( event, cb ) => bus.subscribe( event, cb ),
		post: ( event, data ) => bus.post( event, data ),
		respond: ( event, cb ) => bus.respond( event, cb ),
		request: ( event, data, cb ) => bus.request( event, data, cb ),
		arequest: async ( event, data, cb ) => await bus.arequest( event, data, cb ),
		poll: ( event, data, cb ) => bus.poll( event, data, cb ),
		apoll: async ( event, data, cb ) => await bus.apoll( event, data, cb ),
		bus: () => bus,
		time: async () => await bus.arequest( "GetTime", null, ( _, r ) => r ),
		log: _logger.log,
		debug: _logger.debug,
		info: _logger.info,
		notice: _logger.notice,
		warn: _logger.warn,
		error: _logger.error,
		logger: _logger,
		rpc: _rpc,
		scheduling: {
			schedule: descs => _rpc( "Scheduler.Schedule", descs ),
			cancel: key => _rpc( "Scheduler.Cancel", key ),
			taskInfo: key => _rpc( "Scheduler.TaskInfo", key ),
			taskStart: key => new Promise( async res => {
				let tk = await _rpc( "Scheduler.TaskInfo", key );

				if ( tk ) {
					_sched_taskStartQ[ key ] = { resolveFn: res };
					return;
				}

				res();
			} ),
			taskComplete: key => new Promise( async res => {
				let tk = await _rpc( "Scheduler.TaskInfo", key );

				if ( tk ) {
					_sched_taskCompleteQ[ key ] = { resolveFn: res };
					return;
				}

				res();
			} ),
			share: {
				create: desc => _rpc( "Scheduler.Share.Create", desc ),
				schedule: desc => _rpc( "Scheduler.Share.Schedule", desc ),
				cancel: key  => _rpc( "Scheduler.Share.Cancel", key )
			},
			partition: {
				info: key => _rpc( "Scheduler.Partition.Info", key ),
				create: desc => _rpc( "Scheduler.Partition.Create", desc ),
				layout: desc => _rpc( "Scheduler.Partition.CreateLayout", desc ),
				schedule: desc => _rpc( "Scheduler.Partition.Schedule", desc ),
				cancel: key => _rpc( "Scheduler.Partition.Cancel", key )
			}
		},
		finalize: () => Object.freeze( {
			options: () => Promise.all( options.map( o => bus.arequest( "Daemon.Config.Define", { key: `Modules.${qualifier}.${o.key}`, type: o.type, initial: o.initial, label: o.label, description: o.description, delimiter: o.delimiter, labels: o.labels }, ( _, r ) => r ) ) ),
			requirements: () => Promise.all( _reqs_promises ),
			init: async () => {
				await _doInit();
				bus.post( "Module.InitCompletion", qualifier );
			},
			update: ctx => _doUpdate( ctx ),
			qualified: () => bus.namespace(),
			qualifier: () => qualifier,
			interval: () => ms
		} )
	} );
}