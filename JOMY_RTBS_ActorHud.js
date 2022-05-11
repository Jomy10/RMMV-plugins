/*:
* @author Jonas Everaert
* @plugindesc A hud for the actor
* @help
* Feel free to edit this plugin to your liking, it is not fully completed
*
* == images ==
* - img/RTBS_ActorHud/actor_hud_bg.png
* - img/RTBS_ActorHud/actor_hud_fg.png
* - img/RTBS_ActorHud/actor_hud_hp.png
* - img/RTBS_ActorHud/actor_hud_stam.png
*/

(function() {
  let spriteIds = [];
  let hudShown = false

  function showHud() {
    let width = Graphics.boxWidth;
    let height = Graphics.boxHeight;

    let bgId = Jomy.Core.utils.genUUID();
    Jomy.Renderer.renderSprite(bgId, "img/RTBS_ActorHud/actor_hud_bg", {x: 0, y: 0}, () => {
      // let dim = Jomy.Renderer.getSpriteDimension(bgId);
      // Jomy.Renderer.moveAbsSprite(bgId, 0, height - dim.h);

      let hpId = Jomy.Core.utils.genUUID();
      Jomy.Renderer.renderSprite(hpId, "img/RTBS_ActorHud/actor_hud_hp", {x: 20, y: 16}, () => {
        Jomy.Renderer.moveAbsSprite(hpId, 182, 37);

        let faceId = Jomy.Core.utils.genUUID();
        Jomy.Renderer.renderSprite(faceId, "img/faces/PHC_Garth", {x: 20, y: 16}, () => {
          Jomy.Renderer.setSpriteFrame(faceId, 0, 0, 144, 144);
        });

        let stamId = Jomy.Core.utils.genUUID();
        Jomy.Renderer.renderSprite(stamId, "img/RTBS_ActorHud/actor_hud_stam", {x: 20, y: 16}, () => {
          Jomy.Renderer.moveAbsSprite(stamId, 182, 63);
        });

        let fgId = Jomy.Core.utils.genUUID();
        Jomy.Renderer.renderSprite(fgId, "img/RTBS_ActorHud/actor_hud_fg", {x: 0, y: 0}, () => {});

        spriteIds = [bgId, fgId, faceId, hpId, stamId];
        hudShown = true;
      });
    });
  }

  function setHudHp(perc) {
    let dim = Jomy.Renderer.getSpriteDimension(spriteIds[3]);
    Jomy.Renderer.setSpriteFrame(spriteIds[3], 0, 0, dim.w * perc, dim.h);
  }

  function setHudStam(perc) {
    let dim = Jomy.Renderer.getSpriteDimension(spriteIds[4]);
    Jomy.Renderer.setSpriteFrame(spriteIds[4], 0, 0, dim.w * perc, dim.h);
  }

  function hideHud() {
    hudShown = false;
    for (let id of spriteIds) {
      Jomy.Renderer.removeSprite(id);
    }
    spriteIds = [];
  }

  let mapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    mapLoaded.call(this);
    showHud();
  };

  let nextUpdate = 0;
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
      update.call(this);

      let time = performance.now();
      if (hudShown && nextUpdate < time) {
        nextUpdate = time + 17; // milisec delay ~ 1 frame

        let hp = $rtbs_player.hp;
        let mhp = $rtbs_player.mhp;
        let stam = $gamePlayer.stamina;
        // TODO: equipment rendering

        let percHpLeft = hp / mhp;
        if (percHpLeft != 1) {
          setHudHp(percHpLeft);
        }

        let percStamLeft = stam / 100;
        if (percStamLeft != 1) {
          setHudStam(percStamLeft);
        }
      }
  };
})();
