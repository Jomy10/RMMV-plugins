/*:
* @author Jonas Everaert
* @plugindesc
* Core engine plugin for all of Jomy's plugins
* This plugin contains common code shared among other plugins
* Put this plugin on top of all the other plugins
*/

var Imported = Imported || {};
Imported.JOMY_Core = true;

var Jomy = Jomy || {};

Jomy.Core = { version: 1.00 };
Jomy.Core.utils = {};
Jomy.Core.class = {};

/** Check wheter an object is iterable */
Jomy.Core.utils.isIterable = function(obj) {
    if (obj == null) {
        return false;
    }

    return typeof obj[Symbol.iterator] === 'function';
};
Jomy.Core.utils.genUUID = function() {
  let dateMS = Date.now();
  let rand = Math.floor(Math.random() * 10000000);
  return Number(`${dateMS}${rand}`);
};
/** Parse comments */
Jomy.Core.utils.parseComment = function(comment) {
  if (!comment.contains(":")) return null;
  let command = comment.split(':');
  return new Jomy.Core.class.Comment(command[0].trim(), command[1].trim());
};
/** Comment of the form `Key: value` */
Jomy.Core.class.Comment = class {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
  getKey() { return this.key; }
  getValue() { return this.value; }
};

// Direction:
// 0: up
// 1: right
// 2: down
// 3: left
Jomy.Core.utils.rmmvDirToGameDir = function(rmmvDir) {
  switch (rmmvDir) {
    case 8: return 0; // up
    case 4: return 3; // left
    case 2: return 2; // down
    case 6: return 1; // right
  }
}

Jomy.Core.utils.isInMenu = function() {
  return SceneManager._scene instanceof Scene_Title ||SceneManager._scene instanceof Scene_MenuBase;
}
