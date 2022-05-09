# RMMV Plugins

All my plugins for RPG Maker MV.

## Installation
Copy the `.js` files to `your-project-folder/js/plugins/`. Then, go to the `plugins` menu in RPG Maker MV, and add the plugin to the list.

## Plugin list

### RTBS plugins
[RTBS](JOMY_RTBS_Core.js) is a **Real-Time Battle System**. There are [attack animations](JOMY_RTBS_animation.js), the ability to use [weapons](JOMY_RTBS_weapons.js) and many more.

Sorry for the lack of documentation on this plugin, feel free to open an issue, I'll explain it in detail!

The RTBS plugins will also require some of the other plugins to be installed, like the Core plugin, Input Manager and Keyboard, Render Core and Event Detection.

### [Input manager](JOMY_inputManager.js)
This is a **core** plugin. This means that it supposed to support other plugins. This plugin is used by the [keyboard](#keyboard) plugin.

This plugin requires the [Core](JOMY_Core.js) plugin to work!

<details>
  <summary>Details</summary>

  #### Available *script* functions
  - `subTrigger(key, event)`: add a function call to when a key is pressed (executes once)
  - `subRepeat(key, event)`: add a function call to when a key is held down
  - `subLongPress(key, event)`: add a function call to when a key is held down for a longer amount of time

  #### Example
  In either a plugin or a script call, call the following code once:
  ```js
  Jomy.InputManager.subTrigger("shift", () => {
     console.log("key pressed");
  });

  Jomy.InputManager.subRepeat("shift", () => {
     console.log("key repeated");
  });

  Jomy.InputManager.subLongPress("shift", () => {
   console.log("key long pressed");
  });
  ```
</details>

### [Keyboard](JOMY_keyboard.js)
This plugin allows you to map a key to a control. For example, you can set the 'n'
key to move the player up.

This plugin requires the [Input manager](#input-manager) plugin to be installed (above this plugin).

<details>
  <summary>Details</summary>

  *Find all keycodes at [keycode.info](https://keycode.info)*

  #### Available *plugin* commands
  - `mapUp`
  - `mapDown`
  - `mapLeft`
  - `mapRight`

  **usage**
  `COMMAND <type> [keyCode|keyName]`

  - `map [key] [keycode]`
  <details>
    <summary>key events</summary>
    The possible values for the `key` argument are:
    - up
    - down
    - left
    - right
    - escape
    - ok
    - debug
    - shift
  </details>
  - `reset <type> [keyCode|keyName]`

  #### Examples

  ##### Mapping keys
  The following commands are equivalent:
  ```
  mapUp s 'r'
  mapUp s r
  mapUp 'r'
  mapUp r
  map up 82
  ```

  *Using the key's code instead of the name*
  ```
  // this will map 'j' to move the player u
  mapUp n 74
  ```
  The `map` command always uses the keycode

  ##### Reseting keys
  ```
  reset s 'r'
  reset 'r'
  reset n 23
  ```

  #### Available *script* functions
  - `Jomy.Keyboard.map(eventKeyCode, mapKeyCode)`
  - `Jomy.Keyboard.removeKeyMapForKey(keyCode)`
  - `Jomy.Keyboard.resetKeys()`
  - `Jomy.Keyboard.resetDefault(keyCode)`

  #### Examples

  ##### Mapping keys
  ```js
  // This will map the n key (keycode 78) to moving the player up
  Jomy.Keyboard.map(Jomy.Keyboard.event.up, 78);
  ```

  ##### Removing a key entirely
  ```js
  // This will remove the up key, thus removing the player's ability to move up
  Jomy.Keyboard.removeKeyMapForKey(Jomy.InputManager.keymap.get('up')):
  ```

  ##### Reset keys
  ```js
  Jomy.Keyboard.resetKeys();
  ```
</details>

### [Player Follower](JOMY_playerFollower.js)
Make an event follow a player by giving it a note of `<player-follower>`

[more information](https://gist.github.com/Jomy10/4c284bbfda71003d2ad34b49a92a27e5)


### [Event Detection](JOMY_eventDetection.js)
Detect events in front of the player.

### [Companion](JOMY_companion.js)
A companion that will follow the player, but not as strict as a party member. It will follow the player more naturally.

<details>
  <summary>Details</summary>
  Add \<companion\> to the note of an event

  #### Additional comments
  - `FollowFrequency: <value>` the frequency with which an event will search for a path to the player in milliseconds
  - `WandeerFrequency: <value>` the frequency with which an event will search for another spot around the player to wander to milliseconds (set to -1 to disable wandering)

  You can use Game_Event.companion in scripting to access the companion object.
  - `Game_Event.companion.abortMovement()` will stop all movement of the companion.
  - `Game_Event.companion.resumeMovement()` will resume its movement behaviour.
</details>

## License

All plugins are licensed under the [Apache License 2.0](LICENSE).

In short, 2 things are expected of your:
- That you include the [license text](LICENSE) into the finished product that uses the plugins, giving proper credit.
- That, if you change any of the plugins internal code, that you state what changes you made.

Apart from these two conditions, you can do anything you want. The plugins can be used in both commercial and non-commercial games.

More information about the license can be found [here](https://choosealicense.com/licenses/apache-2.0/).
