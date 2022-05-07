/*:
* @author Jonas Everaert
* @plugindesc Move any event to the player
* <be.jonaseveraert.mv.playerFollower>
*
* @help
* Move any event marked with <player-follower> in the event's note section to
* the player.
*
* The plugin only checks when a scene is loadd wether there are any events with
* the tag. To make the plugin check for new events, call the following in a
* script call:
* JOMY_UpdatePlayerFollowerEvents();
*/

//===================================================================

var Imported = Imported || {};
Imported.JOMY_playerFollower = true;

var Jomy = Jomy || {};
Jomy.playerFollower = Jomy.playerFollower || {};
Jomy.playerFollower.version = 1.00;

//===================================================================

Jomy.playerFollower.eventTags = ["<player-follower>"];

/// gets the events indicated with "<player-follower>" in the notes
function _getPlayerLightEvents() {
    let events = [];
    if ($dataMap != null) {
        for (eventId in $dataMap.events) {
            const event = $gameMap.event(eventId);
            if (event != null) {
                for (let tag of Jomy.playerFollower.eventTags)
                  if (event.event().note.contains(tag)) {
                    events.push(eventId);
                  }
            }
        }
    }
    return events;
}

/// Event ids containing "<player-follower>"
let JOMY_player_follower_events = [];

function JOMY_UpdatePlayerFollowerEvents() {
  JOMY_player_follower_events = _getPlayerLightEvents();
}

(function() {
    let pluginParams = $plugins.filter(function(p) {
        return p.description.contains('<be.jonaseveraert.mv.playerFollower>') && p.status;
    })[0];

    // Get new events for new map player is transferred to
    /*
    let oldGamePlayer_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
    oldGamePlayer_performTransfer.call(this);
    events = getPlayerLightEvents();
    };
    */
    let mapLoad = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
      mapLoad.call(this);
      JOMY_UpdatePlayerFollowerEvents();
    }

    // Called every frame
    // Move event to player
    let update = Window_Base.prototype.update;
    Window_Base.prototype.update = function() {
        update.call(this);
        for (i = 0; i < JOMY_player_follower_events.length; i++) {
            let event = $gameMap._events[JOMY_player_follower_events[i]];
            //event.moveStraight(event.findDirectionTo($gamePlayer._realX, $gamePlayer._realY));
            event.setMoveSpeed($gamePlayer.realMoveSpeed());
            event.moveTowardPlayer();
        }
    };
})();
