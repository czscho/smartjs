export class Enum {}

export function createEnum ( data ) {
    let base = {}, final = new Enum();
    let increment = 0;
    let incr = () => increment++;

    if ( typeof data == 'function' ) {
        let valueMap = data( incr );
        let keys = Object.keys( valueMap );

        for ( let i = 0; i < keys.length; i++ ) {
            let value = valueMap[ keys[i] ];

            if ( value ) {
                final[ keys[i].toUpperCase() ] = base[ keys[i].toUpperCase() ] = value;
            } else {
                final[ keys[i].toUpperCase() ] = base[ keys[i].toUpperCase() ] = incr();
            }
        }
    } else if ( typeof data == 'object' && data instanceof Array ) {
        data.forEach(
            element => {
                if ( typeof element == 'string' ) {
                    final[ element.toUpperCase() ] = base[ element.toUpperCase() ] = incr();
                } else if ( typeof element == 'object' ) {
                    let keys = Object.keys( element );

                    for ( let i = 0; i < keys.length; i++ ) {
                        let value = element[ keys[i] ];

                        if ( value ) {
                            final[ keys[i].toUpperCase() ] = base[ keys[i].toUpperCase() ] = value;
                        } else {
                            final[ keys[i].toUpperCase() ] = base[ keys[i].toUpperCase() ] = incr();
                        }
                    }
                } else {
                    //
                }
            }
        );
    } else {
        let keys = Object.keys( data );

        for ( let i = 0; i < keys.length; i++ ) {
            let value = data[ keys[i] ];

            final[ keys[i].toUpperCase() ] = base[ keys[i].toUpperCase() ] = value ? value : incr();
        }
    }

    final.getValues = () => {
        return Object.keys( base );
    };

    return Object.freeze( final );
}

export function createLabels ( map ) {
    let base = {};
    let reversed = {};
    let labels = Object.keys( map );

    for ( let i = 0; i < labels.length; i++ ) {
        let label = labels[i];
        let key = map[ label ];

        base[ label ] = map[ label ];
        reversed[ key ] = label;
    }

    return Object.freeze( {
        ...base,
        getLabels: () => {
            return Object.keys( base );
        },
        getKeys: () => {
            return Object.values( base );
        },
        byKeys: () => {
            return reversed;
        }
    } );
}

/*
    Status codes
*/
export const StatusCode = createEnum( [
    "OK",
    "ERROR",
    "CRASHED",
    "UNKNOWN",
    "STARTING",
    "STOPPING",
    "STOPPED"
] );

export const StatusCodeMessages = createLabels( {
    "OK": StatusCode.OK,
    "ERROR": StatusCode.ERROR,
    "CRASHED": StatusCode.CRASHED,
    "UNKNOWN": StatusCode.UNKNOWN,
    "STARTING": StatusCode.STARTING,
    "STOPPING": StatusCode.STOPPING,
    "STOPPED": StatusCode.STOPPED
} );