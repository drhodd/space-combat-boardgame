mongod --fork --dbpath /var/lib/mongodb/ --smallfiles --logpath /var/log/mongodb.log
forever stopall
forever start index.js