/*:
* @author Jonas Everaert
* @plugindesc Pathfinding for enemies
* <be.jonaseveraert.mv.RTBS.pathfind>
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

  let pathfindingStep = Number(plugin.parameters["Pathfinding step"]);

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
    this.pathfindTargetIsPlayer = false;
    if (typeof other == "number") {
      if (other == -1) {
        // Player can hide again (enemy goes to last known location)
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
    this.pathfindTargetIsPlayer = true;
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

  /** Pathfind to a {GAME_Event}
   * @returns {boolean} - wheter event was in sight
   */
  RTBS_Enemy.prototype.pathfindToEventIfInSight = function(event) {
    if (event == null) return false;
    if (Jomy.PathFind.checkLineOfSight(this.event.x, this.event.y, this.pathfindRadius, this.event.direction(), Jomy.PathFind.$manager.fieldBlockingPositions, event.x, event.y)) {
      this.pathfindTo(event);
      return true;
    }
    return false;
  };

  RTBS_Enemy.prototype.pathfindToPlayerIfInSight = function() {
    if (Jomy.PathFind.checkLineOfSight(this.event.x, this.event.y, this.pathfindRadius, this.event.direction(), Jomy.PathFind.$manager.fieldBlockingPositions, $gamePlayer.x, $gamePlayer.y)) {
      this.pathfindToPlayer();
      return true;
    }
    return false;
  };

  let nextCall = 0;
  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let time = performance.now();

    if (nextCall < time) {
      nextCall = time + pathfindingStep; // TODO: dynamically set pathfinding step

      EnemiesLoop:
      for (let enemy of $rtbs_manager.enemies) {
        if (enemy.pathfindRadius != null) {
          if (Imported.JOMY_RTBS_NPCFighters) {
            // Get first close battler or player
            if (Math.round(Math.random()) == 0) {
              let isPathfinding = enemy.pathfindToPlayerIfInSight();
              if (!isPathfinding) {
                for (let target of $rtbs_manager.battlers) {
                  if (enemy.pathfindToEventIfInSight(target._event)) {} break;
                }
              }
            } else {
              let isPathfinding = false;
              for (let target of $rtbs_manager.battlers) {
                if (enemy.pathfindToEventIfInSight(target._event)) {
                  isPathfinding = true;
                  break;
                }
              }
              if (!isPathfinding)
                enemy.pathfindToPlayerIfInSight();
            }
          } else {
            // Only check player
            enemy.pathfindToPlayerIfInSight();
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
              if ($gameMap.eventIdXy(pos.x, pos.y) == 0) { // if position they want to walk in is not an event
                enemy.event.setTarget(null, pos.x, pos.y);
                break;
              }
            } else if (newDist == 0) {
              if (this.pathfindTargetIsPlayer) {
                enemy.event.turnTowardPlayer();
              } else if (enemy.pathfindTarget instanceof Game_Event || enemy.pathfindTarget instanceof Game_Character) {
                enemy.event.turnTowardCharacter(enemy.pathfindTarget);
              }
            }
          }
        } // end enemy pathfind
      } // endfor enemies
    } // endif
  }
})();
