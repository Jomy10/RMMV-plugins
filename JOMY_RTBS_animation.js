/*:
* @author Jonas Everaert
* @plugindesc this plugin adds animations to the RTBS system
*
* @param Player event id
* @desc the event id of the event that was created on the `Spawn Map Id` assigned in GALV's Event Spawner plugin parameters.
* @default 1
*
* @help
* == Setup ==
* === Required plugins (place above this one) ===
* - JOMY_RTBS_Core
* - JOMY_playerFollower
*
* == Additional enemy comments ==
* - `AttackAnimationId: <value>`: The animation id to play when the enemy attacks
*
*/

var Imported = Imported || {};
Imported.JOMY_rtbs_animation = true;

var Jomy = Jomy || {};
Jomy.RTBS_Animation = {};
Jomy.RTBS_Animation.$animationEvent = null;

function err(msg) {
  console.error(msg);
  window.alert(msg);
}

const RTBS_Animation = {
  playPlayerAttackAnimation: function(target) {
    // Get animation ids
    let animationIds = (function() {
      if ($rtbs_player.rtbs.equippedWeapon == null)
        return [$rtbs_player.rtbs.fistAnimationId, $rtbs_player.rtbs.fistAnimationId, $rtbs_player.rtbs.fistAnimationId, $rtbs_player.rtbs.fistAnimationId];
      else
        return $rtbs_player.rtbs.equippedWeapon.animationIds;
    })();

    // Get direction
    let pos = { x: $gamePlayer.x, y: $gamePlayer.y };
    let animationId = 1;
    switch ( Jomy.Core.utils.rmmvDirToGameDir($gamePlayer._direction) ) {
      // up
      case 0: pos.y -= 1; animationId = animationIds[0]; break;
      // right
      case 1: pos.x += 1; animationId = animationIds[3]; break;
      // down
      case 2: pos.y += 1; animationId = animationIds[1]; break;
      // left
      case 3: pos.x -= 1; animationId = animationIds[2]; break;
    }

    // Show animation
    if (target == null) {
      _JOMY_RTBS_PlayAnimationAt(pos.x, pos.y, animationId);
    } else {
      target.requestAnimation(animationId)
    }
  },
  playEnemyAttackAnimation: function(enemy, type, target) {
    if (type == "player") {
      $gamePlayer.requestAnimation(enemy.attackAnimationId || 1);
      // _JOMY_RTBS_PlayAnimationAt($gamePlayer.x, $gamePlayer.y, enemy.attackAnimationId);
    } else if (type == "battler") {
      target._event.requestAnimation(enemy.attackAnimationId || 1);
    } else if (type == "event") {
      target.requestAnimation(enemy.attackAnimationId || 1);
    }
  }
};

function _JOMY_RTBS_PlayAnimationAt(x, y, animationId) {
  if (Jomy.RTBS_Animation.$animationEvent == null) {
    console.error("No event for playing animations found");
    return;
  }
  Jomy.RTBS_Animation.$animationEvent._x = x;
  Jomy.RTBS_Animation.$animationEvent._y = y;
  Jomy.RTBS_Animation.$animationEvent.requestAnimation(animationId);
}

(function () {
  /*
  if (!Imported.JOMY_rtbs_core) {
    err("Unimported: Jomy_RTBS_Core");
  }
  if (!Imported.JOMY_playerFollower) {
    err("Unimported: JOMY_playerFollower");
  }
  */

  // Collect enemy comments
  let onDefaultEnemyCommentKey = RTBS_Manager.prototype._onDefaultEnemyCommentKey;
  RTBS_Manager.prototype._onDefaultEnemyCommentKey = function(comment, enemy) {
    onDefaultEnemyCommentKey.call(this);
    if (comment == null) return;
    switch (comment.getKey()) {
      case "AttackAnimationId":
        enemy.attackAnimationId = Number(comment.getValue());
        break;
    }
  };

  // Add animations
  let onMiss = RTBS_Manager.prototype._onPlayerMissed;
  RTBS_Manager.prototype._onPlayerMissed = function(time) {
    onMiss.call(this);
    RTBS_Animation.playPlayerAttackAnimation(null);
  };

  let onPlayerAttacks = RTBS_Manager.prototype._onPlayerAttacks;
  RTBS_Manager.prototype._onPlayerAttacks = function(target) {
    onPlayerAttacks.call(this);
    RTBS_Animation.playPlayerAttackAnimation(target);
  };

  let onEnemyAttacks = RTBS_Enemy.prototype._onAttackTarget;
  RTBS_Enemy.prototype._onAttackTarget = function(target) {
    onEnemyAttacks.call(this);

    if (target instanceof Game_Actor) {
      RTBS_Animation.playEnemyAttackAnimation(this, "player", null);
    } else if (target instanceof RTBS_Battler) {
      RTBS_Animation.playEnemyAttackAnimation(this, "battler", target);
    }
  };

  // Map load
  let mapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    mapLoaded.call(this);

    if (!(Jomy.Core.utils.isInMenu())) { // not in a menu (including main menu)
      // Get the setup event
      Jomy.RTBS_Animation.$animationEvent = function() {
        if ($dataMap != null) {
          for (eventId in $dataMap.events) {
            let event = $gameMap.event(eventId);

            if (event == null) continue;
            try {
              let _event = event.event();

              if (_event.note.contains("<RTBS-setup>")) {
                return event;
              }
            } catch {
              console.error("RTBS-setup is not present");
            }
          }
        }
      }();

      if (Jomy.RTBS_Animation.$animationEvent == null) {
        console.log("Missing <RTBS-setup> event");
      }

      if (Jomy.RTBS_Animation.$animationEvent != null) {
        Jomy.RTBS_Animation.$animationEvent.setPriorityType(2);
        Jomy.RTBS_Animation.$animationEvent.setMoveSpeed(999999999);
      } else {
        console.error("No event with <RTBS-setup> note");
      }
    }
  };
})();
