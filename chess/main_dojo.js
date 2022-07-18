const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
var blockSize, sprite = Array(18), board = [], isBlack, validMoves, sx, sy, tx, ty, promotionIndex
var engine = [], gameReady = false, spritesLoaded = false, startTime
var fenLog = "", pgnLog = "", aiLog = "", logMode = "pgn", drawMode = 0, boardHistory = [], moveTimer = []

const workerUrl = []



/*****************************************************************************************************************
GAME SEQUENCE
*****************************************************************************************************************/

function initialize(_board, ply_brute0, ply_quiet0, nodes0, ply_brute1, ply_quiet1, nodes1) {                             // INITIALIZE WORKER
    console.log("init")

    workerUrl[0] = element("engine0").value + "?v=" + (Math.round(Math.random() * 1000000))
    workerUrl[1] = element("engine1").value + "?v=" + (Math.round(Math.random() * 1000000))

    engine[0] = new Worker(workerUrl[0])
    engine[1] = new Worker(workerUrl[1])

    const ply_total0 = parseInt(ply_brute0) + parseInt(ply_quiet0)
    const ply_total1 = parseInt(ply_brute1) + parseInt(ply_quiet1)
    engine[0].postMessage([0, [_board, ply_brute0, ply_total0, nodes0]])                // workers: initialize game    
    engine[1].postMessage([0, [_board, ply_brute1, ply_total1, nodes1]])

    engine[0].onmessage = function (msg) {                                      // handle messages from worker 0
        const command = msg.data[0]
        const data = msg.data[1]
        switch (command) {
            case 0:                                                             // receive board
                board = data[0]
                boardHistory.push(data[0])
                addMoveToLog(data)
                prepareNextTurn()
                gameReady = true
                break
            case 1:                                                             // receive validMoves
                validMoves = data[1]
                startMove(data[0])
                break
            case 2:                                                             // receive progress
                element("progress").value = data
                break
            case 3:                                                             // receive board after init
                board = data[0]
                boardHistory.push(data[0])
                addMoveToLog(data)
                prepareNextTurn()
                gameReady = true
                break
        }
    }

    engine[1].onmessage = function (msg) {                                      // handle messages from worker 1
        const command = msg.data[0]
        const data = msg.data[1]
        switch (command) {
            case 0:                                                             // receive board
                board = data[0]
                boardHistory.push(data[0])
                addMoveToLog(data)
                prepareNextTurn()
                gameReady = true
                break
            case 1:                                                             // receive validMoves
                validMoves = data[1]
                startMove(data[0])
                break
            case 2:                                                             // receive progress
                element("progress").value = data
                break
            case 3:
        }
    }
}

function prepareNextTurn() {                                                    // CHECK IF POSSIBLE MOVES
    drawBoard(board)                                                            // redraw board
    isBlack = board[8][6]
    moveTimer[isBlack ? 0 : 1].stop()                                           // stop oppenent timer
    moveTimer[isBlack ? 1 : 0].run()                                            // start players timer
    engine[isBlack ? 1 : 0].postMessage([3, board])                             // check if validMoves available
}

function startMove(msg) {                                                       // PREPARE NEXT TURN
    if (msg == 0) {                                                             // validMoves are available: prepare next turn
        setPlayer(isBlack)                                                      // update interface
        engine[isBlack ? 1 : 0].postMessage([1, board])                         // worker: request ai move
    } else {
        switch (msg) {                                                          // no valid moves, game ends
            case 1:
                element("header").innerHTML = "Black wins!"
                element("description").innerHTML = "Checkmate"
                pgnLog += "<li>0-1</li>"
                break
            case 2:
                element("header").innerHTML = "White wins!"
                element("description").innerHTML = "Checkmate"
                pgnLog += "<li>1-0</li>"
                break
            case 3:
                element("header").innerHTML = "It's a draw!"
                element("description").innerHTML = "Stalemate"
                pgnLog += "<li>½-½</li>"
                break
            case 4:
                element("header").innerHTML = "It's a draw!"
                element("description").innerHTML = "5x repetition"
                pgnLog += "<li>½-½</li>"
                break
            case 5:
                element("header").innerHTML = "It's a draw!"
                element("description").innerHTML = "75 moves rule"
                pgnLog += "<li>½-½</li>"
                break
            case 10:
                element("header").innerHTML = "It's a draw!"
                element("description").innerHTML = (isBlack ? "Black" : "White") + " claimed draw by repetition"
                pgnLog += "<li>½-½</li>"
                break
            case 11:
                element("header").innerHTML = "It's a draw!"
                element("description").innerHTML = (isBlack ? "Black" : "White") + " claimed draw by 50 moves rule"
                pgnLog += "<li>½-½</li>"
        }
        moveTimer[0].stop()
        moveTimer[1].stop()
        updateLog()
        endGame()
    }
}

