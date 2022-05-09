/*:
* @author Jonas Everaert
* @plugindesc support for bullets in RTBS
* <be.jonaseveraert.mv.RTBS.bulletManager>
*
* @param Fire sound filename
* @type text
* @desc the sound to play when firing
* @default Gun1
*
* @param Hit sound filename
* @type text
* @desc The sound a bullet makes when it hits an enemy
* @default RTBS_GunSplat
*
* @help
* Add a bullet sprite to "img/RTBS_Combat/bullet.png"
*/

class __BulletManager {
  constructor() {
    this.bullets = [];
  }

  // TODO: custom sprite
  addBullet(pos, dir, speed = 1, damage = 10, piercingCount = 1, alertsEnemies = true, alertPosition = {x: $gamePlayer.x, y: $gamePlayer.y}) {
    let id = Jomy.Core.utils.genUUID();
    this.bullets.push({
      x: pos.x,
      y: pos.y,
      dir: dir,
      speed: speed,
      damage: damage,
      id: id, // sprite ID
      piercingCount: piercingCount
    });

    Jomy.Renderer.renderSprite(
      id,
      "img/RTBS_Combat/bullet",
      pos);

    AudioManager.playSe({name: this.bulletSound, pan: 0, pitch: 100, volume: 100});

    if (alertsEnemies) {
      let timeout =  Math.floor(Math.random() * 1500);
      for (let enemy of $rtbs_manager.enemies) {
        if (enemy.isPointInRadius(alertPosition.x, alertPosition.y, enemy.pathfindRadius * 1.75)) {
          let timer = window.setTimeout(() => {
            enemy.pathfindTo(alertPosition);
          }, timeout);
        }
      }
    }
  }

  /** Calculate new position and draw buller*/
  calcAndDrawAndDamage() {
    for (let bullet of this.bullets) {
      switch (bullet.dir) {
        case 0:
          bullet.y -= bullet.speed;
          this._moveBulletSprite(bullet);
          break;
        case 1:
          bullet.x = bullet.x + bullet.speed;
          this._moveBulletSprite(bullet);
          break;
        case 2:
          bullet.y += bullet.speed;
          this._moveBulletSprite(bullet);
          break;
        case 3:
          bullet.x -= bullet.speed;
          this._moveBulletSprite(bullet);
          break;
      }
      this._damageToEnemy(bullet);
      // TODO: use sprite width + height
      if (bullet.x < 0 || bullet.x > Graphics.boxWidth || bullet.y < 0 || bullet.y > Graphics.boxHeight) {
        this.removeBullet(bullet);
      }
    }
  }

  removeBullet(bullet) {
    console.log("Removing bullet", bullet.id);
    this._disposeBulletSprite(bullet);
    this.bullets = this.bullets.filter((b) => { return b.id != bullet.id; });
  }

  _damageToEnemy(bullet) {
    for (let enemy of $rtbs_manager.enemies) {
      if (Math.round(bullet.x) == enemy.event.screenX() && Math.round(bullet.y) == enemy.event.screenY()) {
        enemy.getsAttacked(bullet.damage);

        AudioManager.playSe({name: this.hitSound, pan: 0, pitch: 100, volume: 100});

        bullet.piercingCount -= 1;
        if (bullet.piercingCount == 0) {
          this.removeBullet(bullet);
        }
        break;
      }
    }
  }

  _moveBulletSprite(bullet) {
    Jomy.Renderer.moveAbsSprite(bullet.id, bullet.x, bullet.y);
  }

  _disposeBulletSprite(bullet) {
    Jomy.Renderer.removeSprite(bullet.id);
  }

  setRangedWeaponButton(button) {
    let prevButton = this.selectedWeaponButton;
    Jomy.InputManager.removeTriggers(prevButton);

    this.selectedWeaponButton = button;
    Jomy.InputManager.subTrigger(button, () => {
      let currentRangedWeapon = $rtbs_player.rtbs.equippedRangedWeapon;

      if (currentRangedWeapon == null) return;

      this.addBullet(
        {x: $gamePlayer.screenX(), y: $gamePlayer.screenY()}, // pos
        Jomy.Core.utils.rmmvDirToGameDir($gamePlayer.direction()), // dir
        currentRangedWeapon.ranged_speed, // speed
        currentRangedWeapon.atk, // damage
        currentRangedWeapon.ranged_piercingCount, // piercingCount
        currentRangedWeapon.ranged_alerts, // alerts enemies
        {x: $gamePlayer.x, y: $gamePlayer.y} // alertPosition (game tiles)
      );
      console.log(this.bullets);
    });
  };
}

let $bulletManager = new __BulletManager();

(function() {
  let plugin = $plugins.filter(function(p) {
    return p.description.contains('<be.jonaseveraert.mv.RTBS.bulletManager>') && p.status;
  })[0];

  $bulletManager.bulletSound = plugin.parameters["Fire sound filename"];
  $bulletManager.hitSound = plugin.parameters["Hit sound filename"];

  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
      update.call(this);
      $bulletManager.calcAndDrawAndDamage();
  };
})();
