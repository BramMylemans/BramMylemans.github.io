class Spaceship extends PIXI.Sprite {

    constructor(posX, posY) {
        super(PIXI.Loader.shared.resources["img/spaceship.png"].texture);

        // add physics

        let boundaries = [];
        boundaries[0] = Matter.Vector.create(0, -46);
        boundaries[1] = Matter.Vector.create(-25, 46);
        boundaries[2] = Matter.Vector.create(25, 46);

        this.physics = Matter.Bodies.fromVertices(posX, posY, boundaries);
        this.physics.frictionAir = 0;
        this.physics.friction = .1;
        this.physics.restitution = 0.9;
        this.physics.frictionStatic = 0;

        Matter.World.add(engine.world, this.physics);

        // add sprites

        this.anchor.x = 0.5;
        this.anchor.y = 0.67;
        this.position.x = posX;
        this.position.y = posY;
        this.scale.set(.5);

        this.mainThruster = new PIXI.Sprite(PIXI.Loader.shared.resources["img/thruster.png"].texture);
        this.addChild(this.mainThruster);
        this.mainThruster.anchor.set(0.5, 0);
        this.mainThruster.position.y = 67;

        this.ulThruster = new PIXI.Sprite(PIXI.Loader.shared.resources["img/thruster.png"].texture);
        this.addChild(this.ulThruster);
        this.ulThruster.anchor.set(0.5, 0);
        this.ulThruster.position.y = -80;
        this.ulThruster.position.x = -15;
        this.ulThruster.rotation = halfPI;
        this.ulThruster.scale.x = .2;
        this.ulThruster.scale.y = .2;
        this.ulThruster.visible = false;

        this.urThruster = new PIXI.Sprite(PIXI.Loader.shared.resources["img/thruster.png"].texture);
        this.addChild(this.urThruster);
        this.urThruster.anchor.set(0.5, 0);
        this.urThruster.position.y = -80;
        this.urThruster.position.x = 15;
        this.urThruster.rotation = -halfPI;
        this.urThruster.scale.x = .2;
        this.urThruster.scale.y = .2;
        this.urThruster.visible = false;

        this.blThruster = new PIXI.Sprite(PIXI.Loader.shared.resources["img/thruster.png"].texture);
        this.addChild(this.blThruster);
        this.blThruster.anchor.set(0.5, 0);
        this.blThruster.position.y = 30;
        this.blThruster.position.x = -44;
        this.blThruster.rotation = halfPI;
        this.blThruster.scale.x = .2;
        this.blThruster.scale.y = .2;
        this.blThruster.visible = false;

        this.brThruster = new PIXI.Sprite(PIXI.Loader.shared.resources["img/thruster.png"].texture);
        this.addChild(this.brThruster);
        this.brThruster.anchor.set(0.5, 0);
        this.brThruster.position.y = 30;
        this.brThruster.position.x = 44;
        this.brThruster.rotation = -halfPI;
        this.brThruster.scale.x = .2;
        this.brThruster.scale.y = .2;
        this.brThruster.visible = false;

        game.addChild(this);
        this.enableControls = true;
        this.fuelLevel = 100;
        this.forwardThrust = 0;
    }

    destroy() {
        Matter.World.remove(engine.world, this.physics);
        game.removeChild(this);
    }

    update() {

        if (this.enableControls && this.fuelLevel > 0) {
            if (keyMap[37]) {   // left
                Matter.Body.setAngularVelocity(this.physics, this.physics.angularVelocity - .0006);
                this.fuelLevel -= .05;
                this.urThruster.visible = true;
                this.blThruster.visible = true;
            } else {
                this.urThruster.visible = false;
                this.blThruster.visible = false;
            }

            if (keyMap[39]) {  // right
                Matter.Body.setAngularVelocity(this.physics, this.physics.angularVelocity + .0006);
                this.fuelLevel -= .05;
                this.ulThruster.visible = true;
                this.brThruster.visible = true;
            } else {
                this.ulThruster.visible = false;
                this.brThruster.visible = false;
            }

            if (keyMap[38]) {   // up
                this.forwardThrust += .0003;
                if (this.forwardThrust > .003) this.forwardThrust = .003;
                let a = this.physics.angle + PI + halfPI;
                let vX = Math.cos(a) * .0005;
                let vY = Math.sin(a) * .0005;
                Matter.Body.applyForce(this.physics, { x: this.physics.position.x, y: this.physics.position.y }, { x: vX, y: vY });
                this.fuelLevel -= .2;
            } else this.forwardThrust = 0;

        } else this.forwardThrust = 0;

        this.position = this.physics.position;
        this.rotation = this.physics.angle;
        this.mainThruster.scale.x = this.forwardThrust * 300;
        this.mainThruster.scale.y = this.forwardThrust * 300;
    }
}