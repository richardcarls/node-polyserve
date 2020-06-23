const path = require('path');
const util = require('util');
const fs = require('fs');

const Resource = require('../lib/resource.js');

const DEFAULT_OPTIONS = {};

module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  
  return async function resolve(ctx, next) {
    const { logger, root } = ctx.app;
    const { request, response, url, resources } = ctx;

    // Convert to fs path
    let fsPath;
    try {
      fsPath = path.normalize(path.join(root, url.pathname));
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

    let explicitIndex = false;
    if (fsPath.endsWith('/')) {
      logger.debug('explicit index requested');
      
      explicitIndex = true;
      fsPath = fsPath.slice(0, -1);
    }

    let parsed = path.parse(fsPath);

    // Handle site root separately to avoid iterating outside root
    if (fsPath === root) {
      resources.push(
        new Resource(Resource.MATCH_DIR, {
          path: fsPath,

          ...parsed,
        })
      );

      return next();
    }

    const iter = await fs.promises.opendir(parsed.dir);
    
    for await (const entry of iter) {
      if (entry.isFile()) {
        if (explicitIndex) {
          continue;
        }

        if (entry.name === parsed.base) {
          resources.push(
            new Resource(Resource.MATCH_EXACT, {
              path: fsPath,
              
              ...parsed,
            })
          );
          
          continue;
        }

        if (entry.name.startsWith(`${parsed.name}.`)) {
          resources.push(
            new Resource(Resource.MATCH_NAME, {
              path: path.join(dir, entry.name),

              ...parsed,
            })
          );
          
          continue;
        }
      } else {
        if (entry.name === parsed.base) {
          resources.push(
            new Resource(Resource.MATCH_DIR, {
              path: fsPath,

              ...parsed,
            })
          );
          
          continue;
        }
      }
    }

    return next();
  };
}
