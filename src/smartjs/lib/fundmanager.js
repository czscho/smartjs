import * as SJS from "/smartjs/lib/common";

export const FundType = SJS.Util.Enum( [
    "FIXED",
    "PERCENT",
    "PERCENT_FREE"
] );