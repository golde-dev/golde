
## Prerequisites

This project require number of tools available.

- [Deno](https://docs.deno.com/runtime/manual/getting_started/installation)
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

Create build artifacts and install then on locally
- npm packages will be published to local verdaccio

```sh
yarn local
```

Create build artifacts

```sh
yarn dist
```

