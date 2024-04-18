"use strict";

function getRandom(min, max) {
  	return Math.random() * (max - min) + min;
}

function clamp(val, min, max){
	return Math.max(min, Math.min(max, val));
}

function calculateDeltaTime(){
	var now,fps;
	now = performance.now(); 
	fps = 1000 / (now - app.main.lastTime);
	fps = clamp(fps, 12, 60);
	app.main.lastTime = now; 
	return 1/fps;
}