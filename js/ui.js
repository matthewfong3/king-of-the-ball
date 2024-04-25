 "use strict";
 
 // Helper Function to set up ui buttons
 const setupUI = () => {
    let start = document.querySelector("#start");
    let controls = document.querySelector("#controls");
    let restart = document.querySelector("#restart");
    let lvl1 = document.querySelector("#lvl1");
    let lvl2 = document.querySelector("#lvl2");
    let lvl3 = document.querySelector("#lvl3");

    start.addEventListener('mouseover', () => {
        start.src = "images/startHOVER.png";
        start.style.cursor = "pointer";
    });

    controls.addEventListener('mouseover', () => {
        controls.src = "images/controlsHOVER.png";
        controls.style.cursor = "pointer";
    });

    restart.addEventListener('mouseover', () => {
        restart.src = "images/playagainHOVER.png";
        restart.style.cursor = "pointer";
    });

    lvl1.addEventListener('mouseover', () => {
        lvl1.src = "images/level1HOVER.png";
        lvl1.style.cursor = "pointer";
    });

    lvl2.addEventListener('mouseover', () => {
        lvl2.src = "images/level2HOVER.png";
        lvl2.style.cursor = "pointer";
    });

    lvl3.addEventListener('mouseover', () => {
        lvl3.src = "images/level3HOVER.png";
        lvl3.style.cursor = "pointer";
    });

    start.addEventListener('mouseout', () => {
        start.src = "images/startDEFAULT.png";
    });

    controls.addEventListener('mouseout', () => {
        controls.src = "images/controlsDEFAULT.png";
    });

    restart.addEventListener('mouseout', () => {
        restart.src = "images/playagainDEFAULT.png";
    });

    lvl1.addEventListener('mouseout', () => {
        lvl1.src = "images/level1DEFAULT.png";
    });

    lvl2.addEventListener('mouseout', () => {
        lvl2.src = "images/level2DEFAULT.png";
    });

    lvl3.addEventListener('mouseout', () => {
        lvl3.src = "images/level3DEFAULT.png";
    });
 }