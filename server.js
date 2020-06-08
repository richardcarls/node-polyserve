const http = require('http');

const { Command } = require('commander');

const PolyServe = require('.');

const VERSION = require('./package.json').version;

const program = new Command();

program
  .version(VERSION)
  .arguments('[root]')
  .action(root => {
    const polyServe = new PolyServe();

    http
      .createServer(polyServe.getRequestHandler())
      .listen(3000);
  });

program.parse(process.argv);
