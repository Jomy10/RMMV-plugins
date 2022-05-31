/*:
* @author Jonas Everaert
* @plugindesc Play one continuous music piece by combining loops
* @help
* - Load audio files using Jomy.Music.Core.loadSe
* - Jomy.Music.startSong([songs]) to start
* - Jomy.Music.nextSong([transition song], [new songs]) to go to the next music loop
*
* song = { id: number, name: "se audio file name (without extension)", length: number (length in miliseconds of the song)}
*
* Thanks to ct_bolt for his script for loading audio files in advance before playinf them
*/

var Imported = Imported || {};
Imported.Jomy_Music = true;
var Jomy = Jomy || {};
Jomy.Music = {};
Jomy.Music.Core = {};

// =================================================
// Core
// =================================================

(function() {  
  let playing = null;
 
  /** Play another song
   * @param song {id: number, name: string, length: number} - name is the name of the audio file
   *        length is the length in miliseconds of the song. id is an id referencing the audio file
   */
  function playMusic(song, volume = 100, pitch = 100, pan = 100) {
    
    playing = { id: song.id, song: song, start: performance.now() };
    // AudioManager.playSe(music);
    AudioManager.playPreloadedSe(song.id);
  }
  Jomy.Music.Core.playMusic = playMusic;
  
  Jomy.Music.Core.loadSe = AudioManager.loadSe;
  AudioManager.loadSe = function(song) {
    console.log(song);
    let music = { name: song.name, volume: 100, pitch: 100, pan: 100 };
    if (song.name) {
      console.log("loading", song.id, song);
      this._seBuffers = this._seBuffers.filter(function(audio) {
         return audio.isPlaying();
      });
      
      console.log($gameSystem);
      $gameSystem._seBuffer = $gameSystem._seBuffer || [];
      $gameSystem._seBuffer[song.id] = this.createBuffer('se', music.name);
      this.updateSeParameters($gameSystem._seBuffer[song.id], music);
    }
  };
  
  AudioManager.playPreloadedSe = function(id) {
    if ($gameSystem._seBuffer[id]) {
      console.log($gameSystem._seBuffer[id]);
      $gameSystem._seBuffer[id].play(false);
      this._seBuffers.push($gameSystem._seBuffer[id]);
    }
  };
  
  Jomy.Music.Core.getPlaying = function() {
    return playing;
  };
})();

// =================================================
// Music looping
// =================================================

(function() {
  let currentLoop = [];
  let loopIdx = 0;
  let transitionQueue = [];
  
  /** Play the next song with an optional transition
   *  @param transition {[]song} - an array of loops to play as a transition to the new piece
   *  @param loop {[]song} - an array of loops to play
   */
  function nextSong(transition, loop) {
    currentLoop = loop;
    transitionQueue = transition;
  }
  Jomy.Music.nextSong = nextSong;
  
  /** Call this once when starting the music. After that, use `nextSong` to transition to a new part
   * @param loop {[]string} - an array of loops to play
   */
  function startSong(loop) {
    currentLoop = loop;
    Jomy.Music.Core.playMusic(loop[0]);
    if (loop.length != 1)
      loopIdx++;
  }
  Jomy.Music.startSong = startSong;
  
  let update = Window_Base.prototype.update;
  Window_Base.prototype.update = function() {
    update.call(this);
    
    let time = performance.now();
    let playing = Jomy.Music.Core.getPlaying();
    if (playing != null && playing.start + playing.song.length <= time) {
      if (currentLoop.length != 0) {
        console.log(currentLoop[loopIdx], loopIdx);
        Jomy.Music.Core.playMusic(currentLoop[loopIdx]);
        loopIdx++;
        if (loopIdx >= currentLoop.length) {
          loopIdx = 0;
        }
      }
    }
  };
})();
