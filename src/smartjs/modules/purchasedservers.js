import * as SJS from "/smartjs/lib/common";
import { FundType, FundTypeLabels } from "/smartjs/lib/smartmodule";

function PurchasedServersModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "PurchasedServers" );

    let n = 0;
    let state = {};

    m.expose( "PurchasedServers.GetState", () => ( { status: 0, data: state, message: "ok" } ) );

    m.options( [
        m.mkFloatOption( "Fund", 0.9, { label: "Fund", description: "The amount of money to use for purchasing and upgrading servers. Can either be a fixed amount or a decimal percentage to multiply by the player's money." } ),
        m.mkEnumOption( "FundType", FundType, FundType.PERCENT, { label: "Fund type", description: "Determines whether Fund will be treated as a fixed amount or a decimal percentage to multiply by the player's money. Must be set to either PERCENT or FIXED.", labels: FundTypeLabels } ),
        m.mkIntOption( "MaxServers", 25, { label: "Max servers", description: "Maximum amount of servers to buy." } ),
        m.mkIntOption( "StartingRam", 8, { label: "Starting RAM", description: "The amount of RAM to buy new servers with." } ),
        m.mkIntOption( "MaxRam", 8192, { label: "Max RAM", description: "The maximum amount of RAM to upgrade servers to." } ),
        m.mkStringOption( "NamingPrefix", "pserv", { label: "Naming prefix", description: "The prefix to name purchased servers with. A purchased server's name will be set to this prefix with i appended to the end, where i is the number of purchased servers at the time." } ),
        m.mkBoolOption( "EnableUi", true, { label: "Enable UI", description: "Whether or not to enable the UI." } )
    ] );
    
    m.init( () => {
        if ( ns.getResetInfo().currentNode == 9 ) return;
    } );

    m.update( async ctx => {
        if ( ns.getResetInfo().currentNode == 9 ) return;

        let player = ns.getPlayer();
        let servers = ns.getPurchasedServers();

        n = servers.length;
        
        let fund = await m.get("FundType") == FundType.PERCENT ? await m.get("Fund") * player.money : await m.get("Fund");
        let cost = ns.getPurchasedServerCost( await m.get("StartingRam") );

        while ( cost <= fund && ns.getPurchasedServers().length < await m.get("MaxServers") ) {
            let name;
            let res = ns.purchaseServer( `${ name = ( await m.get("NamingPrefix") + n++ ) }`, await m.get("StartingRam") );

            m.info( `purchasing server '${ name }' with ${ SJS.Util.Format.nfmt( await m.get("StartingRam") * 1_000_000_000, "0.00b" ) }` );
            
            if ( res ) {
                fund -= cost;
            } else {
                break;
            }
        }

        servers = ns.getPurchasedServers();

        for ( let i = 0; i < servers.length; i++ ) {
            let ram = ns.getServerMaxRam( servers[i] );

            if ( ram >= await m.get("MaxRam") ) {
                continue;
            }

            let upgradedRam = ram * 2;
            let cost = ns.getPurchasedServerUpgradeCost( servers[i], upgradedRam );

            if ( cost <= fund ) {
                while ( ns.getPurchasedServerUpgradeCost( servers[i], upgradedRam * 2 ) <= fund && upgradedRam * 2 <= await m.get("MaxRam") ) {
                    upgradedRam *= 2;
                    cost = ns.getPurchasedServerUpgradeCost( servers[i], upgradedRam );
                }
    
                m.info( `upgrading ${servers[i]} from ${ram}GB to ${upgradedRam}GB for $${ SJS.Util.Format.nfmt( cost, "0.00a" ) }` );
                ns.upgradePurchasedServer( servers[i], upgradedRam );
                fund -= cost;
            }
        }

        let serverInfo = [];

        for ( let i = 0; i < servers.length; i++ ) {
            let maxRam = ns.getServerMaxRam( servers[i] );
            let upgradeCost = ns.getPurchasedServerUpgradeCost( servers[i], maxRam * 2 );

            serverInfo.push( {
                hostname: servers[i],
                usedRam: ns.getServerUsedRam( servers[i] ),
                maxRam: maxRam,
                upgradeCost: upgradeCost == "Infinity" ? "Fully upgraded" : upgradeCost
            } );
        }

        state = {
            serverCost: ns.getPurchasedServerCost( await m.get("StartingRam") ),
            startingRam: await m.get("StartingRam"),
            servers: serverInfo
        };
    } );
    return m.finalize();
}

export { PurchasedServersModule as init };