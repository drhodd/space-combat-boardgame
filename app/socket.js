var board = require('../app/board.js');
var io; var namespaces = [];
var database = require('../app/database.js');

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
        console.log(usernames.get(socket.id)+" has connected to "+gameID+" [ID: "+socket.id+"]");
        
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
                    gamespace.emit("chat", {sender: "Server", 
                        contents: usernames.get(socket.id)+" has set their nickname to "+cmd[1]+".", color: "gray"});
                    usernames.set(socket.id, cmd[1]);
                } else if (cmd[0] == "/join") {
                    var teamID = cmd[1]; //"red" or "blue"
                    userteams.set(socket.id, teamID);
                    console.log(usernames.get(socket.id)+" wants to change teams to "+teamID+" (color: "+teamcolors.get(teamID)+")");
                    var m = usernames.get(socket.id)+
                            (teamID == "red" ? " has been assigned to the red team!" 
                                : (teamID == "blue" ? " has been assigned to the blue team!" 
                                    : " is spectating!"));
                    console.log(m); 
                    gamespace.emit("chat", {sender: "Server", contents: m, color: "gray"});
                    gamespace.emit("team change", teamID);
                } else if (cmd[0] == "/info") {
                    var x = Number(cmd[1]), y = Number(cmd[2]);
                    board.isTileEmpty(x, y, gameID, function(result) {
                        socket.emit("chat", {contents: "Tile empty: "+result, sender: "Server", color: "gray"});
                    });
                }
            } else {
                //send as chat
                console.log("Chat message from "+usernames.get(socket.id)+"("+userteams.get(socket.id)+", "+teamcolors.get(userteams.get(socket.id))+"): "+message);
                gamespace.emit("chat", {sender: usernames.get(socket.id), contents: message, 
                    color: teamcolors.get(userteams.get(socket.id))});
            }
        });

        socket.on("move request", function(move) {
            console.log("Received move request from "+usernames.get(socket.id));
            board.getTileData(move.pos1.i, move.pos1.j, gameID, function(data){
                console.log("Source tile: "+data.name);
                board.moveTile(move.pos1.i, move.pos1.j, move.pos2.i, move.pos2.j, gameID, function(err) {
                    if (err) { console.log("Error moving tile: "+err); return; }
                    console.log("Moving tile!");
                    gamespace.emit("tile update", move.pos1.i, move.pos1.j, "NONE");
                    gamespace.emit("tile update", move.pos2.i, move.pos2.j, data.name);
                });
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