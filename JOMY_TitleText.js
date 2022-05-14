/*:
* @author Jonas Everaert
* @plugindesc animated text that fades in and out
*
* @command showText
* @text 'Show text to the screen'
* @desc showText x y fadeDuration showDuration fontSize text
*
* @help
* requires JOMY_renderCore plugin
*
* == Plugin command usage ==
* showText showText x y fadeDuration showDuration fontSize text
* example: showText 10 10 1000 1000 26 Hello World!
* to disable fade in: showText 10 10 0 1000 26 Hello World!
*
*/

(function() {
  let fadeIns = new Map();
  let fadeOuts = new Map();

  /** plugin command */
  function showText(id, x, y, fadeDuration, duration, fontSize, text) {
    let startOpacity = 0;
    if (fadeDuration == 0) {
      startOpacity = 1;
    } else {
      fadeIns.set(id, {fade: fadeDuration, dur: duration});

    }

    Jomy.Renderer.renderText(id, String(text), {x: x, y: y}, {
      fontSize: fontSize || 26,
      opacity: startOpacity
    });
  }

  function fadeOut(id, duration) {
    fadeOuts.set(id, duration);
  }

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);

    switch (command) {
      case 'showText':
        let txt = "";
        for (let i = 5; i < args.length; i++) {
          if (i == 5) {
            txt += args[i];
            continue;
          }
          txt += " " + args[i];
        }
        showText(Jomy.Core.utils.genUUID(), Number(args[0]), Number(args[1].trim()), Number(args[2].trim()), Number(args[3]), Number(args[4].trim()), txt);
        break;
    }
  };

  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    for (let entry of fadeIns) {
     let sprite = Jomy.Renderer.getSprite(entry[0]);
     let current = sprite.alpha;
     sprite.alpha = current + 1 / entry[1].fade;
     if (sprite.alpha >= 1) {
       fadeIns.delete(entry[0]);
       setTimeout(() => {
         fadeOut(entry[0], entry[1].fade);
       }, entry[1].dur);
     }
    }

    for (let entry of fadeOuts) {
      let sprite = Jomy.Renderer.getSprite(entry[0]);
      let current = sprite.alpha;
      sprite.alpha = current - 1 / entry[1];
      if (sprite.alpha <= 0) {
        fadeOuts.delete(entry[0]);
      }
    }
  }
})();
