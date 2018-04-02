var board = require('../app/board.js');
var io; var namespaces = [];
var database = require('../app/database.js');
var Tile = require("../app/tiles.js");
var Common = require("../app/common/common.js");

function init(socketIO) {
    io = socketIO;
    io.on('connection', function(socket) {
        console.log(socket.id+" has connected!");
        socket.emit("connection", ""); //tell client of a successful connection (send the socket ID too)
    });
}

/**
 * Create and define event handlers for the socket namespace for the given gameID.
 * @param {String} gameID 
 */
function createNamespace(gameID) {
    //these are for convenience; the socket server needs to know (for example)
    //the usernames of each socket id, and the team they are associated with
    var ns = "/"+gameID;
    if (namespaces.includes(ns)) { console.log("Socket channel for game "+gameID+" already exists!"); return; }
    console.log("Creating socket channel for game "+gameID);
    var gamespace = io.of(ns);
    var usernames = new Map(); //map socket connections to usernames
    var userteams = new Map(); //map socket IDs to teams
    var teamcolors = new Map(); //map team IDs to colors
    teamcolors.set("red", "red");
    teamcolors.set("blue", "cyan");
    teamcolors.set("none", "black");
    
    gamespace.on('connection', function(socket) {
        
        usernames.set(socket.id, "Guest"+Math.floor(Math.random()*100000));
        userteams.set(socket.id, "none");
        gamespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has connected.", color: "gray"});
        //send turn data
        applyMovesUsed(0);
        console.log(usernames.get(socket.id)+" has connected to "+gameID+" [ID: "+socket.id+"]");
        
        function applyMovesUsed(dist) {
            //send new movesleft data to player
            board.applyMovesUsed(dist, gameID, function(movesLeft, currentTeam) {
                console.log("Current move: "+currentTeam+", moves left: "+movesLeft);
                var teamID = userteams.get(socket.id);
                gamespace.emit("moves left", movesLeft, currentTeam);
                gamespace.emit("turn update", currentTeam);
            });
        }

        socket.on('disconnect', function(){
            gamespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has disconnected.", color: "gray"});
            console.log(usernames.get(socket.id)+" has disconnected from game "+gameID);
            usernames.delete(socket.id);
            userteams.delete(socket.id);
        });

        socket.on('chat', function(message) {
            console.log(usernames.get(socket.id)
                +" (game: "+gameID+", team: "
                    +userteams.get(socket.id)+", color: "
                        +teamcolors.get(userteams.get(socket.id))+"): "+message);
            if (!message instanceof String) { console.log(message+" is not a valid message!"); return; }
            if (message.indexOf("/") == 0) {
                //is command, split into name and params
                var cmd = message.split(" ");
                if (cmd[0] == '/nick') {
                    if (cmd.length < 2) return;
                    gamespace.emit("chat", {sender: "Server", 
                        contents: usernames.get(socket.id)+" has set their nickname to "+cmd[1]+".", color: "gray"});
                    usernames.set(socket.id, cmd[1]);
                } else if (cmd[0] == "/join") {
                    if (cmd.length < 2) return;
                    var teamID = cmd[1]; //"red" or "blue"
                    userteams.set(socket.id, teamID);
                    console.log(usernames.get(socket.id)+" wants to change teams to "+teamID+" (color: "+teamcolors.get(teamID)+")");
                    var m = usernames.get(socket.id)+
                            (teamID == "red" ? " has been assigned to the red team!" 
                                : (teamID == "blue" ? " has been assigned to the blue team!" 
                                    : " is spectating!"));
                    console.log(m); 
                    gamespace.emit("chat", {sender: "Server", contents: m, color: "gray"});
                    socket.emit("team change", teamID);
                    applyMovesUsed(0);
                } else if (cmd[0] == "/info") {
                    if (cmd.length < 3) return;
                    var x = Number(cmd[1]), y = Number(cmd[2]);
                    board.isTileEmpty(x, y, gameID, function(result) {
                        socket.emit("chat", {contents: "Tile empty: "+result, sender: "Server", color: "gray"});
                    });
                } else if (cmd[0] == "/end") {
                    database.get("games", {url: gameID}, function(err, docs) {
                        if (err) return;
                        if (docs.length == 0) return;
                        if (userteams.get(socket.id) != docs[0].turn) {
                            socket.emit("chat", {sender: "Server", contents: "It is not your turn!", color: "gray"});
                        } else {
                            applyMovesUsed(32); //hacky: simulate a 32 hex move and end the turn
                        }
                    });
                }
            } else {
                //send as chat
                console.log("Chat message from "+usernames.get(socket.id)+"("+userteams.get(socket.id)+", "+teamcolors.get(userteams.get(socket.id))+"): "+message);
                gamespace.emit("chat", {sender: usernames.get(socket.id), contents: message, 
                    color: teamcolors.get(userteams.get(socket.id))});
            }
        });

        socket.on("move request", function(move, isRam) {
            console.log("Received move request from "+usernames.get(socket.id)+" (ram: "+isRam+")");
            var dist = Common.distance(move.pos1.i, move.pos1.j, move.pos2.i, move.pos2.j);
            board.getTileData(move.pos1.i, move.pos1.j, gameID, function(data) {
                if (data == undefined) { console.log("Move failed! Source is undefined."); return; }
                console.log("Source tile: "+data.name);
                if (isRam) {
                    //validate ram
                    board.getTileData(move.pos2.i, move.pos2.j, gameID, function(data2) {
                        if (Tile[data.name] == undefined) return;
                        var range = Tile[data.name].m; 
                        var damage = Tile[data.name].s * 2, shield2 = Tile[data2.name].s;
                        if (dist <= range) {
                            console.log("Ramming is in range!");
                            //remove ships from database
                            board.killShip(move.pos1.i, move.pos1.j, gameID, function(err, results) {
                                if (err) return;
                                var successfulKill = shield2 <= damage;
                                console.log("Checking for kill... (src: "+damage+", target: "+shield2+")");
                                gamespace.emit("tile update", move.pos1.i, move.pos1.j, "NONE", "kill");
                                if (successfulKill) {
                                    console.log("Successful kill! (src: "+damage+", target: "+shield2+")");
                                    board.killShip(move.pos2.i, move.pos2.j, gameID, function(err, results) {
                                        if (err) return;
                                        gamespace.emit("tile update", move.pos2.i, move.pos2.j, "NONE", "kill");
                                        applyMovesUsed(dist);
                                    });
                                } else {
                                    applyMovesUsed(dist);
                                }
                            });
                        }
                    });
                } else {
                    board.moveShip(move.pos1.i, move.pos1.j, move.pos2.i, move.pos2.j, gameID, function(err) {
                        if (err) { console.log("Error moving tile: "+err); return; }
                        console.log("Moving tile!");
                        gamespace.emit("tile update", move.pos1.i, move.pos1.j, "NONE", "normal");
                        gamespace.emit("tile update", move.pos2.i, move.pos2.j, data.name, "move");
                        board.killVulnerableShips(gameID, function(i, j, name) {
                            gamespace.emit("tile update", i, j, "NONE", "kill");
                        }, function() {
                            applyMovesUsed(dist);
                        });
                    });
                }
            });
        });
        
        socket.on("board request", function(gameID) {
            console.log(socket.id+" @ "+ns+" requested the board contents for "+gameID+".");
            database.get("tiles", {game: gameID}, function(err, docs) {
                if (err) return;
                console.log("Sending board data to "+usernames.get(socket.id)+" [ID: "+socket.id+"]");
                socket.emit("board", docs);
            });
        });
        
    });
    namespaces.push(ns);
}

module.exports.init = init;
module.exports.createNamespace = createNamespace;