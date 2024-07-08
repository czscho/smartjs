import { Proxy } from "/smartjs/lib/proxy";
import { createEnum } from "/smartjs/lib/enums";

export const PropType = createEnum( [
    "ANY",
    "STRING",
    "BOOLEAN",
    "INTEGER",
    "FLOAT",
    "ARRAY",
    "TYPED_ARRAY",
    "OBJECT",
    "BLUEPRINT"
] );

function _createProp( name, type, { dfault = undefined, required = true } = {} ) {
    return {
        name,
        type,
        dfault,
        required
    };
}

export function propInfo( type, { dfault = undefined, required = true } = {} ) {
    return {
        type,
        dfault,
        required
    };
}

export function Blueprint ( desc ) {
    const p = Proxy();
    const props = Object.keys( desc ).map( prop => {
        switch ( desc[ prop ] ) {
            case PropType.ANY:
                return _createProp( prop, PropType.ANY );
            case PropType.STRING:
                return _createProp( prop, PropType.STRING );
            case PropType.BOOLEAN:
                return _createProp( prop, PropType.BOOLEAN );
            case PropType.INTEGER:
                return _createProp( prop, PropType.INTEGER );
            case PropType.FLOAT:
                return _createProp( prop, PropType.FLOAT );
            case PropType.ARRAY:
                return _createProp( prop, PropType.ARRAY );
            case PropType.TYPED_ARRAY:
                return _createProp( prop, PropType.TYPED_ARRAY );
            case PropType.OBJECT:
                return _createProp( prop, PropType.OBJECT );
            case PropType.BLUEPRINT:
                return _createProp( prop, PropType.BLUEPRINT );
            default:
                if ( typeof desc[ prop ].type == "undefined" ) {
                    throw new TypeError(`Failed to create Blueprint: description property ${ prop } has unknown type`);
                }

                return _createProp( prop, desc[ prop ].type, { dfault: desc[ prop ].dfault, required: desc[ prop ].required } );
        }
    } );

    return p.final( {
        new: args => {
            let obj = {};

            props.forEach( prop => {
                if ( typeof args[ prop.name ] == "undefined" ) {
                    if ( prop.required ) {
                        throw new Error(`Failed instantiation: args is missing property ${ prop.name }`);
                    } else {
                        obj[ prop.name ] = prop.dfault || null;
                        return;
                    }
                }

                switch ( prop.type ) {
                    case PropType.ANY:
                        obj[ prop.name ] = args[ prop.name ];
                        break;
                    case PropType.STRING:
                        if ( typeof args[ prop.name ] != "string" ) {
                            throw new Error(`Failed instantiation: propety '${ prop.name }' must be of type string`);
                        }

                        obj[ prop.name ] = args[ prop.name ];
                        break;
                    case PropType.BOOLEAN:
                        if ( typeof args[ prop.name ] != "boolean" ) {
                            throw new Error(`Failed instantiation: propety '${ prop.name }' must be of type boolean`);
                        }

                        obj[ prop.name ] = args[ prop.name ];
                        break;
                    case PropType.INTEGER:
                        if ( typeof args[ prop.name ] != "number" ) {
                            throw new Error(`Failed instantiation: propety '${ prop.name }' must be of type integer`);
                        }

                        try {
                            obj[ prop.name ] = parseInt( args[ prop.name ] );
                        } catch ( e ) {
                            throw new Error(`Failed instantiation: could not parse integer from '${ prop.name }' -> '${ args[ prop.name ] }'`);
                        }

                        break;
                    case PropType.FLOAT:
                        if ( typeof args[ prop.name ] != "number" ) {
                            throw new Error(`Failed instantiation: property '${ prop.name }' must be of type float`);
                        }

                        obj[ prop.name ] = args[ prop.name ];
                        break;
                    case PropType.ARRAY:
                        if ( !Array.isArray( args[ prop.name ] ) ) {
                            throw new Error(`Failed instantiation: property '${ prop.name }' must be of type array`);
                        }

                        obj[ prop.name ] = args[ prop.name ];
                        break;
                    case PropType.TYPED_ARRAY:
                        break;
                    case PropType.OBJECT:
                        break;
                    case PropType.BLUEPRINT:
                        if ( !args[ prop.name ].__bp ) {
                            throw new Error(`Failed instantiation: property '${ prop.name }' must be of type Blueprint`);
                        }

                        obj[ prop.name ] = args[ prop.name ];
                        break;
                    default:
                        throw new TypeError(`Failed instantiation: property '${ prop.name }' has unknown type`);
                }
            } );

            return obj;
        },
        assert: obj => {
            props.forEach( prop => {
                if ( prop.required && typeof obj[ prop.name ] == "undefined" ) {
                    throw new TypeError(`Failed assertion: object is missing property ${ prop.name }`);
                }

                switch ( prop.type ) {
                    case PropType.ANY:
                        break;
                    case PropType.STRING:
                        break;
                    case PropType.BOOLEAN:
                        break;
                    case PropType.INTEGER:
                        break;
                    case PropType.FLOAT:
                        break;
                    case PropType.ARRAY:
                        break;
                    case PropType.TYPED_ARRAY:
                        break;
                    case PropType.OBJECT:
                        break;
                    case PropType.BLUEPRINT:
                        break;
                    default:
                        throw new TypeError(`Failed assertion: description property ${ prop.name } has unknown type`);
                }
            } );
        }
    } );
}