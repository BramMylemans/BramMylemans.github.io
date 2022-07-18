var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;

let mod = 0;

let MAX_ITERATION = 60

function draw() {
    mod += 1;

    for (let i = 0; i < canvas.width; i++) {
        for (let j = 0; j < canvas.height; j++) {

            cx = -2 + (i / canvas.width) * 3;
            cy = -1 + (j / canvas.height) * 2;

            const [m, isMandelbrotSet] = mandelbrot(cx, cy)

            let col = m % 255

            putPixel(i, j, [m % 255, m % 16 * 16, (isMandelbrotSet*100)%255, 255]);
            //if (!isMandelbrotSet) putPixel(i, j, [m % 255, m % 16 * 16, 0, 255]);
            //else putPixel(i, j, [0,0,0, 255]);
            //putPixel(i, j, [col, col, isMandelbrotSet ? 0 : 255, 255]);

        }
    }
    ctx.putImageData(imageData, 0, 0)
    MAX_ITERATION=mod
    console.log(mod);
}





function mandelbrot(cx, cy) {
    let zx = 0; zy = 0, n = 0, px = 0, py = 0, d = 0;
    do {
        px = Math.pow(zx, 2) - Math.pow(zy, 2);
        py = 2* zx * zy;   //shapemod * zx * zy;
        
        zx =px + cx;    // px+cx+*scale +shift
        zy = py + cy;

        d = Math.sqrt(zx * zx + zy * zy)
        n += 1


    } while (d <= 2 && n < MAX_ITERATION)
    return [n, d ]
}




function putPixel(x, y, col) {
    i = (y * canvas.width + x) * 4;
    data[i] = col[0];// red
    data[i + 1] = col[1]; // green
    data[i + 2] = col[2];// blue
    data[i + 3] = col[3]; // alfa
};



setInterval(function () { draw() }, 100);
//draw() 

