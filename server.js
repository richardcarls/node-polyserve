const http = require('http');

const { Command } = require('commander');

const VERSION = require('./package.json').version;
const polyserve = require('.');
const logger = require('./logger.js');

const program = new Command();

program
  .version(polyserve.version)
  .option('-p, --port <number>', 'set server listen port. default is 80')
  .arguments('[root]')
  .action((root, options) => {
    const port = options.port || 80;

    const serverOpts = {};

    if (root) {
      serverOpts.root = root;
    }
    
    http.createServer(polyserve(serverOpts))
      .listen(port, (event) => {
        logger.info(`PolyServe listening on port ${port}.`);
      });
  });

program.parse(process.argv);
