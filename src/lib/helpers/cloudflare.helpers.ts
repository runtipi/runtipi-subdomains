import type Cloudflare from "cloudflare";
import { environment } from "../env/env";
import { injectable } from "inversify";

export interface ICloudflareHelpers {
  GetDomain(): Promise<string>;
  DeleteRecord(name: string): Promise<void>;
  CreateTXTRecord(name: string, value: string): Promise<void>;
  CreateARecord(name: string, value: string): Promise<void>;
  CheckRecordExists(name: string): Promise<boolean>;
}

@injectable()
export class CloudlfareHelpers implements ICloudflareHelpers {
  private cf: Cloudflare;

  constructor(cf: Cloudflare) {
    this.cf = cf;
  }

  public async GetDomain() {
    const zone = await this.cf.zones.get({ zone_id: environment.cfZoneId });
    return zone.name;
  }

  public async DeleteRecord(name: string) {
    const records = await this.cf.dns.records.list({
      zone_id: environment.cfZoneId,
    });
    for (const record of records.result) {
      if (record.name == name) {
        if (record.id) {
          await this.cf.dns.records.delete(record.id, {
            zone_id: environment.cfZoneId,
          });
        }
      }
    }
  }

  public async CreateTXTRecord(name: string, value: string) {
    await this.cf.dns.records.create({
      zone_id: environment.cfZoneId,
      name: name,
      type: "TXT",
      content: value,
    });
  }

  public async CreateARecord(name: string, value: string) {
    await this.cf.dns.records.create({
      zone_id: environment.cfZoneId,
      name: name,
      type: "A",
      content: value,
    });
  }

  public async CheckRecordExists(name: string) {
    const records = await this.cf.dns.records.list({
      zone_id: environment.cfZoneId,
    });
    for (const record of records.result) {
      if (record.name === name) {
        return true;
      }
    }
    return false;
  }
}
