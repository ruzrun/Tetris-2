/* =====================================================
   RAA'S TETRIS 2
   🌈 FALLING SAND EDITION
   Lightweight cellular sand simulation
===================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;


/* =====================================================
   SAND ENGINE
===================================================== */

const SAND_SIZE = 3;

const SAND_COLS =
    Math.floor(canvas.width / SAND_SIZE);

const SAND_ROWS =
    Math.floor(canvas.height / SAND_SIZE);


/*
   Each number represents a grain.

   0 = empty
   1+ = colour index
*/

const sand = new Uint8Array(
    SAND_COLS * SAND_ROWS
);


/* =====================================================
   COLOURS
===================================================== */

const COLOURS = [

    "#00d9ff",
    "#20e4ff",
    "#63edff",

    "#ffe600",
    "#fff04a",
    "#ffd000",

    "#b84cff",
    "#c866ff",
    "#d891ff",

    "#31e875",
    "#53f28d",
    "#7affaa",

    "#ff477e",
    "#ff6894",
    "#ff8aaa",

    "#4f7cff",
    "#7097ff",
    "#91adff",

    "#ff9d35",
    "#ffb45e",
    "#ffd080"

];


/* =====================================================
   TETRIS PIECES
===================================================== */

const PIECES = [

    {
        name: "I",
        colourStart: 0,

        shape: [
            [1, 1, 1, 1]
        ]
    },

    {
        name: "O",
        colourStart: 3,

        shape: [
            [1, 1],
            [1, 1]
        ]
    },

    {
        name: "T",
        colourStart: 6,

        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "S",
        colourStart: 9,

        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },

    {
        name: "Z",
        colourStart: 12,

        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },

    {
        name: "J",
        colourStart: 15,

        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "L",
        colourStart: 18,

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
let lastTime = 0;

let dropInterval = 800;

let gameRunning = false;
let paused = false;


/* =====================================================
   HELPERS
===================================================== */

function sandIndex(x, y) {

    return y * SAND_COLS + x;

}


function getSand(x, y) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {

        return 0;

    }

    return sand[
        sandIndex(x, y)
    ];

}


function setSand(x, y, value) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {

        return;

    }

    sand[
        sandIndex(x, y)
    ] = value;

}


function isSand(x, y) {

    return getSand(x, y) !== 0;

}


/* =====================================================
   CLEAR SAND
===================================================== */

function clearSand() {

    sand.fill(0);

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

        name: template.name,

        colourStart:
            template.colourStart,

        shape:
            template.shape.map(
                row => [...row]
            ),

        x: 0,
        y: 0

    };

}


/* =====================================================
   CREATE BOARD
===================================================== */

function createBoard() {

    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );

}


/* =====================================================
   SPAWN
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


            const bx =
                currentPiece.x + x;

            const by =
                currentPiece.y + y;


            if (
                bx < 0 ||
                bx >= COLS ||
                by >= ROWS
            ) {

                return true;

            }


            /*
               The sand pile is converted
               into a rough Tetris collision map.
            */

            if (
                by >= 0 &&
                sandCellOccupied(
                    bx,
                    by
                )
            ) {

                return true;

            }

        }

    }


    return false;

}


/* =====================================================
   CHECK WHETHER A TETRIS CELL CONTAINS SAND
===================================================== */

function sandCellOccupied(
    boardX,
    boardY
) {

    const startX =
        boardX *
        (BLOCK / SAND_SIZE);

    const startY =
        boardY *
        (BLOCK / SAND_SIZE);


    const endX =
        startX +
        (BLOCK / SAND_SIZE);

    const endY =
        startY +
        (BLOCK / SAND_SIZE);


    for (
        let y = startY;
        y < endY;
        y++
    ) {

        for (
            let x = startX;
            x < endX;
            x++
        ) {

            if (
                getSand(x, y)
            ) {

                return true;

            }

        }

    }


    return false;

}


/* =====================================================
   CONVERT LANDED TETRIS PIECE INTO SAND
===================================================== */

function turnPieceIntoSand() {

    const grainsPerBlock =
        BLOCK / SAND_SIZE;


    for (
        let py = 0;
        py < currentPiece.shape.length;
        py++
    ) {

        for (
            let px = 0;
            px < currentPiece.shape[py].length;
            px++
        ) {

            if (
                !currentPiece.shape[py][px]
            ) {

                continue;

            }


            const startX =
                (
                    currentPiece.x +
                    px
                ) *
                grainsPerBlock;


            const startY =
                (
                    currentPiece.y +
                    py
                ) *
                grainsPerBlock;


            /*
               Fill the Tetris cell with
               tiny colourful grains.
            */

            for (
                let sy = 0;
                sy < grainsPerBlock;
                sy++
            ) {

                for (
                    let sx = 0;
                    sx < grainsPerBlock;
                    sx++
                ) {

                    const gx =
                        startX + sx;

                    const gy =
                        startY + sy;


                    /*
                       Slight randomness makes
                       the grain colour varied.
                    */

                    const colour =
                        currentPiece.colourStart +
                        Math.floor(
                            Math.random() * 3
                        );


                    setSand(
                        gx,
                        gy,
                        colour + 1
                    );

                }

            }

        }

    }

}


