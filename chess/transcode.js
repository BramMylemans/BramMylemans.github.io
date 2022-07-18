/* FEN transcode */

const fenTranscode = [1, "P", "N", "B", "R", "Q", "K", "p", "n", "b", "r", "q", "k"]
const algebraic = ["a", "b", "c", "d", "e", "f", "g", "h"]
const defaultBoard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

function boardToFen(board) {
    const FENstring = []
    for (var y = 0; y <= 7; ++y) {                                                              // piece positions
        for (var x = 0; x <= 7; ++x) {
            const tc = fenTranscode[board[x][y]]
            if (tc == "1" && !isNaN(FENstring.at(-1))) {
                FENstring[FENstring.length - 1] += 1
            } else FENstring.push(tc)
        }
        FENstring.push("/")
    }
    FENstring[FENstring.length - 1] = " "
    FENstring.push(board[8][6] ? "b" : "w")                                                     // turn
    FENstring.push(" ")
    if (!board[8][3] && !board[8][2] && !board[8][5] && !board[8][4]) FENstring.push("-")       // castling rights
    else {
        if (board[8][3]) FENstring.push("K")
        if (board[8][2]) FENstring.push("Q")
        if (board[8][5]) FENstring.push("k")
        if (board[8][4]) FENstring.push("q")
    }
    FENstring.push(" ")
    if (board[8][0] != undefined) {                                                             // en passant white
        FENstring.push(algebraic[board[8][0]])
        FENstring.push("3")
    } else if (board[8][1] != undefined) {                                                      // en passant black
        FENstring.push(algebraic[board[8][1]])
        FENstring.push("4")
    } else FENstring.push("-")                                                                  // no en passant      
    FENstring.push(" ")
    FENstring.push(board[8][8])                                                                 // ply counter for 50 move rule (todo)
    FENstring.push(" ")
    FENstring.push(board[8][7])                                                                 // move counter (full moves, incremented after black move)
    return (FENstring.toString().split(",").join(""))
}

function fenToBoard(fenStr) {
    try {
        const board = []
        const data = fenStr.split(" ")
        const fenStrRows = data[0].split("/")
        for (var row = 0; row < 8; ++row)
            for (var i = 1; i <= 8; ++i)
                fenStrRows[row] = fenStrRows[row].split(i).join("1".repeat(i))
        for (var x = 0; x < 8; ++x) {                                                               // pieces
            board[x] = []
            for (var y = 0; y < 8; ++y) {
                const char = fenStrRows[y].charAt(x)
                board[x][y] = (char == "1") ? 0 : fenTranscode.indexOf(char)
            }
        }
        board[8] = []
        board[8][6] = (data[1] == "b")                                                              // turn
        if (data[2].indexOf("K") != -1) board[8][3] = true                                          // castling rights
        if (data[2].indexOf("Q") != -1) board[8][2] = true
        if (data[2].indexOf("k") != -1) board[8][5] = true
        if (data[2].indexOf("q") != -1) board[8][4] = true
        if (data[3].charAt(1) == "3") board[8][0] = algebraic.indexOf(data[3].charAt(0))            // en passant
        if (data[3].charAt(1) == "4") board[8][1] = algebraic.indexOf(data[3].charAt(0))
        board[8][8] = Number(data[4])                                                               // halfmove clock for 50-move rule
        board[8][7] = Number(data[5])                                                               // move counter
        board[9] = []          // repetition history
        board[10] = []         // repetition history counter
        board[11] = 0          // repetition history available
        return (board)
    }
    catch (err) {
        return undefined
    }
}




