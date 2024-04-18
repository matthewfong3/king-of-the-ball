"use strict";

var app = app || {};

app.myKeys = function(){
    var myKeys = {};
    
    myKeys.KEYBOARD = Object.freeze({
        "KEY_LEFT": 37,
        "KEY_UP": 38,
        "KEY_RIGHT": 39,
        //"KEY_DOWN": 40,
        "NUMPAD_0": 96,
        "W": 87,
        "A": 65, 
        //"S": 83,
        "D": 68,
        "G": 71,
        "L": 76
    });
    
    myKeys.keydown = [];
    
    window.addEventListener("keydown", function(e){
       myKeys.keydown[e.keyCode] = true; 
    });
    
    window.addEventListener("keyup", function(e){
        myKeys.keydown[e.keyCode] = false;
        
        // pausing and resuming
        var char = String.fromCharCode(e.keyCode);
        if (char == "p" || char == "P"){
            if (app.main.gameState == app.main.GAME_STATE.PAUSE){
                app.main.resumeGame();
            } else {
                app.main.pauseGame();
            }
        }
    });
    
    return myKeys;
}();