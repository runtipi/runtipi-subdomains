import { configSchema } from "../schemas/schemas";
import { logger } from "../utils/logger";
import * as fs from "fs";

export class Config {
  public getConfig() {
    logger.info("Reading config");

    if (!fs.existsSync("config.json")) {
      logger.error("Config file not found");
      process.exit(1);
    }

    const config = fs.readFileSync("config.json", "utf-8");

    var configJSON;

    try {
      configJSON = JSON.parse(config);
    } catch (e) {
      logger.error(`Failed to parse config: ${e}`);
      process.exit(1);
    }

    const configParsed = configSchema.safeParse(configJSON);

    if (!configParsed.success) {
      logger.error(`Failed to validate config: ${configParsed.error}`);
      process.exit(1);
    }

    logger.info("Config parsed");

    return configParsed.data;
  }
}
