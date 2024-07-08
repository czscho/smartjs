import { Proxy } from "/smartjs/lib/proxy";
import { Logger } from "/smartjs/lib/log";

export function ModuleWorker ( mod ) {
	const p = Proxy();
	let _locked = true;
	let _lock = ( async () => {} )();

	return p.final( {
        module: () => mod,
		interval: () => mod.interval(),
        options: () => mod.options(),
        requirements: () => mod.requirements(),
		init: async () => {
            await mod.init();
            _locked = false;
        },
		tryUpdate: ctx => {
			return ( async () => {
				if ( _locked ) return false;
				await _lock;
				_locked = true;
				_lock = ( async () => {
					await mod.update( ctx );
					_locked = false;
				} )();
                return true;
			} )();
		}
	} );
}

export function WorkerGroup ( bus ) {
    const p = Proxy();
    const workerMap = {};
    const workers = [];
    const logger = Logger( bus, { eventPrefix: "Daemon" } );

    return p.final( {
        addWorker: worker => {
            let q = worker.module().qualifier();
            workerMap[q] = worker;
            workers.push( {
                worker,
                lastUpdated: 0
            } );
        },
        addWorkers: workers => workers.forEach( worker => p.this.addWorker( worker ) ),
        init: () => {
            return Promise.all( workers.map( async meta => {
                let mod = meta.worker.module();
                return ( async () => {
                    await meta.worker.options();
                    logger.info(`registered options for ${mod.qualifier()}`);
                    await meta.worker.requirements();
                    await meta.worker.init();
                    logger.info(`initialized ${mod.qualifier()}`);
                } )();
            } ) );
        },
        update: ctx => {
            return Promise.all( workers.map( async meta => {
                if ( meta.lastUpdated < 1 ) meta.lastUpdated = new Date().getTime();
                let t = new Date().getTime();
                if ( t - meta.lastUpdated >= meta.worker.interval() ) {
                    meta.worker.tryUpdate( ctx );
                    meta.lastUpdated = t;
                }
            } ) );
        }
    } );
}