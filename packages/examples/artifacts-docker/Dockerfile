FROM node:22

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
COPY server.js ./

RUN yarn install

CMD [ "node", "server.js" ] 
