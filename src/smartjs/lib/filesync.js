import * as SJS from "/smartjs/lib/common";

export const SyncRequest = SJS.Util.Blueprint( {
    source: SJS.Util.Blueprints.PropType.STRING,
    files: SJS.Util.Blueprints.PropType.ARRAY,
    destinations: SJS.Util.Blueprints.PropType.ARRAY
} );