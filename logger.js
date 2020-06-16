const winston = require('winston');

const consoleTransport = new winston.transports.Console({
  level: 'error',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
});

const logger = winston.createLogger({
  transports: [
    consoleTransport,
  ],
});

if (process.env.NODE_ENV !== 'production') {
  consoleTransport.level = 'debug';
}

module.exports = logger;
