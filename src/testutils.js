const { spawn } = require('child_process');

class TestUtils {
    static launchAd4mProcess(args, finishedCallback = null) {
        if(!global.ad4mProcesses) {
            global.ad4mProcesses = [];
        }

        args.unshift("bin/ad4m");
        let process = spawn('node', args);
        
        // Keep track of the process, so we do not leave orphaned processes
        // when anything goes bonkers.
        global.ad4mProcesses.push(process);

        process.stdout.on('data', (chunk) => {
            if(!process.outputChunks)
                process.outputChunks = [];

            process.outputChunks.push(chunk);
        });

        // process.stdout.on('end', () => {
        //     // Since the process has terminated, we can stop tracking it.
        //     global.ad4mProcesses = global.ad4mProcesses.filter((v) => v != process);

        //     if(finishedCallback) {
        //         let output = Buffer.concat(process.outputChunks).toString();
        //         finishedCallback(output);
        //     }
        // });

        process.on('close', () => {
            // Since the process has terminated, we can stop tracking it.
            global.ad4mProcesses = global.ad4mProcesses.filter((v) => v != process);

            if(finishedCallback) {
                let output = Buffer.concat(process.outputChunks).toString();
                finishedCallback(output);
            }
        });

        return process;
    }

    static ad4mProcesses() {
        return global.ad4mProcesses;
    }
}

module.exports = TestUtils
