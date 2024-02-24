import type { CloudflareProvider } from "./providers/cloudflare";
import type { HCloudProvider } from "./providers/hcloud";
import type { StateProvider } from "./providers/state";
import {ErrorCode} from "./constants/error";
import type { Config } from "./types/config";

export interface Context {
  config: Config
  state: StateProvider,
  hcloud?: HCloudProvider,
  cloudflare?: CloudflareProvider,
}

export const initializeContext = async(config: Config): Promise<Context> => {
  
};