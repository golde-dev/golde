import {spawnTask, parallelTask, seriesTask, task} from "@chyzwar/runner";
import {rmSync, writeFileSync } from "fs";

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

parallelTask("dist:local", [
  "dist:agent:local", 
  "dist:cli:local",
]);

spawnTask("test:agent", 
  "deno", ["test"], 
  {
    cwd: "./packages/agent",
  }
);
spawnTask("test:cli", 
  "deno", ["test"], 
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
        version: Date.now().toString(),
        goldeURL: "https://golde.localhost/api/v1",
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
  "deno", ["task", "publish", "--local"],
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
  "deno", ["task", "publish", "--local"],
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

seriesTask("local", [
  "version:local",
  "dist:local",
  "publish:local",
  "version:clean"
]);


seriesTask("local:cli", [
  "version:local",
  "dist:cli:local",
  "publish:cli:local",
  "version:clean"
]);