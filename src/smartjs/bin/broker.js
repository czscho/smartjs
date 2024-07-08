import { sleep } from "/smartjs/lib/sleep";
import { generateUUID } from "/smartjs/lib/uuid";

export async function main ( ns ) {
	ns.disableLog("ALL");

	let handle = ns.getPortHandle(1);

	handle.clear();

	let freeMap = {};
	let byPort = {};
	let byUUID = {};
	let byName = {};

	function _add ( uuid, txPort, { name = null } = {} ) {
		freeMap[ txPort ] = false;
		byUUID[ uuid ] = {
			txPort,
			name
		};
		byPort[ txPort ] = {
			uuid,
			name
		};

		if ( name ) {
			byName = {
				uuid,
				txPort
			};
		}

		ns.write( `/smartjs/tmp/broker/${uuid}.txt`, JSON.stringify( { status: "ok", txPort } ) );
	}

	function _del ( uuid ) {
		let i = byUUID[ uuid ];
		delete byPort[ i.txPort ];
		i.name && ( delete byName[ i.name ] );
		delete byUUID[ uuid ];
		freeMap[ i.txPort ] = true;
	}

	for ( let i = 2; i <= 100; i++ ) {
		try {
			freeMap[i] = true;
			ns.clearPort(i);
		} catch (e) {
			break;
		}
	}

	while (true) {
		while ( !handle.empty() ) {
			let item = JSON.parse( handle.read() );

			if ( item.action == "init" ) {
				if ( item.type == "ephemeral" ) {
					for ( let i = 2; i <= 100; i++ ) {
						if ( freeMap[i] ) {
							_add( item.uuid, i, { name: item.name } );
							break;
						}
					}
					continue;
				}

				if ( !freeMap[ item.rxPort ] ) {
					console.log('tried to initialize a port that is already in use');
					continue;
				}

				_add( item.uuid, item.rxPort, { name: item.name } );
			} else if ( item.action == "query" ) {
				if ( byName[ item.name ] ) {
					//
				}
			} else if ( item.action == "destroy" ) {
				if ( byUUID[ item.uuid ] ) _del( item.uuid );
			}
		}

		await sleep(10);
	}
}