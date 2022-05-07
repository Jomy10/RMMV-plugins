/*:
* @author Jonas Everaert
* @plugindesc
* Core rendering plugin
* Requires the JOMY_Core plugin
* <be.jonaseveraert.mv.renderCore>
*
* @help
* == Access class ==
* `Jomy.Renderer`
*/

var Imported = Imported || {};
Imported.JOMY_RenderCore = true;

var Jomy = Jomy || {};

Jomy.Renderer = new class {
  constructor() {
    this.loadedSprites = new Map();
  }

  /** Add a sprite to the screen and index
  * @param id: unique id to reference the sprite by
  * @param location: string containing the location of the image in the base folder
  *                  e.g. "img/battle/bullet.png"
  * @param position: { x: number, y: number }
  */
  renderSprite(id, location, position) {
    let bitmap = ImageManager.loadBitmap("", location);
    let sprite = new Sprite(bitmap);
    this.loadedSprites.set(id, sprite);

    SceneManager._scene.addChild(sprite);

    if (position != null) {
      this.moveAbsSprite(id, position.x, position.y)
    }
  }

  /** Remove a sprite from the index and the screen */
  removeSprite(id) {
    let sprite = this.loadedSprites.get(id);
    this.loadedSprites.delete(id);

    SceneManager._scene.removeChild(sprite);
  }

  /** Move a sprite to an absolute position */
  moveAbsSprite(id, x, y) {
    this.loadedSprites.get(id).move(x, y);
  }

  /** Move a sprite to an position relative to itself */
  moveRelSprite(id, x, y) {
    let selectedSprite = this.loadedSprites.get(1);
    selectedSprite.move(selectedSprite.x + x, selectedSprite.y + y);
  }

  /** Clear all sprites from the screen and the index */
  clearSprites() {
    let currentScene = SceneManager._scene;
    for (let [id, child] of this.loadedSprites) {
      currentScene.removeChild(child);
      this.loadedSprites.delete(id);
    }
  }
};
