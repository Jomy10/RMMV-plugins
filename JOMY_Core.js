/*:
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
/** Check wheter an object is iterable */
Jomy.Core.utils.isIterable = function(obj) {
    if (obj == null) {
        return false;
    }

    return typeof obj[Symbol.iterator] === 'function';
};
