# Diet Tracker Backend

A backend for diet-tracker configurated for development and production setups.

## Setting up for development

  1. Clone the repo.
  2. Copy `template.env` file to `.env` and setup all the variables (some of the
  variables only needed in production).
  3. Run the container:
  ```bash
  $ docker-compose -f docker-compose.dev.yml up --build app
  ```
This will run 3 containers:

  1. An app itself. App is run with `nodemon` and listens
  to the changes in the local directory and reloads the server. The app runs on
  port 4000. Also, `nodemon` is run with `--inspect` flag so the debugger is
  available on port `9229`. Debugger breaks on the app start, so you need to
  connect to debugger and press 'continue'.
  2. A mondodb instance, which is exposed on port 27017

`docker-compose` creates a persistent volume called `data-volume`, where the
database is stored. This is the one that should be backed up. When the volume doesn't
exist (dropped or not yet created), mongodb will run init scripts in `./mongo/init-scripts`
directory. These will create an admin password with credentials from `MONGO_ADMIN_USERNAME`
and `MONGO_ADMIN_PASSWORD` env virables. It will also create a user with
credentials from `MONGO_USERNAME` and `MONGO_PASSWORD` and make it an admin
of the database named `MONGO_INITDB_DATABASE`.

To run a one-off backup of the dev db (with upload to gcloud):

```bash
  $ docker-compose -f docker-compose.dev.yml up --build gcloud-backup
```

To install an npm package:
  1. nstall it on the host machine:
  ```bash
  $ npm install --save ...
  ```
  2. Build the image again, renewing the node_modules directory:
  ```bash
  $ docker-compose -f docker-compose.dev.yml up --build -V app
  ```

## Deploying to production

  * Login into docker hub:
  ```bash
  $ docker login
  ```
  
  * Build the app image and push to repo:
  ```bash
  $  docker build --build-arg NODE_ENV=production -t diet-tracker-back . \
        && docker tag diet-tracker-back jetpackpony/diet-tracker-back \
        && docker push jetpackpony/diet-tracker-back
  ```
  * Build the auto-backup image and push to repo:
  ```bash
  $ docker build -t diet-tracker-backup -f backup.Dockerfile . \
        && docker tag diet-tracker-backup jetpackpony/diet-tracker-backup \
        && docker push jetpackpony/diet-tracker-backup
  ```
  * Setup a gcloud service account for backup and save it to `svc_account.json`
  * Copy `template.env` file to `.env.prod` and setup all the variables
  * Move `.env.prod`, `docker-compose.prod.yml`, `mongo`, `svc_account.json`
  to your production machine. For gcloud VM:
  ```bash
  $ gcloud.cmd compute scp ./.env.prod ./docker-compose.prod.yml ./mongo ./gcloud/certs/svc_account.json \
                           jetpackpony@vpc:/home/jetpackpony/diet-tracker-back \
                           --recurse
  ```
  * To ssh into the instance use:
  ```
  $ gcloud.cmd compute ssh jetpackpony@vpc
  ```
  * Rename `.evn.prod` to `.env` on the remote server. This needs to be done
  so that docker-compose picks it up.
  ```bash
  $ mv .env.prod .env
  ```
  * On production machine, to start the container with the app, run:
  ```bash
  $ docker-compose -f docker-compose.prod.yml pull
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
## Running a one-time backup

  The network should be the same network in which mongod instance is running
  ```bash
  $ CONTAINER_NAME=diet-tracker-backup \
      && docker create -ti --name=$CONTAINER_NAME \
          --network=diet-tracker-back_default \
          --env-file=.env -e SVC_ACCOUNT_FILE=//tmp/svc_account.json \
          diet-tracker-backup sh -c "./setup-gcloud.sh && ./backup.sh" \
      && docker cp gcloud/certs/svc_account.json \
              $CONTAINER_NAME:/tmp/svc_account.json \
      && winpty docker start -ai $CONTAINER_NAME \
      && docker rm $CONTAINER_NAME
  ```

## Restoring a backup

  The backup image has a `restore.sh` script which restores a provided dump file
  into the db. The network should be the same network in which mongod instance is running
  ```bash
  $ CONTAINER_NAME=diet-tracker-restore \
      && docker create -ti --name=$CONTAINER_NAME \
          --network=diet-tracker-back_default \
          --env-file=.env \
          -e DUMP_TO_RESTORE=//tmp/dump_to_restore.gz.archive \
          diet-tracker-backup sh -c "./restore.sh" \
      && docker cp ./dietTracker2019-09-06-00-59-00.gz.archive \
              $CONTAINER_NAME:/tmp/dump_to_restore.gz.archive \
      && winpty docker start -ai $CONTAINER_NAME \
      && docker rm $CONTAINER_NAME
  ```