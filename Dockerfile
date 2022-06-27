FROM node:16.15.1-alpine

RUN npm install -g nodemon
RUN apk add --no-cache mongodb-tools

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN chmod -R u+x ./backups/*.sh
