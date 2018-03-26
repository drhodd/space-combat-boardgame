//tile definitions and statistics
module.exports.NEUTRAL = {s: 0, m: 0, ds: 0, dl: 0};
module.exports.BLUE = {s: 0, m: 0, ds: 0, dl: 0};
module.exports.RED = {s: 0, m: 0, ds: 0, dl: 0};
module.exports.GREEN = {s: 0, m: 0, ds: 0, dl: 0};
module.exports.PURPLE = {s: 0, m: 0, ds: 0, dl: 0};
module.exports.BLUE_BATTLESHIP = {s: 40, m: 3, ds: 20, dl: 8};
module.exports.BLUE_BOMBER = {s: 20, m: 4, ds: 2, dl: 8};
module.exports.BLUE_CARRIER = {s: 36, m: 2, ds: 16, dl: 12};
module.exports.BLUE_CRUISER = {s: 30, m: 4, ds: 8, dl: 8};
module.exports.BLUE_DESTROYER = {s: 26, m: 4, ds: 12, dl: 4};
module.exports.BLUE_ESCORT = {s: 8, m: 6, ds: 2, dl: 2};
module.exports.BLUE_FLAGSHIP = {s: 40, m: 2, ds: 24, dl: 12};
module.exports.BLUE_GUNSHIP = {s: 16, m: 5, ds: 6, dl: 0};
module.exports.BLUE_MARAUDER = {s: 12, m: 5, ds: 4, dl: 2};
module.exports.RED_BATTLESHIP = {s: 40, m: 3, ds: 20, dl: 8};
module.exports.RED_BOMBER = {s: 20, m: 4, ds: 2, dl: 8};
module.exports.RED_CARRIER = {s: 36, m: 2, ds: 16, dl: 12};
module.exports.RED_CRUISER = {s: 30, m: 4, ds: 8, dl: 8};
module.exports.RED_DESTROYER = {s: 26, m: 4, ds: 12, dl: 4};
module.exports.RED_ESCORT = {s: 8, m: 6, ds: 2, dl: 2};
module.exports.RED_FLAGSHIP = {s: 40, m: 2, ds: 24, dl: 12};
module.exports.RED_GUNSHIP = {s: 16, m: 5, ds: 6, dl: 0};
module.exports.RED_MARAUDER = {s: 12, m: 5, ds: 4, dl: 2};
    
//if the tile has no shield, it's not a ship
module.exports.isShip = function(tile_type) { return tile_type.s > 0; }