import type { CloudflareClient } from "../clients/cloudflare/client.ts";
import type { DockerClient } from "../clients/docker.ts";
import type { GoldeClient } from "../clients/golde.ts";
import type { HCloudClient } from "../clients/hcloud.ts";
import type { Config, Tags } from "./config.ts";
import type { State, StateClient } from "./state.ts";

export interface Context {
  previousState?: State;
  config: Config;
  tags?: Tags;
  state: StateClient;
  docker?: DockerClient;
  golde?: GoldeClient;
  hcloud?: HCloudClient;
  cloudflare?: CloudflareClient;
}
