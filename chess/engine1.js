var game, maxDepth, bruteDepth, targetNodes

const kingTargets = [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]]
const knightTargets = [[-1, -2], [-1, 2], [1, -2], [1, 2], [-2, -1], [-2, 1], [2, -1], [2, 1]]
const pieceValues = [0, 10, 30, 30, 50, 80, 1000, -10, -30, -30, -50, -80, -1000]
const zobrist = [], hashDepth = 4 

onmessage = function (msg) {                                                                        // PROCESS COMMANDS FROM MAIN THREAD
    const command = msg.data[0]
    const data = msg.data[1]
    switch (command) {                                                                              // first array item is the command, others are payload
        case 0:                                                                                     // prepare new game
            game = new ChessGame(data[0])
            maxDepth = data[2], bruteDepth = data[1], targetNodes = data[3]
            postMessage([3, [game.board]])
            break
        case 1:                                                                                     // do ai move and update board
            if (data != undefined) game.board = data
            const bestMove = game.recursiveAIStart(game.board)
            if (bestMove[0] == 0) { postMessage([1, [10]]); break }                                 // claim draw by repetition
            if (bestMove[0] == 1) { postMessage([1, [11]]); break }                                 // claim draw by 50 move rule
            game.board = bestMove[0]
            postMessage([0, bestMove])
            break
        case 2:                                                                                     // update board with human player move
            game.board = data[0]
            postMessage([0, data])
            break
        case 3:                                                                                     // return all possible moves for given board
            if (data != undefined) game.board = data
            if (game.board[11] == 2) { postMessage([1, [4]]); break }                               // -> 4: end game: 5x repetition
            if (game.board[8][8] > 74) { postMessage([1, [5]]); break }                             // -> 5: end game: 75 move rule
            const validMoves = game.getValidMoves(game.board, false)
            if (validMoves.length > 0)
                postMessage([1, [0, validMoves]])                                                   // -> 0: there are possible moves, continue game
            else {
                isBlack = game.board[8][6]
                if (!isBlack && game.isCheck(game.board)) { postMessage([1, [1]]); break }          // -> 1: end game: white is mate
                if (isBlack && game.isCheck(game.board)) { postMessage([1, [2]]); break }           // -> 2: end game: black is mate
                postMessage([1, [3]])                                                               // -> 3: end game: stalemate
            }
            break
    }
}

function updateProgress(progress) {
    postMessage([2, progress])
}

class ChessGame {

    constructor(_board) {                   // SETUP START POSITION
        const defaultBoard = [
            [10, 7, 0, 0, 0, 0, 1, 4],      // col A
            [8, 7, 0, 0, 0, 0, 1, 2],       // col B
            [9, 7, 0, 0, 0, 0, 1, 3],       // col C
            [11, 7, 0, 0, 0, 0, 1, 5],      // col D
            [12, 7, 0, 0, 0, 0, 1, 6],      // col E
            [9, 7, 0, 0, 0, 0, 1, 3],       // col F
            [8, 7, 0, 0, 0, 0, 1, 2],       // col G
            [10, 7, 0, 0, 0, 0, 1, 4],      // col H
            [                               // flags:
                undefined, undefined,       // x position of enpassant candidate (white, black)
                true, true,                 // castling rights white (queens side, kings side)
                true, true,                 // castling rights black (queens side, kings side)
                false,                      // black's turn?
                0,                          // move counter
                0                           // ply count since the last capture or pawn advance, used for the fifty-move rule
            ],
            [], [0], 0                      // repetition history, occurance counter, repetition draw flag
        ]

        this.board = (_board == undefined) ? defaultBoard : _board
        this.isBlack = this.board[8][6]
        this.board[9].push(this.boardToString(this.board))     // add starting situation to repetition array
        this.hashInit()
    }

