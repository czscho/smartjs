import * as SJS from "/smartjs/lib/common";

function FundManagerModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "FundManager" );

    let p;
    let info = {
        fundKeys: [],
        funds: {}
    };

    function _createFund ( share ) {
        let key = SJS.Util.generateUUID();
        let fund = {};
        info.fundKeys.push( key );
        return info.funds[ key ] = fund;
    }

    m.expose( "FundManager.Info", () => {} );

    m.expose( "FundManager.CreateFund", args => {
        if ( args.type == "fixed" ) {
            //
        } else if ( args.type == "percent" ) {
            //
        }
    } );

    m.expose( "FundManager.RefreshFund", args => {
        //
    } );

    m.expose( "FundManager.ReleaseFund", () => {} );

    m.init( () => {
        //
    } );

    m.update( ctx => {
        //
    } );
    return m.finalize();
}

export { FundManagerModule as init };