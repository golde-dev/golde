import {spawnTask, dockerTask, parallelTask} from "@chyzwar/runner";

spawnTask("build:watch", 
  "yarn", ["build:watch"] 
);

spawnTask("start:server", 
  "yarn", ["dev"], 
  {
    cwd: "./packages/server",
  }
);

spawnTask("start:client", 
  "yarn", ["dev"], 
  {
    cwd: "./packages/client",
  }
);

dockerTask("caddy", "caddy", {
  interactive: true,
  rm: true,
  name: "Caddy",
  network: "host",
  ports: [
    "80:80",
    "443:443",
    "2019:2019",
  ],
  volumes: [
    `${process.cwd()}/Caddyfile:/etc/caddy/Caddyfile`, 
  ],
});


parallelTask("start", [
  "start:client", 
  "start:server", 
  "caddy",
]);