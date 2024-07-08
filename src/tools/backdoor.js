async function pathTo ( ns, server ) {
    let toScan = [ {
        server: "home", path: "home"
    } ];
    let scanned = [];

    while ( toScan.length > 0 ) {
        let toAdd = [];

        for ( let i = 0; i < toScan.length; i++ ) {
            let adjacent = ns.scan( toScan[i].server ).filter( server => server != "home" && !scanned.includes( server ) );

            scanned.push( toScan[i].server );

            for ( let j = 0; j < adjacent.length; j++ ) {
                if ( adjacent[j] == server ) {
                    await ns.sleep(100);

                    return `${ toScan[i].path}; connect ${adjacent[j] }`;
                }

                toAdd.push( { 
                    server: adjacent[j],
                    path: `${toScan[i].path}; connect ${ adjacent[j] }`
                } );
            }
        }

        toScan = toAdd;
    }
}

/**
 * @description Entry function.
 * @param {NS} ns - An NS object.
 */
export async function main ( ns ) {
    const doc = eval("document");
    let terminalInput = doc.getElementById("terminal-input");
    let handler = Object.keys( terminalInput )[1];
    let servers = [ "CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z" ];

    for ( let i = 0; i < servers.length; i++ ) {
        if ( ns.getServerRequiredHackingLevel( servers[i] ) > ns.getHackingLevel() ) {
            break;
        }

        if ( ns.getServer( servers[i] ).backdoorInstalled ) {
            continue;
        }

        terminalInput.value = `${ await pathTo( ns, servers[i] ) }; backdoor`;
        terminalInput[ handler ].onChange( { target: terminalInput } );
        terminalInput[ handler ].onKeyDown( { key: "Enter", preventDefault: () => null } );
        await ns.sleep(5_000);
    }

    terminalInput.value = `home`;
    terminalInput[ handler ].onChange( { target: terminalInput } );
    terminalInput[ handler ].onKeyDown( {
        key: "Enter",
        preventDefault: () => null
    } );
}