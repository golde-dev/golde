import { PlanError, PlanErrorCode } from "@/error.ts";
import { prefixPath, removePrefix } from "@/utils/object.ts";

export function matchFactory(
  basePath: string,
  providerName: string,
  resourceName: string,
  stateAttributes: string[],
  configAttributes: string[],
) {
  const possibleAttributes = [
    ...stateAttributes,
    ...configAttributes,
  ];

  const possibleAttributePattern = possibleAttributes.join("|");
  const pattern = new RegExp(`^(?<name>.+)\\.(?<attributePath>${possibleAttributePattern})$`);

  function resourcePath(name: string) {
    return prefixPath(basePath, name);
  }

  function removeResourcePrefix(path: string) {
    return removePrefix(basePath, path);
  }

  function matchResourceType(path: string): [string, string, string] | undefined {
    if (!path.startsWith(basePath)) {
      return;
    }
    const resPath = removeResourcePrefix(path);
    const match = pattern.exec(resPath);

    if (!match) {
      throw new PlanError(
        `Incorrect ${providerName} ${resourceName} path: "${path}"`,
        PlanErrorCode.INCORRECT_PATH,
      );
    }
    const {
      groups: { name, attributePath } = {},
    } = match;

    return [
      resourcePath(name),
      name,
      attributePath,
    ];
  }

  return { matchResourceType, resourcePath, removeResourcePrefix };
}
