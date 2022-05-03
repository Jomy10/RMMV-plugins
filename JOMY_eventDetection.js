/*:
* @author Jonas Everaert
* @plugindesc Cast a ray to detect events
* <be.jonaseveraert.mv.eventDetection>
* 
* @help
* Detect events in front of player:
* `JOMY$eventDetection.getFirstEvent()`
* `JOMY$eventDetection.getEvent()`
* `JOMY$eventDetection.getEventInFrontOfPlayer()`
*/

var Imported = Imported || {};
Imported.JOMY_eventDetection = true;

var Jomy = Jomy || {};
Jomy.eventDetection = Jomy.eventDetection || {};
Jomy.eventDetection.version = 1.00;

/** Detect events in front of the player */
class JOMY$eventDetection {
    /** get the first event in front of the player */
    static getFirstEvent() {
        // 2: down, 4: left, 6: right, 8: up
        let dir = $gamePlayer.direction();
        let x = $gamePlayer.x;
        let y = $gamePlayer.y;
        while (true) {
            let val = this.__nextTile(x, y, dir);
            x = val.x;
            y = val.y;

            for (event of $gameMap._events) {
                if (event != undefined && event.x == x && event.y == y) return event;
            }

            if (!val.continue) break;
        }

        return null;
    }
    /** get all events in front of the player */
    static getEvents() {
        // 2: down, 4: left, 6: right, 8: up
        let dir = $gamePlayer.direction();
        let x = $gamePlayer.x;
        let y = $gamePlayer.y;
        let events = [];
        while (true) {
            let val = this.__nextTile(x, y, dir);
            x = val.x;
            y = val.y;

            for (event of $gameMap._events) {
                if (event != undefined && event.x == x && event.y == y) events.push(event);
            }

            if (!val.continue) break;
        }

        return events;
    }
    /** Get the event in front of the player with a given `offset` */
    static getEventInFrontOfPlayer(offset = 1) {
        let dir = $gamePlayer.direction();
        let x = $gamePlayer.x;
        let y = $gamePlayer.y;
        let val = this.__nextTile(x, y, dir, offset);
        x = val.x;
        y = val.y;


        for (event of $gameMap._events) {
            if (event != undefined && event.x == x && event.y == y) return event;
        }
    }
    /** internal method */
    static __nextTile(startX, startY, dir, offset = 1) {
        let newX = startX;
        let newY = startY;
        let _continue = true;

        if (dir == 2) {
            // down
            newY += offset;
            _continue = newY < $gameMap.height();
            // console.log(newY, _continue, $gameMap.height());
        } else if (dir == 4) {
            // left
            newX -= offset;
            _continue = newX >= 0;
        } else if (dir == 6) {
            // right
            newX += 1;
            _continue = newX < $gameMap.width();
        } else if (dir == 8) {
            // up
            newY -= offset;
            _continue = newY >= 0;
        }

        return {
            continue: _continue,
            x: newX,
            y: newY
        }
    }
}
