import type { AWSResource, WithRegion } from "./types.ts";

export function assertRegion<T extends AWSResource = AWSResource>(
  config: T,
): asserts config is WithRegion<T> {
  if (!config.region) {
    throw new Error("Region is required");
  }
}

export function addDefaultRegion<T extends AWSResource>(
  config: T,
  defaultRegion: string,
): WithRegion<T> {
  const { region } = config;
  return {
    ...config,
    region: region ?? defaultRegion,
  };
}
