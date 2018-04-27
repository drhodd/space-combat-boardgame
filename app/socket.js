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
function Namespace(gameID) {
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
        
    });
    namespaces.push(ns);
}

module.exports.init = init;
module.exports.Namespace = Namespace;