    recursiveAIStart(board) {
        var hashTable = new Map()
        var hashCounter = 0
        var bestMove = [], nodeCount = []
        const start = +new Date(), _this = this, isBlack = board[8][6]
        for (var i = 1; i <= maxDepth; i++) nodeCount[i] = 0
        const validMoves = game.getValidMoves(board)
        const validMovesLength = validMoves.length
        const sortedMoves = this.sortMoves(validMoves, isBlack)
        var rootScore = isBlack ? 100000 : -100000
        if ((board[11] == 1) || (board[8][8] > 49)) rootScore = 0                                     // draw by 3x repetition or 50 move rule

        switch (validMovesLength) {
            case 0:                                                                                     // shouldn't occur
                console.log("No valid moves")
                break;
            case 1:
                rootScore = this.evaluateBoard(board)[0]
                bestMove = validMoves[0]
                break;
            default:
                for (var i = 0, l = validMovesLength; i < l; ++i) {                                     // depth 1 (root branch) handled in this loop
                    updateProgress(i / l)                                                               // (seperate from deeper plys because it returns board and not just score)
                    const score = recursiveAI(validMoves[sortedMoves[i][0]][0], 1, rootScore)
                    if ((isBlack && score < rootScore) || (!isBlack && score > rootScore))
                        rootScore = score, bestMove = validMoves[sortedMoves[i][0]]
                }
        }

        function recursiveAI(board, depth, parentScore, volatile = true) {
            ++nodeCount[depth]

            /* hashing */
            var hashedBoard
            if (depth == hashDepth) {
                hashedBoard = _this.hash(board)                                                         // find hashtable matches                                                    
                if (hashTable.has(hashedBoard)) {
                    hashCounter++
                    return hashTable.get(hashedBoard)
                }
            }

            if (depth == maxDepth || volatile == false) return (_this.evaluateBoard(board)[0])          // leaf: return score

            const isBlack = board[8][6]
            var nodeScore = isBlack ? 100000 : -100000

            // detect draw rights (worst case score = 0) 
            if ((board[11] == 1) || (board[8][8] > 49)) nodeScore = 0                                   // draw by 3x repetition or 50 move rule

            const validMoves = _this.getValidMoves(board), validMovesLength = validMoves.length

            if (validMovesLength == 0) {                                                                // no more possible moves, game ends at this node:
                if (_this.isCheck(board)) return isBlack ? 10000 - depth : -10000 + depth               // -> checkMate (add bonus for lower depth/faster win)
                else return 0                                                                           // -> staleMate: score = 0
            }

            const isFinalBranch = depth == maxDepth - 1
            const quiescenceSearch = !isFinalBranch && (depth >= bruteDepth)                            // end brute search and start quiescence
            const sortedMoves = isFinalBranch ? undefined : _this.sortMoves(validMoves, isBlack)        // sort moves

            for (var i = 0; i < validMovesLength; ++i) {
                const moveIndex = isFinalBranch ? i : sortedMoves[i][0]
                const _volatile = quiescenceSearch ? (validMoves[moveIndex][5] || sortedMoves[i][2]) : true // determine if branch is volatile
                const score = recursiveAI(validMoves[moveIndex][0], depth + 1, nodeScore, _volatile)        // recursion

                // alphabeta cutoff 
                if (isBlack) {
                    if (score <= parentScore) return parentScore                                        // cut branch
                    else if (score < nodeScore) nodeScore = score                                       // update score
                } else {
                    if (score >= parentScore) return parentScore                                        // idem
                    else if (score > nodeScore) nodeScore = score
                }
            }
            if (depth == hashDepth) hashTable.set(hashedBoard, nodeScore)
            return nodeScore
        }


        // post search: if possible, claim draw if score is neutral or worse 
        if ((board[11] == 1) && ((isBlack && rootScore >= 0) || (!isBlack && rootScore <= 0)))
            bestMove[0] = 0                                                                                 // claim draw by repetition

        if ((board[8][8] > 49) && ((isBlack && rootScore >= 0) || (!isBlack && rootScore <= 0)))
            bestMove[0] = 1                                                                                 // claim draw by 50 move rule

        // logging 
        const end = +new Date()
        totalNodes = 0
        var log = (isBlack ? "B" : "W")
        log += " | score:" + rootScore.toFixed(4) + " | "
        for (var i = 1; i <= maxDepth; i++) {
            log += i + ":" + nodeCount[i] + ", "
            totalNodes += nodeCount[i]
        }
        log += "sum:" + totalNodes
        log += " | ms:" + Math.floor(end - start)
        log += " | μsPerN:" + (Math.floor(end - start) / totalNodes * 1000).toFixed(3);

        bestMove[6] = log
        console.log(log)
        console.log("hashCounter:" + hashCounter + "/" + hashTable.size)

        // adjust depth of next search 
        if (targetNodes != -1) {
            var totalNodes = 0
            for (var i = 1; i <= maxDepth; i++)totalNodes += nodeCount[i]
            console.log("TOTAL:" + totalNodes + " TARGET:" + targetNodes)
            if (totalNodes < targetNodes / 2) maxDepth++
            if (totalNodes < targetNodes / 4) maxDepth++
            if (totalNodes > targetNodes * 2) maxDepth--
            if (totalNodes > targetNodes * 4) maxDepth--
            if (maxDepth > 18) maxDepth = 18
            if (maxDepth < 4) maxDepth = 4
            console.log((isBlack ? "Black" : "White") + " - Maximum depth:" + maxDepth)
        }
        return bestMove
    }

