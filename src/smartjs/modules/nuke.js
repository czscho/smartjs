import * as SJS from "/smartjs/lib/common";

function NukeModule ( registrar, ns ) {
    const m = SJS.Modules.Module( registrar, "Nuke", 5_000 );

    m.update( async ctx => {
        ctx.servers.forEach( server => {
            if ( !ns.sshPortOpen && ns.fileExists("BruteSSH.exe") ) {
                ns.brutessh( server );
            }
            
            if ( !ns.ftpPortOpen && ns.fileExists("FTPCrack.exe") ) {
                ns.ftpcrack( server );
            }
            
            if ( !ns.httpPortOpen && ns.fileExists("HTTPWorm.exe") ) {
                ns.httpworm( server );
            }
            
            if ( !ns.smtpPortOpen && ns.fileExists("relaySMTP.exe") ) {
                ns.relaysmtp( server );
            }

            if ( !ns.sqlPortOpen && ns.fileExists("SQLInject.exe") ) {
                ns.sqlinject( server );
            }
            
            if ( !ns.hasRootAccess( server ) && ns.getServer( server ).openPortCount >= ns.getServerNumPortsRequired( server ) ) {
                ns.nuke( server );
                m.info(`NUKEing ${ server }...`);
            }
        } );
    } );
    return m.finalize();
}

export { NukeModule as init };