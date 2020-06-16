module.exports = exports = createMiddleware;

function createMiddleware(options) {
  options = Object.assign({}, options, {
    responseTimeHeader: true,
  });
  
  return async function respond(ctx, next) {
    const { logger } = ctx.app;
    const { request, response } = ctx;

    const start = process.hrtime();

    let numPipes = 0;
    response.on('pipe', () => numPipes++);
    response.on('unpipe', () => numPipes--);

    // Default status code
    response.statusCode = 404;

    await next();
    
    const delta = process.hrtime(start);
    const responseTime = (delta[0] * 1e3 + delta[1] / 1e6).toFixed(0);

    if (options.responseTimeHeader) {  
      response.setHeader('X-Response-Time', `${responseTime}ms`);
    }

    // Ensure we call end(), but only if nothing is piping to response
    if (!response.writeablefinished && numPipes === 0) {
      response.end();
    }

    logger.http(`HTTP ${request.method} ${request.url} - ${responseTime}ms`);
  };
}
