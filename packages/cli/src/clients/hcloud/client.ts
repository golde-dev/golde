import { applyMixins } from "../../utils/mixin.ts";
import { HCloudClientBase } from "./base.ts";
import { ServerClient } from "./server.ts";

export class HCloudClient extends HCloudClientBase {
  constructor(apiToken: string) {
    super(apiToken);
  }
}
export interface HCloudClient extends ServerClient {}

applyMixins(HCloudClient, [
  ServerClient,
]);
