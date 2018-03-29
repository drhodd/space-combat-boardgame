var database = require("../app/database.js");
var Tile = require("../app/tiles.js");
var Common = require("../app/common/common.js");

var cols = 15, mid = 7;

function getTileData(i, j, gameID, callback) {
    database.get("tiles", {game: gameID, x: i, y: j}, function(err, results) {
        if (err) { callback({empty: true, name: "NEUTRAL"}); return; }
        if (results.length == 0) { callback({empty: true, type: "NEUTRAL"}); return; }
        callback({empty: false, name: results[0].name});
    });
}

function applyMovesUsed(movesUsed, gameID, callback) {
    database.get("games", {url: gameID}, function(err, docs) {
        if (err) return;
        if (docs.length == 0) return;
        var game = docs[0];
        var movesleft = game.movesLeft - movesUsed;
        var newteam = game.turn;
        if (movesleft <= 0) {
            newteam = newteam == "red" ? "blue" : "red";
            movesleft = 
        }
        callback(movesleft, newteam);
        database.update("games", {url: gameID}, 
            {movesLeft: movesleft, turn: newteam}, function(err, result) {
                if (err) return;
        });
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

function killVulnerableShips(gameID, perShipCallback) {
    database.get("tiles", {game: gameID}, function(err, results) {
        if (err) { return; }
        if (results.length == 0) { return; }
        for (var s = 0; s < results.length; s++) {
            var tile = Tile[results[s].name];
            var dmg = damageAt(results[s].x, results[s].y, results);
            console.log("Damage at "+results[s].x+", "+results[s].y+": "+dmg.red+", "+dmg.blue);
            var dmg_val = tile.team == "red" ? dmg.blue : dmg.red;
            var kill = tile.s <= dmg_val;
            console.log("Kill ship "+results[s].name+": "+kill+" ("+tile.s+", "+dmg_val+")");
            if (kill) {
                perShipCallback(results[s].x, results[s].y, results[s].name);
                killShip(results[s].x, results[s].y, gameID);
                //TODO: FINISH SERVER TRACKING SHIP COUNTS, FINISH TURN PROGRESSION
            } 
        }
    });
}

function damageAt(i, j, tileDocs) {
    var dmg = {red: 0, blue: 0};
    for (var s = 0; s < tileDocs.length; s++) {
        var ship = tileDocs[s];
        if (ship.x == i && ship.y == j) continue;
        var dist = Common.distance(i, j, ship.x, ship.y);
        if (dist > 4) continue;
        if (Tile[ship.name].team == "red") dmg.red += dist <= 2 ? Tile[ship.name].ds : Tile[ship.name].dl;
        if (Tile[ship.name].team == "blue") dmg.blue += dist <= 2 ? Tile[ship.name].ds : Tile[ship.name].dl;
    }
    return dmg;
}

module.exports.getTileData = getTileData;
module.exports.cols = cols;
module.exports.mid = mid;
module.exports.moveShip = moveShip;
module.exports.killShip = killShip;
module.exports.killVulnerableShips = killVulnerableShips;
module.exports.damageAt = damageAt;
module.exports.applyMovesUsed = applyMovesUsed;