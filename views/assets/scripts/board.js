var Board = {
    
    cols: 15,
    mid: 7,

    boardTiles: [],
    shipTiles: [],
    overlayElements: [],
    selectOutline: new createjs.Bitmap("/images/tiles/outline_selected.png"),
    hoverOutline: new createjs.Bitmap("/images/tiles/outline_hover.png"),
    greenOutline: new createjs.Bitmap("/images/tiles/outline_green.png"),
    redOutline: new createjs.Bitmap("/images/tiles/outline_red.png"),
    selectedTile: null,
    previewTile: null,

    debug: false,

    teamName: "none",
    movesLeft: 0,
    turn: "none",
    turnID: "",

    create: function() {
        var cols = 15;
        var rows = 8;
        for (i = 0; i < cols; i++) {
            Board.shipTiles[i] = [];
            Board.boardTiles[i] = [];
            for (j = 0; j < rows; j++) {
                var neutral = Tile.create(i, j, Tile.NEUTRAL, 'board');
                var none = Tile.create(i, j, Tile.NONE, 'ship');
                Board.boardTiles[i].push(neutral);
                Board.shipTiles[i].push(none);
                stage.addChild(neutral);
            }
            rows += i >= ((cols-1)/2) ? -1 : 1;
        }
        createjs.Ticker.setFPS(60);
        createjs.Ticker.addEventListener("tick", stage);
        stage.update();
        this.refreshOverlays(false);
    },
    
    performLoadAnimation: function() {
        //fall animation on board creation
        for (i = 0; i < Board.shipTiles.length; i++) {
            for (j = 0; j < Board.shipTiles[i].length; j++) {
                var hex = Board.shipTiles[i][j];
                createjs.Tween.get(hex, { loop: false })
                    .to({ alpha: 0}, 0, createjs.Ease.getPowInOut(2))
                    .to({ alpha: 1}, 0, createjs.Ease.getPowInOut(2));
            }
        }
    },

    moveShip(i, j, i2, j2, preview) {
        console.log("Moving ship from "+i+", "+j+" to "+i2+", "+j2+(preview ? " [PREVIEW]" : ""));
        var ship = Board.shipTiles[i][j];
        if (preview) {
            Board.update(i, j, Tile.NONE, 'ship', "normal");
            Board.update(i2, j2, ship.type, 'ship', "normal");
            createjs.Tween.get(Board.shipTiles[i2][j2], { override: true, loop: true })
                .to({ alpha: .25 }, 500, createjs.Ease.getPowInOut(2))
                .to({ alpha: 1 }, 500, createjs.Ease.getPowInOut(3));
        } else {
            io.emit("move request", {
                pos1: {i: i, j: j}, 
                pos2: {i: i2, j: j2}
            }, false); //false meaning not a ram
        }
    },
    
    update: function(i, j, type, layer, updateType) {

        if (updateType == "kill") {
            //make sure the board recognizes that the ship has been deleted
            if (Board.selectedTile != null) if (Board.selectedTile.i == i
                && Board.selectedTile.j == j) Board.selectedTile = null;
            var deathAnim = Tile.create(i, j, Tile.DEATH, 'overlay');
            createjs.Tween.get(deathAnim, { loop: false })
                    .to({ alpha: 0}, 0, createjs.Ease.getPowInOut(2))
                    .to({ alpha: 1}, 500, createjs.Ease.getPowInOut(2))
                    .to({ alpha: 0}, 500, createjs.Ease.getPowInOut(2))
                    .call(function() {
                        stage.removeChild(deathAnim);
                    });
            stage.addChild(deathAnim);
        }

        console.log("Updating board: "+i+", "+j+", "+type+", "+layer);
        var grid = layer == 'ship' ? Board.shipTiles : Board.boardTiles;
        var old_hex = grid[i][j];
        grid[i][j] = Tile.create(i, j, type, layer);
        grid[i][j].x = old_hex.x;
        grid[i][j].y = old_hex.y;
        grid[i][j].i = old_hex.i;
        grid[i][j].j = old_hex.j;
        grid[i][j].lastTurn = old_hex.lastTurn;
        stage.removeChild(old_hex);
        stage.addChild(grid[i][j]);

        if (updateType == "move") {
            Board.shipTiles[i][j].lastTurn = Board.turnID;
            Board.selectedTile = null;
        }

        Board.refreshOverlays(layer == 'ship');

    },

    damageAt: function(i, j) {
        var r_dmg = 0, b_dmg = 0;
        var adj = Common.getAdjacent(i, j, false, 4);
        for (var c = 0; c < adj.length; c++) {
            if (adj[c] == null) continue;
            var dist = Common.distance(i, j, adj[c].i, adj[c].j);
            var type = Board.shipTiles[adj[c].i][adj[c].j].type;
            if (dist > 4) continue;
            if (type.team == "red") r_dmg += dist <= 2 ? type.ds : type.dl;
            if (type.team == "blue") b_dmg += dist <= 2 ? type.ds : type.dl;
        }
        return {red: r_dmg, blue: b_dmg, none: 0};
    },

    canMoveTo(i, j, i2, j2) {
        var ship = Board.shipTiles[i][j];
        var dmgAt = Board.damageAt(i2, j2);
        var dmg = ship.type.team == "red" ? dmgAt.blue : dmgAt.red;
        var dist = Common.distance(i, j, i2, j2);
        var range = ship.type.m;
        var shields = ship.type.s;
        var enoughMove = Board.movesLeft >= dist;
        var fatal = shields <= dmg;
        var outOfRange = dist > range;
        var can = !fatal && !outOfRange && enoughMove;
        console.log("canMoveTo "+i+", "+j+", "+i2+", "+j2+": "+can
            +" (fatal: "+fatal+", outOfRange: "+outOfRange+", enoughMove"+enoughMove
            +", dmg: "+dmgAt.red+", "+dmgAt.blue+", shield: "+shields+")");
        return can;
    },

    toOSC: function(i, j) {
        var dist = Math.abs(((Board.cols-1)/2) - i);
        return {x: i * 50, y: (j * 56) + (dist * (56/2))};
    },
    
    refreshOverlays: function(includeProjections) {

        var l = Board.overlayElements.length;
        for (var c = l - 1; c > -1; c--) {
            //check if the element is marked as a projection
            var projection = typeof Board.overlayElements[c].projection != 'undefined';
            if (!projection || (projection && includeProjections)) 
                stage.removeChild(Board.overlayElements.pop()); 
        }

        function projectAround(ship, radius, mode) {
            if (!includeProjections) return; //don't render projections if you aren't supposed to
            var adjToSelection = Common.getAdjacent(ship.i, ship.j, true, radius);
            adjToSelection.forEach(element => {
                var shipTeam = ship.type.team;
                if (Board.shipTiles[element.i][element.j].type == Tile.NONE) {
                    if (mode.includes("highlight")) {
                        var tile_ = Tile.NONE;
                        if (mode.includes("movement")) tile_ = Tile.GREEN;
                        if (mode.includes("attack")) tile_ = shipTeam == "red" ? Tile.RED : Tile.BLUE;
                        var hex = Tile.create(element.i, element.j, tile_, 'overlay');
                        hex.projection = true;
                        Board.overlayElements.push(hex);
                    }
                    var icon_shown = false;
                    if (mode.includes("icons")) {
                        var damages = Board.damageAt(element.i, element.j);
                        var death = (shipTeam == "red" ? damages.blue : damages.red) >= ship.type.s;
                        var hex = Tile.create(element.i, element.j, Tile.DEATH, 'overlay');
                        hex.projection = true;
                        if (death) { Board.overlayElements.push(hex); icon_shown = death; }
                    }
                    if (mode.includes("damage") && !icon_shown) {
                        var damages = Board.damageAt(element.i, element.j);
                        var hi_val = damages.red > damages.blue ? damages.red : damages.blue;
                        if (hi_val > 0) {
                            var hi_color = damages.red > damages.blue ? "#d3343c" : "#3464d3";
                            var text = new createjs.Text(hi_val+"", "28px Arial", hi_color);
                            var osc = Board.toOSC(element.i, element.j);
                            text.x = osc.x + 37.5 - (text.getMeasuredWidth() / 2); 
                            text.y = osc.y + 37.5 - (text.getMeasuredHeight() / 2);
                            text.projection = true;
                            Board.overlayElements.push(text);
                        }
                    }
                }
            });
        }

        //draw radius highlights around ships
        if (Board.previewTile != null) {
            if (Board.selectedTile != null) {
                var min = Math.min(Board.previewTile.type.m, Board.movesLeft);
                projectAround(Board.selectedTile, min, "highlight movement");
                projectAround(Board.selectedTile, min, "highlight damage");
            }
            projectAround(Board.previewTile, 4, "highlight attack");
            projectAround(Board.previewTile, 4, "damage, icons");
        } else {
            if (Board.selectedTile != null) {
                var min = Math.min(Board.selectedTile.type.m, Board.movesLeft);
                projectAround(Board.selectedTile, min, "highlight movement");
                projectAround(Board.selectedTile, min, "damage, icons");
            }
        }

        //debug text
        if (Board.debug) {
            for (var c = 0; c < Board.cols; c++) {
                for (var r = 0; r < Board.shipTiles[c].length; r++) {
                    var hex = Board.shipTiles[c][r]; if (hex == null) continue;
                    var txt = new createjs.Text(hex.i+", "+hex.j, "10px Verdana", "#ffffff");
                    txt.x = hex.x + 10;
                    txt.y = hex.y + 10;
                    Board.overlayElements.push(txt);
                }
            }
        }

        //control hover/select overlay
        if (Board.hoverTile != null) {
            Board.hoverOutline.x = Board.hoverTile.x;
            Board.hoverOutline.y = Board.hoverTile.y;
            Board.overlayElements.push(Board.hoverOutline);
            if (Board.selectedTile != null  && Board.previewTile == null) {
                var hoverteam = Board.hoverTile.type.team;
                if (Board.teamName != hoverteam && hoverteam != "none") {
                    Board.redOutline.x = Board.hoverTile.x;
                    Board.redOutline.y = Board.hoverTile.y;
                    Board.overlayElements.push(Board.redOutline);
                }
            }
            //projectAround(Board.hoverTile, 4, "damage");
        }
        if (Board.selectedTile != null) {
            Board.selectOutline.x = Board.selectedTile.x;
            Board.selectOutline.y = Board.selectedTile.y;
            Board.overlayElements.push(Board.selectOutline);
        }

        //add all
        for (var c = 0; c < Board.overlayElements.length; c++) 
            stage.addChild(Board.overlayElements[c]);

        //refresh the stage
        stage.update();
    },

    toggleDebug: function() {
        Board.debug = !Board.debug;
        Board.refreshOverlays(true);
    }
    
};

