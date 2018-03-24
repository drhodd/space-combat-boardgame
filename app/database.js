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
	insert("games", [{url: "testGame"}], function(){});
}

function createGame(url, callback) {
	
	var game = {url: url};
	var tile_entries = [
		{name: "RED_FLAGSHIP", x: 7, y: 0, game: url},
		{name: "RED_DESTROYER", x: 6, y: 0, game: url},
		{name: "RED_DESTROYER", x: 8, y: 0, game: url},
		{name: "RED_GUNSHIP", x: 5, y: 0, game: url},
		{name: "RED_BATTLESHIP", x: 7, y: 1, game: url},
		{name: "RED_GUNSHIP", x: 9, y: 0, game: url},
		{name: "RED_MARAUDER", x: 4, y: 0, game: url},
		{name: "RED_BOMBER", x: 6, y: 1, game: url},
		{name: "RED_BOMBER", x: 8, y: 1, game: url},
		{name: "RED_MARAUDER", x: 10, y: 0, game: url},
		{name: "RED_ESCORT", x: 5, y: 1, game: url},
		{name: "RED_CARRIER", x: 7, y: 2, game: url},
		{name: "RED_ESCORT", x: 9, y: 1, game: url},
		{name: "RED_ESCORT", x: 6, y: 2, game: url},
		{name: "RED_ESCORT", x: 8, y: 2, game: url},
		{name: "RED_CRUISER", x: 7, y: 3, game: url},
		
		{name: "BLUE_FLAGSHIP", x: 7, y: 14, game: url},
		{name: "BLUE_DESTROYER", x: 6, y: 13, game: url},
		{name: "BLUE_DESTROYER", x: 8, y: 13, game: url},
		{name: "BLUE_GUNSHIP", x: 5, y: 12, game: url},
		{name: "BLUE_BATTLESHIP", x: 7, y: 13, game: url},
		{name: "BLUE_GUNSHIP", x: 9, y: 12, game: url},
		{name: "BLUE_MARAUDER", x: 4, y: 11, game: url},
		{name: "BLUE_BOMBER", x: 6, y: 12, game: url},
		{name: "BLUE_BOMBER", x: 8, y: 12, game: url},
		{name: "BLUE_MARAUDER", x: 10, y: 11, game: url},
		{name: "BLUE_ESCORT", x: 5, y: 11, game: url},
		{name: "BLUE_CARRIER", x: 7, y: 12, game: url},
		{name: "BLUE_ESCORT", x: 9, y: 11, game: url},
		{name: "BLUE_ESCORT", x: 6, y: 11, game: url},
		{name: "BLUE_ESCORT", x: 8, y: 11, game: url},
		{name: "BLUE_CRUISER", x: 7, y: 11, game: url}
	];
	
	insert("games", [game], function(err, result){});
	insert("tiles", tile_entries, function(err, result) {
		callback(err, result);
	});

}

function insert(collectionName, entries, callback) {
	var collection = database.collection(collectionName);
	collection.insertMany(entries, function(err, result) {
		if (err) return;
		console.log("Inserted "+entries+" into the "+collectionName+" collection");
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