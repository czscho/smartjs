import { TabWrapper } from "/smartjs/lib/ui/tabwrapper";

function StocksTab ( registrar ) {
    const w = TabWrapper( registrar, "Stocks" );

    w.title("STOCKS");
    w.activationKey("STOCKS");
    w.content( props => {
        return React.createElement( "div", {} );
    } );
    return w.finalize();
}

export { StocksTab as init };