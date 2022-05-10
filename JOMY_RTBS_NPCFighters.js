/*:
* @author Jonas Everaert
* @plugindesc Make events fight any <RTBS-enemy>
* @help
* Mark an event with <RTBS-battler> in its note to make them hostile towards enemies.
*
* @param Pathfinding step
* @desc
* The amount of miliseconds to wait before checking for a new path to a target
* @type number
* @default 500
*
* == Required plugins ==
* Requires Shaz' smart pathfinding plugin to be installed (above this plugin)
* Get it at: https://forums.rpgmakerweb.com/index.php?threads/smart-pathfinding.46761/
*
* Requires JOMY_PathfindCore
*
* Place them above this plugin
*/

var Imported = Imported || {};
Imported.JOMY_RTBS_NPCFighters = true;

class RTBS_Battler {
  /** @param event {Game_Event} - The Battler event */
  constructor(event) {
    this.id = Jomy.Core.utils.genUUID();
    this._event = event;
    // Time last attacked
    this.lastAttack = 0;
    // The {RTBS_Enemy} that this battler is following
    this.pathfindTarget = null;

    this.atk = 0;
    this.hp = 10;
    this.speed = 1000;

    let eventScript = event.event().pages[0].list;

    // Get comments
    for (let line of eventScript) {
      if (line.code != 108) continue;

      for (let param of line.parameters) {
        let comment = Jomy.Core.utils.parseComment(param);
        if (comment == null) continue;

        switch (comment.getKey()) {
          case "Attack":
            this.atk = Number(comment.getValue());
            break;
          case "Health":
            this.hp = Number(comment.getValue());
            break;
          case "Speed":
            this.speed = Number(comment.getValue());
            break;
          case "PathfindRadius":
            this.pathfindRadius = Number(comment.getValue());
            break;
          case "AttackAnimation":
            this.attackAnimationId = Number(comment.getValue());
            break;
          default:
            this._onDefaultCommentKey(comment);
        }
      }
    }

    // Add an identifier to the vent that matches the battler's uuid
    eventScript.push(
      {code: 108, ident: 0, parameters: [`rtbs_battler_id: ${this.id}`]}
    );

    $rtbs_manager.addBattler(this);

    event.rtbs_battler_id = this.id;
  } // end constructor

  _onDefaultCommentKey(comment) {}

  /** @param target {RTBS_Enemy} - an RTBS_Enemy */
  attackTarget(target, attackTime) {
    // let hp = target.health;
    // target.health = hp - this.atk;
    let isTargetDead = target.getsAttacked(this.atk);
    this.lastAttack = attackTime;
    this._onAttackTarget(target);
    if (isTargetDead) {
      this.pathfindTarget = null;
    }
  }

  _onAttackTarget(target) {}

  getsAttacked(damage) {
    this.hp -= damage;

    console.log("Battler HP:", this.hp);

    if (this.hp <= 0) {
      $gameSelfSwitches.setValue([$gameMap.mapId(), this._event.eventId(), 'A', true]);
      $rtbs_manager.removeBattler(this.id);
      // Clear event's pathfinding
      this._event.clearTarget();
      return true;
    } else {
      return false;
    }
  }

  pathfindTo(enemy) {
    this.pathfindTarget = enemy;
  }

  clearPathfinding() {
    this.pathfindTarget = null;
  }

  getFirstCloseEnemy() {
    for (let enemy of $rtbs_manager.enemies) {
      if (Jomy.PathFind.checkLineOfSight(this._event.x, this._event.y, this.pathfindRadius, this._event.direction(), Jomy.PathFind.$manager.fieldBlockingPositions, enemy.event.x, enemy.event.y)) {
        return enemy;
      }
    }
  }
}

