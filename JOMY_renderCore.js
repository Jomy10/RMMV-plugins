/*:
* @author Jonas Everaert
* @plugindesc
* Core rendering plugin
*
* @help
* == Access class ==
* `Jomy.Renderer`
*/

var Imported = Imported || {};
Imported.JOMY_Core = true;

var Jomy = Jomy || {};

Jomy.Renderer = new class {
  constructor() {
    this.loadedSprites = new Map();
  }

  /** Add a sprite to the screen and index */
  renderSprite(id, location, position = 0) {
    let bitmap = ImageManager.loadBitmap("", location);
    let sprite = new Sprite(bitmap);
    this.loadedSprites.set(id, sprite);

    SceneManager._scene.addChild(sprite);
  }

  /** Remove a sprite from the index and the screen */
  removeSprite(id) {
    let sprite = this.loadedSprites.get(id);
    this.loadedSprites.delete(id);

    SceneManager._scene.removeChild(sprite);
  }

  /** Move a sprite to an absolute position */
  moveAbsSprite(id, x, y) {
    this.loadedSprites.get(id).selectedSprite.move(x, y);
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
