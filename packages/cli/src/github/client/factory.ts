import { GithubClient } from "./client.ts";
import type { GithubCredentials } from "../types.ts";

export function createGithubClient(credentials: GithubCredentials) {
  return new GithubClient(credentials.username, credentials.accessToken);
}
