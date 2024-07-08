/** @file Miscellaneous utility functions. */

/**
 * @description Calculates the accumulated maximum RAM across a pool of servers.
 * @param {NS} ns - An NS object.
 * @param {string[]} pool - List of servers to either exclude or include from scan.
 * @param {string} poolType - Whether or not to include or exclude the servers in `pool`. Must be either "EXCLUDE" or "INCLUDE".
 * @returns The accumulated maximum RAM across the given servers in gigabytes.
 */
export function accumulatedMaxRam ( ns, servers ) {
    return servers.reduce( ( prevVal, server ) => prevVal + ns.getServerMaxRam( server ), 0 );
}

/**
 * @description Calculates the accumulated used RAM across a pool of servers.
 * @param {NS} ns - An NS object.
 * @param {string[]} pool - List of servers to either exclude or include from scan.
 * @param {string} poolType - Whether or not to include or exclude the servers in `pool`. Must be either "EXCLUDE" or "INCLUDE".
 * @returns The accumulated used RAM across the given servers in gigabytes.
 */
export function accumulatedUsedRam ( ns, servers ) {
    return servers.reduce( ( prevVal, server ) => prevVal + ns.getServerUsedRam( server ), 0 );
}

/**
 * @description Calculates the accumulated free RAM across a pool of servers.
 * @param {NS} ns - An NS object.
 * @param {string[]} pool - List of servers to either exclude or include from scan.
 * @param {string} poolType - Whether or not to include or exclude the servers in `pool`. Must be either "EXCLUDE" or "INCLUDE".
 * @returns The accumulated free RAM across the given servers in gigabytes.
 */
export function accumulatedFreeRam ( ns, servers ) {
    return servers.reduce( ( prevVal, server ) => prevVal + ns.getServerMaxRam( server ) - ns.getServerUsedRam( server ), 0 );
}

/**
 * @description Executes a script across a group of servers. Executes the script with the maximum amount of threads on a given server considering that server's free RAM and whether or not the desired number of threads has already been reached.
 * @param {NS} ns - An NS object.
 * @param {string[]} pool - List of servers to either exclude or include from scan.
 * @param {string} poolType - Whether or not to include or exclude the servers in `pool`. Must be either "EXCLUDE" or "INCLUDE".
 * @returns 
 */
export function accumulativeExec ( ns, script, threads, servers, ...argz ) {
    let accumulatedThreads = 0;
    let nodes = [];

    for ( let i = 0; i < servers.length && accumulatedThreads < threads; i++ ) {
        let availableThreads = Math.floor( ( ns.getServerMaxRam( servers[i] ) - ns.getServerUsedRam( servers[i] ) ) / ns.getScriptRam( script ) );

        if ( availableThreads > 0 ) {
            let maxThreads = availableThreads > threads - accumulatedThreads ? threads - accumulatedThreads : availableThreads;

            ns.exec( script, servers[i], maxThreads, ...argz );
            accumulatedThreads += maxThreads;
            nodes.push( servers[i] );
        }
    }

    return nodes;
}