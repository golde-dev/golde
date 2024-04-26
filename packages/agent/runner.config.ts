import {spawnTask, seriesTask} from "@chyzwar/runner";

spawnTask("build", 
  "yarn", [
    "build", 
  ]
);

spawnTask("bundle", 
  "yarn", [
    "esbuild", 
    "lib/app.js", 
    "--platform=node", 
    "--bundle", 
    "--outfile=dist/agent.js",
  ]
);

spawnTask("pkg", 
  "yarn", [
    "pkg", 
    "dist/agent.js", 
    "--out-path=dist",
  ]
);

spawnTask("sea", 
  "yarn", [
    "sea", 
    "dist/agent.js", 
    "dist/agent",
  ]
);

seriesTask("dist:pkg", [
  "build",
  "bundle",
  "pkg",
]);


seriesTask("dist:sea", [
  "build",
  "bundle",
  "sea",
]);