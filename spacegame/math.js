/*
GENERAL
*/
const PI = Math.PI;
const doublePI = Math.PI * 2;
const halfPI = Math.PI / 2;

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function constrain(value, min, max) {
    if (value < min) value = min;
    if (value > max) value = max;
    return value;
}

function max(val1, val2) {
    if (val1 > val2) return val1;
    else return val2;
}

function min(val1, val2) {
    if (val1 < val2) return val1;
    else return val2;
}

function power(base, exponent = 2) { // positive integer exponent only, but faster than Math.pow in Chrome
    let result = base;
    for (let i = 1; i < exponent; i++) result *= base;
    return result;
}

/*
ANGLES
*/
function normalizeAngle(angle) {  // normalize angle: returns value between -PI and +PI
    angle = angle % doublePI;
    if (angle > PI) angle -= doublePI;
    if (angle < -PI) angle += doublePI;
    return angle;
}

function averageAngle(angle1, angle2, ratio) {  // return center angle
    if (angle1 < angle2)
        while (Math.abs(angle1 - angle2) > PI) angle1 += doublePI;
    else
        while (Math.abs(angle1 - angle2) > PI) angle1 -= doublePI;
    let avg = angle1 * ratio + angle2 * (1 - ratio);
    return normalizeAngle(avg);
}

/*
DISTANCE
*/
function getDistancePP(x1, y1, x2, y2) {  //distance between two points
    let xOfs = x1 - x2;
    let yOfs = y1 - y2;
    return Math.sqrt(xOfs * xOfs + yOfs * yOfs);
}

function distanceToLine(lPoint1, lPoint2, point) {
    let line = [lPoint1.x, lPoint1.y, lPoint2.x, lPoint2.y]
    let ofsX = line[2] - line[0];
    let ofsY = line[3] - line[1];
    let f = ((point.x - line[0]) * ofsX + (point.y - line[1]) * ofsY) / ((ofsX * ofsX) + (ofsY * ofsY));
    f = constrain(f, 0, 1);
    let dx = line[0] + f * ofsX - point.x;
    let dy = line[1] + f * ofsY - point.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    //return [dist, dx / dist, dy / dist];  --> returns distance and unit vector
    return dist;
}


/*
HITTEST
*/

function lineIntersects(point1, point2, point3, point4) {
    var det, gamma, lambda;
    det = (point2.x - point1.x) * (point4.y - point3.y) - (point4.x - point3.x) * (point2.y - point1.y);
    if (det === 0) {
        return false;
    } else {
        lambda = ((point4.y - point3.y) * (point4.x - point1.x) + (point3.x - point4.x) * (point4.y - point1.y)) / det;
        gamma = ((point1.y - point2.y) * (point4.x - point1.x) + (point2.x - point1.x) * (point4.y - point1.y)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
};



function hitTest2(obj1, obj2, debug = false) {

    let obj1Length = obj1.bounds.length;
    let obj2Length = obj2.bounds.length;

    for (let i1 = 0; i1 < obj1Length; i1++) {
        let obj1Point1 = obj1.toGlobal(obj1.bounds[i1]);
        let obj1Point2;
        if (i1 != obj1Length - 1) obj1Point2 = obj1.toGlobal(obj1.bounds[i1 + 1]);
        else obj1Point2 = obj1.toGlobal(obj1.bounds[0]);

        for (let i2 = 0; i2 < obj2Length; i2++) {
            let obj2Point1 = obj2.toGlobal(obj2.bounds[i2]);
            let obj2Point2;
            if (i2 != obj2Length - 1) obj2Point2 = obj2.toGlobal(obj2.bounds[i2 + 1]);
            else obj2Point2 = obj2.toGlobal(obj2.bounds[0]);
            if (lineIntersects(obj1Point1, obj1Point2, obj2Point1, obj2Point2)) return [obj1Point1, obj1Point2];
        }
    }
    return;
}


function reflectPoint(mirrorPoint1, mirrorPoint2, point) {
    let m = 1000000;
    if (mirrorPoint2.x != mirrorPoint1.x)
        m = (mirrorPoint2.y - mirrorPoint1.y) / (mirrorPoint2.x - mirrorPoint1.x);  // slope
    let b = mirrorPoint1.y - m * mirrorPoint1.x;  // intercept

    let d = (point.x + (point.y - b) * m) / (1 + m * m)
    let mirroredPoint = new PIXI.Point();
    mirroredPoint.x = 2 * d - point.x
    mirroredPoint.y = 2 * d * m - point.y + 2 * b
    return (mirroredPoint);
}
