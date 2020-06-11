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
    logger.http(`HTTP ${request.method} ${request.url}`);

    // Resolve a file path from url and root
    let fsPath;
    try {
      fsPath = path.normalize(path.join(this._root, request.url));
    } catch(ex) {
      response.statusCode = 404;
      return response.end();
    }

    // Make sure we stay in server root
    if (!fsPath.startsWith(this._root)) {
      logger.warn('Request mapped to resource outside polyserve root', request);
      
      response.statusCode = 403;
      return response.end();
    }

    // See if the file/directory exists
    fs.stat(fsPath, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
          // TODO: try index

          response.statusCode = 404;
          return response.end();
        }

        response.statusCode = 500;
        return response.end();
      }

      // TODO: Serve directory index if stat is directory
      if (stat.isDirectory()) {
        response.statusCode = 404;
        return response.end();
      }
      response.setHeader('content-length', stat.size);
      // TODO: mime type discovery
      response.setHeader('content-type', 'text/html');
      
      response.statusCode = 200;

      fs.createReadStream(fsPath)
        .on('error', err => {
          response.statusCode = 500;
          return response.end();
        })
        .pipe(response);
    });
  }
}

module.exports = exports = PolyServe;
