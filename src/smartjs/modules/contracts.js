import * as SJS from "/smartjs/lib/common";

function ContractsModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Contracts", 5_000 );

    let worker;
    let contractsMap = {};

    m.expose( "Contracts.GetContracts", () => ( { status: 0, data: contractsMap, message: "ok" } ) );

    m.init( async () => {
        let str = ns.read("/smartjs/lib/workers/contracts.worker.js");
        let blob = new Blob( [ str ], { type: "application/javascript" } );
        worker = new Worker( URL.createObjectURL( blob ) );
        worker.onmessage = async e => {
            let meta = contractsMap[ e.data.contract ];
            let result = ns.codingcontract.attempt( e.data.solution, meta.file, meta.server );
        
            if ( result == "" ) {
                m.warn(`failed - ${meta.file} (${ meta.type.toUpperCase() }) on ${meta.server}, will not be attempted again`);
                meta.failed = true;
            } else {
                m.info(`success - ${meta.file} (${ meta.type.toUpperCase() }) on ${meta.server} reward: "${result}"`);
                meta.solved = true;
                meta.solution = e.data.solution;
                meta.result = result;
            }
    
            meta.attempts++;
        };
    } );

    m.update( async ctx => {
        for ( let i = 0; i < ctx.servers.length; i++ ) {
            let contracts = ns.ls( ctx.servers[i] ).filter( file => file.endsWith(".cct") );

            for ( let j = 0; j < contracts.length; j++ ) {
                let meta = contractsMap[ contracts[j] ];

                if ( !contractsMap[ contracts[j] ] ) {
                    meta = contractsMap[ contracts[j] ] = {
                        server: ctx.servers[i],
                        file: contracts[j],
                        type: ns.codingcontract.getContractType( contracts[j], ctx.servers[i] ),
                        description: ns.codingcontract.getDescription( contracts[j], ctx.servers[i] ),
                        attempts: 0,
                        solved: false,
                        failed: false
                    };

                    //m.info(`found ${ meta.file } (${ meta.type.toUpperCase() }) on ${ meta.server }`);
                }

                if ( meta.failed ) {
                    continue;
                }

                worker.postMessage( {
                    contract: meta.file,
                    type: meta.type,
                    description: meta.description
                } );
            }
        }
    } );

    return m.finalize();
}

export { ContractsModule as init };