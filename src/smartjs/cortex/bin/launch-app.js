import { generateUUID } from "/smartjs/lib/uuid";

export async function main ( ns ) {
    let uuid = generateUUID();
    let launcher = `/smartjs/tmp/cortex/launchers/${uuid}`;
    ns.write( `${launcher}.js`, `
        import { init } from "${ns.args[0]}";
        import { sleep } from "/smartjs/lib/sleep";

        export async function main ( ns ) {
            let app = await init( ns, ns.args );
            let cont = true;
            app.onQuit( () => cont = false );
            app.init();
            while ( cont ) {
                app.update();
                await sleep(10);
            }
            app.shutdown();
        }
    ` );
    ns.spawn( `${launcher}.js`, { spawnDelay: 500 }, ...ns.args.slice(1) );
}