import chokidar from 'chokidar';
import {spawnTask, parallelTask, seriesTask, task} from "@chyzwar/runner";
import {spawn} from "child_process";
import {rmSync, writeFileSync } from "fs";
import {debounce} from "es-toolkit";
import { parseArgs } from 'util';


spawnTask("verdaccio", 
  "yarn", ["dlx", "verdaccio@6.0.0-rc.1"],
);

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

parallelTask("post-version", [
  "dist:agent", 
  "dist:cli",
]);

parallelTask("dist", [
  "dist:agent", 
  "dist:cli",
  "dist:docs",
]);

spawnTask("dist:agent:local", 
  "deno", ["task", "dist:local"], 
  {
    cwd: "./packages/agent",
  }
);

spawnTask("dist:cli:local", 
  "deno", ["task", "dist:local"], 
  {
    cwd: "./packages/cli",
  }
);

spawnTask("dist:cli:dev", 
  "deno", ["task", "dist:dev"], 
  {
    cwd: "./packages/cli",
  }
);


parallelTask("dist:local", [
  "dist:agent:local", 
  "dist:cli:local",
]);

parallelTask("dist:dev", [
  "dist:cli:dev",
]);

const {positionals: [pattern]} = parseArgs({
  args: process.argv.slice(3),
  strict: false,
  options: {
    filer: {
      type: "string",
    }
  }
})

spawnTask("test:agent", 
  "deno", pattern ? [
    "test", 
    "--allow-env", 
    "--allow-read", 
    "--allow-run",
    "--filter",
    pattern
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
  "deno", pattern ? [
    "test", 
    "--allow-env", 
    "--allow-read", 
    "--allow-run",
    "--filter",
    pattern
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
        goldeURL: "https://api.golde.localhost/v1",
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
spawnTask("publish:cli:local",
  "deno", ["task", "publish:local"],
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

spawnTask("publish:agent:local",
  "deno", ["task", "publish:local"],
  {
    cwd: "./packages/agent",
  }
);

parallelTask("publish", [
  "publish:cli",
  "publish:agent",
]);

parallelTask("publish:local", [
  "publish:cli:local",
  "publish:agent:local",
]);

parallelTask("publish:dev", [
  "publish:cli:dev",
]);

seriesTask("local", [
  "version:local",
  "dist:local",
  "publish:local",
  "version:clean"
]);

seriesTask("dev", [
  "version:local",
  "dist:dev",
  "publish:dev",
  "version:clean"
]);


seriesTask("local:cli", [
  "version:local",
  "dist:cli:local",
  "publish:cli:local",
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
