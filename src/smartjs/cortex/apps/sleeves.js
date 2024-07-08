import { App } from "/smartjs/cortex/lib/app";
import { Util } from "/smartjs/lib/common";
import { CortexDOM } from "/smartjs/cortex/lib/app/dom";

const nfmt = Util.Format.nfmt;

async function SleevesApp ( ns ) {
    const a = await App( ns, "Sleeves" );
    a.init( async () => {
        await a.bus().linkByPort(3);
        const win = await a.createWindow("Sleeves");
        a.bus().loop( async () => {
            let s = await a.rpc("Sleeves.GetState");
            if ( !s ) return;
            win.content( CortexDOM.createElement( "div", {},
                CortexDOM.createElement( "table",
                    {
                        class: "cortex-infotable",
                        style: {
                            width: "100%",
                            textAlign: "left"
                        }
                    },
                    CortexDOM.createElement( "tr",
                        {
                            style: {
                                textAlign: "center"
                            }
                        },
                        CortexDOM.createElement( "th", {}, "#" ),
                        CortexDOM.createElement( "th", {}, "TASK" ),
                        CortexDOM.createElement( "th", {}, "HAC" ),
                        CortexDOM.createElement( "th", {}, "STR" ),
                        CortexDOM.createElement( "th", {}, "DEF" ),
                        CortexDOM.createElement( "th", {}, "DEX" ),
                        CortexDOM.createElement( "th", {}, "AGI" ),
                        CortexDOM.createElement( "th", {}, "CHA" ),
                        CortexDOM.createElement( "th", {}, "SHOCK" ),
                        CortexDOM.createElement( "th", {}, "SYNC" )
                    ),
                    CortexDOM.createElement( "tr", {
                        style: {
                            height: "8px"
                        }
                    } ),
                    ...s.sleeves.map( ( sleeve, i ) => CortexDOM.createElement( "tr", {},
                        CortexDOM.createElement( "td", {}, `${i}` ),
                        CortexDOM.createElement( "td", {}, `${ ( sleeve.task && (
                            sleeve.task.type == "SYNCHRO" && "SYNC" ||
                            sleeve.task.type == "RECOVERY" && sleeve.task.type ||
                            sleeve.task.type == "CRIME" && sleeve.task.type + ": " + sleeve.task.crimeType ||
                            sleeve.task.type == "CLASS" && sleeve.task.type + ": " + sleeve.task.classType ||
                            sleeve.task.type == "FACTION" && sleeve.task.type + ": " + sleeve.task.factionName + "(" + (
                                sleeve.task.factionWorkType == "hacking" && "HACK" ||
                                sleeve.task.factionWorkType == "field" && "FIELD" ||
                                sleeve.task.factionWorkType == "security" && "SECURITY" ) + ")" ) ) ||
                            "NONE" }` ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.skills.hacking, "0.00a" ) ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.skills.strength, "0.00a" ) ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.skills.defense, "0.00a" ) ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.skills.dexterity, "0.00a" ) ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.skills.agility, "0.00a" ) ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.skills.charisma, "0.00a" ) ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.shock, "0.00" ) ),
                        CortexDOM.createElement( "td", {}, nfmt( sleeve.sync, "0.00" ) )
                    ) )
                )
            ) );
            win.refresh();
        }, 1000 );
    } );
    return a.finalize();
}

export { SleevesApp as init };