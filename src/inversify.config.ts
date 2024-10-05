import "reflect-metadata";
import { Container } from "inversify";
import {
  type ICloudflareHelpers,
  CloudlfareHelpers,
} from "./lib/helpers/cloudflare.helpers";
import { TYPES } from "./lib/types/types";
import type Cloudflare from "cloudflare";
import { IRouteHelpers, RouteHelpers } from "./lib/helpers/route.helpers";

export function CreateContainer(cf: Cloudflare) {
  const container = new Container();

  const cfHelpers = new CloudlfareHelpers(cf);

  container
    .bind<ICloudflareHelpers>(TYPES.CloudflareHelpers)
    .toConstantValue(cfHelpers);

  container.bind<IRouteHelpers>(TYPES.RouteHelpers).to(RouteHelpers);

  return container;
}
