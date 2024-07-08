import { SmartService } from "/smartjs/lib/netscript/smartservice";
import { init as LogModule } from "/smartjs/modules/log";
import { load as loadModules } from "/smartjs/gen/static-modules";

import { sleep } from "/smartjs/lib/sleep";
import * as SJS from "/smartjs/lib/common";
import * as NSUtil from "/smartjs/lib/netscript/util";

import { deepscan } from "/smartjs/lib/netscript/deepscan";
import { ModuleWorker, WorkerGroup } from "/smartjs/lib/daemon/worker";
import { StatusCode, StatusCodeMessages } from "/smartjs/lib/enums";

export async function main ( ns ) {
	ns.disableLog("ALL");
	let service = await SmartService( ns, 3, "SmartDaemon", "smart-daemon" );
	let bus = service.registrar()("Internal");
	let logger = SJS.Logging.Logger( bus );
	let cont = true;

	service.status( () => ( {
		code: StatusCode.OK,
		message: StatusCodeMessages.byKeys()[ StatusCode.OK ]
	} ) );

	let configFile = "smart.txt";
	let config = SJS.Modules.Configuration();
	let dconfig = config.sub("Daemon");
	let moduleWorkers = [];
	let modules = {};
	let rpcs = {};

	bus.respond( "Daemon.ListModules", () => modules );

	bus.subscribe( "ModuleWorker.Registry", ( _, info ) => {
		moduleWorkers.push( {
			script: info.script,
			args: info.args,
			host: info.host
		} );
	} );

	bus.subscribe( "Module.InitCompletion", ( _, qualifier ) => {
		modules[ qualifier ] = true;
	} );

	bus.subscribe( "Module.DeinitCompletion", ( _, qualifier ) => {
		delete modules[ qualifier ];
	} );

	service.intercept( "Daemon.RPCExposure", ( _, name ) => rpcs[ name ] = true );

	bus.respond( "Daemon.RPC", async ( _, args ) => {
		if ( !rpcs[ args.name ] ) {
			return { status: 1, data: null, message: "no such procedure" };
		}

		let r = await bus.arequest( `Daemon.RPC.${args.name}`, args.args, ( _, r ) => r );
		return { status: r.status, data: r.data, message: r.message };
	} );

	let time = () => new Date().getTime();
	let start = time();

	bus.respond( "GetTime", () => time() - start );

	bus.respond( "Daemon.Config.Define", ( _, args ) => {
		dconfig.define( args.key, args.type, args.initial, { label: args.label, description: args.description, delimiter: args.delimiter, labels: args.labels } );
		dconfig.flushBuffer( { undefAction: "ignore" } );
		return { status: 0, message: "ok" };
	} );

	bus.respond( "Daemon.Config.Load", ( _, args ) => {
		if ( !args.file ) {
			return { status: 1, message: "error: no file specified" };
		}

		if ( args.keep ) {
			configFile = args.file;
		}

		try {
			config.loadFile( ns.read( args.file ), { base: "" } );
		} catch ( e ) {
			return { status: 1, message: `error: ${e}` };
		}
		
		return { status: 0, message: "ok" };
	} );

	bus.respond( "Daemon.Config.Reload", () => {
		try {
			config.loadFile( ns.read( configFile ), { base: "" } );
		} catch ( e ) {
			return { status: 1, message: `error: ${e}` };
		}

		return { status: 0, message: "ok" };
	} );

	bus.respond( "Daemon.Config.Get", ( _, key ) => {
		let v;

		try {
			v = dconfig.get( key );
		} catch (e) {
			return { status: 1, data: null, message: e.toString() };
		}

		return { status: 0, data: v, message: v };
	} );

	bus.respond( "Daemon.Config.GetAll", () => {
		let r = dconfig.getAll();
		return { status: 0, data: r, message: r };
	} );

	bus.respond( "Daemon.Config.Set", async ( _, args ) => {
		try {
			dconfig.set( args.key, args.value, { fromString: true } );
		} catch (e) {
			return { status: 0, data: null, message: e.toString() };
		}

		return { status: 0, data: null, message: "ok" };
	} );

	bus.respond( "Daemon.Ping", ( src, data ) => {
		logger.info(`from ${src}: ${data}`);
		return "pong";
	} );

	bus.respond( "Daemon.Shutdown", ( src, data ) => {
		( async () => {
			logger.notice("shutting down...");
			cont = false;
		} )();
		return { status: 0, data: null, message: "shutting down..." };
	} );

	bus.respond( "Daemon.ManagerShutdown", ( src, data ) => {
		( async () => {
			logger.notice("requesting manager shutdown...");
			await service.requestShutdown();
		} )();
		return { status: 0, data: null, message: "requesting manager shutdown..." };
	} );

	bus.respond( "Daemon.ServiceList", () => bus.arequest( "Manager.ServiceList", null, ( _, services ) => ( { services, inactive: [] } ) ) );

	bus.respond( "Daemon.GetMetrics", () => ( {
		time: time() - start,
		usedRam: NSUtil.accumulatedUsedRam( ns, deepscan( ns, { hostname: "home" } ) ),
		maxRam: NSUtil.accumulatedMaxRam( ns, deepscan( ns, { hostname: "home" } ) ),
		income: ns.getScriptIncome( ns.getScriptName(), ns.getHostname(), ...ns.args ) + moduleWorkers.map( info => ns.getScriptIncome( info.script, info.host, ...info.args ) ).reduce( ( prev, cur ) => prev + cur, 0 )
	} ) );

	dconfig.define( "ModulesPath", SJS.Modules.OptionType.STR, "/smartjs/modules" );
	dconfig.define( "AutoDynamicModules", SJS.Modules.OptionType.ARR, [] );
	dconfig.define( "CacheConfig", SJS.Modules.OptionType.BOOL, true, { label: "Cache configuration", description: "Cache configuration changes made during runtime and load them at next start." } );
	config.loadFile( ns.read( configFile ), { base: "", toBuffer: true } );
	config.flushBuffer( { undefAction: "ignore" } );

	let coreWorkerGroup = WorkerGroup( bus );
	coreWorkerGroup.addWorker( ModuleWorker( LogModule( service.registrar("Modules"), ns ) ) );
	coreWorkerGroup.init();
	service.update();
	let miscWorkerGroup = WorkerGroup( bus );
	miscWorkerGroup.addWorkers( ( await loadModules( () => [ service.registrar("Modules"), ns ] ) ).map( module => ModuleWorker( module ) ) );
	miscWorkerGroup.init();
	service.update();

	if ( dconfig.get("AutoDynamicModules").length > 0 ) {
        ns.run( "/smartjs/bin/spawn-module-worker.js", 1, dconfig.get("AutoDynamicModules").map( m => `${ dconfig.get("ModulesPath") }/${m}`).reduce( ( p, c ) => ( p ? `${p},` : '' ) + c ) );
    }

	while ( cont ) {
		let servers = deepscan( ns, { hostname: "home" } );
		let ctx = {
			time: time() - start,
			servers,
			player: ns.getPlayer()
		};

		coreWorkerGroup.update( ctx );
		miscWorkerGroup.update( ctx );
		service.update();
		await sleep(10);
	}

	await service.shutdown();
}