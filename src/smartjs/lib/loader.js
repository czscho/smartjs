export function genLoader ( ns, arr, outFile ) {
    let out = "";

    arr.forEach( ( item, index ) => {
        out += `import { init as N${ index } } from "${ item }";\n`;
    } );
    out += "\nexport async function load ( argsFn ) {\n\tlet arr = [";
    arr.forEach( ( _, index ) => {
        out += `N${ index }`;

        if ( index < arr.length - 1 ) {
            out += ",";
        }
    } );
    out += "];\n\tfor ( let i = 0; i < arr.length; i++ ) arr[i] = await arr[i]( ...argsFn() );\n\treturn arr;\n}";
    ns.write( outFile, out, "w" );
}