    sortMoves(moves, ascending) {
        const sortedMoves = []
        for (var i = 0, l = moves.length; i < l; ++i) {
            const evaluation = this.evaluateBoard(moves[i][0])                                      // get score
            sortedMoves[i] = [i, evaluation[0], evaluation[1]]                                      // [index, score, volatile]
        }
        if (ascending) sortedMoves.sort(function (a, b) { return a[1] - b[1] })                     // sort moves asscending
        else sortedMoves.sort(function (a, b) { return b[1] - a[1] })                               // sort moves descending
        return sortedMoves                                                                          // return sorted array [moveIndex][score]
    }

    isCheck(board, isBlack = board[8][6]) {  // return true if king is threatened by opponent
        const king = isBlack ? 12 : 6
        var x, y
        outer: for (x = 0; x < 8; ++x) {    // find king
            for (y = 0; y < 8; ++y) {
                if (board[x][y] == king) break outer
            }
        }
        return this.isThreatened(board, isBlack, x, y)
    }

    isThreatened(board, isBlack, pieceX, pieceY) {  // return true if square at position x,y is threatened by opponent

        const [opponentQueen, opponentRook, opponentKing, opponentBishop, opponentKnight] = isBlack ? [5, 4, 6, 3, 2] : [11, 10, 12, 9, 8]

        // check horizontal/vertical for rooks & queens
        for (var tx = pieceX - 1; tx >= 0; --tx) {   //left

            if (board[tx][pieceY] != 0) {
                if (board[tx][pieceY] == opponentRook || board[tx][pieceY] == opponentQueen) return true
                break
            }
        }
        for (var tx = pieceX + 1; tx <= 7; ++tx) {   //right
            if (board[tx][pieceY] != 0) {
                if (board[tx][pieceY] == opponentRook || board[tx][pieceY] == opponentQueen) return true
                break
            }
        }
        for (var ty = pieceY - 1; ty >= 0; --ty) {   //fw
            if (board[pieceX][ty] != 0) {
                if (board[pieceX][ty] == opponentRook || board[pieceX][ty] == opponentQueen) return true
                break
            }
        }
        for (var ty = pieceY + 1; ty <= 7; ++ty) {   //bw
            if (board[pieceX][ty] != 0) {
                if (board[pieceX][ty] == opponentRook || board[pieceX][ty] == opponentQueen) return true
                break
            }
        }

        // check diagonal for queens & bishops
        for (var tx = pieceX - 1, ty = pieceY + 1; tx >= 0 && ty <= 7; --tx, ++ty) {   //bw left
            if (board[tx][ty] != 0) {
                if (board[tx][ty] == opponentBishop || board[tx][ty] == opponentQueen) return true
                break
            }
        }
        for (var tx = pieceX + 1, ty = pieceY + 1; tx <= 7 && ty <= 7; ++tx, ++ty) {   //bw right
            if (board[tx][ty] != 0) {
                if (board[tx][ty] == opponentBishop || board[tx][ty] == opponentQueen) return true
                break
            }
        }
        for (var tx = pieceX - 1, ty = pieceY - 1; tx >= 0 && ty >= 0; --tx, --ty) {   //fw left
            if (board[tx][ty] != 0) {
                if (board[tx][ty] == opponentBishop || board[tx][ty] == opponentQueen) return true
                break
            }
        }
        for (var tx = pieceX + 1, ty = pieceY - 1; tx <= 7 && ty >= 0; ++tx, --ty) {   //fw right
            if (board[tx][ty] != 0) {
                if (board[tx][ty] == opponentBishop || board[tx][ty] == opponentQueen) return true
                break
            }
        }

        // check for kings
        {
            for (var i = 0; i < 8; ++i) {
                const tx = pieceX + kingTargets[i][0]
                const ty = pieceY + kingTargets[i][1]
                if (tx < 0 || ty < 0 || tx > 7 || ty > 7) continue;
                if (board[tx][ty] == opponentKing) return true
            }
        }

        // check for knights
        {
            for (var i = 0; i < 8; ++i) {
                const tx = pieceX + knightTargets[i][0]
                const ty = pieceY + knightTargets[i][1]
                if (tx < 0 || ty < 0 || tx > 7 || ty > 7) continue;
                if (board[tx][ty] == opponentKnight) return true
            }
        }

        // check for pawns
        if (isBlack) {
            if (pieceY < 7 && ((pieceX > 0 && board[pieceX - 1][pieceY + 1] == 1) || (pieceX < 7 && board[pieceX + 1][pieceY + 1] == 1))) return true
        } else {
            if (pieceY > 0 && ((pieceX > 0 && board[pieceX - 1][pieceY - 1] == 7) || (pieceX < 7 && board[pieceX + 1][pieceY - 1] == 7))) return true
        }
        return false;
    }

