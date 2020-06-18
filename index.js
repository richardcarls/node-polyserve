const path = require('path');

const VERSION = require('./package.json').version;

class PolyServe {
  static get version() {
    return VERSION;
  }
  
  get root() {
    return this._root;
  }

  get logger() {
    return this._logger;
  }
  
  constructor(root) {
    this._root = path.normalize(path.resolve(root || '.'));

    const fns = [
      require('./middleware/respond.js')(),
      require('./middleware/serve-static.js')(),
    ];

    this._middleware = composeMiddleware(fns);
    
    this._logger = require('./logger.js');
  }

  requestHandler = (request, response) => {
    const onMessageError = (err) => {
      this.logger.error(err.stack);

      response.statusCode = 500;
      response.end();
    };
    
    // Set stream error handlers
    request.on('error', onMessageError);
    response.on('error', onMessageError);

    // Construct context object
    const ctx = {
      app: this,
      request,
      response,
      body: null,
    };

    // Call middleware stack
    this._middleware(ctx)
      .catch(onMessageError);
  }
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
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

module.exports = exports = PolyServe;
