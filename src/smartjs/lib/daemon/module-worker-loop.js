import { sleep } from "/smartjs/lib/sleep";
import { ModuleWorker, WorkerGroup } from "/smartjs/lib/daemon/worker";
import { deepscan } from "/smartjs/lib/netscript/deepscan";
import { SmartService } from "/smartjs/lib/netscript/smartservice";
import { StatusCode, StatusCodeMessages } from "/smartjs/lib/enums";
import { generateUUID } from "/smartjs/lib/uuid";

export async function loop ( ns, loadModules ) {
	let uuid = generateUUID();
	let short = uuid.slice( 0, 8 )
	let service = await SmartService( ns, 0, `ModuleWorkers.${short}`, `module-worker@${short}` );
	await service.linkByPort(3);
	service.post( "ModuleWorker.Registry", { script: ns.getScriptName(), args: ns.args, host: ns.getHostname() } );
	service.status( () => ( {
		code: StatusCode.OK,
		message: StatusCodeMessages.byKeys()[ StatusCode.OK ]
	} ) );
	let modules = await loadModules( () => [ service.registrar(), ns ] );
    let group = WorkerGroup( service );
    group.addWorkers( modules.map( m => ModuleWorker( m ) ) );
	group.init();
    let cont = true;
    let time = () => new Date().getTime();
	let start = time();

	service.respond( "GetTime", () => time() - start );

    while ( cont ) {
		let servers = await deepscan( ns, { hostname: "home" } );

		group.update( {
			time: time() - start,
			servers,
			player: ns.getPlayer()
		} );
		service.update();
		await sleep(10);
	}

	await service.shutdown();
}