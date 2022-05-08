/*:
* @author Jonas Everaert
* @plugindesc <be.jonaseveraert.mv.RTBS.weapons>
*
* @param Fist animation id
* @type number
* @default 1
*
* @help
* The plugin takes all the parameters of thee equipped weapon by the player
* (first party member).
*
* The attack animation is the selected attack animation, + the 3 attack animations
* that follow (one for each direction the player is facing in).
*/

var Imported = Imported || {};
Imported.JOMY_rtbs_weapons = true;

var Jomy = Jomy || {};
Jomy.RTBS_Weapons = {};

class RTBS_Weapon {
  constructor(weapon) {
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

    this.ranged = false;
    this._parseWeaponNotes()
  }

  _parseWeaponNotes() {
    for (let note of this._weapon.note.split("\n")) {
      switch (note.trim()) {
        case "<RTBS-ranged>":
          this.ranged = true;
          break;
      }
    }
  }

  equip() {
    $rtbs_player.rtbs.equippedWeapon = this;
  }
}

(function() {
  let plugin = $plugins.filter(function(p) {
      return p.description.contains('<be.jonaseveraert.mv.RTBS.weapons>') && p.status;
  })[0];
  let pluginParameters = plugin.parameters;

  let fistAnimationId = Number(pluginParameters["Fist animation id"]);

  // Game loop
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    if (!(SceneManager._scene instanceof Scene_Menu || SceneManager._scene instanceof Scene_Title)) { // not in a menu (including main menu)
      // Add weapons
      let equippedWeapon = $gameActors.actor(1).equips()[0];
      if (equippedWeapon == null) {
        $rtbs_player.rtbs.equippedWeapon = null; // unequip weapon
      } else if ($rtbs_player.rtbs.equippedWeapon == null || equippedWeapon.id != $rtbs_player.rtbs.equippedWeapon.id) {
        let weapon = new RTBS_Weapon(equippedWeapon);
        weapon.equip();
      }
    }
  }

  // On map load
  let map = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    map.call(this);

    $rtbs_player.rtbs.fistAnimationId = fistAnimationId;
  }
})();
