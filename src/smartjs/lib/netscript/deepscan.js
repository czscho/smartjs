/**
 * @description Scans up to a given depth.
 * @param {NS} ns - An NS object.
 * @param {string} hostname - Name of host to scan from.
 * @param {number} depth - OPTIONAL. Maximum depth to scan to.
 * @param {boolean} hierarchical - OPTIONAL. Whether or not to format the returned array hierarchically.
 * @returns An array containing all scanned hosts.
 */
export function deepscan ( ns, { hostname = undefined, depth = -1, hierarchical = false } = {} ) {
    let toScan = [];
    let scanned = [];
    let currentDepth = 0;
    let hierarchy = [];

    if ( typeof hostname == 'undefined' ) {
        hostname = ns.getHostname();
    }

    if ( hierarchical ) {
        toScan[0] = hierarchy[0] = {
            hostname: hostname,
            adjacent: [],
            depth: 0
        };
    } else {
        toScan[0] = hostname;
    }

    while ( toScan.length > 0 && ( currentDepth < depth || depth < 0 ) ) {
        currentDepth++;
        
        let toAdd = [];

        for ( let i = 0; i < toScan.length; i++ ) {
            let server = hierarchical ? toScan[i].hostname : toScan[i];
            let adjacent = ns.scan( server );

            if ( scanned.includes( server ) ) {
                continue;
            } else {
                scanned.push( server );
            }

            if ( hierarchical ) {
                for ( let j = 0; j < adjacent.length; j++ ) {
                    if ( adjacent[j] == "home" || scanned.includes( adjacent[j] ) ) {
                        continue;
                    }
                    
                    toScan[i].adjacent.push( {
                        hostname: adjacent[j],
                        adjacent: [],
                        depth: currentDepth
                    } );
                    toAdd.push( toScan[i].adjacent[ toScan[i].adjacent.length - 1 ] );
                }
            } else {
                for ( let j = 0; j < adjacent.length; j++ ) {
                    if ( adjacent[j] != "home" && !scanned.includes( adjacent[j] ) ) {
                        toAdd.push( adjacent[j] );
                    }
                }
            }
        }

        toScan = toAdd;
    }

    return hierarchical ? hierarchy : scanned;
}