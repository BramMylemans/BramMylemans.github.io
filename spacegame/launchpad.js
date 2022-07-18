class Launchpad extends PIXI.Sprite {

    constructor(posX, posY) {
        super(PIXI.Loader.shared.resources["img/launchpad.png"].texture);

        // add physics

        let boundaries = [];
        boundaries[0] = Matter.Vector.create(-95, 7);
        boundaries[1] = Matter.Vector.create(95, 7);
        boundaries[2] = Matter.Vector.create(100, -7);
        boundaries[3] = Matter.Vector.create(-100, -7);

        this.physics = Matter.Bodies.fromVertices(posX, posY, boundaries, { isStatic: true })
        this.physics.friction = 0.05;
        this.physics.restitution = 0.9;

        Matter.World.add(engine.world, this.physics);

        // add graphics

        this.anchor.x = 0.5;
        this.anchor.y = 0.58;
        this.position.x = posX;
        this.position.y = posY;

        this.lLight = new PIXI.Sprite(PIXI.Loader.shared.resources["img/light.png"].texture);
        this.addChild(this.lLight);
        this.lLight.anchor.set(0.5, 1);
        this.lLight.position.x = -90;
        this.lLight.position.y = -10;

        this.rLight = new PIXI.Sprite(PIXI.Loader.shared.resources["img/light.png"].texture);
        this.addChild(this.rLight);
        this.rLight.anchor.set(0.5, 1);
        this.rLight.position.x = 90;
        this.rLight.position.y = -10;

        this.cycle = 0;
        this.dir = .01;

        game.addChild(this);
    }

    update() {
        // blink landing lights
        if (this.cycle > .4) this.dir = -.008;
        if (this.cycle < 0) this.dir = .12;
        this.cycle += this.dir;
        this.lLight.scale.x = this.cycle;
        this.lLight.scale.y = this.cycle;
        this.rLight.scale.x = this.cycle;
        this.rLight.scale.y = this.cycle;


    }
}