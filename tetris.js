/* =====================================================
   RAA'S TETRIS 2
   FALLING COLOURFUL SAND
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");


/* =====================================================
   TETRIS SETTINGS
===================================================== */

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;


/* =====================================================
   SAND SETTINGS
===================================================== */

const SAND_SIZE = 3;

const SAND_COLS =
    Math.floor(canvas.width / SAND_SIZE);

const SAND_ROWS =
    Math.floor(canvas.height / SAND_SIZE);


/*
   Each sand grain has:

   sandColour  = its colour
   sandPieceId = which Tetris piece created it

   This is important because one single piece
   must NOT be able to clear itself.
*/

const sandColour =
    new Uint8Array(
        SAND_COLS * SAND_ROWS
    );

const sandPieceId =
    new Uint32Array(
        SAND_COLS * SAND_ROWS
    );


/*
   Every landed Tetris piece receives
   a unique ID.
*/

let nextPieceId = 1;


/* =====================================================
   COLOURS
===================================================== */

const COLOURS = [

    "#00d9ff",  // cyan
    "#ffe600",  // yellow
    "#b84cff",  // purple
    "#31e875",  // green
    "#ff477e",  // pink
    "#4f7cff",  // blue
    "#ff9d35"   // orange

];


/* =====================================================
   PIECES
===================================================== */

const PIECES = [

    {
        name: "I",
        colour: 0,

        shape: [
            [1, 1, 1, 1]
        ]
    },

    {
        name: "O",
        colour: 1,

        shape: [
            [1, 1],
            [1, 1]
        ]
    },

    {
        name: "T",
        colour: 2,

        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "S",
        colour: 3,

        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },

    {
        name: "Z",
        colour: 4,

        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },

    {
        name: "J",
        colour: 5,

        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "L",
        colour: 6,

        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    }

];


/* =====================================================
   GAME STATE
===================================================== */

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


/* =====================================================
   AUDIO
===================================================== */

function startMusic() {

    if (
        !bgMusic ||
        !soundEnabled
    ) {
        return;
    }

    bgMusic.volume = 0.35;

    bgMusic.play().catch(() => {});
}


function playSound(audio) {

    if (
        !audio ||
        !soundEnabled
    ) {
        return;
    }

    audio.currentTime = 0;

    audio.play().catch(() => {});
}


if (soundButton) {

    soundButton.addEventListener(
        "click",
        () => {

            soundEnabled =
                !soundEnabled;

            soundButton.textContent =
                soundEnabled
                    ? "🔊"
                    : "🔇";

            if (soundEnabled) {

                startMusic();

            } else {

                if (bgMusic) {
                    bgMusic.pause();
                }

            }

        }
    );

}


/* =====================================================
   SAND INDEX
===================================================== */

function sandIndex(x, y) {

    return (
        y * SAND_COLS
    ) + x;

}


/* =====================================================
   GET COLOUR
===================================================== */

function getSandColour(x, y) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {
        return 0;
    }

    return sandColour[
        sandIndex(x, y)
    ];

}


/* =====================================================
   GET PIECE ID
===================================================== */

function getSandPieceId(x, y) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {
        return 0;
    }

    return sandPieceId[
        sandIndex(x, y)
    ];

}


/* =====================================================
   SET SAND
===================================================== */

function setSand(
    x,
    y,
    colour,
    pieceId
) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {
        return;
    }

    const index =
        sandIndex(x, y);

    sandColour[index] =
        colour;

    sandPieceId[index] =
        pieceId;

}


/* =====================================================
   CLEAR SAND
===================================================== */

function removeSand(x, y) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {
        return;
    }

    const index =
        sandIndex(x, y);

    sandColour[index] = 0;
    sandPieceId[index] = 0;

}


/* =====================================================
   IS SAND
===================================================== */

function isSand(x, y) {

    return (
        getSandColour(x, y) !== 0
    );

}


