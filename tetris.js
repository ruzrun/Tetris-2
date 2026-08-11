/* =====================================================
   RAA'S TETRIS 2
   FALLING SAND EDITION 🏖️
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const nextCanvas =
    document.getElementById("nextCanvas");

const nextCtx =
    nextCanvas.getContext("2d");


const COLS = 10;
const ROWS = 20;
const BLOCK = 30;


/* =====================================================
   AUDIO
===================================================== */

const bgMusic =
    document.getElementById("bgMusic");

const gameOverSound =
    document.getElementById("gameOverSound");

const lineClearSound =
    document.getElementById("lineClearSound");

const soundButton =
    document.getElementById("soundButton");


let soundEnabled = true;


/* Volume */

bgMusic.volume = 0.45;
gameOverSound.volume = 0.7;
lineClearSound.volume = 0.65;


/* =====================================================
   SOUND BUTTON
===================================================== */

function updateSoundButton() {

    if (soundEnabled) {

        soundButton.textContent = "🔊";

        soundButton.setAttribute(
            "aria-label",
            "Mute sound"
        );

    } else {

        soundButton.textContent = "🔇";

        soundButton.setAttribute(
            "aria-label",
            "Turn sound on"
        );

    }

}


soundButton.addEventListener(
    "click",
    () => {

        soundEnabled =
            !soundEnabled;

        bgMusic.muted =
            !soundEnabled;

        gameOverSound.muted =
            !soundEnabled;

        lineClearSound.muted =
            !soundEnabled;

        updateSoundButton();

        if (soundEnabled) {

            bgMusic
                .play()
                .catch(() => {});

        }

    }
);


updateSoundButton();


/* =====================================================
   START MUSIC
===================================================== */

function startMusic() {

    if (!soundEnabled) {
        return;
    }

    bgMusic
        .play()
        .catch(() => {});

}


window.addEventListener(
    "load",
    startMusic
);


document.addEventListener(
    "click",
    startMusic,
    {
        once: true
    }
);


document.addEventListener(
    "touchstart",
    startMusic,
    {
        once: true
    }
);


/* =====================================================
   TETRIS PIECES
===================================================== */

const PIECES = [

    {
        name: "I",

        color: "#e7c46a",

        shape: [
            [1, 1, 1, 1]
        ]
    },

    {
        name: "O",

        color: "#f3d477",

        shape: [
            [1, 1],
            [1, 1]
        ]
    },

    {
        name: "T",

        color: "#c79563",

        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "S",

        color: "#d9b56d",

        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },

    {
        name: "Z",

        color: "#c98f52",

        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },

    {
        name: "J",

        color: "#e0b866",

        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "L",

        color: "#d5a45c",

        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    }

];


/* =====================================================
   GAME STATE
===================================================== */

let board = [];

let currentPiece = null;
let nextPiece = null;

let score = 0;
let lines = 0;
let level = 1;

let dropCounter = 0;

let dropInterval = 800;

let lastTime = 0;

let animationID = null;

let gameRunning = false;

let paused = false;


/*
   Sand simulation settings
*/

let sandTimer = 0;

const SAND_SPEED = 65;


/* =====================================================
   CREATE BOARD
===================================================== */

function createBoard() {

    return Array.from(
        {
            length: ROWS
        },
        () =>
            Array(COLS).fill(null)
    );

}


/* =====================================================
   RANDOM PIECE
===================================================== */

function randomPiece() {

    const template =
        PIECES[
            Math.floor(
                Math.random() *
                PIECES.length
            )
        ];

    return {

        name:
            template.name,

        color:
            template.color,

        shape:
            template.shape.map(
                row => [...row]
            ),

        x: 0,

        y: 0

    };

}


/* =====================================================
   SPAWN PIECE
===================================================== */

function spawnPiece() {

    currentPiece =
        nextPiece ||
        randomPiece();

    nextPiece =
        randomPiece();

    currentPiece.y = 0;

    currentPiece.x =
        Math.floor(
            (
                COLS -
                currentPiece.shape[0].length
            ) / 2
        );

    drawNext();


    if (collision()) {

        gameOver();

    }

}


/* =====================================================
   COLLISION
===================================================== */

