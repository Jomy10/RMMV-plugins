/*:
* @author Jonas Everaert
*/

class __BulletManager {
  constructor() {
    this.bullets = [];
  }

  addBullet(pos, dir, speed = 1) {
    let id = Jomy.Core.utils.genUUID();
    this.bullets.push({
      x: pos.x,
      y: pos.y,
      dir: dir,
      speed: speed,
      id: id // sprite ID
    });

    Jomy.Renderer.renderSprite(
      id,
      "img/GAME_Combat/bullet",
      pos);
  }

  /** Calculate new position and draw buller*/
  calcAndDraw() {
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
      // TODO: use sprite width + height
      if (bullet.x < 0 || bullet.x > Graphics.boxWidth || bullet.y < 0 || bullet.y > Graphics.boxHeight) {
        console.log("disposing of $(bullet)");
        this._disposeBulletSprite(bullet);
        this.bullets = this.bullets.filter((b) => { return b != bullet; });
      }
    }
  }

  _moveBulletSprite(bullet) {
    Jomy.Renderer.moveAbsSprite(bullet.id, bullet.x, bullet.y);
  }

  _disposeBulletSprite(bullet) {
    Jomy.Renderer.removeSprite(bullet.id);
  }
}

let $bulletManager = new __BulletManager();

(function() {
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
      update.call(this);
      $bulletManager.calcAndDraw();
  };
})();
