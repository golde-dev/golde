import { logger } from "./logger.ts";
import { confirm, input, select } from "@inquirer/prompts";
import { projectNameSchema } from "./schema.ts";
import { ZodError, type ZodSchema } from "zod";
import { createGoldeClient, getGoldeConfig } from "./providers/golde.ts";
import { GoldeError } from "./clients/golde/base.ts";
import { resolve } from "@std/path/resolve";
import { existsSync } from "@std/fs/exists";
import type { GoldeClient } from "./clients/golde/client.ts";

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
      Deno.readTextFileSync(packagePath),
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
    golde: {
      apiKey: "{{ env.golde_API_KEY }}",
    },
  },
};

export default config;
`;

  Deno.writeTextFileSync("./golde.config.js", config);
}

function createTSConfig(projectName: string) {
  const config = `
import type {Config} from '@golde/cli'

const config: Config = {
  name: "${projectName}",
  providers: {
    golde: {
      apiKey: "{{ env.GOLDE_API_KEY }}",
    },
  },
};
export default config;
`;

  Deno.writeTextFileSync("./golde.config.ts", config);
}

function createJSONConfig(projectName: string) {
  const config = `
{
  "$schema": "https://golde.dev/schemas/golde.config.schema.json",
  "name": "${projectName}",
  "providers": {
    "golde": {
      "apiKey": "{{ env.GOLDE_API_KEY }}"
    }
  }
}
`;

  Deno.writeTextFileSync("./golde.config.json", config);
}

export async function confirmCreateProject(name: string): Promise<boolean> {
  try {
    const shouldCreate = await confirm({
      message: `Would you like to create a new project: ${name}?`,
      default: true,
    });
    return shouldCreate;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("User force closed the prompt")) {
        Deno.exit(0);
      }
    }
    throw error;
  }
}

export async function createProjectIfWanted(
  golde: GoldeClient,
  name: string,
) {
  const projectExists = await golde.hasProject(name);
  if (projectExists) {
    logger.debug(`Project ${name} already exists`);
    return;
  }
  const shouldCreate = await confirmCreateProject(name);

  if (!shouldCreate) {
    throw new Error("Unable to continue, when using golde project is required");
  }
  await golde.createProject(name);
}

export async function createProjectIfMissing(
  golde: GoldeClient,
  name: string,
) {
  const hasProject = await golde.hasProject(name);
  if (hasProject) {
    logger.debug(`Project ${name} already exists`);
    return;
  }
  await golde.createProject(name);
}

export async function initConfig() {
  const {
    name,
    isNPMPackage,
    isTSPackage,
  } = getProjectType();

  const goldeConfig = getGoldeConfig();

  try {
    const projectName = await input({
      message: "Enter project name ",
      default: name,
      validate: (value: string) => validate(value, projectNameSchema),
    });

    const configType = await select({
      message: "Select config format",
      default: isTSPackage ? "golde.config.ts" : isNPMPackage ? "golde.config.js" : "golde.toml",
      choices: [
        {
          name: "golde.config.js",
          value: "golde.config.js",
        },
        {
          name: "golde.config.ts",
          value: "golde.config.ts",
        },
        {
          name: "golde.config.json",
          value: "golde.config.json",
        },
        {
          name: "golde.toml",
          value: "golde.toml",
        },
        {
          name: "golde.yaml",
          value: "golde.yaml",
        },
      ],
    });

    switch (configType) {
      case "golde.config.js":
        createJSConfig(projectName);
        break;
      case "golde.config.ts":
        createTSConfig(projectName);
        break;
      case "golde.config.json":
        createJSONConfig(projectName);
        break;
    }

    if (goldeConfig) {
      try {
        const golde = await createGoldeClient(goldeConfig);
        const hasProject = await golde.hasProject(name);
        if (hasProject) {
          logger.info(`Project ${projectName} already exists`);
          return;
        }
        await golde.createProject(projectName);
      } catch (error) {
        if (error instanceof GoldeError) {
          if (error.cause?.status === 409) {
            logger.error(`Project: ${projectName} already exists`);
          } else {
            logger.error("Failed to create project in golde", {
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
