export function Proxy () {
    const proxy = {};
    return Object.freeze( {
        this: proxy,
        final: obj => {
            Object.assign( proxy, obj );
            return Object.freeze( proxy );
        }
    } );
}