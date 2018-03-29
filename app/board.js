var database = require("../app/database.js");
var Tile = require("../app/tiles.js");

var cols = 15, mid = 7;

function getTileData(i, j, gameID, callback) {
    database.get("tiles", {game: gameID, x: i, y: j}, function(err, results) {
        if (err) { callback({empty: true, name: "NEUTRAL"}); return; }
        if (results.length == 0) { callback({empty: true, type: "NEUTRAL"}); return; }
        callback({empty: false, name: results[0].name});
    });
}

function moveShip(i, j, new_i, new_j, gameID, callback) {
    database.update("tiles", {game: gameID, x: i, y: j}, {x: new_i, y: new_j}, function(err, result) {
        callback(err);
    });
}

function killShip(i, j, gameID, callback) {
    database.remove("tiles", {game: gameID, x: i, y: j}, function(err, result) {
        callback(err);
    });
}

module.exports.getTileData = getTileData;
module.exports.cols = cols;
module.exports.mid = mid;
module.exports.moveShip = moveShip;
module.exports.killShip = killShip;