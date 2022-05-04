/*:
* @author Jonas Everaert
* @plugindesc Keyboard plugin
* Allows you to change the default controls through events/code <be.jonaseveraert.mv.keyboard>
*
* @command mapUp
* @text 'Set the move up key'
* @desc usage: mapUp n 23 or mapUp s 'r'
*
* @command mapDown
* @text 'Set the move up key'
* @desc
*
* @command mapLeft
* @text 'Set the move up key'
* @desc
*
* @command mapDown
* @text 'Set the move up key'
* @desc
*
* @command map
* @text 'Map a key to a specific keycode'
* @desc usage: map up 85
*       this will set the key for moving up to keycode 85 (move up)
*
* @command reset
* @text 'Reset a key to its default value'
* @desc usage: reset n 23 or reset s 'r'
*
* @help
* == Usage ==
* === Mapping keys ===
* Using plugin command:
* - This will map the 'r' key to make the player move up
* mapUp s 'r'
* or
* mapUp s r
* or
* mapUp r
* or
* map up 82
*
* - This will map the 'j' key to move the player down
* mapDown n 74
*
* Using script call:
* ```
* // This will map the n key (keycode 78) to moving the player up
* Jomy.Keyboard.map(Jomy.Keyboard.event.up, 78);
*
* // Or alernatively:
* Jomy.Keyboard.map(Jomy.Keyboard.event.up, Jomy.InputManager.keyMap.get('n'));
* ```
* === Removing a key entirely ===
* ```
* // This will remove the up key, thus removing the player's ability to move up
* Jomy.Keyboard.removeKeyMapForKey(Jomy.InputManager.keymap.get('up')):
* ```
*
* === Reset keys ===
* Using script call to reset all keys:
* ```
* Jomy.Keyboard.resetKeys();
* ```
*
* Using plugin command to reset a specific key:
* reset n 20
*/

//===================================================================

var Imported = Imported || {};
Imported.JOMY_keyboard = true;

var Jomy = Jomy || {};

//===================================================================

Jomy.Keyboard = class {
  // enum: keys representing what they should do
  static event = class {
    static up     = "up";
    static down   = "down";
    static left   = "left";
    static right  = "right";
    static esc    = "escape";
    static ok     = "ok";
    static debug  = "debug";
    static sprint = "shift";
    static dash   = "shift";
  };

  static resetKeys() {
    Jomy.InputManager.resetKeys();
  }

  /** Map a key to a keycode
   *  For example, setting `key` "up" to `keycode` 85 (u) will set the `u`
   *  key to move the player up.
   */
  static map(key, newKeyCode) {
    Input.keyMapper[newKeyCode] = key;
  }

  /** Completely removes a key from the keymap */
  static removeKeyMapForKey(keyCode) {
    Input.keyMapper[keyCode] = null;
  }

  /** Reset a specific keycode to its default */
  static resetDefault(keyCode) {
    Jomy.InputManager.keyMap.
    Input.keyMapper[keyCode] = findInMapByValue(map, value);
  }
};

/** Find a value in a map and return its key */
function findInMapByValue(map, value) {
    for (let [key, val] of map.entries()) {
      if (val === value) {
        return key;
      }
    }
}

(function() {
  // setup
  if (!Imported.JOMY_keyboard) {
    throw new Error("Please import JOMY_InputManager (above this plugin)");
  }

  let pluginParams = $plugins.filter(function(p) {
    return p.description.contains('<be.jonaseveraert.mv.keyboard>') && p.status;
  })[0];

  // Register commmands
  function mapKeyFromArg(type, key, dir) {
    if (key == null) {
      // support `mapDown 'r'` syntax
      key = type;
      type = 's';
    }
    if (type == 's') {
      Jomy.Keyboard.map(dir, Jomy.InputManager.keyMap.get(String(key)));
    } else {
      Jomy.Keyboard.map(dir, Jomy.Keyboard.event.up, Number(key));
    }
  }

  var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);

    switch (command) {
      case 'mapUp':
        mapKeyFromArg(args[0], args[1], Jomy.Keyboard.event.up);
        break;
      case 'mapDown':
        mapKeyFromArg(args[0], args[1], Jomy.Keyboard.event.down);
        break;
      case 'mapLeft':
        mapKeyFromArg(args[0], args[1], Jomy.Keyboard.event.left);
        break;
      case 'mapRight':
        mapKeyFromArg(args[0], args[1], Jomy.Keyboard.event.right);
        break;
      case 'map':
        Jomy.Keyboard.map(args[0], args[1]);
        break;
      case 'reset':
        if (args[0] == 'n') {
          Jomy.Keyboard.resetDefault(args[1]);
        } else {
          if (args[1] == 's') {
            Jomy.Keyboard.resetDefault(Jomy.InputManager.keyMap.get(String(args[1])));
          } else {
            Jomy.Keyboard.resetDefault(Jomy.InputManager.keyMap.get(String(args[0])));
          }
        }
        break;
    }
  }
})();
