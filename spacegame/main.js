// levels: gates, bakens, steeds landings- en vertrek pad
// hemmellichaam dat aantrekt ?
// gelimiteerde brandstof

"use strict";

let debugRenderer = false;
let gameWidth = window.innerWidth, gameHeight = window.innerHeight;
var keyMap = [];
let spaceship;
var launchpad = [];
let fuelGauge;
let prevHit = false;
let text;
let gameEnded = false;
let tdImpact;
let tdAngle;
let tdPrecision;
let tdImpactLimit = 1.2;
let tdAngleLimit = .3;

var engine = Matter.Engine.create();
engine.world.gravity.y = 0.06;

if (debugRenderer) {        // debug
    var canvas = document.createElement('canvas');
    canvas.width = gameWidth, canvas.height = gameHeight;
    document.body.appendChild(canvas);
    var debugRender = Matter.Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: gameWidth,
            height: gameHeight
        }
    });
    Matter.Render.run(debugRender);
}

let app = new PIXI.Application({
    antialiasing: true,
    transparent: false,
    resolution: 1,
    backgroundColor: 0x151F29,
    resizeTo: window
}
);

let game = new PIXI.Container();
document.body.appendChild(app.view);
PIXI.Loader.shared
    .add("img/spaceship.png")
    .add("img/thruster.png")
    .add("img/launchpad.png")
    .add("img/light.png")
    .load(setup);


function setup() {
    launchpad[0] = new Launchpad(gameWidth / 4 * 1, gameHeight / 8 * 7);
    launchpad[1] = new Launchpad(gameWidth / 4 * 3, gameHeight / 4 * 3);
    fuelGauge = new Gauge(gameWidth / 2 - 100, 20, 200, 10);
    text = new PIXI.Text("", { fontFamily: 'Arial', fontSize: 16, fill: 0xDDDDff, align: 'center' });
    text.position.x = (gameWidth - text.width) / 2;
    text.position.y = 50;
    game.addChild(text);
    startGame();

    app.stage.interactive = true;
    app.stage.addChild(game);
    game.interactive = true;
    app.ticker.add(delta => gameLoop(delta));           // initiate game loop

    Matter.Events.on(engine, 'collisionStart', function (event) {
        if (!gameEnded) {
            for (let i = 0; i < event.pairs.length; i++) {
                let lp;
                if (event.pairs[i].bodyA.id == launchpad[0].physics.id || event.pairs[i].bodyB.id == launchpad[0].physics.id) lp = 0;
                if (event.pairs[i].bodyA.id == launchpad[1].physics.id || event.pairs[i].bodyB.id == launchpad[1].physics.id) lp = 1;
                tdImpact = max(tdImpact, spaceship.physics.speed);
                tdAngle = max(tdAngle, Math.abs(normalizeAngle(spaceship.physics.angle)));
                tdPrecision = max(tdPrecision, Math.abs(spaceship.position.x - launchpad[lp].position.x));

                if (tdImpact > tdImpactLimit || tdAngle > tdAngleLimit) {
                    text.text = "Crash!"
                    endGame(false);
                }
            }
        }
    });
}

/*
GAME LOOP
*/
function gameLoop(delta) {
    Matter.Engine.update(engine);
    spaceship.update();
    launchpad[0].update();
    launchpad[1].update();
    fuelGauge.update(spaceship.fuelLevel);

    if (!gameEnded) {
        if (Math.abs(spaceship.x - gameWidth / 2) > gameWidth || Math.abs(spaceship.y - gameHeight / 2) > gameHeight) {
            text.text = "Lost in space!"
            endGame(true);
        }
        if (Math.abs(spaceship.position.x - launchpad[1].position.x) < launchpad[1].width && Math.abs(spaceship.physics.velocity.y) < .001 && Math.abs(spaceship.physics.velocity.x) < .001) {
            text.text = "Landed!"
            endGame(true);
        }
    }
}



function startGame() {
    gameEnded = false;
    tdImpact = 0;
    tdAngle = 0;
    tdPrecision = 0;
    text.text = "";

    if (spaceship) spaceship.destroy();
    spaceship = new Spaceship(gameWidth / 4 * 1, gameHeight / 8 * 7 - 36);

    onkeydown = onkeyup = function (e) {                // keys listener -> add pressed keys to keymap array
        e = e || event; // deal with IE
        keyMap[e.keyCode] = e.type == 'keydown';
    }
}



function endGame(win) {
    gameEnded = true;
    onkeydown = onkeyup = function (e) {                // keys listener -> space restarts game
        e = e || event; // deal with IE
        if (e.keyCode == 32) startGame();
    }
    keyMap=[];

    // display score
    let normalizedImpact = 100 - Math.round(min(tdImpact, tdImpactLimit) / tdImpactLimit * 100);
    let normalizedAngle = 100 - Math.round(min(tdAngle, tdAngleLimit) / tdAngleLimit * 100);
    let normalizedPrecision = 100 - Math.round(tdPrecision);
    let score = 0;
    if (win) score = Math.round((normalizedImpact + normalizedAngle + normalizedPrecision) / 3);
    text.text = text.text + "\nImpact: " + normalizedImpact + "%\nAngle: " + normalizedAngle + "%\nPrecision: " + normalizedPrecision+"%";
    text.text = text.text + "\nTotal score: " + score+"%";
    text.position.x = (gameWidth - text.width) / 2;

}