var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;

let xPos = 0, yPos = 0, scale = 1;
let MAX_ITERATION = 32

function draw() {
    for (let x = 0; x < canvas.width; x++) {        // cycle pixels
        for (let y = 0; y < canvas.height; y++) {
            cx = x / canvas.width * 3 - 2;          // scale to -2, 1
            cy = y / canvas.height * 2 - 1;         // scale to -1,1
            const [m, isMandelbrotSet] = mandelbrot(cx, cy)  // check if part of mandel set
            putPixel(x, y, [m % 255, m % 16 * 16, (isMandelbrotSet * 100) % 255, 255]);
        }
    }
    ctx.putImageData(imageData, 0, 0)
    console.log('MAX_ITERATION: ' + MAX_ITERATION);
    console.log('scale: ' + scale);
    console.log('xPos: ' + xPos);
    console.log('yPos: ' + yPos);
}

function mandelbrot(cx, cy) {
    let zx = 0; zy = 0, n = 0, px = 0, py = 0, d = 0;
    do {
        px = zx * zx - zy * zy;
        py = 2 * zx * zy;   //shapemod * zx * zy;

        zx = px + cx * scale + xPos;    // px+cx+*scale +shift
        zy = py + cy * scale + yPos;

        d = Math.sqrt(zx * zx + zy * zy)
        n += 1

    } while (d <= 2 && n < MAX_ITERATION)
    return [n, d]
}

function putPixel(x, y, col) {
    i = (y * canvas.width + x) * 4;
    data[i] = col[0];// red
    data[i + 1] = col[1]; // green
    data[i + 2] = col[2];// blue
    data[i + 3] = col[3]; // alfa
};


document.onkeydown = checkKey;
function checkKey(e) {
    e = e || window.event;
    if (e.keyCode == '38') yPos -= scale * .05;          // up arrow
    if (e.keyCode == '40') yPos += scale * .05;          // down arrow
    if (e.keyCode == '37') xPos -= scale * .05;          // left arrow
    if (e.keyCode == '39') xPos += scale * .05;          // right arrow
    if (e.keyCode == '107') scale *= .95;        // +
    if (e.keyCode == '109') scale *= 1.05;        // -
    if (e.keyCode == '65') MAX_ITERATION--;     // A
    if (e.keyCode == '90') MAX_ITERATION++;     // Z
    draw()
}


draw()

