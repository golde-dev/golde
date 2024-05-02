import { build, emptyDir } from "@deno/dnt";

await emptyDir("./dist/npm");

const { version } = JSON.parse(Deno.readTextFileSync("deno.jsonc"));

const createBinPackage = (name: string, os: string, cpu: "x64" | "arm64") => {
  const cliPackageSON = JSON.stringify(
    {
      name: `@deployer/${name}`,
      version,
      description: "Your package.",
      license: "Apache-2.0",
      os: [os],
      cpu: [cpu],
      repository: {
        type: "git",
        url: "git+https://github.com/username/repo.git",
      },
      bugs: {
        url: "https://github.com/username/repo/issues",
      },
    },
    null,
    2,
  );
  const packagePath = `dist/npm/@deployer/${name}`;
  const packageJSONPath = `${packagePath}/package.json`;
  const licensePath = `${packagePath}/License`;
  const packageBinPath = `${packagePath}/bin`;
  const packageBinExecPath = name.includes("windows")
    ? `${packageBinPath}/${name}.exe`
    : `${packageBinPath}/${name}`;

  const binDistPath = name.includes("win32")
    ? `dist/bin/${name}.exe`
    : `dist/bin/${name}`;

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
  Deno.copyFileSync("../../License", licensePath);
};

createBinPackage("cli-linux-x64", "linux", "x64");
createBinPackage("cli-linux-arm64", "linux", "arm64");
createBinPackage("cli-win32-x64", "win32", "x64");
createBinPackage("cli-darwin-x64", "darwin", "x64");
createBinPackage("cli-darwin-arm64", "darwin", "arm64");

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./dist/npm/@deployer/cli",
  testPattern: "**/*.test.{ts,tsx,js,mjs,jsx}",
  importMap: "deno.jsonc",
  scriptModule: false,
  test: false,
  shims: {
    deno: true,
  },
  compilerOptions: {
    target: "ES2022",
  },
  package: {
    name: "@deployer/cli",
    version,
    bin: "bin/cli.js",
    description: "Your package.",
    license: "Apache-2.0",
    repository: {
      type: "git",
      url: "git+https://github.com/username/repo.git",
    },
    bugs: {
      url: "https://github.com/username/repo/issues",
    },
    optionalDependencies: {
      "@deployer/cli-linux-x86_64": version,
      "@deployer/cli-linux-aarch64": version,
      "@deployer/cli-windows-x86_64": version,
      "@deployer/cli-apple-aarch64": version,
      "@deployer/cli-apple-x86_64": version,
    },
  },
  postBuild() {
    Deno.mkdirSync("dist/npm/@deployer/cli/bin", { recursive: true });
    Deno.copyFileSync("bin/cli.js", "dist/npm/@deployer/cli/bin/cli.js");
    Deno.copyFileSync("Readme.md", "dist/npm/@deployer/cli/README.md");
    Deno.copyFileSync("schema.json", "dist/npm/@deployer/cli/schema.json");
    Deno.copyFileSync("../../License", "dist/npm/@deployer/cli/License");
  },
});
