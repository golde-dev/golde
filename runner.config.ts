import {spawnTask, parallelTask} from "@chyzwar/runner";

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