const path = require('path');
const fs = require('fs');

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
  }

  requestHandler = (request, response) => {
    const ctx = {
      app: this,
      request,
      response,
    };

    resolvePath(ctx);
    router(ctx);
    serveIndex(ctx);
    serveFile(ctx);
  }
}

function resolvePath(ctx) {
  const { root } = ctx.app;
  const { request, response } = ctx;

  logger.http(`HTTP ${request.method} ${request.url}`);

  let fsPath;
  try {
    fsPath = path.normalize(path.join(root, request.url));
  } catch(ex) {
    logger.error('Unable to resolve path', request);
    
    response.statusCode = 500;
    return response.end();
  }

  // Make sure we stay in server root
  if (!fsPath.startsWith(root)) {
    logger.warn('Request mapped to resource outside polyserve root', request);
    
    response.statusCode = 403;
    return response.end();
  }

  ctx.fsPath = fsPath;
}

function router(ctx) {
  const { root } = ctx.app;
  const { request, response, fsPath } = ctx;
  
  // See if the file/directory exists
  let stat;
  try {
    stat = fs.statSync(fsPath);
  } catch(ex) {
    if (ex.code === 'ENOENT' || ex.code === 'ENOTDIR') {
      // TODO: try index

      response.statusCode = 404;
      return response.end();
    }

    response.statusCode = 500;
    return response.end();
  }

  ctx.stat = stat;
}

function serveIndex(ctx) {
  const { root } = ctx.app;
  const { request, response, fsPath, stat } = ctx;

  if (!stat || !stat.isDirectory()) {
    return;
  }

  response.statusCode = 404;
  return response.end('unimplemented');
}

function serveFile(ctx) {
  const { root } = ctx.app;
  const { request, response, fsPath, stat } = ctx;

  if (!stat || stat.isDirectory()) {
    return;
  }
  
  response.setHeader('content-length', stat.size);
  response.setHeader('content-type', 'text/html');
  
  response.statusCode = 200;

  fs.createReadStream(fsPath)
    .on('error', err => {
      response.statusCode = 500;
      return response.end();
    })
    .pipe(response);
}

module.exports = exports = PolyServe;
