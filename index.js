const path = require('path')
//load express
const express = require('express')
const app = express()
const exphbs = require('express-handlebars')
//load database
const database = require('./app/database.js');
//define server instance with 'http' module, passing in the express instance
const server = require('http').createServer(app);
//load and init socket.js using the socketIO instance, which is created using the above http server instance
const socket = require("./app/socket.js");
socket.init(require('socket.io')(server));

/*Set the Handlebars options*/
app.engine('.hbs', exphbs({
	  defaultLayout: 'main',
	  extname: '.hbs',
	  layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

/*Set locations for getting static content*/
app.use('/images',express.static(path.join(__dirname, 'views/assets/images')));
app.use('/scripts',express.static(path.join(__dirname, 'views/assets/scripts')));
app.use('/css',express.static(path.join(__dirname, 'views/assets/stylesheets')));
app.use('images',express.static(path.join(__dirname, 'views/assets/images')));
app.use('scripts',express.static(path.join(__dirname, 'views/assets/scripts')));
app.use('css',express.static(path.join(__dirname, 'views/assets/stylesheets')));

/*HTTP REQUEST HANDLERS*/

app.get('/new', (request, response) => {
	var r = Math.random().toString(36).substring(8);
	database.createGame(r, function(err, result) { //render only when operation completes
		if (err) { console.log("An error occured creating game "+r+"."); return; }
		//create the socket namespace for the game (checks if already exists)
		socket.createNamespace(r);
		response.render("redirect", {
			url: "/game/"+r
		});
	});
});

app.get('/game/:gameID', (request, response) => {
	//create the socket namespace for the game (checks if already exists)
	var gameID = request.params.gameID;
	database.get("games", {url: gameID}, function(err, docs) {
		if (err || docs.length == 0) { 
			console.log("A game with ID "+gameID+" was not found!");
			response.render("404", {});
			return; 
		} else {
			socket.createNamespace(gameID);
			response.render("game", {
				layout: "createjs",
				gameID: gameID
			});
		}
	});
});

//catchall and 404
app.get('*', (request, response) => {
	response.render("404", {});
});

/*LAUNCH THE HTTP SERVER ON PORT 80*/
const port = 80;
server.listen(port, function(err) {
	if (err) console.log("An error occurred.");
	console.log("Server started on port "+port);
	database.connect();
});