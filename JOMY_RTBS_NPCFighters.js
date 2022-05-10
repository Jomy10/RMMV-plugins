/*:
* @author Jonas Everaert
* @plugindesc Make events fight any <RTBS-enemy>
* @help
* Mark an event with <RTBS-battler> in its note to make them hostile towards enemies.
*/

class RTBS_Battler {
  constructor(event) {
    this.id = Jomy.Core.utils.genUUID();
    this._event = event;
    this.lastAttack = 0;

    this.atk = 0;
    this.hp = 10;
    this.speed = 1000;

    let eventScript = event.pages[0].list;

    // Get comments
    for (let line of eventScript) {
      if (line.core != 108) continue;

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

  /** target: an RTBS_Enemy */
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
    this._event.setTarget(enemy.event);
  }

  getFirstCloseEnemy() {
    for (let enemy of $rtbs_manager.enemies) {
      if (Jomy.RTBS_PathFind.isPointInCircle(this._event.x, this._event.y, this.pathfindRadius, enemy.x, enemy.y)) {
        return enemy;
      }
    }
  }
}

(function() {
  if (!Imported.JOMY_Core) {
    console.error("Missing import: Jomy_Core");
  }
  if (!Imported.Jomy_RTBS_enemyPathfind) {
    console.error("Missing import: Jomy_RTBS_enemyPathfind");
  }

  // Additions
  let rtbsManConstr = RTBS_Manager.prototype.constructor;
  RTBS_Manager.prototype.constructor = function() {
    rtbsManConstr.call(this);

    this.battlers = [];
  };

  RTBS_Manager.prototype.addBattler = function(battler) {
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

  let nextCall = 0;
  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let time = performance.now();

    if (nextCall < time) {
      nextCall = time + 500;
      for (let bat of $rtbs_manager.battlers) {
        bat.getFirstCloseEnemy();
      }
    }
  }
})();
