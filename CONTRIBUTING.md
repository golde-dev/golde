
# Prerequisites

This project require number of tools available.

- [Deno](https://docs.deno.com/runtime/fundamentals/installation/)
- [Nodenv](https://github.com/nodenv/nodenv)

## Initialize env

Once above are installed

Install node version specified in .node-version

```sh
nodenv install
```

Enable corepack for installed version of node.js

```sh
corepack enable
```

Install dependencies
  
```sh
yarn install
```

## Start project

Start project docs and agent processes

```sh
yarn start
```

Quick variant will only build for current local platform,
It would update examples by overwriting files in node_modules

```sh
yarn dev
```

Watch for for changes in CLI package and rebuild using dev

```sh
yarn dev:watch
```

Create build artifacts

```sh
yarn dist
```
