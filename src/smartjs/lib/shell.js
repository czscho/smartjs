import { Proxy } from "/smartjs/lib/proxy";
import { commandparser, argparser } from "/smartjs/lib/parse";
import { OptionType } from "/smartjs/lib/smartmodule";
import { LogLevelLabels, FilterDesc } from "smartjs/lib/log";
import { TaskDesc, ShareDesc, ShareType, ShareTypeLabels, PartitionDesc, PartitionType, PartitionTypeLabels } from "/smartjs/lib/scheduler";

export function ShellEnvironment ( key, bus, log ) {
    const p = Proxy();
    const vars = {};

    return p.final( {
        process: async str => {
            async function _process ( line ) {
                let result = {
                    status: 0,
                    data: "",
                    message: "",
                    time: new Date().getTime()
                };
                let data = d => { return result.data = d; }
                let err = msg => { result.status = 1; return result.message = msg; }
                let ok = msg => { result.status = 0; return result.message = msg; };
                let parser = commandparser();

                function _rpc ( name, args ) {
                    return bus.arequest( "Daemon.RPC", { name, args }, ( _, r ) => r );
                }
        
                parser.sub( "sleep", async args => {
                    if ( typeof args.secs == "undefined" ) {
                        err("error: a time in seconds must be given");
                        return;
                    }

                    await new Promise( res => setTimeout( res, args.secs * 1000 ) );
                    ok("ok");
                }, argparser().arg( "secs", { type: OptionType.FLOAT } ) );

                parser.sub( "env", () => {
                    data( vars );
                    ok( Object.keys( vars ).map( k => `${k} = ${ vars[k] }` ).reduce( ( p, c ) => p && `${p}\n${c}` || c, "" ) );
                } );

                parser.sub( "get", args => {
                    if ( !args.key ) {
                        err("error: no key specified");
                        return;
                    }

                    ok( ( data( vars[ args.key ] ) || "unset" ).toString() );
                }, argparser().arg("key") );

                let managerBase = parser.sub( "manager", args => {}, argparser().arg("key") );
                managerBase.cmd( "shutdown", async args => {
                    await bus.arequest( "Daemon.Shutdown", null, ( src, d ) => ok(`${data(d)}`), { onTimeout: () => err("error: timed out") } );
                }, argparser() );
        
                parser.cmd( "ping", async args => {
                    if ( !args.target || args.target == "manager" ) {
                        await bus.arequest( "Manager.Ping", "ping", ( source, d ) => ok(`from ${source}: ${d}`) + data(d), { onTimeout: () => err("error: timed out") } );
                    } else if ( args.target == "daemon" ) {
                        await bus.arequest( "Daemon.Ping", "ping", ( source, d ) => ok(`from ${source}: ${d}`) + data(d), { onTimeout: () => err("error: timed out") } );
                    } else {
                        err(`${args.target} is not a valid target`);
                    }
                }, argparser().arg("target") );
        
                parser.sub( "config", () => err("error: must specify subcommand") )
                .cmd( "load", async args => {
                    let r = await bus.arequest( "Daemon.Config.Load", args, ( _, r ) => r );
                    r.status == 0 ? ok("configuration successfully loaded") : err( r.message );
                }, argparser().arg("file").arg("keep") )
                .cmd( "reload", async () => {
                    let r = await bus.arequest( "Daemon.Config.Reload", null, ( _, r ) => r );
                    r.status == 0 ? ok("configuration successfully reloaded") : err( r.message );
                } )
                .cmd( "get", async args => {
                    let r = await bus.arequest( "Daemon.Config.Get", args, ( _, r ) => r );
                    r.status == 0 ? data( r.data ) + ok( r.data.toString() ) : err( r.message );
                }, argparser().arg("key").arg("value") )
                .cmd( "getall", async args => {
                    let r = await bus.arequest( "Daemon.Config.GetAll", args, ( _, r ) => r );
                    let pretty = r.data && Object.keys( r.data ).map( k => `${k} = ${ r.data[k] }` ).reduce( ( p, c ) => p ? p + "\n" + c : c, "" );
                    r.status == 0 ? data( r.data ) + ok( pretty ) : err( r.message );
                } )
                .cmd( "set", async args => {
                    let r = await bus.arequest( "Daemon.Set", args, ( _, r ) => r );
                    r.status == 0 ? ok("ok") : err( r.message );
                }, argparser().arg("key").arg("value") );

                parser.sub( "log", async () => err("error: no command specified") )
                .cmd( "filter", async args => {
                    if ( typeof args.namespaces == "undefined" && typeof args.level == "undefined" ) {
                        err("error: log level must be specified");
                        return;
                    }
        
                    if ( typeof args.level != "undefined" && typeof LogLevelLabels[ args.level ] == "undefined" ) {
                        err(`error: log level must be one of ${ LogLevelLabels.getLabels() }`);
                        return;
                    }
        
                    let d = FilterDesc.new( {
                        level: LogLevelLabels[ args.level ],
                        namespaces: args.namespaces
                    } );
                    let r = await _rpc( "Log.Filter", d );
                    ok( r.message );
                    data( r.data );
                }, argparser().arg("level").arg( "namespaces", { type: OptionType.ARR } ) );

                let schedBase = parser.sub( "sched", async args => {
                    let t;
                    
                    try {
                        t = TaskDesc.new( {
                            script: args.script,
                            args: args.args && args.args.split(","),
                            threads: args.threads,
                            start: args.start,
                            end: args.end,
                            percentMem: args.percentMem
                        } );
                    } catch ( e ) {
                        err( e.toString() );
                        return;
                    }
                    
                    await _rpc( "Scheduler.Schedule", [ t ] ).then( r => {
                        data( r.data );
                        ok( r.message );
                    } );
                }, argparser().arg("script").arg("args").arg("threads").arg("start").arg("end").arg("percentMem") );
                
                schedBase.sub( "info", async args => {
                    await _rpc( "Scheduler.Info", args.server ).then( r => ok( JSON.stringify( data( r.data ), null, 2 ) ) );
                }, argparser().arg("server") );

                schedBase.sub( "stats", async args => {
                    let s = await _rpc( "Scheduler.Stats", null );
                    ok( JSON.stringify( data( s.data ), null, 2 ) );
                } );

                schedBase.sub( "share", async args => {
                    let t;
                    
                    try {
                        t = TaskDesc.new( {
                            script: args.script,
                            args: args.args && args.args.split(","),
                            threads: args.threads,
                            start: args.start,
                            end: args.end,
                            percentMem: args.percentMem
                        } );
                    } catch ( e ) {
                        err( e.toString() );
                        return;
                    }
                    
                    await _rpc( "Scheduler.Share.Schedule", [ t ] ).then( r => data( r.data ) + ok( r.message ) );
                }, argparser().arg("script").arg("args").arg("threads").arg("start").arg("end").arg("percentMem") )
                .cmd( "info", async args => {
                    await _rpc( "Scheduler.Share.Info", args.key ).then( r => ok( JSON.stringify( data( r.data ), null, 2 ) ) );
                }, argparser().arg( "key", { required: true } ) )
                .cmd( "create", async args => {
                    let s;
        
                    try {
                        if ( typeof ShareTypeLabels[ args.type ] == "undefined" ) {
                            throw new Error(`invalid share type. share type must be one of: ${ ShareTypeLabels.getLabels() }`);
                        }
        
                        s = ShareDesc.new( {
                            type: ShareTypeLabels[ args.type ],
                            mem: args.mem
                        } );
                    } catch ( e ) {
                        err( e.toString() );
                        return;
                    }
        
                    await _rpc( "Scheduler.Share.Create", s ).then( r => ok(`created share with key ${ data(r) }`) );
                }, argparser().arg("type").arg( "mem", { type: OptionType.FLOAT } ) );
        
                schedBase.sub( "part", async args => {
                    if ( !args.key ) {
                        err("error: no key specified");
                    }
        
                    let t;
                    
                    try {
                        t = TaskDesc.new( {
                            script: args.script,
                            args: args.args && args.args.split(","),
                            threads: args.threads,
                            start: args.start,
                            end: args.end,
                            percentMem: args.percentMem
                        } );
                    } catch ( e ) {
                        err( e.toString() );
                        return;
                    }
                    
                    await _rpc( "Scheduler.Partition.Schedule", { key: args.key, desc: t } ).then( r => r.status == 0 ? data( r.data ) || ok( r.message ) : err( r.message ) );
                }, argparser().arg("key").arg("script").arg("args").arg( "threads", { type: OptionType.INT} ).arg( "start", { type: OptionType.FLOAT } ).arg( "end", { type: OptionType.FLOAT } ).arg( "percentMem", { type: OptionType.FLOAT } ) )
                .cmd( "info", async args => {
                    await _rpc( "Scheduler.Partition.Info", args.key ).then( r => {
                        data( r.data );
                        ok( JSON.stringify( r.data, null, 2 ) );
                    } );
                }, argparser().arg( "key", { required: true } ) )
                .cmd( "create", async args => {
                    let p;
        
                    try {
                        if ( typeof PartitionTypeLabels[ args.type ] == "undefined" ) {
                            throw new Error(`invalid partition type. partition type must be one of: ${ PartitionTypeLabels.getLabels() }`);
                        }
        
                        p = PartitionDesc.new( {
                            share: args.share,
                            type: PartitionTypeLabels[ args.type ],
                            mem: args.mem
                        } );
                    } catch ( e ) {
                        err( e.toString() );
                        return;
                    }
        
                    await _rpc( "Scheduler.Partition.Create", p ).then( r => ok(`created partition with key ${ data(r) }`) );
                }, argparser().arg( "share" ).arg( "type" ).arg( "mem", { type: OptionType.FLOAT } ) )
                .cmd( "createlayout", async args => {
                    //
                } )
                .cmd( "delete", async args => {
                    //
                } );

                parser.sub( "sleeves", () => err("error: must specify subcommand") )
                .cmd( "info", async args => {
                    let result = await _rpc( "Sleeves.Info", args.num );
                    result.status == 0 && ok( JSON.stringify( data( result.data ), null, 2 ) ) || err( result.message );
                }, argparser().arg( "num", { type: OptionType.INT } ) );

                let gangBase = parser.sub( "gang", () => err("error: must specify subcommand") )
                .cmd( "list", async args => {
                    let result = await _rpc( "Gang.List", null );
                    result.status == 0 && ok( JSON.stringify( data( result.data ), null, 2 ) ) || err( result.message );
                }, argparser() )
                .cmd( "info", async args => {
                    let result = await _rpc( "Gang.Info", args.name );
                    result.status == 0 && ok( JSON.stringify( data( result.data ), null, 2 ) ) || err( result.message );
                }, argparser().arg("name") );

                gangBase.sub( "members", () => err("error: must specify subcommand") )
                .cmd( "list", async args => {
                    let result = await _rpc( "Gang.Members.List", null );
                    result.status == 0 && ok( JSON.stringify( data( result.data ), null, 2 ) ) || err( result.message );
                }, argparser() )
                .cmd( "info", async args => {
                    let result = await _rpc( "Gang.Members.Info", args.name );
                    result.status == 0 && ok( JSON.stringify( data( result.data ), null, 2 ) ) || err( result.message );
                }, argparser().arg("name") );

                await parser.parse( line, { onError: msg => err( msg ) } );
                result.time = new Date().getTime() - result.time;
                log.info(`(${ key }) '${ line }' completed with status ${ result.status } and took ${ result.time }ms`);
        
                if ( result.status == 0 && !result.message ) {
                    ok("ok");
                } else if ( !result.message ) {
                    err("error");
                }
        
                return result;
            }
            
            let lines = str.split(";");
            let arr = [];

            for ( let i = 0; i < lines.length; i++ ) {
                let li = lines[i].trim();
                let subs = [ ...li.matchAll(/\$[A-Za-z_]+[\w]*/g) ].map( s => s.toString() );

                subs.forEach( sub => li = li.replaceAll( sub, vars[ sub.slice(1) ] ) );

                if ( li.includes(">>") ) {
                    let a = li.split(">>");
                    let cmd = a[0].trim();
                    let name = a[1].trim();
                    log.info(`(${ key }) executing '${ cmd }'...`);
                    let result = await _process( cmd );
                    vars[ name ] = result.data;
                    arr.push( result );
                    continue;
                }

                log.info(`(${ key }) executing '${ li }'...`);
                arr.push( await _process( li ) );
            }

            return arr;
        }
    } );
}