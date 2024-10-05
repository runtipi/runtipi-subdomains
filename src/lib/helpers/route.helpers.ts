import type { ICloudflareHelpers } from "./cloudflare.helpers";
import { generate } from "random-words";
import { inject, injectable } from "inversify";
import { TYPES } from "../types/types";

export interface IRouteHelpers {
  CreateRecords(internalIp: string): Promise<{
    success: boolean;
    message: string;
    data: { subdomain: string };
  }>;
}

@injectable()
export class RouteHelpers implements IRouteHelpers {
  constructor(
    @inject(TYPES.CloudflareHelpers) private cfHelper: ICloudflareHelpers,
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
      await this.cfHelper.CreateARecord(record, internalIp);
      await this.cfHelper.CreateARecord(recordWildcard, internalIp);
      return {
        success: true,
        message: "Record created",
        data: { subdomain: record },
      };
    }

    return {
      success: false,
      message: "Record already exists",
      data: { subdomain: record },
    };
  }
}
