import type { AWSClient } from "../clients/aws/client.ts";
import type { CloudflareClient } from "../clients/cloudflare/client.ts";
import type { DockerClient } from "../clients/docker.ts";
import type { GoldeClient } from "../clients/golde/client.ts";
import type { HCloudClient } from "../clients/hcloud/client.ts";
import type { Config, Tags } from "./config.ts";
import type { AbstractStateClient, State } from "./state.ts";

export interface Context {
  previousState?: State;
  config: Config;
  tags?: Tags;
  state: AbstractStateClient;
  docker?: DockerClient;
  golde?: GoldeClient;
  aws?: AWSClient;
  hcloud?: HCloudClient;
  cloudflare?: CloudflareClient;
}
