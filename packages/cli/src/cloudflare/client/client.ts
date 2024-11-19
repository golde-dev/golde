import { applyMixins } from "../../utils/mixin.ts";
import { CloudflareBase } from "./base.ts";
import { D1Client } from "./d1.ts";
import { DNSClient } from "./dns.ts";
import { R2Client } from "./r2.ts";

export class CloudflareClient extends CloudflareBase {
  constructor(apiToken: string, accountId: string) {
    super(apiToken, accountId);
  }
}

export interface CloudflareClient extends R2Client, DNSClient, D1Client {}

applyMixins(CloudflareClient, [
  R2Client,
  DNSClient,
  D1Client,
]);
