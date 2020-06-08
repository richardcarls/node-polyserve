const http = require('http');

const { Command } = require('commander');

const VERSION = require('./package.json').version;
const PolyServe = require('.');
const logger = require('./logger.js');

const program = new Command();

program
  .version(VERSION)
  .option('-p, --port <number>', 'set server listen port. default is 80')
  .arguments('[root]')
  .action((root, options) => {
    const port = options.port || 80;

    const serverOpts = {};

    if (root) {
      serverOpts.root = root;
    }
    
    const server = new PolyServe(serverOpts);

    http.createServer(server.getRequestHandler())
      .listen(port, (e) => {
        logger.info(`PolyServe serving "${server.root}", listening on port ${port}.`);
      });
  });

program.parse(process.argv);
