export function startAsyncLoop ( stepFn, predFn ) {
    return ( async () => {
        while ( await predFn() ) {
            await stepFn();
        }
    } )();
}