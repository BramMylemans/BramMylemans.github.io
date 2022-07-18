/* ================================
DOG 
================================= */

class Dog {
    constructor(x, y) {
        this.legs = new PIXI.AnimatedSprite(dogLegsTextures, false);
        this.legs.anchor.set(0.5);
        this.legs.scale.set(0.65);
        this.body = new PIXI.AnimatedSprite(dogBodyTextures, false);
        this.body.anchor.set(0.5);
        this.body.scale.set(0.6);
        this.currentLegsFrame = 0;
        this.currentBodyFrame = 0;
        this.forwardSpeed = 0;
        this.maxForwardSpeed = 5;
        this.bark = 0;
        this.positionX = x;
        this.positionY = y;
        this.rotation = 0;
        animalContainer.addChild(this.legs);
        animalContainer.addChild(this.body);
    }


    // soft bump

    softBump(vectorX, vectorY, dist, softBumpAngle) {
        const softBumpDist = 10;
        if (dist < softBumpDist) {           // bump: stop and turn away
            if (dist < 0.000001) dist = 0.000001;
            let relativeAngle = this.rotation - normalizeAngle(Math.atan2(vectorY, vectorX) + halfPI);
            relativeAngle = normalizeAngle(relativeAngle);               // angle between sheeps heading and obstacle
            if (Math.abs(relativeAngle) < softBumpAngle) {               // obstacle in front -> slow down
                this.forwardSpeed = min(this.forwardSpeed, this.maxForwardSpeed * Math.sqrt(dist / softBumpDist));
            }
        }
    }


    // update

    update() {
        this.bark *= .96;
        this.forwardSpeed *= .95;

        // mouse controls
        let mousePosition = app.renderer.plugins.interaction.mouse.global;
        let mx = constrain(mousePosition.x - gameWidth / 2, -gameWidth / 4, gameWidth / 4) / mouseRatio;
        let my = constrain(mousePosition.y - gameHeight / 2, -gameHeight / 4, gameHeight / 4) / mouseRatio;
        this.forwardSpeed = this.forwardSpeed * .99 + (Math.sqrt(mx * mx + my * my) * this.maxForwardSpeed * 2) * .1;
        if (this.forwardSpeed > this.maxForwardSpeed) this.forwardSpeed = this.maxForwardSpeed;

        // obstacles: sheep
        let distSum = 0;
        for (let i = 0; i < sheepAmt; i++) {
            let dist = getDistanceBetweenAnimals(sheep[i], this);
            if (dist < 600) distSum += 600 - dist;
            this.softBump(sheep[i].positionX - this.positionX, sheep[i].positionY - this.positionY, dist, .8)
        }
        bellsSound.volume(constrain(Math.sqrt(distSum / 10000), 0, .4));

        // obstacles: lines
        for (let i = 0; i < obstLines.length; i++) {
            let dist = getDistanceToLine(obstLines[i], this.positionX, this.positionY);
            this.softBump(dist[1], dist[2], dist[0] - animalRadius1, halfPI);
        }

        // obstacles: circles
        for (let i = 0; i < obstCircles.length; i++) {
            let dist = getDistancePP(obstCircles[i][0], obstCircles[i][1], this.positionX, this.positionY) - (animalRadius1 + obstCircles[i][2]);
            let vectorX = (obstCircles[i][0] - this.positionX);
            let vectorY = (obstCircles[i][1] - this.positionY);
            this.softBump(vectorX, vectorY, dist, .8);
        }

        // animate body
        const targetRotation = Math.atan2(my, mx) + halfPI;
        const targetBodyFrame = normalizeAngle(targetRotation - this.rotation) * 16;
        if (targetBodyFrame > this.currentBodyFrame) this.currentBodyFrame++;
        if (targetBodyFrame < this.currentBodyFrame) this.currentBodyFrame--;
        this.currentBodyFrame = constrain(this.currentBodyFrame, -20, 20);
        this.body.gotoAndStop(Math.abs(this.currentBodyFrame));
        if (this.currentBodyFrame > 0) this.body.scale.x = -0.6;
        else this.body.scale.x = 0.6;
        
        // animate legs
        this.currentLegsFrame +=  this.forwardSpeed/2;
        while (this.currentLegsFrame > 40) this.currentLegsFrame -= 40;
        this.legs.gotoAndStop(this.currentLegsFrame);

        this.rotation = normalizeAngle(averageAngle(this.rotation,targetRotation, .95));
        this.positionX += Math.sin(this.rotation) * this.forwardSpeed;
        this.positionY -= Math.cos(this.rotation) * this.forwardSpeed;
        this.legs.position.x = this.positionX;
        this.legs.position.y = this.positionY;
        this.legs.rotation = this.rotation;
        this.body.position.x = this.positionX;
        this.body.position.y = this.positionY;
        this.body.rotation = this.rotation;
    }
}

