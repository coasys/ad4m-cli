#!/usr/bin/env node

// CLI processing imports
import Yargs from "yargs";
import { hideBin } from 'yargs/helpers';

// GraphQL interface imports
import {
    ApolloClient,
    InMemoryCache,
    HttpLink
} from "@apollo/client";
import { WebSocketLink } from '@apollo/client/link/ws';
import WebSockets from "ws";

// Perspectivism imports
import { Ad4mClient, Link, LanguageMetaInput, LinkQuery } from "@perspect3vism/ad4m";
import Ad4mExecutor from "@perspect3vism/ad4m-executor";

// Utilities
import getAppDataPath from "appdata-path";
import fs from 'fs-extra';
import path from 'path';
import wget from 'node-wget-js'
import unzipper from 'unzipper'

import ReadlineSync from 'readline-sync';
import util from 'util'


// For yet unknown reasons there are two relevant implementations for crypto as
// of now: The NodeJS core implementation and the Webcrypto implementation(s)
// in browser environments. Those are similar, but at the same time have major
// architectural as well as functional differences.
//
// There are heated discussions about implementing Webcrypto in NodeJS with
// seemingly no practical results. Amongst different approaches to solve this
// I have found this library as a polyfill. Seems to do the job.
import { Crypto } from "@peculiar/webcrypto";
global.crypto = new Crypto();

function apolloClient(uri) {
  return new ApolloClient({
      link: new WebSocketLink({
          uri: uri,
          options: { reconnect: true },
          webSocketImpl: WebSockets,
      }),
      cache: new InMemoryCache({resultCaching: false, addTypename: false}),
      defaultOptions: {
          watchQuery: {
              fetchPolicy: "no-cache",
          },
          query: {
              fetchPolicy: "no-cache",
          }
      },
  });
}

function ad4mClient(uri) {
  return new Ad4mClient(apolloClient(uri));
}

const DOWNLOADED_LANGS_PATH = path.join(getAppDataPath('ad4m'), 'downloadedLanguages')

function serveAd4mExecutor() {
  Ad4mExecutor
  .init({
    appDataPath: getAppDataPath(),
    resourcePath: path.join(__dirname, '..'),
    appDefaultLangPath: DOWNLOADED_LANGS_PATH,
    ad4mBootstrapLanguages: {
      agents: "agent-expression-store",
      languages: "languages",
      neighbourhoods: "neighbourhood-store"
    },
    ad4mBootstrapFixtures: {
      languages: [
        {
          address: 'QmR1dV5KuAQtYG98qqmYEvHXfxJZ3jKyjf7SFMriCMfHVQ',
          meta:  {"author":"did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n","timestamp":"2021-10-07T21:39:36.607Z","data":{"name":"Direct Message Language","address":"QmR1dV5KuAQtYG98qqmYEvHXfxJZ3jKyjf7SFMriCMfHVQ","description":"Template source for personal, per-agent DM languages. Holochain based.","possibleTemplateParams":["recipient_did","recipient_hc_agent_pubkey"],"sourceCodeLink":"https://github.com/perspect3vism/direct-message-language"},"proof":{"signature":"e933e34f88694816ea91361605c8c2553ceeb96e847f8c73b75477cc7d9bacaf11eae34e38c2e3f474897f59d20f5843d6f1d2c493b13552093bc16472b0ac33","key":"#zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n","valid":true}},
          bundle: fs.readFileSync(path.join(DOWNLOADED_LANGS_PATH, 'direct-message-language', 'build', 'bundle.js')).toString()
        },
        {
          address: 'QmWxQXz8M62TG1Ba7L49uVXMgabzMx4AP4Y56gy3PRvGpW',
          meta:  {"author":"did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n","timestamp":"2021-10-07T21:46:40.599Z","data":{"name":"Social Context","address":"QmWxQXz8M62TG1Ba7L49uVXMgabzMx4AP4Y56gy3PRvGpW","description":"Holochain based LinkLanguage. First full implementation of a LinkLanguage, for collaborative Neighbourhoods where every agent can add links. No membrane. Basic template for all custom Neighbourhoods in this first iteration of the Perspect3vism test network.","possibleTemplateParams":["uuid","name","description"],"sourceCodeLink":"https://github.com/juntofoundation/Social-Context'"},"proof":{"signature":"b09905f324b12e4b7273aa0af8204b157808e0844b21c956ad7fb3041247a0615c76d5e97a6bf8eee09e3bab799d730045453d44cef55ecf926895a0a8ed0dee","key":"#zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n","valid":true}},
          bundle: fs.readFileSync(path.join(DOWNLOADED_LANGS_PATH, 'social-context', 'build', 'bundle.js')).toString()
        }
      ],
      perspectives: [],
    },
    appBuiltInLangs: [
      "social-context",
      "note-ipfs"
    ],
    mocks: false,
    appLangAliases: null,
    hcUseMdns: false
  })
  .then((ad4mCore) => {
    ad4mCore.waitForAgent().then(async () => {
      console.log(
        "\x1b[36m%s\x1b[0m",
        "Agent has been init'd. Controllers now starting init..."
      );
      ad4mCore.initControllers();
      console.log("\x1b[32m", "Controllers init complete!");

      console.log(
        "\x1b[36m%s\x1b[0m",
        "Initializing languages..."
      );
      await ad4mCore.initLanguages()
      console.log("\x1b[32m", "All languages initialized!");
    });
  });
}

