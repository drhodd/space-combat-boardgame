var isModule = typeof module != 'undefined';
//Board will be defined if loading from HTML
var board = isModule ? require("../board.js") : Board;

var getAdjacent = function(i, j, include_origin, radius) {

    var adj = include_origin ? [{i: i, j: j}] : [];

    //inner function to test if adj contains the coordinate pair
    function contains(ti, tj) { 
        for (var c = 0; c < adj.length; c++) 
            if (adj[c] != null)
                    if (adj[c].i == ti && adj[c].j == tj)
                        return true;
        return false;
    }
    //inner function to get the # of rows in a column
    var rows = function(i) { return board.cols - Math.abs(board.mid - i); };
    //inner function to get the x and y directions for a specified compass dir
    //it changes based on the column (i) due to the array structure
    var dirs = function(i, dir) {
        var dx = ((dir == 'NW' || dir == 'SW') ? -1 : ((dir == 'NE' || dir == 'SE') ? 1 : 0));
        var dy = 0;
        switch (dir) {
            case 'N':
                //console.log("Nortth!!!!");
                dy = -1;
                break;
            case 'S':
                dy = 1;
                break;
            case 'NW':
                dy = i <= board.mid ? -1 : 0;
                break;
            case 'SW':
                dy = i <= board.mid ? 0 : 1;
                break;
            case 'NE':
                dy = i < board.mid ? 0 : -1;
                break;
            case 'SE':
                dy = i < board.mid ? 1 : 0;
                break;
        }
        return {dx: dx, dy: dy};
    }

    //inner function that traverses linearly in the direction specified, for the duration specified
    //each tile it hits, it will add to the array
    //returns the position it ended on (and last added to array)
    var traverseFrom = function(pos, dir, dur, addEndTile) {
        //console.log("Traversing from "+pos.i+", "+pos.j+" in direction "+dir+" for "+dur+" tiles.");
        var curr = {i: pos.i, j: pos.j};
        for (var d = 0; d < dur; d++) {
            var deltas = dirs(curr.i, dir);
            //console.log("d: "+d+", dx: "+deltas.dx+", dy: "+deltas.dy+", dir: "+dir);
            curr = {i: curr.i + deltas.dx, j: curr.j + deltas.dy};
            //console.log("Added position "+curr.i+", "+curr.j);
            adj.push(curr);
        }
        //console.log("Ended at position "+curr.i+", "+curr.j);
        return curr;
    }
    //uses traverseFrom to add everything in a circle shape (hollow)
    var circleFrom = function(pos, radius) {
        var se = traverseFrom(pos, "SE", radius, true);
        var s = traverseFrom(se, "S", radius, true);
        var sw = traverseFrom(s, "SW", radius, true);
        var nw = traverseFrom(sw, "NW", radius, true);
        var n2 = traverseFrom(nw, "N", radius, true);
        var ne = traverseFrom(n2, "NE", radius, false);
    }
    //add multiple circles of tiles to the array
    for (var r = 1; r < radius + 1; r++) circleFrom({i: i, j: j - r}, r);
    //circleFrom({i: i, j: j - radius}, radius);

    //filter out any positions that are out of range
    return adj.filter(function(n) { 
        if (n == undefined) {
            return false;
        } else {
            if ((n.i < 0 || n.i > board.cols - 1 || n.j < 0 || n.j > rows(n.i) - 1))
                return false;
                else return true;
        }
    });

}

/**
 * Handle both server and client
 */
var Common;
if (!isModule) {
    console.log("No module! Exporting as standard Javascript.");
    Common = {
        getAdjacent: getAdjacent    
    };
} else {
    console.log("Module detected. Exporting as module.");
    module.exports.getAdjacent = getAdjacent;
}