function resign() {                                                             // PLAYER RESIGNS
    element("header").innerHTML = "Game aborted"
    element("description").innerHTML = ""
    pgnLog += "<li>*</li>"
    moveTimer[0].stop()
    moveTimer[1].stop()
    updateLog()
    endGame()
}

/*****************************************************************************************************************
RENDER BOARD & PIECES
*****************************************************************************************************************/

function loadSprites() {                                                        // SETUP NEW GAME
    const spriteUrl = Array(18);                                                // load images
    spriteUrl[1] = "img/wp.svg"
    spriteUrl[2] = "img/wn.svg"
    spriteUrl[3] = "img/wb.svg"
    spriteUrl[4] = "img/wr.svg"
    spriteUrl[5] = "img/wq.svg"
    spriteUrl[6] = "img/wk.svg"
    spriteUrl[7] = "img/bp.svg"
    spriteUrl[8] = "img/bn.svg"
    spriteUrl[9] = "img/bb.svg"
    spriteUrl[10] = "img/br.svg"
    spriteUrl[11] = "img/bq.svg"
    spriteUrl[12] = "img/bk.svg"
    var spriteLoadCounter = 12
    for (var i = 1; i <= spriteUrl.length; ++i) {
        if (spriteUrl[i] != undefined) {
            sprite[i] = new Image()
            sprite[i].src = spriteUrl[i]
            sprite[i].onload = function () {
                --spriteLoadCounter
                if (spriteLoadCounter == 0) {                                   // all images loaded
                    spritesLoaded = true;
                    drawBoard(fenToBoard(defaultBoard))
                }
            }
        }
    }
}

function drawBoard(board) {                                                     // (RE)DRAW BOARD & PIECES
    for (var x = 0; x < 8; ++x) {
        for (var y = 0; y < 8; ++y) {
            if ((x + y) % 2 == 0) ctx.fillStyle = "#F1F2F2"                     // draw board
            else ctx.fillStyle = "#414042"
            ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize)
            var piece = board[x][y]                                             // draw chess pieces
            if (sprite[piece] != undefined)
                ctx.drawImage(sprite[piece], blockSize * x, blockSize * y, blockSize, blockSize)
        }
    }
}


/*****************************************************************************************************************
INTERFACE & DOM
*****************************************************************************************************************/

function resize() {                                                             // RESIZE BOARD & DIVS
    const offset = (window.innerWidth - (window.innerHeight + 500)) / 2
    canvas.width = window.innerHeight - 100, canvas.height = window.innerHeight - 100
    blockSize = canvas.width / 8
    if (spritesLoaded) {
        if (gameReady) drawBoard(board)                                         // if game initialized: redraw board
        else drawBoard(fenToBoard(defaultBoard))                                // else draw default board
    }
    element("container").style.left = offset + "px"
}

function startGame() {                                                          // PROCESS SETUP FORM & START GAME
    if (spritesLoaded) {
        initialize(board, element("ply_brute0").value, element("ply_quiet0").value, element("nodes0").value, element("ply_brute1").value, element("ply_quiet1").value, element("nodes1").value)
        element("setupGame").style.display = "none"                             // hide setup div
        element("ingame").style.display = "inline"                              // show ingame div
        element("inGameNav").style.display = "block"
        element("description").style.display = "none"
        element("endGameNav").style.display = "none"
        element("progress").style.display = "block"
        moveTimer[0] = new MoveTimer(false)
        moveTimer[1] = new MoveTimer(true)
        startTime = +new Date()
    }
}

