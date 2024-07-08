function encodeLz ( plain ) {
    let encoded = "";

    for ( let i = 0; i < plain.length; ) {
        let rem = plain.length - i;
        let first = 0, second = 0, back = 0, score = 0;

        for ( let j = 1; j < 10 && j < rem && score < 9; j++ ) {
            for ( let k = 3; k < 10 && j + k < rem && score < 9; k++ ) {
                for ( let l = 1; l < 10 && j + k + l < rem; l++ ) {
                    let buffer = plain.slice( i + j, i + j + k );
                    let forward = plain.slice( i + j - l, i + j + k - l );

                    if ( buffer == forward && k > score ) {
                        //console.log(`L: ${ k }, O: ${ l }, D: ${ buffer }`);
                        score = k;
                        first = j;
                        second = k;
                        back = l;

                        if ( score == 9 ) {
                            break;
                        }
                    }
                }
            }
        }

        if ( score == 0 ) {
            first = Math.min( 9, rem );
            second = 0;
        }

        encoded += `${ first }`
        
        if ( first > 0 ) {
            encoded += plain.slice( i, i + first );
        }
        
        i += first;

        if ( i == plain.length ) {
            break;
        }

        if ( score > 0 ) {
            encoded += `${ second }${ back }`;
            i += second;
        } else {
            encoded += "0";
        }
    }

    return encoded;
}

function decodeLz ( encoded ) {
    let plain = "";

    for ( let i = 0; i < encoded.length; ) {
        let length = parseInt( encoded[ i++ ] );

        plain += encoded.slice( i, i + length );
        i += length;

        if ( i >= encoded.length ) {
            break;
        }

        length = parseInt( encoded[ i++ ] );

        if ( length == 0 ) {
            continue;
        }

        let reference = parseInt( encoded[ i++ ] );

        for ( let j = 0; j < length; j++ ) {
            plain += plain[ plain.length - reference ];
        }
    }

    return plain;
}

