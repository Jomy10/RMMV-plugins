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
* @param Pathfinding step
* @desc
* The amount of miliseconds to wait before checking for a new path to the player
* @type number
* @default 500
*
* @help
* Require's Shaz' smart pathfinding plugin to be installed (above this plugin)
* Get it at: https://forums.rpgmakerweb.com/index.php?threads/smart-pathfinding.46761/
*
* Requires JOMY_PathfindCore
*
* == Additional enemy comments ==
* - `PathfindRadius: <value>`: The radius in which an enemy will check if it can
* see the player. An enemy's view can be blocked using a region tag
*/

var Imported = Imported || {};
Imported.Jomy_RTBS_enemyPathfind = true;

var Jomy = Jomy || {};
Jomy.RTBS_PathFind = {};
Jomy.RTBS_PathFind.version = 2.0;

(function() {
  let plugin = $plugins.filter(function(p) {
    return p.description.contains('<be.jonaseveraert.mv.RTBS.pathfind>') && p.status;
  })[0];

  let blockingRegionTag = Number(plugin.parameters["Blocking Tile Tag"]);
  let blockingTerrainTag = Number(plugin.parameters["Blocking Terrain Tag"]);
  let pathfindingStep = Number(plugin.parameters["Pathfinding step"]);

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
   * @Deprecated
   */
  RTBS_Enemy.prototype.pathfindTo = function(other) {
    if (typeof other == "number") {
      // let interpreter = $gameMap._interpreter;
      // console.log(interpreter);
      if (other == -1) {
        // TODO: Player can hide again (enemy goes to last known location)
        this.pathFindToPlayer();
      } else {
        // get event
        let _event = $gameMap.event(other);
        this.pathfindTarget = {x: _event.x, y: _event.y};
      }
    } else if (other != null) {
      // pathfind to location;
      this.pathfindTarget = other;
    }
  };


  RTBS_Enemy.prototype.pathfindToPlayer = function() {
    this.pathfindTarget = {x: $gamePlayer.x, y: $gamePlayer.y};
  }

  RTBS_Enemy.prototype.stopPathfind = function() {
    this.pathfindTarget = null;
  }

  RTBS_Enemy.prototype.isPointInPathfindRadius = function(x, y) {
    return Jomy.PathFind.isPointInCircle(this.event.x, this.event.y, this.pathfindRadius, x, y);
  }

  RTBS_Enemy.prototype.isPointInRadius = function(x, y, radius) {
    return Jomy.PathFind.isPointInCircle(this.event.x, this.event.y, radius, x, y);
  }

  let nextCall = 0;
  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let time = performance.now();

    if (nextCall < time) {
      nextCall = time + pathfindingStep; // TODO: dynamically set pathfinding step
      for (let enemy of $rtbs_manager.enemies) {
        if (enemy.pathfindRadius != null) {
          if (
            Jomy.PathFind.isPointInCircle(enemy.event.x, enemy.event.y, enemy.pathfindRadius, $gamePlayer.x, $gamePlayer.y)
            && (
              Jomy.PathFind.isPointInFrontOf(enemy.event.x, enemy.event.y, enemy.event.direction(), $gamePlayer.x, $gamePlayer.y)
              || Jomy.PathFind.isPointCloseTo(enemy.event.x, enemy.event.y, $gamePlayer.x, $gamePlayer.y)
            )
            && !Jomy.PathFind.isPointBlockedByObjects(enemy.event.x, enemy.event.y, $gamePlayer.x, $gamePlayer.y, enemy.pathfindRadius * 4, wallObjects)
          ) {
            enemy.pathfindToPlayer();
          }
        }

        // Move enemies
        let mapW = $gameMap.width();
        let mapH = $gameMap.height();
        if (enemy.pathfindTarget != null) {
          let distance = Jomy.PathFind.$manager.getDistance(enemy.pathfindTarget);
          let enemyDist = distance.get({x: enemy.event.x, y: enemy.event.y});
          for (let pos of [
            {x: enemy.event.x + 1, y: enemy.event.y},
            {x: enemy.event.x, y: enemy.event.y + 1},
            {x: enemy.event.x - 1, y: enemy.event.y},
            {x: enemy.event.x, y: enemy.event.y - 1}
          ]) {
            if (pos.x < 0 || pos.y < 0 || pos.x > mapW || pos.y > mapH) continue;
            let newDist = distance.get(pos)
            if (newDist != 0 && newDist < enemyDist) {
              if ($gameMap.eventIdXy(pos.x, pos.y) == 0) {
                enemy.event.setTarget(null, pos.x, pos.y);
                break;
              }
            } else if (newDist == 0) {
              enemy.event.turnTowardPlayer();
            }
          }
        }
      } // endfor enemies
    } // endif
  }
})();
