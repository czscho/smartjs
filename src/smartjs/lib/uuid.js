/** @file Utility function to generate a UUID. Taken from https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid.  */

export function generateUUID () {
    let time = new Date().getTime();
    let timeSincePageLoad = ( typeof performance !== 'undefined' && performance.now ) ? performance.now() * 1_000 : 0;

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, char => {
        let random = Math.random() * 16;

        if ( time > 0 ) {
            random = ( time + random ) % 16 | 0;
            time = Math.floor( time / 16 );
        } else {
            random = ( timeSincePageLoad + random ) % 16 | 0;
            timeSincePageLoad = Math.floor( timeSincePageLoad / 16 );
        }

        return ( char == "x" ? random : ( random & 0x3 | 0x8 ) ).toString(16);
    } );
}