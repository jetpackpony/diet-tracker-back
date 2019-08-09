# Diet Tracker Backend

A backend for diet-tracker configurated for development and production setups.

## Setting up for development

  1. Clone the repo.
  2. Copy `template.env` file to `.env.dev` and setup all the variables (some of the variables only needed in production).
  3. Run the container:
  ```
  $ docker-compose -f docker-compose.dev.yml up --build
  ```
This will run the app inside a container. App is run with `nodemon` and listens to the changes in the local directory and reloads the server. Also, `nodemon` is run with `--inspect` flag so the debugger is available on port `9229`.

To install a package, first install it on the host machine:
```
$ npm install ...
```
Then build the image again:
```
$ docker-compose -f docker-compose.dev.yml up --build
```

## Deploying to production

  0. Login into docker hub:
  ```
  $ docker login
  ```
  1. Build the image:
  ```
  $  docker build -t diet-tracker-back .
  ```
  2. Tag the image with repository name:
  ```
  $ docker tag diet-tracker-back REPO-NAME/diet-tracker-back
  ```
  3. Push the image to the repo:
  ```
  $ docker push jetpackpony/diet-tracker-back
  ```
  4. Copy `template.env` file to `.env.prod` and setup all the variables
  5. Move `.env.prod` and `docker-compose.prod.yml` files to your production machine:
  ```
  $ 
  ```
  6. On production machine, to start the container with the app, run:
  ```
  $ docker-compose -f docker-compose.prod.yml up -d
  ```
  This setup works with [letsencrypt-nginx-proxy-companion](https://github.com/JrCs/docker-letsencrypt-nginx-proxy-companion) which is setup in [jetpackpony/vm-setup](https://github.com/jetpackpony/vm-setup) repo. To make it run on it's own, add a port mapping to the command:
  ```
  $ docker-compose -f docker-compose.prod.yml -p 3000:3000 up -d
  ```
