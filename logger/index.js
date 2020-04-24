const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, '/logs/combined.log') }),
        new winston.transports.File({ filename: path.join(__dirname, '/logs/error.log'), level: 'error' })
    ],
    timestamp: true
});

module.exports = logger;