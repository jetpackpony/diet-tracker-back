# Diet Tracker Backend

A backend for diet-tracker.

## Setting up for development

  1. Clone this repo.
  2. Copy `template.env` file to `.env` and setup all the variables (some of the variables only needed in production).
  3. Run the app:
      ```bash
      npm run start
      ```

This will run 2 containers:

  1. An app itself. App is run with `nodemon` and listens to the changes in the local directory and reloads the server. The app runs on port 4000. Also, `nodemon` is run with `--inspect` flag so the debugger is available on port `9229`.
  2. A mondodb instance, which is exposed on port 27017

`docker-compose` creates a persistent volume called `data-volume`, where the database is stored. When the volume doesn't exist (dropped or not yet created), mongodb will run init scripts located in `./mongo/init-scripts` directory. These will create an admin password with credentials from `MONGO_ADMIN_USERNAME` and `MONGO_ADMIN_PASSWORD` env virables. It will also create a user with credentials from `MONGO_USERNAME` and `MONGO_PASSWORD` and make it an admin of the database named `MONGO_INITDB_DATABASE`.

To install an npm package:
  1. Install it on the host machine:
      ```bash
      npm install --save ...
      ```
  2. Build the image again, renewing the container's volume (this recreates the node_modules directory):
      ```bash
      npm run start:update
      ```

## Testing production build locally
* Build the production docker image:
  ```bash
  npm run docker:build
  ```
* Run the containers:
  ```bash
  docker-compose -f docker-compose.prod.local.yml up
  ```


## Deploying to production

* Login into docker hub:
  ```bash
  docker login
  ```
* Build the app image and push to repo:
  > ### This repo is public so be careful to not leave any secrests in the image! Use `.dockerignore` to ignore files from local directory
  ```bash
  npm run docker:build
  npm run docker:push
  ```
* Copy `template.env` file to `.env.prod` and setup all the variables
* Setup a gcloud service account
  * go to gcloud console -> Menu -> IAM & Admin -> Service Accounts
  * create a new service account and download it's key to `svc_account.json`
  * share a google drive folder with the service account (use it's email address)
  * add the shared folder ID to `.env.prod` (you can see the id in the URL)
* Move `.env.prod`, `docker-compose.prod.yml`, `mongo`, `svc_account.json`
to your production machine:
  ```bash
  scp -r {.env.prod,docker-compose.prod.yml,mongo,svc_account.json} \
          USER@SERVER:/home/USER/diet-tracker-back
  ```
* Rename `.evn.prod` to `.env` on the server
  ```bash
  mv .env.prod .env
  ```
* To start the container with the app, run:
  ```bash
  docker-compose -f docker-compose.prod.yml pull
  docker-compose -f docker-compose.prod.yml up -d
  ```
This setup works with [traefik](https://docs.traefik.io/user-guide/docker-and-lets-encrypt/) which is setup in [jetpackpony/vm-setup](https://github.com/jetpackpony/vm-setup) repo.

To make it run on it's own, you need to expose a port from the service and skip definig labels. Update `docker-compose.prod.yml` with ports variable:
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
## Running a one-time backup

  Shell into the container:

  ```bash
  docker exec -it CONTAINER_NAME /bin/sh
  ```

  Run the `backup.sh` script:

  ```bash
  ./backup.sh
  ```

## Restoring a backup

  Copy the archive file onto container's file system:

  ```bash
  docker cp dump.gz.archive CONTAINER_NAME:/usr/src/app/backups
  ```

  Shell into the container:

  ```bash
  docker exec -it CONTAINER_NAME /bin/sh
  ```

  Run the `restore.sh` script:

  ```bash
  cd backups && ./restore.sh dump.gz.archive
  ```

## Restoring a prod backup into a dev database

  Drop the dietTrackerDEV database, then use --nsFrom="dietTracker.*" --nsTo="dietTrackerDEV.*" when restoring.
  Then Change the user/password to the DEV ones