import winston = require("winston");
import { Config } from "../config/config";

const format = winston.format.printf(({ level, message, timestamp }) => {
  return `${level} - ${timestamp}: ${message}`;
});

const config = new Config().getConfig();

export const logger = winston.createLogger({
  level: config.server.logLevel,
  format: winston.format.combine(
    winston.format.prettyPrint(),
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss DD-MM-YYYY" }),
    format,
  ),
  transports: [new winston.transports.Console()],
});
