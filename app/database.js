var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost";
var database;
var Tile = require('../app/tiles.js');
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
    var game = {url: random_url, red_url: "", blue_url: ""};
    var tile_entries = [
        {name: "RED_FLAGSHIP", x: 7, y: 0, game: random_url},
        {name: "RED_DESTROYER", x: 6, y: 0, game: random_url},
        {name: "RED_DESTROYER", x: 8, y: 0, game: random_url},
        {name: "RED_GUNSHIP", x: 5, y: 0, game: random_url},
        {name: "RED_BATTLESHIP", x: 7, y: 1, game: random_url},
        {name: "RED_GUNSHIP", x: 9, y: 0, game: random_url},
        {name: "RED_MARAUDER", x: 4, y: 0, game: random_url},
        {name: "RED_BOMBER", x: 6, y: 1, game: random_url},
        {name: "RED_BOMBER", x: 8, y: 1, game: random_url},
        {name: "RED_MARAUDER", x: 10, y: 0, game: random_url},
        {name: "RED_ESCORT", x: 5, y: 1, game: random_url},
        {name: "RED_CARRIER", x: 7, y: 2, game: random_url},
        {name: "RED_ESCORT", x: 9, y: 1, game: random_url},
        {name: "RED_ESCORT", x: 6, y: 2, game: random_url},
        {name: "RED_ESCORT", x: 8, y: 2, game: random_url},
        {name: "RED_CRUISER", x: 7, y: 3, game: random_url},
        
        {name: "BLUE_FLAGSHIP", x: 7, y: 14, game: random_url},
        {name: "BLUE_DESTROYER", x: 6, y: 13, game: random_url},
        {name: "BLUE_DESTROYER", x: 8, y: 13, game: random_url},
        {name: "BLUE_GUNSHIP", x: 5, y: 12, game: random_url},
        {name: "BLUE_BATTLESHIP", x: 7, y: 13, game: random_url},
        {name: "BLUE_GUNSHIP", x: 9, y: 12, game: random_url},
        {name: "BLUE_MARAUDER", x: 4, y: 11, game: random_url},
        {name: "BLUE_BOMBER", x: 6, y: 12, game: random_url},
        {name: "BLUE_BOMBER", x: 8, y: 12, game: random_url},
        {name: "BLUE_MARAUDER", x: 10, y: 11, game: random_url},
        {name: "BLUE_ESCORT", x: 5, y: 11, game: random_url},
        {name: "BLUE_CARRIER", x: 7, y: 12, game: random_url},
        {name: "BLUE_ESCORT", x: 9, y: 11, game: random_url},
        {name: "BLUE_ESCORT", x: 6, y: 11, game: random_url},
        {name: "BLUE_ESCORT", x: 8, y: 11, game: random_url},
        {name: "BLUE_CRUISER", x: 7, y: 11, game: random_url}
    ];
    
    insert("games", [game], function(err, result){
        if (err) { console.log("Failed to create game "+random_url+"!"); return; }
        insert("tiles", tile_entries, function(err, result) {
            callback(err, result, random_url); //callback with the random URL
        });
    });

}

/**
 * Assigns a team to the specified game. Assigns red first, then blue.
 * Then it passes some information about the team in the callback function.
 * @param {String} gameURL The game ID.
 * @param {Function} callback Called if successful. 
 * Parameters are err (Error) and teamName (String).
 */
function assignTeam(gameURL, callback) {
    get("games", {url: gameURL}, function(err, result)  {
        var randomTeamURL = Math.random().toString(36).substring(8);
        var red = result[0].red_url.length != "";
        var blue = result[0].blue_url.length != "";
        console.log("Assigning team to game "+gameURL+": "+red+", "+blue);
        update("games", {url: gameURL}, 
            (!red ? {red_url: randomTeamURL} 
                : (!blue ? {blue_url: randomTeamURL} : {})));
        callback(err, (red && blue ? "spectate" : randomTeamURL));
    });
}

function update(collectionName, query, new_values, callback) {
    if (Object.keys(new_values).length == 0) { 
        console.log("No new values specified! Will not update "+collectionName+"."); 
        return; 
    }
    var collection = database.collection(collectionName);
    collection.update(query, {$set: new_values}, function(err, result) {
        if (err) { console.log("There was an error updating collection "+collectionName+"! "
                        +err.message); return; }
        console.log("Updated first document matching "+query+" with values "+new_values+"!");
        if (callback) callback(err, result);
    });
}

function insert(collectionName, entries, callback) {
    var collection = database.collection(collectionName);
    collection.insertMany(entries, function(err, result) {
        if (err) return;
        console.log("Inserted "+entries.length+" documents into collection '"+collectionName+"'");
        callback(err, result);
    });
};

function get(collectionName, query, callback) {
    // Get the collection
    var collection = database.collection(collectionName);
    // Find some entries that match
    collection.find(query).toArray(function(err, docs) {
        if (err) return;
        console.log("Found the following records:");
        console.log(docs);
        callback(err, docs); //perform the defined action on the results (the docs)
    });
};

module.exports.connect = connect;
module.exports.createGame = createGame;
module.exports.insert = insert;
module.exports.get = get;
module.exports.assignTeam = assignTeam;