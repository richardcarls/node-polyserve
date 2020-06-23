const path = require('path');
const util = require('util');
const fs = require('fs');

const Resource = require('../lib/resource.js');

const DEFAULT_OPTIONS = {};

module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  
  return async function serveIndex(ctx, next) {
    const { logger, root } = ctx.app;
    const { request, response, resources } = ctx;

    const dir = resources.find(res => res.matchType === Resource.MATCH_DIR);

    if (!dir) {
      return next();
    }

    const indexPath = path.join(dir.path, 'index.html');

    return fs.promises.lstat(indexPath)
      .then(stats => {
        response.statusCode = 200;
        
        response.setHeader('Content-Length', stats.size);
        response.setHeader('Content-Type', 'text/html');
        
        ctx.body = fs.createReadStream(indexPath);

        return next();
      })
      .catch(err => {
        if (err.code !== 'ENOENT') {
          throw err;
        }

        // TODO: Generate and serve index

        return next();
      });
  };
}
