const path = require('path');
const fs = require('fs');

const DEFAULT_OPTIONS = {
  serveIndices: true,
}

module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  
  return async function serveStatic(ctx, next) {
    const { logger, root } = ctx.app;
    const { request, response } = ctx;

    let fsPath;
    try {
      fsPath = path.normalize(path.join(root, request.url));
    } catch(err) {
      logger.error('Error converting URL to fs path.', request);
      
      return next();
    }

    // Make sure we stay in server root
    if (!fsPath.startsWith(root)) {
      logger.error('Request mapped to filesystem resource outside root');
      
      response.statusCode = 403;
      
      return next();
    }

    let filePath = fsPath.slice(0);
    return fs.promises.lstat(filePath)
      .then(stats => {
        if (stats.isDirectory()) {
          logger.debug('Path resolves to directory, looking for index');
          
          filePath = path.join(filePath, 'index.html');
          
          return fs.promises.lstat(filePath);
        }

        logger.debug('Path resolves to file');
        
        return stats;
      })
      .then(stats => {
        logger.debug(`Serving file ${filePath}`);
        
        response.statusCode = 200;

        // TODO: Detect mime type
        response.setHeader('Content-Length', stats.size);
        response.setHeader('Content-Type', 'text/html');
        
        ctx.body = fs.createReadStream(filePath);

        return next();
      })
      .catch(err => {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        
        return next();
      });
  };
}
