"use strict";

var app = app || {};

window.onload = function(){
    app.main.myKeys = app.myKeys;
    app.main.Emitter = app.Emitter;
    app.main.init();
};

window.onblur = function(){
    app.main.pauseGame();
};

window.onfocus = function(){
    app.main.resumeGame();
};