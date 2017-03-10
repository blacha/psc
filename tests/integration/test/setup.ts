import Schema from './schema';

declare var require;
declare var console;

var bcrypt = require('bcrypt');
var mockMongo = require('mongo-mock');
mockMongo.max_delay = 0;
var mockMongoClient = mockMongo.MongoClient;
var mongodb = require('mongodb');
mongodb.MongoClient = mockMongoClient;

export const PORT = Math.floor((Math.random() * 10000)) + 1500;

export const Config = {
    NAME: 'PSC',
    MASTER_KEY: 'PSC_MASTER',
    MONGO_HOST: 'FAKE_HOST',
    PORT,
    URL: 'http://localhost:' + PORT + '/1',
    USER: {
        NAME: 'user',
        PASS: 'pass'
    }
}

var mongoConnection = null;

function createSchemaTable() {

    return mockMongoClient.connect(Config.MONGO_HOST)
        .then((db) => mongoConnection = db)
        // Clear out the old backing store
        // TODO improve this logic
        .then((db) => {
            var backingStore = db.toJSON();
            backingStore.collections = backingStore.collections.filter(c => c.name.indexOf('system') === 0);
            return db;
        })
        .then(() => {
            var schema = mongoConnection.collection('_SCHEMA');
            var tableNames = Schema.map(s => s._id);
            console.log(tableNames)
            tableNames.forEach((table) => {
                var collection = mongoConnection.collection(table);

                // ensureIndex doesnt work so just do nothing.
                collection.ensureIndex = () => Promise.resolve();

                collection.findAndModify = (where, x, update, args) => {
                    return collection.findOne(where).then((o) => {
                        if (update.$set == null) {
                            console.error('BAD UPDATE', update.$set);
                            return Promise.reject('BAD UPDATE?');
                        }
                        Object.keys(update.$set).map(key => o[key] = update.$set[key]);
                        return { value: o };
                    });
                };

            });

            return Promise.all(Schema.map(row => {
                console.log('insert-row', row._id)
                schema.insert(row)
            }));
        })
        .then(() => mongoConnection);
}


function createTestUser() {
    var collection = mongoConnection.collection('_User');
    var hashedPassword = bcrypt.hashSync(Config.USER.PASS, 10);
    var userId = 'HcL6DRCUnL';
    var FakeUser = {
        _id: userId,
        username: Config.USER.NAME,
        _hashed_password: hashedPassword,
        _rperm: [userId],
        _wperm: [userId]
    };

    return Promise.resolve()
        .then(_ => collection.insertOne(FakeUser))
        .then(_ => collection.find({ username: Config.USER.NAME }).toArray())
        .then(user => console.log(user));
}


function startServer() {
    var express = require('express');
    var ParseServer = require('parse-server').ParseServer;
    var api = new ParseServer({
        databaseURI: Config.MONGO_HOST,
        appId: Config.NAME,
        masterKey: Config.MASTER_KEY,
        cloud: null,
        filesAdapter: null,
        serverURL: Config.URL
    });


    var app = express();
    app.use('/1', api);
    return new Promise((resolve, reject) => app.listen(Config.PORT, server => resolve(app)))
        .then(_ => console.log('ParseServer started!'))
}

console.time('ServerStart');
export const Server = Promise.resolve()
    .then(_ => createSchemaTable())
    .then(_ => startServer())
    .then(_ => createTestUser())
    .catch(e => console.log('Error', e));

