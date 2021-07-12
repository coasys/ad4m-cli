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
import { Ad4mClient } from "../../ad4m";
//import { Ad4mExecutor } from "../../ad4m-executor";

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
