const path = require('path');

const logger = require('./logger.js');

const DEFAULT_OPTIONS = {
  root: '.',
};

class PolyServe {
  get root() {
    return this._root;
  }
  
  constructor(options) {
    options = Object.assign({}, DEFAULT_OPTIONS, options);

    this._root = path.normalize(path.resolve(options.root));
  }

  getRequestHandler() {
    return (request, response) => {
      logger.http(`HTTP ${request.method} ${request.url}`);
      
      response.statusCode = 418;
      response.statusMessage = 'I\'m a teapot';
      response.end();
    };
  }
}

module.exports = exports = PolyServe;
