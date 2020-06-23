const path = require('path');
const util = require('util');
const fs = require('fs');

const Resource = require('../lib/resource.js');

const DEFAULT_OPTIONS = {};

module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  
  return async function serveFile(ctx, next) {
    const { logger, root } = ctx.app;
    const { request, response, resources } = ctx;

    const file = resources.find(res => res.matchType === Resource.MATCH_EXACT);

    if (!file) {
      return next();
    }

    return fs.promises.lstat(file.path)
      .then(stats => {
        response.statusCode = 200;
        
        response.setHeader('Content-Length', stats.size);
        // TODO: Detect content type
        //response.setHeader('Content-Type', 'text/html');
        
        ctx.body = fs.createReadStream(file.path);

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
