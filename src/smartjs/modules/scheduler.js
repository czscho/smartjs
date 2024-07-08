import * as SJS from "/smartjs/lib/common";
import { PoolType, PoolTypeLabels } from "/smartjs/lib/smartmodule";
import { ResultCode, ContainerType, ShareType, ShareTypeLabels, PartitionType, PartitionTypeLabels, PartitionLayoutPreset, ShareDesc, PartitionDesc, PartitionLayoutDesc, TaskDesc, ExecResult } from "/smartjs/lib/scheduler";

function _SchedTimeline () {
    const proxy = {};
    const _data = [ {
        ms: -1,
        allocatedMem: 0,
        events: [],
        tasks: []
    } ];

    Obiect.assign( proxy, {
        //
    } );

    return Obiect.freeze( proxy );
}

function SchedulerModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Scheduler", { ms: 250 } );

    const TaskEventType = SJS.Util.Enum( [
        "START",
        "END"
    ] );

    const ServerInfo = SJS.Util.Blueprint( {
        allocatedMem: SJS.Util.Blueprints.PropType.FLOAT,
        allocations: SJS.Util.Blueprints.PropType.ARRAY,
        mem: SJS.Util.Blueprints.PropType.FLOAT,
        usedMem: SJS.Util.Blueprints.PropType.FLOAT
    } );
    const Allocation = SJS.Util.Blueprint( {
        server: SJS.Util.Blueprints.PropType.STRING,
        mem: SJS.Util.Blueprints.PropType.FLOAT
    } );
    const Point = SJS.Util.Blueprint( {
        ms: SJS.Util.Blueprints.PropType.INTEGER,
        allocatedMem: SJS.Util.Blueprints.PropType.FLOAT,
        events: SJS.Util.Blueprints.PropType.ARRAY,
        tasks: SJS.Util.Blueprints.PropType.ARRAY
    } );
    const TaskEvent = SJS.Util.Blueprint( {
        type: SJS.Util.Blueprints.PropType.INTEGER,
        task: SJS.Util.Blueprints.PropType.STRING
    } );
    const ScheduledTask = SJS.Util.Blueprint( {
        containerType: SJS.Util.Blueprints.PropType.INTEGER,
        container: SJS.Util.Blueprints.PropType.STRING,
        script: SJS.Util.Blueprints.PropType.STRING,
        scriptMem: SJS.Util.Blueprints.PropType.FLOAT,
        args: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.ARRAY, { dfault: [] } ),
        threads: SJS.Util.Blueprints.PropType.INTEGER,
        start: SJS.Util.Blueprints.PropType.INTEGER,
        end: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.INTEGER, { required: false } ),
        mem: SJS.Util.Blueprints.PropType.FLOAT,
        allocations: SJS.Util.Blueprints.PropType.ARRAY
    } );
    const Share = SJS.Util.Blueprint( {
        type: SJS.Util.Blueprints.PropType.INTEGER,
        tasks: SJS.Util.Blueprints.PropType.ARRAY,
        allocations: SJS.Util.Blueprints.PropType.ARRAY,
        mem: SJS.Util.Blueprints.PropType.FLOAT,
        allocatedMem: SJS.Util.Blueprints.PropType.FLOAT
    } );
    const Partition = SJS.Util.Blueprint( {
        share: SJS.Util.Blueprints.PropType.STRING,
        type: SJS.Util.Blueprints.PropType.INTEGER,
        tasks: SJS.Util.Blueprints.PropType.ARRAY,
        allocations: SJS.Util.Blueprints.PropType.ARRAY,
        mem: SJS.Util.Blueprints.PropType.FLOAT,
        allocatedMem: SJS.Util.Blueprints.PropType.FLOAT
    } );

    const serverInfo = {};
    const tasks = {};
    const allocations = {};
    const shares = {};
    const partitions = {};

    let servers = [];
    let gTotalMem = 0;
    let gClaimedMem = 0;
    let gUsedMem = 0;
    let schedQ = [];
    let allocatedMem = 0;
    let activeTasks = [];
    let timeline = [ Point.new( {
        ms: -1,
        allocatedMem: 0,
        events: [],
        tasks: []
    } ) ];

    function validate ( task ) {
        ScheduledTask.assert( task );

        let container;
        let mem = gTotalMem;
        let mostAllocated = 0;

        switch ( task.containerType ) {
            case ContainerType.SHARE:
                container = shares[ task.container ];
                mem = _calcShareMem( task.container );
                break;
            case ContainerType.PARTITION:
                container = partitions[ task.container ];
                mem = _calcPartMem( task.container );
                break;
        }
        
        for ( let i = 0, p = timeline[0]; i < timeline.length && ( !task.end || p.ms < task.end ); i++, p = timeline[i] ) {
            if ( p.ms >= task.start && p.allocatedMem > mostAllocated ) {
                mostAllocated = p.allocatedMem;
            }
        }

        return ( mem - mostAllocated >= task.mem ) ? "ok" : `not enough memory, need ${ SJS.Util.Format.nfmt( ( task.mem - ( mem - mostAllocated ) ) * 1_000_000_000, "0.00b" ) }`;
    }

    function _calcPartMem ( key ) {
        let part = partitions[ key ];
        let mem = part.mem;
        
        switch ( part.type ) {
            case PartitionType.PERCENT:
                mem *= _calcShareMem( part.share );
                break;
            case PartitionType.DYNAMIC:
                break;
        }

        return mem;
    }

    function _calcShareMem ( key ) {
        let share = shares[ key ];
        let mem = share.mem;

        switch ( share.type ) {
            case ShareType.PERCENT:
                mem *= gTotalMem;
                break;
            case ShareType.DYNAMIC:
                break;
        }

        return mem;
    }

    function alloc ( server, key, mem ) {
        let t = tasks[ key ];
        let all = Allocation.new( {
            server,
            mem: mem
        } );

        serverInfo[ server ].allocations.push( all );
        t.allocations.push( all );
    }

    function exec ( key ) {
        let t = tasks[ key ];
        m.debug(`executing ${ key }(script: ${ t.script }, args: ${ t.args })`);
        let allocated = 0;
        let flag = ( () => {
            for ( let i = 0; i < servers.length && allocated < t.mem; i++ ) {
                let info = serverInfo[ servers[i] ];
                let free = info.mem - info.usedMem;

                if ( free >= t.scriptMem ) {
                    let rem = t.mem - allocated;

                    if ( rem < t.scriptMem ) {
                        return true;
                    }

                    let threads = rem > free ? Math.floor( free / t.scriptMem ) : Math.floor( rem / t.scriptMem );
                    let fl = ns.scp( t.script, servers[i], "home" );

                    if ( !fl ) {
                        m.warn(`failed ns.scp ${t.script} from home to ${servers[i]})`);
                        return false;
                    }

                    fl = ns.exec( t.script, servers[i], threads, ...t.args );

                    if ( !fl ) {
                        //m.warn(`failed ns.exec on ${ servers[i] } ${ key }(script: ${ t.script }, args: ${ t.args }) with ${ threads } threads`);
                        continue;
                    }

                    let step = t.scriptMem * threads;
                    allocated += step;
                    alloc( servers[i], key, step );
                }

                if ( allocated == t.mem ) {
                    return true;
                }
            }

            return false;
        } )();

        m.post( "Scheduler.TaskStart", key );

        if ( !flag ) {
            return ExecResult.new( {
                code: ResultCode.FAILURE,
                message: `partial allocation: ${allocated} / ${t.mem} GB for ${ key }.`
            } );
        }

        return ExecResult.new( {
            code: ResultCode.SUCCESS,
            message: `successfully allocated ${ allocated } GB for ${ key }.`
        } );
    }

    function terminate ( key ) {
        let t = tasks[ key ];

        m.post( "Scheduler.TaskCompletion", key );
        delete tasks[ key ];
    }

    m.expose( "Scheduler.TaskInfo", ( _, key ) => {
        if ( !tasks[ key ] ) {
            return { status: 1, data: null, message: "no such task" };
        }
        return { status: 0, data: tasks[ key ], message: "ok" };
    } );

    m.expose( "Scheduler.Info", ( _, server ) => {
        if ( typeof serverInfo[ server ] == "undefined" ) {
            return { status: 1, data: null, message: "no such server" };
        }
        return { status: 0, data: serverInfo[ server ], message: "ok" };
    } );

    m.expose( "Scheduler.Schedule", ( _, descs ) => {
        descs.forEach( desc => TaskDesc.assert( desc ) );

        return {};
    } );

    m.expose( "Scheduler.Cancel", ( _, key ) => {
        if ( typeof key == "undefined" ) {
            return { stats: 1, message: "no task key provided" };
        }

        if ( typeof tasks[ key ] == "undefined" ) {
            return { status: 1, message: "nonexistent task key provided" };
        }

        terminate( key );
    } );

    m.expose( "Scheduler.Share.Info", ( _, key ) => {
        if ( typeof shares[ key ] == "undefined" ) {
            return { status: 1, message: "invalid share key" };
        }

        let info = {
            mem: _calcShareMem( key )
        };

        return { status: 0, data: info, message: "ok" };
    } );

    m.expose( "Scheduler.Share.Create", ( _, desc ) => {
        ShareDesc.assert( desc );

        let key = SJS.Util.generateUUID();

        m.info(`creating share ${ key } of type ${ ShareTypeLabels.byKeys()[ desc.type ] } with mem ${ desc.mem }`);

        switch ( desc.type ) {
            case ShareType.POOL:
                break;
            case ShareType.FIXED:
                shares[ key ] = Share.new( {
                    type: ShareType.FIXED,
                    tasks: [],
                    allocations: [],
                    mem: desc.mem,
                    allocatedMem: 0
                } );
                break;
            case ShareType.PERCENT:
                shares[ key ] = Share.new( {
                    type: ShareType.PERCENT,
                    tasks: [],
                    allocations: [],
                    mem: desc.mem,
                    allocatedMem: 0
                } );
                break;
            case ShareType.DYNAMIC:
                break;
        }

        return { status: 0, data: key, message: "ok" };
    } );

    m.expose( "Scheduler.Share.Schedule", ( _, desc ) => {
        //
    } );

    m.expose( "Scheduler.Share.Cancel", ( _, desc ) => {
        //
    } );

    m.expose( "Scheduler.Partition.Info", ( _, key ) => {
        if ( typeof partitions[ key ] == "undefined" ) {
            return { status: 1, message: "invalid partition key" };
        }

        let info = {
            mem: _calcPartMem( key )
        };

        return { status: 0, data: info, message: "ok" };
    } );

    m.expose( "Scheduler.Partition.IsInactive", ( _, key ) => {
        //
    } );

    m.expose( "Scheduler.Partition.Create", ( _, desc ) => {
        PartitionDesc.assert( desc );

        let key = generateUUID();

        m.info(`creating partition ${ key } of type ${ PartitionTypeLabels.byKeys()[ desc.type ] } with mem ${ desc.mem } under share ${ desc.share }`);

        switch ( desc.type ) {
            case PartitionType.FIXED:
                partitions[ key ] = Partition.new( {
                    share: desc.share,
                    type: PartitionType.FIXED,
                    tasks: [],
                    allocations: [],
                    mem: desc.mem,
                    allocatedMem: 0
                } );
                timelineMap[ key ] = partitions[ key ].timeline;
                break;
            case PartitionType.PERCENTAGE:
                break;
            case PartitionType.DYNAMIC:
                break;
        }

        return key;
    } );

    m.expose( "Scheduler.Partition.CreateLayout", ( _, desc ) => {
        PartitionLayoutDesc.assert( desc );
        desc.partitions.forEach( p => PartitionDesc.assert( p ) );
        
        let keys;

        switch ( desc.type ) {
            case PartitionLayoutPreset.NONE:
                keys = desc.partitions.map( () => generateUUID() );

                desc.partitions.forEach( ( p, i ) => {
                    switch ( p.type ) {
                        case PartitionType.FIXED:
                            break;
                        case PartitionType.PERCENTAGE:
                            break;
                        case PartitionType.DYNAMIC:
                            break;
                    }
                } );
                break;
            case PartitionLayoutPreset.EVEN:
                keys = "x".repeat( desc.numPartitions ).split("").map( () => SJS.Util.generateUUID() );

                keys.forEach( key => {
                    let mem = _calcShareMem( desc.share ) / desc.numPartitions;
                    m.info(`creating partition ${ key } of type PERCENT with mem ${ mem } under share ${ desc.share }`);

                    partitions[ key ] = Partition.new( {
                        share: desc.share,
                        type: PartitionType.PERCENT,
                        tasks: [],
                        allocations: [],
                        mem: 1 / desc.numPartitions,
                        allocatedMem: 0
                    } );
                } );
                break;
        }

        return { status: 0, data: keys, message: "ok" };
    } );

    m.expose( "Scheduler.Partition.Delete", ( _, key ) => {} );

    m.expose( "Scheduler.Partition.Schedule", async ( _, req ) => {
        if ( !partitions[ req.key ] ) {
            return { status: 1, message: "nonexistent partition" };
        }

        TaskDesc.assert( req.desc );

        let key = SJS.Util.generateUUID();
        let args = req.desc.args || [];
        let threads = req.desc.threads || ( req.desc.percentMem ? -1 : 1 );
        let mem = ( req.desc.percentMem && _calcPartMem( req.key ) * req.desc.percentMem ) || -1;
        let start = req.desc.start || 0;

        if ( req.desc.duration && req.desc.duration <= 0 ) {
            return { status: 1, message: "duration must be positive" };
        }

        if ( req.desc.percentMem && req.desc.percentMem > 1 ) {
            return { status: 1, message: "not enough memory" };
        }

        let candidate = ScheduledTask.new( {
            containerType: ContainerType.PARTITION,
            container: req.key,
            script: req.desc.script,
            scriptMem: ns.getScriptRam( req.desc.script ),
            args: args,
            threads: threads,
            start: start,
            end: req.desc.duration ? req.desc.start + req.desc.duration : -1,
            mem: mem,
            allocations: []
        } );

        let ret = validate( candidate );

        if ( ret != "ok" ) {
            return { status: 1, message: `${ret}` };
        }

        tasks[ key ] = candidate;
        schedQ.push( key );
        return { status: 0, data: key, message: `scheduled task with key ${key}` };
    } );

    m.expose( "Scheduler.Partition.Cancel", ( _, key ) => {
        //
    } );

    m.expose( "Scheduler.Stats", () => {
        return {
            status: 0,
            data: {
                totalMem: gTotalMem,
                shares,
                partitions,
                timeline
            },
            message: "ok"
        };
    } );

    m.options( [
        m.mkArrOption( "ServerPool", [ "pserv.*" ], { label: "Server pool", description: "The pool of servers to use for scheduling tasks." } ),
        m.mkEnumOption( "ServerPoolType", PoolType, PoolType.INCLUDE, { label: "Type of 'Server pool'", description: "Whether or not to treat 'Server pool' as inclusive or exclusive.", labels: PoolTypeLabels } ),
        m.mkBoolOption( "UseServerPool", true, { label: "Use 'Server pool'", description: "Whether or not to use 'Server pool' to filter which servers to use for scheduling tasks." } ),
        m.mkBoolOption( "ExcludeHacknetServers", false, { label: "Exclude Hacknet Servers", description: "Whether or not to exclude Hacknet Servers from the pool of servers to use for executing tasks." } )
    ] );

    m.loader.require("FileSync");

    m.init( async () => {
        //
    } );

    m.update( async ctx => {
        servers = await ( async () => {
            let exclude = await m.get("ExcludeHacknetServers");
            return ctx.servers.filter( server => server != "home" && ns.getServerMaxRam( server ) > 0 && ( !exclude || (/* server.startsWith("pserv") ||*/ server.startsWith("hacknet-server-" ) ) ) );
        } )();
        await m.get("UseServerPool") &&  await ( async () => {
            let pool = await m.get("ServerPool");
            let poolType = await m.get("ServerPoolType");
            servers = servers.filter( server => pool.some( str => new RegExp( str ).test( server ) ) != ( poolType == PoolType.EXCLUDE ) && ns.hasRootAccess( server ) && ns.getServerMaxRam( server ) > 0 );
        } )();

        servers.sort( ( a, b ) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a) );

        for ( let i = 0, server = servers[0]; i < servers.length; server = servers[ ++i ] ) {
            if ( !serverInfo[ server ] ) {
                serverInfo[ server ] = ServerInfo.new( {
                    allocations: [],
                    mem: ns.getServerMaxRam( server ),
                    allocatedMem: 0,
                    usedMem: ns.getServerUsedRam( server )
                } );
            } else {
                serverInfo[ server ].mem = ns.getServerMaxRam( server );
                serverInfo[ server ].usedMem = ns.getServerUsedRam( server );
            }
        }

        Object.keys( serverInfo ).forEach( server => {
            if ( !servers.includes( server ) ) {
                //
            }
        } );

        gTotalMem = servers.reduce( ( prev, server ) => prev + serverInfo[ server ].mem, 0 );
        gUsedMem = servers.reduce( ( prev, server ) => prev + serverInfo[ server ].usedMem, 0 );
        
        while ( schedQ.length > 0 ) {
            let key = schedQ.shift();
            let t = tasks[ key ];
            let rstart = ctx.time + t.start;
            let rend = t.end > 0 && rstart + t.end;

            for ( let i = 0, p = timeline[0], next = timeline[1]; i < timeline.length; p = timeline[ i++ ], next = timeline[ i + 1 ] ) {
                function tail () {
                    for ( ; i < timeline.length; p = timeline[ i++ ], next = timeline[ i + 1 ] ) {
                        if ( p.ms > rstart && ( !rend || p.ms < rend ) ) {
                            p.allocatedMem += t.mem;
                            p.tasks.push( key );
                        }

                        if ( rend > 0 ) {
                            if ( p.ms < rend && ( !next || next.ms > rend ) ) {
                                timeline.splice( i + 1, 0, Point.new( {
                                    ms: rend,
                                    allocatedMem: p.allocatedMem - t.mem,
                                    events: [ TaskEvent.new( {
                                        type: TaskEventType.END,
                                        task: key
                                    } ) ],
                                    tasks: p.tasks.filter( t => t != key )
                                } ) );
                                break;
                            } else if ( p.ms == rend ) {
                                p.events.push( TaskEvent.new( {
                                    type: TaskEventType.END,
                                    task: key
                                } ) );
                                break;
                            }
                        }
                    }
                };

                if ( p.ms < rstart && ( !next || next.ms > rstart ) ) {
                    timeline.splice( i + 1, 0, Point.new( {
                        ms: rstart,
                        allocatedMem: p.allocatedMem + t.mem,
                        events: [ TaskEvent.new( {
                            type: TaskEventType.START,
                            task: key
                        } ) ],
                        tasks: p.tasks
                    } ) );
                    timeline[ i++ ].tasks.push( key );
                    tail();
                    break;
                } else if ( p.ms == rstart ) {
                    p.allocatedMem += t.mem;
                    p.events.push( TaskEvent.new( {
                        type: TaskEventType.START,
                        task: key
                    } ) );
                    p.tasks.push( key );
                    tail();
                    break;
                }
            }
        }

        while ( timeline.length > 1 && ctx.time >= timeline[1].ms ) {
            let p = timeline.splice( 1, 1 )[0];

            for ( let j = 0; j < p.events.length; j++ ) {
                let tkey = p.events[j].task;
                let t = tasks[ tkey ];

                if ( p.events[j].type == TaskEventType.START ) {
                    let r = exec( tkey );

                    if ( r.status == 1 ) {
                        m.warn(`${r.message}`);
                    }
                } else {
                    terminate( p.events[j].task );
                }
            }

            allocatedMem = p.allocatedMem;
            activeTasks = p.tasks;
        }
    } );
    return m.finalize();
}

export { SchedulerModule as init };