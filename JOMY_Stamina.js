/*:
* @author Jonas Everaert
* @plugindesc stamina for sprinting
*/

var Jomy = Jomy || {};
Jomy.Stamina = {};

(function() {
  let nextDown = 0;
  let nextUp = 0;

  let mapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    mapLoaded.call(this);

    $gamePlayer.stamina = 100;
  };

  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let time = performance.now();

    if ($gamePlayer.isDashing() && $gamePlayer.isMoving()) {
      if (nextDown < time) {
        nextDown = time + 30;
        nextUp = time + 70;

        $gamePlayer.stamina -= 1;
        if ($gamePlayer.stamina <= 0) {
          $dataMap.disableDashing = true;
        }
      }
    } else if (nextUp < time && $gamePlayer.stamina < 100) {
      nextUp = time + 70;
      nextDown = time + 30;

      $gamePlayer.stamina += 1;

      if ($gamePlayer.stamina >= 25) {
        $dataMap.disableDashing = false;
      }
    }
  };
})();
