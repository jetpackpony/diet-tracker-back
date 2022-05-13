#!/bin/sh
echo "this is trying to restore a db"

# Create a DB dump
mongorestore --drop --uri "mongodb://$MONGO_APP_USERNAME:$MONGO_APP_PASSWORD@$MONGO_HOST:$MONGO_PORT/$MONGO_DB_NAME" --gzip --archive=$1
