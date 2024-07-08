import { NSEventBus } from "/smartjs/lib/netscript/nseventbus";
import { ShellEnvironment } from "/smartjs/lib/shell";
import { sleep } from "/smartjs/lib/sleep";
import { generateUUID } from "/smartjs/lib/uuid";
import { Logger } from "/smartjs/lib/log";

export async function main ( ns ) {
	if ( ns.args[0] == "start" ) {
		ns.run("/smartjs/bin/bootstrap.js");
	} else {
		let uuid = generateUUID();
		let bus = await NSEventBus( ns, 0, { globalNamespace: "SmartJS.Client", serviceName: `smartjs-client`, instance: uuid } );
		let scoped = bus.registrar("Environments")( uuid );
		let env = ShellEnvironment( uuid, scoped, Logger( scoped ) );

		await bus.linkByPort(3);
		
		let pending = true;
	
		( async () => {
			let arr = await env.process( ( ns.args.join(" ") ) );
			arr.map( item => item && ns.tprintRaw( item.status == 0 ? item.message || item.data : ( item.message || "timed out" ) ) || ns.tprintRaw(`${item.time}ms`) );
			pending = false;
		} )();
	
		while ( pending ) {
			bus.digest();
			await sleep(10);
		}
	
		bus.shutdown();
	}
}