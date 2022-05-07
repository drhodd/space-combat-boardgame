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
app.use('/assets',express.static(path.join(__dirname, 'views/assets')));
app.use('/images',express.static(path.join(__dirname, 'views/assets/images')));
app.use('/css',express.static(path.join(__dirname, 'views/assets/stylesheets')));
app.use('/scripts',express.static(path.join(__dirname, 'views/assets/scripts')));
app.use('/audio',express.static(path.join(__dirname, 'views/assets/audio')));
app.use('/common',express.static(path.join(__dirname, 'app/common')));

/*HTTP REQUEST HANDLERS*/

app.get("/", (request, response) => {
    response.render("home", {
        layout: "none"
    });
});

app.get("/ships", (request, response) => {
    response.render("ships", {
        layout: "none"
    });
});

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
    database.get("games", {url: gameID}, function(err, docs) {
        if (err || docs.length == 0) { 
            console.log("A game with ID "+gameID+" was not found!");
            response.render("404", {});
            return; 
        } else {
            socket.createNamespace(gameID); //create the socket namespace for the game
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