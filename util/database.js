const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (cb) => {
    MongoClient.connect('mongodb://localhost:27017/nodejs-course-project')
        .then((client) => {
            console.log('CONNECTED!');
            _db = client.db();
            cb();
        })
        .catch((err) => {
            console.log(err);
            throw err;
        });
};

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No Database Found!';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
