import { Config } from "./types/config";
import { State } from "./types/state";

export async function plan(
  currentConfig: Config, 
  currentState: State, 
  previousConfig: Config, 
  previousState: State
) {
  console.log({
    config, 
    state,
    previousConfig, 
    previousState
  })
}