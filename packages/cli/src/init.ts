import { logger } from "./logger.ts";
import { input, select } from "@inquirer/prompts";
import { projectNameSchema } from "./schema.ts";
import { ZodError, type ZodSchema } from "zod";
import { resolve } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { DeployerProvider, getDeployerConfig } from "./providers/deployer.ts";
import { DeployerError } from "./clients/deployer.ts";

const validate = (value: string, schema: ZodSchema): boolean | string => {
  try {
    schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      return error.issues.map(({ message }) => message).join(",");
    }
  }
  return true;
};

interface PackageJSON {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const getProjectType = () => {
  const projectInfo = {
    name: "",
    isNPMPackage: false,
    isTSPackage: false,
  };
  const packagePath = resolve("./package.json");
  if (existsSync(packagePath)) {
    const source = JSON.parse(
      readFileSync(packagePath, { encoding: "utf-8" }),
    ) as PackageJSON;

    projectInfo.name = source.name;
    projectInfo.isNPMPackage = true;
    projectInfo.isTSPackage = Boolean(
      source.dependencies?.typescript ??
        source.devDependencies?.typescript,
    );
  }
  return projectInfo;
};

function createJSConfig(projectName: string) {
  const config = `

const config = {
  name: "${projectName}",
  providers: {
    deployer: {
      apiKey: "{{ env.DEPLOYER_API_KEY }}",
    },
  },
};

export default config;
`;

  writeFileSync("./golde.config.js", config);
}

function createTSConfig(projectName: string) {
  const config = `
import type {Config} from '@tenacify/cli'

const config: Config = {
  name: "${projectName}",
  providers: {
    deployer: {
      apiKey: "{{ env.DEPLOYER_API_KEY }}",
    },
  },
};
export default config;
`;

  writeFileSync("./deployer.config.ts", config);
}

function createJSONConfig(projectName: string) {
  const config = `
{
  "$schema": "https://tenacify.dev/schemas/deployer.config.schema.json",
  "name": "${projectName}",
  "providers": {
    "deployer": {
      "apiKey": "{{ env.DEPLOYER_API_KEY }}"
    }
  }
}
`;

  writeFileSync("./deployer.config.json", config);
}

export async function initConfig() {
  const {
    name,
    isNPMPackage,
    isTSPackage,
  } = getProjectType();

  const deployerConfig = getDeployerConfig();

  try {
    const projectName = await input({
      message: "Enter project name ",
      default: name,
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
          name: "deployer.config.json",
          value: "deployer.config.json",
        },
        {
          name: "deployer.toml",
          value: "deployer.toml",
        },
      ],
    });

    switch (configType) {
      case "deployer.config.js":
        createJSConfig(projectName);
        break;
      case "deployer.config.ts":
        createTSConfig(projectName);
        break;
      case "deployer.config.json":
        createJSONConfig(projectName);
        break;
    }

    if (deployerConfig) {
      try {
        const deployer = await DeployerProvider.init(
          projectName,
          deployerConfig,
        );
        await deployer.createProject();
      } catch (error) {
        if (error instanceof DeployerError) {
          if (error.cause?.status === 409) {
            logger.error(`Project: ${projectName} already exists`);
          } else {
            logger.error("Failed to create project in deployer", {
              error,
            });
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("User force closed the prompt")) {
        Deno.exit(0);
      }
    }
  }
}
