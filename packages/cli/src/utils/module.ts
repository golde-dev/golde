/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-implied-eval */

import { findUp } from "find-up";
import { readFileSync, rmSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { transpileModule, ScriptTarget, ModuleKind}  from "typescript";

/**
 * Needed because typescript compiler do not allow using import() in common.js
 */
export const importDynamic = async <T = unknown>(modulePath: string): Promise<T> => {
  return new Function("importDynamic", `return import('${modulePath}')`)() as T;
};

export const inputIsModule = (source: string): boolean => {
  return source.includes("export ");
};

export const packageIsModule = async(dir: string): Promise<boolean | void> => {
  const packagePath = await findUp("package.json", {cwd: dir});
  if (packagePath) {
    const {type} = require(packagePath) as {type: string};
    return type === "module";
  }
};

export const importTS = async<T = unknown>(path: string): Promise<T> => {
  const dir = dirname(path);
  const fileName = basename(path);
  
  const source = readFileSync(path, {encoding:"utf-8"});
  const isModule = (
    inputIsModule(source) || 
    await packageIsModule(dir)
  );

  const {outputText} = transpileModule(source, {
    compilerOptions: {
      target: ScriptTarget.ES2020,
      module: isModule 
        ? ModuleKind.ESNext 
        : ModuleKind.CommonJS,
    },
  });
  const compiledConfigPath = join(dir, `${fileName}.${isModule ? "mjs": "cjs"}`);

  try {
    writeFileSync(
      compiledConfigPath, 
      outputText
    );
    return await importDynamic(compiledConfigPath);
  }
  finally {
    rmSync(compiledConfigPath, {force: true});
  }
};