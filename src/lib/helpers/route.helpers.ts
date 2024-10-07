import type { ICloudflareHelpers } from "./cloudflare.helpers";
import { generate } from "random-words";
import { inject, injectable } from "inversify";
import { ContainerTypes } from "../types/types";
import { forbiddenRecords } from "../constants/constats";
import type { IAcmeHelpers } from "./acme.helpers";
import { logger } from "../utils/logger";
import * as crypto from "crypto";
import type { ISubdomainQueries } from "../queries/subdomains/subdomains.queries";
import type { ICacheService } from "../cache/cache.service";
import { rateLimitSchema } from "../schemas/schemas";

export interface IRouteHelpers {
  CreateRecords(internalIp: string): Promise<{
    success: boolean;
    message: string;
    data: {
      subdomain: string;
      cert: string;
      key: string;
      expiration: number;
      token: string;
    };
  }>;
  EditRecord(
    record: string,
    internalIp: string,
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  DeleteRecord(
    record: string,
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  Renew(
    record: string,
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      subdomain: string;
      cert: string;
      key: string;
      expiration: number;
    };
  }>;
}

@injectable()
export class RouteHelpers implements IRouteHelpers {
  constructor(
    @inject(ContainerTypes.CloudflareHelpers)
    private cfHelper: ICloudflareHelpers,
    @inject(ContainerTypes.AcmeHelpers) private acmeHelper: IAcmeHelpers,
    @inject(ContainerTypes.SubdomainQueries)
    private subdomainQueries: ISubdomainQueries,
    @inject(ContainerTypes.Cache) private cacheService: ICacheService,
  ) {}

  private async ValidateRecord(record: string) {
    logger.info("Checking records");

    logger.info("Checking database");

    if (!(await this.subdomainQueries.GetSubdomain(record))) {
      logger.info("Record not found in database");
      return false;
    }

    logger.info("Record found in database");

    logger.info("Checking Cloudflare");

    if (
      !(await this.cfHelper.CheckRecordExists(record)) ||
      !(await this.cfHelper.CheckRecordExists(`*.${record}`))
    ) {
      logger.info("Record not found in Cloudflare");
      return false;
    }

    logger.info("Record found in Cloudflare");

    logger.info("Checking forbidden records");

    if (
      forbiddenRecords.includes(record) ||
      forbiddenRecords.includes(`*.${record}`)
    ) {
      logger.info("Record is forbidden");
      return false;
    }

    logger.info("Record is not forbidden");

    return true;
  }

  public async CreateRecords(internalIp: string) {
    const baseDomain = await this.cfHelper.GetDomain();
    const name = generate({ exactly: 2, join: "-" });
    const record = `${name}.${baseDomain}`;
    const recordWildcard = `*.${record}`;

    logger.info("Checking records");

    if (
      !(await this.cfHelper.CheckRecordExists(record)) &&
      !(await this.cfHelper.CheckRecordExists(recordWildcard))
    ) {
      logger.info("Creating records");

      await this.cfHelper.CreateARecord(record, internalIp);
      await this.cfHelper.CreateARecord(recordWildcard, internalIp);

      const cert = await this.acmeHelper.DNSChallenge(record);

      if (!cert.success) {
        logger.error(`Failed to generate certs, error: ${cert.message}`);
        await this.cfHelper.DeleteRecord(record);
        await this.cfHelper.DeleteRecord(recordWildcard);
        return {
          success: false,
          message: "Failed to create certificate",
          data: {
            subdomain: "",
            cert: "",
            key: "",
            expiration: 0,
            token: "",
          },
        };
      }

      logger.info("Records created");

      logger.info("Creating token");

      const token = crypto.randomBytes(32).toString("hex");

      logger.info("Token created");

      logger.info("Adding to database");

      await this.subdomainQueries.AddSubdomain(
        record,
        await Bun.password.hash(token),
      );

      logger.info("Added to database");

      return {
        success: true,
        message: "Records created",
        data: {
          subdomain: record,
          cert: cert.data.cert,
          key: cert.data.key,
          expiration: cert.data.expiration,
          token: token,
        },
      };
    }

    return {
      success: false,
      message: "Record already exists",
      data: {
        subdomain: record,
        cert: "",
        key: "",
        expiration: 0,
        token: "",
      },
    };
  }

  public async EditRecord(record: string, internalIp: string, token: string) {
    if (record.includes("*")) {
      record = record.replace("*.", "");
    }

    const recordWildcard = `*.${record}`;

    if (!(await this.ValidateRecord(record))) {
      return {
        success: false,
        message: "Records not found",
      };
    }

    logger.info("Checking token");

    const subdomain = await this.subdomainQueries.GetSubdomain(record);

    if (
      subdomain?.tokenHash &&
      !(await Bun.password.verify(token, subdomain.tokenHash))
    ) {
      return {
        success: false,
        message: "Invalid token",
      };
    }

    logger.info("Token verified");

    logger.info("Editing records");

    if (!(await this.cfHelper.EditARecord(record, internalIp)).success) {
      return {
        success: false,
        message: `Failed to edit record ${record}`,
      };
    }

    if (
      !(await this.cfHelper.EditARecord(recordWildcard, internalIp)).success
    ) {
      return {
        success: false,
        message: `Failed to edit record ${recordWildcard}`,
      };
    }

    return { success: true, message: "Records edited" };
  }

