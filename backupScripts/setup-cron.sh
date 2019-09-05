#!/bin/sh
echo "Setting up cron to run backup.sh"
(crontab -l 2>/dev/null; echo "$BACKUP_CRON_SETUP sh /usr/src/app/backup.sh") | crontab -
/usr/sbin/crond -f -l 0