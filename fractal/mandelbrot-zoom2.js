var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
const data = imageData.data

let xOfs = -.5, yOfs = 0, scale = 2.5, shapemod = 2
let maxIterations = 32

function draw() {
    for (let x = 0; x < canvas.width; x++) {        // cycle pixels
        for (let y = 0; y < canvas.height; y++) {
            cx = x / canvas.height - canvas.width / canvas.height * .5             // scale & center
            cy = y / canvas.height - .5
            const [n, d] = mandelbrot(cx, cy)  // check if part of mandel set
            putPixel(x, y, [n % 255, n % 16 * 16, (d * 100) % 255, 255])
            
        }
    }
    ctx.putImageData(imageData, 0, 0)
    console.log('maxIterations: ' + maxIterations)
    console.log('scale: ' + scale)
    console.log('xOfs: ' + xOfs)
    console.log('yOfs: ' + yOfs)
    console.log('shapemod: ' + shapemod)
}

function mandelbrot(x, y) {
    let zR = 0, zI = 0, n = 0, zR2 = 0, zI2 = 0, d = 0
    do {
        zR2 = zR * zR - zI * zI
        zI2 = 2 * zR * zI
        zR = zR2 + x * scale + xOfs
        zI = zI2 + y * scale + yOfs
        d = Math.sqrt(zR * zR + zI * zI)   //get distance to 0
        n++

        // check how many iterations needed for |zR,zI| (=d) to cross trshold (2)
    } while (d <= 2 && n < maxIterations)
    return [n, d]
}

function putPixel(x, y, col) {
    adr = (y * canvas.width + x) * 4
    data[adr] = col[0]       // red
    data[adr + 1] = col[1]   // green
    data[adr + 2] = col[2]   // blue
    data[adr + 3] = col[3]   // alpha
}


document.onkeydown = checkKey
function checkKey(e) {
    e = e || window.event
    if (e.keyCode == '38') yOfs -= scale * .05          // up arrow
    if (e.keyCode == '40') yOfs += scale * .05          // down arrow
    if (e.keyCode == '37') xOfs -= scale * .05          // left arrow
    if (e.keyCode == '39') xOfs += scale * .05          // right arrow
    if (e.keyCode == '107') scale *= .95        // +
    if (e.keyCode == '109') scale *= 1.05        // -
    if (e.keyCode == '65') maxIterations--     // A
    if (e.keyCode == '90') maxIterations++     // Z
    if (e.keyCode == '81') shapemod -= .1     // A
    if (e.keyCode == '83') shapemod += .1     // Z
    draw()
}


draw()

