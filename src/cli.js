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

function queryPassphrase() {
  return "test";
}

function serveAd4mExecutor() {
  const worldLinkLanguageHash = 'QmchPr6NgxFUrrETHrd49DSRdfFMdn6A5sw2JSXhujy4gS'
  const bootstrapPath = path.join(__dirname, '../bootstrap');

  let bootstrapFixtures = {
    worldPerspective: JSON.parse(fs.readFileSync(path.join(bootstrapPath, 'world.perspective.json'))),
    worldLinkLanguageHash,
    worldLinkLinguageBundle:  fs.readFileSync(path.join(bootstrapPath, worldLinkLanguageHash, 'bundle.js')),
    worldLinkLinguageMeta: JSON.parse(fs.readFileSync(path.join(bootstrapPath, worldLinkLanguageHash, 'meta.json'))),
  }

  Ad4mExecutor
  .init({
    appDataPath: getAppDataPath(),
    resourcePath: __dirname,
    appDefaultLangPath: "./src/languages",
    ad4mBootstrapLanguages: {
      agents: "agent-profiles",
      languages: "languages",
      perspectives: "shared-perspectives"
    },
    ad4mBootstrapFixtures: {
      languages: [{
        address: bootstrapFixtures.worldLinkLanguageHash,
        meta: bootstrapFixtures.worldLinkLinguageMeta,
        bundle: bootstrapFixtures.worldLinkLinguageBundle
      }],
      perspectives: [{
        address: '__world',
        expression: bootstrapFixtures.worldPerspective
      }]
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

export function cli(args) {

  Yargs(hideBin(args))
    .command('serve', 'Serves the ad4m executor', (yargs) => {
    }, async (argv) => {
      serveAd4mExecutor();
    })
    .command('agent [action]', 'Agent-related action', (yargs) => {
      return yargs.positional('action', {
        describe: 'Action that should be executed on the agent',
        default: 'status'
      })
    }, async (argv) => {
      switch (argv.action) {
        case 'generate':
          const agentDump1 = await ad4mClient(argv.server).agent.generate(queryPassphrase());
          console.info(`${agentDump1}`);
          break;
        case 'lock':
          const agentDump2 = await ad4mClient(argv.server).agent.lock(queryPassphrase());
          console.info(`${agentDump2}`);
          break;
        case 'unlock':
          const agentDump3= await ad4mClient(argv.server).agent.unlock(queryPassphrase());
          console.info(`${agentDump3}`);
          break;
        case 'status':
          if(argv.verbose) {
            console.info(`Querying agent status`);
            console.info(`Attempting to connect to ${argv.server}`);
          }

          const agentDump = await ad4mClient(argv.server).agent.status();
          console.info(`${agentDump}`);

          break;
        default:
          console.info(`Action "${argv.action}" does not seem to be valid on agent.`)
          break;
      }
      //if (argv.verbose) console.info(`start server on :${argv.port}`)
      //serve(argv.port)
    })
    .command('perspective [action]', 'Perspective-related action', (yargs) => {
      return yargs
    }, (argv) => {
      //if (argv.verbose)
      //serve(argv.port)
    })
    .command('expression [action]', 'Expression-related action', (yargs) => {
      return yargs
    }, (argv) => {
      //if (argv.verbose) console.info(`start server on :${argv.port}`)
      //serve(argv.port)
    })
    /*
    .command('serve [port]', 'start the server', (yargs) => {
      return yargs
        .positional('port', {
          describe: 'port to bind on',
          default: 5000
        })
    }, (argv) => {
      if (argv.verbose) console.info(`start server on :${argv.port}`)
      serve(argv.port)
    })*/
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
