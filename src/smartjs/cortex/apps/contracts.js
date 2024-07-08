import { AppWrapper } from "/smartjs/cortex/lib/appwrapper";
import { Scrollable } from "/smartjs/cortex/lib/components/scrollable";

async function ContractsApp ( ns ) {
    const w = await AppWrapper( ns, "Contracts" );
    const scrollable = Scrollable();
    const contractsMap = {};

    w.bus().loop( async () => {
        let state = await w.rpc("Contracts.GetContracts");
        if ( !state ) return;
        Object.keys( state ).forEach( key => contractsMap[ key ] = state[ key ] );
        w.refresh();
    }, 1000 );
    w.title("Contracts");
    w.content( () => {
        let incompleteData = [];
        let completedData = [];

        Object.keys( contractsMap ).forEach( filename => {
            let info = contractsMap[ filename ];

            if ( info.solved ) {
                completedData.push(
                    React.createElement( "tr", {},
                        React.createElement( "td", {}, info.server ),
                        React.createElement( "td", {}, info.file ),
                        React.createElement( "td", {}, info.type ),
                        React.createElement( "td", {}, info.attempts )
                    ) );
            } else {
                incompleteData.push(
                    React.createElement( "tr", {},
                        React.createElement( "td", {}, info.server ),
                        React.createElement( "td", {}, info.file ),
                        React.createElement( "td", {}, info.type ),
                        React.createElement( "td", {}, info.attempts )
                    ) );
            }
        } );

        return React.createElement( scrollable.element,
            {
                style: {
                    maxHeight: "512px",
                    maxWidth: "800px"
                }
            },
            React.createElement( "div",
                {
                    style: {
                        margin: "8px 0 8px 0",
                        padding: 0
                    }
                },
                React.createElement( "b", {}, "INCOMPLETE: " ),
                incompleteData.length
            ),
            React.createElement( "table",
                {
                    class: "cortex-infotable",
                    style: {
                        width: "100%"
                    }
                },
                React.createElement( "tr",
                    {
                        style: {
                            textAlign: "center",
                            border: "1px solid green",
                            maxWidth: "400px"
                        }
                    },
                    React.createElement( "th", {}, "SERVER" ),
                    React.createElement( "th", {}, "FILENAME" ),
                    React.createElement( "th", {}, "TYPE" ),
                    React.createElement( "th", {}, "TRIES" )
                ),
                React.createElement( "tr",
                    {
                        style: {
                            height: "8px"
                        }
                    }
                ),
                ...incompleteData
            ),
            React.createElement( "div",
                {
                    style: {
                        margin: "8px 0 8px 0",
                        padding: 0
                    }
                },
                React.createElement( "b", {}, "COMPLETED: " ),
                completedData.length
            ),
            React.createElement( "table",
                {
                    class: "cortex-infotable",
                    style: {
                        width: "100%"
                    }
                },
                React.createElement( "tr",
                    {
                        style: {
                            textAlign: "center",
                            border: "1px solid green"
                        }
                    },
                    React.createElement( "th", {}, "SERVER" ),
                    React.createElement( "th", {}, "FILENAME" ),
                    React.createElement( "th", {}, "TYPE" ),
                    React.createElement( "th", {}, "TRIES" )
                ),
                React.createElement( "tr",
                    {
                        style: {
                            height: "8px"
                        }
                    }
                ),
                ...completedData
            )
        );
    } );
    return w.finalize();
}

export { ContractsApp as init };