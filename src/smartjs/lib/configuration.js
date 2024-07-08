import { Proxy } from "/smartjs/lib/proxy";
import { Enum, createEnum } from "/smartjs/lib/enums";

export const OptionType = createEnum( [
    "STR",
    "BOOL",
    "INT",
    "FLOAT",
    "ARR",
    { "ENUM": Enum }
] );

export function Configuration () {
    const p = Proxy();
    const _defs = {};
    const _flat = {};
    
    let _buffer = {};

    function validateFromString ( key, value ) {
        let def = _defs[ key ];
        let parsed;

        switch ( def.type ) {
            case OptionType.STR:
                if ( !value && value != "" ) {
                    throw new TypeError(`${key} expects a string value, got ${value}`);
                }

                return value;
            case OptionType.BOOL:
                if ( value != "true" && value != "false" ) {
                    throw new TypeError(`${key} expects a boolean value, got ${value}`);
                }

                return value == "true";
            case OptionType.INT:
                parsed = parseInt( value );

                if ( parsed !== NaN ) {
                    return parsed;
                }

                throw new TypeError(`${key} expects an integer value, got ${value}`);
            case OptionType.FLOAT:
                parsed = parseFloat( value );

                if ( parsed != NaN ) {
                    return parsed;
                }

                throw new TypeError(`${key} expects a floating point value, got ${value}`);
            case OptionType.ARR:
                return value.split( def.delimiter || "," );
            default:
                if ( !( def.type instanceof OptionType.ENUM ) ) {
                    throw new TypeError(`${key} has an unknown type ${def.type}`);
                }

                if ( typeof def.labels[ value ] != 'undefined' ) {
                    return def.labels[ value ];
                }

                throw new TypeError(`${key} expected a member of an enumeration, got ${value}`);
        }
    }

    function validate ( key, value ) {
        let def = _defs[ key ];

        switch ( def.type ) {
            case OptionType.STR:
                if ( !value && value != "" ) {
                    throw new TypeError(`${key} expects a string value, got ${value}`);
                }

                return value;
            case OptionType.BOOL:
                if ( value != true && value != false ) {
                    throw new TypeError(`${key} expects a boolean value, got ${value}`);
                }

                return value;
            case OptionType.INT:
                if ( Number.isInteger( value ) ) {
                    return value;
                }

                throw new TypeError(`${key} expects an integer value, got ${value}`);
            case OptionType.FLOAT:
                if ( value == 0 || ( value && value.constructor && value.constructor.name == "Number" ) ) {
                    return value;
                }

                throw new TypeError(`${key} expects a floating point value, got ${value}`);
            case OptionType.ARR:
                if ( value && value.constructor && value.constructor.name == "Array" ) {
                    return value;
                }

                throw new TypeError(`${key} expects an array value, got ${value}`);
            default:
                if ( !( def.type instanceof OptionType.ENUM ) ) {
                    throw new TypeError(`${key} has an unknown type ${ def.type }`);
                }

                if ( typeof def.labels.byKeys()[ value ] != 'undefined' ) {
                    return value;
                }

                throw new TypeError(`${key} expected a member of an enumeration, got ${value}`);
        }
    }

    return p.final( {
        define: ( key, type, initial, { label = key, description = "No description", delimiter = undefined, labels = undefined } = {} ) => {
            _defs[ key ] = {
                type,
                initial,
                label,
                description,
                delimiter,
                labels
            };
            _flat[ key ] = initial;
        },
        loadFile: ( contents, { base = "", undefAction = "ignore", toBuffer = false } = {} ) => {
            let scope = [];
            let error = false;
            let map = {};

            contents.split("\n").forEach( ( line, index ) => {
                if ( error ) {
                    return;
                }

                if ( !line || /^\s*$/.test( line ) || /^\s*#.*$/.test( line ) || /^\s*\/\/.*$/.test( line ) ) {
                    return;
                }

                if ( !line.startsWith( "\t".repeat( scope.length ) ) ) {
                    let len = line.match(`^\t*`)[0].length;

                    if ( len > scope.length ) {
                        error = `error at line ${ index + 1 }: invalid indentation`;
                        return;
                    } else {
                        scope = scope.slice( 0, len );
                    }
                }

                line = line.replace( /^\t*/, "" );

                if ( /\[.*\]/.test( line ) ) {
                    scope.push( line.slice( 1, line.length - 1 ) );
                    return;
                }

                let arr = line.split("=");

                if ( arr.length < 2 ) {
                    error = `error at line ${ index + 1 }`;
                    return;
                }

                let key = arr[0];

                if ( !/[A-z0-9\.]*/.test( key ) ) {
                    error = `error at line ${ index + 1 }: only alphanumeric keys are allowed`;
                    return;
                }

                if ( scope.length > 0 ) {
                    key = `${ scope.reduce( ( prev, cur ) => `${ prev }.${ cur }` ) }.${ key }`;
                }

                map[ key ] = arr.slice( 1 ).reduce( ( prev, cur ) => `${ prev }=${ cur }` );
            } );
            Object.keys( map ).forEach( key => {
                if ( toBuffer ) {
                    _buffer[ `${ base ? base + "." : "" }${ key }` ] = map[ key ];
                } else {
                    if ( undefAction == "ignore" && typeof _defs[ key ] == "undefined"  ) {
                        return;
                    }

                    p.this.set( `${ base ? base + "." : "" }${ key }`, map[ key ], { fromString: true } );
                }
            } );

            if ( error ) {
                throw new Error( error );
            }
        },
        flushBuffer: ( { undefAction = "discard" } = {} ) => {
            Object.keys( _buffer ).forEach( key => {
                if ( typeof _defs[ key ] == "undefined" ) {
                    if ( undefAction == "discard" ) {
                        delete _buffer[ key ];
                    }

                    return;
                }

                p.this.set( key, _buffer[ key ], { fromString: true } );
                delete _buffer[ key ];
            } );
        },
        toFile: ( { flat = true } = {} ) => {
            let out = "";
            if ( flat ) {
                Object.keys( _flat ).forEach( key => out += `${key}=${_flat[ key ]}` );
            } else {
                //
            }
            return out;
        },
        get: key => {
            if ( typeof _defs[ key ] == 'undefined' ) {
                throw new Error(`tried to accessed nonexistent option ${ key }`);
            }

            return _flat[ key ];
        },
        getAll: ( { base = "" } = {} ) => {
            let obj = {};
            Object.keys( _defs ).filter( k => !base || k.startsWith( base ) ).forEach( k => obj[k] = _flat[k] );
            return obj;
        },
        set: ( key, value, { fromString = false } = {} ) => {
            if ( typeof _defs[ key ] == "undefined" ) {
                throw new Error(`tried to update nonexistent option ${ key }`);
            }

            _flat[ key ] = fromString ? validateFromString( key, value ) : validate( key, value );
        },
        print: ( { base = "" } = {} ) => {
            //
        },
        sub: ( qualifier ) => {
            const prxy = {};
            Object.assign( prxy, {
                define: ( key, type, initial, { label = undefined, description = undefined, delimiter = undefined, labels = undefined } = {} ) => p.this.define( `${qualifier}.${key}`, type, initial, { label, description, delimiter, labels } ),
                loadFile: ( contents, { base = `${qualifier}`, toBuffer = undefined, undefAction = undefined } = {} ) => p.this.loadFile( contents, { base, toBuffer, undefAction } ),
                flushBuffer: ( { undefAction = undefined } = {} ) => p.this.flushBuffer( { undefAction } ),
                set: ( key, value, { fromString = false } = {} ) => p.this.set( `${qualifier}.${key}`, value, { fromString } ),
                toFile: ( { flat = true } = {} ) => p.this.toFile( { flat } ),
                get: key => p.this.get( `${qualifier}.${key}` ),
                getAll: () => p.this.getAll( { base: qualifier } ),
                print: ( { base = qualifier } = {} ) => p.this.print( { base } ),
                sub: ( qulifier ) => p.this.sub( `${qualifier}.${qulifier}` )
            } );
            return Object.freeze( prxy );
        }
    } );
};