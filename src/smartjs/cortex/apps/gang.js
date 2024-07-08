import { App } from "/smartjs/cortex/lib/app";
import { Util } from "/smartjs/lib/common";
import { CortexDOM } from "/smartjs/cortex/lib/app/dom";

const nfmt = Util.Format.nfmt;

async function GangApp ( ns ) {
    const a = await App( ns, "Gang" );
    a.init( async () => {
        await a.bus().linkByPort(3);
        const win = await a.createWindow("Gang");
        a.bus().loop( async () => {
            let s = await a.rpc("Gang.GetState");
            if ( !s ) return;
            win.content( s.gangInfo ?
                CortexDOM.createElement( "div", {},
                    CortexDOM.createElement( "div",
                        {
                            style: {
                                padding: "0 0 6px 0"
                            }
                        },
                        CortexDOM.createElement( "b", {}, "Faction: " ),
                        `${ s.gangInfo.faction } ${ s.gangInfo.isHacking ? "(hacking)" : "" }`
                    ),
                    CortexDOM.createElement( "div",
                        {
                            style: {
                                padding: "0 0 6px 0"
                            }
                        },
                        CortexDOM.createElement( "b", {}, "Money: " ),
                        `$${ nfmt( s.gangInfo.moneyGainRate, "0.00a" ) }/sec`,
                        CortexDOM.createElement( "b", {}, "\tPower: " ),
                        `${ nfmt( s.gangInfo.power, "0.00a" ) }`
                    ),
                    CortexDOM.createElement( "div",
                        {
                            style: {
                                padding: "0 0 6px 0"
                            }
                        },
                        CortexDOM.createElement( "b", {}, "Respect: " ),
                        `${ nfmt( s.gangInfo.respect, "0.00a") } (${ nfmt( s.gangInfo.respectGainRate, "0.00a" ) }/sec)`,
                        CortexDOM.createElement( "b", {}, "\tFor next recruit: " ),
                        `${ s.gangInfo.respectForNextRecruit == Number.POSITIVE_INFINITY ? "N/A" : nfmt( s.gangInfo.respectForNextRecruit, "0.00a" ) }`
                    ),
                    CortexDOM.createElement( "div",
                        {
                            style: {
                                padding: "0 0 6px 0"
                            }
                        },
                        CortexDOM.createElement( "b", {}, "Wanted level: " ),
                        `${ nfmt( s.gangInfo.wantedLevel, "0.00a" ) } (${ nfmt( s.gangInfo.wantedLevelGainRate, "0.00a" ) }/sec)`,
                        CortexDOM.createElement( "b", {}, "\tPenalty: " ),
                        `${ nfmt( ( 1 - s.gangInfo.wantedPenalty ) * 100, "0.00" ) }%`
                    ),
                    CortexDOM.createElement( "div",
                        {
                            style: {
                                padding: "0 0 6px 0"
                            }
                        },
                        CortexDOM.createElement( "b", {}, "Territory: " ),
                        `${ nfmt( s.gangInfo.territory * 100, "0.00" ) }%`,
                        CortexDOM.createElement( "b", {}, s.gangInfo.territoryWarfareEngage ? "\tClash chance: " : "\tClash chance (disabled): " ),
                        `${ nfmt( s.gangInfo.territoryClashChance * 100, "0.00" ) }%`
                    ),
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
                            CortexDOM.createElement( "th", {}, "NAME" ),
                            CortexDOM.createElement( "th", {}, "JOB" ),
                            CortexDOM.createElement( "th", {}, "AGI" ),
                            CortexDOM.createElement( "th", {}, "CHA" ),
                            CortexDOM.createElement( "th", {}, "DEF" ),
                            CortexDOM.createElement( "th", {}, "DEX" ),
                            CortexDOM.createElement( "th", {}, "HAC" ),
                            CortexDOM.createElement( "th", {}, "STR" )
                        ),
                        CortexDOM.createElement( "tr", {
                            style: {
                                height: "8px"
                            }
                        } ),
                        ...Object.values( s.members ).map( member => CortexDOM.createElement( "tr", {},
                            CortexDOM.createElement( "td", {}, member.name ),
                            CortexDOM.createElement( "td", {}, member.task ),
                            CortexDOM.createElement( "td", {}, nfmt( member.agi, "0.00a" ) ),
                            CortexDOM.createElement( "td", {}, nfmt( member.cha, "0.00a" ) ),
                            CortexDOM.createElement( "td", {}, nfmt( member.def, "0.00a" ) ),
                            CortexDOM.createElement( "td", {}, nfmt( member.dex, "0.00a" ) ),
                            CortexDOM.createElement( "td", {}, nfmt( member.hac, "0.00a" ) ),
                            CortexDOM.createElement( "td", {}, nfmt( member.str, "0.00a" ) ),
                        ) )
                    )
                ) : CortexDOM.createElement( "div", {}, `Karma: ${ nfmt( s.karma, "0.00a" ) } / -54k` )
            );
        }, 1000 );
    } );
    return a.finalize();
}

export { GangApp as init };