  public async DeleteRecord(record: string, token: string) {
    if (record.includes("*")) {
      record = record.replace("*.", "");
    }

    const recordWildcard = `*.${record}`;

    if (!(await this.ValidateRecord(record))) {
      return {
        success: false,
        message: "Records not found",
      };
    }

    logger.info("Checking token");

    const subdomain = await this.subdomainQueries.GetSubdomain(record);

    if (
      subdomain?.tokenHash &&
      !(await Bun.password.verify(token, subdomain.tokenHash))
    ) {
      return {
        success: false,
        message: "Invalid token",
      };
    }

    logger.info("Token verified");

    logger.info("Deleting records");

    await this.cfHelper.DeleteRecord(record);
    await this.cfHelper.DeleteRecord(recordWildcard);

    logger.info("Records deleted");

    logger.info("Removing from database");

    await this.subdomainQueries.DeleteSubdomain(record);

    logger.info("Removed from database");

    return {
      success: true,
      message: "Records deleted",
    };
  }

  public async Renew(record: string, token: string) {
    if (record.includes("*")) {
      record = record.replace("*.", "");
    }

    if (!(await this.ValidateRecord(record))) {
      return {
        success: false,
        message: "Records not found",
        data: {
          subdomain: "",
          cert: "",
          key: "",
          expiration: 0,
        },
      };
    }

    logger.info("Checking token");

    const subdomain = await this.subdomainQueries.GetSubdomain(record);

    if (
      subdomain?.tokenHash &&
      !(await Bun.password.verify(token, subdomain.tokenHash))
    ) {
      return {
        success: false,
        message: "Invalid token",
        data: {
          subdomain: "",
          cert: "",
          key: "",
          expiration: 0,
        },
      };
    }

    logger.info("Token verified");

    logger.info("Renewing certs");

    const cert = await this.acmeHelper.DNSChallenge(record);

    if (!cert.success) {
      logger.error(`Failed to renew certs, error: ${cert.message}`);
      return {
        success: false,
        message: "Failed to renew certificate",
        data: {
          subdomain: "",
          cert: "",
          key: "",
          expiration: 0,
        },
      };
    }

    return {
      success: true,
      message: "Certificates renewed",
      data: {
        subdomain: record,
        cert: cert.data.cert,
        key: cert.data.key,
        expiration: cert.data.expiration,
      },
    };
  }

  public async Get(record: string, token: string) {
    if (record.includes("*")) {
      record = record.replace("*.", "");
    }

    if (!(await this.ValidateRecord(record))) {
      return {
        success: false,
        message: "Records not found",
        data: {
          subdomain: "",
          cert: "",
          key: "",
          expiration: 0,
        },
      };
    }

    logger.info("Checking token");

    const subdomain = await this.subdomainQueries.GetSubdomain(record);

    if (
      subdomain?.tokenHash &&
      !(await Bun.password.verify(token, subdomain.tokenHash))
    ) {
      return {
        success: false,
        message: "Invalid token",
        data: {
          internalIp: "",
        },
      };
    }

    logger.info("Token verified");

    logger.info("Getting records");

    const recordData = await this.cfHelper.GetRecord(record);

    if (!recordData) {
      logger.error("Failed to get record");
      return {
        success: false,
        message: "Failed to get record",
        data: {
          internalIp: "",
        },
      };
    }

    logger.info("Records retrieved");

    return {
      success: true,
      message: "Records info",
      data: {
        internalIp: recordData.content,
      },
    };
  }

  public async RateLimit(ip: string) {
    logger.info("Getting rate limit from cache");

    const rateLimitInfo = this.cacheService.get(ip);

    if (typeof rateLimitInfo === "undefined") {
      logger.info("No rate limit info found, setting rate limit info");
      const date = new Date();
      date.setHours(date.getHours() + 1);
      this.cacheService.set(
        ip,
        JSON.stringify({ count: 1, expiration: date.getTime() }),
      );
      return { rateLimit: false, rateLimitError: false };
    }

    if (rateLimitInfo) {
      logger.info("Rate limit foud, parsing");

      var rateLimitJson = {};

      try {
        rateLimitJson = JSON.parse(rateLimitInfo);
      } catch (e) {
        logger.error(`Failed to parse rate limit info: ${e}`);
        return { rateLimit: false, rateLimitError: true };
      }

      const rateLimitParsed =
        await rateLimitSchema.safeParseAsync(rateLimitJson);

      if (rateLimitParsed.error) {
        logger.error(
          `Failed to parse rate limit info: ${rateLimitParsed.error}`,
        );
        return { rateLimit: false, rateLimitError: true };
      }

      const currentTime = new Date().getTime();

      if (
        rateLimitParsed.data.count >= 25 &&
        currentTime < rateLimitParsed.data.expiration
      ) {
        logger.info("Rate limit exceeded");
        return { rateLimit: true, rateLimitError: false };
      }

      var expiration = rateLimitParsed.data.expiration;

      if (currentTime > rateLimitParsed.data.expiration) {
        logger.info("Rate limit expired, resetting");
        const date = new Date();
        date.setHours(date.getHours() + 1);
        expiration = date.getTime();
      }

      this.cacheService.set(
        ip,
        JSON.stringify({
          count: rateLimitParsed.data.count + 1,
          expiration: expiration,
        }),
      );
    }

    return { rateLimit: false, rateLimitError: false };
  }
}
