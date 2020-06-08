const http = require('http');

const { Command } = require('commander');

const PolyServe = require('.');

const VERSION = require('./package.json').version;

const program = new Command();

program
  .version(VERSION)
  .option('-p, --port <number>', 'set server listen port. default is 80')
  .arguments('[root]')
  .action((root, options) => {
    root = root || '.';
    options.port = parseInt(options.port, 10) || '80';
    
    const polyServe = new PolyServe();

    const server = http.createServer(polyServe.getRequestHandler());

    server.on('close', (e) => {
      console.info('Server closed, exiting.');

      process.exit(0);
    });
    
    server.listen(options.port, (e) => {
      console.info(`PolyServe serving "${root}", listening on port ${options.port}.`);
    });
  });

program.parse(process.argv);
