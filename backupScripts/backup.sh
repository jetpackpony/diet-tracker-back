#!/bin/sh
echo "this is backup running"

# Create a DB dump
mongodump --uri "mongodb://$MONGO_APP_USERNAME:$MONGO_APP_PASSWORD@$MONGO_HOST:$MONGO_PORT/$MONGO_DB_NAME" --gzip --archive=dump.gz.archive

# Rename the dump with current datetime
NEW_FILE_NAME=$MONGO_DB_NAME$(date +%Y-%m-%d-%H-%M-%S).gz.archive
mv dump.gz.archive $NEW_FILE_NAME
echo "moved to $NEW_FILE_NAME"

# Upload the dump into the cloud
gsutil cp $NEW_FILE_NAME gs://$BACKUP_BUCKET_NAME