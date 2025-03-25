import type { Change } from "../../types/plan.ts";
import { Type } from "../../types/plan.ts";
import type { SavedResource } from "@/types/dependencies.ts";
/**
 * Given a saved resources and changeset, apply changes to resources and return new resources
 */
export function applyChangeSet<T extends SavedResource[]>(
  resources: T = {} as T,
  changes: Change[],
): T {
  const clonedResources = structuredClone(resources);

  for (const unit of changes) {
    const {
      type,
      path,
      state,
    } = unit;

    switch (type) {
      case Type.Create:
        clonedResources.push({
          path,
          state,
          createdAt: new Date().toISOString(),
        });
        break;
      case Type.CreateVersion: {
        const { version } = unit;
        clonedResources.push({
          path,
          state,
          version,
          isCurrent: true,
          createdAt: new Date().toISOString(),
        });
        const prevVersionIndex = clonedResources.findIndex((resource) =>
          resource.path === path && resource.isCurrent === true
        );
        if (prevVersionIndex !== -1) {
          clonedResources[prevVersionIndex] = {
            ...clonedResources[prevVersionIndex],
            isCurrent: false,
          };
        }
        break;
      }
      case Type.Update: {
        const currentIndex = clonedResources.findIndex((resource) => resource.path === path);
        if (currentIndex === -1) {
          throw new Error(`Unable to find resource ${path} in state`);
        }
        clonedResources[currentIndex] = {
          ...clonedResources[currentIndex],
          state,
          updatedAt: new Date().toISOString(),
        };
        break;
      }
      case Type.UpdateVersion: {
        const { version } = unit;
        const currentIndex = clonedResources.findIndex((resource) =>
          resource.path === path && resource.version === version
        );
        if (currentIndex === -1) {
          throw new Error(`Unable to find resource ${path} in state`);
        }
        clonedResources[currentIndex] = {
          ...clonedResources[currentIndex],
          state,
          updatedAt: new Date().toISOString(),
        };
        break;
      }
      case Type.Delete: {
        const currentIndex = clonedResources.findIndex((resource) => resource.path === path);
        if (currentIndex === -1) {
          throw new Error(`Unable to find resource ${path} in state`);
        }
        clonedResources.splice(currentIndex, 1);
        break;
      }
      case Type.DeleteVersion: {
        const { version } = unit;
        const currentIndex = clonedResources.findIndex((resource) =>
          resource.path === path && resource.version === version
        );
        if (currentIndex === -1) {
          throw new Error(`Unable to find resource ${path} in state`);
        }
        clonedResources.splice(currentIndex, 1);
        break;
      }
      case Type.ChangeVersion: {
        const { version, prevVersion } = unit;

        const prevVersionIndex = clonedResources.findIndex((resource) =>
          resource.path === path && resource.version === prevVersion
        );
        if (prevVersionIndex === -1) {
          throw new Error(`Unable to find resource ${path} in state`);
        }
        const nextVersionIndex = clonedResources.findIndex((resource) =>
          resource.path === path && resource.version === version
        );
        if (nextVersionIndex === -1) {
          throw new Error(`Unable to find resource ${path} in state`);
        }
        clonedResources[prevVersionIndex] = {
          ...clonedResources[prevVersionIndex],
          isCurrent: false,
        };
        clonedResources[nextVersionIndex] = {
          ...clonedResources[nextVersionIndex],
          isCurrent: true,
        };
        break;
      }

      default:
        throw new Error("Unknown type");
    }
  }
  return clonedResources;
}