    getValidMoves(board, ai = true) {                       // return possible moves (& resulting boards) for entire board
        const isBlack = board[8][6]
        const validMoves = []
        for (var x = 0; x < 8; ++x) {
            for (var y = 0; y < 8; ++y) {
                const piece = board[x][y]
                if ((piece > 0) && (isBlack && piece > 6) || (!isBlack && piece < 7))
                    this.getValidMovesFor(board, validMoves, x, y, ai)
            }
        }
        return validMoves
    }


    getValidMovesFor(board, validMoves, x, y, ai) {         // update validMoves with all moves for a piece at given position
        const _this = this

        switch (board[x][y]) {
            case 1:            // white pawn
                getWhitePawnMoves(board, x, y)
                break
            case 7:            // black pawn
                getBlackPawnMoves(board, x, y)
                break
            case 2:            // white knight
            case 8:            // black knight
                getKnightMoves(board, x, y)
                break
            case 3:            // white bishop
            case 9:            // black bishop
                getBishopMoves(board, x, y)
                break
            case 4:            // white rook
            case 10:           // black rook
                getRookMoves(board, x, y)
                break
            case 5:            // white queen
            case 11:           // black queen
                getBishopMoves(board, x, y)
                getRookMoves(board, x, y)
                break
            case 6:            // white king
            case 12:           // black king
                getKingMoves(board, x, y)
                break
        }

        function getWhitePawnMoves(board, x, y) {
            if (x > 0 && isOpponent(board, x - 1, y - 1, false)) checkPawnPromotion(board, x, y, x - 1, y - 1)      // capture left
            if (x < 7 && isOpponent(board, x + 1, y - 1, false)) checkPawnPromotion(board, x, y, x + 1, y - 1)      // capture right
            if (board[x][y - 1] == 0) {
                checkPawnPromotion(board, x, y, x, y - 1)                                                           // advance 1 position
                if (y == 6 && board[x][4] == 0) consider(board, x, 6, x, 4, true, false, [[8, 0, x]])               // advance 2 positions; set as candidate for en passant capture
            }
            if (board[8][1] != undefined && y == 3) {                                                               // capture en passant  
                if (board[8][1] == x - 1) consider(board, x, 3, x - 1, 2, true, false, [[x - 1, 3, 0]])
                if (board[8][1] == x + 1) consider(board, x, 3, x + 1, 2, true, false, [[x + 1, 3, 0]])
            }
        }

        function getBlackPawnMoves(board, x, y) {
            if (x > 0 && isOpponent(board, x - 1, y + 1, true)) checkPawnPromotion(board, x, y, x - 1, y + 1)       // capture left
            if (x < 7 && isOpponent(board, x + 1, y + 1, true)) checkPawnPromotion(board, x, y, x + 1, y + 1)       // capture right
            if (board[x][y + 1] == 0) {
                checkPawnPromotion(board, x, y, x, y + 1)                                                           // advance 1 position
                if (y == 1 && board[x][3] == 0) consider(board, x, y, x, 3, true, false, [[8, 1, x]])               // advance 2 positions; set as candidate for en passant capture
            }
            if (board[8][0] != undefined && y == 4) {                                                               // capture en passant
                if (board[8][0] == x - 1) consider(board, x, 4, x - 1, 5, true, false, [[x - 1, 4, 0]])
                if (board[8][0] == x + 1) consider(board, x, 4, x + 1, 5, true, false, [[x + 1, 4, 0]])
            }
        }

        function checkPawnPromotion(board, x, y, tx, ty) {
            const isBlack = board[8][6]
            if (ty == (isBlack ? 7 : 0)) {
                consider(board, x, y, tx, ty, true, true, [[tx, ty, isBlack ? 11 : 5]])                             // promote to queen
                consider(board, x, y, tx, ty, true, true, [[tx, ty, isBlack ? 8 : 2]])                              // promote to knight
                if (!ai) {
                    consider(board, x, y, tx, ty, true, true, [[tx, ty, isBlack ? 10 : 4]])                         // promote to rook
                    consider(board, x, y, tx, ty, true, true, [[tx, ty, isBlack ? 9 : 3]])                          // promote to bishop
                }
            } else consider(board, x, y, tx, ty, true)
        }

        function getKingMoves(board, x, y) {
            for (var i = 0; i < 8; ++i) {
                const tx = x + kingTargets[i][0]
                const ty = y + kingTargets[i][1]
                if (tx < 0 || ty < 0 || tx > 7 || ty > 7) continue;
                if (board[tx][ty] == 0) consider(board, x, y, tx, ty, false)
                else if (isOpponent(board, tx, ty)) consider(board, x, y, tx, ty, true)

            }
            // castling: check if still available & if king or squares in kings path are threatened
            const isBlack = board[8][6]
            if (!isBlack) {
                if (board[8][3] && board[5][7] == 0 && board[6][7] == 0)
                    if (!_this.isCheck(board) && !_this.isThreatened(board, isBlack, 5, 7) && !_this.isThreatened(board, isBlack, 6, 7))
                        consider(board, 4, 7, 6, 7, false, false, [[7, 7, 0], [5, 7, 4]])
                if (board[8][2] && board[1][7] == 0 && board[2][7] == 0 && board[3][7] == 0)
                    if (!_this.isCheck(board) && !_this.isThreatened(board, isBlack, 2, 7) && !_this.isThreatened(board, isBlack, 3, 7))
                        consider(board, 4, 7, 2, 7, false, false, [[0, 7, 0], [3, 7, 4]])
            } else {
                if (board[8][5] && board[5][0] == 0 && board[6][0] == 0)
                    if (!_this.isCheck(board) && !_this.isThreatened(board, isBlack, 5, 0) && !_this.isThreatened(board, isBlack, 6, 0))
                        consider(board, 4, 0, 6, 0, false, false, [[7, 0, 0], [5, 0, 10]])
                if (board[8][4] && board[1][0] == 0 && board[2][0] == 0 && board[3][0] == 0)
                    if (!_this.isCheck(board) && !_this.isThreatened(board, isBlack, 2, 0) && !_this.isThreatened(board, isBlack, 3, 0))
                        consider(board, 4, 0, 2, 0, false, false, [[0, 0, 0], [3, 0, 10]])
            }
        }

        function getKnightMoves(board, x, y) {
            for (var i = 0; i < 8; ++i) {
                const tx = x + knightTargets[i][0]
                const ty = y + knightTargets[i][1]
                if (tx < 0 || ty < 0 || tx > 7 || ty > 7) continue;
                if (board[tx][ty] == 0) consider(board, x, y, tx, ty, false)
                else if (isOpponent(board, tx, ty)) consider(board, x, y, tx, ty, true)
            }
        }

        function getRookMoves(board, x, y) {
            for (var tx = x - 1; tx >= 0; --tx) {   //left
                if (board[tx][y] == 0) consider(board, x, y, tx, y, false)
                else { if (isOpponent(board, tx, y)) consider(board, x, y, tx, y, true); break }
            }
            for (var tx = x + 1; tx <= 7; ++tx) {   //right
                if (board[tx][y] == 0) consider(board, x, y, tx, y, false)
                else { if (isOpponent(board, tx, y)) consider(board, x, y, tx, y, true); break }
            }
            for (var ty = y + 1; ty <= 7; ++ty) {   //bw
                if (board[x][ty] == 0) consider(board, x, y, x, ty, false)
                else { if (isOpponent(board, x, ty)) consider(board, x, y, x, ty, true); break }
            }
            for (var ty = y - 1; ty >= 0; --ty) {   //fw
                if (board[x][ty] == 0) consider(board, x, y, x, ty, false)
                else { if (isOpponent(board, x, ty)) consider(board, x, y, x, ty, true); break }
            }
        }

        function getBishopMoves(board, x, y) {
            for (var tx = x - 1, ty = y + 1; tx >= 0 && ty <= 7; --tx, ++ty) {   //bw left
                if (board[tx][ty] == 0) consider(board, x, y, tx, ty, false)
                else { if (isOpponent(board, tx, ty)) consider(board, x, y, tx, ty, true); break }
            }
            for (var tx = x + 1, ty = y + 1; tx <= 7 && ty <= 7; ++tx, ++ty) {   //bw right
                if (board[tx][ty] == 0) consider(board, x, y, tx, ty, false)
                else { if (isOpponent(board, tx, ty)) consider(board, x, y, tx, ty, true); break }
            }
            for (var tx = x - 1, ty = y - 1; tx >= 0 && ty >= 0; --tx, --ty) {   //fw left
                if (board[tx][ty] == 0) consider(board, x, y, tx, ty, false)
                else { if (isOpponent(board, tx, ty)) consider(board, x, y, tx, ty, true); break }
            }
            for (var tx = x + 1, ty = y - 1; tx <= 7 && ty >= 0; ++tx, --ty) {   //fw right
                if (board[tx][ty] == 0) consider(board, x, y, tx, ty, false)
                else { if (isOpponent(board, tx, ty)) consider(board, x, y, tx, ty, true); break }
            }
        }

        function consider(board, x, y, tx, ty, reset, volatile = false, setPieces = []) {
            const newBoard = _this.cloneBoard(board)                                            // clone board
            if (board[tx][ty] != 0) volatile = true                                             // is piece capture -> volatile
            newBoard[tx][ty] = newBoard[x][y], newBoard[x][y] = 0                               // move piece
            newBoard[8][0] = undefined, newBoard[8][1] = undefined                              // clear en passant ability flags
            if (setPieces != undefined)                                                         // set/remove extra pieces and flags (for en passant, castling, promotion) 
                for (var i = 0, l = setPieces.length; i < l; ++i)
                    newBoard[setPieces[i][0]][setPieces[i][1]] = setPieces[i][2]

            if (_this.isCheck(newBoard)) return                                                 // return if move keeps king in check

            if (newBoard[8][2] && newBoard[tx][ty] == 4 && x == 0) newBoard[8][2] = false       // clear castling rights: left white rook
            if (newBoard[8][3] && newBoard[tx][ty] == 4 && x == 7) newBoard[8][3] = false       // right white rook
            if (newBoard[8][4] && newBoard[tx][ty] == 10 && x == 0) newBoard[8][4] = false      // left black rook
            if (newBoard[8][5] && newBoard[tx][ty] == 10 && x == 7) newBoard[8][5] = false      // right black rook
            if (newBoard[tx][ty] == 6) newBoard[8][2] = false, newBoard[8][3] = false           // white king
            if (newBoard[tx][ty] == 12) newBoard[8][4] = false, newBoard[8][5] = false          // black king
            const isBlack = board[8][6]
            newBoard[8][6] = !isBlack                                                           // switch sides      
            if (isBlack) ++newBoard[8][7]                                                       // increment turn counter 
            if (reset) newBoard[8][8] = 0                                                       // reset 50 move counter
            else ++newBoard[8][8]                                                               // increment 50 move counter
            detectRepetition(newBoard, reset)                                                   // repetition detection                   
            validMoves.push([newBoard, x, y, tx, ty, volatile])                                 // update validMoves array with possible moves                       

        }

        function detectRepetition(board, reset) {
            const hash = _this.boardToString(board)
            board[11] = 0                                               // reset repetition draw flag
            if (reset) {
                board[9] = [hash], board[10] = [0]                      // reset history and counter
            } else {
                var i = board[9].indexOf(hash)
                if (i != -1) {                                          // board found   
                    ++board[10][i]                                      // increment repetition counter
                    if (board[10][i] > 3) board[11] = 2                 // 5x repetition detected
                    else if (board[10][i] > 1) board[11] = 1            // 3x repetition detected
                } else {
                    board[9].push(hash)                                 // add to repetition array
                    board[10].push(0)
                }
            }
        }

        function isOpponent(board, x, y) {
            if (board[x][y] > 6) return !board[8][6]
            else if (board[x][y] > 0) return board[8][6]
        }
    }

