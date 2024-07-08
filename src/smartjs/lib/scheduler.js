import * as SJS from "/smartjs/lib/common";

// Enums

export const ResultCode = SJS.Util.Enum( [
    "SUCCESS",
    "ERROR",
    "FAILURE"
] );

export const ContainerType = SJS.Util.Enum( [
    "ROOT",
    "SHARE",
    "PARTITION"
] );

export const ShareType = SJS.Util.Enum( [
    "FIXED",
    "PERCENT",
    "DYNAMIC",
    "POOL"
] );

export const ShareTypeLabels = SJS.Util.Enums.Labels( {
    "FIXED": ShareType.FIXED,
    "PERCENT": ShareType.PERCENT,
    "DYNAMIC": ShareType.DYNAMIC,
    "POOL": ShareType.POOL
} );

export const PartitionType = SJS.Util.Enum( [
    "FIXED",
    "PERCENT",
    "DYNAMIC"
] );

export const PartitionTypeLabels = SJS.Util.Enums.Labels( {
    "FIXED": PartitionType.FIXED,
    "PERCENT": PartitionType.PERCENT,
    "DYNAMIC": PartitionType.DYNAMIC
} );

export const PartitionLayoutPreset = SJS.Util.Enum( [
    "NONE",
    "EVEN"
] );

// Descs

export const ShareDesc = SJS.Util.Blueprint( {
    type: SJS.Util.Blueprints.PropType.INTEGER,
    mem: SJS.Util.Blueprints.PropType.FLOAT
} );

export const PartitionDesc = SJS.Util.Blueprint( {
    share: SJS.Util.Blueprints.PropType.STRING,
    type: SJS.Util.Blueprints.PropType.INTEGER,
    mem: SJS.Util.Blueprints.PropType.FLOAT
} );

export const PartitionLayoutDesc = SJS.Util.Blueprint( {
    share: SJS.Util.Blueprints.PropType.STRING,
    mem: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.FLOAT, { dfault: 0, required: false } ),
    type: SJS.Util.Blueprints.PropType.INTEGER,
    partitions: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.ARRAY, { dfault: [], required: false } ),
    numPartitions: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.INTEGER, { required: false } )
} );

export const TaskDesc = SJS.Util.Blueprint( {
    script: SJS.Util.Blueprints.PropType.STRING,
    args: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.ARRAY, { required: false } ),
    threads: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.INTEGER, { required: false } ),
    start: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.INTEGER, { required: false } ),
    duration: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.INTEGER, { required: false, dfault: 0 } ),
    percentMem: SJS.Util.Blueprints.propInfo( SJS.Util.Blueprints.PropType.FLOAT, { required: false } )
} );

// Results

export const ExecResult = SJS.Util.Blueprint( {
    code: SJS.Util.Blueprints.PropType.INTEGER,
    message: SJS.Util.Blueprints.PropType.STRING
} );