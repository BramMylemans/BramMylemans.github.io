"use strict";

let man = new PIXI.Container();
let body;
let win = { width: window.innerWidth, height: window.innerHeight };
let app = new PIXI.Application({
    antialiasing: true,
    transparent: false,
    resolution: 1,
    backgroundColor: 0xFFFFFF,
    resizeTo: window
}
);

document.body.appendChild(app.view);

PIXI.Loader.shared
    .add("img/body.svg")
    .add("img/facemask.svg")
    .add("img/head.svg")
    .add("img/eyes.svg")
    .add("img/pupils.svg")
    .add("img/nose.svg")
    .add("img/mouth.svg")
    .add("img/leg.svg")
    .add("img/pon.svg")
    .load(setup);


function setup() {
    //app.stage.interactive = true;
    man = new Man();
    man.position.set(win.width / 2, win.height - 150);
    addListeners();
    app.ticker.add(delta => gameLoop(delta));
}


/*
GAME LOOP
*/
function gameLoop(delta) {
    man.update();
}

function constrain(value, min, max) {
    if (value < min) value = min;
    if (value > max) value = max;
    return value;
}

function addListeners() {

    window.addEventListener("wheel", event => {
        // mousewheel listener 
        if (Math.sign(event.deltaY) < 0) man.eyes.scale.y += .1; 
        else man.eyes.scale.y -= .1                       
        man.eyes.scale.y = constrain(man.eyes.scale.y, 0, 2);

    });

    window.addEventListener("mousedown", event => {
        man.setEmotion(Math.round(Math.random() * 6) * 10);
    });



}