//tile definitions and statistics
module.exports.NONE = {s: 0, m: 0, ds: 0, dl: 0, team: 'none'};
module.exports.NEUTRAL = {s: 0, m: 0, ds: 0, dl: 0, team: 'none'};
module.exports.BLUE = {s: 0, m: 0, ds: 0, dl: 0, team: 'none'};
module.exports.RED = {s: 0, m: 0, ds: 0, dl: 0, team: 'none'};
module.exports.GREEN = {s: 0, m: 0, ds: 0, dl: 0, team: 'none'};
module.exports.PURPLE = {s: 0, m: 0, ds: 0, dl: 0, team: 'none'};
module.exports.BLUE_BATTLESHIP = {s: 34, m: 3, ds: 16, dl: 8, team: 'blue'};
module.exports.BLUE_BOMBER = {s: 20, m: 5, ds: 2, dl: 8, team: 'blue'};
module.exports.BLUE_CARRIER = {s: 32, m: 2, ds: 12, dl: 12, team: 'blue'};
module.exports.BLUE_CRUISER = {s: 30, m: 4, ds: 8, dl: 8, team: 'blue'};
module.exports.BLUE_DESTROYER = {s: 26, m: 4, ds: 10, dl: 4, team: 'blue'};
module.exports.BLUE_ESCORT = {s: 10, m: 6, ds: 4, dl: 2, team: 'blue'};
module.exports.BLUE_FLAGSHIP = {s: 38, m: 2, ds: 20, dl: 10, team: 'blue'};
module.exports.BLUE_GUNSHIP = {s: 16, m: 5, ds: 8, dl: 2, team: 'blue'};
module.exports.BLUE_MARAUDER = {s: 12, m: 5, ds: 6, dl: 4, team: 'blue'};
module.exports.RED_BATTLESHIP = {s: 34, m: 3, ds: 16, dl: 8, team: 'red'};
module.exports.RED_BOMBER = {s: 20, m: 5, ds: 2, dl: 8, team: 'red'};
module.exports.RED_CARRIER = {s: 32, m: 2, ds: 12, dl: 12, team: 'red'};
module.exports.RED_CRUISER = {s: 30, m: 4, ds: 8, dl: 8, team: 'red'};
module.exports.RED_DESTROYER = {s: 26, m: 4, ds: 10, dl: 4, team: 'red'};
module.exports.RED_ESCORT = {s: 10, m: 6, ds: 4, dl: 2, team: 'red'};
module.exports.RED_FLAGSHIP = {s: 38, m: 2, ds: 20, dl: 10, team: 'red'};
module.exports.RED_GUNSHIP = {s: 16, m: 5, ds: 8, dl: 2, team: 'red'};
module.exports.RED_MARAUDER = {s: 12, m: 5, ds: 6, dl: 4, team: 'red'};
    
//if the tile has no shield, it's not a ship
module.exports.isShip = function(tile_type) { return tile_type.s > 0; }
