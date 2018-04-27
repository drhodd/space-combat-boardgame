var board_ = require('../app/common/board.js');
var io; var namespaces = [];
var database = require('../app/database.js');
var Tile = require("../app/common/tiles.js");

function init(socketIO) {
    io = socketIO;
    io.on('connection', function(socket) {
        console.log(socket.id+" has connected!");
        socket.emit("connection", ""); //tell client of a successful connection
    });
}

/**
 * A Namespace is a holder for the game board and other relevant socket handlers/information.
 * One namespace per game. Will not add a new namespace if a namespace for the gameID already
 * exists.
 * @param {String} gameID The game ID, i.e. the ID used in the URL.
 */
function namespace(gameID) {

    //check if the namespace already exists, if not then continue
    var ns = "/"+gameID;
    if (namespaces.includes(ns)) { console.log("Socket channel for game "+gameID+" already exists!"); return; }
    console.log("Creating socket channel for game "+gameID);
    
    //create the socket namespace as well as places to map socket connections to usernames and teams
    var namespace = io.of(ns);
    var usernames = new Map(); //map socket connections to usernames
    var userteams = new Map(); //map socket IDs to teams

    //initialize the game board with the default set of tiles
    var board = new board_.Board();

    //if a saved state already exists for this game, fill the board with it
    // ...unfinished.
    
    /* ADD SOCKET EVENT HANDLERS */

    namespace.on('connection', function(socket) {
        
        usernames.set(socket.id, "Guest"+Math.floor(Math.random()*100000));
        userteams.set(socket.id, "none");
        namespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has connected.", color: "gray"});

        console.log(usernames.get(socket.id)+" has connected to "+gameID+" [ID: "+socket.id+"]");

        socket.on('disconnect', function(){
            namespace.emit("chat", 
                {sender: "Server", contents: usernames.get(socket.id)+" has disconnected.", color: "gray"});
            console.log(usernames.get(socket.id)+" has disconnected from game "+gameID);
            usernames.delete(socket.id);
            userteams.delete(socket.id);
        });
        
    });

    //add the namespace to the master list of namespaces
    namespaces.push(ns);
}

module.exports.init = init;
module.exports.namespace = namespace;