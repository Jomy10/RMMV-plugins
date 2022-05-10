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
* Require's Shaz' smart pathfinding plugin to be installed (above this plugin)
* Get it at: https://forums.rpgmakerweb.com/index.php?threads/smart-pathfinding.46761/
*
* Requires JOMY_PathfindCore
*
* Place them above this plugin
*/

class RTBS_Battler {
  /** @param event {Game_Event} - The Battler event */
  constructor(event) {
    this.id = Jomy.Core.utils.genUUID();
    this._event = event;
    this.lastAttack = 0;

    this.atk = 0;
    this.hp = 10;
    this.speed = 1000;

    let eventScript = event.event().pages[0].list;

    // Get comments
    for (let line of eventScript) {
      if (line.code != 108) continue;

      for (let param of line.parameters) {
        let comment = Jomy.Core.utils.parseComment(param);

        switch (comment.getKey()) {
          case "Attack":
            this.atk = Nummber(comment.getValue());
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
          default:
            this._onDefaultCommentKey(comment);
        }
      }
    }

    // Add an identifier to the vent that matches the battler's uuid
    eventScript.push(
      {code: 108, ident: 0, parameters: [`rtbs_battle_id: ${this.id}`]}
    );

    $rtbs_manager.addBattler(this);
  } // end constructor

  _onDefaultCommentKey(comment) {}

  /** @param target {RTBS_Enemy} - an RTBS_Enemy */
  attackTarget(target, attackTime) {
    let hp = target.health;
    target.health = hp - this.atk;
    this.lastAttack = attackTime;
    this._onAttackTarget(target);
  }

  _onAttackTarget(target) {}

  getsAttacked(damage) {
    this.hp -= damage;

    if (this.hp <= 0) {
      $gameSelfSwitches.setValue([$gameMap.mapId(), this._event.eventId(), 'A', true]);
      $rtbs_manager.removeBattler(this.id);
      // Clear event's pathfinding
      this._event.clearTarget();
    }
  }

  pathfindTo(enemy) {
    // TODO: new pathfinding (like enemy in enemyPathfind)
    this._event.setTarget(enemy.event);
  }

  getFirstCloseEnemy() {
    // TODO: line of sight blocked views!
    // TODO: move line of sight to pathfind core
    for (let enemy of $rtbs_manager.enemies) {
      if (Jomy.PathFind.isPointInCircle(this._event.x, this._event.y, this.pathfindRadius, enemy.event.x, enemy.event.y)) {
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

  let onMapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    onMapLoaded.call(this);

    // TODO: add as an extension of RTBS, so itt doesn't have to loop twice
    // (once for enemies nad once for battlers)
    // Get all events
    let events = $gameMap.events();
    for (let event of events) {
      let _event = event.event();
      // Handle enemy events
      if (_event.meta["RTBS-battler"] == true) {
        $rtbs_manager.addBattler(new RTBS_Battler(event));
      }
    }
  }

  let nextCall = 0;
  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let time = performance.now();

    if (nextCall < time && Jomy.Core.utils.isIterable($rtbs_manager.battlers)) {
      nextCall = time + pathfindingStep;
      for (let bat of $rtbs_manager.battlers) {
        let firstEnemyInSight = bat.getFirstCloseEnemy();
        if (firstEnemyInSight != null)
          bat.pathfindTo(firstEnemyInSight);
      }
    }
  }
})();