    cloneBoard(board) {
        const boardCopy = []
        for (var i = 0; i < 11; ++i) boardCopy[i] = board[i].slice(0)
        return (boardCopy)
    }

    boardToString(board) {                                          // encode 2 positions per character
        var boardStr = ""
        for (var y = 0; y < 8; ++y) {
            for (var x = 0; x < 8; x += 2) {
                boardStr += String.fromCharCode(board[x][y] * 16 + board[x + 1][y])
            }
        }
        if (board[8][6]) boardStr += "x"
        return boardStr
    }

    evaluateBoard(board) {
        const isBlack = board[8][6]
        var score = 0, scoreAbs = 0, volatile = false
        for (var x = 0; x < 8; ++x) {
            for (var y = 0; y < 8; ++y) {
                const piece = board[x][y]
                score += pieceValues[piece]                   // score pieces
                scoreAbs += Math.abs(pieceValues[piece])
                
                // freedom bonus (expensive)
                const freedoms = this.getFreedoms(board, x, y, isBlack)
                score += freedoms / 10

                // alternative: penalty for pieces on last row (excl pawns & kings):
                if (y == 7 && piece > 1 && piece < 6) score -= 2
                if (y == 0 && piece > 7 && piece < 12) score += 2

                if (piece == 1) score += (6 - y) * 2      // white pawn position bonus
                if (piece == 7) score -= (y - 1) * 2      // black pawn position bonus
            }
        }
        if (this.isCheck(board, !isBlack)) {
            score += (isBlack ? -10 : 10)                   // bonus is opponents king is threatened
            volatile = true
        }
        return [score / scoreAbs, volatile]
    }