/* =====================================================
   SAND PHYSICS
===================================================== */

function updateSand() {

    /*
       Process from bottom upwards.

       This is extremely cheap because
       each location is just a Uint8 value.
    */

    for (
        let y = SAND_ROWS - 2;
        y >= 0;
        y--
    ) {

        /*
           Randomise direction slightly.

           This makes the pile look less
           perfectly symmetrical.
        */

        const leftFirst =
            Math.random() > 0.5;


        for (
            let x = 1;
            x < SAND_COLS - 1;
            x++
        ) {

            const current =
                getSand(x, y);


            if (!current) {

                continue;

            }


            /*
               Straight down
            */

            if (
                !isSand(x, y + 1)
            ) {

                setSand(
                    x,
                    y,
                    0
                );

                setSand(
                    x,
                    y + 1,
                    current
                );

                continue;

            }


            /*
               Down-left
            */

            if (leftFirst) {

                if (
                    !isSand(
                        x - 1,
                        y + 1
                    )
                ) {

                    setSand(
                        x,
                        y,
                        0
                    );

                    setSand(
                        x - 1,
                        y + 1,
                        current
                    );

                    continue;

                }


                /*
                   Down-right
                */

                if (
                    !isSand(
                        x + 1,
                        y + 1
                    )
                ) {

                    setSand(
                        x,
                        y,
                        0
                    );

                    setSand(
                        x + 1,
                        y + 1,
                        current
                    );

                    continue;

                }

            }

            else {

                /*
                   Down-right first
                */

                if (
                    !isSand(
                        x + 1,
                        y + 1
                    )
                ) {

                    setSand(
                        x,
                        y,
                        0
                    );

                    setSand(
                        x + 1,
                        y + 1,
                        current
                    );

                    continue;

                }


                /*
                   Down-left
                */

                if (
                    !isSand(
                        x - 1,
                        y + 1
                    )
                ) {

                    setSand(
                        x,
                        y,
                        0
                    );

                    setSand(
                        x - 1,
                        y + 1,
                        current
                    );

                    continue;

                }

            }

        }

    }

}


/* =====================================================
   RUN MULTIPLE SAND STEPS
===================================================== */

function simulateSand() {

    /*
       Three tiny simulation steps per
       game frame gives smooth falling.
    */

    updateSand();
    updateSand();
    updateSand();

}


/* =====================================================
   DRAW BACKGROUND
===================================================== */

function drawBackground() {

    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
       Very subtle grid
    */

    ctx.strokeStyle =
        "rgba(255,255,255,0.025)";


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

}


/* =====================================================
   DRAW SAND
===================================================== */

function drawSand() {

    /*
       Each sand cell is just a tiny
       coloured square.
    */

    for (
        let y = 0;
        y < SAND_ROWS;
        y++
    ) {

        for (
            let x = 0;
            x < SAND_COLS;
            x++
        ) {

            const value =
                sand[
                    sandIndex(x, y)
                ];


            if (!value) {

                continue;

            }


            ctx.fillStyle =
                COLOURS[value - 1];


            ctx.fillRect(
                x * SAND_SIZE,
                y * SAND_SIZE,
                SAND_SIZE,
                SAND_SIZE
            );

        }

    }

}


/* =====================================================
   DRAW CURRENT PIECE
===================================================== */

function drawCurrentPiece() {

    if (!currentPiece) {

        return;

    }


    currentPiece.shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (!value) {

                        return;

                    }


                    const px =
                        (
                            currentPiece.x +
                            x
                        ) * BLOCK;


                    const py =
                        (
                            currentPiece.y +
                            y
                        ) * BLOCK;


                    const colour =
                        COLOURS[
                            currentPiece.colourStart
                        ];


                    ctx.fillStyle =
                        colour;


                    ctx.fillRect(
                        px + 1,
                        py + 1,
                        BLOCK - 2,
                        BLOCK - 2
                    );


                    /*
                       Highlight
                    */

                    ctx.fillStyle =
                        "rgba(255,255,255,0.3)";


                    ctx.fillRect(
                        px + 3,
                        py + 3,
                        BLOCK - 6,
                        4
                    );

                }
            );

        }
    );

}


/* =====================================================
   DRAW EVERYTHING
===================================================== */

function draw() {

    drawBackground();

    drawSand();

    drawCurrentPiece();

}


/* =====================================================
   NEXT PIECE
===================================================== */

