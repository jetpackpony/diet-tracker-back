#!/bin/sh
echo "this is trying to restore a db"

# Create a DB dump
mongorestore --drop --uri "mongodb://$MONGO_ADMIN_USERNAME:$MONGO_ADMIN_PASSWORD@$MONGO_HOST:$MONGO_PORT/$MONGO_DB_NAME" --gzip --archive=$DUMP_TO_RESTORE
