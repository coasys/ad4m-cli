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
import { Ad4mClient } from "@perspect3vism/ad4m";
import Ad4mExecutor from "@perspect3vism/ad4m-executor";

// Utilities
import getAppDataPath from "appdata-path";
import fs from 'fs';
import path from 'path';

import ReadlineSync from 'readline-sync';

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
  console.info(`=> ${JSON.stringify(obj)}`);
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
    .command('perspective [action]', 'Perspective-related action', (yargs) => {
      return yargs
    }, (argv) => {
      //if (argv.verbose)
      //serve(argv.port)
    })

    // Expressions API
    .command('expression [action]', 'Expression-related action', (yargs) => {
      return yargs
    }, (argv) => {
      //if (argv.verbose) console.info(`start server on :${argv.port}`)
      //serve(argv.port)
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
