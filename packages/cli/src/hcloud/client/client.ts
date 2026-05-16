import { applyMixins } from "../../utils/mixin.ts";
import { HCloudClientBase } from "./base.ts";
import { ServerClient } from "./server.ts";
import { SshKeyClient } from "./sshKey.ts";
import { ZoneClient } from "./zone.ts";
import { DnsClient } from "./dns.ts";

export class HCloudClient extends HCloudClientBase {
  constructor(apiToken: string) {
    super(apiToken);
  }
}
export interface HCloudClient extends ServerClient, SshKeyClient, ZoneClient, DnsClient {}

applyMixins(HCloudClient, [
  ServerClient,
  SshKeyClient,
  ZoneClient,
  DnsClient,
]);
