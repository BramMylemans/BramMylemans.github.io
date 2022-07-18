"use strict";
const sheepAmt = sheepPos.length;
const animalRadius1 = 22;  // larger radius of ellipse
const animalRadius2 = 11;  // smaller radius of ellipse
let sheepBodyTextures = [];
let sheepLegsTextures = [];
let dogBodyTextures = [];
let dogLegsTextures = [];
let sheep = [];
let dog;
let keyMap = [];
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;
let documentHidden = false;
let gameScale = 1;
let mouseRatio = min(gameWidth, gameHeight);
let app = new PIXI.Application({
    antialiasing: true,
    transparent: false,
    resolution: 1,
    backgroundColor: 0x151F29,
    resizeTo: window
}
);

let barkSound = [new Howl({ src: ['sound/bark1.wav'] }), new Howl({ src: ['sound/bark2.wav'] }), new Howl({ src: ['sound/bark3.wav'] })];
let bellsSound = new Howl({ src: ['sound/bells.wav'], autoplay: true, loop: true });

let game = new PIXI.Container();
document.body.appendChild(app.view);

let animalContainer = new PIXI.Container();
/*
let shadowContainer = new PIXI.Container();
let shadowSprite = new PIXI.Sprite();
let shadowTexture = PIXI.RenderTexture.create(
    4096,
    4096
);
*/

PIXI.Loader.shared
    .add("img/sheep_body.png")
    .add("img/sheep_legs.png")
    .add("img/dog_body.png")
    .add("img/dog_legs.png")
    .add("img/colli.png")
    .add("img/bg.svg")
    .add("img/fg.svg")
    .load(setup);

function setup() {
    app.stage.interactive = true;
    app.stage.addChild(game);
    game.interactive = true;

    // add background layer
    const bg = new PIXI.Sprite(PIXI.Loader.shared.resources["img/bg.svg"].texture);
    game.addChild(bg);

    /*
    // add shadow layer
    game.addChild(shadowContainer);
    shadowContainer.addChild(shadowSprite);
    shadowContainer.position.x=4;
    shadowContainer.position.y=4;
    shadowSprite.tint = 0x000000;
    shadowSprite.alpha = .3;
    */

    // add sheep
    const sheepBodyTextureMap = PIXI.Loader.shared.resources["img/sheep_body.png"].texture;
    for (let i = 0; i < 25; i++) sheepBodyTextures.push(new PIXI.Texture(sheepBodyTextureMap, new PIXI.Rectangle(0 + i * 60, 0, 60, 100)));
    const sheepLegsTextureMap = PIXI.Loader.shared.resources["img/sheep_legs.png"].texture;
    for (let i = 0; i < 40; i++) sheepLegsTextures.push(new PIXI.Texture(sheepLegsTextureMap, new PIXI.Rectangle(0 + i * 60, 0, 60, 100)));
    for (let i = 0; i < sheepAmt; i++) sheep[i] = new Sheep(sheepPos[i][0], sheepPos[i][1]);

    // add dog
    const dogBodyTextureMap = PIXI.Loader.shared.resources["img/dog_body.png"].texture;
    for (let i = 0; i < 25; i++) dogBodyTextures.push(new PIXI.Texture(dogBodyTextureMap, new PIXI.Rectangle(0 + i * 60, 0, 60, 100)));
    const dogLegsTextureMap = PIXI.Loader.shared.resources["img/dog_legs.png"].texture;
    for (let i = 0; i < 40; i++) dogLegsTextures.push(new PIXI.Texture(dogLegsTextureMap, new PIXI.Rectangle(0 + i * 60, 0, 60, 100)));
    dog = new Dog(2083, 2000);

    // add animal layer
    game.addChild(animalContainer);

    // add foreground layer
    const fg = new PIXI.Sprite(PIXI.Loader.shared.resources["img/fg.svg"].texture);
    game.addChild(fg);


    /*
    EVENTS
    */
    // initiate game loop
    app.ticker.add(delta => gameLoop(delta));
    bellsSound.play();

    // mousewheel listener -> zoom
    window.addEventListener("wheel", event => {
        if (Math.sign(event.deltaY) < 0) gameScale *= 1.1; // zoom in
        else gameScale *= .9;                              // zoom out
        gameScale = constrain(gameScale, .1, 1);
        game.scale.x = gameScale;
        game.scale.y = gameScale;
    });

    // mouseDown listener -> bark
    window.addEventListener("mousedown", event => {
        if (dog.bark < 1.3) {
            // set timer
            dog.bark = 2;
            // play sound
            let sample = Math.floor(random(0, 3));
            let id = barkSound[sample].play();
            barkSound[sample].rate(1 + random(0, 0.2), id);
        }
    });

    // keys listener -> add pressed keys to keymap array
    onkeydown = onkeyup = function (e) {
        e = e || event; // deal with IE
        keyMap[e.keyCode] = e.type == 'keydown';
    }

    // window resize listener
    window.addEventListener('resize', () => {
        gameWidth = window.innerWidth;
        gameHeight = window.innerHeight;
        mouseRatio = min(gameWidth, gameHeight);
    });

    // focus listener
    document.addEventListener('visibilitychange', () => {
        documentHidden = document.hidden;
        if (documentHidden) bellsSound.stop();
        else bellsSound.play();
    });
}

/*
GAME LOOP
*/
function gameLoop(delta) {
    if (!documentHidden) {
        dog.update();
        game.x = -dog.positionX * gameScale + gameWidth / 2;
        game.y = -dog.positionY * gameScale + gameHeight / 2;
        for (let i = 0; i < sheepAmt; i++) sheep[i].update();

        /*
        app.renderer.render(animalContainer, shadowTexture, false) ;
        shadowSprite.texture = shadowTexture;   
        */
    }
}

