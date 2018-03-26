var Board = {
    
    cols: 15,
    mid: 7,
    tiles: [],
    textOverlays: [],
    selectOutline: new createjs.Bitmap("/images/tiles/outline_selected.png"),
    hoverOutline: new createjs.Bitmap("/images/tiles/outline_hover.png"),
    greenOutline: new createjs.Bitmap("/images/tiles/outline_green.png"),
    whiteOutline: new createjs.Bitmap("/images/tiles/outline_hover.png"),
    redOutline: new createjs.Bitmap("/images/tiles/outline_red.png"),
    selectedTile: null,
    hoveredTile: null,

    team: "none",

    create: function() {
        var cols = 15;
        var rows = 8;
        for (i = 0; i < cols; i++) {
            Board.tiles[i] = [];
            for (j = 0; j < rows; j++) {
                var hex = Tile.create(i, j, Tile.NEUTRAL);
                var dist = Math.abs(((cols-1)/2) - i);
                var target_y = (j * 56) + (dist * (56/2));
                Board.tiles[i].push(hex);
                hex.x = i * 50;
                hex.y = target_y;
                hex.i = i;
                hex.j = j;
                stage.addChild(hex);
            }
            rows += i >= ((cols-1)/2) ? -1 : 1;
        }
        createjs.Ticker.setFPS(60);
        createjs.Ticker.addEventListener("tick", stage);
        stage.update();
    },
    
    performLoadAnimation: function() {
        //fall animation on board creation
        for (i = 0; i < Board.tiles.length; i++) {
            for (j = 0; j < Board.tiles[i].length; j++) {
                var hex = Board.tiles[i][j];
                createjs.Tween.get(hex, { loop: false })
                    .to({ alpha: 0}, 0, createjs.Ease.getPowInOut(2))
                    .to({ alpha: 1}, 0, createjs.Ease.getPowInOut(2));
            }
        }
    },
    
    update: function(i, j, type) {
        var hex = Board.tiles[i][j];
        Board.tiles[i][j] = Tile.create(i, j, type);
        Board.tiles[i][j].x = hex.x;
        Board.tiles[i][j].y = hex.y;
        Board.tiles[i][j].i = hex.i;
        Board.tiles[i][j].j = hex.j;
        Board.tiles[i][j].target_y = hex.target_y;
        createjs.Tween.get(hex, { loop: false })
            .to({ alpha: 0 }, 200, createjs.Ease.getPowInOut(2))
            .call(function() { 
                stage.removeChild(hex);
            });
        stage.addChild(Board.tiles[i][j]);
        createjs.Tween.get(Board.tiles[i][j], { loop: false })
                .to({ alpha: 0 }, 0, createjs.Ease.getPowInOut(2))
                .to({ alpha: 1 }, 200, createjs.Ease.getPowInOut(2));
    },
    
    valueAt: function(i, j) {
        return Board.tiles[i][j].value;
    },
    
    tileType: function(i, j) {
        return Board.tiles[i][j].type;
    },
    
    distance: function(i, j, i2, j2) {
        if (i == i2 && j == j2) return 0;
        for (var a = 1; a < Board.cols; a++) {
            var adj = Board.adjacent(i, j, true, a);
            if (adj.includes(Board.tiles[i2][j2])) return a;
        }
        return -1;
    },
    
    damageAt: function(i, j) {
        var r_dmg = 0, b_dmg = 0;
        var adj = Board.adjacent(i, j, false, 4);
        for (var c = 0; c < adj.length; c++) {
            if (adj[c] == null) continue;
            var type = adj[c].type;
            if (type.team == "r") r_dmg += type.ds;
            if (type.team == "b") b_dmg += type.ds;
        }
        return {r: r_dmg, b: b_dmg};
    },
    
    refreshOverlays: function(i, j) {
        stage.removeChild(Board.hoverOutline);
        stage.removeChild(Board.selectOutline);
        //determine the color of the hover outline

        Board.hoverOutline.x = Board.tiles[i][j].x;
        Board.hoverOutline.y = Board.tiles[i][j].y;
        if (Board.selectedTile != null) {
            Board.selectOutline.x = Board.selectedTile.x;
            Board.selectOutline.y = Board.selectedTile.y;
            stage.addChild(Board.selectOutline);
        }
        stage.addChild(Board.hoverOutline);
        var l = Board.textOverlays.length;
        for (var c = 0; c < l; c++) { stage.removeChild(Board.textOverlays.pop()); }
        var adj = Board.adjacent(i, j, true, 1);
        
        for (var c = 0; c < adj.length; c++) {
            //create text overlay
            var hex = adj[c]; if (hex == null) continue;
            var dmg = Board.damageAt(hex.i, hex.j).b;
            var dist = Board.distance(i, j, hex.i, hex.j);
            var txt = new createjs.Text(dmg, "20px Verdana", "#ffffff");
            txt.x = hex.x + 25;
            txt.y = hex.y + 20;
            stage.addChild(txt);
            Board.textOverlays.push(txt);
        }
        
        stage.update();
    },
    
    adjacent: function(i, j, origin, depth) {
        if (i < 0 || i > Board.cols - 1) return [];
        if (j < 0 || j > Board.tiles[i].length - 1) return [];
        var adj = [
            Board.tiles[i][j-1],
            i < Board.cols - 1 ? Board.tiles[i+1][i < Board.mid ? j : j - 1] : null,
            i < Board.cols - 1 ? Board.tiles[i+1][i < Board.mid ? j + 1 : j] : null,
            Board.tiles[i][j+1],
            i > 0 ? Board.tiles[i-1][i > Board.mid ? j : j - 1] : null,
            i > 0 ? Board.tiles[i-1][i > Board.mid ? j + 1 : j] : null,
            origin ? Board.tiles[i][j] : null
        ];
        if (depth > 1) {
            var temp = adj.slice(); //copy the array
            for (var c = 0; c < temp.length; c++) { 
                if (adj[c] == null) continue;
                if (adj[c].i == i && adj[c].j == j) continue;
                var adj2 = Board.adjacent(adj[c].i, adj[c].j, false, depth-1);
                for (var cc = 0; cc < adj2.length; cc++) if (!adj.includes(adj2[cc])) adj.push(adj2[cc]);
            }
        }
        return adj;
    }
    
};

