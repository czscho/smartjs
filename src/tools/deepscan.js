import { deepscan } from "/smartjs/lib/netscript/deepscan";

export function main( ns ) {
    let hostname;
    let depth;

    for ( let i = 0; i < ns.args.length; i++ ) {
        if ( ns.args[i] == "--depth" ) {
            try {
                depth = parseInt( ns.args[ i + 1 ] );
            } catch ( e ) {
                ns.tprintRaw("Could not parse depth. Please specify a valid integer.");
            }

            if ( typeof depth == 'undefined' ) {
                ns.tprintRaw("Must specify a depth when using the --depth option");
                return;
            }

            i++;
        } else if ( ns.args[i] == "--host" ) {
            hostname = ns.args[ i + 1 ];

            if ( typeof hostname == 'undefined' ) {
                ns.tprint("Must specify a host when using the --host option");
                return;
            }
            
            i++;
        }
    }

    if ( hostname && !ns.serverExists(hostname) ) {
        ns.tprintRaw(`server '${hostname}' does not exist`);

        return;
    }

    let hierarchy = deepscan( ns, { depth: depth || -1, hostname: hostname || ns.getHostname(), hierarchical: true } );
    let stack = [ hierarchy[0] ];

    while ( stack.length > 0 ) {
        let node = stack.pop();
        let indent = "--".repeat( node.depth );
        let ram = ns.getServerMaxRam( node.hostname );

        ns.tprintRaw(`\n${indent}${node.hostname}\n${indent}--Root Access: ${ns.hasRootAccess(node.hostname) ? "YES" : "NO"}, Required hacking skill: ${ns.getServerRequiredHackingLevel(node.hostname)}\n${indent}--Number of open ports required to NUKE: ${ns.getServerNumPortsRequired(node.hostname)}\n${indent}--RAM: ${numeral(ram * 1_000_000_000).format("0.00b")}`);

        if ( ns.getPurchasedServers().includes( node.hostname ) ) {
            let cost = ns.getPurchasedServerUpgradeCost( node.hostname, ram * 2 );

            ns.tprintRaw(`${indent}--Upgrade cost: ${cost == "Infinity" ? "Cannot upgrade" : "$" + numeral(cost).format("0.00a")}`);
        }
        
        for ( let i = node.adjacent.length - 1; i > -1; i-- )
            stack.push( node.adjacent[i] );
    }
}