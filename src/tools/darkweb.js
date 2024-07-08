export async function main(ns) {
    const doc = eval("document");
    let terminalInput = doc.getElementById("terminal-input");
    let handler = Object.keys(terminalInput)[1];

    terminalInput.value = "home; connect darkweb; buy BruteSSH.exe; buy FTPCrack.exe; buy relaySMTP.exe; buy HTTPWorm.exe; buy SQLInject.exe; home";
    terminalInput[handler].onChange({ target: terminalInput });
    terminalInput[handler].onKeyDown({ key: "Enter", preventDefault: () => null });
}