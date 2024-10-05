import type { ICloudflareHelpers } from "./cloudflare.helpers";
import { generate } from "random-words";
import { inject, injectable } from "inversify";
import { ContainerTypes } from "../types/types";
import { forbiddenRecords } from "../constants/constats";
import type { IAcmeHelpers } from "./acme.helpers";
import { logger } from "../utils/logger";

export interface IRouteHelpers {
  CreateRecords(internalIp: string): Promise<{
    success: boolean;
    message: string;
    data: { subdomain: string };
  }>;
  EditRecord(
    name: string,
    internalIp: string,
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  DeleteRecord(name: string): Promise<{
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
  ) {}

  public async CreateRecords(internalIp: string) {
    const baseDomain = await this.cfHelper.GetDomain();
    const name = generate({ exactly: 2, join: "-" });
    const record = `${name}.${baseDomain}`;
    const recordWildcard = `*.${record}`;

    if (
      !(await this.cfHelper.CheckRecordExists(record)) &&
      !(await this.cfHelper.CheckRecordExists(recordWildcard))
    ) {
      logger.info("Creating records");

      await this.cfHelper.CreateARecord(record, internalIp);
      await this.cfHelper.CreateARecord(recordWildcard, internalIp);

      const cert = await this.acmeHelper.DNSChallenge(record);

      if (!cert.success) {
        return {
          success: false,
          message: "Failed to create certificate",
          data: {
            subdomain: record,
            cert: "",
            key: Buffer.from(""),
            expiration: 0,
          },
        };
      }

      logger.info("Records created");

      return {
        success: true,
        message: "Records created",
        data: {
          subdomain: record,
          cert: cert.data.cert,
          key: cert.data.key,
          expiration: cert.data.expiration,
        },
      };
    }

    return {
      success: false,
      message: "Record already exists",
      data: { subdomain: record },
    };
  }

  public async EditRecord(record: string, internalIp: string) {
    if (record.includes("*")) {
      record = record.replace("*.", "");
    }

    const recordWildcard = `*.${record}`;

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

  public async DeleteRecord(record: string) {
    if (record.includes("*")) {
      record = record.replace("*.", "");
    }

    const recordWildcard = `*.${record}`;

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

    await this.cfHelper.DeleteRecord(record);
    await this.cfHelper.DeleteRecord(recordWildcard);

    return {
      success: true,
      message: "Records deleted",
    };
  }
}