function collision() {

    for (
        let y = 0;
        y < currentPiece.shape.length;
        y++
    ) {

        for (
            let x = 0;
            x < currentPiece.shape[y].length;
            x++
        ) {

            if (
                !currentPiece.shape[y][x]
            ) {

                continue;

            }


            const boardX =
                currentPiece.x + x;

            const boardY =
                currentPiece.y + y;


            if (
                boardX < 0 ||
                boardX >= COLS ||
                boardY >= ROWS
            ) {

                return true;

            }


            if (
                boardY >= 0 &&
                board[boardY][boardX]
            ) {

                return true;

            }

        }

    }

    return false;

}


/* =====================================================
   TURN PIECE INTO SAND
===================================================== */

function mergePiece() {

    currentPiece.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (!value) {
                        return;
                    }


                    const boardX =
                        currentPiece.x + x;

                    const boardY =
                        currentPiece.y + y;


                    if (
                        boardY >= 0 &&
                        boardY < ROWS &&
                        boardX >= 0 &&
                        boardX < COLS
                    ) {

                        board[boardY][boardX] = {

                            color:
                                currentPiece.color,

                            /*
                               Tiny random variation
                               makes the sand feel alive.
                            */

                            shade:
                                Math.random(),

                            grain:
                                Math.random()

                        };

                    }

                }
            );

        }
    );

}


/* =====================================================
   SAND PHYSICS
===================================================== */

function updateSand() {

    /*
       Randomise the direction we scan the board.

       This prevents the sand from always
       favouring one side.
    */

    const leftToRight =
        Math.random() > 0.5;


    const start =
        leftToRight ? 0 : COLS - 1;

    const end =
        leftToRight ? COLS : -1;

    const step =
        leftToRight ? 1 : -1;


    /*
       Start from the bottom.

       Sand should always fall downward.
    */

    for (
        let y = ROWS - 2;
        y >= 0;
        y--
    ) {

        for (
            let x = start;
            x !== end;
            x += step
        ) {

            const grain =
                board[y][x];


            if (!grain) {
                continue;
            }


            /*
               1. Straight down
            */

            if (
                !board[y + 1][x]
            ) {

                board[y + 1][x] =
                    grain;

                board[y][x] =
                    null;

                continue;

            }


            /*
               2. Down-left / down-right

               Randomise which side is tried first.
            */

            const tryLeftFirst =
                Math.random() > 0.5;


            const directions =
                tryLeftFirst
                    ? [-1, 1]
                    : [1, -1];


            let moved = false;


            for (
                const direction
                of directions
            ) {

                const newX =
                    x + direction;


                if (
                    newX < 0 ||
                    newX >= COLS
                ) {

                    continue;

                }


                if (
                    !board[y + 1][newX]
                ) {

                    board[y + 1][newX] =
                        grain;

                    board[y][x] =
                        null;

                    moved = true;

                    break;

                }

            }

        }

    }

}


/* =====================================================
   CLEAR FULL SAND ROWS
===================================================== */

function clearLines() {

    let cleared = 0;


    for (
        let y = ROWS - 1;
        y >= 0;
        y--
    ) {

        if (
            board[y].every(
                cell =>
                    cell !== null
            )
        ) {

            board.splice(
                y,
                1
            );


            board.unshift(
                Array(
                    COLS
                ).fill(null)
            );


            cleared++;

            y++;

        }

    }


    if (cleared > 0) {

        const points = [
            0,
            100,
            300,
            500,
            800
        ];


        score +=
            points[
                Math.min(
                    cleared,
                    4
                )
            ] * level;


        lines += cleared;


        level =
            Math.floor(
                lines / 10
            ) + 1;


        dropInterval =
            Math.max(
                100,

                800 -
                (level - 1) * 65
            );


        updateUI();


        /*
           Line clear sound
        */

        if (soundEnabled) {

            lineClearSound.currentTime =
                0;

            lineClearSound
                .play()
                .catch(() => {});

        }


        showLinePopup(
            cleared
        );

    }

}


/* =====================================================
   LINE CLEAR POPUP
===================================================== */

