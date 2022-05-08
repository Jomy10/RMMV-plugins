/*:
* @author Jonas Everaert
* @plugindesc Pathfinding for enemies
* <be.jonaseveraert.mv.RTBS.pathfind>
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
* @help
* Require's Shaz' smart pathfinding plugin to be installed (above this plugin)
* Get it at: https://forums.rpgmakerweb.com/index.php?threads/smart-pathfinding.46761/
*
* == Additional enemy comments ==
* - `PathfindRadius: <value>`: The radius in which an enemy will check if it can
* see the player. An enemy's view can be blocked using a region tag
*/

(function() {
  let plugin = $plugins.filter(function(p) {
    return p.description.contains('<be.jonaseveraert.mv.RTBS.pathfind>') && p.status;
  })[0];

  let blockingRegionTag = Number(plugin.parameters["Blocking Tile Tag"]);
  let blockingTerrainTag = Number(plugin.parameters["Blocking Terrain Tag"]);

  /** Check if a point lies in a circle */
  function isPointInCircle(x, y, radius, a, b) {
    let distPoints = (x - a) * (x - a) + (y - b) * (y - b);
    radius *= radius;
    if (distPoints < radius) {
      return true
    } else {
      return false
    }
  }

  /** Check wheter an object can be seen from (`x1`, `y1`).
   * (`x2`, `y2`) are the object's coordinates
   * `accuracy` is the amount of points the function will check
   * `objects` contains the coordinates of the objects that might block the view
   */
  function isPointBlockedByObjects(x1, y1, x2, y2, accuracy, objects) {
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
  }

  /// Checks if a point is in front of a player. Includes being on the same line
  function isPointInFrontOf(x, y, dir, a, b) {
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
  }

  function isPointCloseTo(x, y, a, b) {
    return ((x + 1) == a || (x - 1 == a) || (x == a))
      && ((y + 1) == b || (y - 1) == b || (y == b));
  }

  let wallObjects = [];

  // Change of map
  // On map load
  let onMapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    onMapLoaded.call(this);
    wallObjets = [];
    for (let x = 0; x < $gameMap.width(); x++) {
      for (let y = 0; y < $gameMap.height(); y++) {
        if ($gameMap.terrainTag(x, y) == blockingTerrainTag || $gameMap.regionId(x, y) == blockingRegionTag) {
          wallObjects.push({x: x, y: y});
        }
      }
    }
  }

  // Collect enemy comments
  let onDefaultEnemyCommentKey = RTBS_Manager.prototype._onDefaultEnemyCommentKey;
  RTBS_Manager.prototype._onDefaultEnemyCommentKey = function(comment, enemy) {
    onDefaultEnemyCommentKey.call(this);
    switch (comment.getKey()) {
      case "PathfindRadius":
        enemy.pathfindRadius = Number(comment.getValue());
        break;
    }
  };

  // Add pathfinding to enemy
  /** Let the enemy pathfind to a location
   * other = eventId
   * other = -1: player
   * other = { x: number, y: number }: location
   */
  RTBS_Enemy.prototype.pathfindTo = function(other) {
    this.event.clearTarget();
    if (typeof other == "number") {
      // let interpreter = $gameMap._interpreter;
      // console.log(interpreter);
      // interpreter.pluginCommand("SmartPath", [String(this.event.eventId()), String(other)]);
      // PluginManager.callCommand(this.event, shazPluginName, "SmartPath", [String(this.event.eventId()), String(other)]);
      if (other == -1) {
        // Player can hide again (enemy goes to last known location)
        this.event.setTarget(null, $gamePlayer.x, $gamePlayer.y);
      } else {
        // get event
        let _event = $gameMap.event(other);
        if (this.event._target != _event)
          this.event.setTarget(_event);
      }
    } else if (other != null) {
      // pathfind to location
      if (this.event._targetX == other.x && this.event._targetY == other.y)
        this.event.setTarget(null, other.x, other.y);
    }
  };

  RTBS_Enemy.prototype.pathfindToPlayer = function() {
    this.pathfindTo(-1);
  }

  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);
    for (let enemy of $rtbs_manager.enemies) {
      if (enemy.pathfindRadius != null) {
        if (
          isPointInCircle(enemy.event.x, enemy.event.y, enemy.pathfindRadius, $gamePlayer.x, $gamePlayer.y)
          && (
            isPointInFrontOf(enemy.event.x, enemy.event.y, enemy.event.direction(), $gamePlayer.x, $gamePlayer.y)
            || isPointCloseTo(enemy.event.x, enemy.event.y, $gamePlayer.x, $gamePlayer.y)
          )
          && !isPointBlockedByObjects(enemy.event.x, enemy.event.y, $gamePlayer.x, $gamePlayer.y, enemy.pathfindRadius * 4, wallObjects)
        ) {
          enemy.pathfindToPlayer();
        }
      }
    }
  }
})();
