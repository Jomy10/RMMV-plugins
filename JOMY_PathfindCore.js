/*:
* @author Jonas Everaert
* @plugindesc Pathfinding algorithm core
* <be.jonaseveraert.mv.pathfindCore>
*
* @param Blocking Tile Tag
* @desc every grid tile taggd with this region tag will block an enemy's view
* @type number
* @default 13
*
* @param Blocking Terrain Tag
* @desc Every tile with this terrain tag will block an enemy's view
* @type number
* @default 1
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

var Imported = Imported || {};
Imported.JOMY_PathfindCore = true;

var Jomy = Jomy || {};
Jomy.PathFind = {};

// ============================================================================

class _Jomy_PathFindManager {
  constructor() {
    this.distances = new JOMY_VecMap();
    // A set of positions that can't be walked on
    this.blockedPositions = new Set();
    // An array of positions that block the line of sight
    this.fieldBlockingPositions = [];
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

  let blockingRegionTag = Number(plugin.parameters["Blocking Tile Tag"]);
  let blockingTerrainTag = Number(plugin.parameters["Blocking Terrain Tag"]);
  let calculateOnMapLoad = Boolean(plugin.parameters["Calculate paths on map load"].toUpperCase() == "TRUE"); // TODO: a way to set this per map

  // On map load
  let onMapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    onMapLoaded.call(this);

    Jomy.PathFind.$manager.blockedPositions = new Set();
    Jomy.PathFind.$manager.distances = new JOMY_VecMap();
    Jomy.PathFind.$manager.fieldBlockingPositions = [];

    for (let x = 0; x < $gameMap.width(); x++) {
      for (let y = 0; y < $gameMap.height(); y++) {
        if ($gameMap.terrainTag(x, y) == blockingTerrainTag || $gameMap.regionId(x, y) == blockingRegionTag) {
          Jomy.PathFind.$manager.fieldBlockingPositions.push({x: x, y: y});
        }
      }
    }

    // Get all objects that can't be walked on
    for (let x = 0; x < $gameMap.width(); x++) {
      for (let y = 0; y < $gameMap.height(); y++) {
        if (!$gamePlayer.isMapPassable(x, y, 8)) { // TODO: change is map passable to custom function (ignore event, only tiles, unless event marked with permanent)
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
// Pathfinding line of sight functions
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

/** Check line of sight from (x,y) to (a,b)
 * @param radius {number} - The radius in which to check for if (a,b) is in sight
 * @param direction {number} - The direction the entity at (x,y) is facing (RMMV direction)
 * @param wallObjects {{x: number, y: number}} - Contains the coordinates of the objects that might block the view
 * @returns {boolean} - Wheter (a, b) is in the line of sight of (x, y)
 */
Jomy.PathFind.checkLineOfSight = function(x, y, radius, direction, wallObjects, a, b) {
  return Jomy.PathFind.isPointInCircle(x, y, radius, a, b)
  && (
    Jomy.PathFind.isPointInFrontOf(x, y, direction, a, b, wallObjects)
    || Jomy.PathFind.isPointCloseTo(x, y, a, b)
  )
  && !Jomy.PathFind.isPointBlockedByObjects(x, y, a, b, radius * 4, wallObjects);
};
