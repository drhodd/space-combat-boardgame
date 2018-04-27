var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost";
var database;

var tile_ = require('../app/common/tiles.js');
var Tile = tile_.Tile;
var DEFAULT_STATE = tile_.DEFAULT_STATE;

var socket = require('../app/socket.js');

function connect() {
    MongoClient.connect(url, function(err, db) {
        if (err) { console.log("Error connecting to database: "+err.message); return; }
        database = db.db("debris");
        createTables();
    });
}

function createTables() {
    database.createCollection("games", function(err, res) {});
    database.createCollection("tiles", function(err, res) {});
}

function createGame(callback) {
    var random_url = Math.random().toString(36).substring(8);
    var game = {url: random_url, turn: "red", movesLeft: 16};

    //default board state
    var tile_entries = []; for (var e = 0; e < DEFAULT_STATE.length; e++) {
        tile_entries = {x: DEFAULT_STATE[e].x};
        console.log(DEFAULT_STATE[e].x);
    }

    insert("games", [game], function(err, result){
        if (err) { console.log("Failed to create game "+random_url+"!"); return; }
        insert("tiles", tile_entries, function(err, result) {
            callback(err, result, random_url); //callback with the random URL
        });
    });

}

/**
 * Update a set of values matching the query with the specified new_values, in the form of an object.
 * Once finished, error or not, callback.
 * @param {String} collectionName The name of the NoSQL collection to update in.
 * @param {Object} query The query object to match against.
 * @param {Object} new_values The new values to apply to each document matching the query.
 * @param {function} callback The callback function: function(err, result)
 */
function update(collectionName, query, new_values, callback) {
    if (Object.keys(new_values).length == 0) { 
        console.log("No new values specified! Will not update "+collectionName+"."); 
        return; 
    }
    var collection = database.collection(collectionName);
    collection.update(query, {$set: new_values}, function(err, result) {
        console.log("Updating entries "+[result]+"!");
        if (err) { console.log("There was an error updating collection "+collectionName+"! "
                        +err.message); }
        if (callback) callback(err, result);
    });
}

function insert(collectionName, entries, callback) {
    var collection = database.collection(collectionName);
    collection.insertMany(entries, function(err, result) {
        if (err) { console.log(err.message); }
        callback(err, result);
    });
};

function get(collectionName, query, callback) {
    // Get the collection
    var collection = database.collection(collectionName);
    // Find some entries that match
    collection.find(query).toArray(function(err, docs) {
        if (err) { console.log(err.message); }
        callback(err, docs); //perform the defined action on the results (the docs)
    });
};

function remove(collectionName, query, callback) {
    var collection = database.collection(collectionName);
    collection.deleteMany(query, function(err, result) {
        if (err) { console.log(err.message); }
        callback(err, result);
    });
};

module.exports.connect = connect;
module.exports.createGame = createGame;
module.exports.insert = insert;
module.exports.get = get;
module.exports.update = update;
module.exports.remove = remove;