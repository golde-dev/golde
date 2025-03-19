FROM node:22-slim

RUN corepack enable
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY server.js ./

RUN yarn install

EXPOSE 3000
CMD [ "node", "server.js" ] 
