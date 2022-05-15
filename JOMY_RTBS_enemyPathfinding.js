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
* - `WanderRadius: <value>`: The radius in which an enemy can wander. This will
* enable wandering for this enemy.
* - `WanderTime: <value>`: The amount of pathfinding steps an enemy waits before
* wandering to a new location. This has to be a whole number (default: 1, which
* would be half a second if using the default pathfinding step).
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

    let wander = false;
    let w_radius = 0;
    let w_time = 1;
    if (comment == null) return;
    switch (comment.getKey()) {
      case "PathfindRadius":
        enemy.pathfindRadius = Number(comment.getValue());
        break;
      case "WanderRadius":
        wander = true;
        w_radius = Number(comment.getValue());
        break;
      case "WanderTime":
        w_time = Number(comment.getValue());
        break;
    }

    if (wander)
      enemy.wander(w_radius, w_time);
  };

  // Add pathfinding to enemy
  /** Let the enemy pathfind to a location
   * other = eventId
   * other = -1: player
   * other = { x: number, y: number }: location
   * @Deprecated
   */
  RTBS_Enemy.prototype.pathfindTo = function(other) {
    this.allowNewPath = false;
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
  };

  RTBS_Enemy.prototype.stopPathfind = function() {
    this.pathfindTarget = null;
  };

  RTBS_Enemy.prototype.isPointInPathfindRadius = function(x, y) {
    return Jomy.PathFind.isPointInCircle(this.event.x, this.event.y, this.pathfindRadius, x, y);
  };

  RTBS_Enemy.prototype.isPointInRadius = function(x, y, radius) {
    return Jomy.PathFind.isPointInCircle(this.event.x, this.event.y, radius, x, y);
  };

  /** Wander to a random location once in the given radius */
  RTBS_Enemy.prototype.wanderToRandomLocation = function(radius) {
    this.pathfindTo({
      x: Math.round(this.event.x + (Math.random() * radius * 2 - radius)),
      y: Math.round(this.event.y + (Math.random() * radius * 2 - radius)),
    });
    this.allowNewPath = true;
  };

  /** Let the enemy wander
   * @param radius {number} - The radius in which to wander from the current enemy position
   * @param time {number} - The amount of pathfinding steps before attempting to wander to another location (whole number)
   */
  RTBS_Enemy.prototype.wander = function(radius, time) {
    this.isWandering = true;
    this.wander_time = time;
    this.wander_steps = 0;
    let x = this.event.x;
    let y = this.event.y;
    this._randomWander = function() {
      this.pathfindTo({
        x: Math.round(x + (Math.random() * radius * 2 - radius)),
        y: Math.round(y + (Math.random() * radius * 2 - radius)),
      });
      this.allowNewPath = true;
    }
  };

  RTBS_Enemy.prototype.stopWander = function() {
    this.isWandering = false;
  };

  /** Let the enemy wander, without staying in a fixed radius
   * @param radius {number} - The radius in which to wander from the current enemy position
   * @param time {number} - The amount of pathfinding steps before attempting to wander to another location
   */
  RTBS_Enemy.prototype.wanderUnfixed = function(radius, time) {
    // TODO
  };

  RTBS_Enemy.prototype.stopWanderUnfixed = function() {
    // TODO
  };

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
      nextCall = time + pathfindingStep;

      for (let enemy of $rtbs_manager.enemies) {
        ////////////////////////////
        // Wander to new location //
        ////////////////////////////
        if (enemy.isWandering) {
          enemy.wander_steps += 1;
          if (enemy.wander_steps == enemy.wander_time) {
            enemy.wander_steps = 0;
            enemy._randomWander();
          }
        }

        /////////////////////////////////////////
        // Set new location if target in sight //
        /////////////////////////////////////////
        if (enemy.pathfindRadius == null) continue;
        if (Imported.JOMY_RTBS_NPCFighters) {
          if (enemy.pathfindTarget == null || enemy.allowNewPath) {
            // Get first close battler or player
            // TODO: check target enemy is targetting currently first!!
            if (Math.round(Math.random()) == 0) {
              let isPathfinding = enemy.pathfindToPlayerIfInSight();
              if (!isPathfinding && Jomy.Core.utils.isIterable($rtbs_manager.battlers)) {
                for (let target of $rtbs_manager.battlers) {
                  if (enemy.pathfindToEventIfInSight(target._event)) {
                    enemy.pathfindBattler = target;
                    break;
                  }
                }
              }
            } else {
              let isPathfinding = false;
              if (Jomy.Core.utils.isIterable($rtbs_manager.battlers)) {
                for (let target of $rtbs_manager.battlers) {
                  if (enemy.pathfindToEventIfInSight(target._event)) {
                    enemy.pathfindBattler = target;
                    isPathfinding = true;
                    break;
                  }
                }
              }
              if (!isPathfinding)
                enemy.pathfindToPlayerIfInSight();
            }
          } else {
            if (enemy.pathfindTargetIsPlayer) {
              enemy.pathfindToPlayerIfInSight()
            }
          }
        } else {
          // Only check player
          enemy.pathfindToPlayerIfInSight();
        }

        //////////////////
        // Move enemies //
        //////////////////
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
              if (enemy.pathfindTargetIsPlayer) {
                enemy.event.turnTowardPlayer();
              } else if (enemy.pathfindTarget instanceof Game_Event || enemy.pathfindTarget instanceof Game_Character) {
                enemy.event.turnTowardCharacter(enemy.pathfindTarget);
              }
            }
          }
        } // end enemy pathfind
      } // endfor enemies
    } // endif
  } // end game loop
})();
