import * as SJS from "/smartjs/lib/common";
import { FundType, FundTypeLabels, TargetSelectionType, TargetSelectionTypeLabels } from "/smartjs/lib/smartmodule";

function HacknetModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Hacknet" );

    let info = {};
    let player;
    let buyFund;
    let refreshBuyFundInterval;
    let upgradeFund;
    let refreshUpgradeFundInterval;

    async function sellHashes () {
        let fund = await m.get("Hashes.SellFundType") == FundType.PERCENT ? await m.get("Hashes.SellFund") * ns.hacknet.numHashes() : await m.get("Hashes.SellFund");
        let total = 0;

        while ( fund >= 4 ) {
            ns.hacknet.spendHashes("Sell for Money");
            fund -= 4;
            total += 4;
        }

        m.info(`selling ${ total } hashes for $${ SJS.Util.Format.nfmt( total / 4 * 1_000_000, "0.00a" ) }`);
    }

    async function sellForCorpFunds () {
        // TODO
    }

    async function reduceSecurity ( servers ) {
        let fund = await m.get("Hashes.ReduceSecurityFundType") == FundType.PERCENT ? await m.get("Hashes.ReduceSecurityFund") * ns.hacknet.numHashes() : await m.get("Hashes.ReduceSecurityFund");
        let cost = ns.hacknet.hashCost("Reduce Minimum Security");

        // TODO: expand target selection options
        let targets = [];

        if ( await m.get("Hashes.ReduceSecurityTarget") != "" )
            targets = [ await m.get("Hashes.ReduceSecurityTarget") ];
        else if ( await m.get("Hashes.ReduceSecurityTargetAlgo") == TargetSelectionType.HMOT ) {
            for ( let i = 0; i < await m.get("Hashes.ReduceSecurityTargetLimit"); i++ ) {
                let highest = {
                    mot: 0
                };

                for ( let j = 0; j < servers.length; j++ ) {
                    if ( ns.getHackingLevel() >= ns.getServerRequiredHackingLevel( servers[j] ) &&
                         servers[j] != "home" &&
                         !targets.some( targ => targ.target == servers[j] ) ) {
                        let mot = ns.hackAnalyze( servers[j] ) * ns.getServerMaxMoney( servers[j] ) / ns.getHackTime( servers[j] );

                        if ( mot > highest.mot ) {
                            highest = {
                                index: j,
                                mot: mot
                            };
                        }
                    }
                }
                
                if ( highest.mot > 0 ) {
                    targets.push( {
                        target: servers[ highest.index ],
                        count: 0
                    } );
                    servers = servers.filter( ( _, index ) => index != highest.index );
                } else {
                    break;
                }
            }
        }

        for ( let i = 0; i < targets.length && i < await m.get("Hashes.SimulReduceSecurityLimit"); i++ ) {
            targets[i].count++;
        }

        for ( let i = 0; i < targets.length && fund >= cost; i++ ) {
            for ( let j = 0; j < targets[i].count; j++ ) {
                m.info(`spending ${ numeral( cost ).format("0.00a") } hashes to reduce minimum security for target ${ targets[i].target }`);
                ns.hacknet.spendHashes( "Reduce Minimum Security", targets[i].target );
                fund -= cost;
                m.info(`reduced minimum security of ${ targets[i].target } for ${ numeral( cost ).format("0.00a") } hashes.`);
                cost = ns.hacknet.hashCost("Reduce Minimum Security");
            }
        }
    }

    async function growServers ( servers ) {
        let fund = await m.get("Hashes.GrowServerFundType") == FundType.PERCENT ? await m.get("Hashes.GrowServerFund") * ns.hacknet.numHashes() : await m.get("Hashes.GrowServerFund");
        let cost = ns.hacknet.hashCost("Increase Maximum Money");

        // TODO: expand target selection options
        let targets = [];

        if ( await m.get("Hashes.GrowServerTarget") != "" )
            targets = [ await m.get("Hashes.GrowServerTarget") ];
        else if ( await m.get("Hashes.GrowServerTargetAlgo") == TargetSelectionType.HMOT ) {
            for ( let i = 0; i < await m.get("Hashes.GrowServerTargetLimit"); i++ ) {
                let highest = {
                    mot: 0
                };

                for ( let j = 0; j < servers.length; j++ ) {
                    if ( ns.getHackingLevel() >= ns.getServerRequiredHackingLevel( servers[j] ) &&
                         servers[j] != "home" &&
                         !targets.some( targ => targ.target == servers[j] ) ) {
                        let mot = ns.hackAnalyze( servers[j] ) * ns.getServerMaxMoney( servers[j] ) / ns.getHackTime( servers[j] );

                        if ( mot > highest.mot ) {
                            highest = {
                                index: j,
                                mot: mot
                            };
                        }
                    }
                }
                
                if ( highest.mot > 0 ) {
                    targets.push( {
                        target: servers[highest.index],
                        count: 0
                    } );
                    servers = servers.filter( ( _, index ) => index != highest.index );
                } else {
                    break;
                }
            }
        }

        for ( let i = 0; i < targets.length && i < await m.get("Hashes.SimulGrowServerLimit"); i++ ) {
            targets[i].count++;
        }

        for ( let i = 0; i < targets.length && fund >= cost; i++ ) {
            for ( let j = 0; j < targets[i].count; j++ ) {
                m.info(`spending ${ numeral( cost ).format("0.00a") } hashes to increase maximum money for target ${ targets[i].target }`);
                ns.hacknet.spendHashes( "Increase Maximum Money", targets[i].target );
                m.info(`increased maximum money for ${ targets[i].target } for ${ numeral( cost ).format("0.00a") } hashes.`);
                fund -= cost;
                cost = ns.hacknet.hashCost("Increase Maximum Money");
            }
        }
    }

    async function maintainRefreshBuyFundLoop () {
        if ( refreshBuyFundInterval != await m.get("AutoRefreshBuyFundInterval") ) {
            refreshBuyFundInterval = await m.get("AutoRefreshBuyFundInterval");
            m.bus().loop( maintainRefreshBuyFundLoop, refreshBuyFundInterval );
            return false;
        }

        buyFund = await m.get("BuyFundType") == FundType.PERCENT ? await m.get("BuyFund") * player.money : await m.get("BuyFund");
        return true;
    }

    async function maintainRefreshUpgradeFundLoop () {
        if ( refreshUpgradeFundInterval != await m.get("AutoRefreshUpgradeFundInterval") ) {
            refreshUpgradeFundInterval = await m.get("AutoRefreshUpgradeFundInterval");
            m.bus().loop( maintainRefreshUpgradeFundLoop, refreshUpgradeFundInterval );
            return false;
        }

        upgradeFund = await m.get("UpgradeFundType") == FundType.PERCENT ? await m.get("UpgradeFund") * player.money : await m.get("UpgradeFund");
        return true;
    }

    m.expose( "Hacknet.GetState", () => ( { status: 0, data: info, message: "ok" } ) );

    m.options( [
        // Node purchasing/upgrading options
        m.mkIntOption( "BuyPriority", 0, { label: "Buy Priority", description: "The priority to assign to buying new nodes." } ),
        m.mkFloatOption( "BuyFund", 1, { label: "Buy Priority", description: "The amount of money to use for buying new nodes." } ),
        m.mkBoolOption( "AutoRefreshBuyFund", true, { label: "Auto refresh buy fund", description: "Whether or not to automatically refresh the amount of money to use for buying new nodes." } ),
        m.mkIntOption( "AutoRefreshBuyFundInterval", 5, { label: "Auto refresh buy fund interval", description: "The interval at which to refresh the amount of money to use for buying new nodes." } ),
        m.mkEnumOption( "BuyFundType", FundType, FundType.PERCENT, { label: "Type of buy fund", description: "Determines whether the amount of money to use for buying new nodes will be interpereted as a decimal percentage or flat amount.", labels: FundTypeLabels } ),
        m.mkIntOption( "BuyLimit", 6, { label: "Buy limit", description: "The maximum amount of nodes to buy." } ),
        m.mkIntOption( "SimulBuyLimit", 3, { label: "Simultaneous buy limit", description: "The maximum amount of nodes to buy at once." } ),
        m.mkFloatOption( "UpgradeFund", 1, { label: "Upgrade fund", description: "The amount of money to use for upgrading nodes." } ),
        m.mkBoolOption( "AutoRefreshUpgradeFund", true, { label: "Auto refresh upgrade fund", description: "Whether or not to automatically refresh the amount of money to use for upgrading nodes." } ),
        m.mkIntOption( "AutoRefreshUpgradeFundInterval", 5, { label: "Auto refresh upgrade fund interval", description: "The interval at which to refresh the amount of money to use for upgrading nodes." } ),
        m.mkEnumOption( "UpgradeFundType", FundType, FundType.PERCENT, { label: "Upgrade fund type", description: "Determines whether or not to interperet the upgrade fund as a decimal percentage or flat amount.", labels: FundTypeLabels } ),
        m.mkIntOption( "UpgradeLevelPriority", 1, { label: "Upgrade level priority", description: "The priority to assign to upgrading node levels." } ),
        m.mkIntOption( "UpgradeLevelLimit", 100, { label: "Upgrade level limit", description: "The maximum amount of levels to upgrade nodes to." } ),
        m.mkIntOption( "SimulUpgradeLevelLimit", 3, { label: "Simultaneous upgrade level limit", description: "The maximum amount of levels to upgrade nodes by at once." } ),
        m.mkIntOption( "UpgradeRamPriority", 2, { label: "Upgrade RAM priority", description: "The priority to assign to upgrading node RAM." } ),
        m.mkIntOption( "UpgradeRamLimit", 8192, { label: "Upgrade RAM limit", description: "The maximum amount of RAM to upgrade nodes to." } ),
        m.mkIntOption( "SimulUpgradeRamLimit", 1, { label: "Simultaneous upgrade RAM limit", description: "The maximum amount of times to upgrade a node's RAM at one time." } ),
        m.mkIntOption( "UpgradeCorePriority", 3, { label: "Upgrade core priority", description: "The priority to assign to upgrading a node's cores." } ),
        m.mkIntOption( "UpgradeCoreLimit", 24, { label: "Upgrade core limit", description: "The maximum amount of cores to purchase for a node." } ),
        m.mkIntOption( "SimulUpgradeCoreLimit", 1, { label: "Simultaneous upgrade core limit", description: "The maximum amount of cores to purchase for a node at one time." } ),
        m.mkIntOption( "UpgradeCacheLevelPriority", 4, { label: "Upgrade cache priority", description: "The priority to assign to upgrading a node's cache." } ),
        m.mkIntOption( "UpgradeCacheLevelLimit", 10, { label: "Upgrade cache limit", description: "The maximum level to upgrade a node's cache to." } ),
        m.mkIntOption( "SimulUpgradeCacheLevelLimit", 1, { label: "Simultaneous upgrade cache limit", description: "The maximum amount of times to upgrade a node's cache at one time." } ),
        // Hash management options
        m.mkBoolOption( "Hashes.Enable", false, { label: "Enable hashes", description: "Whether or not to manage the selling of hashes." } ),
        m.mkFloatOption( "Hashes.TriggerAmount", 10_000, { label: "Hash trigger amount", description: "The amount of hashes at which to begin selling." } ),
        m.mkIntOption( "Hashes.SellPriority", 0, { label: "'Sell hash' priority", description: "The priority to assign to selling hashes for money." } ),
        m.mkFloatOption( "Hashes.SellFund", 0.5, { label: "'Sell hash' fund", description: "The amount of hashes to sell for money." } ),
        m.mkEnumOption( "Hashes.SellFundType", FundType, FundType.PERCENT, { label: "Type of 'Sell hash' fund", description: "Whether or not to interperet the 'Sell hash' fund as a decimal percentage or flat amount.", labels: FundTypeLabels } ),
        m.mkIntOption( "Hashes.SimulSellLimit", 15, { label: "Simultaneous 'Sell hash' limit", description: "The maximum amount of times to sell hashes for money at one time." } ),
        m.mkIntOption( "Hashes.SellForCorpFundsPriority", 1, { label: "'Sell for corp funds' priority", description: "The priority to assign to selling hashes for corporation funds." } ),
        m.mkFloatOption( "Hashes.SellForCorpFundsFund", 0.1, { label: "'Sell for corp funds' fund", description: "The amount of hashes to sell for corporation funds." } ),
        m.mkEnumOption( "Hashes.SellForCorpFundsFundType", FundType, FundType.PERCENT, { label: "Type of 'Sell for corp funds' fund", description: "Whether or not to interperet the 'Sell for corp funds' fund as a decimal percentage or a flat amount.", labels: FundTypeLabels } ),
        m.mkIntOption( "Hashes.ReduceSecurityPriority", 2, { label: "'Reduce security' priority", description: "The priority to assign to selling hashes for reducing a server's minimum security." } ),
        m.mkFloatOption( "Hashes.ReduceSecurityFund", 0.1, { label: "'Reduce security' fund", description: "The amount of hashes to sell for reducing a server's minimum security." } ),
        m.mkEnumOption( "Hashes.ReduceSecurityFundType", FundType, FundType.PERCENT, { label: "Type of 'Reduce security' fund", description: "Whether or not to interperet the 'Reduce security' fund as a decimal percentage or a flat amount.", labels: FundTypeLabels } ),
        m.mkStringOption( "Hashes.ReduceSecurityTarget", "", { label: "'Reduce security' target", description: "The server to reduce the minimum security of." } ),
        m.mkEnumOption( "Hashes.ReduceSecurityTargetAlgo", TargetSelectionType.HMOT, { label: "'Reduce security' target selection", description: "The method with which to choose a target to reduce the minimum security of.", labels: TargetSelectionTypeLabels } ),
        m.mkIntOption( "Hashes.ReduceSecurityTargetLimit", 5, { label: "'Reduce security' target limit", description: "The maximum number of targets to select to reduce the minimum security of." } ),
        m.mkIntOption( "Hashes.SimulReduceSecurityLimit", 5, { label: "Simultaneous 'Reduce security' limit", description: "The maximum amount of times to reduce the security of a target at one time." } ),
        m.mkIntOption( "Hashes.GrowServerPriority", 3, { label: "'Grow server' priority", description: "The priority to assign to growing a server's money." } ),
        m.mkFloatOption( "Hashes.GrowServerFund", 0.1, { label: "'Grow server' fund", description: "The amount of hashes to sell for growing a server's money." } ),
        m.mkEnumOption( "Hashes.GrowServerFundType", FundType, FundType.PERCENT, { label: "Type of 'Grow server' fund", description: "Whether or not to interperet the 'Grow server' fund as a decimal percentage or a flat amount.", labels: FundTypeLabels } ),
        m.mkStringOption( "Hashes.GrowServerTarget", "", { label: "'Grow server' target", description: "The server to grow money for." } ),
        m.mkEnumOption( "Hashes.GrowServerTargetAlgo", TargetSelectionType, TargetSelectionType.HMOT, { label: "'Grow server' target selection", description: "The method with which to choose a target to grow the money of.", labels: TargetSelectionTypeLabels } ),
        m.mkIntOption( "Hashes.GrowServerTargetLimit", 3, { label: "'Grow server' target limit", description: "The maximum amount of targets to select to grow the money of." } ),
        m.mkIntOption( "Hashes.SimulGrowServerLimit", 5, { label: "Simultaneous 'Grow server' limit", description: "The maximum amount of times to grow a server's money at one time." } )
    ] );

    m.init( async () => {
        player = ns.getPlayer();
        buyFund = await m.get("BuyFundType") == FundType.PERCENT ? await m.get("BuyFund") * player.money : await m.get("BuyFund");
        refreshBuyFundInterval = await m.get("AutoRefreshBuyFundInterval");
        upgradeFund = await m.get("UpgradeFundType") == FundType.PERCENT ? await m.get("UpgradeFund") * player.money : await m.get("UpgradeFund");
        refreshUpgradeFundInterval = await m.get("AutoRefreshUpgradeFundInterval");

        m.bus().loop( maintainRefreshBuyFundLoop, refreshBuyFundInterval );
        m.bus().loop( maintainRefreshUpgradeFundLoop, refreshUpgradeFundInterval );
    } );

    m.update( async ctx => {
        player = ns.getPlayer();
        info = {
            purchaseNodeCost: ns.hacknet.getPurchaseNodeCost(),
            nodes: "x".repeat( ns.hacknet.numNodes() ).split("").map( ( _, i ) => {
                let levelUpgradeCost = ns.hacknet.getLevelUpgradeCost( i );
                let ramUpgradeCost = ns.hacknet.getRamUpgradeCost( i );
                let coresUpgradeCost = ns.hacknet.getCoreUpgradeCost( i );
                let cacheUpgradeCost = ns.hacknet.getCacheUpgradeCost( i );
                
                return {
                    stats: ns.hacknet.getNodeStats( i ),
                    costs: {
                        levelUpgradeCost,
                        ramUpgradeCost,
                        coresUpgradeCost,
                        cacheUpgradeCost
                    }
                };
            } )
        };

        if ( info.nodes[0] && info.nodes[0].stats.name.startsWith("hacknet-server") ) {
            info.hashes = ns.hacknet.numHashes();
            info.hashCapacity = ns.hacknet.hashCapacity();
        }

        let tasks = [ {
            callback: async () => {
                for ( let i = 0; i < await m.get("SimulBuyLimit") && info.purchaseNodeCost <= buyFund && ns.hacknet.numNodes() < await m.get("BuyLimit"); i++ ) {
                    ns.hacknet.purchaseNode();
                    buyFund -= info.purchaseNodeCost;
                    info.purchaseNodeCost = ns.hacknet.getPurchaseNodeCost();
                }
            },
            priority: await m.get("BuyPriority")
        }, {
            callback: async () => {
                for ( let i = 0, node = info.nodes[i]; i < info.nodes.length; node = info.nodes[ ++i ] ) {
                    let prev = node.stats.level;

                    for ( let j = 0; j < await m.get("SimulUpgradeLevelLimit") && node.costs.levelUpgradeCost <= upgradeFund && node.stats.level < await m.get("UpgradeLevelLimit"); j++ ) {
                        ns.hacknet.upgradeLevel( i, 1 );
                        upgradeFund -= node.costs.levelUpgradeCost;
                        node.costs.levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(i);
                        node.stats = ns.hacknet.getNodeStats(i);
                    }

                    if ( prev < node.stats.level ) {
                        m.info(`upgraded node ${i} from level ${prev} to ${node.stats.level} for $${ SJS.Util.Format.nfmt( node.costs.levelUpgradeCost, "0.00a" ) }.`);
                    }
                }
            },
            priority: await m.get("UpgradeLevelPriority")
        }, {
            callback: async () => {
                for ( let i = 0, node = info.nodes[i]; i < info.nodes.length; node = info.nodes[ ++i ] ) {
                    let prev = node.stats.ram;

                    for ( let j = 0; j < await m.get("SimulUpgradeRamLimit") && node.costs.ramUpgradeCost <= upgradeFund && node.stats.ram < await m.get("UpgradeRamLimit"); j++ ) {
                        ns.hacknet.upgradeRam( i, 1 );
                        upgradeFund -= node.costs.ramUpgradeCost;
                        node.costs.ramUpgradeCost = ns.hacknet.getRamUpgradeCost(i);
                        node.stats = ns.hacknet.getNodeStats(i);
                    }

                    if ( prev < node.stats.ram ) {
                        m.info(`upgraded RAM for node ${i} from ${ SJS.Util.Format.nfmt( prev, "0.00b" ) } to $${ SJS.Util.Format.nfmt( node.stats.ram, "0.00b" ) } for $${ SJS.Util.Format.nfmt( node.costs.ramUpgradeCost, "0.00a" ) }.`);
                    }
                }
            },
            priority: await m.get("UpgradeRamPriority")
        }, {
            callback: async () => {
                for ( let i = 0, node = info.nodes[i]; i < info.nodes.length; node = info.nodes[ ++i ] ) {
                    let prev = node.stats.cores;

                    for ( let j = 0; j < await m.get("SimulUpgradeCoreLimit") && node.costs.coresUpgradeCost <= upgradeFund && node.stats.cores < await m.get("UpgradeCoreLimit"); j++ ) {
                        ns.hacknet.upgradeCore( i, 1 );
                        upgradeFund -= node.costs.coresUpgradeCost;
                        node.costs.coresUpgradeCost = ns.hacknet.getCoreUpgradeCost(i);
                        node.stats = ns.hacknet.getNodeStats(i);
                    }

                    if ( prev < node.stats.cores ) {
                        m.info(`upgraded cores for node ${i} from ${prev} to ${node.stats.cores} for $${ SJS.Util.Format.nfmt( node.costs.coresUpgradeCost, "0.00a" ) }.`);
                    }
                }
            },
            priority: await m.get("UpgradeCorePriority")
        }, {
            callback: async () => {
                for ( let i = 0, node = info.nodes[i]; i < info.nodes.length; node = info.nodes[ ++i ] ) {
                    let prev = node.stats.cache;

                    for ( let j = 0; j < await m.get("SimulUpgradeCacheLevelLimit") && node.costs.cacheUpgradeCost <= upgradeFund && node.stats.cache < await m.get("UpgradeCacheLevelLimit"); j++ ) {
                        ns.hacknet.upgradeCache( i, 1 );
                        upgradeFund -= node.costs.cacheUpgradeCost;
                        node.costs.cacheUpgradeCost = ns.hacknet.getCacheUpgradeCost(i);
                        node.stats = ns.hacknet.getNodeStats(i);
                    }

                    if ( prev < node.stats.cache ) {
                        m.info(`upgraded cache for server ${i} from ${prev} to ${node.stats.cache} for $${ SJS.Util.Format.nfmt( node.costs.cacheUpgradeCost, "0.00a" ) }.`);
                    }
                }
            },
            priority: await m.get("UpgradeCacheLevelPriority")
        } ].sort( ( a, b ) => a.priority > b.priority ? 1 : a.priority < b.priority ? -1 : 0 );
        
        for ( let i = 0; i < tasks.length; i++ ) {
            await tasks[i].callback();
        }

        if ( await m.get("Hashes.Enable") && ( ( await m.get("Hashes.TriggerAmount") == 0 && info.hashes == info.hashCapacity ) || ( await m.get("Hashes.TriggerAmount") > 0 && info.hashes >= await m.get("Hashes.TriggerAmount") ) ) ) {
            let hashTasks = [ {
                callback: async () => await sellHashes(),
                priority: await m.get("Hashes.SellPriority")
            }, {
                callback: async () => sellForCorpFunds(),
                priority: await m.get("Hashes.SellForCorpFundsPriority")
            }, {
                callback: async () => await reduceSecurity( ctx.servers ),
                priority: await m.get("Hashes.ReduceSecurityPriority")
            }, {
                callback: async () => await growServers( ctx.servers ),
                priority: await m.get("Hashes.GrowServerPriority")
            } ].sort( ( a, b ) => a.priority > b.priority ? 1 : a.priority < b.priority ? -1 : 0 );
            
            for ( let i = 0; i < hashTasks.length; i++ ) {
                await hashTasks[i].callback();
                info.hashes = ns.hacknet.numHashes();
                info.hashCapacity = ns.hacknet.hashCapacity();
            }
        }
    } );
    return m.finalize();
}

export { HacknetModule as init };