async function downloadLanguages() {
  const languages = {
    "agent-expression-store": {
      targetDnaName: "agent-store",
      dna: "https://github.com/perspect3vism/agent-language/releases/download/0.0.8/agent-store.dna",
      bundle:
        "https://github.com/perspect3vism/agent-language/releases/download/0.0.8/bundle.js",
    },
    languages: {
        targetDnaName: "languages",
        bundle: "https://github.com/perspect3vism/language-persistence/releases/download/0.0.15/bundle.js",
    },
    "neighbourhood-store": {
      targetDnaName: "neighbourhood-store",
      //dna: "https://github.com/perspect3vism/neighbourhood-language/releases/download/0.0.2/neighbourhood-store.dna",
      bundle: "https://github.com/perspect3vism/neighbourhood-language/releases/download/0.0.3/bundle.js",
    },
    "social-context": {
      zipped: true,
      targetDnaName: "social-context",
      resource:
        "https://github.com/juntofoundation/Social-Context/releases/download/0.0.21/full_features.zip",
    },
    "note-ipfs": {
      bundle: "https://github.com/perspect3vism/lang-note-ipfs/releases/download/0.0.1/bundle.js",
    },
    "direct-message-language": {
      bundle: "https://github.com/perspect3vism/direct-message-language/releases/download/0.0.3/bundle.js"
    }
  };

  const targetDir = DOWNLOADED_LANGS_PATH

  for (const lang in languages) {
    const dir = path.join(targetDir, lang)
    await fs.ensureDir(dir + "/build");

    // bundle
    if (languages[lang].bundle) {
      let url = languages[lang].bundle;
      let dest = dir + "/build/bundle.js";
      wget({ url, dest });
    }

    // dna
    if (languages[lang].dna) {
      let url = languages[lang].dna;
      let dest = dir + `/${languages[lang].targetDnaName}.dna`;
      wget({ url, dest });
    }

    if (languages[lang].zipped) {
      await wget(
        {
          url: languages[lang].resource,
          dest: `${dir}/lang.zip`,
        },
        async () => {
          //Read the zip file into a temp directory
          await fs
            .createReadStream(`${dir}/lang.zip`)
            .pipe(unzipper.Extract({ path: `${dir}` }))
            .promise();

          // if (!fs.pathExistsSync(`${dir}/bundle.js`)) {
          //   throw Error("Did not find bundle file in unzipped path");
          // }

          fs.copyFileSync(
            path.join(`${dir}/bundle.js`),
            path.join(`${dir}/build/bundle.js`)
          );
          fs.rmSync(`${dir}/lang.zip`);
          fs.rmSync(`${dir}/bundle.js`);
        }
      );
    }
  }
}

function outputNicely(obj) {
    console.info("=>\n", util.inspect(obj, {showHidden: false, depth: null}))
    ;
}

function queryPassphrase() {
  const password = ReadlineSync.question("Password: ", { hideEchoBack: true });
  return password;
}

