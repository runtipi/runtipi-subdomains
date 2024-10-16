import { configSchema } from "../schemas/schemas";
import * as fs from "fs";

export class Config {
  public getConfig() {
    var configPath = "config.json";

    if (process.env.NODE_ENV === "production") {
      configPath = "/data/config.json";
    }

    if (!fs.existsSync(configPath)) {
      var found = false;
      for (let i = 0; i < 10; i++) {
        console.log("Waiting for config");
        if (fs.existsSync(configPath)) {
          console.log("Config found");
          found = true;
          break;
        }
        new Promise((r) => setTimeout(r, 2000)).then(() => {});
      }
      if (!found) {
        console.error("Config not found");
        process.exit(1);
      }
    }

    const config = fs.readFileSync(configPath, "utf-8");

    var configJSON;

    try {
      configJSON = JSON.parse(config);
    } catch (e) {
      console.error(`Failed to parse config, error: ${e}`);
      process.exit(1);
    }

    const configParsed = configSchema.safeParse(configJSON);

    if (!configParsed.success) {
      console.error(`Failed to validate config: ${configParsed.error}`);
      process.exit(1);
    }

    return configParsed.data;
  }
}
