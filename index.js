const path = require('path');
const util = require('util');
const fs = require('fs');
const fsStat = util.promisify(fs.stat);

const VERSION = require('./package.json').version;
const logger = require('./logger.js');

class PolyServe {
  static get version() {
    return VERSION;
  }
  
  get root() {
    return this._root;
  }
  
  constructor(root) {
    this._root = path.normalize(path.resolve(root || '.'));

    const fns = [
      resolvePath,
      router,
      serveFile,
      serveIndex,
    ];

    this._middleware = composeMiddleware(fns);
  }

  requestHandler = (request, response) => {
    const ctx = {
      app: this,
      request,
      response,
    };

    this._middleware(ctx)
      .then(() => {
        logger.debug('post-middleware');
        logger.debug(`statusCode: ${response.statusCode}`);

        if (response.statusCode !== 200) {
          response.end();
        }
      })
      .catch(err => {
        logger.error(err);

        response.statusCode = 500;
        response.end();
      });
  }
}

async function resolvePath(ctx, next) {
  const { root } = ctx.app;
  const { request, response } = ctx;

  logger.debug('1. resolvePath');
  logger.http(`HTTP ${request.method} ${request.url}`);

  let fsPath;
  try {
    fsPath = path.normalize(path.join(root, request.url));
  } catch(err) {
    logger.error('Unable to resolve path', request);
    response.statusCode = 404;

    throw err;
  }

  // Make sure we stay in server root
  if (!fsPath.startsWith(root)) {
    logger.warn('Request mapped to resource outside root', request);
    
    response.statusCode = 403;
    throw new Error('Request mapped to resource outside root');
  }

  ctx.fsPath = fsPath;

  return next();
}

async function router(ctx, next) {
  const { root } = ctx.app;
  const { request, response, fsPath } = ctx;

  logger.debug('2. router');
  
  // See if the file/directory exists
  return fsStat(fsPath)
    .then(stat => {
      logger.debug('successful stat');
      
      ctx.stat = stat;

      return next();
    })
    .catch(err => {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
        // TODO: try index
        logger.debug('stat error, try index (unimplemented)');

        response.statusCode = 404;
        return next();
      }

      logger.error('Error getting fs stat.');
      throw err;
    });
}

async function serveFile(ctx, next) {
  const { root } = ctx.app;
  const { request, response, fsPath, stat } = ctx;

  logger.debug('3. serveFile');

  if (!stat || stat.isDirectory()) {
    logger.debug('no stat or stat is directory');
    
    return next();
  }

  logger.debug('setting headers, 200 OK');
  
  response.setHeader('content-length', stat.size);
  response.setHeader('content-type', 'text/html');
  
  response.statusCode = 200;

  await next();

  logger.debug('streaming file');

  fs.createReadStream(fsPath)
    .on('error', err => {
      logger.error('Error streaming file.');
      response.statusCode = 500;
      
      throw err;
    })
    .pipe(response);
}

async function serveIndex(ctx, next) {
  const { root } = ctx.app;
  const { request, response, fsPath, stat } = ctx;

  logger.debug('4. serveIndex');

  if (!stat || !stat.isDirectory()) {
    logger.debug('no stat or stat not directory');
    
    return next();
  }

  logger.debug('serving index (unimplemented, 404).');
  response.statusCode = 404;
  return next();
}

function composeMiddleware(fns) {
  return function middleware(ctx, next) {
    let index = -1;

    return dispatch(0);

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      
      index = i;
      let fn = fns[i];
      
      if (i === fns.length) {
        fn = next;
      }
      
      if (!fn) {
        return Promise.resolve();
      }
      
      try {
        return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
      } catch (ex) {
        return Promise.reject(ex);
      }
    }
  };
}

module.exports = exports = PolyServe;
