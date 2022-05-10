/*:
* @author Jonas Everaert
* @plugindesc Pathfinding algorithm core
* <be.jonaseveraert.mv.pathfindCore>
*
* @param Calculate paths on map load
* @desc Might cause longer initial load on maps, but better performance afterwards
* @type boolean
* @default true
*
* @help
* Put this plugin near the top of your plugin list
*
* == Script call ==
* Jomy.PathFind.$manager.getLocation({x: 4, y: 5});
* // Get location map to location (4, 5)
* With this, you can lookup any tile's distance to a point. Example:
* ```
* let distMap = Jomy.PathFind.$manager.getLocation({x: 4, y: 5});
* let distance = distMap.get({x: 3, 6}); // Get the distance betweeen
* (4,5) to (3, 6)
* ```
*/

// ============================================================================

var Jomy = Jomy || {};
Jomy.PathFind = {};

// ============================================================================

class _Jomy_PathFindManager {
  constructor() {
    this.distances = new JOMY_VecMap();
    this.blockedPositions = new Set(); // TODO
  }

  /** Get the distance map of a location
   * @param loc: Object {x: number, y: number}
   */
  getDistance(loc) {
    let distance = this.distances.get(loc);
    if (distance == null) {
      this.distances.set(
        loc,
        _Jomy_PathFindManager.mapRoute(loc, this.blockedPositions, $gameMap.width(), $gameMap.height())
      );
      return this.distances.get(loc);
    } else {
      return distance;
    }
  }

  /** Map shortest route(s) to a `startPos`
   * @param blockedPositions: Set of unreachable positions
   */
  static mapRoute(startPos, blockedPositions, maxX, maxY) {
    let frontier = [startPos];
    let distance = new JOMY_VecMap();
    distance.set(startPos, 0); // reached nodes with distance

    while (frontier.length != 0) {
      let current = frontier.shift();
      for (let next of _Jomy_PathFindManager.neigbours(current, blockedPositions, maxX, maxY)) {
        if (distance.get(next) == null) {
          frontier.push(next);
          distance.set(next, 1 + distance.get(current));
        }
      }
    }

    return distance;
  }

  /** @param blockedPos: Set - blocked positions on the map */
  static neigbours(startTile, blockedPos, maxX, maxY) {
    let neighbouringTiles = [
      {x: startTile.x + 1, y: startTile.y},
      {x: startTile.x - 1, y: startTile.y},
      {x: startTile.x, y: startTile.y + 1},
      {x: startTile.x, y: startTile.y - 1}
    ];

    let finalTiles = [];
    for (let nTile of neighbouringTiles) {
      if (!blockedPos.has(nTile) && nTile.x >= 0 && nTile.y >= 0 && nTile.x < maxX && nTile.y < maxY) {
        finalTiles.push(nTile)
      }
    }

    return finalTiles;
  }
};

class JOMY_VecMap {
  constructor() {
    this.map = new Map();
  }

  get(pos) {
    let xMap = this.map.get(pos.x);
    if (xMap == null)
        return null
    return xMap.get(pos.y);
  }

  set(pos, val) {
    let xMap = this.map.get(pos.x);
    if (xMap == null)
        this.map.set(pos.x, new Map());

    this.map.get(pos.x).set(pos.y, val);
  }
}

// ============================================================================

Jomy.PathFind.$manager = new _Jomy_PathFindManager();

(function() {
  let plugin = $plugins.filter(function(p) {
    return p.description.contains('<be.jonaseveraert.mv.pathfindCore>') && p.status;
  })[0];

  let calculateOnMapLoad = Boolean(plugin.parameters["Calculate paths on map load"].toUpperCase() == "TRUE"); // TODO: a way to set this per map

  // On map load
  let onMapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    onMapLoaded.call(this);

    // Get all objects that can't be walked on
    Jomy.PathFind.$manager.blockedPositions = new Set();
    Jomy.PathFind.$manager.distances = new JOMY_VecMap();

    for (let x = 0; x < $gameMap.width(); x++) {
      for (let y = 0; y < $gameMap.height(); y++) {
        if (!$gamePlayer.isMapPassable(x, y, 8)) {
          Jomy.PathFind.$manager.blockedPositions.add({x: x, y: y});
        }
      }
    }

    if(calculateOnMapLoad) {
      for (let x = 0; x < $gameMap.width(); x++) {
        for (let y = 0; y < $gameMap.height(); y++) {
          if ($gamePlayer.isMapPassable(x, y, 8)) {
            Jomy.PathFind.$manager.getDistance(x, y);
          }
        }
      }
    }
  };
})();

// ============================================================================
// Pathfinding field of view functions
// ============================================================================

/** Check if a point lies in a circle
 * @param radius {number} - the radius of the circle
 * @param x {number} - the x position of the middle point of the circle
 * @param a {number} - the x position of the point that could be in the circle
 */
Jomy.PathFind.isPointInCircle = function(x, y, radius, a, b) {
  let distPoints = (x - a) * (x - a) + (y - b) * (y - b);
  radius *= radius;
  if (distPoints < radius) {
    return true
  } else {
    return false
  }
};

/** Check wheter an object can be seen from (`x1`, `y1`).
 * (`x2`, `y2`) are the object's coordinates
 * @param x1 @param y1
 * @param x2 @param y2
 * @param accuracy is the amount of points the function will check
 * @param objects contains the coordinates of the objects that might block the view
 */
Jomy.PathFind.isPointBlockedByObjects = function(x1, y1, x2, y2, accuracy, objects) {
  if (!Jomy.Core.utils.isIterable(objects)) {
    return true;
  }

  for (let i = 0; i < accuracy; i++) {
    let t = i / accuracy;

    let pointBetweenStartEnd = {
      x: t * x2 + (1 - t) * x1,
      y: t * y2 + (1 - t) * y1
    };

    for (let object of objects) {
      if (
        Math.round(pointBetweenStartEnd.x) == object.x
          && Math.round(pointBetweenStartEnd.y) == object.y
      ) {
        return true;
      }
    }
  } // endfor

  return false;
};

/** Checks if a point is in front of a player. Includes being on the same line */
Jomy.PathFind.isPointInFrontOf = function(x, y, dir, a, b) {
  switch (Jomy.Core.utils.rmmvDirToGameDir(dir)) {
    case 0:
      // up
      return b <= y;
    case 3:
      // left
      return a <= x;
    case 2:
      // down
      return b >= y;
    case 1:
      // right
      return a >= x;
  }
};

/** Checks wether a point is 1 tile away from another */
Jomy.PathFind.isPointCloseTo = function(x, y, a, b) {
  return ((x + 1) == a || (x - 1 == a) || (x == a))
    && ((y + 1) == b || (y - 1) == b || (y == b));
};
