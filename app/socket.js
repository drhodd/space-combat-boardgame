var io; var namespaces = [];
var database = require('../app/database.js');

function init(socketIO) {
	io = socketIO;
	io.on('connection', function(socket) {
		console.log(socket.id+" has connected!");
		socket.emit("connection", ""); //tell client of a successful connection (send the socket ID too)
		socket.on('disconnect', function(socket) {
			console.log(socket.id+" has disconnected!");
		});
	});
}

function createNamespace(gameID) {
	var ns = "/"+gameID;
	if (namespaces.includes(ns)) return;
	var gamespace = io.of(ns);
	
	gamespace.on('connection', function(socket) {
		
		console.log(socket.id+" has connected to "+ns);
		
		socket.on('chat', function(message) {
			console.log(socket.id+" @ "+ns+": "+message.contents);
			gamespace.emit("chat", message);
		});
		
		socket.on("board", function(gameID) {
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