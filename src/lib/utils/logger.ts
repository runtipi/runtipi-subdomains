import winston = require('winston');

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.colorize(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
})
