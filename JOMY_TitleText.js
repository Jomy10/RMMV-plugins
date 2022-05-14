/*:
* @author Jonas Everaert
* @plugindesc animated text that fades in and out
*
* @command showText
* @text 'Show text to the screen'
* @desc showText x y fadeDuration textSize text
*
* @help
* requires JOMY_renderCore plugin
*
* == Plugin command usage ==
* showText showText x y fadeDuration text
* example: showText 10 10 1000 26 Hello World!
*
*/

(function() {
  let fadeIns = new Map();
  function showText(x, y, fadeDuration, fontSize, text) {
    let startOpacity = 0;
    if (fadeDuration == 0)
      startOpacity = 1;
    else
      fadeIns.set(0, fadeDuration);

    Jomy.Renderer.renderText(0, String(text), {x: x, y: y}, {
      fontSize: fontSize || 26,
      opacity: startOpacity
    });


  }

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);

    switch (command) {
      case 'showText':
        let txt = "";
        for (let i = 4; i < args.length; i++) {
          if (i == 4) {
            txt += args[i];
            continue;
          }
          txt += " " + args[i];
        }
        showText(Number(args[0]), Number(args[1].trim()), Number(args[2].trim()), Number(args[3].trim()), txt);
        break;
    }
  };

  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);

    for (let entry of fadeIns) {
     let sprite = Jomy.Renderer.getSprite(entry[0]);
     let current = sprite.alpha;
     sprite.alpha = current + 1 / entry[1];
     console.log(current);
     if (sprite.alpha >= 1) {
       fadeIns.delete(entry[0]);
     }
    }
  }
})();
