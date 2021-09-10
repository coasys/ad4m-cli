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
import fs from 'fs';
import path from 'path';

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

function serveAd4mExecutor() {
  Ad4mExecutor
  .init({
    appDataPath: getAppDataPath(),
    resourcePath: path.join(__dirname, '..'),
    appDefaultLangPath: "./src/builtin-langs",
    ad4mBootstrapLanguages: {
      agents: "agent-expression-store",
      languages: "languages",
      neighbourhoods: "neighbourhood-store"
    },
    ad4mBootstrapFixtures: {
      languages: [],
      perspectives: [],
    },
    appBuiltInLangs: [
      "social-context",
      "note-ipfs"
    ],
    mocks: false
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

export function cli(args) {
  Yargs(hideBin(args))
    // Run Ad4m Executor
    .command('serve', 'Serves the ad4m executor', (yargs) => {
    }, async (argv) => {
      serveAd4mExecutor();
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
        case 'publish':    await interactiveLanguagePublish(argv);  break;
        case 'meta':    outputNicely(await ad4mClient(argv.server).languages.meta(argv.params[0]));  break;

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

