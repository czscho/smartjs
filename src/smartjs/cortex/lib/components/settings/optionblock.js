import { Proxy } from "/smartjs/lib/proxy";
import { ReactWrapper } from "/smartjs/lib/ui/reactwrapper";

export function OptionBlock ( optDef, value ) {
    const p = Proxy();
    const w = ReactWrapper();

    w.content( () => {
        let input;

        if ( optDef.type == OptionType.BOOL ) {
            input = React.createElement( "div", {} );
        }

        return React.createElement( "li",
            {
                style: {
                    margin: "4px 0 0 0",
                    padding: "4px"
                }
            },
            React.createElement( "h4",
                {
                    style: {
                        display: "inline-block"
                    }
                },
                optDef.key
            ),
            input,
            React.createElement( "div",
                {
                    style: {
                        fontSize: "0.8rem",
                        width: "60%"
                    }
                }
            )
        );
    } );
    return p.final( {
        ...w.finalize()
    } );
}