import "reflect-metadata";
import { Container } from "inversify";
import {
  type ICloudflareHelpers,
  CloudlfareHelpers,
} from "./lib/helpers/cloudflare.helpers";
import { ContainerTypes } from "./lib/types/types";
import type Cloudflare from "cloudflare";
import { IRouteHelpers, RouteHelpers } from "./lib/helpers/route.helpers";

export function CreateContainer(cf: Cloudflare) {
  const container = new Container();

  const cfHelpers = new CloudlfareHelpers(cf);

  container
    .bind<ICloudflareHelpers>(ContainerTypes.CloudflareHelpers)
    .toConstantValue(cfHelpers);

  container.bind<IRouteHelpers>(ContainerTypes.RouteHelpers).to(RouteHelpers);

  return container;
}
