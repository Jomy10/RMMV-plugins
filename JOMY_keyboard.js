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
* ```
* Jomy.Keyboard.resetKeys();
* ```
*/

//===================================================================

var Imported = Imported || {};
Imported.JOMY_keyboard = true;

var Jomy = Jomy || {};

//===================================================================

Jomy.Keyboard = class {
  // enum: keys representing what they should do
  static event = class {
    static up = "up";
    static down = "down";
    static left = "left";
    static right = "right";
    static esc = "escape";
    static ok = "ok";
    static debug = "debug";
    static sprint = "shift";
    static dash = "shift";
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

  static removeKeyMapForKey(keyCode) {
    Input.keyMapper[keyCode] = null;
  }
};

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
        mapKeyFromArg(args[0], args[1], Jomy.Keyboard.event.leftt);
        break;
      case 'mapRight':
        mapKeyFromArg(args[0], args[1], Jomy.Keyboard.event.right);
        break;
    }
  }
})();
