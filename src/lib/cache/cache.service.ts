import Cache from "node-cache";
import fs from "fs";
import { logger } from "../utils/logger";
import { injectable } from "inversify";

export interface ICacheService {
  set(key: string, value: string, expiration?: number): boolean;
  get(key: string): string;
  del(key: string): number;
  clear(): void;
}

@injectable()
export class CacheService implements ICacheService {
  private client: Cache;

  constructor() {
    this.client = new Cache();

    this.client.on("set", () => {
      this.persistToDisk();
    });

    this.restoreFromDisk();
  }

  private async restoreFromDisk() {
    try {
      var cachePath = "cache.json";

      if (process.env.NODE_ENV == "production") {
        cachePath = "/data/cache.json";
      }

      if (!(await fs.promises.exists(cachePath))) {
        logger.warn("Cache file not found, skipping restore");
        return;
      }

      const data = await fs.promises.readFile(cachePath, "utf-8");

      const parsedData = JSON.parse(data);

      for (const key of Object.keys(parsedData)) {
        const { t, v } = parsedData[key];
        const ttl = Math.ceil((t - Date.now()) / 1000);

        this.client.set(key, v, ttl);
      }
    } catch (e) {
      logger.error(`Failed to restore cache from disk, error: ${e}`);
      process.exit(1);
    }
  }

  private async persistToDisk() {
    var cachePath = "cache.json";

    if (process.env.NODE_ENV == "production") {
      cachePath = "/data/cache.json";
    }

    await fs.promises.writeFile(cachePath, JSON.stringify(this.client.data));
  }

  public set(key: string, value: string, expiration = 60 * 60 * 24) {
    return this.client.set(key, value, expiration);
  }

  public get(key: string) {
    return this.client.get(key) as string;
  }

  public del(key: string) {
    return this.client.del(key);
  }

  public clear() {
    return this.client.flushAll();
  }
}
