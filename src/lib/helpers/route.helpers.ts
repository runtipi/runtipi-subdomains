import type { ICloudflareHelpers } from "./cloudflare.helpers";
import { generate } from "random-words";
import { inject, injectable } from "inversify";
import { ContainerTypes } from "../types/types";
import { forbiddenRecords } from "../constants/constats";
import type { IAcmeHelpers } from "./acme.helpers";
import { logger } from "../utils/logger";
import * as crypto from "crypto";
import * as argon2 from "argon2";
import type { ISubdomainQueries } from "../queries/subdomains/subdomains.queries";

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
    name: string,
    internalIp: string,
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  DeleteRecord(
    name: string,
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
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
  ) {}

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
        await argon2.hash(token),
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

    logger.info("Checking records");

    if (
      forbiddenRecords.includes(record) ||
      forbiddenRecords.includes(recordWildcard)
    ) {
      return {
        success: false,
        message: "Cannot edit records",
      };
    }

    if (!this.cfHelper.CheckRecordExists(record)) {
      return {
        success: false,
        message: `Record ${record} not found`,
      };
    }

    if (!this.cfHelper.CheckRecordExists(recordWildcard)) {
      return {
        success: false,
        message: `Record ${recordWildcard} not found`,
      };
    }

    logger.info("Checking token");

    const subdomain = await this.subdomainQueries.GetSubdomain(record);

    if (
      subdomain?.tokenHash &&
      !(await argon2.verify(subdomain.tokenHash, token))
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

    logger.info("Checking records");

    if (
      forbiddenRecords.includes(record) ||
      forbiddenRecords.includes(recordWildcard)
    ) {
      return {
        success: false,
        message: "Cannot delete records",
      };
    }

    if (!this.cfHelper.CheckRecordExists(record)) {
      return {
        success: false,
        message: "Records not found",
      };
    }

    logger.info("Checking token");

    const subdomain = await this.subdomainQueries.GetSubdomain(record);

    if (
      subdomain?.tokenHash &&
      !(await argon2.verify(subdomain.tokenHash, token))
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

    return {
      success: true,
      message: "Records deleted",
    };
  }
}
