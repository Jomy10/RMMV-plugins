/*:
* @author Jonas Everaert
* @plugindesc Adds an npc companion to the player.
*
* @help
* Add <companion> to the note tag of a event
*
* This plugin requires Shaz' Smart Pathfinding
*
* Add a comment to your comanion event "FollowFrequency: <value>" to set the
* follow frequency (in milliseconds)
*
* Add a comment to your companion event "WanderFrequency: <value>" to set the
* wander frequency (in milliseconds) (set to -1 to disable wandering)
*
* You can use Game_Event.companion in scripting to access the companion object.
* Game_Event.companion.abortMovement() will stop all movement of the companion.
* Game_Event.companion.resumeMovement() will resume its movement behaviour.
*
* You can also add <RTBS-battler> to the note of the event to make the
* companion fight off enemies when using the RTBS plugins
*/

// TODO: make the companion face the same direction as the player most of the times when wandering
// and always when going to the player

class _Companion {
  constructor(event, followFrequency = 2500, wanderFrequency = 7500) {
    this._event = event;
    this.nextFollowEvent = 0;
    this.followFrequency = followFrequency;
    this.wanderFrequency = wanderFrequency;
    this.abortMovement = false;

    // RTBS-battler integration
    this.isBattler = (event.event().meta["RTBS-battler"]) || false;
    this.battler = $rtbs_manager.findBattlerWithUUID(event.rtbs_battler_id);
    if (this.isBattler && this.battler == null) {
      console.error("Couldn't find battler");
    }
  }

  abortMovement() {
    this.abortMovement = true;
  }

  resumeMovement() {
    this.abortMovement = false;
  }

  /** Let the npc wander around*/
  wander() {
    if (this.isBattler && this.battler.pathfindTarget != null) return;
    if (this.abortMovement || this.wanderFrequency == -1) return;

    let elapsedSeconds = performance.now();

    if (this.nextFollowEvent < elapsedSeconds) {
      this.nextFollowEvent = elapsedSeconds + this.wanderFrequency;
    } else {
      return;
    }

    let x, y;
    if (this._event.x > $gamePlayer.x) {
      x = $gamePlayer.x + Math.round(Math.random() * 3);
    } else {
      x = $gamePlayer.x - Math.round(Math.random() * 3);
    }

    if (this._event.y > $gamePlayer.y) {
      y = $gamePlayer.y + Math.round(Math.random() * 3);
    } else {
      y = $gamePlayer.y - Math.round(Math.random() * 3);
    }

    this._event.setTarget(null, x, y);
  }

  /** Let the npc go near the player */
  goToPlayer() {
    if (this.isBattler && this.battler.pathfindTarget != null) return;
    if (this.abortMovement) return;

    let elapsedSeconds = performance.now();

    if (this.nextFollowEvent < elapsedSeconds) {
      this.nextFollowEvent = elapsedSeconds + this.followFrequency;
    } else {
      return;
    }

    let playerDir = Jomy.Core.utils.rmmvDirToGameDir($gamePlayer.direction());

    let x, y;
    switch (playerDir) {
      case 0: // up
        x = $gamePlayer.x - Math.round(Math.random() * 3);
        y = $gamePlayer.y + Math.round(Math.random() * 3);
        break;
      case 3: // left
        x = $gamePlayer.x + Math.round(Math.random() * 3);
        y = $gamePlayer.y + Math.round(Math.random() * 3);
        break;
      case 2: // down
        x = $gamePlayer.x + Math.round(Math.random() * 3);
        y = $gamePlayer.y - Math.round(Math.random() * 3);
        break;
      case 1: // right
        x = $gamePlayer.x - Math.round(Math.random() * 3);
        y = $gamePlayer.y - Math.round(Math.random() * 3);
        break;
    }

    this._event.setTarget(null, x, y);
  }

  // TODO: if player close: move out of the way
}

(function() {
  let companions = [];

  // Map load
  let onMapLoad = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    onMapLoad.call(this);

    companions = [];
    let events = $gameMap.events();

    for (let event of events) {
      if (event.event().meta["companion"]) {
        // Read comments
        let followFreq = 2500;
        for (let line of event.event().pages[0].list) {
          if (line.code != 108) { continue; }
          for (let param of line.parameters) {
            let comment = Jomy.Core.utils.parseComment(param);
            if (comment == null) continue;
            if (comment.getKey() == "FollowFrequency") {
              followFreq = Number(comment.getValue());
            }
          }
        }

        // Add companion
        let comp = new _Companion(event, followFreq);
        companions.push(comp);
        event.companion = comp; // Use in scripting
      }
    }
  }; // end on map load

  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    for (let companion of companions) {
      // console.log(companion.lastFollowEvent, companion.lastFollowEvent + companions.followFrequency, elapsedSeconds);
      if (companion._event.x > $gamePlayer.x - 4 && companion._event.x < $gamePlayer.x + 4
       && companion._event.y > $gamePlayer.y - 4 && companion._event.y < $gamePlayer.y + 4) {
        companion.wander();
      } else {
        companion.goToPlayer();
      }
    }
  };
})();

var Imported = Imported || {};
Imported.Jomy_Companion = true;

var Jomy = Jomy || {};
Jomy.Companion = _Companion;
