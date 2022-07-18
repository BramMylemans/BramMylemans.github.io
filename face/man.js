class Man extends PIXI.Container {
    constructor() {
        super();
        app.stage.addChild(this);
        this.frameRate = 1.5;
        this.emotion = 0;
        this.walkCycleAmp = 1;

        /* LEGS */
        this.lleg = new PIXI.Sprite(PIXI.Loader.shared.resources["img/leg.svg"].texture);
        this.lleg.anchor.set(0.5);
        this.addChild(this.lleg);
        this.llegTween = new Tween([[10, 21, -6, -24], [10, 16, -4, -39], [10, 3, -11, -68], [10, -16, -4, 14], [10, -22, 10, 21], [10, -17, 6, 2], [10, 13, 6, 2], [10, 22, 3, -13]]);

        this.rleg = new PIXI.Sprite(PIXI.Loader.shared.resources["img/leg.svg"].texture);
        this.rleg.anchor.set(0.5);
        this.addChild(this.rleg);
        this.rlegTween = new Tween([[10, -22, 10, 21], [10, -17, 6, 2], [10, 13, 6, 2], [10, 22, 3, -13], [10, 21, -6, -24], [10, 16, -4, -39], [10, 3, -11, -68], [10, -16, -4, 14]]);

        /* BODY */
        this.body = new PIXI.Sprite(PIXI.Loader.shared.resources["img/body.svg"].texture);
        this.body.anchor.set(0.5);
        this.addChild(this.body);
        this.bodyTween = new Tween([[10, 0], [10, 6], [10, 3], [10, -3], [10, 0], [10, 6], [10, 3], [10, -3]]);

        /* HEAD */
        this.head = new PIXI.Container();
        this.addChild(this.head);
        this.head.pivot.set(0, 39);
        this.head.position.set(0, -95);

        //bg
        this.headBg = new PIXI.Sprite(PIXI.Loader.shared.resources["img/head.svg"].texture);
        this.headBg.anchor.set(0.5);
        this.head.addChild(this.headBg);

        // pon
        this.pon = new PIXI.Sprite(PIXI.Loader.shared.resources["img/pon.svg"].texture);
        this.pon.anchor.set(0.5);
        this.head.addChild(this.pon);

        // face container
        this.face = new PIXI.Container();
        this.head.addChild(this.face);

        // eyes
        this.eyes = new PIXI.Sprite(PIXI.Loader.shared.resources["img/eyes.svg"].texture);
        this.eyes.anchor.set(0.5);
        this.eyes.position.set(-4.5, 6);
        this.face.addChild(this.eyes);

        this.pupils = new PIXI.Sprite(PIXI.Loader.shared.resources["img/pupils.svg"].texture);
        this.pupils.anchor.set(0.5);
        this.pupils.position.set(-4.5, 6);
        this.face.addChild(this.pupils);

        // nose
        this.nose = new PIXI.Sprite(PIXI.Loader.shared.resources["img/nose.svg"].texture);
        this.nose.anchor.set(0.5);
        this.face.addChild(this.nose);

        // mouth
        this.mouth = new PIXI.Sprite(PIXI.Loader.shared.resources["img/mouth.svg"].texture);
        this.mouth.anchor.set(0.5);
        this.mouth.position.set(-5, 28);
        this.face.addChild(this.mouth);
        this.mouthTween = new Tween([[10, 0.38, -1], [10, 0.54, 0.6], [10, 0.52, -0.4], [10, 0.68, 1], [10, 0.96, +0.8], [10, .50, 0]]);
    }

    setEmotion(emotion) {
        this.emotion = emotion;
        // tween heeft hier geen zin, moet op maat functie worden (transities tss verschillende emoties)
        this.mouthTween.movePlayHeadTo(this.emotion);
        this.mouth.scale = { x: this.mouthTween.read(1), y: this.mouthTween.read(2) }
    }

    update() {
        let mousePosition = app.renderer.plugins.interaction.mouse.global;

        // head (mouse movement)
        let p = this.eyes.getGlobalPosition();
        this.face.position = { x: 1.75 + constrain((mousePosition.x - p.x) / 60, -10, 5), y: constrain((mousePosition.y - p.y) / 60, -3, 3) }
        this.pupils.position = { x: -4.5 + constrain((mousePosition.x - p.x) / 60, -2, 1.4), y: 6 + constrain((mousePosition.y - p.y) / 60, -1, 1) }
        this.head.rotation = -(mousePosition.y - p.y) / win.height;

        // body (animation)
        let walkCycleAmpY = constrain(this.walkCycleAmp, 0, 1)

        this.llegTween.movePlayHeadBy(this.frameRate);
        this.lleg.position = { x: this.llegTween.read(1) * this.walkCycleAmp, y: 88 + this.llegTween.read(2) * walkCycleAmpY }
        this.lleg.rotation = this.llegTween.read(3) * this.walkCycleAmp / 180 * Math.PI;

        this.rlegTween.movePlayHeadBy(this.frameRate);
        this.rleg.position = { x: this.rlegTween.read(1) * this.walkCycleAmp, y: 88 + this.rlegTween.read(2) * walkCycleAmpY }
        this.rleg.rotation = this.rlegTween.read(3) * this.walkCycleAmp / 180 * Math.PI;

        this.bodyTween.movePlayHeadBy(this.frameRate);
        this.body.position.y = this.bodyTween.read(1) * walkCycleAmpY;
        this.head.position.y = this.bodyTween.read(1) * walkCycleAmpY - 95;
        this.pon.rotation = this.head.position.y / 80 + 1.2;
    }
}

