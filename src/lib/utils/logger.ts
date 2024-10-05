import winston = require("winston");

const format = winston.format.printf(({ level, message, timestamp }) => {
  return `${level} - ${timestamp}: ${message}`;
});

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.prettyPrint(),
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss DD-MM-YYYY" }),
    format,
  ),
  transports: [new winston.transports.Console()],
});
