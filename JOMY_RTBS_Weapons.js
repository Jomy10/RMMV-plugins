/*:
* @author Jonas Everaert
* @plugindesc <be.jonaseveraert.mv.RTBS.weapons>
*
* @param Fist animation id
* @type number
* @default 1
*
* @param Ranged weapon slot
* @type number
* @desc 1 = the second slot
* @default 1
*
* @param Ranged weapon attack button
* @type number
* @default c
*
* @help
* The plugin takes the parameters of the equipped weapon by the player
* (first party member).
*
* Weapon comments:
* - `<RTBS-ranged-alerts>`: When provided, a ranged weaon will alert nearby enemies
* - `RTBS-ranged-piercing-count: <value>`: The amount of enemies a bullet can hit before
*   it disappears
* - `RTBS-ranged-speed: <value>`: The speed of the bullet
* - `RTBS-ranged-sprite: <value>`: The sprite of the bullet. Default is "RTBS_Combat/bullet",
*   which is located in "img/RTBS_Combat/bullet.png"
* - `RTBS-ranged-ammo: <value>`: The item id of the ammo that should be used for
*   the ranged weapon.
* - `RTBS-ranged-cooldown: <value>`: The cooldown of the ranged weapon
* - `RTBS-durability: <value>`: Add a durability to non-ranged weapons
* - `RTBS-speed: <value>`: Attack speed of the weapon
*
* The attack animation is the selected attack animation, + the 3 attack animations
* that follow (one for each direction the player is facing in).
*/

var Imported = Imported || {};
Imported.JOMY_rtbs_weapons = true;

var Jomy = Jomy || {};
Jomy.RTBS_Weapons = {};

class RTBS_Weapon {
  constructor(weapon, ranged = false) {
    this._weapon = weapon;
    this.atk = weapon.params[2];
    this.def = weapon.params[3];
    this.matk = weapon.params[4];
    this.mdef = weapon.params[5];
    this.agility = weapon.params[6];
    this.luck = weapon.params[7];
    this.mhp = weapon.params[0];
    this.mmp = weapon.params[1];
    this.animationIds = [
      weapon.animationId,
      weapon.animationId + 1,
      weapon.animationId + 2,
      weapon.animationId + 3,
    ];
    this.id = weapon.id;

    // Notes
    this.ranged = ranged;
    this.ranged_alerts = false;
    this.ranged_piercingCount = 1;
    this.ranged_speed = 1;
    this.ranged_sprite = "RTBS_Combat/bullet";
    this.ranged_ammoId = null;
    this.ranged_cooldown = 0;
    this._ranged_lastShot = 0;
    this.durabilityEnabled = false;
    this._weapon.durability = 999;
    this._weapon.mDurability = 999;
    this.atkSpeed = 1000;
    this._parseWeaponNotes();
  }

  _parseWeaponNotes() {
    for (let note of this._weapon.note.split("\n")) {
      switch (note.trim()) {
        case "<RTBS-ranged-alerts>":
          this.ranged_alerts = true;
          break;
        default:
          if (note == "") continue;
          let comment = Jomy.Core.utils.parseComment(note.trim());
          if (comment == null) continue;
          console.log(comment);

          switch (comment.getKey()) {
            case "RTBS-ranged-alerts": // TODO: a ranged alert multiplier
              this.ranged_alerts = Number(comment.getValue());
              break;
            case "RTBS-ranged-piercing-count":
              this.ranged_piercingCount = Number(comment.getValue());
              break;
            case "RTBS-ranged-speed":
              this.ranged_speed = Number(comment.getValue());
              break;
            case "RTBS-ranged-sprite":
              this.ranged_sprite = Number(comment.getValue());
              break;
            case "RTBS-durability":
              this.durabilityEnabled = true;
              this._weapon.durability = Number(comment.getValue());
              this._weapon.mDurability = Number(comment.getValue());
              break;
            case "RTBS-ranged-ammo":
              this.ranged_ammoId = Number(comment.getValue());
              break;
            case "RTBS-speed":
              this.atkSpeed = Number(comment.getValue());
              break;
            case "RTBS-ranged-cooldown":
              this.ranged_cooldown = Number(comment.getValue());
              break;
          } // end switch comment
      } // end switch note
    }
  }

