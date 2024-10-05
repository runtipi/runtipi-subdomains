// import type Cloudflare from "cloudflare";
// import { CreateTXTRecord, DeleteRecord } from "../cloudflare/cloudflare";
// import { logger } from "../utils/logger";
// import * as acme from "acme-client";

// export const DNSChallenge = async (
//   domain: string,
//   email: string,
//   cf: Cloudflare,
// ) => {
//   logger.info("Creating ACME account");

//   const client = new acme.Client({
//     directoryUrl: acme.directory.letsencrypt.production,
//     accountKey: await acme.crypto.createPrivateKey(),
//   });

//   logger.info("Creating CSR for domain");

//   const [key, csr] = await acme.crypto.createCsr({
//     altNames: [domain, `*.${domain}`],
//   });

//   logger.info("Creating order");

//   const cert = await client.auto({
//     csr,
//     email: email,
//     termsOfServiceAgreed: true,
//     challengePriority: ["dns-01"],
//     skipChallengeVerification: true,
//     challengeCreateFn: async (authz, challenge, keyAuthorization) => {
//       logger.info("Creating TXT record");
//       //   await DeleteRecord(`_acme-challenge.${domain}`, cf);
//       await CreateTXTRecord(`_acme-challenge.${domain}`, keyAuthorization, cf);
//     },
//     challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
//       logger.info("Removing TXT record");
//       //   await DeleteRecord(`_acme-challenge.${authz.identifier.value}`, cf);
//     },
//   });

//   logger.info("Certificate created");

//   return { success: true, message: "Certificate created", data: { cert, key } };
// };