var Tile = {
    
    //the tile list with all stats
    NONE: {img: "hex_null.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    NEUTRAL: {img: "hex.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    DEATH: {img: "hex_death.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    BLUE: {img: "hex_blue.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    RED: {img: "hex_red.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    GREEN: {img: "hex_green.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    PURPLE: {img: "hex_purple.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    BLUE_BATTLESHIP: {img: "ship_blue_battleship.png", team: "blue", s: 34, m: 3, ds: 14, dl: 10},
    BLUE_BOMBER: {img: "ship_blue_bomber.png", team: "blue", s: 18, m: 5, ds: 4, dl: 8},
    BLUE_CARRIER: {img: "ship_blue_carrier.png", team: "blue", s: 32, m: 2, ds: 12, dl: 12},
    BLUE_CRUISER: {img: "ship_blue_cruiser.png", team: "blue", s: 30, m: 4, ds: 10, dl: 8},
    BLUE_DESTROYER: {img: "ship_blue_destroyer.png", team: "blue", s: 26, m: 4, ds: 8, dl: 6},
    BLUE_ESCORT: {img: "ship_blue_escort.png", team: "blue", s: 16, m: 5, ds: 10, dl: 4},
    BLUE_FLAGSHIP: {img: "ship_blue_flagship.png", team: "blue", s: 38, m: 2, ds: 20, dl: 10},
    BLUE_GUNSHIP: {img: "ship_blue_gunship.png", team: "blue", s: 10, m: 6, ds: 6, dl: 2},
    BLUE_MARAUDER: {img: "ship_blue_marauder.png", team: "blue", s: 12, m: 5, ds: 8, dl: 4},
    RED_BATTLESHIP: {img: "ship_red_battleship.png", team: "red", s: 34, m: 3, ds: 14, dl: 10},
    RED_BOMBER: {img: "ship_red_bomber.png", team: "red", s: 18, m: 5, ds: 4, dl: 8},
    RED_CARRIER: {img: "ship_red_carrier.png", team: "red", s: 32, m: 2, ds: 12, dl: 12},
    RED_CRUISER: {img: "ship_red_cruiser.png", team: "red", s: 30, m: 4, ds: 10, dl: 8},
    RED_DESTROYER: {img: "ship_red_destroyer.png", team: "red", s: 26, m: 4, ds: 8, dl: 6},
    RED_ESCORT: {img: "ship_red_escort.png", team: "red", s: 16, m: 5, ds: 10, dl: 4},
    RED_FLAGSHIP: {img: "ship_red_flagship.png", team: "red", s: 38, m: 2, ds: 20, dl: 10},
    RED_GUNSHIP: {img: "ship_red_gunship.png", team: "red", s: 10, m: 6, ds: 6, dl: 2},
    RED_MARAUDER: {img: "ship_red_marauder.png", team: "red", s: 12, m: 5, ds: 8, dl: 4},
    
    //create a new tile (instance of createjs.Bitmap, with custom props)
    create: function(i, j, tile_type, layer) {
        //console.log("Creating tile: "+i+", "+j+", "+[tile_type]+", "+layer);
        var hex = new createjs.Bitmap("/images/tiles/"+tile_type.img);
        hex.type = tile_type;
        hex.value = -1;
        hex.i = i; hex.j = j;
        hex.x = Board.toOSC(i, j).x;
        hex.y = Board.toOSC(i, j).y;
        hex.name = tile_type.img;
        hex.lastTurn = "";

        if (layer == 'overlay') return hex;
        //define the interactive events
        hex.on("mouseover", function(evt) {
            if (layer == 'overlay') return;
            Board.hoverTile = hex;
            Board.refreshOverlays(false);
        });
        hex.addEventListener("click", function(evt) {

            function cancelMove() {
                var shipType = Board.previewTile.type;
                Board.update(Board.previewTile.i, Board.previewTile.j, Tile.NONE, 'ship', "normal");
                Board.update(Board.selectedTile.i, Board.selectedTile.j, shipType, 'ship', "normal");
                Board.previewTile = null;
            }

            function onClickShip() {
                if (hex.type == Tile.NONE) return;
                console.log("Board.turnID "+Board.turnID+", clicked "+hex.lastTurn);
                if (hex.lastTurn == Board.turnID) {
                    showMessage("chat", 
                            {sender: "Client", color: "gray", 
                            contents: "You've moved this ship already!"});
                    return;
                }
                if (Board.turn != Board.teamName) {
                    showMessage("chat", 
                            {sender: "Client", color: "gray", 
                            contents: Board.teamName != "none" ? "It is not your turn!" : "You are spectating!"});
                    return;
                }
                if (hex.type.team != Board.teamName) {
                    if (Board.selectedTile == null) {
                        showMessage("chat", 
                            {sender: "Client", color: "gray", contents: "This ship is not yours!"});
                    } else {
                        console.log("Board.turnID "+Board.turnID+", selected "+Board.selectedTile.lastTurn);
                        if (Board.selectedTile.lastTurn == Board.turnID) {
                            showMessage("chat", 
                                    {sender: "Client", color: "gray", 
                                    contents: "You've moved this ship already!"});
                            return;
                        }
                        if (hex.type >= Board.selectedTile.type.s * 2) {
                            if (Common.distance(hex.i, hex.i, Board.selectedTile.i, Board.selectedTile.j) <= 2) {
                                //send a ram packet
                                io.emit("move request", {
                                    pos1: {i: Board.selectedTile.i, j: Board.selectedTile.j}, 
                                    pos2: {i: hex.i, j: hex.j}
                                }, true); //isRam = true
                            } else {
                                showMessage("chat", {sender: "Client", contents: "You are too close to ram!", color: "gray"});
                            }
                        } else {
                            showMessage("chat", {sender: "Client", contents: "You are not strong enough to ram!", color: "gray"});
                        }
                    }
                    return;
                }
                if (Board.selectedTile != null)
                if (hex.i == Board.selectedTile.i
                    && hex.j == Board.selectedTile.j) { Board.selectedTile = null; return; }
                if (hex == Board.previewTile) {
                    //commit move
                    if (Board.selectedTile == null) return;
                    Board.moveShip(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j, false);
                    Board.previewTile = null;
                } else {
                    if (Board.previewTile != null) {
                        //cancel move
                        cancelMove();
                    }
                }
                Board.selectedTile = hex;
            }

            function onClickBoard() {
                if (Board.turn != Board.teamName) {
                    showMessage("chat", 
                            {sender: "Client", color: "gray", 
                            contents: Board.teamName != "none" ? "It is not your turn!" : "You are spectating!"});
                    return;
                }
                if (Board.previewTile == null) {
                    //make move
                    if (!Board.canMoveTo(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j)) {
                        Board.selectedTile = null;
                        return;
                    } 
                    Board.moveShip(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j, true);
                    Board.previewTile = Board.shipTiles[hex.i][hex.j];
                } else {
                    if (Board.selectedTile == null) return;
                    if (Board.selectedTile.i == hex.i && Board.selectedTile.j == hex.j) return;
                    //cancel move
                    cancelMove();
                    if (!Board.canMoveTo(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j)) 
                        return;
                    //make new move
                    Board.moveShip(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j, true);
                    Board.previewTile = Board.shipTiles[hex.i][hex.j];
                }
            }

            if (layer == 'ship') onClickShip();
            if (layer == 'board') onClickBoard();
            Board.refreshOverlays(true);
            
        });
        return hex;
    },
    
    //if the tile has no shield, it's not a ship
    isShip: function(tile_type) { return tile_type.s > 0; }
    
};