import * as acme from "acme-client";

async function createAcmeAccount() {
  const accountKey = await acme.crypto.createPrivateKey();

  const client = new acme.Client({
    directoryUrl: acme.directory.letsencrypt.production,
    accountKey: accountKey,
  });

  await client.createAccount({
    termsOfServiceAgreed: true,
    contact: ["mailto:user@demo.runtipi.io"],
  });

  console.log(`Account Key: ${JSON.stringify(String(accountKey))}`);

  console.log(`Account URL: ${client.getAccountUrl()}`);
}

createAcmeAccount();