function showLinePopup(
    cleared
) {

    const popup =
        document.getElementById(
            "linePopup"
        );

    const text =
        document.getElementById(
            "linePopupText"
        );


    if (cleared === 1) {

        text.textContent =
            "NICE! ✨";

    }

    else if (cleared === 2) {

        text.textContent =
            "GREAT! 💖";

    }

    else if (cleared === 3) {

        text.textContent =
            "AMAZING! 🌟";

    }

    else {

        text.textContent =
            "SAND TETRIS! 🏖️";

    }


    popup.classList.remove(
        "show"
    );


    void popup.offsetWidth;


    popup.classList.add(
        "show"
    );


    setTimeout(
        () => {

            popup.classList.remove(
                "show"
            );

        },
        1000
    );

}


/* =====================================================
   MOVE
===================================================== */

function move(direction) {

    if (
        !gameRunning ||
        paused
    ) {

        return;

    }


    currentPiece.x +=
        direction;


    if (collision()) {

        currentPiece.x -=
            direction;

    }

}


/* =====================================================
   SOFT DROP
===================================================== */

function softDrop() {

    if (
        !gameRunning ||
        paused
    ) {

        return;

    }


    currentPiece.y++;


    if (collision()) {

        currentPiece.y--;

        lockPiece();

    }


    dropCounter = 0;

}


/* =====================================================
   HARD DROP
===================================================== */

function hardDrop() {

    if (
        !gameRunning ||
        paused
    ) {

        return;

    }


    while (
        !collision()
    ) {

        currentPiece.y++;

    }


    currentPiece.y--;


    lockPiece();

}


/* =====================================================
   LOCK PIECE
===================================================== */

function lockPiece() {

    /*
       The Tetris piece becomes
       individual sand grains.
    */

    mergePiece();


    /*
       Immediately start the first
       sand physics step.
    */

    updateSand();


    /*
       Check for completed rows.
    */

    clearLines();


    spawnPiece();


    dropCounter = 0;

}


/* =====================================================
   ROTATE
===================================================== */

function rotatePiece() {

    if (
        !gameRunning ||
        paused
    ) {

        return;

    }


    const oldShape =
        currentPiece.shape;


    const rotated =
        oldShape[0].map(
            (_, index) =>
                oldShape
                    .map(
                        row =>
                            row[index]
                    )
                    .reverse()
        );


    currentPiece.shape =
        rotated;


    /*
       Simple wall kick
    */

    if (collision()) {

        currentPiece.x++;


        if (collision()) {

            currentPiece.x -= 2;


            if (collision()) {

                currentPiece.x++;


                currentPiece.shape =
                    oldShape;

            }

        }

    }

}


/* =====================================================
   DRAW SAND GRAIN
===================================================== */

function drawSandGrain(
    context,
    x,
    y,
    size,
    grain
) {

    const color =
        grain.color;


    /*
       Main sand body
    */

    context.fillStyle =
        color;


    context.fillRect(
        x + 1,
        y + 1,
        size - 2,
        size - 2
    );


    /*
       Slight natural highlight
    */

    context.fillStyle =
        "rgba(255,255,255,0.18)";


    context.fillRect(
        x + 3,
        y + 3,
        size * 0.35,
        2
    );


    /*
       Tiny grain texture
    */

    context.fillStyle =
        "rgba(120,75,30,0.15)";


    context.fillRect(
        x + size * 0.55,
        y + size * 0.55,
        2,
        2
    );


    /*
       Soft edge
    */

    context.strokeStyle =
        "rgba(100,65,30,0.18)";


    context.strokeRect(
        x + 0.5,
        y + 0.5,
        size - 1,
        size - 1
    );

}


/* =====================================================
   DRAW NORMAL TETRIS BLOCK
===================================================== */

function drawPieceBlock(
    context,
    x,
    y,
    size,
    color
) {

    context.fillStyle =
        color;


    context.fillRect(
        x,
        y,
        size,
        size
    );


    context.fillStyle =
        "rgba(255,255,255,0.25)";


    context.fillRect(
        x + 2,
        y + 2,
        size - 4,
        4
    );


    context.strokeStyle =
        "rgba(0,0,0,0.18)";


    context.strokeRect(
        x,
        y,
        size,
        size
    );

}


/* =====================================================
   DRAW BOARD
===================================================== */

