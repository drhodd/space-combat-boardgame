var isModule = typeof module != 'undefined';

//tile definitions and statistics
var Tile = {

    NONE: {id: 0, name: "NONE", img: "hex_null.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    NEUTRAL: {id: 1, img: "hex.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    DEATH: {id: 2, img: "hex_death.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    BLUE: {id: 3, img: "hex_blue.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    RED: {id: 4, img: "hex_red.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    GREEN: {id: 5, img: "hex_green.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    PURPLE: {id: 6, img: "hex_purple.png", team: "none", s: 0, m: 0, ds: 0, dl: 0},
    BLUE_BATTLESHIP: {id: 7, img: "ship_blue_battleship.png", team: "blue", s: 34, m: 3, ds: 16, dl: 8},
    BLUE_BOMBER: {id: 8, img: "ship_blue_bomber.png", team: "blue", s: 20, m: 5, ds: 2, dl: 8},
    BLUE_CARRIER: {id: 9, img: "ship_blue_carrier.png", team: "blue", s: 32, m: 2, ds: 12, dl: 12},
    BLUE_CRUISER: {id: 10, img: "ship_blue_cruiser.png", team: "blue", s: 30, m: 4, ds: 8, dl: 8},
    BLUE_DESTROYER: {id: 11, img: "ship_blue_destroyer.png", team: "blue", s: 26, m: 4, ds: 10, dl: 4},
    BLUE_ESCORT: {id: 12, img: "ship_blue_escort.png", team: "blue", s: 10, m: 6, ds: 4, dl: 2},
    BLUE_FLAGSHIP: {id: 13, img: "ship_blue_flagship.png", team: "blue", s: 38, m: 2, ds: 20, dl: 10},
    BLUE_GUNSHIP: {id: 14, img: "ship_blue_gunship.png", team: "blue", s: 16, m: 5, ds: 8, dl: 2},
    BLUE_MARAUDER: {id: 15, img: "ship_blue_marauder.png", team: "blue", s: 12, m: 5, ds: 6, dl: 4},
    RED_BATTLESHIP: {id: 16, img: "ship_red_battleship.png", team: "red", s: 34, m: 3, ds: 16, dl: 8},
    RED_BOMBER: {id: 17, img: "ship_red_bomber.png", team: "red", s: 20, m: 5, ds: 2, dl: 8},
    RED_CARRIER: {id: 18, img: "ship_red_carrier.png", team: "red", s: 32, m: 2, ds: 12, dl: 12},
    RED_CRUISER: {id: 19, img: "ship_red_cruiser.png", team: "red", s: 30, m: 4, ds: 8, dl: 8},
    RED_DESTROYER: {id: 20, img: "ship_red_destroyer.png", team: "red", s: 26, m: 4, ds: 10, dl: 4},
    RED_ESCORT: {id: 21, img: "ship_red_escort.png", team: "red", s: 10, m: 6, ds: 4, dl: 2},
    RED_FLAGSHIP: {id: 22, img: "ship_red_flagship.png", team: "red", s: 38, m: 2, ds: 20, dl: 10},
    RED_GUNSHIP: {id: 23, img: "ship_red_gunship.png", team: "red", s: 16, m: 5, ds: 8, dl: 2},
    RED_MARAUDER: {id: 24, img: "ship_red_marauder.png", team: "red", s: 12, m: 5, ds: 6, dl: 4},

    get: function(idOrName) {
        for (var property in object) {
            var ret = false;
            if (object.hasOwnProperty(property)) {
                if (object[property].id == idOrName) ret = true;
            }
            if (property == idOrName) ret = true;
            if (ret) return object[property];
        }
    }
    
};

var DEFAULT_STATE = [
    {name: "RED_FLAGSHIP", x: 7, y: 0},
    {name: "RED_DESTROYER", x: 6, y: 0},
    {name: "RED_DESTROYER", x: 8, y: 0},
    {name: "RED_GUNSHIP", x: 5, y: 0},
    {name: "RED_BATTLESHIP", x: 7, y: 1},
    {name: "RED_GUNSHIP", x: 9, y: 0},
    {name: "RED_MARAUDER", x: 4, y: 0},
    {name: "RED_BOMBER", x: 6, y: 1},
    {name: "RED_BOMBER", x: 8, y: 1},
    {name: "RED_MARAUDER", x: 10, y: 0},
    {name: "RED_ESCORT", x: 5, y: 1},
    {name: "RED_CARRIER", x: 7, y: 2},
    {name: "RED_ESCORT", x: 9, y: 1},
    {name: "RED_ESCORT", x: 6, y: 2},
    {name: "RED_ESCORT", x: 8, y: 2},
    {name: "RED_CRUISER", x: 7, y: 3},
    
    {name: "BLUE_FLAGSHIP", x: 7, y: 14},
    {name: "BLUE_DESTROYER", x: 6, y: 13},
    {name: "BLUE_DESTROYER", x: 8, y: 13},
    {name: "BLUE_GUNSHIP", x: 5, y: 12},
    {name: "BLUE_BATTLESHIP", x: 7, y: 13},
    {name: "BLUE_GUNSHIP", x: 9, y: 12},
    {name: "BLUE_MARAUDER", x: 4, y: 11},
    {name: "BLUE_BOMBER", x: 6, y: 12},
    {name: "BLUE_BOMBER", x: 8, y: 12},
    {name: "BLUE_MARAUDER", x: 10, y: 11},
    {name: "BLUE_ESCORT", x: 5, y: 11},
    {name: "BLUE_CARRIER", x: 7, y: 12},
    {name: "BLUE_ESCORT", x: 9, y: 11},
    {name: "BLUE_ESCORT", x: 6, y: 11},
    {name: "BLUE_ESCORT", x: 8, y: 11},
    {name: "BLUE_CRUISER", x: 7, y: 11}
];

/**
 * Handle both server and client
 */
if (!isModule) {
    console.log("Exporting tiles.js as standard Javascript.");
} else {
    console.log("Exporting tiles.js as module.");
    module.exports.Tile = Tile;
    module.exports.DEFAULT_STATE = DEFAULT_STATE;
}