  durability() {
    return this._weapon.durability;
  }

  setDurability(val) {
    this._weapon.durability = val;
  }

  /** Retrieve the weapon's attack. Also decreases its durability
   * @returns {number}
   */
  use() {
    if (this.durabilityEnabled) {
      this._weapon.durability -= 1;
      console.log(this.durability());
      if (this.durability() <= 0) {
        console.log("Weapon broke!");
        this.break();
      }
    }
    return this.atk;
  }

  /** Called when this weapon breaks */
  break() {
    this._weapon.durability = this._weapon.mDurability;
    let weaponId = $rtbs_player.rtbs.equippedWeapon._weapon.id;
    $gameActors.actor(1).changeEquip(0, $dataWeapons[0]); // unequip
    _rtbs_weapons_inst.onUnequip();
    $gameParty._weapons[weaponId] -= 1;
    if ($gameParty._weapons[weaponId] <= 0) {
      delete $gameParty._weapons[weaponId];
    }
    // TODO: play breaking sound
  }

  /** Uses 1 ammo for this weapon and returns wheter it was successful */
  canUseRanged() {
    let now = performance.now();
    if (this._ranged_lastShot + this.ranged_cooldown > now) return false;
    this._ranged_lastShot = now
    if (this.ranged_ammoId == null) true;
    let itemCount = $gameParty._items[this.ranged_ammoId];

    if (itemCount != null && itemCount > 0) {
      // remove item
      $gameParty._items[this.ranged_ammoId] -= 1;
      if ($gameParty._items[this.ranged_ammoId] <= 0) {
        delete $gameParty._items[this.ranged_ammoId];
      }

      return true;
    } else {
      return false;
    }
  }

  equip() {
    if (this.ranged) {
      $rtbs_player.rtbs.equippedRangedWeapon = this;
    } else {
      $rtbs_player.rtbs.equippedWeapon = this;
    }

    this._onEquip();
  }

  _onEquip() {}
}

Jomy.RTBS_Weapons = class {
  onUnequip() {}
};

let _rtbs_weapons_inst = new Jomy.RTBS_Weapons();

(function() {
  let plugin = $plugins.filter(function(p) {
      return p.description.contains('<be.jonaseveraert.mv.RTBS.weapons>') && p.status;
  })[0];
  let pluginParameters = plugin.parameters;

  let fistAnimationId = Number(pluginParameters["Fist animation id"]);
  let rangedWeaponSlot = Number(pluginParameters["Ranged weapon slot"]);
  let rangedAttackButton = String(pluginParameters["Ranged weapon attack button"]);

  $bulletManager.setRangedWeaponButton(rangedAttackButton);

  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    if (!(Jomy.Core.utils.isInMenu())) { // not in a menu (including main menu)
      // Add weapon
      let equippedWeapon = $gameActors.actor(1).equips()[0];
      if (equippedWeapon == null) {
        $rtbs_player.rtbs.equippedWeapon = null; // unequip weapon
        _rtbs_weapons_inst.onUnequip();
      } else if ($rtbs_player.rtbs.equippedWeapon == null || equippedWeapon.id != $rtbs_player.rtbs.equippedWeapon.id) {
        let weapon = new RTBS_Weapon(equippedWeapon);
        weapon.equip();
      }

      // Add ranged weapon
      let equippedRangedWeapon = $gameActors.actor(1).equips()[rangedWeaponSlot];
      if (equippedRangedWeapon == null) {
        $rtbs_player.rtbs.equippedRangedWeapon = null;
      } else if ($rtbs_player.rtbs.equippedRangedWeapon == null || equippedRangedWeapon.id != $rtbs_player.rtbs.equippedRangedWeapon.id) {
        let rangedWeapon = new RTBS_Weapon(equippedRangedWeapon, true);
        rangedWeapon.equip();
      }
    } // endif
  }

  // On map load
  let map = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    map.call(this);

    $rtbs_player.rtbs.fistAnimationId = fistAnimationId;
  };
})();
