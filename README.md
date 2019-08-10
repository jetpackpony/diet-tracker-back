# Diet Tracker Backend

A backend for diet-tracker configurated for development and production setups.

## Setting up for development

  1. Clone the repo.
  2. Copy `template.env` file to `.env` and setup all the variables (some of the variables only needed in production).
  3. Run the container:
  ```bash
  $ docker-compose -f docker-compose.dev.yml up --build
  ```
This will run the app inside a container. App is run with `nodemon` and listens to the changes in the local directory and reloads the server. Also, `nodemon` is run with `--inspect` flag so the debugger is available on port `9229`.

To install an npm package:
  1. nstall it on the host machine:
  ```bash
  $ npm install --save ...
  ```
  2. Build the image again, renewing the node_modules directory:
  ```bash
  $ docker-compose -f docker-compose.dev.yml up --build --renew-anon-volumes
  ```

## Deploying to production

  0. Login into docker hub:
  ```bash
  $ docker login
  ```
  1. Build the image:
  ```bash
  $  docker build -t diet-tracker-back .
  ```
  2. Tag the image with repository name:
  ```bash
  $ docker tag diet-tracker-back REPO-NAME/diet-tracker-back
  ```
  3. Push the image to the repo:
  ```bash
  $ docker push jetpackpony/diet-tracker-back
  ```
  4. Copy `template.env` file to `.env.prod` and setup all the variables
  5. Move `.env.prod` and `docker-compose.prod.yml` files to your production machine. For gcloud VM:
  ```bash
  $ gcloud.cmd compute scp ./.env.prod ./docker-compose.prod.yml \
                           INSTANCE_USER_NAME@INSTANCE_NAME:/home/jetpackpony/diet-tracker-back
  ```
  7. Rename `.evn.prod` to `.env` on the remote server. This needs to be done
  so that docker-compose picks it up.
  ```bash
  $ mv .env.prod .env
  ```
  6. On production machine, to start the container with the app, run:
  ```bash
  $ docker-compose pull
  $ docker-compose -f docker-compose.prod.yml up -d
  ```
  This setup works with [traefik](https://docs.traefik.io/user-guide/docker-and-lets-encrypt/)
which is setup in [jetpackpony/vm-setup](https://github.com/jetpackpony/vm-setup) repo.
  
  To make it run on it's own, you need to expose a port from the service and skip
  definig labels. Update `docker-compose.prod.yml` with ports variable:
  ```yml
version: '3'
services:
  app:
    ...
    expose:
      - 3000
    ports:
      - 3000:3000
  ```
