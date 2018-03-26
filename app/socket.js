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

    var ns = "/"+gameID;
    if (namespaces.includes(ns)) return;
    var gamespace = io.of(ns);
    var usernames = new Map(); //map socket connections to usernames
    
    gamespace.on('connection', function(socket) {
        
        console.log(socket.id+" has connected to "+ns);
        usernames.set(socket.id, "Guest"+Math.floor(Math.random()*100000));
        gamespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has connected.", color: "gray"});
        
        socket.on('disconnect', function(){
            gamespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has disconnected.", color: "gray"});
            usernames.delete(socket.id);
        });

        socket.on('chat', function(message, teamID) {
            console.log(socket.id+" @ "+ns+": "+message.contents);
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
                console.log("Chat message from "+usernames.get(socket.id)+": "+message);
                gamespace.emit("chat", {sender: usernames.get(socket.id), contents: message, color: "black"});
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
        
    });
    namespaces.push(ns);
}

module.exports.init = init;
module.exports.createNamespace = createNamespace;