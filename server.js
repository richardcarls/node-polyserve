const http = require('http');

const { Command } = require('commander');

const VERSION = require('./package.json').version;
const PolyServe = require('.');
const logger = require('./logger.js');

const program = new Command();

program
  .version(PolyServe.version)
  .option('-p, --port <number>', 'set server listen port. default is 80')
  .arguments('[root]')
  .action((root, options) => {
    const port = options.port || 80;

    const app = new PolyServe(root);
    
    http.createServer(app.requestHandler)
      .listen(port, (event) => {
        logger.info(`PolyServe serving "${app.root}", listening on port ${port}.`);
      });
  });

program.parse(process.argv);
