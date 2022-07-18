/* ======================================
SHEEP 
====================================== */

class Sheep {
    constructor(x, y) {
        this.legs = new PIXI.AnimatedSprite(sheepLegsTextures, false);
        this.legs.anchor.set(0.5);
        this.legs.scale.set(0.6);
        this.body = new PIXI.AnimatedSprite(sheepBodyTextures, false);
        this.body.anchor.set(0.5);
        this.body.scale.set(0.6);
        this.forwardSpeed = 0;
        this.currentLegsFrame = 0;
        this.currentBodyFrame = 0;
        this.maxForwardSpeed = 2 + random(0, 1);
        this.deceleration = .998; //.985 + random(0, .01);
        this.positionX = x;
        this.positionY = y;
        this.rotation = Math.random() * doublePI;
        this.loiterSpeed = .1 + Math.random() * .2;
        this.rotationSpeed = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.frightened = false;
        animalContainer.addChild(this.legs);
        animalContainer.addChild(this.body);
    }


    // interact with dog (repel)

    interactWithDog(dog) {
        let distanceOfInfluence = 100;
        let dist = getDistancePP(dog.positionX, dog.positionY, this.positionX, this.positionY);
        let vectorX = (dog.positionX - this.positionX) / dist;
        let vectorY = (dog.positionY - this.positionY) / dist;
        dist -= animalRadius1 * 2 - 10;
        // distanceOfInfluence varies with orientation/barking
        let relativeAngle = dog.rotation - normalizeAngle(Math.atan2(this.positionY - dog.positionY, this.positionX - dog.positionX) + halfPI);
        relativeAngle = Math.abs(normalizeAngle(relativeAngle)); // angle between dog's heading and sheep position
        let repel = relativeAngle < 1 ? 2 : 1;
        repel += dog.bark;
        distanceOfInfluence *= repel;

        this.frightened = false;
        if (dist < distanceOfInfluence) {
            this.frightened = true;
            if (dist < 0) dist = .0001;
            let influence = -power((distanceOfInfluence - dist));
            this.targetX += vectorX * influence * 100;
            this.targetY += vectorY * influence * 100;
            let relativeAngle = this.rotation - normalizeAngle(Math.atan2(this.targetY, this.targetX) + halfPI);
            relativeAngle = Math.abs(normalizeAngle(relativeAngle));     // angle between sheeps heading and dog
            if (relativeAngle < 2.5) this.forwardSpeed -= influence / 1000000;
            this.rotationSpeed -= influence / 1000000;
            this.softBump(vectorX, vectorY, dist);
        }
    }


    // interact with other sheep (attract & repel)

    interactWithSheep(otherSheep) {
        const distanceOfInfluence = 600;
        // get distance & unit vector
        let dist = getDistancePP(otherSheep.positionX, otherSheep.positionY, this.positionX, this.positionY);
        let vectorX = (otherSheep.positionX - this.positionX) / dist;
        let vectorY = (otherSheep.positionY - this.positionY) / dist;
        dist -= animalRadius1 * 2;
        if (dist < 0) dist = getDistanceEE(otherSheep.positionX, otherSheep.positionY, otherSheep.rotation, this.positionX, this.positionY, this.rotation, animalRadius2, animalRadius1);
        if (dist < distanceOfInfluence) {
            if (dist < 0) dist = .0001;
            let influence;
            if (this.frightened) influence = (distanceOfInfluence - dist - power(40 * this.forwardSpeed / dist)) * 10;   // when frightened, seek refuge with other sheep
            else influence = distanceOfInfluence - dist - power(4000 * this.forwardSpeed / dist); // normal sheep attract & repel
            this.targetX += vectorX * influence;
            this.targetY += vectorY * influence;
            this.softBump(vectorX, vectorY, dist);
        }
    }


    // interact with vector (repel - avoid objects)

    vectorRepel(vectorX, vectorY, dist) {
        dist -= 10;
        if (dist < 600) {
            if (dist < 0) dist = .0001;
            let influence = -power(4000 * this.forwardSpeed / dist);
            this.targetX += vectorX * influence;
            this.targetY += vectorY * influence;
            this.softBump(vectorX, vectorY, dist);
        }
    }


    // soft bump

    softBump(vectorX, vectorY, dist) {
        const softBumpDist = 30;
        if (dist < softBumpDist) {           // bump: stop and turn away
            let relativeAngle = this.rotation - normalizeAngle(Math.atan2(vectorY, vectorX) + halfPI);
            relativeAngle = normalizeAngle(relativeAngle);     // angle between sheeps heading and obstacle
            if (Math.abs(relativeAngle) < .8) {               // obstacle in front -> slow down 
                this.forwardSpeed = min(this.forwardSpeed, this.maxForwardSpeed * Math.sqrt(dist / softBumpDist));
            }
        }
    }


    // update

    update() {
        this.forwardSpeed *= this.deceleration;
        this.forwardSpeed += constrain(this.loiterSpeed - this.forwardSpeed, 0, this.loiterSpeed) / 10; // loiter speed
        this.rotationSpeed = .004;
        this.targetX = 0;
        this.targetY = 0;
        this.interactWithDog(dog);
        for (let i = 0; i < sheepAmt; i++) if (sheep[i] != this) this.interactWithSheep(sheep[i]);

        // interact with obstacles: lines
        for (let i = 0; i < obstLines.length; i++) {
            let d = getDistanceToLine(obstLines[i], this.positionX, this.positionY);
            this.vectorRepel(d[1], d[2], d[0] - animalRadius1);
        }

        // interact with obstacles: circles
        for (let i = 0; i < obstCircles.length; i++) {
            let dist = getDistancePP(obstCircles[i][0], obstCircles[i][1], this.positionX, this.positionY);
            let vectorX = (obstCircles[i][0] - this.positionX) / dist;
            let vectorY = (obstCircles[i][1] - this.positionY) / dist;
            dist -= (animalRadius1 + obstCircles[i][2]);
            this.vectorRepel(vectorX, vectorY, dist);
        }

        // animate body
        const targetRotation = Math.atan2(this.targetY, this.targetX) + halfPI;
        const targetBodyFrame = normalizeAngle(targetRotation - this.rotation) * 8;
        if (targetBodyFrame > this.currentBodyFrame) this.currentBodyFrame++;
        if (targetBodyFrame < this.currentBodyFrame) this.currentBodyFrame--;
        this.currentBodyFrame = constrain(this.currentBodyFrame, -20, 20);
        this.body.gotoAndStop(Math.abs(this.currentBodyFrame));
        this.body.scale.x = this.currentBodyFrame > 0 ? -0.6 : 0.6;

        // animate legs
        if (this.forwardSpeed > this.maxForwardSpeed) this.forwardSpeed = this.maxForwardSpeed;
        this.currentLegsFrame += .3 + this.forwardSpeed;
        while (this.currentLegsFrame > 40) this.currentLegsFrame -= 40;
        this.legs.gotoAndStop(this.currentLegsFrame);
        

        // rotate & move
        if (this.rotationSpeed > .03) this.rotationSpeed = .03;
        this.rotation = averageAngle(this.rotation, targetRotation, 1 - this.rotationSpeed);
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












