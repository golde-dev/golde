import { applyMixins } from "../../utils/mixin.ts";
import { GoldeClientBase } from "./base.ts";
import { ProjectClient } from "./project.ts";
import { StateClient } from "./state.ts";

export class GoldeClient extends GoldeClientBase {
  constructor(apiToken: string) {
    super(apiToken);
  }
}

export interface GoldeClient extends StateClient, ProjectClient {}

applyMixins(GoldeClient, [
  StateClient,
  ProjectClient,
]);
