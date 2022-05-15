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
*
* == Notes ==
* Add <RTBS-HUD-hidden> to the note of a map to hide the hud for this
* particular map.
*/

(function() {
  let spriteIds = [];
  let hudShown = false
  let meleeEquipped = false;
  let rangedEquipped = false;
  let currentRangedCount = null;

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
        Jomy.Renderer.renderSprite(stamId, "img/RTBS_ActorHud/actor_hud_stam", {x: 182, y: 63}, () => {
          let fgId = Jomy.Core.utils.genUUID();
          Jomy.Renderer.renderSprite(fgId, "img/RTBS_ActorHud/actor_hud_fg", {x: 0, y: 0}, () => {});

          spriteIds = [bgId, fgId, faceId, hpId, stamId, null, null, null, null];
          hudShown = true;
        });
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

  function setHudDurability(perc) {
    let dim = Jomy.Renderer.getSpriteDimension(spriteIds[7]);
    Jomy.Renderer.setSpriteFrame(spriteIds[7], 0, 0, dim.w * perc, dim.h);
  }

  function setHudAmmoCount(count) {
    currentRangedCount = count;
    if (spriteIds[8] == null) return;
    Jomy.Renderer.removeSprite(spriteIds[8]);

    let weap = $rtbs_player.rtbs.equippedRangedWeapon;
    if (weap == null) return;

    // add ammo count
    _renderAmmoCount(weap);
  }

  function _renderAmmoCount(weapon, count) {
    let acId = Jomy.Core.utils.genUUID();
    let ammoId = weapon.ranged_ammoId;
    let ammoCount = 0

    if (ammoId == null)
      ammoCount = "∞";
    else
      ammoCount = $gameParty._items[ammoId] || 0;

    currentRangedCount = ammoCount;

    Jomy.Renderer.renderText(acId, "x" + String(ammoCount), {x: 313, y: 128});

    spriteIds[8] = acId;
  }

  function addHudEquippedWeapon() {
    let weap = $rtbs_player.rtbs.equippedWeapon;
    if (weap == null) return;
    let meleeId = Jomy.Core.utils.genUUID();
    Jomy.Renderer.renderSpriteSync(meleeId, "img/system/iconSet", {x: 188, y: 109});

    if (weap != null) {
      let idx = weap._weapon.iconIndex;
      let iconSize = 32;

      let col = idx;
      while (col > 15) {
        col -= 16;
      }

      let row = Math.floor(idx / 16);

      Jomy.Renderer.setSpriteFrame(meleeId, col * iconSize, row * iconSize, iconSize, iconSize);
    }
    spriteIds[5] = meleeId;
    meleeEquipped = true;

    let durId = null;
    if (weap.durabilityEnabled) {
      durId = Jomy.Core.utils.genUUID();
      Jomy.Renderer.renderSpriteSync(durId, "img/RTBS_ActorHud/actor_hud_durability", {x: 182, y: 151});
    }

    spriteIds[7] = durId;
  }

  function rmHudEquippedWeapon() {
    if (spriteIds[5] == null) return;
    Jomy.Renderer.removeSprite(spriteIds[5]);
    spriteIds[5] = null;
    if (spriteIds[7] != null) {
      Jomy.Renderer.removeSprite(spriteIds[7]);
      spriteIds[7] = null;
    }
    meleeEquipped = false;
  }

  function addHudEquippedRanged() {
    let weap = $rtbs_player.rtbs.equippedRangedWeapon;
    if (weap == null) return;
    let meleeId = Jomy.Core.utils.genUUID();
    Jomy.Renderer.renderSpriteSync(meleeId, "img/system/iconSet", {x: 248, y: 109}); // TODO: render bitmap separately! (reuse)

    let idx = weap._weapon.iconIndex;
    let iconSize = 32;

    let col = idx;
    while (col > 15) {
      col -= 16;
    }

    let row = Math.floor(idx / 16);

    Jomy.Renderer.setSpriteFrame(meleeId, col * iconSize, row * iconSize, iconSize, iconSize);

    spriteIds[6] = meleeId;
    rangedEquipped = true;

    // add ammo count
    _renderAmmoCount(weap);
  }

  function rmHudEquippedRanged() {
    if (spriteIds[6] == null) return;
    Jomy.Renderer.removeSprite(spriteIds[6]);
    spriteIds[6] = null;
    rangedEquipped = false;

    // rm ammo count
    Jomy.Renderer.removeSprite(spriteIds[8]);
    spriteIds[8] = null;
  }

  function hideHud() {
    hudShown = false;
    for (let id of spriteIds) {
      Jomy.Renderer.removeSprite(id);
    }
    spriteIds = [];
  }

  let onEq = RTBS_Weapon.prototype._onEquip;
  RTBS_Weapon.prototype._onEquip = function() {
    onEq();
    rmHudEquippedWeapon();
    rmHudEquippedRanged();
    addHudEquippedWeapon();
    addHudEquippedRanged();
  };

  let onUneq = Jomy.RTBS_Weapons.prototype.onUnequip;
  Jomy.RTBS_Weapons.prototype.onUnequip = function() {
    onUneq();
    if ($rtbs_player.rtbs.equippedWeapon == null)
      rmHudEquippedWeapon();
    if ($rtbs_player.rtbs.equippedRangedWeapon == null)
      rmHudEquippedRanged();
  };

  let mapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    mapLoaded.call(this);
    if (!$dataMap.meta["RTBS-HUD-hidden"]) {
      showHud();
    }
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

        // TODO: if currentRangedCount != ammo left for player, update ammo count (clear bitmap & draw text)
        let weapon = $rtbs_player.rtbs.equippedWeapon
        if (weapon != null && weapon.durabilityEnabled) {
          let percDurLeft = weapon._weapon.durability / weapon._weapon.mDurability;
          setHudDurability(percDurLeft);
        }

        let rangedW = $rtbs_player.rtbs.equippedRangedWeapon;
        if (rangedW != null) {
          let ammoCount = $gameParty._items[rangedW.ranged_ammoId] || 0;
          if (currentRangedCount != ammoCount) {
            setHudAmmoCount(ammoCount);
          }
        }
      }
  };
})();
