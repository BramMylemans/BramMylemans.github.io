const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
var blockSize, sprite = Array(18), board = [], isBlack, mouseMode = 0, validMoves, sx, sy, tx, ty, promotionIndex
var engine, gameReady = false, spritesLoaded = false, startTime, blackIsHuman, whiteIsHuman
var fenLog = "", pgnLog = "", aiLog = "", logMode = "pgn", drawMode = 0, boardHistory = [], moveTimer = []
const workerUrl = "engine.js?v=" + (Math.round(Math.random() * 1000000))        // DEV: prevent caching of worker


/*****************************************************************************************************************
GAME SEQUENCE
*****************************************************************************************************************/

function initialize(_board, ply_brute, ply_quiet, nodes) {                      // INITIALIZE WORKER
    engine = new Worker(workerUrl)
    const ply_total = parseInt(ply_brute) + parseInt(ply_quiet)
    engine.postMessage([0, [_board, ply_brute, ply_total, nodes]])              // worker: initialize game      
    engine.onmessage = function (msg) {                                         // handle messages from worker
        const command = msg.data[0]
        const data = msg.data[1]
        switch (command) {
            case 0:                                                             // receive board
            case 3:
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
        }
    }
}

function selectPiece(x, y) {                                                    // SELECT PIECE
    for (var i = 0; i < validMoves.length; ++i) {
        if (validMoves[i][1] == x && validMoves[i][2] == y) {                   // valid source position
            sx = x, sy = y
            for (var i = 0; i < validMoves.length; ++i) {
                if (validMoves[i][1] == x && validMoves[i][2] == y) {           // mark possible targets
                    const _tx = validMoves[i][3]
                    const _ty = validMoves[i][4]
                    ctx.beginPath()
                    ctx.arc((_tx + .5) * blockSize, (_ty + .5) * blockSize, 10, 0, 2 * Math.PI, false)
                    ctx.fillStyle = "#FF0000"
                    ctx.fill()
                }
            }
            mouseMode = 2                                                       // mouse handler: target select
        }
    }
}

function selectTarget(x, y) {                                                   // PLAYER: TARGET SELECTED
    tx = x, ty = y
    var i = 0
    for (i = 0; i < validMoves.length; ++i) {
        if (validMoves[i][1] == sx && validMoves[i][2] == sy
            && validMoves[i][3] == tx && validMoves[i][4] == ty) {              // valid target selected
            if ((isBlack && board[sx][sy] == 7 && sy == 6) || (!isBlack && board[sx][sy] == 1 && sy == 1))
                showPromotionDialog(i)                                          // pawn promotion -> continue to promotion dialog
            else
                engine.postMessage([2, validMoves[i]])                          // else -> worker: commit move
            return
        }
    }
    drawBoard(board)                                                            // redraw board
    mouseMode = 1                                                               // mouse handler: select piece 
}

function showPromotionDialog(i) {                                               // DISPLAY PAWN PROMOTION DIALOG
    promotionIndex = i
    board[sx][sy] = 0
    board[tx][ty] = isBlack ? 7 : 1
    drawBoard(board)
    mouseMode = 0
    disableUndo()
    element("promotionDialog").style.display = "block"
}

function promotePawn(choice) {                                                  // PAWN PROMOTION DIALOG RESPONSE
    element("promotionDialog").style.display = "none"                           // hide dialog
    engine.postMessage([2, validMoves[promotionIndex + choice]])                // worker: commit move
    return
}

function prepareNextTurn() {                                                    // PREPARE NEXT TURN
    drawBoard(board)                                                            // redraw board
    isBlack = board[8][6]
    moveTimer[0].stop()                                       
    moveTimer[1].stop()                                         
    moveTimer[isBlack ? 1 : 0].run()                                            // start players timer
    mouseMode = 0
    disableUndo()
    engine.postMessage([3])                                                     // check if validMoves available
}

function startMove(msg) {                                                       // START NEXT TURN
    if (msg == 0) {                                                             // validMoves are available: next turn
        setPlayer(isBlack)                                                      // update interface
        if ((isBlack && blackIsHuman) || (!isBlack && whiteIsHuman)) {          // if active player is human
            mouseMode = 1                                                       // mouse handler: select piece 
            enableUndo()
            if (board[11] == 1) {
                element("draw").disabled = false
                element("draw").title = "Claim draw by repetition"
                drawMode = 1
            } else if (board[8][8] > 49) {
                element("draw").disabled = false
                element("draw").title = "Claim draw by 50 move rule"
                drawMode = 2
            } else {
                element("draw").disabled = true
                element("draw").title = ""
                drawMode = 0
            }
        } else engine.postMessage([1])                                          // worker: request ai move
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
        mouseMode = 0
        moveTimer[0].stop()
        moveTimer[1].stop()
        disableUndo()
        updateLog()
        endGame()
    }
}

