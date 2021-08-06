const { default: ExpressionClient } = require("@perspect3vism/ad4m/lib/expression/ExpressionClient");
const TestUtils = require("./testutils.js");

function extractJson(output) {
    let jsonObjectOutputRegex = new RegExp("{.*}");
    matchedJson = jsonObjectOutputRegex.exec(output);

    if(!matchedJson)
        return null;

    parsedJson = JSON.parse(matchedJson[0]);
    return parsedJson;
}

function containsAgentStatus(parsedJson) {
    if(!parsedJson)
        return false;

    return (
        "isInitialized" in parsedJson &&
        "isUnlocked" in parsedJson &&
        "did" in parsedJson &&
        "didDocument" in parsedJson
    );
}

// Hack: jest still suffers a bug in which there will be undefined behaviour because
// jest does not wait for beforeAll to finish if is running longer than the specified
// timeout and causes it to run in parallel to the tests.
// This is why the timeout value is being increased to ridicoulus 60 seconds for now,
// which prevents this odd thing to happen.
// Link: https://github.com/facebook/jest/issues/9527
beforeAll(async () => {
    TestUtils.launchProcess("bin/ad4m serve",
        (p, d) => {
            // ..
        }
    );
    // This isn't entirely correct. We should wait here until the serve process is
    // ready, but sadly it doesn't work as expected. Luckily, agent status will wait
    // in order to connect to the ad4m executor, so it still works.
}, 10000);

describe('agent status', () => {
    it('outputs the agent status', (done) => {
        let foundAgentStatus = false;
        let proc = TestUtils.launchProcess(
            "bin/ad4m agent status; exit",
            (p, d) => {
                if(containsAgentStatus(extractJson(d))) {
                    foundAgentStatus = true;
                }
            },
            (p, exitCode, signal) => {
                expect(foundAgentStatus).toBe(true);
                done();
            }
        );
        
    }, 20000);
});

describe('agent generate', () => {
    it('generates a new agent and outputs the agent status, which is unlocked', (done) => {
        let foundAgentStatus = false;
        let proc = TestUtils.launchProcess(
            "bin/ad4m agent generate; exit",
            (p, d) => {
                if(d.includes("Password:")) {
                    p.write("testPassword1234\r");
                }

                let agentJson = extractJson(d)
                if(containsAgentStatus(agentJson)) {
                    expect(agentJson["isUnlocked"]).toBe(true);
                    foundAgentStatus = true;
                }
            },
            (p, exitCode, signal) => {
                expect(foundAgentStatus).toBe(true);
                done();
            }
        );
        
    }, 20000);
});

describe('agent lock', () => {
    it('locks the agent and outputs the agent status', (done) => {
        let foundAgentStatus = false;
        let proc = TestUtils.launchProcess(
            "bin/ad4m agent lock; exit",
            (p, d) => {
                let agentJson = extractJson(d)
                if(containsAgentStatus(agentJson)) {
                    expect(agentJson["isUnlocked"]).toBe(false);
                    foundAgentStatus = true;
                }
            },
            (p, exitCode, signal) => {
                expect(foundAgentStatus).toBe(true);
                done();
            }
        );
        
    }, 20000);
});

describe('agent unlock', () => {
    // Doesn't work correctly.
    // it('unlocks the agent and outputs the agent status when supplying the correct password', (done) => {
    //     let foundAgentStatus = false;
    //     let proc = TestUtils.launchProcess(
    //         "bin/ad4m agent unlock; exit",
    //         (p, d) => {
    //             if(d.includes("Password:")) {
    //                 p.write("testPassword1234\r");
    //             }

    //             let agentJson = extractJson(d)
    //             if(containsAgentStatus(agentJson)) {
    //                 expect(agentJson["isUnlocked"]).toBe(true);
    //                 foundAgentStatus = true;
    //             }
    //         },
    //         (p, exitCode, signal) => {
    //             expect(foundAgentStatus).toBe(true);
    //             done();
    //         }
    //     );
    // }, 20000);

    it('does not unlock the agent, but output the agent status when supplying the wrong password', (done) => {
        let foundAgentStatus = false;
        let proc = TestUtils.launchProcess(
            "bin/ad4m agent unlock; exit",
            (p, d) => {
                if(d.includes("Password:")) {
                    p.write("testPasswordWRONG\r");
                }

                let agentJson = extractJson(d)
                if(containsAgentStatus(agentJson)) {
                    expect(agentJson["isUnlocked"]).toBe(false);
                    foundAgentStatus = true;
                }
            },
            (p, exitCode, signal) => {
                expect(foundAgentStatus).toBe(true);
                done();
            }
        );
    }, 20000);
});

afterAll(async () => {
    TestUtils.terminateProcesses();
}, 60000);