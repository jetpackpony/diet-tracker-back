FROM node:10-alpine

RUN npm install -g nodemon

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .