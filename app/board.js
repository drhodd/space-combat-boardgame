var database = require("../app/database.js");
var Tile = require("../app/tiles.js");

function isTileEmpty(i, j, gameID, callback) {
    database.get("tiles", {game: gameID, x: i, y: j}, function(err, results) {
        if (err) console.log(err.message);
        if (!err && results.length > 0) {
            var b = !results[0].name.contains("BLUE_") && !results[0].name.contains("RED_");
            console.log("Tile is empty: "+b);
            callback(b);
            return;
        }
    });
}

module.exports.isTileEmpty = isTileEmpty;