async function agentGenerate(argv) {
  if(argv.verbose) {
    console.info(`Generating agent`);
    console.info(`Attempting to connect to ${argv.server}`);
  }

  const agentDump = await ad4mClient(argv.server).agent.generate(queryPassphrase());
  outputNicely(agentDump);
  process.exit();
}

async function agentLock(argv) {
  if(argv.verbose) {
    console.info(`Locking agent`);
    console.info(`Attempting to connect to ${argv.server}`);
  }
  // Passphrase not needed
  const agentDump = await ad4mClient(argv.server).agent.lock("");
  outputNicely(agentDump);
  process.exit();
}

async function agentUnlock(argv) {
  if(argv.verbose) {
    console.info(`Unlocking agent`);
    console.info(`Attempting to connect to ${argv.server}`);
  }

  const agentDump = await ad4mClient(argv.server).agent.unlock(queryPassphrase());
  outputNicely(agentDump);
  process.exit();
}

async function agentStatus(argv) {
  if(argv.verbose) {
    console.info(`Querying agent status`);
    console.info(`Attempting to connect to ${argv.server}`);
  }

  const agentDump = await ad4mClient(argv.server).agent.status();
  outputNicely(agentDump);
  process.exit();
}

async function interactiveLanguagePublish(argv) {
  const bundlePath = argv.params[0]
  const name = ReadlineSync.question("Name (must match name in source code): ");
  const description = ReadlineSync.question("Description: ");
  const templateParams = ReadlineSync.question("In case of a templateable Language, list of template parameters (comma separated): ");
  const sourceLink = ReadlineSync.question("Link to source code / Github repo: ");

  const meta = new LanguageMetaInput(name, description)

  if(sourceLink.trim().length > 0)
    meta.sourceCodeLink = sourceLink.trim()

  const params = templateParams.split(',').map(e => e.trim())
  if(params.length > 0) {
    meta.possibleTemplateParams = params
  }

  outputNicely(await ad4mClient(argv.server).languages.publish(bundlePath, meta))
}

async function projectLanguagePublish(argv) {
  const projectAd4mFile = JSON.parse(fs.readFileSync(path.join(process.env.PWD, 'ad4m.json')))
  const { name, description, possibleTemplateParams, sourceCodeLink, bundle } = projectAd4mFile
  const bundlePath = path.join(process.env.PWD, bundle)

  if(!name) {
    console.error("'name' missing in ad4m.json")
    process.exit(1)
  }

  if(!description) {
    console.error("'description' missing in ad4m.json")
    process.exit(1)
  }

  const meta = new LanguageMetaInput(name, description)

  meta.possibleTemplateParams = possibleTemplateParams

  if(sourceCodeLink.trim().length > 0)
    meta.sourceCodeLink = sourceCodeLink.trim()

  outputNicely(await ad4mClient(argv.server).languages.publish(bundlePath, meta))
}