(function() {
  if (!Imported.JOMY_Core) {
    console.error("Missing import: JOMY_Core");
  }
  if (!Imported.Jomy_RTBS_enemyPathfind) {
    console.error("Missing import: JOMY_RTBS_enemyPathfind");
  }
  if (!Imported.JOMY_PathfindCore) {
    console.error("Missing import: JOMY_PathfindCore");
  }

  let plugin = $plugins.filter(function(p) {
    return p.description.contains('<be.jonaseveraert.mv.RTBS.pathfind>') && p.status;
  })[0];
  let pathfindingStep = Number(plugin.parameters["Pathfinding step"]);

  // =========================================================================

  RTBS_Manager.prototype.addBattler = function(battler) {
    if (this.battlers == null)
      this.battlers = [];
    this.battlers.push(battler);
  };

  RTBS_Manager.prototype.removeBattler = function(battlerId) {
    this.battlers = this.battlers.filter((b) => { return b.id != battlerId });
  };

  RTBS_Manager.prototype.findBattlerWithUUID = function(uuid) {
    uuid = Number(uuid);
    for (let battler of this.battlers) {
      if (battler.id == uuid) {
        return battler;
      }
    }
  };

  // =========================================================================
  // Battler attack animation
  // =========================================================================

  let onBattlerAttacks = RTBS_Battler.prototype._onAttackTarget;
  RTBS_Battler.prototype._onAttackTarget = function(target) {
    onBattlerAttacks.call(this);

    RTBS_Animation.playEnemyAttackAnimation(this, "event", target.event);
  };

  // =========================================================================

  // Add RTBS battlers
  Jomy.RTBS_Core.RTBS_EventsHandle.set("RTBS-battler", function(event) { $rtbs_manager.addBattler(new RTBS_Battler(event)); });

  let nextCall = 0;
  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let time = performance.now();

    // pathfind
    if (nextCall < time && Jomy.Core.utils.isIterable($rtbs_manager.battlers)) {
      nextCall = time + pathfindingStep;
      for (let bat of $rtbs_manager.battlers) {
        // pathfind: set target
        if (bat.pathfindRadius == null) continue;
        let firstEnemyInSight = bat.getFirstCloseEnemy();
        if (firstEnemyInSight != null)
          bat.pathfindTo(firstEnemyInSight);

        // pathfind: move battler
        let mapW = $gameMap.width();
        let mapH = $gameMap.height();

        if (bat.pathfindTarget != null) {
          let distance = Jomy.PathFind.$manager.getDistance({x: bat.pathfindTarget.event.x, y: bat.pathfindTarget.event.y});
          let enemyDist = distance.get({x: bat._event.x, y: bat._event.y});
          for (let pos of [
            {x: bat._event.x + 1, y: bat._event.y},
            {x: bat._event.x, y: bat._event.y + 1},
            {x: bat._event.x - 1, y: bat._event.y},
            {x: bat._event.x, y: bat._event.y - 1}
          ]) {
            if (pos.x < 0 || pos.y < 0 || pos.x > mapW || pos.y > mapH) continue;
            let newDist = distance.get(pos);

            if (newDist != 0 && newDist < enemyDist) {
              if ($gameMap.eventIdXy(pos.x, pos.y) == 0) { // if position they want to walk in is not an event
                bat._event.setTarget(null, pos.x, pos.y);
                break;
              }
            } else if (newDist == 0) {
              bat._event.turnTowardCharacter(bat.pathfindTarget.event);
            }
          }
        }
      } // endfor battlers
    }

    // check if battler attacks
    if (!(SceneManager._scene instanceof Scene_Menu || SceneManager._scene instanceof Scene_Title)) {
      if (Jomy.Core.utils.isIterable($rtbs_manager.battlers))
        for (let battler of $rtbs_manager.battlers) {
          let posCheck = { x: battler._event.x, y: battler._event.y };
          switch (Jomy.Core.utils.rmmvDirToGameDir(battler._event.direction())) {
            // up
            case 0:
              posCheck.y -= 1;
              break;
            // right
            case 1:
              posCheck.x += 1;
              break;
            // down
            case 2:
              posCheck.y += 1;
              break;
            // left
            case 3:
              posCheck.x -= 1;
              break;
          }

          let target = battler.pathfindTarget;
          if (target == null)
            break;

          let enemy = target.event;
          if (enemy.x == posCheck.x && enemy.y == posCheck.y && ((battler.lastAttack + battler.speed) <= time)) {
            battler.attackTarget(target, time);
          }
        }
      // endif
    }
  }
})();
