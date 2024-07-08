export async function main(ns) {
    if (!ns.args[0]) {
        ns.tprint("Please provide a server to connect to");
        
        return;
    }

    let toScan = [ { server: "home", path: "home" } ];
    let scanned = [];

    while (toScan.length > 0) {
        let toAdd = [];

        for (let i = 0; i < toScan.length; i++) {
            let adjacent = ns.scan(toScan[i].server).filter(server => server != "home" && !scanned.includes(server));

            scanned.push(toScan[i].server);

            for (let j = 0; j < adjacent.length; j++) {
                if (adjacent[j] == ns.args[0]) {
                    await ns.sleep(100);

                    const doc = eval("document");
                    let terminalInput = doc.getElementById("terminal-input");
                    let handler = Object.keys(terminalInput)[1];

                    terminalInput.value = `${toScan[i].path}; connect ${adjacent[j]}`;
                    terminalInput[handler].onChange({ target: terminalInput });
                    terminalInput[handler].onKeyDown({ key: "Enter", preventDefault: () => null });

                    return;
                }

                toAdd.push({ 
                    server: adjacent[j],
                    path: `${toScan[i].path}; connect ${adjacent[j]}`
                });
            }
        }

        toScan = toAdd;
    }

    ns.tprint(`Could not find "${ns.args[0]}"`);
}