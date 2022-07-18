class Gauge extends PIXI.Graphics {
    constructor(x, y, width, height) {
        super();
        this.x = x;
        this.y = y;
        this._width = width;
        this._height = height;
        game.addChild(this);
        this.update();
    }

    update(value = 0) {
        this.clear();
        let w = (this._width - 2) / 100 * value;
        this.beginFill(0xffffff);
        this.drawRect(0, 0, this._width, this._height);
        if (value < 20) this.beginFill(0xff0000);
        else this.beginFill(0x999999);
        this.drawRect(1, 1, w, this._height - 2);
    };
}