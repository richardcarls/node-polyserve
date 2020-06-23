const path = require('path');
const util = require('util');
const fs = require('fs');

const Resource = require('../lib/resource.js');

const DEFAULT_OPTIONS = {};

module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  
  return async function serveHtml(ctx, next) {
    const { logger, root } = ctx.app;
    const { request, response, resources } = ctx;

    const renderable = resources
          .filter(res => res.ext === '.html') // TODO: Filter against list of renderable types
          .reduce((current, res) => {
            if (res.matchType === Resource.MATCH_EXACT) {
              return res;
            }

            if (res.matchType === Resource.MATCH_NAME) {
              if (!current) {
                return res;
              } else {
                // TODO: Serve generated pick-list
                return res;
              }              
            }
          }, null);

    if (!renderable) {
      return next();
    }

    return fs.promises.lstat(renderable.path)
      .then(stats => {
        response.statusCode = 200;
        
        response.setHeader('Content-Length', stats.size);
        response.setHeader('Content-Type', 'text/html');
        
        ctx.body = fs.createReadStream(renderable.path);

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
