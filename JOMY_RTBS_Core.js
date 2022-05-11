/*:
* @author Jonas Everaert
* @plugindesc Jomy's Real Time Battle System
* <be.jonaseveraert.mv.RTBS>
*
* @param Attack button
* @type text
* @default e
*
* @param HPBar shown default
* @desc Show hp bar by default. Only works when JOMY_RTBS_HealthBar is insalled
* @type boolean
* @default false
*
* @help
* = Setup =
* Add an event with an id of "<RTBS-setup>" to every map in your game.
*
* == Setting up an enemy ==
* 1. Add a new event to the map.
* 2. In the note page, add <RTBS-enemy>
* 3. Give your enemy an image
* 3. Add comments to customize the enemy
*
* === Enemy comments ===
* - `Attack: <value>`: The enemy's attack damage
* - `Health: <value>`: The total health of the enemy
* - `Speed: <value>`: The attack speed of the enemy in miliseconds (e.g. 1500 = 1.5 seconds)
*
* === Handle enemy death ===
* Add another event page to the enemy event and the Self Switch condition to A.
*
* NOTE: The enemy's event page should always be the first event page
*/

var Imported = Imported || {};
Imported.JOMY_rtbs_core = true;

var Jomy = Jomy || {};
Jomy.RTBS_Core = {version: 1.0};

class RTBS_Enemy {
  constructor(_event) {
    this.id = Jomy.Core.utils.genUUID();
    this.event = _event;
    this.lastAttack = 0;

    if (_event._pageIndex != 0) return;

    let event = _event.event();
    let eventScript = event.pages[0].list;

    this.attack = 0;
    this.health = 0;
    this.maxHp = 0;
    this.speed = 1000;
    this.hpBarShown = $rtbs_manager.defaults.hpBarShown; //

    // Get comments
    for (let line of eventScript) {
      if (line.code != 108) { continue; }
      for (let param of line.parameters) {
        let comment = Jomy.Core.utils.parseComment(param);
        if (comment == null) continue;

        switch (comment.getKey()) {
          case "Attack":
            this.attack = Number(comment.getValue());
            break;
          case "Health":
            this.health = Number(comment.getValue());
            this.maxHp = Number(comment.getValue());
            break;
          case "Speed":
            this.speed = Number(comment.getValue());
            break;
          // HP Bar plugin compatibility
          case "HPBar":
            this.hpBarShown = comment.getValue().toLowerCase() == "shown";
            this.event.displayHPBar(this);
            break;
          default:
            $rtbs_manager._onDefaultEnemyCommentKey(comment, this);
        }
      }
    }

    // Add an identifier to the event that matches the enemy's uuid
    eventScript.push(
      {code: 108, ident: 0, parameters: [`rtbs_enemy_id: ${this.id}`]}
    )
    $rtbs_manager.addEnemy(this);
  }

  getHp() {
    return this.health;
  }

  maxHp() {
    return this.maxHp;
  }

  /** Called when enemy attacks a player */
  attackTarget(target, attackTime) {
    // Player
    let playerHP = target.hp;
    target.setHp(playerHP - this.attack);
    this.lastAttack = attackTime;
    console.log("Player HP:", target.hp);
    this._onAttackTarget(target);
  }

  /** Called when enemy attacks a battler */
  attackEventTarget(target, attackTime) {
    let targetDead = target.getsAttacked(this.attack);
    this.lastAttack = attackTime;
    this._onAttackTarget(target);
    if (targetDead && Imported.Jomy_RTBS_enemyPathfind) {
      console.log(this.pathfindTarget, "is dead");
      this.pathfindBattler = null;
      this.pathfindTarget = null;
      console.log(this.pathfindTarget, "now");
    }
  }

  /** Meant to be overwritten */
  _onAttackTarget(target) {}

  /** Called when the enemy is attacked
   * @param damage {number} - The amount of damage the enemy should take
   * @return {boolean} - True if the enemy is dead
   */
  getsAttacked(damage) {
    if (this.dead) return true;

    this.health -= damage;
    console.log("Enemy HP:", this.health);
    if (this.health <= 0) {
      $gameSelfSwitches.setValue([$gameMap.mapId(), this.event.eventId(), 'A'], true);
      $rtbs_manager.removeEnemy(this.id);
      // Clear event's pathfinding
      if (Imported.Jomy_RTBS_enemyPathfind)
        this.event.clearTarget();

      // Remove hp bar
      this.hpBarShown = false;
      this.event.removeHPBar();

      this.dead = true;

      return true;
    } else {
      return false;
    }
  }
}

