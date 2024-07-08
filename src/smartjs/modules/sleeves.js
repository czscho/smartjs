import * as SJS from "/smartjs/lib/common";

function SleevesModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Sleeves" );

    let info = {};

    function _getInfo (i) {
        return {
            ...ns.sleeve.getSleeve(i),
            task: ns.sleeve.getTask(i),
            installedAugs: ns.sleeve.getSleeveAugmentations(i),
            purchasableAugs: ns.sleeve.getSleevePurchasableAugs(i)
        };
    }

    m.expose( "Sleeves.Info", async ( _, num ) => {
        let r;

        if ( typeof num == "undefined" ) {
            r = "x".repeat( ns.sleeve.getNumSleeves() ).split("").map( ( _, i ) => _getInfo(i) );
            return { status: 0, data: r, message: "ok" };
        }

        r = _getInfo( num );
        return { status: 0, data: r, message: "ok" };
    } );

    m.expose( "Sleeves.GetState", () => ( { status: 0, data: info, message: "ok" } ) );

    m.options( [
        m.mkBoolOption( "EnableWhitelist", false, { label: "Enable whitelist", description: "Whether or not to enable the whitelist." } ),
        m.mkArrOption( "Whitelist", [], { label: "Whitelist", description: "Whitelist of sleeves to manage automatically." } ),
        m.mkBoolOption( "EnableBlacklist", false, { label: "Enable blacklist", description: "Whether or not to enable the whitelist." } ),
        m.mkArrOption( "Blacklist", [], { label: "Blacklist", description: "Blacklist of sleeves to avoid managing automatically." } ),
        m.mkFloatOption( "AugFund", 1, { label: "Augment purchase fund", description: "The amount of money to use for purchasing augments." } ),
        m.mkArrOption( "AugList", 1, { label: "Augment list", description: "List of augments to purchase for each sleeve." } ),
        m.mkBoolOption( "BuyAllAugs", true, { label: "Buy all augments", description: "Whether or not to buy all available augments for sleeves. Overrides 'Augment list.'" } )
    ] );
    
    m.init( () => {
        //
    } );

    m.update( async ctx => {
        info = {
            sleeves: "x".repeat( ns.sleeve.getNumSleeves() ).split("").map( ( _, i ) => _getInfo(i) )
        };

        for ( let i = 0, sleeve = info.sleeves[i]; i < info.sleeves.length; sleeve = info.sleeves[ ++i ] ) {
            for ( let j = 0; j < sleeve.purchasableAugs.length; j++ ) {
                //
            }

            if ( await m.get("EnableWhitelist") && !( await m.get("Whitelist") ).includes(`${i}`) ) {
                continue;
            } else if ( await m.get("EnableBlacklist") && ( await m.get("Blacklist") ).includes(`${i}`) ) {
                continue;
            } else if ( sleeve.sync < 100 && sleeve.task != "Synchronize" ) {
                ns.sleeve.setToSynchronize(i);
            } else if ( sleeve.shock > 0 && sleeve.task != "Shock Recovery" ) {
                ns.sleeve.setToShockRecovery(i);
            } else if ( !sleeve.task ) {
                ns.sleeve.setToCommitCrime( i, "Homicide" );
            }
        }
    } );
    return m.finalize();
}

export { SleevesModule as init };