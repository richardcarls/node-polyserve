const stream = require('stream');

const DEFAULT_OPTIONS = {
  responseTimeHeader: true,
};

module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  
  return async function respond(ctx, next) {
    const { logger } = ctx.app;
    const { request, response } = ctx;

    const start = process.hrtime();

    // Default status code
    response.statusCode = 404;
    
    await next();
    
    if (response.writeableFinished) {
      logger.warn('response was sent early');
      
      return;
    }
    
    const delta = process.hrtime(start);
    const responseTime = (delta[0] * 1e3 + delta[1] / 1e6).toFixed(0);

    if (!response.headersSent && options.responseTimeHeader) {
      response.setHeader('X-Response-Time', `${responseTime}ms`);
    }

    const { method, url, httpVersion } = request;
    const { statusCode, statusMessage } = response;
    
    logger.http(`${method} ${url} HTTP/${httpVersion} - ${statusCode} - ${responseTime}ms`);

    let { body } = ctx;

    if (body && body instanceof stream.Stream) {
      return body.pipe(response);
    } else {
      return response.end(body);
    }
  };
}
