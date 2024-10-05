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

export function CreateContainer(cf: Cloudflare, config: ConfigSchema) {
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

  return container;
}
