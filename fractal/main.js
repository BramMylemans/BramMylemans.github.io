var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
const data = imageData.data

let xOfs = 0, yOfs = 0, scale = 2.5, shapemod = 0
let maxIteration = 80


let pal = 0
let palette = []

palette[0] = []       // gray
for (let n = 0; n < 256; n++) {
    let r = n
    let g = n
    let b = n
    palette[0][n] = [r, g, b, 255]
}

palette[1] = []       // gray
for (let n = 0; n < 256; n++) {
    let r = 255 - n
    let g = 255 - n
    let b = 255 - n
    palette[1][n] = [r, g, b, 255]
}

palette[2] = []       // color
for (let n = 0; n < 256; n++) {
    let r = n
    let g = (n * 2) % 255
    let b = (n * 4) % 255
    palette[2][n] = [r, g, b, 255]
}

palette[3] = []       // color
for (let n = 0; n < 256; n++) {
    let r = 255 - n
    let g = 255 - (n * 2) % 255
    let b = 255 - (n * 4) % 255
    palette[3][n] = [r, g, b, 255]
}


function draw() {
    var start = +new Date()

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            cx = x / canvas.height - canvas.width / canvas.height * .5
            cy = y / canvas.height - .5

            const [iteration, partOfSet] = mandel(cx, cy)

            if (partOfSet) putPixel(x, y, palette[pal][Math.floor(iteration / maxIteration * 255)])
            else putPixel(x, y, [0, 0, 0, 255])
        }
    }

    ctx.putImageData(imageData, 0, 0)

    var end = +new Date()

    console.clear()
    console.log('maxIteration: ' + maxIteration)
    console.log('scale: ' + scale)
    console.log('xOfs: ' + xOfs)
    console.log('yOfs: ' + yOfs)
    console.log('shapemod: ' + shapemod)
    console.log('millis: ' + (end - start))
}

function mandel(cx, cy) {
    cx = cx * scale + xOfs
    cy = cy * scale + yOfs
    let iteration = 0, x = 0, y = 0, d = 0, xTemp = 0
    do {
        xTemp = x * x - y * y
        y = 2 * x * y + cy
        x = xTemp + cx
        d = x * x + y * y
        iteration++
    } while (d < 4 && iteration < maxIteration)
    return [iteration, d > 4]
}


function julia(x, y) {
    //let cx = 0.285, cy = 0
    //let cx = 1, cy =1.618033988749
    //let cx = -4, cy =.6
    let cx = -.8, cy = 0.156 + shapemod

    x = x * scale + xOfs
    y = y * scale + yOfs
    let iteration = 0, xTemp = 0, d = 0
    do {
        xTemp = x * x - y * y
        y = 2 * x * y + cy
        x = xTemp + cx
        d = x * x + y * y
        iteration++
    } while (d < 4 && iteration < maxIteration)
    return [iteration, d > 4]
}


function burningship(x, y) {
    x = x * scale + xOfs
    y = y * scale + yOfs
    let cx = x, cy = y
    let iteration = 0, xTemp = 0, d = 0
    do {
        xTemp = x * x - y * y + cx
        y = Math.abs(2 * x * y) + cy
        x = xTemp
        d = x * x + y * y
        iteration++
    } while (d < 4 && iteration < maxIteration)
    return [iteration, d > 4]
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
    if (e.keyCode == '107') scale *= .95                // +
    if (e.keyCode == '109') scale *= 1.05               // -
    if (e.keyCode == '65') maxIteration--               // A
    if (e.keyCode == '90') maxIteration++               // Z
    if (e.keyCode == '81') shapemod -= .01              // Q
    if (e.keyCode == '83') shapemod += .01              // S
    if (e.keyCode == '80') (pal < palette.length - 1) ? pal++ : pal = 0    // P

    draw()
}


draw()

/*
arrows: pan
+,-: zoom
A,Z: max iterations
Q,S: shape mod
P: cycle palette
*/