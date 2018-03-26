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
app.use('/css',express.static(path.join(__dirname, 'views/assets/stylesheets')));
app.use('/scripts',express.static(path.join(__dirname, 'views/assets/scripts')));
app.use('/audio',express.static(path.join(__dirname, 'views/assets/audio')));

/*HTTP REQUEST HANDLERS*/

app.get('/new', (request, response) => {
    database.createGame(function(err, result, url) { //render only when operation completes
        if (err) { 
            console.log("An error occured creating game "+r+"."); 
            response.render("404", {});
            return; 
        }
        response.render("redirect", {
            url: "/game/"+url
        });
    });
});

app.get('/game/:gameID', (request, response) => {
    var gameID = request.params.gameID;
    database.assignTeam(gameID, function(err, teamID) {
        response.render("redirect", {
            url: "/game/"+gameID+"/"+teamID
        });
    });
});

app.get('/game/:gameID/:teamID', (request, response) => {
    var gameID = request.params.gameID;
    var teamID = request.params.teamID;
    socket.createNamespace(gameID); //create the socket namespace for the game
    database.get("games", {url: gameID}, function(err, docs) {
        if (err || docs.length == 0) { 
            console.log("A game with ID "+gameID+" was not found!");
            response.render("404", {});
            return; 
        } else {
            database.get
            response.render("game", {
                layout: "createjs",
                gameID: gameID,
                teamID: teamID
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