const { spawn } = require('child_process');

var os = require('os');
var pty = require('node-pty');

class TestUtils {
    static ptyProcesses = [];

    static launchProcess(command, inputEventHandler = null, exitEventHandler = null) {

        var shell = os.platform() === 'win32' ? 'powershell.exe' : 'sh';

        var ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.PWD,
            env: process.env
        });
        
        ptyProcess.onData((data) => {
            if(inputEventHandler)
                inputEventHandler(ptyProcess, data);
        });

        ptyProcess.onExit((exitCode, signal) => {
            if(exitEventHandler)
                exitEventHandler(ptyProcess, exitCode, signal);
        });

        this.ptyProcesses.push(ptyProcess);
        ptyProcess.write(`${command}\r`);
        return ptyProcess;
    }

    static terminateProcesses() {
        this.ptyProcesses.forEach(
            p => {
                p.kill("SIGHUP");
            }
        );
    }
}

module.exports = TestUtils
