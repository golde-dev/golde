import {spawnTask, parallelTask} from "@chyzwar/runner";

spawnTask("build:watch", 
  "yarn", ["build:watch"] 
);

spawnTask("start:docs", 
  "yarn", ["dev"], 
  {
    cwd: "./packages/docs",
  }
);

parallelTask("start", [
  "build:watch", 
  "start:docs",
]);

