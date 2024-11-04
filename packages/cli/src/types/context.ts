import type { AWSClient } from "../aws/client/client.ts";
import type { DockerClient } from "../artifacts/client/docker.ts";
import type { GitInfo } from "../utils/git.ts";
import type { GoldeClient } from "../golde/client/client.ts";
import type { CloudflareClient } from "../cloudflare/client/client.ts";
import type { HCloudClient } from "../hcloud/client/client.ts";
import type { Config, Tags } from "./config.ts";
import type { AbstractStateClient, State } from "./state.ts";

export interface Context {
  previousState?: State;
  config: Config;
  git: GitInfo;
  tags?: Tags;
  state: AbstractStateClient;
  docker?: DockerClient;
  golde?: GoldeClient;
  aws?: AWSClient;
  hcloud?: HCloudClient;
  cloudflare?: CloudflareClient;
}
