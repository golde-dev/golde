
## Prerequisites

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

## Configure verdaccio

Start verdaccio (local npm proxy)
```sh
yarn verdaccio
```
Add local user to local verdaccio

```sh
npm adduser --registry http://localhost:4873/
```

Verify user is logged in verdaccio registry
```sh
npm whoami --registry http://localhost:4873/
```

Open verdaccio config file

```sh
code ~/.config/verdaccio/config.yaml

```
And change max body size to 100mb

```yaml
max_body_size: 100mb
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

