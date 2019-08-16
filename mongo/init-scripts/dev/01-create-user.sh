if [ ! -z ${MONGO_USERNAME+x} ] && [ ! -z ${MONGO_PASSWORD+x} ]; then
    "${mongo[@]}" "$MONGO_INITDB_DATABASE" <<-EOJS
    db.createUser({
        user: $(_js_escape "$MONGO_USERNAME"),
        pwd: $(_js_escape "$MONGO_PASSWORD"),
        roles: [ "readWrite", "dbAdmin" ]
    })
EOJS
fi