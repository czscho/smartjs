import { startAsyncLoop } from "/smartjs/lib/asyncloop";

export function startNSAsyncLoop ( ns, stepFn, { predFn = () => true } = {} ) {
    let ctrl = true;
    ns.atExit( () => ctrl = false );
    return startAsyncLoop( stepFn, async () => ctrl && await predFn() );
}

export async function startNSEAsyncLoop ( nse, stepFn, { predFn = () => true } = {} ) {
    let ctrl = true;
    await nse.exec( ns => ns.atExit( () => ctrl = false ) );
    return startAsyncLoop( stepFn, async () => ctrl && await predFn() );
}