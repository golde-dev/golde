import { applyMixins } from "../../utils/mixin.ts";
import type { GoldeClientConfig } from "../types.ts";
import { GoldeClientBase } from "./base.ts";
import { ProjectClient } from "./project.ts";
import { StateClient } from "./state.ts";

export class GoldeClient extends GoldeClientBase {
  constructor(config: GoldeClientConfig) {
    super(config);
  }
}

export interface GoldeClient extends StateClient, ProjectClient {}

applyMixins(GoldeClient, [
  StateClient,
  ProjectClient,
]);
