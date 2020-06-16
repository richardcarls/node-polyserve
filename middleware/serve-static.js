const path = require('path');
const fs = require('fs');
const util = require('util');

const fsStat = util.promisify(fs.stat);

module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, options, {});
  
  return async function serveStatic(ctx, next) {
    const { logger, root } = ctx.app;
    const { request, response } = ctx;

    let fsPath;
    try {
      fsPath = path.normalize(path.join(root, request.url));
    } catch(err) {
      return next();
    }

    // Make sure we stay in server root
    if (!fsPath.startsWith(root)) {
      logger.warn('Request mapped to filesystem resource outside root');
      
      response.statusCode = 403;
      throw new Error('Request mapped to resource outside root');
    }

    await next();

    // See if the file/directory exists
    return fsStat(fsPath)
      .then(stat => {
        if (stat.isFile()) {
          // Serve file
          response.setHeader('content-length', stat.size);
          response.setHeader('content-type', 'text/html');
          
          response.statusCode = 200;

          return fs.createReadStream(fsPath)
            .on('error', err => {
              logger.error('Error streaming file.');
              response.statusCode = 500;
              
              throw err;
            })
            .pipe(response);
        } else {
          // Serve index
          logger.debug('serving index (unimplemented, 404).');
        }
      })
      .catch(err => {
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
          // TODO: try index
          logger.debug('stat error, try index (unimplemented)');
        }
      });
  };
}
