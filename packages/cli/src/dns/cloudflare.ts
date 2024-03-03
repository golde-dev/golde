import logger from "../logger";
import type { CloudflareProvider } from "../providers/cloudflare";
import type { Plan } from "../types/plan";
import type { CloudflareDNSZones, CloudflareZonesState } from "./dns";

export const createCloudflareDNSPlan = (
  _: CloudflareProvider, 
  prevConfig?: CloudflareDNSZones, 
  prevState?: CloudflareZonesState,
  nextConfig?: CloudflareDNSZones,
  nextState?: CloudflareZonesState
): Plan[] => {
  logger.debug({
    prevConfig,
    nextConfig,
  }, "Planning for cloudflare dns changes");

  logger.debug({
    prevState,
    nextState,
  }, "");


  return [];
};