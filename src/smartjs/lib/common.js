import * as Enums from "/smartjs/lib/enums";
import * as Format from "/smartjs/lib/format";
import * as Logging from "/smartjs/lib/log";

import { Blueprint, PropType, propInfo } from "/smartjs/lib/blueprint";
import { generateUUID } from "/smartjs/lib/uuid";
import { sleep } from "/smartjs/lib/sleep";
import { SmartModule, Configuration, OptionType } from "/smartjs/lib/smartmodule";

const win = eval("window");
const doc = eval("document");

const _Util = {
    Enum: Enums.createEnum,
    Enums: {
        Labels: Enums.createLabels,
        StatusCode: Enums.StatusCode,
        StatusCodeMessages: Enums.StatusCodeMessages,
        LogLevel: Enums.LogLevel,
        LogLevelLabels: Enums.LogLevelLabels
    },

    Blueprint,
    Blueprints: {
        PropType,
        propInfo
    },

    Format: {
        dhms: Format.dhms,
        nfmt: ( num, fmt ) => Format.numeral( num ).format( fmt )
    },

    sleep,
    generateUUID
};

const _Logging = {
    LogLevel: Logging.LogLevel,
    Logger: Logging.Logger
};

const _Modules = {
    Module: SmartModule,
    Configuration: Configuration,
    OptionType: OptionType
};

export {
    win,
    doc,

    _Util as Util,
    _Logging as Logging,
    _Modules as Modules
};