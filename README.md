# RMMV Plugins

All my plugins for RPG Maker MV.

## Installation
Copy the `.js` files to `your-project-folder/js/plugins/`. Then, go to the `plugins` menu in RPG Maker MV, and add the plugin to the list.

## Plugin list

### [Input manager](JOMY_inputManager.js)
This is a **core** plugin. This means that it supposed to supposed to support other plugins. This plugin is used by the [keyboard](#keyboard) plugin.

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

### [Keyboard](JOMY_keyboardjs)
This plugin allows you to map a key to a control. For example, you can set the 'n'
key to move the player up.

<details>
  <summary>Details</details>

  #### Available *plugin* commands
  - `mapUp`:
  - `mapDown`:
  - `mapLeft`:
  - `mapRight`:

  **usage**
  `COMMAND <type> [keyCode|keyName]`

  #### Examples

  ##### Mapping keys
  The following commands are equivalent:
  ```
  mapUp s 'r'
  mapUp s r
  mapUp 'r'
  mapUp r
  ```

  *Using the key's code instead of the name*
  ```
  // this will map 'j' to move the player u
  mapUp n 74
  ```

  #### Available *script* functions
  - `Jomy.Keyboard.map(eventKeyCode, mapKeyCode)`
  - `Jomy.Keyboard.removeKeyMapForKey(keycode)`
  - `Jomy.Keyboard.resetKeys()`

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
