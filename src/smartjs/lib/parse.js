import { OptionType } from "/smartjs/lib/configuration";

export function argparser () {
    const map = {};
    const out = Object.freeze( {
        arg: ( flag, { type = OptionType.STR } = {} ) => {
            map[ flag ] = {
                type
            };

            return out;
        },
        parse: ( arr ) => {
            let args = {};
            let current = null;
            let i = 0;

            for ( ; i < arr.length; i++ ) {
                if ( typeof arr[i] == 'string' && arr[i].startsWith("--") ) {
                    let flag = arr[i].slice(2);

                    if ( current ) {
                        // error out
                    }

                    if ( map[ flag ] ) {
                        if ( map[ flag ].type == OptionType.BOOL ) {
                            args[ flag ] = true;
                        }

                        current = {
                            flag,
                            type: map[ flag ].type
                        };
                    }
                } else if ( current ) {
                    switch ( current.type ) {
                        case OptionType.STR:
                            args[ current.flag ] = arr[i];
                            break;
                        case OptionType.INT:
                            args[ current.flag ] = parseInt( arr[i] );
                            break;
                        case OptionType.FLOAT:
                            args[ current.flag ] = parseFloat( arr[i] );
                            break;
                        case OptionType.ARR:
                            args[ current.flag ] = arr[i].split(",");
                            break;
                    }

                    current = null;
                } else {
                    break;
                }
            }

            return Object.freeze( {
                args,
                end: i
            } );
        }
    } );

    return out;
}

export function commandparser () {
    const map = {};
    const proxy = {};

    function sub ( str, callback, argparser, { path = "", chain = false } = {} ) {
        let qstr = path ? `${ path }.${ str }` : str;
        map[ qstr ] = {
            callback,
            argparser,
            chain
        };

        let p = Object.freeze( {
            cmd:  ( substr, callback, argparser ) => {
                map[ `${ qstr }.${ substr }` ] = {
                    callback,
                    argparser
                };

                return p;
            },
            sub: ( s, cb, ap, { chain = false } = {} ) => sub( s, cb, ap, { path: qstr, chain } ),
            parse: async ( str, { onError = undefined } = {} ) => await proxy.parse( str, { onError } )
        } );

        return p;
    }
    
    Object.assign( proxy, {
        cmd: ( str, callback, argparser ) => {
            map[ str ] = {
                callback,
                argparser
            };

            return proxy;
        },
        sub: ( str, callback, argparser, { chain = false } = {} ) => sub( str, callback, argparser, { path: "", chain } ),
        parse: async ( str, { onError = undefined } = {} ) => {
            let arr = str.split(" ");
            let scope = arr[0];
            let stack = [];

            for ( let i = 0; i < arr.length; ) {
                let s = map[ scope ];

                if ( typeof s == "undefined" ) {
                    if ( typeof onError == "undefined" ) {
                        throw new Error(`no such command: ${ arr[i] }`);
                    }

                    onError(`no such command: ${ arr[i] }`);
                    return;
                }

                let item = {
                    fn: s.callback,
                    args: null,
                    chain: s.chain
                };
                
                stack.push( item );

                if ( s.argparser ) {
                    item.args = s.argparser.parse( arr.slice( i + 1 ) );
                    i += item.args.end;
                    item.args = item.args.args;
                }

                scope = `${ scope }.${ arr[++i] }`;
            }

            stack.slice(-1).forEach( async item => item.fn && item.chain && await item.fn( item.args ) );
            let item = stack.pop();
            await item.fn( item.args );
        } 
    } );

    return Object.freeze( proxy );
}