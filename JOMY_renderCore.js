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
  * @param id {number} - unique id to reference the sprite by
  * @param location {string} - containing the location of the image in the base folder
  *                  e.g. "img/battle/bullet"
  * @param position { x: number, y: number } -
  * @param callback {function} - called when the sprite has been loaded
  */
  renderSprite(id, location, position, callback) {
    let bitmap = ImageManager.loadBitmap("", location);
    bitmap.addLoadListener(function() {
      let sprite = new Sprite(bitmap);
      this.loadedSprites.set(id, sprite);

      SceneManager._scene.addChild(sprite);

      if (position != null) {
       this.moveAbsSprite(id, position.x, position.y);
      }

      callback();
    }.bind(this));
  }

  renderSpriteSync(id, location, position) {
    let bitmap = ImageManager.loadBitmap("", location);
    let sprite = new Sprite(bitmap);
    this.loadedSprites.set(id, sprite);

    SceneManager._scene.addChild(sprite);

    if (position != null) {
     this.moveAbsSprite(id, position.x, position.y);
    }
  }

  /** Render text to the screen
   * @param id {number} - a unique id to reference this sprite
   * @param text {string} - the string to display
   * @param position {x: number, y: number} - the position of the text
   * @param style {object} -
   *   @param style.font {string}
   *   @param style.fontSize {number}
   *   @param style.fill {[]string or string}
   *   @param style.stroke {[]string or string}
   *   @param style.fontSize {number}
   *   @param style.strokeThickness¬†{number}
   *   @param style.wordWrap {boolean} - wheter to wrap words or not
   *   @param style.wordWrapWidth {number} - the width of the text box to wrap in
   *   @param style.opacity {number} - text opacity
   */
  renderText(id, text, position, style = {}) {
    let strokeThickness = 4;
    if (style.strokeThickness != null)
      strokeThickness = style.strokeThickness;

    let textStyle = new PIXI.TextStyle({
      fontFamily: style.font || "GameFont",
      fontSize: style.fontSize ||¬†26,
      fill: style.fill || ['#ffffff'],
      stroke: style.stroke || '#000000',
      strokeThickness: strokeThickness,
      wordWrap: style.wordWrap ||¬†false,
      wordWrapWidth: style.wordWrapWidth ||¬†440
    });

    let txt = new PIXI.Text(text, textStyle);
    txt.x = position.x;
    txt.y = position.y;
    if (style.opacity != null)
      txt.alpha = style.opacity;

    this.loadedSprites.set(id, txt);

    SceneManager._scene.addChild(txt);
  }

  getSprite(id) {
    return this.loadedSprites.get(id);
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
    let selectedSprite = this.loadedSprites.get(id);
    selectedSprite.move(selectedSprite.x + x, selectedSprite.y + y);
  }

  setSpriteFrame(id, x, y, w, h) {
    this.loadedSprites.get(id).setFrame(x, y, w, h);
  }

  /** Get the sprite dimensions of a sprite
   * @returns { w: number, h: number } - the sprite's bitmap dimensions
   */
  getSpriteDimension(id) {
    let selSpr = this.loadedSprites.get(id);
    return { w: selSpr.bitmap.width, h: selSpr.bitmap.height };
  }

  /** Checks if a sprite with a certain id exists */
  spriteExists(id) {
    return this.loadedSprites.get(id) != null;
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
