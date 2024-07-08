import * as SJS from "/smartjs/lib/common";
import { FundType, FundTypeLabels } from "/smartjs/lib/smartmodule";

function StocksModule ( registrar, nse ) {
    const m = SJS.Modules.Module( registrar, "Stocks" );

    m.options( [
        m.mkFloatOption( "Fund", 0.1, { label: "Fund", description: "Amount of money to use for trading stocks. Can be interpereted as either a decimal percentage or a flat amount." } ),
        m.mkEnumOption( "FundType", FundType, FundType.PERCENT, { label: "Fund type", description: "Whether or not to interperet Fund as a decimal percentage or a flat amount.", labels: FundTypeLabels } )
    ] );
    
    m.init( async () => {
        //
    } );

    m.update( () => {
        //
    } );

    return m.finalize();
}

export { StocksModule as init };