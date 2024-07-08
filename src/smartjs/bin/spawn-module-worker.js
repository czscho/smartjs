import { generateUUID } from "/smartjs/lib/uuid";
import { genLoader } from "/smartjs/lib/loader";

export async function main ( ns ) {
    let uuid = generateUUID();
    let short = uuid.slice( 0, 8 );
    let loader = `/smartjs/tmp/loaders/${uuid}`;
    let worker = `/smartjs/tmp/workers/${uuid}`;

    genLoader( ns, ns.args[0].split(","), `${loader}.js` );
    ns.write( `${worker}.js`, `
        import { load as loadModules } from "${loader}";
        import { loop } from "/smartjs/lib/daemon/module-worker-loop";
         
        export async function main ( ns ) {
            await loop( ns, loadModules );
        }
    ` );
    ns.spawn( `${worker}.js`, { spawnDelay: 100 } );
}