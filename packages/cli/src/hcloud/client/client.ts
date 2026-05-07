import { applyMixins } from "../../utils/mixin.ts";
import { HCloudClientBase } from "./base.ts";
import { ServerClient } from "./server.ts";
import { SshKeyClient } from "./sshKey.ts";

export class HCloudClient extends HCloudClientBase {
  constructor(apiToken: string) {
    super(apiToken);
  }
}
export interface HCloudClient extends ServerClient, SshKeyClient {}

applyMixins(HCloudClient, [
  ServerClient,
  SshKeyClient,
]);