class MoveTimer {                                                           // TIMERS
    constructor(_isBlack) {
        this.isBlack = _isBlack
        this.timerStart, this.totalTime = 0, this.turnTime = 0, this.running = false, this.intervalHandler
        this.updateDom(0,0)
    }
    run() {
        this.timerStart = +new Date(), this.running = true
        this.intervalHandler = setInterval(this.update, 1000, this)
    }
    stop() {
        if (this.running) {
            clearInterval(this.intervalHandler)
            this.running = false, this.turnTime = +new Date() - this.timerStart, this.totalTime += this.turnTime
            this.updateDom(this.turnTime, this.totalTime)
        }
    }
    update(_this) {
        const elapsed = +new Date() - _this.timerStart
        _this.updateDom(elapsed, _this.totalTime + elapsed)
    }
    updateDom(turnTime, totalTime) {
        if (this.isBlack) element("blackTimer").innerHTML = "Black - " + Math.floor(totalTime / 1000) + " (" + Math.floor(turnTime / 1000) + ")"
        else element("whiteTimer").innerHTML = "White - " + Math.floor(totalTime / 1000) + " (" + Math.floor(turnTime / 1000) + ")"
    }
}

function setupGame() {                                                          // SHOW SETUP SCREEN
    element("ingame").style.display = "none"
    element("setupGame").style.display = "inline"
    updateBoard()
    fenLog = "", pgnLog = "", aiLog = ""                                        // clear logs
}

function setPlayer(isBlack) {                                                   // SWITCH PLAYER
    if (isBlack) {
        element("header").innerHTML = "Black's turn"
        element("whiteTimer").setAttribute("class", "dim")
        element("blackTimer").setAttribute("class", "")
        element("progress").style.visibility = "visible"
    } else {
        element("header").innerHTML = "White's turn"
        element("whiteTimer").setAttribute("class", "")
        element("blackTimer").setAttribute("class", "dim")
        element("progress").style.visibility = "visible"
    }
}

function endGame() {                                                            // STOP GAME & SHOW ENDGAME CONTROLS
    engine[0].terminate()                                                       // stop engine
    engine[1].terminate()

    console.log("Game ended after " + (+new Date() - startTime))

    element("progress").style.visibility = "none"
    element("inGameNav").style.display = "none"                                 // show endgame controls
    element("description").style.display = "block"
    element("endGameNav").style.display = "block"
    element("progress").style.visibility = "hidden"
    element("whiteTimer").setAttribute("class", "dim")
    element("blackTimer").setAttribute("class", "dim")
}

/* LOGGING */

function addMoveToLog(data) {                                                   // APPEND MOVE TO LOGS
    fenLog += "<li>" + boardToFen(data[0]) + "</li>"
    if (data[1] != undefined) pgnLog += "<li>" + algebraic[data[1]] + (8 - parseInt(data[2])) + " " + algebraic[data[3]] + (8 - parseInt(data[4])) + "</li>"
    if (data[6] != undefined) aiLog += "<li>" + data[6] + "</li>"
    updateLog()
}

function updateLog() {                                                          // UPDATE LOG WINDOW
    element("log_pgn").setAttribute("class", "tinyButton")
    element("log_fen").setAttribute("class", "tinyButton")
    element("log_ai").setAttribute("class", "tinyButton")
    if (logMode == "pgn") {
        element("log").innerHTML = pgnLog
        element("log_pgn").setAttribute("class", "tinyButton selected")
    }
    if (logMode == "fen") {
        element("log").innerHTML = fenLog
        element("log_fen").setAttribute("class", "tinyButton selected")
    }
    if (logMode == "ai") {
        element("log").innerHTML = aiLog
        element("log_ai").setAttribute("class", "tinyButton selected")
    }
    element("logContainer").scrollTop = element("logContainer").scrollHeight
}

function setLogMode(_logmode) {                                                 // SET LOG DISPLAY FORMAT
    logMode = _logmode
    updateLog()
}

function copyLog() {                                                            // COPY LOG TO CLIPBOARD
    var output
    if (logMode == "fen") output = fenLog
    if (logMode == "pgn") output = pgnLog
    if (logMode == "ai") output = aiLog
    output = output.split("<li>").join("")
    output = output.split("</li>").join("\n")
    navigator.clipboard.writeText(output)
}

function updateBoard() {                                                  // IF VALID FEN STRING, UPDATE BOARD
    board = fenToBoard(element("fen").value)
    if (board) {                                                                // valid fen string
        drawBoard(board)                                                        // display custom board
        element("invalidFenString").style.display = "none"                      // hide warning
        return true
    } else {
        board = fenToBoard(defaultBoard)
        drawBoard(board)                                     // display default board
        if (element("fen").value != "")
            element("invalidFenString").style.display = "block"                 // display warning
        else element("invalidFenString").style.display = "none"                 // hide warning
        return false
    }
}

function element(id) {
    return document.getElementById(id)
}


