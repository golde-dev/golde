import {spawnTask, seriesTask} from "@chyzwar/runner";

spawnTask("build", 
  "yarn", [
    "build", 
  ]
);

spawnTask("bundle", 
  "yarn", [
    "esbuild", 
    "lib/bin/deployer.js", 
    "--platform=node", 
    "--bundle", 
    "--outfile=dist/deployer.js",
  ]
);

spawnTask("pkg", 
  "yarn", [
    "pkg", 
    "dist/deployer.js", 
    "--out-path=dist",
  ]
);

seriesTask("dist", [
  "build",
  "bundle",
  "pkg",
]);