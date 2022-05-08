/*:
* @author Jonas Everaert
* @plugindesc Jomy's Real Time Battle System
* <be.jonaseveraert.mv.RTBS>
*
* @param Attack button
* @type text
* @default e
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
*/

var Imported = Imported || {};
Imported.JOMY_rtbs_core = true;

class RTBS_Enemy {
  constructor(id, event) {
    this.id = id;
    this.event = event;
    this.lastAttack = 0;
  }

  /** Called when enemy attacks */
  attackTarget(target, attackTime) {
    // Player
    let playerHP = target.hp;
    target.setHp(playerHP - this.attack);
    this.lastAttack = attackTime;
    console.log("Player HP:", target.hp);
    this._onAttackTarget(target);
  }

  /** Meant to be overriden */
  _onAttackTarget(target) {}

  /** Called when the enemy is attacked */
  getsAttacked(damage) {
    console.log(damage);
    this.health -= damage;
    console.log("Enemy HP:", this.health);
    if (this.health <= 0) {
      console.log("Enemy is dead"); // TODO
    }
  }
}

class RTBS_Manager {
  constructor() {
    this.enemies = [];
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  findEnemyWithUUID(uuid) {
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
          if (comment.getKey() == "rtbs_enemy_id") {
            let enemy_uuid = comment.getValue();
            let enemy = this.findEnemyWithUUID(enemy_uuid);
            enemy.getsAttacked($rtbs_player.rtbs.atk());
            this._onPlayerAttacks(event);
            missed = false
          }
        } // end for param
      } // end for line
    } // endif event != null
    if (missed) this._onPlayerMissed();
  } // end func

  /** Method meant to be overwritten by extension plugins
   *  Called when the player succesfully lands an attack
   */
  _onPlayerAttacks(target) {}
  _onPlayerMissed(time) {}

  /** Parse enemy event */
  getEnemy(_event) {
    let event = _event.event();
    let eventScript = event.pages[0].list;

    let attack = 0;
    let health = 0;
    let speed = 1000;
    const id = Jomy.Core.utils.genUUID();

    let enemy = new RTBS_Enemy(id, _event);

    // Get comments
    for (let line of eventScript) {
      if (line.code != 108) { continue; }
      for (let param of line.parameters) {
        let comment = Jomy.Core.utils.parseComment(param);

        switch (comment.getKey()) {
          case "Attack":
            attack = Number(comment.getValue());
            break;
          case "Health":
            health = Number(comment.getValue());
            break;
          case "Speed":
            speed = Number(comment.getValue());
            break;
          default:
            this._onDefaultEnemyCommentKey(comment, enemy);
        }
      }
    }

    enemy.attack = attack;
    enemy.health = health;
    enemy.speed = speed;

    // Add an identifier to the event that matches the enemy's uuid
    eventScript.push(
      {code: 108, ident: 0, parameters: [`rtbs_enemy_id: ${id}`]}
    )
    $rtbs_manager.addEnemy(enemy);
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
          return $rtbs_player.rtbs.equippedWeapon.atk;
      }
    };

    // Get all events
    let events = $gameMap.events();
    for (let _event of events) {
      let event = _event.event();
      // Handle enemy events
      if (event.meta["RTBS-enemy"] == true) {
        $rtbs_manager.getEnemy(_event);
      }
    }
  };

  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let elapsedSeconds = performance.now();

    // Check if enemy attacks
    $rtbs_manager.enemies.forEach((enemy) => {
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

      if ($gamePlayer.x == positionCheck.x && $gamePlayer.y == positionCheck.y && ((enemy.lastAttack + enemy.speed) <= elapsedSeconds)) {
        console.log("attacking");
        enemy.attackTarget($rtbs_player, elapsedSeconds);
      }
    });

    // Check if player is dead
    if ($rtbs_player.hp == 0) {
      console.log("dead");
      $rtbs_player.setHp($rtbs_player.mhp);
    }
  }; // end game loop
})();
