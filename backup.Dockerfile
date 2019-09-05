FROM google/cloud-sdk:alpine

RUN apk add --no-cache mongodb-tools

WORKDIR /usr/src/app

COPY backupScripts .
RUN chmod -R u+x *.sh

CMD sh setup-gcloud.sh && sh