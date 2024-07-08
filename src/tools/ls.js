export function main( ns ) {
    if ( !ns.args[0] )
        ns.tprint("Please specify a server to list files from");
    
    ns.tprint( ns.ls( ns.args[0] ) );
}