function draw() {

    /*
       Background
    */

    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
       Subtle grid
    */

    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";


    for (
        let x = 0;
        x <= COLS;
        x++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x * BLOCK,
            0
        );

        ctx.lineTo(
            x * BLOCK,
            canvas.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= ROWS;
        y++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y * BLOCK
        );

        ctx.lineTo(
            canvas.width,
            y * BLOCK
        );

        ctx.stroke();

    }


    /*
       Draw settled sand
    */

    board.forEach(
        (row, y) => {

            row.forEach(
                (grain, x) => {

                    if (!grain) {
                        return;
                    }


                    drawSandGrain(

                        ctx,

                        x * BLOCK,

                        y * BLOCK,

                        BLOCK,

                        grain

                    );

                }
            );

        }
    );


    /*
       Draw current Tetris piece
    */

    if (currentPiece) {

        currentPiece.shape.forEach(
            (row, y) => {

                row.forEach(
                    (value, x) => {

                        if (!value) {
                            return;
                        }


                        drawPieceBlock(

                            ctx,

                            (
                                currentPiece.x +
                                x
                            ) * BLOCK,

                            (
                                currentPiece.y +
                                y
                            ) * BLOCK,

                            BLOCK,

                            currentPiece.color

                        );

                    }
                );

            }
        );

    }

}


/* =====================================================
   DRAW NEXT PIECE
===================================================== */

function drawNext() {

    nextCtx.fillStyle =
        "#f8f8f8";


    nextCtx.fillRect(
        0,
        0,
        120,
        120
    );


    if (!nextPiece) {
        return;
    }


    const shape =
        nextPiece.shape;


    const size = 25;


    const width =
        shape[0].length *
        size;


    const height =
        shape.length *
        size;


    const startX =
        (120 - width) / 2;


    const startY =
        (120 - height) / 2;


    shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (!value) {
                        return;
                    }


                    drawPieceBlock(

                        nextCtx,

                        startX +
                        x * size,

                        startY +
                        y * size,

                        size,

                        nextPiece.color

                    );

                }
            );

        }
    );

}


/* =====================================================
   UPDATE UI
===================================================== */

function updateUI() {

    document.getElementById(
        "score"
    ).textContent =
        score;


    document.getElementById(
        "lines"
    ).textContent =
        lines;


    document.getElementById(
        "level"
    ).textContent =
        level;

}


/* =====================================================
   GAME LOOP
===================================================== */

function update(
    time = 0
) {

    if (!gameRunning) {
        return;
    }


    const deltaTime =
        time - lastTime;


    lastTime =
        time;


    if (!paused) {

        /*
           Normal Tetris falling
        */

        dropCounter +=
            deltaTime;


        if (
            dropCounter >
            dropInterval
        ) {

            softDrop();

        }


        /*
           Sand physics

           Runs separately from
           the Tetris piece.
        */

        sandTimer +=
            deltaTime;


        if (
            sandTimer >
            SAND_SPEED
        ) {

            updateSand();

            sandTimer = 0;

        }


        /*
           Check rows after sand
           has moved.
        */

        clearLines();


        draw();

    }


    animationID =
        requestAnimationFrame(
            update
        );

}


/* =====================================================
   START GAME
===================================================== */

function startGame() {

    board =
        createBoard();


    score = 0;

    lines = 0;

    level = 1;

    dropInterval = 800;

    sandTimer = 0;


    updateUI();


    nextPiece = null;


    gameRunning = true;

    paused = false;


    document.getElementById(
        "pauseButton"
    ).textContent =
        "⏸ Pause";


    hideOverlay();


    spawnPiece();


    cancelAnimationFrame(
        animationID
    );


    lastTime =
        performance.now();


    update();


    startMusic();

}


/* =====================================================
   PAUSE
===================================================== */

function pauseGame() {

    if (!gameRunning) {
        return;
    }


    if (!paused) {

        paused = true;


        showOverlay(

            "Paused",

            "Take a little break.",

            "Resume"

        );

    }

    else {

        resumeGame();

    }

}


/* =====================================================
   RESUME
===================================================== */

