/*:
* @author Jonas Everaert
* @plugindesc Pathfinding algorithm core
* <be.jonaseveraert.mv.pathfindCore>
*
* @param Calculate paths on map load
* @desc Longer initial load on maps, but better performane afterwards
* @type boolean
* @default false
*
* @help
* Put this plugin near the top of your plugin list
*
* == Script call ==
* Jomy.PathFind.$manager.getLocation({x: 4, y: 5});
* // Get location map and last update time to location (4, 5)
*
* Jomy.PathFind.$manager.getLocation({x: 4, y: 5}, 1500);
* // Get location and recalculate if more than 1.5 seconds hav passed since
* last location update.
* Default value is 1000 (1.5 seconds) (this means that the first example will
* refresh if more than 1 second passed since the last update).
*/

var Jomy = Jomy || {};
Jomy.PathFind = {};

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
  }
})();
