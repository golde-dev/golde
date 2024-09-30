import { build, stop } from "https://deno.land/x/esbuild@v0.24.0/mod.js";
import type {
  BuildOptions,
  Plugin,
} from "https://deno.land/x/esbuild@v0.24.0/mod.js";
import { denoPlugins } from "@luca/esbuild-deno-loader";

/**
 * Below is a modified version of the import function from
 * @see https://github.com/ayoreis/import
 */

const SHEBANG = /^#!.*/;

const esbuildOptions: BuildOptions = {
  bundle: true,
  platform: "neutral",
  format: "esm",
  write: false,
  ignoreAnnotations: true,
  keepNames: true,
  treeShaking: false,
  logLevel: "error",
  plugins: denoPlugins({
    loader: "portable" as const,
  }) as Plugin[],
};

const AsyncFunction = async function () {}.constructor;

async function buildAndEvaluate(
  options: BuildOptions,
) {
  const { outputFiles } = await build(
    {
      ...esbuildOptions,
      ...options,
    },
  );

  await stop();

  if (!outputFiles) {
    throw new Error("Failed to build");
  }

  const [{ text }] = outputFiles;
  const [
    before,
    after = "}",
  ] = text.split("export {");

  const body = before.replace(SHEBANG, "") +
    "return {" +
    after.replaceAll(
      /(?<local>\w+) as (?<exported>\w+)/g,
      "$<exported>: $<local>",
    );

  const exports = await AsyncFunction(body)();

  const toStringTaggedExports = {
    [Symbol.toStringTag]: "Module",
    ...exports,
  };

  const sortedExports = Object.fromEntries(
    Object.keys(toStringTaggedExports)
      .sort()
      .map((key) => [key, toStringTaggedExports[key]]),
  );

  const emptyObject = Object.create(null);
  const prototypedExports = Object.assign(emptyObject, sortedExports);
  const sealedExports = Object.seal(prototypedExports);

  return sealedExports;
}

export async function dynamicImport(modulePath: string) {
  return await buildAndEvaluate(
    { entryPoints: [modulePath] },
  );
}
