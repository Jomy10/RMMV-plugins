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
    this.ranged_sprite = "RTBS_Combat/bullet"
    this._parseWeaponNotes()
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
          } // end switch comment
      } // end switch note
    }
  }

  equip() {
    if (this.ranged) {
      $rtbs_player.rtbs.equippedRangedWeapon = this;
    } else {
      $rtbs_player.rtbs.equippedWeapon = this;
    }
  }
}

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

    if (!(SceneManager._scene instanceof Scene_Menu || SceneManager._scene instanceof Scene_Title)) { // not in a menu (including main menu)
      // Add weapon
      let equippedWeapon = $gameActors.actor(1).equips()[0];
      if (equippedWeapon == null) {
        $rtbs_player.rtbs.equippedWeapon = null; // unequip weapon
      } else if ($rtbs_player.rtbs.equippedWeapon == null || equippedWeapon.id != $rtbs_player.rtbs.equippedWeapon.id) {
        let weapon = new RTBS_Weapon(equippedWeapon);
        weapon.equip();
        console.log("equipped", $rtbs_player.rtbs.equippedWeapon);
      }

      // Add ranged weapon
      let equippedRangedWeapon = $gameActors.actor(1).equips()[rangedWeaponSlot];
      if (equippedRangedWeapon == null) {
        $rtbs_player.rtbs.equippedRangedWeapon = null;
      } else if ($rtbs_player.rtbs.equippedRangedWeapon == null || equippedRangedWeapon.id != $rtbs_player.rtbs.equippedRangedWeapon.id) {
        let rangedWeapon = new RTBS_Weapon(equippedRangedWeapon, true);
        rangedWeapon.equip();
        console.log("equipped", $rtbs_player.rtbs.equippedRangedWeapon);
      }
    } // endif
  }

  // On map load
  let map = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    map.call(this);

    $rtbs_player.rtbs.fistAnimationId = fistAnimationId;
  }
})();
