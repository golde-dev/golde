import { input, select } from "@inquirer/prompts";
import { projectNameSchema } from "./schema";
import { ZodError, type ZodSchema } from "zod";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

const validate = (value: string, schema: ZodSchema): boolean | string => {
  try {
    schema.parse(value);
  }
  catch (error) {
    if (error instanceof ZodError) {
      return error.issues.map(({message}) => message).join(",");
    }
  }
  return true;
};

interface PackageJSON {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const getProjectType = () => {
  const projectInfo = {
    isNPMPackage: false,
    isTSPackage: false,
  };
  const packagePath = resolve("./package.json");
  if (existsSync(packagePath)) {
    const source = JSON.parse(
      readFileSync(packagePath, {encoding:"utf-8"})
    ) as PackageJSON;

    projectInfo.isNPMPackage = true;
    projectInfo.isTSPackage = Boolean(
      source.dependencies?.typescript ??
      source.devDependencies?.typescript
    );
  }
  return projectInfo;
};


export async function initConfig() {
  const {
    isNPMPackage,
    isTSPackage,
  } = getProjectType();

  try {

  
    const projectName = await input({ 
      message: "Enter project name ",
      validate: (value: string) => validate(value, projectNameSchema),
    });
  
    const configType = await select({
      message: "Select config format",
      default: isTSPackage 
        ? "deployer.config.ts"
        : isNPMPackage 
          ? "deployer.config.js"
          : "deployer.toml",
      choices: [
        {
          name: "deployer.config.js",
          value: "deployer.config.js",
        },
        {
          name: "deployer.config.ts",
          value: "deployer.config.ts",
        },
        {
          name: "deployer.toml",
          value: "deployer.toml",
        },
      ],
    });

    console.log({
      projectName,
      configType,
    });
  }
  catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("User force closed the prompt")) {
        process.exit(0);
      }
    }
  }
}
