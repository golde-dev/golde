import type { Change } from "../../types/plan.ts";
import { Type } from "../../types/plan.ts";
import { set } from "@es-toolkit/es-toolkit/compat";
import { omitEmptyObjects } from "../../utils/object.ts";
/**
 * Given a object and changeset, apply changes to state and return new state
 */
export function applyChangeSet<T extends object>(state: T = {} as T, changes: Change[]): T {
  const newState = structuredClone(state);
  const emptyObject = {};

  for (const unit of changes) {
    const {
      type,
      path,
      state,
    } = unit;

    switch (type) {
      case Type.Create:
      case Type.Update:
        set(newState, path, state);
        break;
      case Type.CreateVersion: {
        const { version } = unit;
        set(
          newState,
          `${path}.current`,
          version,
        );
        set(newState, `${path}.versions.${version}`, state);
        break;
      }
      case Type.DeleteVersion: {
        const { version } = unit;
        set(
          newState,
          `${path}.versions.${version}`,
          emptyObject,
        );
        break;
      }
      case Type.ChangeVersion: {
        const { version } = unit;
        set(newState, `${path}.current`, version);
        break;
      }
      case Type.Delete:
        set(newState, path, emptyObject);
        break;
      default:
        throw new Error("Unknown type");
    }
  }
  return omitEmptyObjects(newState) as T;
}
