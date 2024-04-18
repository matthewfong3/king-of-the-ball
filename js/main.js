"use strict";

var app = app || {};

app.main = {
    // ------------------------ variables ------------------------
    // canvas variables
    canvas: undefined,
    ctx: undefined,
    animationID: 0,
    imageBG: new Image(), // to load background image
    imageCTRL: new Image(), // to load controls image
    displayCTRL: false,
    lastTime: 0, // used by calculateDeltaTime() 
    
    winner: undefined,
    globalTime: 150, 
    
    myKeys: undefined, // required - loaded by main.js
    Emitter: undefined, // required - loaded by main.js
    pulsar: undefined,
    exhaust: undefined,
    
    // audio variables
    bgAudio: undefined,
    punchAudio: undefined,
    ballAudio: undefined,
    currentEffect: 0, 
    effectSounds: ["SpaceJam.mp3", "punch.mp3", "pop.mp3"],
    
    // game state variables
    gameState: undefined,
    currentState: undefined,
    GAME_STATE: Object.freeze({ 
        BEGIN: 0, // start menu
        LEVEL_SELECT: 1, // level select
        DEFAULT: 2, // in-game
        PAUSE: 3, // pause
        END: 4 // game over
    }),
    
    // player object
    p1: undefined,
    p2: undefined,
    Player: function(t, w, h){
        // player properties
        this.team = t;
        this.x = undefined;
        this.y = undefined;
        this.w = w;
        this.h = h;
        this.playerDirection = undefined;
        this.playerState = undefined;
        this.ballState = undefined;
        this.score = 0;
        this.interactBool = false;
        this.jumpCounter = 0;
        this.jumpBool = false;
        this.spawnX = 0;
        this.spawnY = 0;
        
        // sprite related variables
        this.imageIDLE = new Image();
        this.imageRUN = new Image();
        this.imageACTION = new Image();
        this.frameIndex = 0;
        this.tickCount = 0;
        
        // player methods
        this.spawn = function(x, y, pDir, pState, pBallState){
            this.x = x;
            this.y = y;
            this.playerDirection = pDir;
            this.playerState = pState;
            this.ballState = pBallState;
        };
        
        this.move = function(dt){
            var maxSpeed, jumpSpeed = 130;
            if(this.ballState === app.main.PLAYER_BALL_STATE.DEFAULT) maxSpeed = 100;
            else if(this.ballState === app.main.PLAYER_BALL_STATE.ONBALL) maxSpeed = 90;
            
            if(this.playerDirection == 0){ // 0 = IDLE
                // do nothing!
                this.updateFrameAnimation(30, 4);
            }
            else if(this.playerDirection == 1){ // 1 = LEFT
                this.x -= maxSpeed * dt;
                this.updateFrameAnimation(10, 6);
            }
            else if(this.playerDirection == 2){ // 2 = RIGHT
                this.x += maxSpeed * dt;
                this.updateFrameAnimation(10, 6);
            }
            if(this.playerState === 1){ // 1 = JUMPING
                this.jumpCounter++;
                this.y -= jumpSpeed * dt * 1.5;
                this.jumpBool = true;
                
                if(this.jumpCounter >= 35){
                    this.jumpCounter = 0;
                    this.playerState = app.main.PLAYER_STATE.FALLING;
                    
                }
            }
            if(this.playerState === 0){ // 0  = FALLING
                this.y += jumpSpeed * dt * 2;
            }
            if(this.playerState === 2){ // 2 = GROUNDED
                // do nothing!
                this.updateFrameAnimation(30, 4);
            }
         };
        
        this.updateFrameAnimation = function(tPF, nF){
            var ticksPerFrame = tPF;
            var numFrames = nF;
            
            this.tickCount++;
            if(this.tickCount > ticksPerFrame){
                this.tickCount = 0;
                if(this.frameIndex < numFrames - 1)
                    this.frameIndex++;
                else this.frameIndex = 0;
            }
        };
        
        this.interact = function(ball, player){
            if(this.interactBool)
                // Allows the player to "punch" the other player if they have the ball
                if(this.ballState === app.main.PLAYER_BALL_STATE.DEFAULT){
                    app.main.playEffect(1);
                    if(app.main.checkCollisionPlayerVPlayer(this, player) && player.ballState === app.main.PLAYER_BALL_STATE.ONBALL && ball.active){ 
                        player.ballState = app.main.PLAYER_BALL_STATE.DEFAULT;
                        ball.active = false;
                    }
                    // Allows the player to pick up the ball
                    if(app.main.checkCollisionPlayerVBall(this, ball) && !ball.active){
                        this.ballState = app.main.PLAYER_BALL_STATE.ONBALL;
                        ball.active = true;
                    }
                }
        };
        
        this.draw = function(ctx){
            // draw punching
            if(this.interactBool && this.ballState === app.main.PLAYER_BALL_STATE.DEFAULT){
                if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.RIGHT) ctx.drawImage(this.imageACTION, 65, 0, 15, 15, this.x, this.y, this.w, this.h);
                else if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.LEFT) ctx.drawImage(this.imageACTION, 83, 0, 15, 15, this.x, this.y, this.w, this.h);
                else{
                    if(this.team == "red") ctx.drawImage(this.imageACTION, 65, 0, 15, 15, this.x, this.y, this.w, this.h);
                    else if(this.team == "blue") ctx.drawImage(this.imageACTION, 83, 0, 15, 15, this.x, this.y, this.w, this.h); 
                } 
            }
            else{
                // consider all grounded states
                if(this.playerState == app.main.PLAYER_STATE.GROUNDED){
                    // draw running animation - LEFT
                    if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.LEFT) ctx.drawImage(this.imageRUN, this.frameIndex * 13, 24, 11, 15, this.x, this.y, this.w, this.h);
                    // draw running animation - RIGHT
                    else if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.RIGHT) ctx.drawImage(this.imageRUN, this.frameIndex * 13, 0, 11, 15, this.x, this.y, this.w, this.h);
                    // draw idle animation
                    else{
                        if(this.team == "red") ctx.drawImage(this.imageIDLE, this.frameIndex * 12, 0, 10, 15, this.x, this.y, this.w, this.h);
                        else if(this.team == "blue") ctx.drawImage(this.imageIDLE, this.frameIndex * 12, 24, 10, 15, this.x, this.y, this.w, this.h);
                    }
                } 
                // draw jumping
                else if(this.playerState == app.main.PLAYER_STATE.JUMPING){
                    if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.RIGHT) ctx.drawImage(this.imageACTION, 1, 0, 14, 15, this.x, this.y, this.w, this.h);
                    else if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.LEFT) ctx.drawImage(this.imageACTION, 33, 0, 14, 15, this.x, this.y, this.w, this.h);
                    else{
                        if(this.team == "red") ctx.drawImage(this.imageACTION, 1, 0, 14, 15, this.x, this.y, this.w, this.h);
                        else if(this.team == "blue") ctx.drawImage(this.imageACTION, 33, 0, 14, 15, this.x, this.y, this.w, this.h);
                    } 
                }
                // draw falling
                else if(this.playerState == app.main.PLAYER_STATE.FALLING){
                    if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.RIGHT) ctx.drawImage(this.imageACTION, 17, 0, 14, 15, this.x, this.y, this.w, this.h);
                    else if(this.playerDirection == app.main.PLAYER_DIRECTION_STATE.LEFT) ctx.drawImage(this.imageACTION, 48, 0, 14, 15, this.x, this.y, this.w, this.h);
                    else{
                        if(this.team == "red") ctx.drawImage(this.imageACTION, 17, 0, 14, 15, this.x, this.y, this.w, this.h);
                        else if(this.team == "blue") ctx.drawImage(this.imageACTION, 48, 0, 14, 15, this.x, this.y, this.w, this.h);
                    }
                }
            }
        };
    },
    // player enum for left, right, or idle state
    PLAYER_DIRECTION_STATE: Object.freeze({
        IDLE: 0,
        LEFT: 1,
        RIGHT: 2
    }),
    // player enum for falling, grounded on platform, or jumping
    PLAYER_STATE: Object.freeze({
        FALLING: 0,
        JUMPING: 1,
        GROUNDED: 2
    }),
    // player enum for either on ball or off ball
    PLAYER_BALL_STATE: Object.freeze({
        DEFAULT: 0,
        ONBALL: 1
    }),
    
    // ball object
    ball: {
        // ball properties
        x: undefined,
        y: undefined,
        r: undefined,
        active: false,
        
        // ball methods
        spawn: function(x, y){
            this.x = x;
            this.y = y;
            this.r = 7.5;
            this.active = false;
            
            var pulsar = new app.main.Emitter();
            pulsar.red = 255;
            pulsar.green = 255;
            pulsar.blue = 255;
            pulsar.minXspeed = pulsar.minYspeed = -0.25;
            pulsar.maxXspeed = pulsar.maxYspeed = 0.25;
            pulsar.lifetime = 500;
            pulsar.expansionRate = 0.05;
            pulsar.numParticles = 15;
            pulsar.xRange = 1;
            pulsar.yRange = 1;
            pulsar.useCircles = true;
            pulsar.useSquares = false;
            pulsar.createParticles({x:850, y:100});
            this.pulsar = pulsar;
        },
        
        update: function(canvas){
            if(this.active){
                app.main.playEffect(2);
                var toFollow;
                if(app.main.p1.ballState === app.main.PLAYER_BALL_STATE.ONBALL)
                    toFollow = app.main.p1;
                else if(app.main.p2.ballState === app.main.PLAYER_BALL_STATE.ONBALL)
                    toFollow = app.main.p2;
                
                this.x = toFollow.x + toFollow.w/2;
                this.y = toFollow.y + toFollow.h/2;
            }
            
            if(this.y > canvas.height) this.spawn(canvas.width/2, canvas.height/2 + 40);
        },
        
        draw: function(ctx){
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
            
            if(this.pulsar && this.active) this.pulsar.updateAndDraw(ctx, {x:this.x, y:this.y});
        }
    },
    
    // platform object
    platforms: [],
    Platform: function(x, y, w, h){
        // platform properties
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        
        // platform methods
        this.draw = function(ctx){
            ctx.fillStyle = "black";
            ctx.fillRect(this.x,this.y,this.w,this.h);
        };
    },
    
    /// ------------------------ functions ------------------------
    /// summary
    /// init function
    /// summary
    init: function(){
        //initialize properties
        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.imageBG.src = app.IMAGES["bgImage"];
        this.imageCTRL.src = app.IMAGES["ctrlImage"];
        this.displayCTRL = false;
        this.gameState = this.GAME_STATE.BEGIN; 
        this.currentState = this.gameState;

        this.ball.spawn(this.canvas.width/2, this.canvas.height/2 + 40); // spawn ball
        
        // initialize players
        this.p1 = new this.Player("red", 30, 35);
        this.p1.imageIDLE.src = app.IMAGES["redCharIDLE"];
        this.p1.imageRUN.src = app.IMAGES["redCharRUN"];
        this.p1.imageACTION.src = app.IMAGES["redCharACTION"];
        
        this.p2 = new this.Player("blue", 30, 35);
        this.p2.imageIDLE.src = app.IMAGES["blueCharIDLE"];
        this.p2.imageRUN.src = app.IMAGES["blueCharRUN"];
        this.p2.imageACTION.src = app.IMAGES["blueCharACTION"];
        
        // initialize sound variables & set volumes
        this.bgAudio = document.querySelector("#bgAudio");
        this.bgAudio.volume = 0.01;
        this.punchAudio = document.querySelector("#punchAudio");
        this.punchAudio.src = "sounds/" + this.effectSounds[1];
        this.punchAudio.volume = 0.01;
        this.ballAudio = document.querySelector("#ballAudio");
        this.ballAudio.src = "sounds/" + this.effectSounds[2];
        this.ballAudio.volume = 0.01;
        
        // start game loop
        this.update();
    },
    
    /// summary
    /// update/game loop function
    /// summary
    update: function(){
        // Loop
        this.animationID = requestAnimationFrame(this.update.bind(this));
        
        // Draw
        this.ctx.drawImage(this.imageBG, 0, 0);
        // draw borders
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, 3, this.canvas.height);
        this.ctx.fillRect(this.canvas.width - 3, 0, 3, this.canvas.height);
        this.ctx.fillRect(0, 0, this.canvas.width, 3);
        
        if(this.gameState === this.GAME_STATE.DEFAULT){
            this.bgAudio.play();
            var dt = calculateDeltaTime();
            
            for(var i = 0; i < this.platforms.length; i++)
                this.platforms[i].draw(this.ctx); // draw platforms
            
            // update players
            this.handleInput();
            this.checkPlatformCollisions(this.p1);
            this.checkPlatformCollisions(this.p2);
            this.checkBoundaries(this.p1);
            this.checkBoundaries(this.p2);
            this.checkScore(dt);
            this.p1.move(dt);
            this.p2.move(dt);
            this.p1.interact(this.ball, this.p2);
            this.p2.interact(this.ball, this.p1);
            // draw players
            this.p1.draw(this.ctx); 
            this.p2.draw(this.ctx);
            
            this.ball.update(this.canvas); // update ball
            this.ball.draw(this.ctx); // draw ball
            
            this.globalTime -= dt; // decrease global time
        }
        
        this.drawHUD(this.ctx); // Draw HUD
    },
    
    /// summary
    /// make platforms for level
    /// summary
    makePlatforms(int){
        var platform1;
        var platform2;
        var platform3;
        var platform4;
        var platform5;
        var platform6;
        var platform7;
        var platform8;
        this.platforms = []; // empty platforms array
        if(int == 1){ // level 1
            platform1 = new this.Platform(this.canvas.width/5, 150, this.canvas.width/5, 5);
            platform2 = new this.Platform(3*this.canvas.width/5, 150, this.canvas.width/5, 5);
            platform3 = new this.Platform(this.canvas.width/16, 250, this.canvas.width/6, 5);
            platform4 = new this.Platform(12*this.canvas.width/16, 250, this.canvas.width/6, 5);
            platform5 = new this.Platform(this.canvas.width/4, 350, this.canvas.width/2, 5);
            platform6 = new this.Platform(this.canvas.width/8, 450, this.canvas.width/6, 5);
            platform7 = new this.Platform(5.5*this.canvas.width/8, 450, this.canvas.width/6, 5);
            platform8 = new this.Platform(this.canvas.width/3, 550, this.canvas.width/3, 5);
        }
        else if(int == 2){ // level 2
            platform1 = new this.Platform(3*this.canvas.width/8, 150, this.canvas.width/4, 5);
            platform2 = new this.Platform(3*this.canvas.width/16, 250, this.canvas.width/4, 5);
            platform3 = new this.Platform(9*this.canvas.width/16, 250, this.canvas.width/4, 5);
            platform4 = new this.Platform(this.canvas.width/16, 350, this.canvas.width/8, 5);
            platform5 = new this.Platform(6*this.canvas.width/16, 350, 2*this.canvas.width/8, 5);
            platform6 = new this.Platform(13*this.canvas.width/16, 350, this.canvas.width/8, 5);
            platform7 = new this.Platform(this.canvas.width/8, 450, this.canvas.width/4, 5);
            platform8 = new this.Platform(5*this.canvas.width/8, 450, this.canvas.width/4, 5);
        }
        else if(int == 3){ // level 3
            platform1 = new this.Platform(2*this.canvas.width/16, 150, this.canvas.width/8, 5);
            platform2 = new this.Platform(12*this.canvas.width/16, 150, this.canvas.width/8, 5);
            platform3 = new this.Platform(1.75*this.canvas.width/8, 250, this.canvas.width/6, 5);
            platform4 = new this.Platform(5*this.canvas.width/8, 250, this.canvas.width/6, 5);
            platform5 = new this.Platform(6*this.canvas.width/16, 350, this.canvas.width/4, 5);
            platform6 = new this.Platform(this.canvas.width/4, 450, this.canvas.width/2, 5);
            platform7 = new this.Platform(this.canvas.width/16, 550, this.canvas.width/8, 5);
            platform8 = new this.Platform(13*this.canvas.width/16, 550, this.canvas.width/8, 5);
        }
        this.platforms.push(platform1);
        this.platforms.push(platform2);
        this.platforms.push(platform3);
        this.platforms.push(platform4);
        this.platforms.push(platform5);
        this.platforms.push(platform6);
        this.platforms.push(platform7);
        this.platforms.push(platform8);
    },
    
    /// summary
    /// draws HUD
    /// summary
    drawHUD: function(ctx){
        var startButton = document.querySelector("#start");
        var controlsButton = document.querySelector("#controls");
        var restartButton = document.querySelector("#restart");
        var levels = document.querySelector("#levels");
        
        this.ctx.save();
        if(this.gameState === this.GAME_STATE.BEGIN){
            startButton.style.display = "block";
            controlsButton.style.display = "block";
            restartButton.style.display ="none";
            levels.style.display = "none";
            startButton.onclick = function(){
                app.main.gameState = app.main.GAME_STATE.LEVEL_SELECT;
            };
            controlsButton.onclick = function(){
                if(!app.main.displayCTRL){
                    app.main.displayCTRL = true;
                }
                else{
                    app.main.displayCTRL = false
                }
            }
            
            if(this.displayCTRL) this.ctx.drawImage(this.imageCTRL, this.canvas.width/10, this.canvas.height/3);
            this.ctx.font = "14pt pixelFont";
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            this.ctx.fillText("King of the Ball", this.canvas.width/2, this.canvas.height/2 - 250);
            this.ctx.fillText("Matthew Fong", this.canvas.width/2, this.canvas.height/2 - 200);
        }
        else if(this.gameState === this.GAME_STATE.LEVEL_SELECT){
            startButton.style.display = "none";
            controlsButton.style.display = "none";
            restartButton.style.display ="none";
            levels.style.display = "inline";
            var lvl1 = document.querySelector("#lvl1");
            var lvl2 = document.querySelector("#lvl2");
            var lvl3 = document.querySelector("#lvl3");
            
            lvl1.onclick = function(){
                app.main.gameState = app.main.GAME_STATE.DEFAULT;
                app.main.makePlatforms(1);
                app.main.p1.spawnX = app.main.canvas.width/4;
                app.main.p1.spawnY = app.main.canvas.height/2 + 15;
                app.main.p1.spawn(app.main.p1.spawnX, app.main.p1.spawnY, app.main.PLAYER_DIRECTION_STATE.IDLE, app.main.PLAYER_STATE.GROUNDED, app.main.PLAYER_BALL_STATE.DEFAULT);
                app.main.p2.spawnX = app.main.canvas.width/4 + app.main.canvas.width/2 - 30;
                app.main.p2.spawnY = app.main.canvas.height/2 + 15;
                app.main.p2.spawn(app.main.p2.spawnX, app.main.p2.spawnY, app.main.PLAYER_DIRECTION_STATE.IDLE, app.main.PLAYER_STATE.GROUNDED, app.main.PLAYER_BALL_STATE.DEFAULT);
            };
            lvl2.onclick = function(){
                app.main.gameState = app.main.GAME_STATE.DEFAULT;
                app.main.makePlatforms(2);
                app.main.p1.spawnX = app.main.canvas.width/4 - 130;
                app.main.p1.spawnY = app.main.canvas.height/2 + 15;
                app.main.p1.spawn(app.main.p1.spawnX, app.main.p1.spawnY, app.main.PLAYER_DIRECTION_STATE.IDLE, app.main.PLAYER_STATE.GROUNDED, app.main.PLAYER_BALL_STATE.DEFAULT);
                app.main.p2.spawnX = app.main.canvas.width/4 + app.main.canvas.width/2 + 100;
                app.main.p2.spawnY = app.main.canvas.height/2 + 15;
                app.main.p2.spawn(app.main.p2.spawnX, app.main.p2.spawnY, app.main.PLAYER_DIRECTION_STATE.IDLE, app.main.PLAYER_STATE.GROUNDED, app.main.PLAYER_BALL_STATE.DEFAULT);
            };
            lvl3.onclick = function(){
                app.main.gameState = app.main.GAME_STATE.DEFAULT;
                app.main.makePlatforms(3);
                app.main.p1.spawnX = app.main.canvas.width/4 - 95;
                app.main.p1.spawnY = 150;
                app.main.p1.spawn(app.main.p1.spawnX, app.main.p1.spawnY, app.main.PLAYER_DIRECTION_STATE.IDLE, app.main.PLAYER_STATE.GROUNDED, app.main.PLAYER_BALL_STATE.DEFAULT);
                app.main.p2.spawnX = app.main.canvas.width/4 + app.main.canvas.width/2 + 65;
                app.main.p2.spawnY = 150;
                app.main.p2.spawn(app.main.p2.spawnX, app.main.p2.spawnY, app.main.PLAYER_DIRECTION_STATE.IDLE, app.main.PLAYER_STATE.GROUNDED, app.main.PLAYER_BALL_STATE.DEFAULT);
            };
            this.ctx.font = "18pt pixelFont";
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Select Level", this.canvas.width/2, this.canvas.height/2 - 200);
        }
        else if(this.gameState === this.GAME_STATE.DEFAULT){
            startButton.style.display = "none";
            controlsButton.style.display = "none";
            restartButton.style.display ="none";
            levels.style.display = "none";
            this.ctx.font = "12pt pixelFont";
            this.ctx.fillStyle = "white";
            this.ctx.fillText("Red Score: " + Math.floor(this.p1.score), this.canvas.width - 180, this.canvas.height - 10);
            this.ctx.fillText("Blue Score: " + Math.floor(this.p2.score), 15, this.canvas.height - 10);
            this.ctx.font = "14pt pixelFont";
            this.ctx.textAlign = "center";
            this.ctx.fillText(Math.floor(this.globalTime), this.canvas.width/2, 30);
        }
        else if(this.gameState === this.GAME_STATE.PAUSE){
            startButton.style.display = "none";
            controlsButton.style.display = "none";
            restartButton.style.display ="none";
            levels.style.display = "none";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.font = "40pt pixelFont";
            this.ctx.fillStyle = "white";
            this.ctx.fillText("GAME PAUSED", this.canvas.width/2, this.canvas.height/2);
        }
        else if(this.gameState === this.GAME_STATE.END){
            startButton.style.display = "none";
            controlsButton.style.display = "none";
            restartButton.style.display ="inline";
            levels.style.display = "none";
            restartButton.onclick = function(){
                app.main.resetGame(); 
            }
            this.stopBGAudio();
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.font = "40pt pixelFont";
            this.ctx.fillStyle = "white";
            this.ctx.fillText("GAME OVER", this.canvas.width/2, this.canvas.height/2 - 100);
            if(this.winner != "none") this.ctx.fillText(this.winner + " WINS!", this.canvas.width/2, this.canvas.height/2 - 25);
            else this.ctx.fillText("TIE GAME!", this.canvas.width/2, this.canvas.height/2 - 25);
        }
        this.ctx.restore();
    },
    
    /// summary
    /// handle player input
    /// summary
    handleInput: function(){
        // Player 1 Key Controls
        if(this.myKeys.keydown[this.myKeys.KEYBOARD.D])
            this.p1.playerDirection = this.PLAYER_DIRECTION_STATE.RIGHT;
        else if(this.myKeys.keydown[this.myKeys.KEYBOARD.A]) 
            this.p1.playerDirection = this.PLAYER_DIRECTION_STATE.LEFT;
        else if(!this.myKeys.keydown[this.myKeys.KEYBOARD.D] && !this.myKeys.keydown[this.myKeys.KEYBOARD.A])
            this.p1.playerDirection = this.PLAYER_DIRECTION_STATE.IDLE;
        if(this.myKeys.keydown[this.myKeys.KEYBOARD.W] && !this.p1.jumpBool) 
            this.p1.playerState = this.PLAYER_STATE.JUMPING;
        
        // Allows Player 1 to interact
        if(this.myKeys.keydown[this.myKeys.KEYBOARD.G]) this.p1.interactBool = true;
        else  this.p1.interactBool = false;
        
        // Player 2 Key Controls
        if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_LEFT])
            this.p2.playerDirection = this.PLAYER_DIRECTION_STATE.LEFT;
        else if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_RIGHT])
            this.p2.playerDirection = this.PLAYER_DIRECTION_STATE.RIGHT;
        else if(!this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_LEFT] && !this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_RIGHT])
            this.p2.playerDirection = this.PLAYER_DIRECTION_STATE.IDLE;
        if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_UP] && !this.p2.jumpBool)
            this.p2.playerState = this.PLAYER_STATE.JUMPING;
        
        // Allows Player 2 to interact
        if(this.myKeys.keydown[this.myKeys.KEYBOARD.NUMPAD_0] || this.myKeys.keydown[this.myKeys.KEYBOARD.L]) this.p2.interactBool = true;
        else  this.p2.interactBool = false;
    },
    
    /// summary
    /// checks score of palyers and sees if there is a winner
    /// summary
    checkScore: function(dt){
        // score logic for both players
        if(this.p1.ballState === this.PLAYER_BALL_STATE.ONBALL && this.p1.x > this.canvas.width/2) this.p1.score += dt;
        if(this.p2.ballState === this.PLAYER_BALL_STATE.ONBALL && this.p2.x < this.canvas.width/2) this.p2.score += dt;
        
        if(this.globalTime <= 0){
            if(Math.floor(this.p1.score) > Math.floor(this.p2.score)) this.winner = "RED";
            else if(Math.floor(this.p1.score) < Math.floor(this.p2.score)) this.winner = "BLUE";
            else this.winner = "none";
        }
        
        if(this.winner != undefined) this.gameState = this.GAME_STATE.END; // once we have a winner, change gameState to GAME OVER STATE
    },
    
    /// summary
    /// checks collision b/w player1 (A) and player2 (B) (AABB V AABB)
    /// summary
    checkCollisionPlayerVPlayer: function(playerA, playerB){
        var minXA = playerA.x;
        var maxXA = playerA.x + playerA.w;
        var minYA = playerA.y;
        var maxYA = playerA.y + playerA.h;
        var minXB = playerB.x;
        var maxXB = playerB.x + playerB.w;
        var minYB = playerB.y;
        var maxYB = playerB.y + playerB.h;
        
        if(minXB < maxXA && maxXB > minXA && minYB < maxYA && maxYB > minYA) return true;
        else return false;
    },
    
    /// summary
    /// checks collision b/w player and ball (AABB V SPHERE)
    /// summary
    checkCollisionPlayerVBall: function(player, ball){ 
        var minX = player.x;
        var maxX = player.x + player.w;
        var minY = player.y;
        var maxY = player.y + player.h;
        
        var x = clamp(maxX, minX, ball.x);
        var y = clamp(maxY, minY, ball.y);
        
        var dist = Math.sqrt((x - ball.x) * (x - ball.x) + (y - ball.y) * (y - ball.y));
        
        if(dist < ball.r) return true;
        else return false;
    },
    
    /// summary
    /// checks collision b/w player and platforms (AABB V AABB)
    /// summary
    checkCollisionPlayerVPlatform: function(player, platform){
        var minX = player.x;
        var maxX = player.x + player.w;
        var minY = player.y;
        var maxY = player.y + player.h;
        
        var minXP = platform.x;
        var maxXP = platform.x + platform.w;
        var minYP = platform.y;
        var maxYP = platform.y + (platform.h - 4);
            
       if(minXP < maxX && maxXP > minX && minYP < maxY && maxYP > minY) return true;
       else return false;
    },
    
    /// summary
    /// calls checkCollisionPlayerVPlatform for each platform
    /// summary
    checkPlatformCollisions: function(player){
        for(var i = 0; i < this.platforms.length; i++){
            if(player.playerState !== this.PLAYER_STATE.JUMPING){
                if(this.checkCollisionPlayerVPlatform(player, this.platforms[i])){ 
                    player.y = this.platforms[i].y - player.h+1; // grounded on platform
                    player.playerState = this.PLAYER_STATE.GROUNDED;
                    player.jumpBool = false;
                    break;
                }
                else player.playerState = this.PLAYER_STATE.FALLING;
            }
        }
    },
    
    /// summary
    /// check screen boundaries and respawns players if they "fall off" screen
    /// summary
    checkBoundaries: function(player){
        player.x = clamp(player.x, 0, this.canvas.width - player.w); // sides of screen
        if(player.y < 0) player.y = 0; // top of  screen
        if(player.y > this.canvas.height) player.spawn(player.spawnX, player.spawnY, this.PLAYER_DIRECTION_STATE.IDLE, this.PLAYER_STATE.GROUNDED, this.PLAYER_BALL_STATE.DEFAULT); // respawns player when they fall off level
    },
    
    /// summary
    /// stops the background audio
    /// summary
    stopBGAudio: function(){
        this.bgAudio.pause();
        //this.bgAudio.currentTime = 0; // restarts the song
    },
    
    /// summary
    /// plays sound effects for punching and ball
    /// summary
    playEffect: function(fileIndex){
        if(fileIndex == 1) this.punchAudio.play();
        else if(fileIndex == 2) this.ballAudio.play();
    },
    
    /// summary
    /// pauses the game
    /// summary
    pauseGame: function(){
        this.stopBGAudio();
        this.currentState = this.gameState;
        this.gameState = this.GAME_STATE.PAUSE;
        cancelAnimationFrame(this.animationID);
        this.update();
    },
    
    /// summary
    /// resumes the game
    /// summary
    resumeGame: function(){
        this.gameState = this.currentState;
        if(this.gameState == this.GAME_STATE.DEFAULT) this.bgAudio.play();
        cancelAnimationFrame(this.animationID);
        this.update();
    },
    
    /// summary
    /// resets the game
    /// summary
    resetGame: function(){
        // reset game variables
        this.gameState = this.GAME_STATE.BEGIN; 
        this.displayCTRL = false;
        this.bgAudio.currentTime = 0;
        this.winner = undefined;
        this.globalTime = 150;
        this.lastTime = 0;
        this.animationID = 0;
        this.p1.score = 0;
        this.p2.score = 0;
        
        this.ball.spawn(this.canvas.width/2, this.canvas.height/2 + 40); // spawn ball
    }
};