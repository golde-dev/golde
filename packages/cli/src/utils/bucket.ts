import type { GitVersion, ObjectVersion } from "../types/version.ts";

export interface Object {
  body: ReadableStream;
  version: string;
}

export interface Include {
  from: string;
  to: string;
}

export type Version = ObjectVersion | GitVersion;

export interface ObjectConfig {
  includes?: Include[];
  version?: Version;
  source?: string;
  context?: string;
}

async function getVersion(body: ReadableStream, version: Version = "ObjectHash"): Promise<string> {
  if (version === "ObjectHash") {
    return await getObjectHash(body);
  }
  throw new Error("Not implemented");
}

async function createFromSource(
  context: string,
  source: string,
): Promise<ReadableStream> {
  return await Promise.reject(new Error("Not implemented"));
}

async function getObjectHash(body: ReadableStream): Promise<string> {
  throw await Promise.reject(new Error("Not implemented"));
}

async function createFromIncludes(
  context: string,
  includes: Include[] = [],
): Promise<ReadableStream> {
  throw await Promise.reject(new Error("Not implemented"));
}

export async function getObject(config: ObjectConfig): Promise<Object> {
  const {
    source,
    includes,
    version,
    context = ".",
  } = config;

  const body = source
    ? await createFromSource(context, source)
    : await createFromIncludes(context, includes);

  const newVersion = await getVersion(body, version);

  return {
    body,
    version: newVersion,
  };
}
