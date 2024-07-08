import * as SJS from "/smartjs/lib/common";
import { ShareType, PartitionLayoutPreset, ShareDesc, PartitionDesc, PartitionLayoutDesc, TaskDesc } from "/smartjs/lib/scheduler";

function BatchModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Batch" );

    let shareKey = null;
    let partitionKeys = null;
    let availablePartitions = [];
    let targets = [];
    let waiting = [];
    let stopping = {};
    let delQ = [];
    let jobsMap = {};
    let state = null;

    function selectTargets ( pool, limit ) {
        let servers = pool;
        let selected = [];

        for ( let i = 0; i < limit; i++ ) {
            let highest = { moneyOverTime: 0 };

            for ( let j = 0; j < servers.length; j++ ) {
                let serverInfo = {
                    maxMoney: ns.getServerMaxMoney( servers[j] ),
                    reqHackingLvl: ns.getServerRequiredHackingLevel( servers[j] ),
                    rootAccess: ns.hasRootAccess( servers[j] ),
                    hackTime: ns.getHackTime( servers[j] )
                };

                if ( serverInfo.maxMoney > 0 && ns.getHackingLevel() >= serverInfo.reqHackingLvl && serverInfo.rootAccess && servers[j] != "home" ) {
                    let moneyOverTime = serverInfo.maxMoney / serverInfo.hackTime;

                    if ( moneyOverTime > highest.moneyOverTime ) {
                        highest = {
                            index: j,
                            moneyOverTime: moneyOverTime
                        };
                    }
                }
            }

            if ( highest.moneyOverTime > 0 ) {
                selected.push( servers[ highest.index ] );
                servers = servers.filter( ( _, index ) => index != highest.index );
            } else {
                break;
            }
        }

        return selected;
    }

    m.expose( "Batch.GetState", () => ( { status: 0, data: state, message: "ok" } ) );

    m.options( [ 
        m.mkIntOption( "NumTargets", 4, { label: "Number of targets", description: "Maximum number of targets to try hacking concurrently." } ),
        m.mkIntOption( "BatchType", 0, { label: "Batch type", description: "Whether or not to use monolithic or cascaded batches." } )
    ] );

    m.loader.require("Scheduler");

    m.init( async () => {
        shareKey = await m.scheduling.share.create( ShareDesc.new( {
            type: ShareType.PERCENT,
            mem: 1
        } ) );
        partitionKeys = await m.scheduling.partition.layout( PartitionLayoutDesc.new( {
            share: shareKey,
            type: PartitionLayoutPreset.EVEN,
            numPartitions: await m.get("NumTargets")
        } ) );
        availablePartitions = [ ...partitionKeys ];
    } );

    m.update( async ctx => {
        while ( delQ.length > 0 ) {
            let t = delQ.shift();
            delete jobsMap[t];
        }

        let buffer = selectTargets( ctx.servers, await m.get("NumTargets") );

        for ( let i = 0, t = targets[0]; i < targets.length; t = targets[ ++i ] ) {
            if ( stopping[t] ) {
                delete stopping[t];
                targets.splice( i, 1 );
                i--;
            }
        }

        for ( let i = 0, t = buffer[0]; i < buffer.length; t = buffer[ ++i ] ) {
            if ( !jobsMap[t] ) {
                targets.push(t);
                waiting.push(t);
                jobsMap[t] = {
                    started: 0,
                    status: "waiting",
                    type: "pending",
                    task: "--",
                    taskStarted: null,
                    taskDuration: null,
                    stage: "--",
                    partKey: null,
                    partInfo: null,
                    lock: ( async () => {} )(),
                    locked: false
                };
            }
        }

        while ( availablePartitions.length > 0 && waiting.length > 0 ) {
            let t = waiting.shift();
            let partKey = availablePartitions.shift();
            jobsMap[t] = {
                started: 0,
                status: "starting",
                type: "pending",
                task: "--",
                taskStarted: null,
                taskDuration: null,
                stage: "--",
                partKey: partKey,
                partInfo: ( await m.scheduling.partition.info( partKey ) ),
                lock: ( async () => {} )(),
                locked: false
            };
        }

        for ( let i = 0, t = targets[0]; i < targets.length; i++, t = targets[i] ) {
            let ji = jobsMap[t];

            ( async () => {
                if ( stopping[t] || ji.locked ) return;
                await ji.lock;
                if ( stopping[t] || !jobsMap[t] ) return;
                ji.lock = ( async () => {
                    ji.locked = true;

                    if ( waiting.length > Object.values( stopping ).length && ji.status != "waiting" && ji.status != "starting" && ji.status != "stopping" ) {
                        ji.status = "stopping";
                    }

                    if ( ji.status == "stopping" ) {
                        ji.last && await m.scheduling.taskComplete( ji.last );
                        delQ.push(t);
                        stopping[t] = true;
                        availablePartitions.push( ji.partKey );
                        m.debug(`stopped ${ji.type} job for ${t}`);
                        return;
                    }

                    if ( ji.status == "waiting" ) return;

                    ji.partInfo = ( await m.scheduling.partition.info( ji.partKey ) );
                    ji.stats = {
                        securityLevel: ns.getServerSecurityLevel(t),
                        minSecurityLevel: ns.getServerMinSecurityLevel(t),
                        money: ns.getServerMoneyAvailable(t),
                        maxMoney: ns.getServerMaxMoney(t),
                        weakenTime: ns.getWeakenTime(t),
                        growTime: ns.getGrowTime(t),
                        hackTime: ns.getHackTime(t)
                    };

                    ji.stats.profit = ji.stats.maxMoney / ( 2_000 + ji.stats.weakenTime ) * 1_000;

                    if ( ji.status == "starting" ) {
                        ji.task = "noop";
                        ji.taskStarted = await m.time();
        
                        if ( ji.stats.securityLevel > ji.stats.minSecurityLevel ) {
                            ji.status = "running";
                            ji.task = "sched";
                            ji.taskStarted = await m.time();
                            ji.type = "prep-weaken";
                        } else if ( ji.stats.money < ji.stats.maxMoney ) {
                            ji.status = "running";
                            ji.task = "sched";
                            ji.taskStarted = await m.time();
                            ji.type = "prep-grow";
                        } else {
                            ji.status = "running";
                            ji.task = "sched";
                            ji.taskStarted = await m.time();
                            ji.type = await m.get("BatchType") == 0 ? "batch-mono" : "batch-cascade";
                        }
                        
                        m.debug(`starting ${ji.type} job for ${t}...`);
                        ji.started = await m.time();
                    }
        
                    if ( ji.status == "running" ) {
                        if ( ji.task == "sched" ) {
                            if ( ji.type != "prep-weaken" && ji.stats.securityLevel > ji.stats.minSecurityLevel ) {
                                ji.task = "switch";
                                ji.taskStarted = await m.time();
                                m.debug(`switching ${ji.type} job for ${t} to prep-weaken`);
                                ji.type = "prep-weaken";
                                ji.last && await m.scheduling.taskComplete( ji.last );
                            } else if ( ji.type != "prep-grow" && ji.stats.money < ji.stats.maxMoney ) {
                                ji.task = "switch";
                                ji.taskStarted = await m.time();
                                m.debug(`switching ${ji.type} job for ${t} to prep-grow`);
                                ji.type = "prep-grow";
                                ji.last && await m.scheduling.taskComplete( ji.last );
                            } else if ( ji.type != "batch-mono" && ji.stats.securityLevel == ji.stats.minSecurityLevel && ji.stats.money == ji.stats.maxMoney ) {
                                ji.task = "switch";
                                ji.taskStarted = await m.time();
                                let b = await m.get("BatchType") == 0 ? "batch-mono" : "batch-cascade";
                                m.debug(`switching ${ji.type} job for ${t} to ${b}`);
                                ji.type = b;
                                ji.last && await m.scheduling.taskComplete( ji.last );
                            }
                            
                            ji.task = "noop";
                            
                            let pending;
                            
                            if ( ji.type == "prep-weaken" ) {
                                let tk = TaskDesc.new( {
                                    percentMem: 1,
                                    duration: ji.stats.weakenTime,
                                    script: "/smartjs/scripts/weaken.js",
                                    args: [ t ]
                                } );
                                ji.taskStarted = await m.time();
                                ji.taskDuration = ji.stats.weakenTime;
                                ji.stage = "weaken";
                                pending = ji.last = ( await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk } ) );
                                await m.scheduling.taskComplete( pending );
                                ji.task = "sched";
                                ji.taskStarted = await m.time();
                                ji.taskDuration = null;
                                ji.stage = null;
                            } else if ( ji.type == "prep-grow" ) {
                                let tk = TaskDesc.new( {
                                    percentMem: 1,
                                    duration: ji.stats.growTime,
                                    script: "/smartjs/scripts/grow.js",
                                    args: [ t ]
                                } );
                                ji.taskStarted = await m.time();
                                ji.taskDuration = ji.stats.growTime;
                                ji.stage = "grow";
                                pending = ji.last = ( await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk } ) );
                                await m.scheduling.taskComplete( pending );
                                ji.task = "sched";
                                ji.taskStarted = await m.time();
                                ji.taskDuration = null;
                                ji.stage = null;
                            } else if ( ji.type == "batch-cascade" ) {
                                let n = 6 // Math.floor( ji.partInfo.mem / 7 );
                                let p = 1 / n / 4;

                                ji.taskStarted = await m.time();
                                ji.taskDuration = null;
                                ji.stage = "weaken";
        
                                for ( let i = 0, j = 0; i < n; i++, j = i * 1_000 ) {
                                    let tk1 = TaskDesc.new( {
                                        percentMem: p,
                                        start: j + ji.stats.weakenTime - ji.stats.hackTime - 1_000,
                                        duration: ji.stats.hackTime,
                                        script: "/smartjs/scripts/hack.js",
                                        args: [ t ]
                                    } );
                                    let tk2 = TaskDesc.new( {
                                        percentMem: p,
                                        start: j,
                                        duration: ji.stats.weakenTime,
                                        script: "/smartjs/scripts/weaken.js",
                                        args: [ t ]
                                    } );
                                    let tk3 = TaskDesc.new( {
                                        percentMem: p,
                                        start: j + ji.stats.weakenTime - ji.stats.growTime + 1_000,
                                        duration: ji.stats.growTime,
                                        script: "/smartjs/scripts/grow.js",
                                        args: [ t ]
                                    } );
                                    let tk4 = TaskDesc.new( {
                                        percentMem: p,
                                        start: j + 2_000,
                                        duration: ji.stats.weakenTime,
                                        script: "/smartjs/scripts/weaken.js",
                                        args: [ t ]
                                    } );
                                    m.scheduling.taskStart( tk1 ).then( () => ji.stage = "hack" );
                                    m.scheduling.taskStart( tk2 ).then( () => ji.stage = "weaken" );
                                    m.scheduling.taskStart( tk3 ).then( () => ji.stage = "grow" );
                                    m.scheduling.taskStart( tk4 ).then( () => ji.stage = "weaken" );
                                    
                                    if ( i == n - 1 ) ji.taskDuration = j + 2_000 + ji.stats.weakenTime;

                                    await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk1 } );
                                    await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk2 } );
                                    await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk3 } );
                                    let tmp = ( await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk4 } ) );

                                    if ( i == 0 ) {
                                        pending = tmp;
                                    }
        
                                    if ( i == n - 1 ) {
                                        ji.last = pending;
                                    }
                                }
        
                                await m.scheduling.taskComplete( pending );
                                ji.task = "sched";
                                ji.taskStarted = await m.time();
                                ji.taskDuration = null;
                                ji.stage = null;
                            } else if ( ji.type == "batch-mono" ) {
                                let tk1 = TaskDesc.new( {
                                    percentMem: 0.25,
                                    start: ji.stats.weakenTime - ji.stats.hackTime - 1_000,
                                    duration: ji.stats.hackTime,
                                    script: "/smartjs/scripts/hack.js",
                                    args: [ t ]
                                } );
                                let tk2 = TaskDesc.new( {
                                    percentMem: 0.25,
                                    duration: ji.stats.weakenTime,
                                    script: "/smartjs/scripts/weaken.js",
                                    args: [ t ]
                                } );
                                let tk3 = TaskDesc.new( {
                                    percentMem: 0.25,
                                    start: ji.stats.weakenTime - ji.stats.growTime + 1_000,
                                    duration: ji.stats.growTime,
                                    script: "/smartjs/scripts/grow.js",
                                    args: [ t ]
                                } );
                                let tk4 = TaskDesc.new( {
                                    percentMem: 0.25,
                                    start: 2_000,
                                    duration: ji.stats.weakenTime,
                                    script: "/smartjs/scripts/weaken.js",
                                    args: [ t ]
                                } );
                                m.scheduling.taskStart( tk1 ).then( () => ji.stage = "hack" );
                                m.scheduling.taskStart( tk3 ).then( () => ji.stage = "grow" );
                                m.scheduling.taskStart( tk4 ).then( () => ji.stage = "weaken" );
                                ji.taskStarted = null;
                                ji.taskDuration = 2_000 + ji.stats.weakenTime;
                                ji.stage = "weaken";
                                await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk1 } );
                                await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk2 } );
                                await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk3 } );
                                pending = ji.last = ( await m.scheduling.partition.schedule( { key: ji.partKey, desc: tk4 } ) );
                                ji.taskStarted = await m.time();
                                await m.scheduling.taskComplete( pending );
                                ji.task = "sched";
                                ji.taskStarted = await m.time();
                                ji.taskDuration = null;
                                ji.stage = null;
                            }
                        }
                    }
                    
                    ji.locked = false;
                } )();
            } )();
        }

        state = {
            time: ctx.time,
            maxJobs: await m.get("NumTargets"),
            jobs: targets.map( t => ( {
                target: t,
                type: jobsMap[t].type,
                status: jobsMap[t].status,
                task: jobsMap[t].task,
                taskStarted: jobsMap[t].taskStarted,
                taskDuration: jobsMap[t].taskDuration,
                stage: jobsMap[t].stage,
                running: jobsMap[t].status == "waiting" ? 0 : ctx.time - jobsMap[t].started,
                stats: jobsMap[t].stats
            } ) )
        };
    } );
    return m.finalize();
}

export { BatchModule as init };