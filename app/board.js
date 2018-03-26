var database = require("../app/database.js");
var Tile = require("../app/tiles.js");

function isTileEmpty(i, j, gameID, callback) {
    database.get("tiles", {game: gameID, x: i, y: j}, function(err, results) {
        callback(results.length == 0);
    });
}

module.exports.isTileEmpty = isTileEmpty;