/*
TWEEN
*/

class Tween {
    constructor(walkCycle) {  // [[keySpan,param1,param2,...],[keySpan,param1,param2,...],...]
        this.walkCycle = walkCycle;
        this.playhead = 0;
        this.keyFrame = 0;
        this.nextKeyFrame = 1;
        this.keySpan = 0;
        this.ratio = 0;
    }

    movePlayHeadBy(frameRate = 1) {
        this.playhead += frameRate;

        while (this.playhead > this.keySpan) {
            this.playhead -= this.keySpan;
            this.keyFrame++;
            if (this.keyFrame >= this.walkCycle.length) this.keyFrame = 0;
            this.keySpan = this.walkCycle[this.keyFrame][0];
        }

        while (this.playhead < 0) {
            this.playhead += this.keySpan;
            this.keyFrame--;
            if (this.keyFrame < 0) this.keyFrame = this.walkCycle.length - 1;
            this.keySpan = this.walkCycle[this.keyFrame][0];
        }

        this.nextKeyFrame = this.keyFrame + 1;
        if (this.nextKeyFrame >= this.walkCycle.length) this.nextKeyFrame = 0;
        this.ratio = this.playhead / this.keySpan;
    }

    movePlayHeadTo(frame) {
        this.keyFrame = 0;
        this.playhead = frame;
        this.keySpan = this.walkCycle[0][0];

        while (this.playhead > this.keySpan) {
            this.playhead -= this.keySpan;
            this.keyFrame++;
            if (this.keyFrame >= this.walkCycle.length) this.keyFrame = 0;
            this.keySpan = this.walkCycle[this.keyFrame][0];
        }

        this.nextKeyFrame = this.keyFrame + 1;
        if (this.nextKeyFrame >= this.walkCycle.length) this.nextKeyFrame = 0;
        this.ratio = this.playhead / this.keySpan;
    }

    read(param) { // param 0 = keySpan
        return this.walkCycle[this.keyFrame][param] * (1 - this.ratio) + this.walkCycle[this.nextKeyFrame][param] * this.ratio;
    }
}
