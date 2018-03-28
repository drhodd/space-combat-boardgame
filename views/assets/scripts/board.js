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

    team: "none",

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
        this.refreshOverlays();
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
            Board.update(i, j, Tile.NONE, 'ship');
            Board.update(i2, j2, ship.type, 'ship');
            createjs.Tween.get(Board.shipTiles[i2][j2], { override: true, loop: true })
                .to({ alpha: .25 }, 500, createjs.Ease.getPowInOut(2))
                .to({ alpha: 1 }, 500, createjs.Ease.getPowInOut(2));
            createjs.Tween.get(Board.shipTiles[i][j], { override: true, loop: false })
                .to({ alpha: 0 }, 200, createjs.Ease.getPowInOut(4));
        } else {
            io.emit("move request", {
                pos1: {i: i, j: j}, 
                pos2: {i: i2, j: j2}
            });
        }
    },
    
    update: function(i, j, type, layer) {
        console.log("Updating board: "+i+", "+j+", "+type+", "+layer);
        var grid = layer == 'ship' ? Board.shipTiles : Board.boardTiles;
        var old_hex = grid[i][j];
        grid[i][j] = Tile.create(i, j, type, layer);
        grid[i][j].x = old_hex.x;
        grid[i][j].y = old_hex.y;
        grid[i][j].i = old_hex.i;
        grid[i][j].j = old_hex.j;
        if (old_hex == Board.previewTile) Board.previewTile = grid[i][j];
        if (old_hex == Board.selectedTile) Board.selectedTile = grid[i][j];
        if (old_hex == Board.hoverTile) Board.hoverTile = grid[i][j];
        createjs.Tween.get(old_hex, { loop: false })
            .to({ alpha: 0 }, 400, createjs.Ease.getPowInOut(2))
            .call(function() { 
                stage.removeChild(old_hex);
            });
        createjs.Tween.get(grid[i][j], { loop: false })
                .to({ alpha: 0 }, 0, createjs.Ease.getPowInOut(2))
                .to({ alpha: 1 }, 400, createjs.Ease.getPowInOut(2));
        stage.addChild(grid[i][j]);
        Board.refreshOverlays();
    },
    
    valueAt: function(i, j) {
        return Board.shipTiles[i][j].value;
    },
    
    tileType: function(i, j) {
        return Board.shipTiles[i][j].type;
    },

    toOSC: function(i, j) {
        var dist = Math.abs(((Board.cols-1)/2) - i);
        return {x: i * 50, y: (j * 56) + (dist * (56/2))};
    },
    
    refreshOverlays: function() {

        var l = Board.overlayElements.length;
        for (var c = 0; c < l; c++) { stage.removeChild(Board.overlayElements.pop()); }
        
        //control hover/select overlay
        if (Board.hoverTile != null) {
            Board.hoverOutline.x = Board.hoverTile.x;
            Board.hoverOutline.y = Board.hoverTile.y;
            Board.overlayElements.push(Board.hoverOutline);
        }
        if (Board.selectedTile != null) {
            Board.selectOutline.x = Board.selectedTile.x;
            Board.selectOutline.y = Board.selectedTile.y;
            Board.overlayElements.push(Board.selectOutline);
        }

        var radiusOrigin = Board.previewTile != null ? Board.previewTile : Board.selectedTile;
        if (radiusOrigin != null) {
            var adjToSelection = Common.getAdjacent(radiusOrigin.i, radiusOrigin.j, false, 4);
            adjToSelection.forEach(element => {
                var selectedTeam = radiusOrigin.type.team;
                if (Board.shipTiles[element.i][element.j].type == Tile.NONE) {
                        var hex = Tile.create(element.i, element.j, 
                            selectedTeam == "red" ? Tile.RED : Tile.BLUE, 'overlay');
                        Board.overlayElements.push(hex);
                }
            });
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

        //add all
        for (var c = 0; c < Board.overlayElements.length; c++) 
            stage.addChild(Board.overlayElements[c]);

        //refresh the stage
        stage.update();
    },

    toggleDebug: function() {
        Board.debug = !Board.debug;
        Board.refreshOverlays();
    }
    
};

