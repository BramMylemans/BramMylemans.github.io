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

function getDistanceBetweenAnimals(animal1, animal2) {
    let dist = getDistancePP(animal1.positionX, animal1.positionY, animal2.positionX, animal2.positionY) - animalRadius1 * 2;
    if (dist < 0)   // constraining circles touch -> perform ellipse hittest
        dist = getDistanceEE(animal1.positionX, animal1.positionY, animal1.rotation, animal2.positionX, animal2.positionY, animal2.rotation, animalRadius2, animalRadius1);
    if (dist < 0.000001) dist = 0.000001;
    return dist;
}

function getDistanceEE(x1, y1, rotation1, x2, y2, rotation2, radius1, radius2) {  // approx. distance between 2 ellipses of equal radii
    let x = x2 - x1;
    let y = y2 - y1;
    let centerDistance = Math.sqrt(x * x + y * y);
    let radiusDifference = (radius2 - radius1) * 1.5;
    let angle = Math.abs(normalizeAngle(Math.atan2(y, x) - rotation1)) / PI * 2;  // position in relation to rotation of ellips -  0: left/right | 1: in front/behind
    if (angle > 1) angle = 2 - angle;
    let relativeRotation = Math.abs(normalizeAngle(rotation2 - PI - rotation1)) / Math.PI * 2;  // rotation - 0: parallel | 1: right angle
    if (relativeRotation > 1) relativeRotation = 2 - relativeRotation;
    let distance = centerDistance - (radius1 * 1.7 + (radiusDifference * 2 * angle) * (1 - relativeRotation) + radiusDifference * relativeRotation);
    return distance;
}

function getDistanceToLine(line, pointX, pointY) {  // distance between point and straight line[x1,y1,x2,y2] - returns distance and unit vector
    let ofsX = line[2] - line[0];
    let ofsY = line[3] - line[1];
    let f = ((pointX - line[0]) * ofsX + (pointY - line[1]) * ofsY) / ((ofsX * ofsX) + (ofsY * ofsY));
    f = constrain(f, 0, 1);
    let dx = line[0] + f * ofsX - pointX;
    let dy = line[1] + f * ofsY - pointY;
    let dist = Math.sqrt(dx * dx + dy * dy);
    return [dist, dx / dist, dy / dist];
}
