import {spawnTask, parallelTask, seriesTask} from "@chyzwar/runner";

spawnTask("verdaccio", 
  "yarn", ["dlx", "verdaccio"]
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
  "yarn", ["eslint", ".", "--ext", ".ts,.js,.tsx"]
);

spawnTask("lint:agent", 
  "deno", ["lint"], 
  {
    cwd: "./packages/agent",
  }
);
spawnTask("lint:cli", 
  "deno", ["lint"], 
  {
    cwd: "./packages/cli",
  }
);

parallelTask("lint", [
  "lint:agent", 
  "lint:cli",
  "lint:rest",
]);

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
  "dist:local",
  "publish:local",
]);