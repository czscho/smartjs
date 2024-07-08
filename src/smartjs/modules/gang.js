import * as SJS from "/smartjs/lib/common";
import { NamingSystemType, NamingSystemTypeLabels, FundType, FundTypeLabels } from "/smartjs/lib/smartmodule";

function GangModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Gang" );

    let n = 0;
    let usedNames = [];
    let info = {};
    let lowerWantedLevelSlots = 0;

    m.expose( "Gang.List", () => {
        return info.otherGangNames && { status: 0, data: [ ...info.otherGangNames ], message: "ok" } || { status: 1, message: "error: no info yet" };
    } );

    m.expose( "Gang.Info", ( _, name ) => {
        if ( info ) {
            let d = info.gangInfo || {};

            if ( name ) {
                if ( info.otherGangInfo[ name ] ) {
                    d = info.otherGangInfo[ name ];
                } else {
                    return { status: 1, message: "error: info pending" };
                }
            }

            return { status: 0, data: d, message: "ok" };
        }

        return { status: 1, data: null, message: "error: info pending" };
    } );

    m.expose( "Gang.Members.List", () => {
        return info && info.members && { status: 0, data: info.memberNames, message: "ok" } || { status: 1, message: "error: no info yet" };
    } );

    m.expose( "Gang.Members.Info", ( _, name ) => {
        return info && info.members && { status: 0, data: name && info.members[ name ] || info.members, message: "ok" } || { status: 1, message: "error: no info yet" };
    } );

    m.expose( "Gang.GetState", () => ( { status: 0, data: info, message: "ok" } ) );

    m.options( [ 
        m.mkStringOption( "Faction", "Slum Snakes", { label: "Faction", description: "The faction to create a gang with, if you have not already created a gang." } ),
        m.mkEnumOption( "NamingSystem", NamingSystemType, NamingSystemType.INCR, { label: "Naming system", description: "How to go about naming new members. Can either append an incrementing number to a given prefix, or draw from a pool of unique names. Must be set to one of INCR or UNIQUE.", labels: NamingSystemTypeLabels } ),
        m.mkStringOption( "NamingPrefix", "Horseman ", { label: "Naming prefix", description: "The prefix to use when naming new members. Used when Naming System is set to INCR." } ),
        m.mkArrOption( "NamingPool", [ "Alex", "Bob", "Christine", "Destiny", "Ernest", "Fynn", "Gina", "Hannah", "Ian", "John", "Karen", "Lena", "Max", "Noah", "Octavia", "Paige" ], { label: "Naming pool", description: "The pool of unique names drawn from when naming new members. Used when Naming System is set to UNIQUE." } ),
        m.mkFloatOption( "EquipmentFund", 1, { label: "Equipment fund", description: "The amount of money to use for buying equipment. Can be interpereted as either a decimal percentage or a flat amount. If interpereted as a decimal percentage, this value will be multiplied by the player's total amount of money to determince the size of this fund." } ),
        m.mkEnumOption( "EquipmentFundType", FundType, FundType.PERCENT, { label: "Type of equipment fund", description: "Whether or not to interperet Equipment Fund as a decimal percentage or flat amount.", labels: FundTypeLabels } ),
        m.mkArrOption( "DesiredEquipment", [ "Baseball Bat", "Katana", "Glock 18C", "P90C", "Steyr AUG", "AK-47", "M15A10 Assault Rifle", "AWM Sniper Rifle", "Bulletproof Vest", "Full Body Armor", "Liquid Body Armor", "Graphene Plating Armor", "Ford Flex V20", "ATX1070 Superbike", "White Ferrari", "Mercedes-Benz S9001", "NUKE Rootkit", "Soulstealer Rootkit", "Demon Rootkit", "Hmap Node", "Jack the Ripper", "Bionic Arms", "Bionic Legs", "Bionic Spine", "BrachiBlades", "Nanofiber Weave", "Synthetic Heart", "Synfibril Muscle", "BitWire", "Neuralstimulator", "DataJack", "Graphene Bone Lacings" ], { label: "Desired equipment", description: "Equipment desired for each member." } ),
        m.mkIntOption( "LowerWantedLevelSlots", 2, { label: "Slots for lowering wanted level", description: "Number of members to assign tasks that lower wanted level." } ),
        m.mkIntOption( "TerritoryWarfareSlots", 0, { label: "Slots for territory warfare", description: "Number of members to assign to fight for territory." } )
    ] );

    m.init( async () => {
        m.bus().loop( () => {
            if ( !info.gangInfo ) {
                return true;
            }
    
            if ( info.gangInfo.wantedLevelGainRate > 0 ) {
                lowerWantedLevelSlots++;
            } else {
                lowerWantedLevelSlots--;
            }
    
            return true;
        }, 15_000 );
    } );

    m.update( async ctx => {
        const player = ns.getPlayer();
        
        info.karma = ns.heart.break();

        if ( !ns.gang.inGang() && info.karma <= -54000 ) {
            if ( player.factions.includes( await m.get("Faction") ) ) {
                if ( !ns.gang.createGang( await m.get("Faction") ) ) {
                    m.error(`could not create gang under ${ await m.get("Faction") }.`);
                }
            }
        }

        if ( ns.gang.inGang() ) {
            if ( ns.gang.canRecruitMember() ) {
                if ( await m.get("NamingSystem") == NamingSystemType.INCR ) {
                    ns.gang.recruitMember(`${ await m.get("NamingPrefix") }${ n++ }`);
                } else {
                    let available = ( await m.get("NamingPool") ).filter( name => !usedNames.includes( name ) );
                    let name = available[ Math.floor( Math.random() * available.length ) ];

                    ns.gang.recruitMember( name );
                    m.info(`recruited new member ${ name }`);
                }
            }

            info.gangInfo = ns.gang.getGangInformation();
            info.otherGangInfo = ns.gang.getOtherGangInformation();
            info.otherGangNames = Object.keys( info.otherGangInfo );
            info.memberNames = ns.gang.getMemberNames();
            info.members = {};
            info.memberNames.forEach( name => info.members[ name ] = ns.gang.getMemberInformation( name ) );
            info.n = n;

            let equipmentFund = await m.get("EquipmentFundType") == FundType.PERCENT ? await m.get("EquipmentFund") * player.money : await m.get("EquipmentFund");

            info.memberNames.forEach( async ( name, index ) => {
                let ascensionInfo = ns.gang.getAscensionResult( name );
                let memberInfo = ns.gang.getMemberInformation( name );

                if ( info.gangInfo.isHacking ) {
                    if ( ascensionInfo && ascensionInfo.hack >= 1.1 ) {
                        ns.gang.ascendMember( name );
                        memberInfo = ns.gang.getMemberInformation( name );
                    }
                    
                    if ( memberInfo.hack < 100 ) {
                        if ( memberInfo.task != "Train Hacking" )
                            ns.gang.setMemberTask( name, "Train Hacking" );
                    } else if ( index < lowerWantedLevelSlots ) {
                        if ( memberInfo.task != "Ethical Hacking" )
                            ns.gang.setMemberTask( name, "Ethical Hacking" );
                    } else if ( memberInfo.task != "Money Laundering" ) {
                        ns.gang.setMemberTask( name, "Money Laundering" );
                    }
                } else {
                    if ( ascensionInfo && ( /*ascensionInfo.agi >= 1.05 ||*/ ascensionInfo.def >= 1.05 || ascensionInfo.dex >= 1.05 || ascensionInfo.str >= 1.05 ) ) {
                        ns.gang.ascendMember( name );
                        memberInfo = ns.gang.getMemberInformation( name );
                    }
                    
                    if ( /*memberInfo.agi < 100 ||*/ memberInfo.def < 100 || memberInfo.dex < 100 || memberInfo.str < 100 ) {
                        if ( memberInfo.task != "Train Combat" ) {
                            ns.gang.setMemberTask( name, "Train Combat" );
                        }
                    } else if ( index < await m.get("LowerWantedLevelSlots") ) {
                        if ( memberInfo.task != "Vigilante Justice" ) {
                            ns.gang.setMemberTask( name, "Vigilante Justice" );
                        }
                    } else if ( index > await m.get("LowerWantedLevelSlots") && index >= info.memberNames.length - await m.get("TerritoryWarfareSlots") ) {
                        if ( memberInfo.task != "Territory Warfare" ) {
                            ns.gang.setMemberTask( name, "Territory Warfare" );
                        }
                    } else if ( /*memberInfo.agi < 200 ||*/ memberInfo.def < 200 || memberInfo.dex < 200 || memberInfo.str < 200 ) {
                        if ( memberInfo.task != "Armed Robbery" ) {
                            ns.gang.setMemberTask( name, "Armed Robbery" );
                        }
                    } else if ( /*memberInfo.agi < 300 ||*/ memberInfo.def < 300 || memberInfo.dex < 300 || memberInfo.str < 300 ) {
                        if ( memberInfo.task != "Traffick Illegal Arms" ) {
                            ns.gang.setMemberTask( name, "Traffick Illegal Arms" );
                        }
                    } else if ( memberInfo.task != "Human Trafficking" ) {
                        ns.gang.setMemberTask( name, "Human Trafficking" );
                    }
                }

                ( await m.get("DesiredEquipment") ).forEach( piece => {
                    let cost = ns.gang.getEquipmentCost( piece );

                    if ( !memberInfo.upgrades.includes( piece ) && !memberInfo.augmentations.includes( piece ) && cost <= equipmentFund ) {
                        ns.gang.purchaseEquipment( name, piece );
                        equipmentFund -= cost;
                        m.info(`purchased ${ piece } for ${ name } for $${ SJS.Util.Format.nfmt( cost, "0.00a" ) }`);
                    }
                } );
            } );

            /*if ( info.otherGangNames.some( name => info.otherGangInfo[ name ].clashWinChance < 0.75 ) ) {
                ns.gang.setTerritoryWarfare(false);
            } else {
                ns.gang.setTerritoryWarfare(true);
            }*/
        }
    } );

    return m.finalize();
}

export { GangModule as init };