function resumeGame() {

    paused = false;


    hideOverlay();


    document.getElementById(
        "pauseButton"
    ).textContent =
        "⏸ Pause";


    lastTime =
        performance.now();

}


/* =====================================================
   RESTART
===================================================== */

function restartGame() {

    if (!gameRunning) {

        startGame();

        return;

    }


    showOverlay(

        "Restart?",

        "Your current game will be lost.",

        "Yes, Restart"

    );


    document.getElementById(
        "overlayCancel"
    ).style.display =
        "block";

}


/* =====================================================
   GAME OVER
===================================================== */

function gameOver() {

    gameRunning = false;


    /*
       Stop music
    */

    bgMusic.pause();


    /*
       Game over sound
    */

    if (soundEnabled) {

        gameOverSound.currentTime =
            0;

        gameOverSound
            .play()
            .catch(() => {});

    }


    showOverlay(

        "Game Over",

        `Score: ${score}`,

        "Play Again"

    );

}


/* =====================================================
   SHOW OVERLAY
===================================================== */

function showOverlay(
    title,
    subtitle,
    buttonText
) {

    document.getElementById(
        "overlayTitle"
    ).textContent =
        title;


    document.getElementById(
        "overlaySubtitle"
    ).textContent =
        subtitle;


    document.getElementById(
        "mainOverlayButton"
    ).textContent =
        buttonText;


    document.getElementById(
        "overlay"
    ).classList.remove(
        "hidden"
    );

}


/* =====================================================
   HIDE OVERLAY
===================================================== */

function hideOverlay() {

    document.getElementById(
        "overlay"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "overlayCancel"
    ).style.display =
        "none";

}


/* =====================================================
   OVERLAY MAIN BUTTON
===================================================== */

document.getElementById(
    "mainOverlayButton"
).addEventListener(
    "click",
    () => {

        const title =
            document.getElementById(
                "overlayTitle"
            ).textContent;


        if (
            title === "Restart?"
        ) {

            startGame();

            return;

        }


        if (
            title === "Paused"
        ) {

            resumeGame();

            return;

        }


        startGame();

    }
);


/* =====================================================
   NO BUTTON
===================================================== */

document.getElementById(
    "overlayCancel"
).addEventListener(
    "click",
    () => {

        hideOverlay();

    }
);


/* =====================================================
   PAUSE BUTTON
===================================================== */

document.getElementById(
    "pauseButton"
).addEventListener(
    "click",
    pauseGame
);


/* =====================================================
   RESTART BUTTON
===================================================== */

document.getElementById(
    "restartButton"
).addEventListener(
    "click",
    restartGame
);


/* =====================================================
   BACK TO ARCADE
===================================================== */

document.getElementById(
    "backButton"
).addEventListener(
    "click",
    () => {

        window.location.href =
            "https://ruzrun.github.io/arcade-game/";

    }
);


/* =====================================================
   KEYBOARD
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "ArrowLeft"
        ) {

            event.preventDefault();

            move(-1);

        }


        else if (
            event.key ===
            "ArrowRight"
        ) {

            event.preventDefault();

            move(1);

        }


        else if (
            event.key ===
            "ArrowDown"
        ) {

            event.preventDefault();

            softDrop();

        }


        else if (
            event.key ===
            "ArrowUp"
        ) {

            event.preventDefault();

            rotatePiece();

        }


        else if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            hardDrop();

        }


        else if (
            event.key.toLowerCase() ===
            "p"
        ) {

            pauseGame();

        }

    }
);


/* =====================================================
   MOBILE CONTROLS
===================================================== */

document.getElementById(
    "leftButton"
).addEventListener(
    "click",
    () => move(-1)
);


document.getElementById(
    "rightButton"
).addEventListener(
    "click",
    () => move(1)
);


document.getElementById(
    "rotateButton"
).addEventListener(
    "click",
    rotatePiece
);


document.getElementById(
    "downButton"
).addEventListener(
    "click",
    softDrop
);


document.getElementById(
    "dropButton"
).addEventListener(
    "click",
    hardDrop
);


/* =====================================================
   INITIAL SCREEN
===================================================== */

board =
    createBoard();


draw();


showOverlay(

    "Tetris 2",

    "Ready to play with sand?",

    "Start Game"

);
