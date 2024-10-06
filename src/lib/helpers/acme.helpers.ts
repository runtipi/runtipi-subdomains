import { inject, injectable } from "inversify";
import { logger } from "../utils/logger";
import * as acme from "acme-client";
import { ContainerTypes } from "../types/types";
import { type ICloudflareHelpers } from "./cloudflare.helpers";
import type { ConfigSchema } from "../schemas/schemas";

export interface IAcmeHelpers {
  DNSChallenge(domain: string): Promise<{
    success: boolean;
    message: string;
    data: { cert: string; key: string; expiration: number };
  }>;
}

@injectable()
export class AcmeHelpers implements IAcmeHelpers {
  private config: ConfigSchema;

  constructor(
    @inject(ContainerTypes.CloudflareHelpers)
    private cfHelper: ICloudflareHelpers,
    config: ConfigSchema,
  ) {
    this.config = config;
  }

  public async DNSChallenge(domain: string) {
    try {
      logger.info("Initializing ACME...");

      const client = new acme.Client({
        directoryUrl: acme.directory.letsencrypt.production,
        accountKey: this.config.acme.accountKey,
        accountUrl: this.config.acme.accountUrl,
      });

      logger.info("Creating CSR for domain");

      const [key, csr] = await acme.crypto.createCsr({
        altNames: [domain, `*.${domain}`],
      });

      logger.info("Generating certificates");

      const cert = await client.auto({
        csr,
        challengePriority: ["dns-01"],
        skipChallengeVerification: true,
        challengeCreateFn: async (authz, challenge, keyAuthorization) => {
          logger.info("Creating TXT record");
          if (
            await this.cfHelper.CheckRecordExists(
              `_acme-challenge.${authz.identifier.value}`,
            )
          ) {
            await this.cfHelper.DeleteRecord(
              `_acme-challenge.${authz.identifier.value}`,
            );
          }
          await this.cfHelper.CreateTXTRecord(
            `_acme-challenge.${authz.identifier.value}`,
            keyAuthorization,
          );
          // Wait a bit for DNS to propagate
          await new Promise((r) => setTimeout(r, 5000));
        },
        challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
          logger.info("Removing TXT record");
          await this.cfHelper.DeleteRecord(
            `_acme-challenge.${authz.identifier.value}`,
          );
        },
      });

      const date = new Date();

      date.setDate(date.getDate() + 90);

      return {
        success: true,
        message: "Certificate created",
        data: { cert, key: String(key), expiration: date.getTime() },
      };
    } catch (e) {
      return {
        success: false,
        message: String(e),
        data: { cert: "", key: "", expiration: 0 },
      };
    }
  }
}
