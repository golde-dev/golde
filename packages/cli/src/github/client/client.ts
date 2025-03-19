import { applyMixins } from "../../utils/mixin.ts";
import { GithubClientBase } from "./base.ts";
import { GhcrClient } from "./ghcr.ts";

export class GithubClient extends GithubClientBase {
  constructor(username: string, accessToken: string) {
    super(username, accessToken);
  }
}
export interface GithubClient extends GhcrClient {}

applyMixins(GithubClient, [
  GhcrClient,
]);
