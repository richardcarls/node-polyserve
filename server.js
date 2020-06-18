const http = require('http');
const http2 = require('http2');
const path = require('path');
const fs = require('fs');

const { Command } = require('commander');

const VERSION = require('./package.json').version;
const PolyServe = require('.');
const logger = require('./logger.js');

const program = new Command();

program
  .version(PolyServe.version)
  .option('-p, --port <number>', 'set server listen port. default is 80')
  .option('--cert <path>', 'set certificate path for TLS.')
  .option('--key <path>', 'set key path for TLS.')
  .arguments('[root]')
  .action((root, options) => {
    const port = options.port || 80;
    
    let cert;
    let key;
    if (options.cert && options.key) {
      try {
        const certPath = path.normalize(options.cert);
        const keyPath = path.normalize(options.key);

        cert = fs.readFileSync(certPath);
        key = fs.readFileSync(keyPath);
      } catch(err) {
        logger.error(err.stack);
      }
    }

    const app = new PolyServe(root);

    let server;
    if (key && cert) {
      server = http2.createSecureServer({
        cert,
        key,
        allowHTTP1: true,
      });
    } else {
      server = http.createServer();
    }

    server
      .on('request', app.requestHandler)
      .listen(port, (event) => {
        logger.info(`PolyServe serving "${app.root}", listening on port ${port}.`);
      });
  });

program.parse(process.argv);