class RTBS_Manager {
  constructor() {
    this.enemies = [];
    this.defaults = {
      hpBarShown: false
    };
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  removeEnemy(enemyId) {
    this.enemies = this.enemies.filter((e) => { return e.id != enemyId; });
  }

  findEnemyWithUUID(uuid) {
    uuid = Number(uuid);
    for (let enemy of this.enemies) {
      if (enemy.id == uuid) {
        return enemy;
      }
    }
  }

  findEnemyEventWithUUID(uuid) {
    let events = $gameMap.events();
    for (let _event of events) {
      let event = _event.event();
      // Handle enemy events
      for (let line of event.pages[0].list) {
        if (line.code != 108) { continue; }
        for (let param of line.parameters) {
          let comment = Jomy.Core.utils.parseComment(param);
          if (comment == null) continue;
          if (comment.getKey() == "rtbs_enemy_id" && comment.getValue() == uuid) {
            return _event;
          }
        }
      }
    }
  }

  /** Called when the player attacks */
  playerAttacks() {
    // TODO: check equipped weapon
    let time = performance.now();
    if ($rtbs_player.rtbs.lastAttack + $rtbs_player.rtbs.speed > time) { return; } // Player can't attack

    $rtbs_player.rtbs.lastAttack = time;

    let missed = true;
    let event = Jomy.eventDetection.getEventInFrontOfPlayer(1);
    if (event != null) {
      for (let line of event.event().pages[0].list) {
        if (line.code != 108) { continue; }
        for (let param of line.parameters) {
          let comment = Jomy.Core.utils.parseComment(param);
          if (comment == null) continue;
          if (comment.getKey() == "rtbs_enemy_id") {
            let enemy_uuid = comment.getValue();
            let enemy = this.findEnemyWithUUID(enemy_uuid);
            if (enemy == null) {
              console.error("Found no enemy in front of player")
            } else {
              enemy.getsAttacked($rtbs_player.rtbs.atk());
              this._onPlayerAttacks(event);
              missed = false
            }
          }
        } // end for param
      } // end for line
    } // endif event != null
    if (missed) this._onPlayerMissed();
  } // end func

  /** Method meant to be overwritten by extension plugins
   *  Called when the player succesfully lands an attack
   *  @param target {Game_Event} - the target of the attack
   */
  _onPlayerAttacks(target) {}
  _onPlayerMissed(time) {}

  // TODO: move to constructor of RTBS_Enemy
  /** Parse enemy event */
  getEnemy(_event) {
    new RTBS_Enemy(_event);
  }

  /** Meant to be override */
  _onDefaultEnemyCommentKey(comment, enemy) {}
}

let $rtbs_manager = new RTBS_Manager();
let $rtbs_player = null;

/** Reset when a map is loaded */
function reset_rtbs() {
  $rtbs_manager = new RTBS_Manager();
}

Jomy.RTBS_Core.RTBS_EventsHandle = new Map();

// init
(function() {
  // Check requirements
  if (!Imported.JOMY_Core) {
    console.error("Unimported: Jomy_Core");
    Graphics.printError("Unimported", "Jomy_Core"); // TODO: fix
  }
  if (!Imported.JOMY_inputManager) {
    console.error("Unimported: Jomy_inputManager");
    Graphics.printError("Unimported", "Jomy_inputManager");
  }
  if (!Imported.JOMY_eventDetection) {
    console.error("Unimported: Jomy_eventDetection");
  }

  // get plugin params
  let plugin = $plugins.filter(function(p) {
      return p.description.contains('<be.jonaseveraert.mv.RTBS>') && p.status
  })[0];

  // Set key
  Jomy.InputManager.subTrigger(plugin.parameters["Attack button"], () => {
    $rtbs_manager.playerAttacks();
  });
  $rtbs_manager.defaults.hpBarShown = (plugin.parameters["HPBar shown default"].toLowerCase() == "true");

  // RTBS_Events: enemies
  Jomy.RTBS_Core.RTBS_EventsHandle.set("RTBS-enemy", function(event) { $rtbs_manager.getEnemy(event); });

  // On map load
  let map = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    map.call(this);
    // (re)initialize RTBS
    reset_rtbs();
    $rtbs_player = $gameParty.members()[0];
    $rtbs_player.rtbs = {
      lastAttack: 0,
      speed: 1000,
      equippedWeapon: null,
      atk: function() {
        // Default behaviour: no cumulative attack
        if ($rtbs_player.rtbs.equippedWeapon == null)
          return $rtbs_player.atk;
        else
          return $rtbs_player.rtbs.equippedWeapon.use();
      }
    };

    // Get all events
    let events = $gameMap.events();
    for (let _event of events) {
      let event = _event.event();
      // Handle enemy events
      for (let eventHandle of Jomy.RTBS_Core.RTBS_EventsHandle) {
        if (event.meta[eventHandle[0]])
          eventHandle[1](_event);
      }
    }
  };

  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    if (!(Jomy.Core.utils.isInMenu())) { // not in a menu (including main menu)
      let elapsedSeconds = performance.now();

      // Check if enemy attacks
      for (let enemy of $rtbs_manager.enemies) {
        let positionCheck = { x: enemy.event.x, y: enemy.event.y };
        switch ( Jomy.Core.utils.rmmvDirToGameDir(enemy.event._direction) ) {
          // up
          case 0:
            positionCheck.y -= 1;
            break;
          // right
          case 1:
            positionCheck.x += 1;
            break;
          // down
          case 2:
            positionCheck.y += 1;
            break;
          // left
          case 3:
            positionCheck.x -= 1;
            break;
        }

        if (enemy.pathfindTargetIsPlayer) {
          if ($gamePlayer.x == positionCheck.x && $gamePlayer.y == positionCheck.y && ((enemy.lastAttack + enemy.speed) <= elapsedSeconds)) {
            enemy.attackTarget($rtbs_player, elapsedSeconds);
          }
        } else {
          let battler = enemy.pathfindBattler;
          if (battler == null) return;
          if (battler._event.x == positionCheck.x && battler._event.y == positionCheck.y && ((enemy.lastAttack + enemy.speed) <= elapsedSeconds)) {
            enemy.attackEventTarget(battler, elapsedSeconds);
          }
        }
      }

      // Check if player is dead
      if ($rtbs_player.hp == 0) {
        console.log("dead");
        $rtbs_player.setHp($rtbs_player.mhp);
      }
    }
  }; // end game loop
})();
