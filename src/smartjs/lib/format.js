/** @file Formatting logic. */

import { numeral } from "/smartjs/lib/external/numeral";

/**
 * @description Convert a time in milliseconds to a "DHMS"-formatted string.
 * @param {number} ms - A time in milliseconds.
 * @returns A "DHMS"-formatted string.
 */
function dhms ( ms ) {
    return ms > 86_399_999 ? `${Math.floor( ms / 86_400_000 )}d ${Math.floor( ms % 86_400_000 / 3_600_000 )}h ${Math.floor( ms % 86_400_000 % 3_600_000 / 60_000 )}m ${Math.floor( ms % 86_400_000 % 3_600_000 % 60_000 / 1_000 )}s` :
            ms > 3_599_999 ? `${Math.floor( ms / 3_600_000 )}h ${Math.floor( ms % 3_600_000 / 60_000 )}m ${Math.floor( ms % 3_600_000 % 60_000 / 1_000 )}s` :
             ms > 59_999 ? `${Math.floor( ms / 60_000 )}m ${Math.floor( ms % 60_000 / 1_000 )}s` :
              `${Math.floor( ms / 1_000 )}s`;
}

export {
    numeral,
    dhms
};