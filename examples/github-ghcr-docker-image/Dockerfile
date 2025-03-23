FROM node:22-slim

RUN corepack enable yarn
WORKDIR /app

COPY ./yarn.lock yarn.lock
COPY ./.yarn .yarn
COPY ./.yarnrc.yml .yarnrc.yml
COPY ./package.json package.jsn

RUN yarn workspaces focus --production @golde/example-github-ghcr-docker-image

EXPOSE 3000
CMD [ "node", "server.js" ] 
