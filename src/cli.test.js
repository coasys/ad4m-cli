const TestUtils = require("./testutils.js");

function containsAgentStatus(output) {
    let jsonObjectOutputRegex = new RegExp("{.*}");
    matchedJson = jsonObjectOutputRegex.exec(output)[0];
    parsedJson = JSON.parse(matchedJson);

    return (
        "isInitialized" in parsedJson &&
        "isUnlocked" in parsedJson &&
        "did" in parsedJson &&
        "didDocument" in parsedJson
    );
}

async function wait(s) {
    await new Promise(resolve => setTimeout(resolve, s * 1000));
}

// Hack: jest still suffers a bug in which there will be undefined behaviour because
// jest does not wait for beforeAll to finish if is running longer than the specified
// timeout and causes it to run in parallel to the tests.
// This is why the timeout value is being increased to ridicoulus 60 seconds for now,
// which prevents this odd thing to happen.
// Link: https://github.com/facebook/jest/issues/9527
beforeAll(async () => {
    TestUtils.launchAd4mProcess(["serve"]);
    
    // TODO: Replace this with analyzing and waiting for the ad4m serve output
    wait(1);

}, 60000);

describe('agent status', () => {
    it('displays the agent status', (done) => {
        TestUtils.launchAd4mProcess(["agent", "status"], (output) => {
            try {
                expect(containsAgentStatus(output)).toBeTruthy();
            } catch (e) {
                throw new Error(`${output} does not contain an agent status json`);
            } finally {
                done();
            }
        });
    }, 10000);
});


afterAll(async () => {
    console.log(`\nShutting down ${TestUtils.ad4mProcesses().length} remaining ad4m processes gracefully..\n`)

    TestUtils.ad4mProcesses().forEach(
        process => {
            process.kill("SIGINT");
        }
    );
}, 60000);