self.onmessage = e => {
    let solution = "";
    let type = e.data.type;
    let description = e.data.description;

    if ( type == "Find Largest Prime Factor" ) {
        let num = parseInt( description.match( /[0-9]+/ ) );
        let factor = -1;

        while ( num % 2 == 0 ) {
            num /= 2;
            factor = 2;
        }

        for ( let k = 3; k <= Math.sqrt( num ); k += 2 ) {
            while ( num % k == 0 ) {
                num /= k;
                factor = k;
            }
        }
        
        if ( num > 2 && num > factor ) {
            factor = num;
        }
        
        solution = factor;
    } else if ( type == "Subarray with Maximum Sum" ) {
        let arr = description
            .match( /(\-*[0-9]+\,)+\-*[0-9]+/ )[0]
            .split(",");

        for (let k = 0; k < arr.length; k++) {
            arr[k] = parseInt( arr[k] );
        }

        let maxSum = arr[0];
        let curSum = arr[0];

        for ( let k = 1; k < arr.length; k++ ) {
            curSum = Math.max( arr[k], curSum + arr[k] );
            maxSum = Math.max( curSum, maxSum );
        }

        solution = maxSum;
    } else if ( type == "Total Ways to Sum" ) {
        let num = parseInt( description.match( /number [0-9]+ be/ )[0].match( /[0-9]+/ )[0] );
        let arr = Array.from( { length: num + 1 }, () => 0 );

        arr[0] = 1;

        for ( let k = 1; k < num + 1; k++ ) {
            for ( let l = 1; l < num + 1; l++ ) {
                if ( l >= k ) {
                    arr[l] = arr[l] + arr[ l - k ];
                }
            }
        }
        
        solution = arr[ num ] - 1;
    } else if ( type == "Total Ways to Sum II" ) {
        let num = parseInt(
            description
            .match( /number [0-9]+ be/ )[0]
            .match( /[0-9]+/ )[0]
        );
        let arr = description
            .match( /([0-9]+\,)+[0-9]+/ )[0]
            .split(",");

        // TODO

        for ( let k = 0; k < arr.length; k++ ) {
            arr[k] = parseInt( arr[k] );
        }
    } else if ( type == "Spiralize Matrix" ) {
        let matrix = JSON.parse(
            description
            .match( /in spiral order:.*\[[(&nbsp;)\s]+(\[(\s*[0-9]+\,)+\s*[0-9]+\][(&nbsp;)\s]+)+\]/s )[0]
            .match( /\[[(&nbsp;)\s]+(\[(\s*[0-9]+\,)+\s*[0-9]+\][(&nbsp;)\s]+)+\]/s )[0]
            .replaceAll( /[(&nbsp;)\s\n]/g, "" )
            .replaceAll( /\]\[/g, "],[" )
        );
        let length = matrix.reduce( ( prevVal, _, index ) => prevVal + matrix[ index ].length, 0 );
        let arr = [];

        for ( let x = 0, y = 0, ox = 0, oy = 0, d = 0, n = 0; n < length; n++ ) {
            if ( x == matrix[y].length - ox - 1 && y == oy ) {
                d = 1;
            } else if ( d == 1 && x == matrix[y].length - ox - 1 && y == matrix.length - oy - 1 ) {
                d = 2;
            } else if ( d == 2 && x == ox && y == matrix.length - oy - 1 ) {
                d = 3;
                oy++;
            } else if ( d == 3 && n > 0 && x == ox && y == oy && x + ox < matrix[y].length - 1 ) {
                d = 0;
                ox++;
            }

            arr.push( matrix[y][x] );
            
            if ( d == 0 ) {
                x++;
            } else if( d == 1 ) {
                y++;
            } else if( d == 2 ) {
                x--;
            } else if ( d == 3 ) {
                y--;
            }
        }
        
        solution = arr;
    } else if ( type == "Array Jumping Game" ) {
        let num = "";

        // TODO
    } else if ( type == "Array Jumping Game II" ) {
        let num = "";

        // TODO
    } else if ( type == "Merge Overlapping Intervals" ) {
        let intervals = JSON.parse( description.match( /\[(\[[0-9]+\,[0-9]+\]\,)+\[[0-9]+\,[0-9]+\]\]/ )[0] );
        let merged = [];

        for ( let k = 0; k < 3; k++ ) {
            if ( k > 0 ) {
                intervals = merged;
                merged = [];
            }

            for ( let l = 0; l < intervals.length; l++ ) {
                let lower = intervals[l][0];
                let upper = intervals[l][1];
                let overlapping = false;

                for ( let n = 0; n < merged.length; n++ ) {
                    if( lower > merged[n][0] && upper < merged[n][1] ) {
                        overlapping = true;
                    }
                    
                    if ( lower <= merged[n][0] && upper >= merged[n][0] ) {
                        overlapping = true;
                        merged[n][0] = lower;
                    }

                    if ( lower <= merged[n][1] && upper >= merged[n][1] ) {
                        overlapping = true;
                        merged[n][1] = upper;
                    }
                }
                
                if ( !overlapping ) {
                    merged.push( [ lower, upper ] );
                }
            }
        }

        merged.sort( ( a, b ) => a[0] < b[0] ? -1 : 1 );
        solution = merged;
    } else if ( type == "Generate IP Addresses" ) {
        let num = "";

        // TODO
    } else if ( type == "Algorithmic Stock Trader I" ) {
        let arr = description.match( /([0-9]+\,)+[0-9]+/ )[0].split(",");
        let maxProfit = 0;

        for ( let k = 0; k < arr.length; k++ ) {
            arr[k] = parseInt(arr[k]);
        }

        for ( let k = 0; k < arr.length; k++ ) {
            let highest = arr[k];

            for ( let l = k; l < arr.length; l++ ) {
                if ( arr[l] > highest ) {
                    highest = arr[l];
                }
            }
            
            if ( highest - arr[k] > maxProfit ) {
                maxProfit = highest - arr[k];
            }
        }

        solution = maxProfit;
    } else if ( type == "Algorithmic Stock Trader II" ) {
        let arr = description
            .match( /([0-9]+\,)+[0-9]+/ )[0]
            .split(",");
        
        // TODO
    } else if ( type == "Algorithmic Stock Trader III" ) {
        let num = "";

        // TODO
    } else if ( type == "Algorithmic Stock Trader IV" ) {
        let num = "";

        // TODO
    } else if ( type == "Minimum Path Sum in a Triangle" ) {
        let num = "";

        // TODO
    } else if ( type == "Unique Paths in a Grid I" ) {
        let num = "";

        // TODO
    } else if ( type == "Unique Paths in a Grid II" ) {
        let num = "";

        // TODO
    } else if ( type == "Shortest Path in a Grid" ) {
        let num = "";

        // TODO
    } else if ( type == "Sanitize Parentheses in Expression" ) {
        let num = "";

        // TODO
    } else if ( type == "Find All Valid Math Expressions" ) {
        let num = "";

        // TODO
    } else if ( type == "HammingCodes: Integer to Encoded Binary" ) {
        let num = parseInt(
            description
            .match( /value:\s*[0-9]+/ )[0]
            .match( /[0-9]+/ )[0]
        );

        // TODO
    } else if ( type == "HammingCodes: Encoded Binary to Integer" ) {
        let num = "";

        // TODO
    } else if ( type == "Proper 2-Coloring of a Graph" ) {
        let num = "";

        // TODO
    } else if ( type == "Compression I: RLE Compression" ) {
        let encoded = description.match( /string:(?:\s|&nbsp;)*(?<encoded>[A-Za-z0-9]*)(?:\s|&nbsp;)*Encode/ ).groups.encoded;

        //console.log(encoded);

        // TODO
    } else if ( type == "Compression II: LZ Decompression" ) { // WORKING
        let encoded = description.match( /string:(?:\s|&nbsp;)*(?<encoded>[A-Za-z0-9]*)(?:\s|&nbsp;)*Decode/ ).groups.encoded;
        let plain = decodeLz( encoded );

        solution = plain;
    } else if ( type == "Compression III: LZ Compression" ) {
        let plain = description.match( /string:(?:\s|&nbsp;)*(?<plain>[A-Za-z0-9]*)(?:\s|&nbsp;)*Encode/ ).groups.plain;
        let encoded = encodeLz( plain );
        let decoded = decodeLz( encoded );

        //console.log( "\nPLAIN: " + plain + "\nENCODED: " + encoded +  "\nDECODED: " + decoded + "\nMATCH: " + ( plain == decoded ) );
        //solution = encoded;
    } else if ( type == "Encryption I: Caesar Cipher" ) {
        const ALPHABET = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ];

        let arr = description.match( /"[\sA-Z]+", [0-9]+/ )[0].split(", ");
        let text = arr[0].slice(1, arr[0].length - 1).split("");
        let leftShift = parseInt(arr[1]);

        for ( let k = 0; k < text.length; k++ ) {
            let index = ALPHABET.indexOf(text[k]);

            if ( index > -1 ) {
                text[k] = ALPHABET[ index - leftShift < 0 ? ALPHABET.length + index - leftShift : index - leftShift ];
            }
        }

        solution = text.reduce( ( prevVal, curVal ) => prevVal + curVal, "" );
    } else if ( type == "Encryption II: Vigenère Cipher" ) {
        const ALPHABET = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ];

        let arr = description.match( /"[A-Z]+", "[A-Z]+"/ )[0].split(", ");
        let text = arr[0]
            .slice( 1, arr[0].length - 1 )
            .split("");
        let key = arr[1]
            .slice( 1, arr[1].length - 1 )
            .split("");

        for ( let k = 0, l = 0; k < text.length; k++, l++ ) {
            if ( l >= key.length ) {
                l = 0;
            }
            
            let plainIndex = ALPHABET.indexOf( text[k] );
            let keyIndex = ALPHABET.indexOf( key[l] );

            text[k] = ALPHABET[ ( plainIndex + keyIndex ) % 26 ];
        }

        solution = text.reduce( ( prevVal, curVal ) => prevVal + curVal, "" );
    }

    if ( solution ) {
        self.postMessage( {
            contract: e.data.contract,
            solution
        } );
    }
}