    getFreedoms(board, x, y, isBlack) {
        const piece = board[x][y]
        if ((isBlack && piece < 7) || (!isBlack && piece > 6)) return 0
        var freedoms = 0
        switch (piece) {
            case 2:            //knight
            case 8:
                getKnightMoves(board, x, y)
                break
            case 3:            //  bishop
            case 9:
                getBishopMoves(board, x, y)
                break
            case 4:            //  rook
            case 10:
                getRookMoves(board, x, y)
                break
        }
        if (isBlack) { return -freedoms }
        else { return freedoms }

        function getKnightMoves(board, x, y) {
            for (var i = 0; i < 8; ++i) {
                const tx = x + knightTargets[i][0]
                const ty = y + knightTargets[i][1]
                if (tx < 0 || ty < 0 || tx > 7 || ty > 7) continue;
                if (board[tx][ty] == 0) ++freedoms
            }
        }

        function getBishopMoves(board, x, y) {
            for (var tx = x - 1, ty = y + 1; tx >= 0 && ty <= 7; --tx, ++ty) {   //bw left
                if (board[tx][ty] == 0) ++freedoms
                else break
            }
            for (var tx = x + 1, ty = y + 1; tx <= 7 && ty <= 7; ++tx, ++ty) {   //bw right
                if (board[tx][ty] == 0) ++freedoms
                else break
            }
            for (var tx = x - 1, ty = y - 1; tx >= 0 && ty >= 0; --tx, --ty) {   //fw left
                if (board[tx][ty] == 0) ++freedoms
                else break
            }
            for (var tx = x + 1, ty = y - 1; tx <= 7 && ty >= 0; ++tx, --ty) {   //fw right
                if (board[tx][ty] == 0) ++freedoms
                else break
            }
        }

        function getRookMoves(board, x, y) {
            for (var tx = x - 1; tx >= 0; --tx) {   //left
                if (board[tx][y] == 0) ++freedoms
                else break
            }
            for (var tx = x + 1; tx <= 7; ++tx) {   //right
                if (board[tx][y] == 0) ++freedoms
                else break
            }
            for (var ty = y + 1; ty <= 7; ++ty) {   //bw
                if (board[x][ty] == 0) ++freedoms
                else break
            }
            for (var ty = y - 1; ty >= 0; --ty) {   //fw
                if (board[x][ty] == 0) ++freedoms
                else break
            }
        }
    }

    hashInit() {
        for (var bytes = 0; bytes < 6144; ++bytes) {  //8*8*12*8=6144
            zobrist[bytes] = Math.round(Math.random() * 255)
        }
    }

    hash(board) {
        var hash = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])
        for (var x = 0; x < 8; ++x) {
            for (var y = 0; y < 8; ++y) {
                var piece = board[x][y]
                if (piece != 0) {
                    var index = (x * 8 + y) * 12 + piece - 1
                    for (var bytes = 0; bytes < 8; ++bytes) hash[bytes] ^= zobrist[index + bytes]
                }
            }
        }
        var hashStr = ""
        for (var bytes = 0; bytes < 8; ++bytes)
            hashStr += String.fromCharCode(hash[bytes])
        return hashStr
    }

}

