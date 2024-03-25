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
    "--outfile=dist/app.js",
  ]
);

spawnTask("pkg", 
  "yarn", [
    "pkg", 
    "dist/app.js", 
    "--out-path=dist",
  ]
);

seriesTask("dist", [
  "build",
  "bundle",
  "pkg",
]);