var Tile = {
    
    //the tile list with all stats
    NONE: {img: "hex_null.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    NEUTRAL: {img: "hex.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    BLUE: {img: "hex_blue.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    RED: {img: "hex_red.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    GREEN: {img: "hex_green.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    PURPLE: {img: "hex_purple.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    BLUE_BATTLESHIP: {img: "ship_blue_battleship.png", team: "blue", s: 40, m: 3, ds: 20, dl: 8},
    BLUE_BOMBER: {img: "ship_blue_bomber.png", team: "blue", s: 20, m: 4, ds: 2, dl: 8},
    BLUE_CARRIER: {img: "ship_blue_carrier.png", team: "blue", s: 36, m: 2, ds: 16, dl: 12},
    BLUE_CRUISER: {img: "ship_blue_cruiser.png", team: "blue", s: 30, m: 4, ds: 8, dl: 8},
    BLUE_DESTROYER: {img: "ship_blue_destroyer.png", team: "blue", s: 26, m: 4, ds: 12, dl: 4},
    BLUE_ESCORT: {img: "ship_blue_escort.png", team: "blue", s: 8, m: 6, ds: 2, dl: 2},
    BLUE_FLAGSHIP: {img: "ship_blue_flagship.png", team: "blue", s: 40, m: 2, ds: 24, dl: 12},
    BLUE_GUNSHIP: {img: "ship_blue_gunship.png", team: "blue", s: 16, m: 5, ds: 6, dl: 0},
    BLUE_MARAUDER: {img: "ship_blue_marauder.png", team: "blue", s: 12, m: 5, ds: 4, dl: 2},
    RED_BATTLESHIP: {img: "ship_red_battleship.png", team: "red", s: 40, m: 3, ds: 20, dl: 8},
    RED_BOMBER: {img: "ship_red_bomber.png", team: "red", s: 20, m: 4, ds: 2, dl: 8},
    RED_CARRIER: {img: "ship_red_carrier.png", team: "red", s: 36, m: 2, ds: 16, dl: 12},
    RED_CRUISER: {img: "ship_red_cruiser.png", team: "red", s: 30, m: 4, ds: 8, dl: 8},
    RED_DESTROYER: {img: "ship_red_destroyer.png", s: 26, m: 4, ds: 12, dl: 4},
    RED_ESCORT: {img: "ship_red_escort.png", team: "red", s: 8, m: 6, ds: 2, dl: 2},
    RED_FLAGSHIP: {img: "ship_red_flagship.png", team: "red", s: 40, m: 2, ds: 24, dl: 12},
    RED_GUNSHIP: {img: "ship_red_gunship.png", team: "red", s: 16, m: 5, ds: 6, dl: 0},
    RED_MARAUDER: {img: "ship_red_marauder.png", team: "red", s: 12, m: 5, ds: 4, dl: 2},
    
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

        if (layer == 'overlay') return hex;
        //define the interactive events
        hex.on("mouseover", function(evt) {
            Board.hoverTile = hex;
            Board.refreshOverlays();
        });
        hex.addEventListener("click", function(evt) {

            function onClickShip() {
                if (hex == Board.previewTile) {
                    //commit move
                    Board.moveShip(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j, false);
                    Board.previewTile = null;
                } else {
                    if (Board.previewTile != null) {
                        //cancel move
                        var shipType = Board.previewTile.type;
                        Board.update(Board.previewTile.i, Board.previewTile.j, Tile.NONE, 'ship');
                        Board.update(Board.selectedTile.i, Board.selectedTile.j, shipType, 'ship');
                        Board.previewTile = null;
                    }
                }
                Board.selectedTile = hex;
            }

            function onClickBoard() {
                if (Board.previewTile == null) {
                    //make move
                    Board.moveShip(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j, true);
                    Board.previewTile = Board.shipTiles[hex.i][hex.j];
                } else {
                    //cancel move
                    var shipType = Board.previewTile.type;
                    Board.update(Board.previewTile.i, Board.previewTile.j, Tile.NONE, 'ship');
                    Board.previewTile = null;
                    //make new move
                    Board.update(Board.selectedTile.i, Board.selectedTile.j, shipType, 'ship');
                    Board.moveShip(Board.selectedTile.i, Board.selectedTile.j, hex.i, hex.j, true);
                    Board.previewTile = Board.shipTiles[hex.i][hex.j];
                }
            }

            if (layer == 'ship') onClickShip();
            if (layer == 'board') onClickBoard();
            Board.refreshOverlays();
        });
        return hex;
    },
    
    //if the tile has no shield, it's not a ship
    isShip: function(tile_type) { return tile_type.s > 0; }
    
};