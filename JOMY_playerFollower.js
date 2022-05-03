/*:
* @author Jonas Everaert
* @plugindesc Move any event to the player
* <be.jonaseveraert.mv.playerFollower>
* 
* @help
* Move any event marked with <player-follower> in the event's note section to 
* the player.
*/

//===================================================================

var Imported = Imported || {};
Imported.JOMY_playerFollower = true;

var Jomy = Jomy || {};
Jomy.playerFollower = Jomy.playerFollower || {};
Jomy.playerFollower.version = 1.00;

//===================================================================

(function() {
    let pluginParams = $plugins.filter(function(p) {
        return p.description.contains('<be.jonaseveraert.mv.playerFollower>') && p.status;
    })[0];

    /// gets the events indicated with "<player-follower>" in the notes
    function getPlayerLightEvents() {
        let events = [];
        if ($dataMap != null) {
            for (eventId in $dataMap.events) {
                if ($gameMap.event(eventId) != null && $gameMap.event(eventId).event().note.contains("<player-follower>")) {
                    console.log($gameMap.event(eventId).event());
                    events.push(eventId);
                }
            }
        }
        return events;
    }

    /// Event ids containing "<player-follower>"
    let events = getPlayerLightEvents();

    // Get new events for new map player is transferred to
    let oldGamePlayer_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        oldGamePlayer_performTransfer.call(this);
        events = getPlayerLightEvents();
    };

    // Called every frame
    // Move event to player
    let update = Window_Base.prototype.update;
    Window_Base.prototype.update = function() {
        update.call(this);
        for (i = 0; i < events.length; i++) {
            let event = $gameMap._events[events[i]];
            //event.moveStraight(event.findDirectionTo($gamePlayer._realX, $gamePlayer._realY));
            event.setMoveSpeed($gamePlayer.realMoveSpeed());
            event.moveTowardPlayer();
        }
    };
})();
