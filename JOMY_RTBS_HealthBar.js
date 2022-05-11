/*:
* @author Jonas Everaert
* @plugindesc: adds health bars to RTBS
* @help
* This plugin requires
* JOMY_renderCore to be installed
*
* == Registering health bars ==
* === With a comment ==
* Add to a battler of enemy
* HPBar: shown
*
* === With a script ===
* // `event` is any {Game_Event}
* // `target` is any object that implements the `getHp(): number` and `maxHp(): number` functions
* event.displayHPBar(target, offset);
* // This script will show an hp bar above an event
*
* == Rquired Assets ==
* - "img/RTBS_Combat/hp_bar_frame.png"
* - "img/RTBS_Combat/hp_bar_fill.png"
*
*/

let $rtbs_hpManager = new class {
  constructor() {
    this.bars = new Map();
  }

  /** Add a bar to be rendered
  */
  addBar(bar) {
    bar._spriteFillId = Jomy.Core.utils.genUUID();
    bar._spriteFrameId = Jomy.Core.utils.genUUID();

    // Render fill
    // Jomy.Renderer.renderSprite(bar._spriteFillId, "img/RTBS_Combat/hp_bar_fill", {x: bar._event.screenX() + bar.offset.x, y: bar._event.screenY() + bar.offset.y});

    // Render frame
    // Jomy.Renderer.renderSprite(bar._spriteFrameId, "img/RTBS_Combat/hp_bar_frame", { x: bar._event.screenX() + bar.offset.x, y: bar._event.screenY() + bar.offset.y});

    // Add bars to manager
    this.bars.set(bar.id, bar);
  }

  removeBar(barId) {
    // TODO: add to separate list to fade out
    let bar = this.bars.get(barId);
    if (bar == null) return; // Don't remove if there is no hp bar

    Jomy.Renderer.removeSprite(bar._spriteFillId);
    Jomy.Renderer.removeSprite(bar._spriteFrameId);

    this.bars.delete(barId);
  }

  drawBars() {
    for (let _bar of this.bars) {
      let bar = _bar[1];
      let hp = bar.health();
      let mhp = bar.maxHealth;

      // TODO: if bar._isSpriteRendered && hp = mhp, then remove the sprite! (healing)
      if (hp == mhp) continue;

      if (!Jomy.Renderer.spriteExists(bar._spriteFillId)) {
        if (bar._isSpriteRendering) continue;
        bar._isSpriteRendering = true;
        // Render fill
        Jomy.Renderer.renderSprite(bar._spriteFillId, "img/RTBS_Combat/hp_bar_fill", {x: bar._event.screenX() + bar.offset.x, y: bar._event.screenY() + bar.offset.y}, () => {
          // Render frame
          Jomy.Renderer.renderSprite(bar._spriteFrameId, "img/RTBS_Combat/hp_bar_frame", { x: bar._event.screenX() + bar.offset.x, y: bar._event.screenY() + bar.offset.y}, () => {
            this._renderSprites(bar, hp, mhp);
            bar._isSpriteRendered = true;
          });
        });
      } else {
        if (bar._isSpriteRendered)
          this._renderSprites(bar, hp, mhp);
      }
    }
  }

  _renderSprites(bar, hp, mhp) {
    // Move bars to new location
    let x = bar._event.screenX();
    let y = bar._event.screenY();
    Jomy.Renderer.moveAbsSprite(bar._spriteFillId, x + bar.offset.x, y + bar.offset.y);
    Jomy.Renderer.moveAbsSprite(bar._spriteFrameId, x + bar.offset.x, y + bar.offset.y);

    // Set bar frame
    let percHpLeft = hp / mhp;

    let dim = Jomy.Renderer.getSpriteDimension(bar._spriteFillId);

    Jomy.Renderer.setSpriteFrame(bar._spriteFillId, 0, 0, dim.w * percHpLeft, dim.h);
  }
};

(function() {
  // TODO: show hp bar on impact and then fade/tween out again
  class _JOMY_HPBar {
    /**
     * @param offset {x: number, y: number} - sprite offset from event
     * @param target {Object} - a class instance that implempents `getHp(): number`
     *                          and `maxHp: number`
     * @param event {Game_Event} - the event at which to display the hp bar
     */
    constructor(id, offset, target, event) {
      this.id = id;
      this.maxHealth = target.maxHp;
      this.offset = offset;
      this._target = target;
      this._event = event;
    }

    health() {
      return this._target.getHp();
    }
  }

  /** Dislay an hp bar above an event*/
  Game_Event.prototype.displayHPBar = function(target, offset = { x: -20, y: -100 }) {
    let hpBar = new _JOMY_HPBar(
      Jomy.Core.utils.genUUID(),
      offset,
      target,
      this
    );

    this.hpBarId = hpBar.id;

    $rtbs_hpManager.addBar(hpBar);
  };

  Game_Event.prototype.removeHPBar = function() {
    $rtbs_hpManager.removeBar(this.hpBarId);
  }

  let defBat = RTBS_Battler.prototype._onDefaultCommentKey;
  RTBS_Battler.prototype._onDefaultCommentKey = function(comment) {
    defBat.call(this);

    if (comment == null) return;
    switch (comment.getKey()) {
      case "HPBar":
        this.hpBarShown = comment.getValue().toLowerCase() == "shown";
        this._event.displayHPBar(this);
        break;
    }
  }

  let onMapLoad = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    onMapLoad.call(this);
  }

  let nextUpdate = 0;

  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    let time = performance.now();
    if (nextUpdate < time) {
      nextUpdate = time + 17; // milisec delay ~ 1 frame

      $rtbs_hpManager.drawBars();
    }
  };
})();
