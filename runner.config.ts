import chokidar from 'chokidar';
import {spawnTask, parallelTask, seriesTask, task} from "@chyzwar/runner";
import {spawn} from "child_process";
import {rmSync, writeFileSync } from "fs";
import {debounce} from "es-toolkit";
import {parseArgs} from 'node:util';

const {positionals: [firstPositional]} = parseArgs({
  args: process.argv.slice(3),
  strict: false,
  options: {
    filer: {
      type: "string",
    }
  }
})

spawnTask("start:docs", 
  "yarn", ["dev"], 
  {
    cwd: "./packages/docs",
  }
);

spawnTask("start:agent", 
  "deno", ["task", "start"], 
  {
    cwd: "./packages/agent",
  }
);

parallelTask("start", [
  "start:docs",
  "start:agent",
]);

spawnTask("dist:docs", 
  "yarn", ["dist"], 
  {
    cwd: "./packages/docs",
  }
);

spawnTask("dist:agent", 
  "deno", ["task", "dist"], 
  {
    cwd: "./packages/agent",
  }
);

spawnTask("dist:cli", 
  "deno", ["task", "dist"], 
  {
    cwd: "./packages/cli",
  }
);

parallelTask("dist", [
  "dist:agent", 
  "dist:cli",
  "dist:docs",
]);

spawnTask("dist:agent:dev", 
  "deno", ["task", "dist:dev"], 
  {
    cwd: "./packages/agent",
  }
);

spawnTask("dist:cli:dev", 
  "deno", ["task", "dist:dev"], 
  {
    cwd: "./packages/cli",
  }
);

parallelTask("dist:dev", [
  "dist:agent:dev", 
  "dist:cli:dev",
]);

spawnTask("test:agent", 
  "deno", firstPositional ? [
    "test", 
    "--allow-env", 
    "--allow-read", 
    "--allow-run",
    "--filter",
    firstPositional
  ] :[
    "test", 
    "--allow-env", 
    "--allow-read", 
    "--allow-run"
  ], 
  {
    cwd: "./packages/agent",
  }
);

spawnTask("test:cli", 
  "deno", firstPositional ? [
    "test", 
    "--allow-env", 
    "--allow-read", 
    "--allow-run",
    "--filter",
    firstPositional
  ] :[
    "test", 
    "--allow-env", 
    "--allow-read", 
    "--allow-run"
  ], 
  {
    cwd: "./packages/cli",
  }
);

parallelTask("test", [
  "test:agent", 
  "test:cli",
]);

spawnTask("lint:rest", 
  "yarn", ["eslint", ".", '--cache']
);

spawnTask("lint:agent", 
  "deno", ["lint", "src/"], 
  {
    cwd: "./packages/agent",
  }
);

spawnTask("lint:cli", 
  "deno", ["lint", "src/"], 
  {
    cwd: "./packages/cli",
  }
);

parallelTask("lint", [
  "lint:agent", 
  "lint:cli",
  "lint:rest",
]);

spawnTask("version", 
  "lerna", ["version", "--yes"],
)

task("version:clean", () => {
  rmSync("./local.json", { force: true });
})

task("version:local", () => {
  writeFileSync(
    "./local.json",
    JSON.stringify(
      {
        version: new Date().toISOString().replaceAll(":", "-"),
        goldeURL: "https://api.golde.dev/v1",
      },
    ),
  )
})

spawnTask("publish:cli",
  "deno", ["task", "publish"],
  {
    cwd: "./packages/cli",
  }
);
spawnTask("publish:cli:dev",
  "deno", ["task", "publish:dev"],
  {
    cwd: "./packages/cli",
  }
);

spawnTask("publish:agent",
  "deno", ["task", "publish"],
  {
    cwd: "./packages/agent",
  }
);

parallelTask("publish", [
  "publish:cli",
  "publish:agent",
]);

parallelTask("publish:dev", [
  "publish:cli:dev",
]);

seriesTask("dev", [
  "version:local",
  "dist:dev",
  "publish:dev",
  "version:clean"
]);



task("dev:watch", () => {
  return new Promise(() => {
    let devProcess;
    const dev = debounce(() => {
      if (devProcess) {
        devProcess.kill();
      }
      devProcess = spawn('yarn', ['dev'])
      devProcess.stdout.on('data', (data) => {
        if(data.toString().trim()) {
          console.log(`[dev:watch] ${data}`);
        }
      });
    }, 2000);

    chokidar
      .watch('./packages/cli/src', {ignoreInitial: true})
      .on('all', (event, path) => {
        console.log(`[dev:watch] ${event} ${path}`);
        dev();
    });
  });
});