function claimDraw() {                                                          // PLAYER CLAIMS DRAW
    if (drawMode == 1) startMove(10)                                            // claim draw by repetition
    if (drawMode == 2) startMove(11)                                            // claim draw by 50 move rule
}

function resign() {                                                             // PLAYER RESIGNS / ABORTS
    if (!blackIsHuman && !whiteIsHuman) {                                       // ai vs ai
        element("header").innerHTML = "Game aborted"
        element("description").innerHTML = ""
        pgnLog += "<li>*</li>"
    } else {
        var winner
        if (blackIsHuman && whiteIsHuman) winner = !isBlack                     // human vs human
        else winner = whiteIsHuman                                              // human vs ai
        element("header").innerHTML = winner ? "Black wins!" : "White wins!"
        element("description").innerHTML = winner ? "White resigned" : "Black resigned"
        pgnLog += "<li>" + (winner ? "0-1" : "1-0") + "</li>"
    }
    moveTimer[0].stop()
    moveTimer[1].stop()
    updateLog()
    endGame()
}


function disableUndo() {
    element("undo").disabled = true
}

function enableUndo() {
    if (boardHistory.length > 1) element("undo").disabled = false
}

function undo() {
    if ((blackIsHuman && !whiteIsHuman) || (whiteIsHuman && !blackIsHuman)) {   // human vs ai: undo 2 ply
        board = boardHistory[boardHistory.length - 3]
        boardHistory.pop()                                                      // remove 2 ply from history
        boardHistory.pop()
        boardHistory.pop()                                                      // remove extra ply as it will get added again
    }
    if (blackIsHuman && whiteIsHuman) {                                         // 2 human players: undo 1 ply
        board = boardHistory[boardHistory.length - 2]
        boardHistory.pop()
        boardHistory.pop()                                                      // remove extra ply as it will get added again
    }
    engine.postMessage([2, [board]])                                            // worker: update board
    prepareNextTurn()
}

function handleClick(mouse) {                                                   // HANDLE MOUSE CLICKS
    var rect = canvas.getBoundingClientRect();
    const x = Math.floor((mouse.pageX - rect.left) / blockSize)
    const y = Math.floor((mouse.pageY - rect.top) / blockSize)
    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (mouseMode == 1) selectPiece(x, y)                                   // handle piece select
        else if (mouseMode == 2) selectTarget(x, y)                             // handle target select
    }
}
canvas.addEventListener("click", handleClick, true)                             // ADD MOUSE LISTENER


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
            var piece = board[x][y]                                             // draw pieces
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
    element("promotionDialog").style.left = offset + blockSize * 4 - 150 + "px"
    element("promotionDialog").style.top = -20 + blockSize * 4 + "px"
}

function startGame() {                                                          // PROCESS SETUP FORM & START GAME
    if (spritesLoaded) {
        if (element("white").value == "human") whiteIsHuman = true
        else whiteIsHuman = false
        if (element("black").value == "human") blackIsHuman = true
        else blackIsHuman = false
        initialize(board, element("ply_brute").value, element("ply_quiet").value, element("nodes").value)
        element("setupGame").style.display = "none"                             // hide setup div
        element("ingame").style.display = "inline"                              // show ingame div
        element("inGameNav").style.display = "block"
        element("description").style.display = "none"
        element("endGameNav").style.display = "none"
        disableUndo()
        if (!(whiteIsHuman && blackIsHuman)) element("progress").style.display = "block"
        moveTimer[0] = new MoveTimer(false)
        moveTimer[1] = new MoveTimer(true)
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
        this.intervalHandler = setInterval(this.update, 1000, this);
        console.log(this.intervalHandler)
    }
    stop() {
        if (this.running) {
            clearInterval(this.intervalHandler);
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
        element("progress").style.visibility = blackIsHuman ? "hidden" : "visible"
    } else {
        element("header").innerHTML = "White's turn"
        element("whiteTimer").setAttribute("class", "")
        element("blackTimer").setAttribute("class", "dim")
        element("progress").style.visibility = whiteIsHuman ? "hidden" : "visible"
    }
}

function endGame() {                                                            // STOP GAME & SHOW ENDGAME CONTROLS
    engine.terminate()                                                          // stop engine
    mouseMode = 0                                                               // disable mouse
    disableUndo()
    element("progress").style.visibility = "none"
    element("inGameNav").style.display = "none"                                 // show endgame controls
    element("description").style.display = "block"
    element("endGameNav").style.display = "block"
    element("promotionDialog").style.display = "none"
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

function removeFromLog(lines) {
    ulElem.removeChild(ulElem.childNodes[i])

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


