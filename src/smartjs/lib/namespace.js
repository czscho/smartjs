import { Proxy } from "/smartjs/lib/proxy";

export function Namespace ( str ) {
    const p = Proxy();
    const arr = str.split(".");

    return p.final( {
        test: () => {}
    } );
}