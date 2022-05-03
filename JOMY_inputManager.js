/*:
* @author Jonas Everaert
* @plugindesc Input manager core plugin
* <be.jonaseveraert.mv.inputManager>
*
* @help
* Detect input from keyboard / controller
* Access functions through script calls to `Jomy.InputManager.[func]`
*
* == Functions ==
* - `subTrigger(key, event)`: add a function call to when a key is pressed (executes once)
* - `subRepeat(key, event)`: add a function call to when a key is held down
* - `subLongPress(key, event)`: add a function call to when a key is held down for a longer amount of time
*
* == Example ==
* In either a plugin or a script call, call the following code once:
* ```
* Jomy.InputManager.subTrigger("shift", () => {
*     console.log("key pressed");
* });
*
* Jomy.InputManager.subRepeat("shift", () => {
*     console.log("key repeated");
* });
*
* Jomy.InputManager.subLongPress("shift", () => {
*   console.log("key long pressed");
* });
* ```
*
* Now press f8 inside of your game, in the meny that pops up, go to consle,
* go back to the game and press shift.
* Now look at the console to see the result of the executed functions.
*/

//===================================================================

var Imported = Imported || {};
Imported.JOMY_inputManager = true;

var Jomy = Jomy || {};

//===================================================================

const Jomy_KeyMap = new Map([
  ['backspace', 8],
  ['tab', 9],
  ['shift', 16],
  ['control', 17],
  ['alt', 18],
  ['caps_lock', 20],
  ['escape', 27],
  ['space', 32],
  ['left', 37],
  ['up', 38],
  ['right', 39],
  ['down', 40],
  ['0', 48],
  ['1', 49],
  ['2', 50],
  ['3', 51],
  ['4', 52],
  ['5', 53],
  ['6', 54],
  ['7', 55],
  ['8', 56],
  ['9', 57],
  ['a', 65],
  ['b', 66],
  ['c', 67],
  ['d', 68],
  ['e', 69],
  ['f', 70],
  ['g', 71],
  ['h', 72],
  ['i', 73],
  ['j', 74],
  ['k', 75],
  ['l', 76],
  ['m', 77],
  ['n', 78],
  ['o', 79],
  ['p', 80],
  ['q', 81],
  ['r', 82],
  ['s', 83],
  ['t', 84],
  ['u', 85],
  ['v', 86],
  ['w', 87],
  ['x', 88],
  ['y', 89],
  ['z', 90],
  ['num0', 96],
  ['num1', 97],
  ['num2', 98],
  ['num3', 99],
  ['num4', 100],
  ['num5', 101],
  ['num6', 102],
  ['num7', 103],
  ['num8', 104],
  ['num9', 105],
]);

class _JOMY_InputManager {
    // plugin info
    static version = 1.00;

    static keyMap = Jomy_KeyMap;

    static resetKeys() {
        for (let keyMap of Jomy_KeyMap) {
            Input.keyMapper[keyMap[1]] = keyMap[0];
        }
    }

    // plugin functions and parameters
    constructor() {
        this._triggerEvents = new Map();
        this._triggeredPreviously = new Set(); // keep track of the last ones triggered, so it doesn't trigger multiple times per frame
        this._repeatEvents = new Map();
        this._longPressEvents = new Map();
        // Register all keys
        _JOMY_InputManager.resetKeys();
    }

    /** Add a listener to a `button`
     * @param key: string (keycode)
     * @param callback: a callback function to be executed when `key` is pressed
     */
    subTrigger(key, callback) {
        let callbacks = this._triggerEvents.get(key);
        if (isIterable(callbacks)) {
            this._triggerEvents.set(key, [...callbacks, callback]);
        } else {
            this._triggerEvents.set(key, [callback]);
        }
    }

    subRepeat(key, callback) {
        let callbacks = this._repeatEvents.get(key);
        if (isIterable(callbacks)) {
            this._repeatEvents.set(key, [...callbacks, callback]);
        } else {
          this._repeatEvents.set(key, [callback]);
        }
    }

    subLongPress(key, callback) {
        let callbacks = this._longPressEvents.get(key);
        if (isIterable(callbacks)) {
          this._longPressEvents.set(key, [...callbacks, callback]);
        } else {
          this._longPressEvents.set(key, [callback]);
        }
    }

    /** Execute all events subscribed to any of the trigger tyes */
    executeTriggers() {
        // Trigger events
        let newTriggerSet = new Set();
        for (let pair of this._triggerEvents) {
            if (Input.isTriggered(pair[0])) {
                // Trigger all functions associated to the button that
                // was just pressed
                if (!this._triggeredPreviously.has(pair[0])) {
                  for (let func of pair[1]) {
                    func();
                  }
                }
                // Add to previouslt triggered set
                newTriggerSet.add(pair[0]);
            }
        }
        this._triggeredPreviously = newTriggerSet;

        // Hold down events
        for (let pair of this._repeatEvents) {
            if (Input.isRepeated(pair[0])) {
                for (let func of pair[1]) {
                    func();
                }
            }
        }

        // Long press events
        for (let pair of this._longPressEvents) {
            if (Input.isLongPressed(pair[0])) {
                for (let func of pair[1]) {
                    func();
                }
            }
        }
    }
}

function isIterable(obj) {
    if (obj == null) {
        return false;
    }

    return typeof obj[Symbol.iterator] === 'function';
}

/*
Jomy.InputManager = new class {
    // plugin info
    static version = 1.00;

    // plugin functions and parameters
    static _someVar = 4;
    static subscribeToInput() {}
    static update() {
        this._someVar += 1;
    }
}
*/
Jomy.InputManager = new _JOMY_InputManager();
Jomy.InputManager.version = _JOMY_InputManager.version;
Jomy.InputManager.keyMap = _JOMY_InputManager.keyMap;
Jomy.InputManager.resetKeys = _JOMY_InputManager.resetKeys;

// Plugin params and main function
(function () {
    let pluginParams = $plugins.filter(function(p) {
        return p.description.contains('<be.jonaseveraert.mv.inputManager>') && p.status
    })[0];

    // Add to game loop
    let update = Window_Base.prototype.update;
    Window_Base.prototype.update = function() {
        update.call(this);
        Jomy.InputManager.executeTriggers();
    };

    // Register commands
    // const allPluginCommands = Game_Interpreter.prototype.pluginCommand;
    // Game_Interpretter.prototype.pluginCommand = function(command, args) {
    //   allPluginCommands.call(this);

    //   switch (command) {
    //     case 'someCommand':
    //       break;
    //   }
    // }
})()