var Tile = {
    
    //the tile list with all stats
    NEUTRAL: {img: "hex.png", team: "n", s: 0, m: 0, ds: 0, dl: 0},
    BLUE: {img: "hex_blue.png", team: "n", s: 0, m: 0, ds: 0, dl: 0},
    RED: {img: "hex_red.png", team: "n", s: 0, m: 0, ds: 0, dl: 0},
    GREEN: {img: "hex_green.png", team: "n", s: 0, m: 0, ds: 0, dl: 0},
    PURPLE: {img: "hex_purple.png", team: "n", s: 0, m: 0, ds: 0, dl: 0},
    BLUE_BATTLESHIP: {img: "ship_blue_battleship.png", team: "b", s: 40, m: 3, ds: 20, dl: 8},
    BLUE_BOMBER: {img: "ship_blue_bomber.png", team: "b", s: 20, m: 4, ds: 2, dl: 8},
    BLUE_CARRIER: {img: "ship_blue_carrier.png", team: "b", s: 36, m: 2, ds: 16, dl: 12},
    BLUE_CRUISER: {img: "ship_blue_cruiser.png", team: "b", s: 30, m: 4, ds: 8, dl: 8},
    BLUE_DESTROYER: {img: "ship_blue_destroyer.png", team: "b", s: 26, m: 4, ds: 12, dl: 4},
    BLUE_ESCORT: {img: "ship_blue_escort.png", team: "b", s: 8, m: 6, ds: 2, dl: 2},
    BLUE_FLAGSHIP: {img: "ship_blue_flagship.png", team: "b", s: 40, m: 2, ds: 24, dl: 12},
    BLUE_GUNSHIP: {img: "ship_blue_gunship.png", team: "b", s: 16, m: 5, ds: 6, dl: 0},
    BLUE_MARAUDER: {img: "ship_blue_marauder.png", team: "b", s: 12, m: 5, ds: 4, dl: 2},
    RED_BATTLESHIP: {img: "ship_red_battleship.png", team: "r", s: 40, m: 3, ds: 20, dl: 8},
    RED_BOMBER: {img: "ship_red_bomber.png", team: "r", s: 20, m: 4, ds: 2, dl: 8},
    RED_CARRIER: {img: "ship_red_carrier.png", team: "r", s: 36, m: 2, ds: 16, dl: 12},
    RED_CRUISER: {img: "ship_red_cruiser.png", team: "r", s: 30, m: 4, ds: 8, dl: 8},
    RED_DESTROYER: {img: "ship_red_destroyer.png", s: 26, m: 4, ds: 12, dl: 4},
    RED_ESCORT: {img: "ship_red_escort.png", team: "r", s: 8, m: 6, ds: 2, dl: 2},
    RED_FLAGSHIP: {img: "ship_red_flagship.png", team: "r", s: 40, m: 2, ds: 24, dl: 12},
    RED_GUNSHIP: {img: "ship_red_gunship.png", team: "r", s: 16, m: 5, ds: 6, dl: 0},
    RED_MARAUDER: {img: "ship_red_marauder.png", team: "r", s: 12, m: 5, ds: 4, dl: 2},
    
    //create a new tile (instance of createjs.Bitmap, with custom props)
    create: function(i, j, tile_type) {
        var hex = new createjs.Bitmap("/images/tiles/"+tile_type.img);
        hex.type = tile_type;
        hex.value = -1;
        hex.i = i; hex.j = j;
        hex.name = tile_type.img;
        //define the interactive events
        hex.addEventListener("mouseover", function(evt) {
            Board.refreshOverlays(evt.target.i, evt.target.j);
        });
        hex.addEventListener("click", function(evt) {
            Board.selectedTile = hex;
            Board.refreshOverlays(evt.target.i, evt.target.j);
        });
        return hex;
    },
    
    //if the tile has no shield, it's not a ship
    isShip: function(tile_type) { return tile_type.s > 0; }
    
};