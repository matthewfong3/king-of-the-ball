"use strict";

var app = app || {};

app.myKeys = function(){
    var myKeys = {};
    
    myKeys.keydown = [];
    
    window.addEventListener("keydown", function(e){
        myKeys.keydown[e.key.toLowerCase()] = true; 
    });
    
    window.addEventListener("keyup", function(e){
        myKeys.keydown[e.key.toLowerCase()] = false;
        
        // pausing and resuming
        if (e.key.toLowerCase() == "p"){
            if (app.main.gameState == app.main.GAME_STATE.PAUSE) app.main.resumeGame();
            else app.main.pauseGame();
        }
    });
    
    return myKeys;
}();