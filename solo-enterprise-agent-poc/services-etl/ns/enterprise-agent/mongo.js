const mongo = require('mongodb').MongoClient


module.exports = {

    insertToDb: function insertToDb(data, collectionName, connectionString, dbName) {
        mongo.connect(connectionString, {
            useNewUrlParser: true
        }, (err, client) => {
            if (err) {
                if (err !== null) {
                    console.error(err);
                }
                return
            } else {
                const db = client.db(dbName)
                collection = db.collection(collectionName);

                if (collectionName === 'entries') {
                    for (var i = 0; i < data.length; i++) {
                        var entry = data[i].dateString;
                        data[i].dateString = new Date(entry);
                    }
                } else if (collectionName === 'treatments') {
                    for (var i = 0; i < data.length; i++) {
                        var treatment = data[i].created_at;
                        data[i].created_at = new Date(treatment);
                    }
                } else {

                }

                collection.insertMany(data, (err, result) => {
                    if (err !== null) {
                        //console.log(err);
                    }
                })

                //client.close();
            }
        });
    },

    queryEntriesDb: function queryEntriesDb(connectionString, dbName) {
        mongo.connect(connectionString, {
            useNewUrlParser: true
        }, (err, client) => {
            if (err) {
                if (err !== null) {
                    console.error(err);
                }
                return
            } else {
                const db = client.db(dbName)
                collection = db.collection('entries');
                result = collection.find().toArray();


                //client.close();

                result.then(function (value) {
                    return value;
                });
            }
        });

    },



    getAllEntries: function getAllEntries(connectionString, dbName, callback) {
        mongo.connect(connectionString, {
            useNewUrlParser: true
        }, function (err, client) {
            if (err) {
                return console.dir(err);
            }
            const db = client.db(dbName)
            var collection = db.collection('entries');
            collection.find().toArray(function (err, items) {
                return callback(items);
            });
        });
    },

    getfilterEntries: function getfilterEntries(connectionString, dbName, from, to, callback) {
        mongo.connect(connectionString, {
            useNewUrlParser: true
        }, function (err, client) {
            if (err) {
                return console.dir(err);
            }
            const db = client.db(dbName)
            var collection = db.collection('entries');

            let toDate = new Date(to);
            let fromDate = new Date(from);
            toDate.setUTCHours(23, 59, 59);

            collection.find({
                "dateString": {
                    '$gte': fromDate,
                    '$lte': toDate
                }
            }).toArray(function (err, items) {
                return callback(items);
            });
        });
    },

    getAllTreaments: function getAllTreatments(connectionString, dbName, callback) {
        mongo.connect(connectionString, {
            useNewUrlParser: true
        }, function (err, client) {
            if (err) {
                return console.dir(err);
            }
            const db = client.db(dbName)
            var collection = db.collection('treatments');
            collection.find().toArray(function (err, items) {
                return callback(items);
            });
        });
    },

    getfilterTreatments: function getfilterTreatments(connectionString, dbName, from, to, callback) {
        mongo.connect(connectionString, {
            useNewUrlParser: true
        }, function (err, client) {
            if (err) {
                return console.dir(err);
            }
            const db = client.db(dbName)
            var collection = db.collection('treatments');

            let toDate = new Date(to);
            let fromDate = new Date(from);
            toDate.setUTCHours(23, 59, 59);

            collection.find({
                "created_at": {
                    '$gte': fromDate,
                    '$lte': toDate
                }
            }).toArray(function (err, items) {
                return callback(items);
            });
        });
    }
};