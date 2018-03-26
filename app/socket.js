var io; var namespaces = [];
var database = require('../app/database.js');

function init(socketIO) {
    io = socketIO;
    io.on('connection', function(socket) {
        console.log(socket.id+" has connected!");
        socket.emit("connection", ""); //tell client of a successful connection (send the socket ID too)
    });
}

function createNamespace(gameID) {

    //these are for convenience; the socket server needs to know (for example)
    //the usernames of each socket id, and the team they are associated with
    var ns = "/"+gameID;
    if (namespaces.includes(ns)) return;
    var gamespace = io.of(ns);
    var usernames = new Map(); //map socket connections to usernames
    var red_url = "", blue_url = "";
    var userteams = new Map();
    var teamcolors = new Map();

    //retrieve the game document in the DB and find the team URLs
    database.get("games", {url: gameID}, function(err, docs) {
        if (err || docs.length == 0) {
            console.log("Could not retrieve team data while creating namespace for "+gameID+"!");
            return;
        }
        var doc = docs[0];
        red_url = doc.red_url;
        blue_url = doc.blue_url;
        teamcolors.set(doc.red_url, "red");
        teamcolors.set(doc.blue_url, "cyan");
        teamcolors.set("", "black");
        teamcolors.set("spectate", "black");
    });
    
    gamespace.on('connection', function(socket) {
        
        console.log(socket.id+" has connected to "+ns);
        usernames.set(socket.id, "Guest"+Math.floor(Math.random()*100000));
        userteams.set(socket.id, "spectate");
        gamespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has connected.", color: "gray"});
        
        socket.on('disconnect', function(){
            gamespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has disconnected.", color: "gray"});
            usernames.delete(socket.id);
            userteams.delete(socket.id);
        });

        socket.on('chat', function(message) {
            console.log(socket.id+" @ "+ns+": "+message);
            if (!message.indexOf) { console.log(message+" is not a valid message!"); return; }
            if (message.indexOf("/") == 0) {
                //is command, split into name and params
                var cmd = message.split(" ");
                if (cmd[0] == '/nick') {
                    gamespace.emit("chat", {sender: "Server", 
                        contents: usernames.get(socket.id)+" has set their nickname to "+cmd[1]+".", color: "gray"});
                    usernames.set(socket.id, cmd[1]);
                }
            } else {
                //send as chat
                console.log("Chat message from "+usernames.get(socket.id)+"("+userteams.get(socket.id)+", "+teamcolors.get(userteams.get(socket.id))+"): "+message);
                gamespace.emit("chat", {sender: usernames.get(socket.id), contents: message, 
                    color: teamcolors.get(userteams.get(socket.id))});
            }
        });
        
        socket.on("board request", function(gameID) {
            console.log(socket.id+" @ "+ns+" requested the board contents for "+gameID+".");
            database.get("tiles", {game: gameID}, function(err, docs) {
                if (err) return;
                console.log("Sending board data to "+socket.id+"!");
                socket.emit("board", docs);
            });
        });

        socket.on("join team", function(teamID) {
            userteams.set(socket.id, teamID);
            var m = usernames.get(socket.id)+
                    (teamID == red_url ? " has been assigned to the red team!" 
                        : (teamID == blue_url ? " has been assigned to the blue team!" 
                            : " is spectating!"));
            console.log(m); gamespace.emit("chat", {sender: "Server", contents: m, color: "gray"});
        });
        
    });
    namespaces.push(ns);
}

module.exports.init = init;
module.exports.createNamespace = createNamespace;