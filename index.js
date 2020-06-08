const path = require('path');

const VERSION = require('./package.json').version;
const logger = require('./logger.js');

const DEFAULT_OPTIONS = {
  root: '.',
};

module.exports = polyserve;

polyserve.version = VERSION;

function polyserve(options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);

  const root = path.normalize(path.resolve(options.root));

  return requestHandler;

  // ---

  function requestHandler(request, response) {
    logger.http(`HTTP ${request.method} ${request.url}`);
    
    response.statusCode = 418;
    response.statusMessage = 'I\'m a teapot';
    response.end();
  }
}
