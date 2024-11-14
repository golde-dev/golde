import type { AWSClient } from "../aws/client/client.ts";
import type { DockerClient } from "../docker/client/client.ts";
import type { GitInfo } from "../utils/git.ts";
import type { GoldeClient } from "../golde/client/client.ts";
import type { CloudflareClient } from "../cloudflare/client/client.ts";
import type { HCloudClient } from "../hcloud/client/client.ts";
import type { Config, Tags } from "./config.ts";
import type { AbstractStateClient, State } from "./state.ts";
import type { SlackClient } from "../slack/client/client.ts";

export interface Context {
  previousState?: State;
  config: Config;
  git: GitInfo;
  tags?: Tags;
  state: AbstractStateClient;
  docker?: DockerClient;
  golde?: GoldeClient;
  slack?: SlackClient;
  aws?: AWSClient;
  hcloud?: HCloudClient;
  cloudflare?: CloudflareClient;
}