/* =====================================================
   CLEAR EVERYTHING
===================================================== */

function clearSand() {

    sandColour.fill(0);
    sandPieceId.fill(0);

}


/* =====================================================
   CREATE RANDOM PIECE
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

        colour:
            template.colour,

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
   CHECK SAND IN TETRIS CELL
===================================================== */

function sandCellOccupied(
    boardX,
    boardY
) {

    const grainsPerBlock =
        BLOCK / SAND_SIZE;

    const startX =
        boardX * grainsPerBlock;

    const startY =
        boardY * grainsPerBlock;

    const endX =
        startX + grainsPerBlock;

    const endY =
        startY + grainsPerBlock;


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
                isSand(x, y)
            ) {

                return true;

            }

        }

    }


    return false;

}


/* =====================================================
   TETRIS COLLISION
===================================================== */

function collision() {

    if (!currentPiece) {
        return true;
    }


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


            if (bx < 0) {
                return true;
            }

            if (bx >= COLS) {
                return true;
            }

            if (by >= ROWS) {
                return true;
            }


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
   TURN BLOCK INTO SAND
===================================================== */

function turnPieceIntoSand() {

    const grainsPerBlock =
        BLOCK / SAND_SIZE;


    /*
       UNIQUE ID FOR THIS PIECE
    */

    const pieceId =
        nextPieceId++;


    /*
       Same colour for the entire piece.
    */

    const colour =
        currentPiece.colour + 1;


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
                ) * grainsPerBlock;


            const startY =
                (
                    currentPiece.y +
                    py
                ) * grainsPerBlock;


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


                    setSand(
                        gx,
                        gy,
                        colour,
                        pieceId
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
       Bottom → top.

       Sand falls naturally.
    */

    for (
        let y = SAND_ROWS - 2;
        y >= 0;
        y--
    ) {

        const leftFirst =
            Math.random() > 0.5;


        for (
            let x = 1;
            x < SAND_COLS - 1;
            x++
        ) {

            const colour =
                getSandColour(
                    x,
                    y
                );


            if (!colour) {
                continue;
            }


            const pieceId =
                getSandPieceId(
                    x,
                    y
                );


            /*
               DOWN
            */

            if (
                !isSand(
                    x,
                    y + 1
                )
            ) {

                removeSand(
                    x,
                    y
                );

                setSand(
                    x,
                    y + 1,
                    colour,
                    pieceId
                );

                continue;

            }


            /*
               LEFT FIRST
            */

            if (leftFirst) {

                if (
                    !isSand(
                        x - 1,
                        y + 1
                    )
                ) {

                    removeSand(
                        x,
                        y
                    );

                    setSand(
                        x - 1,
                        y + 1,
                        colour,
                        pieceId
                    );

                    continue;

                }


                if (
                    !isSand(
                        x + 1,
                        y + 1
                    )
                ) {

                    removeSand(
                        x,
                        y
                    );

                    setSand(
                        x + 1,
                        y + 1,
                        colour,
                        pieceId
                    );

                    continue;

                }

            }


            /*
               RIGHT FIRST
            */

            else {

                if (
                    !isSand(
                        x + 1,
                        y + 1
                    )
                ) {

                    removeSand(
                        x,
                        y
                    );

                    setSand(
                        x + 1,
                        y + 1,
                        colour,
                        pieceId
                    );

                    continue;

                }


                if (
                    !isSand(
                        x - 1,
                        y + 1
                    )
                ) {

                    removeSand(
                        x,
                        y
                    );

                    setSand(
                        x - 1,
                        y + 1,
                        colour,
                        pieceId
                    );

                    continue;

                }

            }

        }

    }

}


/* =====================================================
   FIND SAME COLOUR GROUP
===================================================== */

function findConnectedGroup(
    startX,
    startY,
    visited
) {

    const startColour =
        getSandColour(
            startX,
            startY
        );


    if (!startColour) {
        return [];
    }


    const queue = [
        [startX, startY]
    ];


    const group = [];


    visited[
        sandIndex(
            startX,
            startY
        )
    ] = 1;


    while (
        queue.length > 0
    ) {

        const [
            x,
            y
        ] = queue.pop();


        group.push([
            x,
            y
        ]);


        /*
           4 DIRECTIONS ONLY

           UP
           DOWN
           LEFT
           RIGHT

           Diagonal does NOT connect.
        */

        const neighbours = [

            [x, y - 1],
            [x, y + 1],
            [x - 1, y],
            [x + 1, y]

        ];


        for (
            const [
                nx,
                ny
            ]
            of neighbours
        ) {

            if (
                nx < 0 ||
                nx >= SAND_COLS ||
                ny < 0 ||
                ny >= SAND_ROWS
            ) {
                continue;
            }


            const index =
                sandIndex(
                    nx,
                    ny
                );


            if (
                visited[index]
            ) {
                continue;
            }


            /*
               DIFFERENT COLOUR
               DOES NOT CONNECT.
            */

            if (
                getSandColour(
                    nx,
                    ny
                ) !== startColour
            ) {
                continue;
            }


            visited[index] = 1;


            queue.push([
                nx,
                ny
            ]);

        }

    }


    return group;

}

/* =====================================================
   CHECK WALL-TO-WALL COLOUR CONNECTION
===================================================== */

function checkSandConnections() {

    const visited =
        new Uint8Array(
            SAND_COLS * SAND_ROWS
        );

    let totalCleared = 0;
    let groupsCleared = 0;


    /*
       Search every sand group.
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

            const index =
                sandIndex(x, y);


            if (visited[index]) {
                continue;
            }


            if (!isSand(x, y)) {
                continue;
            }


            /*
               Find the complete connected
               same-colour group.
            */

            const group =
                findConnectedGroup(
                    x,
                    y,
                    visited
                );


            if (group.length === 0) {
                continue;
            }


            /*
               Check whether this group
               touches the LEFT wall.
            */

            let touchesLeftWall = false;


            /*
               Check whether this group
               touches the RIGHT wall.
            */

            let touchesRightWall = false;


            for (
                const [gx, gy]
                of group
            ) {

                if (
                    gx === 0
                ) {

                    touchesLeftWall = true;

                }


                if (
                    gx === SAND_COLS - 1
                ) {

                    touchesRightWall = true;

                }


                /*
                   If both walls have already
                   been reached, we don't need
                   to keep checking.
                */

                if (
                    touchesLeftWall &&
                    touchesRightWall
                ) {

                    break;

                }

            }


            /*
               IMPORTANT:

               The group only clears if it
               physically connects BOTH:

               LEFT WALL
                    ↓
               █████████████
                    ↓
               RIGHT WALL

               Merely touching another
               Tetris piece is NOT enough.
            */

            if (
                !touchesLeftWall ||
                !touchesRightWall
            ) {

                continue;

            }


            /*
               WALL-TO-WALL CONNECTION FOUND!
            */

            for (
                const [gx, gy]
                of group
            ) {

                removeSand(
                    gx,
                    gy
                );

            }


            totalCleared +=
                group.length;


            groupsCleared++;

        }

    }


    /*
       Nothing cleared.
    */

    if (
        totalCleared === 0
    ) {

        return;

    }


    /*
       SCORE
    */

    score +=
        totalCleared * 5;


    lines +=
        groupsCleared;


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


    /*
       SOUND
    */

    playSound(
        lineClearSound
    );


    /*
       POPUP
    */

    const popup =
        document.getElementById(
            "linePopup"
        );


    const popupText =
        document.getElementById(
            "linePopupText"
        );


    if (popupText) {

        popupText.textContent =
            groupsCleared > 1
                ? "WALL COMBO! 🌈💥"
                : "WALL TO WALL! 🌈💥";

    }


    if (popup) {

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
       Subtle grid.
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

            const colour =
                getSandColour(
                    x,
                    y
                );


            if (!colour) {
                continue;
            }


            ctx.fillStyle =
                COLOURS[
                    colour - 1
                ];


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
   DRAW FALLING PIECE
===================================================== */

function drawCurrentPiece() {

    if (!currentPiece) {
        return;
    }


    const colour =
        COLOURS[
            currentPiece.colour
        ];


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


                    ctx.fillStyle =
                        colour;


                    ctx.fillRect(
                        px + 1,
                        py + 1,
                        BLOCK - 2,
                        BLOCK - 2
                    );


                    /*
                       Highlight.
                    */

                    ctx.fillStyle =
                        "rgba(255,255,255,0.28)";


                    ctx.fillRect(
                        px + 3,
                        py + 3,
                        BLOCK - 6,
                        4
                    );


                    ctx.fillStyle =
                        "rgba(255,255,255,0.12)";


                    ctx.fillRect(
                        px + 3,
                        py + 7,
                        4,
                        BLOCK - 12
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


                    nextCtx.fillStyle =
                        COLOURS[
                            nextPiece.colour
                        ];


                    nextCtx.fillRect(
                        startX +
                        x * size +
                        1,

                        startY +
                        y * size +
                        1,

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
        paused ||
        !currentPiece
    ) {
        return;
    }


    currentPiece.x +=
        direction;


    if (collision()) {

        currentPiece.x -=
            direction;

    }


    draw();

}


/* =====================================================
   SOFT DROP
===================================================== */

function softDrop() {

    if (
        !gameRunning ||
        paused ||
        !currentPiece
    ) {
        return;
    }


    currentPiece.y++;


    if (collision()) {

        currentPiece.y--;


        lockPiece();

    }


    dropCounter = 0;


    draw();

}


/* =====================================================
   HARD DROP
===================================================== */

function hardDrop() {

    if (
        !gameRunning ||
        paused ||
        !currentPiece
    ) {
        return;
    }


    while (!collision()) {

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
        paused ||
        !currentPiece
    ) {
        return;
    }


    const oldShape =
        currentPiece.shape;


    const oldX =
        currentPiece.x;


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
       Normal rotation.
    */

    if (!collision()) {

        draw();

        return;

    }


    /*
       Try right.
    */

    currentPiece.x++;


    if (!collision()) {

        draw();

        return;

    }


    /*
       Try left.
    */

    currentPiece.x -= 2;


    if (!collision()) {

        draw();

        return;

    }


    /*
       Restore.
    */

    currentPiece.x =
        oldX;

    currentPiece.shape =
        oldShape;


    draw();

}


/* =====================================================
   LOCK PIECE
===================================================== */

function lockPiece() {

    /*
       FIRST:

       Turn the block into
       permanent sand.

       It DOES NOT disappear.
    */

    turnPieceIntoSand();


    /*
       Let the new sand settle.
    */

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        updateSand();

    }


    /*
       NOW check if this sand has
       connected to another piece.
    */

    checkSandConnections();


    /*
       Spawn next block.
    */

    spawnPiece();


    dropCounter = 0;


    draw();

}


/* =====================================================
   UI
===================================================== */

function updateUI() {

    const scoreElement =
        document.getElementById(
            "score"
        );

    const linesElement =
        document.getElementById(
            "lines"
        );

    const levelElement =
        document.getElementById(
            "level"
        );


    if (scoreElement) {

        scoreElement.textContent =
            score;

    }


    if (linesElement) {

        linesElement.textContent =
            lines;

    }


    if (levelElement) {

        levelElement.textContent =
            level;

    }

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


        /*
           Normal Tetris falling.
        */

        if (
            dropCounter >=
            dropInterval
        ) {

            softDrop();

        }


        /*
           Sand physics.

           Only 2 updates per frame
           to keep performance good.
        */

        updateSand();
        updateSand();


        /*
           Check connections occasionally.

           We do NOT check every grain
           every frame because that would
           waste CPU.
        */

        if (
            Math.random() < 0.025
        ) {

            checkSandConnections();

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


    currentPiece = null;
    nextPiece = null;


    score = 0;
    lines = 0;
    level = 1;


    dropCounter = 0;


    dropInterval = 800;


    nextPieceId = 1;


    gameRunning = true;
    paused = false;


    updateUI();


    hideOverlay();


    spawnPiece();


    lastTime =
        performance.now();


    startMusic();


    requestAnimationFrame(
        update
    );

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


    const button =
        document.getElementById(
            "pauseButton"
        );


    if (button) {

        button.textContent =
            paused
                ? "▶ Resume"
                : "⏸ Pause";

    }


    if (paused) {

        showOverlay(
            "Paused",
            "Take a little break.",
            "Resume"
        );

    } else {

        hideOverlay();

        lastTime =
            performance.now();

    }

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


    playSound(
        gameOverSound
    );


    if (bgMusic) {

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

    const overlay =
        document.getElementById(
            "overlay"
        );

    const titleElement =
        document.getElementById(
            "overlayTitle"
        );

    const subtitleElement =
        document.getElementById(
            "overlaySubtitle"
        );

    const mainButton =
        document.getElementById(
            "mainOverlayButton"
        );


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (subtitleElement) {

        subtitleElement.textContent =
            subtitle;

    }


    if (mainButton) {

        mainButton.textContent =
            buttonText;

    }


    if (overlay) {

        overlay.classList.remove(
            "hidden"
        );

    }

}


/* =====================================================
   HIDE OVERLAY
===================================================== */

function hideOverlay() {

    const overlay =
        document.getElementById(
            "overlay"
        );


    if (overlay) {

        overlay.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   MAIN OVERLAY BUTTON
===================================================== */

const mainOverlayButton =
    document.getElementById(
        "mainOverlayButton"
    );


if (mainOverlayButton) {

    mainOverlayButton.addEventListener(
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

            } else {

                startGame();

            }

        }
    );

}


/* =====================================================
   PAUSE BUTTON
===================================================== */

const pauseButton =
    document.getElementById(
        "pauseButton"
    );


if (pauseButton) {

    pauseButton.addEventListener(
        "click",
        pauseGame
    );

}


/* =====================================================
   RESTART BUTTON
===================================================== */

const restartButton =
    document.getElementById(
        "restartButton"
    );


if (restartButton) {

    restartButton.addEventListener(
        "click",
        restartGame
    );

}


/* =====================================================
   BACK TO ARCADE
===================================================== */

const backButton =
    document.getElementById(
        "backButton"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "https://ruzrun.github.io/arcade-game/";

        }
    );

}


/* =====================================================
   KEYBOARD CONTROLS
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

            event.preventDefault();

            pauseGame();

        }

    }
);


/* =====================================================
   MOBILE CONTROLS
===================================================== */

const leftButton =
    document.getElementById(
        "leftButton"
    );

const rightButton =
    document.getElementById(
        "rightButton"
    );

const rotateButton =
    document.getElementById(
        "rotateButton"
    );

const downButton =
    document.getElementById(
        "downButton"
    );

const dropButton =
    document.getElementById(
        "dropButton"
    );


if (leftButton) {

    leftButton.addEventListener(
        "click",
        () => move(-1)
    );

}


if (rightButton) {

    rightButton.addEventListener(
        "click",
        () => move(1)
    );

}


if (rotateButton) {

    rotateButton.addEventListener(
        "click",
        rotatePiece
    );

}


if (downButton) {

    downButton.addEventListener(
        "click",
        softDrop
    );

}


if (dropButton) {

    dropButton.addEventListener(
        "click",
        hardDrop
    );

}


/* =====================================================
   INITIALISE
===================================================== */

clearSand();

draw();


showOverlay(
    "Tetris 2",
    "Ready to play with sand?",
    "Start Game"
);
