import { build, emptyDir } from "@deno/dnt";
import { VERSION } from "./src/version.ts";

await emptyDir("./dist/npm");

const keywords = [
  "cli",
  "golde",
  "PaaS",
  "IaC",
  "cloud",
];

createBinPackage("cli-linux-x64", "linux", "x64");
createBinPackage("cli-linux-arm64", "linux", "arm64");
createBinPackage("cli-win32-x64", "win32", "x64");
createBinPackage("cli-darwin-x64", "darwin", "x64");
createBinPackage("cli-darwin-arm64", "darwin", "arm64");

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./dist/npm/@golde/cli",
  testPattern: "**/*.test.{ts,tsx,js,mjs,jsx}",
  importMap: "deno.jsonc",
  scriptModule: false,
  skipNpmInstall: true,
  test: false,
  shims: {
    deno: false,
  },
  compilerOptions: {
    target: "ES2022",
  },
  package: {
    name: "@golde/cli",
    version: VERSION,
    bin: {
      golde: "bin/cli.cjs",
    },
    keywords,
    scripts: {},
    type: "module",
    description: "Golde CLI",
    license: "Apache-2.0",
    publishConfig: {
      access: "public",
    },
    repository: {
      type: "git",
      url: "git+https://github.com/golde-dev/golde.git",
    },
    bugs: {
      url: "https://github.com/golde-dev/golde/issues",
    },
    optionalDependencies: {
      "@golde/cli-linux-x64": VERSION,
      "@golde/cli-linux-arm64": VERSION,
      "@golde/cli-win32-x64": VERSION,
      "@golde/cli-darwin-arm64": VERSION,
      "@golde/cli-darwin-x64": VERSION,
    },
  },
  postBuild() {
    Deno.mkdirSync("dist/npm/@golde/cli/bin", { recursive: true });
    Deno.copyFileSync("bin/cli.cjs", "dist/npm/@golde/cli/bin/cli.cjs");
    Deno.copyFileSync("README.md", "dist/npm/@golde/cli/README.md");
    Deno.copyFileSync("schema.json", "dist/npm/@golde/cli/schema.json");
    Deno.copyFileSync("../../LICENSE", "dist/npm/@golde/cli/LICENSE");
  },
});

function createBinPackage(name: string, os: string, cpu: "x64" | "arm64") {
  const cliPackageSON = JSON.stringify(
    {
      name: `@golde/${name}`,
      version: VERSION,
      description: `Golde CLI for ${os}-${cpu}`,
      keywords,
      license: "Apache-2.0",
      scripts: {},
      os: [os],
      cpu: [cpu],
      publishConfig: {
        access: "public",
      },
      repository: {
        type: "git",
        url: "git+https://github.com/golde-dev/golde.git",
      },
      bugs: {
        url: "https://github.com/golde-dev/golde/issues",
      },
    },
    null,
    2,
  );
  const packagePath = `dist/npm/@golde/${name}`;
  const packageJSONPath = `${packagePath}/package.json`;
  const licensePath = `${packagePath}/License`;
  const packageBinPath = `${packagePath}/bin`;
  const packageBinExecPath = name.includes("windows")
    ? `${packageBinPath}/${name}.exe`
    : `${packageBinPath}/${name}`;

  const binDistPath = name.includes("win32") ? `dist/bin/${name}.exe` : `dist/bin/${name}`;

  Deno.mkdirSync(packagePath, { recursive: true });
  Deno.mkdirSync(packageBinPath, { recursive: true });

  Deno.writeTextFileSync(
    packageJSONPath,
    cliPackageSON,
  );
  Deno.copyFileSync(
    binDistPath,
    packageBinExecPath,
  );
  Deno.copyFileSync("../../LICENSE", licensePath);
}
