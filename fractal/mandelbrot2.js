var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight
console.log(WIDTH);
ctx.canvas.width = WIDTH
ctx.canvas.height = HEIGHT

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;


function draw() {

    const colors = new Array(16).fill(0).map((_, i) => i === 0 ? '#000' : `#${((1 << 24) * Math.random() | 0).toString(16)}`)
    for (let i = 0; i < WIDTH; i++) {
        for (let j = 0; j < HEIGHT; j++) {

            cx = -2 + (i / WIDTH) * 3;
            cy = -1 + (j / HEIGHT) * 2;


            const [m, isMandelbrotSet] = mandelbrot(cx, cy)

            let col = (m % 255)
            putPixel(i, j, [col, col, isMandelbrotSet ? 0 : 255, 255]);
            //putPixel(i, j, [col, col, isMandelbrotSet ? 0 : 255, 255]);

        }
    }
    ctx.putImageData(imageData, 0, 0)
    console.log(ctx.fillStyle);
}

const MAX_ITERATION = 80


function mandelbrot(cx, cy) {
    let zx = 0; zy = 0, n = 0, px = 0, py = 0, d = 0;
    do {
        px = Math.pow(zx, 2) - Math.pow(zy, 2);
        py = 2 * zx * zy;
        zx = px + cx;
        zy = py + cy;

        d = Math.sqrt(Math.pow(zx, 2) + Math.pow(zy, 2))
        n += 1
    } while (d <= 2 && n < MAX_ITERATION)
    return [n, d <= 2]
}




function putPixel(x, y, col) {
    i = (y * canvas.width + x) * 4;
    data[i] = col[0];// red
    data[i + 1] = col[1]; // green
    data[i + 2] = col[2];// blue
    data[i + 3] = col[3]; // alfa
};



setInterval(function () { draw() }, 1000);
