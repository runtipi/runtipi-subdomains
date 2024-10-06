import "reflect-metadata";
import { Container } from "inversify";
import {
  type ICloudflareHelpers,
  CloudlfareHelpers,
} from "./lib/helpers/cloudflare.helpers";
import { ContainerTypes } from "./lib/types/types";
import type Cloudflare from "cloudflare";
import { type IRouteHelpers, RouteHelpers } from "./lib/helpers/route.helpers";
import { type IAcmeHelpers, AcmeHelpers } from "./lib/helpers/acme.helpers";
import type { ConfigSchema } from "./lib/schemas/schemas";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "./lib/db/schema";
import {
  type ISubdomainQueries,
  SubdomainQueries,
} from "./lib/queries/subdomains/subdomains.queries";

export function CreateContainer(
  cf: Cloudflare,
  config: ConfigSchema,
  db: BunSQLiteDatabase<typeof schema>,
) {
  const container = new Container();

  const cfHelpers = new CloudlfareHelpers(cf, config);

  container
    .bind<ICloudflareHelpers>(ContainerTypes.CloudflareHelpers)
    .toConstantValue(cfHelpers);

  container.bind<IRouteHelpers>(ContainerTypes.RouteHelpers).to(RouteHelpers);

  const acmeHelpers = new AcmeHelpers(cfHelpers, config);

  container
    .bind<IAcmeHelpers>(ContainerTypes.AcmeHelpers)
    .toConstantValue(acmeHelpers);

  const subdomainQueries = new SubdomainQueries(db);

  container
    .bind<ISubdomainQueries>(ContainerTypes.SubdomainQueries)
    .toConstantValue(subdomainQueries);

  return container;
}
