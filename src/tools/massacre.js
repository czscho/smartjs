import { deepscan } from "/smartjs/lib/netscript/deepscan";

export async function main( ns ) {
    let servers = deepscan ( ns );

    for ( let i = 0; i < servers.length; i++ ) {
        ns.killall( servers[i] );
    }
}