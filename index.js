const path = require('path');

class PolyServe {
  constructor() {}

  getRequestHandler() {
    return (request, response) => {
      response.statusCode = 418;
      response.statusMessage = 'I\'m a teapot';
      response.end();
    };
  }
}

module.exports = exports = PolyServe;