export function cli(args) {
  Yargs(hideBin(args))
    // Run Ad4m Executor
    .command('executor <action>', 'Run and initialize the ad4m executor', (yargs) => {
      return yargs
    }, async (argv) => {
      switch (argv.action) {
        case 'run':  await downloadLanguages(); serveAd4mExecutor();  break;
        case 'init': await downloadLanguages(); process.exit(0); break;
        default:
          console.info(`Action "${argv.action}" does not seem to be valid on executor.`)
          process.exit(0)
          break;
      }
    })

    // Agents API
    .command('agent [action]', 'Agent-related action', (yargs) => {
      return yargs.positional('action', {
        describe: 'Action that should be executed on the agent',
        default: 'status'
      })
    }, async (argv) => {
      switch (argv.action) {
        case 'generate':  agentGenerate(argv);  break;
        case 'lock':      agentLock(argv);      break;
        case 'unlock':    agentUnlock(argv);    break;
        case 'status':    agentStatus(argv);    break;
        case 'me':        outputNicely(await ad4mClient(argv.server).agent.me()); process.exit(0); break;

        default:
          console.info(`Action "${argv.action}" does not seem to be valid on agent.`)
          break;
      }
    })

    // Perspectives API
    .command('perspective <action> [params..]', 'Perspective-related action', (yargs) => {
      return yargs
    }, async (argv) => {
      switch (argv.action) {
        case 'all':     outputNicely(await ad4mClient(argv.server).perspective.all());  break;
        case 'byUUID':  outputNicely(await ad4mClient(argv.server).perspective.byUUID(argv.params[0]));  break;
        case 'snapshotByUUID':  outputNicely(await ad4mClient(argv.server).perspective.snapshotByUUID(argv.params[0]));  break;
        case 'queryLinks':  outputNicely(await ad4mClient(argv.server).perspective.queryLinks(argv.params[0], new LinkQuery(JSON.parse(argv.params[1]))));  break;
        case 'add':  outputNicely(await ad4mClient(argv.server).perspective.add(argv.params[0]));  break;
        case 'update':  outputNicely(await ad4mClient(argv.server).perspective.update(argv.params[0], argv.params[1]));  break;
        case 'remove':  outputNicely(await ad4mClient(argv.server).perspective.remove(argv.params[0]));  break;
        case 'addLink':  outputNicely(await ad4mClient(argv.server).perspective.addLink(argv.params[0], new Link(JSON.parse(argv.params[1]))));  break;
        case 'updateLink':  outputNicely(await ad4mClient(argv.server).perspective.updateLink(argv.params[0], JSON.parse(argv.params[1], JSON.parse(argv.params[2]))));  break;
        case 'removeLink':  outputNicely(await ad4mClient(argv.server).perspective.removeLink(argv.params[0], JSON.parse(argv.params[1])));  break;

        default:
          console.info(`Action "${argv.action}" does not seem to be valid on languages.`)
          break;
      }
      process.exit(0)
    })

    // Expressions API
    .command('expression <action> <params..>', 'Expression-related action', (yargs) => {
      return yargs
    }, async (argv) => {
      switch (argv.action) {
        case 'get':     outputNicely(await ad4mClient(argv.server).expression.get(argv.params[0]));  break;
        case 'getRaw':  outputNicely(await ad4mClient(argv.server).expression.getRaw(argv.params[0]));  break;
        case 'create':  outputNicely(await ad4mClient(argv.server).expression.create(argv.params[1], argv.params[0]));  break;

        default:
          console.info(`Action "${argv.action}" does not seem to be valid on languages.`)
          break;
      }
      process.exit(0)
    })

    .command('languages <action> [params..]', 'Language related action', (yargs) => {
      return yargs
    }, async (argv) => {
      switch (argv.action) {
        case 'byAddress':  outputNicely(await ad4mClient(argv.server).languages.byAddress(argv.params[0]));  break;
        case 'byFilter':   outputNicely(await ad4mClient(argv.server).languages.byFilter(argv.params[0]));  break;
        case 'all':        outputNicely(await (await ad4mClient(argv.server).languages.all()).map(l => {return {name: l.name, address: l.address} } ));  break;
        case 'writeSettings':    outputNicely(await ad4mClient(argv.server).languages.writeSettings(argv.params[0], argv.params[1]));  break;
        case 'applyTemplateAndPublish':    outputNicely(await ad4mClient(argv.server).languages.applyTemplateAndPublish(argv.params[0], argv.params[1]));  break;
        case 'publish':    
          if(fs.existsSync(path.join(process.env.PWD, 'ad4m.json'))) {
            await projectLanguagePublish(argv);
          } else {
            if(argv.params.length == 0) {
              console.error("No ad4m.json file found and no bundle path given. No idea what to publish.")
              process.exit(1)
            }
            await interactiveLanguagePublish(argv);  
          }
          break;  
        case 'meta':    outputNicely(await ad4mClient(argv.server).languages.meta(argv.params[0]));  break;
        case 'source': console.log(await ad4mClient(argv.server).languages.source(argv.params[0])); break;

        default:
          console.info(`Action "${argv.action}" does not seem to be valid on languages.`)
          break;
      }
      process.exit(0)
    })

    .command('neighbourhood <action> [params..]', 'Neighbourhood related action', (yargs) => {
      return yargs
    }, async (argv) => {
      switch (argv.action) {
        case 'publishFromPerspective':  outputNicely(await ad4mClient(argv.server).neighbourhood.publishFromPerspective(argv.params[0], argv.params[1], JSON.parse(argv.params[2])));  break;
        case 'joinFromUrl':   outputNicely(await ad4mClient(argv.server).neighbourhood.joinFromUrl(argv.params[0]));  break;

        default:
          console.info(`Action "${argv.action}" does not seem to be valid on neighbourhoods.`)
          break;
      }
      process.exit(0)
    })

    .command('runtime <action> [params..]', 'Runtime related action', (yargs) => {
      return yargs
    }, async (argv) => {
      switch (argv.action) {
        case 'getTrustedAgents':  outputNicely(await ad4mClient(argv.server).runtime.getTrustedAgents());  break;
        case 'addTrustedAgents':   outputNicely(await ad4mClient(argv.server).runtime.addTrustedAgents(JSON.parse(argv.params[0])));  break;
        case 'deleteTrustedAgents':   outputNicely(await ad4mClient(argv.server).runtime.deleteTrustedAgents(JSON.parse(argv.params[0])));  break;
        case 'addTrustedAgent':   outputNicely(await ad4mClient(argv.server).runtime.addTrustedAgents([argv.params[0]]));  break;
        case 'deleteTrustedAgent':   outputNicely(await ad4mClient(argv.server).runtime.deleteTrustedAgents([argv.params[0]]));  break;

        case 'knownLinkLanguageTemplates':  outputNicely(await ad4mClient(argv.server).runtime.knownLinkLanguageTemplates());  break;
        case 'addKnownLinkLanguageTemplates':   outputNicely(await ad4mClient(argv.server).runtime.addKnownLinkLanguageTemplates(JSON.parse(argv.params[0])));  break;
        case 'removeKnownLinkLanguageTemplates':   outputNicely(await ad4mClient(argv.server).runtime.removeKnownLinkLanguageTemplates(JSON.parse(argv.params[0])));  break;
        case 'addKnownLinkLanguageTemplate':   outputNicely(await ad4mClient(argv.server).runtime.addKnownLinkLanguageTemplates([argv.params[0]]));  break;
        case 'removeKnownLinkLanguageTemplate':   outputNicely(await ad4mClient(argv.server).runtime.removeKnownLinkLanguageTemplates([argv.params[0]]));  break;

        case 'friends':  outputNicely(await ad4mClient(argv.server).runtime.friends());  break;
        case 'addFriends':   outputNicely(await ad4mClient(argv.server).runtime.addFriends(JSON.parse(argv.params[0])));  break;
        case 'removeFriends':   outputNicely(await ad4mClient(argv.server).runtime.removeFriends(JSON.parse(argv.params[0])));  break;
        case 'addFriend':   outputNicely(await ad4mClient(argv.server).runtime.addFriends([argv.params[0]]));  break;
        case 'removeFriend':   outputNicely(await ad4mClient(argv.server).runtime.removeFriends([argv.params[0]]));  break;
        case 'hcAgentInfos':   console.log(await ad4mClient(argv.server).runtime.hcAgentInfos());  break;
        case 'hcAddAgentInfos':
          const agentInfosString = fs.readFileSync(argv.params[0]).toString()
          outputNicely(await ad4mClient(argv.server).runtime.hcAddAgentInfos(agentInfosString));  
          break;
        case 'hcAgentInfosReadable':
          const agentInfos = JSON.parse(await ad4mClient(argv.server).runtime.hcAgentInfos())
          const agentInfosParsed = agentInfos.map(info => {
            return {
                //@ts-ignore
                agent: Buffer.from(info.agent.data),
                //@ts-ignore
                signature: Buffer.from(info.signature.data),
                //@ts-ignore
                agent_info: Buffer.from(info.agent_info.data)
            }
          })

          agentInfosParsed.forEach(info => console.log("\n", info.agent_info.toString(), "\n"))
          break;

        default:
          console.info(`Action "${argv.action}" does not seem to be valid on runtime.`)
          break;
      }
      process.exit(0)
    })

    .option('server', {
      alias: 's',
      type: 'string',
      default: 'http://localhost:4000/graphql',
      description: 'Server to connect to'
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: true,
      description: 'Run with verbose logging'
    })
    .argv
}