function drawNext() {

    nextCtx.clearRect(
        0,
        0,
        120,
        120
    );


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
        (
            120 - width
        ) / 2;


    const startY =
        (
            120 - height
        ) / 2;


    shape.forEach(
        (row, y) => {

            row.forEach(
                (value, x) => {

                    if (!value) {

                        return;

                    }


                    const px =
                        startX +
                        x * size;


                    const py =
                        startY +
                        y * size;


                    nextCtx.fillStyle =
                        COLOURS[
                            nextPiece.colourStart
                        ];


                    nextCtx.fillRect(
                        px + 1,
                        py + 1,
                        size - 2,
                        size - 2
                    );

                }
            );

        }
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
   LOCK
===================================================== */

function lockPiece() {

    turnPieceIntoSand();

    spawnPiece();

    dropCounter = 0;

}


/* =====================================================
   SIMPLE SAND LINE CLEAR
===================================================== */

function checkSandLines() {

    /*
       A row is considered full when
       around 92% of its tiny cells
       contain sand.
    */

    const required =
        Math.floor(
            SAND_COLS * 0.92
        );


    let cleared = 0;


    for (
        let y = SAND_ROWS - 1;
        y >= 0;
        y--
    ) {

        let count = 0;


        for (
            let x = 0;
            x < SAND_COLS;
            x++
        ) {

            if (
                getSand(x, y)
            ) {

                count++;

            }

        }


        if (
            count < required
        ) {

            continue;

        }


        /*
           Remove this row.
        */

        for (
            let yy = y;
            yy > 0;
            yy--
        ) {

            for (
                let x = 0;
                x < SAND_COLS;
                x++
            ) {

                setSand(
                    x,
                    yy,
                    getSand(
                        x,
                        yy - 1
                    )
                );

            }

        }


        /*
           Empty top row.
        */

        for (
            let x = 0;
            x < SAND_COLS;
            x++
        ) {

            setSand(
                x,
                0,
                0
            );

        }


        cleared++;

        y++;

    }


    if (!cleared) {

        return;

    }


    score +=
        cleared *
        100 *
        level;


    lines +=
        cleared;


    level =
        Math.floor(
            lines / 10
        ) + 1;


    dropInterval =
        Math.max(
            100,
            800 -
            (
                level - 1
            ) * 60
        );


    updateUI();


    const popup =
        document.getElementById(
            "linePopup"
        );


    const popupText =
        document.getElementById(
            "linePopupText"
        );


    popupText.textContent =
        cleared >= 4
            ? "SAND BLAST! 🌈"
            : "NICE! ✨";


    popup.classList.add(
        "show"
    );


    setTimeout(
        () => {

            popup.classList.remove(
                "show"
            );

        },
        900
    );

}


/* =====================================================
   UI
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

function update(time = 0) {

    if (!gameRunning) {

        return;

    }


    const delta =
        time - lastTime;


    lastTime =
        time;


    if (!paused) {

        dropCounter +=
            delta;


        if (
            dropCounter >
            dropInterval
        ) {

            softDrop();

        }


        /*
           Sand simulation
        */

        simulateSand();


        /*
           Check rows occasionally,
           NOT every single frame.
        */

        if (
            Math.random() < 0.08
        ) {

            checkSandLines();

        }


        draw();

    }


    requestAnimationFrame(
        update
    );

}


/* =====================================================
   START
===================================================== */

function startGame() {

    clearSand();


    board =
        createBoard();


    currentPiece = null;
    nextPiece = null;


    score = 0;
    lines = 0;
    level = 1;


    dropInterval = 800;

    dropCounter = 0;


    gameRunning = true;
    paused = false;


    updateUI();


    hideOverlay();


    spawnPiece();


    lastTime =
        performance.now();


    requestAnimationFrame(
        update
    );


    startMusic();

}


/* =====================================================
   PAUSE
===================================================== */

function pauseGame() {

    if (!gameRunning) {

        return;

    }


    paused =
        !paused;


    document.getElementById(
        "pauseButton"
    ).textContent =
        paused
            ? "▶ Resume"
            : "⏸ Pause";


    if (paused) {

        showOverlay(
            "Paused",
            "Take a little break.",
            "Resume"
        );

    }

    else {

        hideOverlay();

    }

}


/* =====================================================
   RESTART
===================================================== */

function restartGame() {

    startGame();

}


/* =====================================================
   GAME OVER
===================================================== */

function gameOver() {

    gameRunning = false;


    if (
        typeof bgMusic !==
        "undefined"
    ) {

        bgMusic.pause();

    }


    showOverlay(
        "Game Over",
        `Score: ${score}`,
        "Play Again"
    );

}


/* =====================================================
   OVERLAY
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


function hideOverlay() {

    document.getElementById(
        "overlay"
    ).classList.add(
        "hidden"
    );

}


/* =====================================================
   BUTTONS
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
            title === "Paused"
        ) {

            pauseGame();

        }

        else {

            startGame();

        }

    }
);


document.getElementById(
    "pauseButton"
).addEventListener(
    "click",
    pauseGame
);


document.getElementById(
    "restartButton"
).addEventListener(
    "click",
    restartGame
);


/* =====================================================
   BACK BUTTON
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
   MOBILE
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
   INITIALISE
===================================================== */

board =
    createBoard();


clearSand();


draw();


showOverlay(
    "Tetris 2",
    "Ready to play with sand?",
    "Start Game"
);
