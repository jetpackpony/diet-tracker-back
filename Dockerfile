FROM node:16.15.1-alpine AS base 

RUN apk add --no-cache mongodb-tools

WORKDIR /usr/src/app

# For dev copy the whole thing over
FROM base AS development
ENV NODE_ENV=development
COPY . .
RUN npm install
RUN chmod -R u+x ./backups/*.sh

# For building, copy the whole thing over and run a build command
FROM development AS builder
RUN rm -rf ./build
RUN npm run build

# For production, run the builder, then copy the results over
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/backups ./backups
COPY --from=builder /usr/src/app/mongo ./mongo