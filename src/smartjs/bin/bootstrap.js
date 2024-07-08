import { genLoader } from "/smartjs/lib/loader";
import { Modules } from "/smartjs/lib/common";

export async function main ( ns ) {
    let trash = ns.ls( "home", "/smartjs/gen/" );
    trash.push( ...ns.ls( "home", "/smartjs/tmp/" ) );

    for ( let i = 0; i < trash.length; i++ ) {
        ns.rm(trash[i]);
    }

    ns.run("/smartjs/bin/broker.js");
    ns.run("/smartjs/bin/smart-manager.js");

    let config = Modules.Configuration();

    config.define( "Daemon.ModulesPath", Modules.OptionType.STR, "/smartjs/modules" );
    config.define( "Daemon.StaticModules", Modules.OptionType.ARR, [] );
    config.define( "Cortex.Enable", Modules.OptionType.BOOL, true );
    config.define( "Cortex.AppsPath", Modules.OptionType.STR, "/smartjs/cortex/apps" );
    config.define( "Cortex.AutoStartApps", Modules.OptionType.ARR, [] );
    config.loadFile( ns.read("smart.txt") );

    if ( config.get("Cortex.Enable") ) {
        genLoader( ns, config.get("Cortex.AutoStartApps").map( t => `${ config.get("Cortex.AppsPath") }/${t}` ), "/smartjs/gen/cortex/autostart.js" );
        ns.run("/smartjs/cortex/bin/cortex.js");
    }

    genLoader( ns, config.get("Daemon.StaticModules").map( m => `${ config.get("Daemon.ModulesPath") }/${m}` ), "/smartjs/gen/static-modules.js" );
    ns.run("/smartjs/bin/smart-daemon.js");
}