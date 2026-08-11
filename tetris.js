/* =====================================================
   RAA'S TETRIS 2
   🌈 FALLING SAND EDITION
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


/* =====================================================
   GAME SIZE
===================================================== */

const COLS = 10;
const ROWS = 20;

const BLOCK = 30;


/* =====================================================
   SAND SETTINGS
===================================================== */

/*
   3px grains.

   300 / 3 = 100 columns
   600 / 3 = 200 rows

   Total = 20,000 possible cells.

   Because every cell is only one number,
   this stays lightweight.
*/

const SAND_SIZE = 3;

const SAND_COLS =
    Math.floor(
        canvas.width /
        SAND_SIZE
    );

const SAND_ROWS =
    Math.floor(
        canvas.height /
        SAND_SIZE
    );


/*
   IMPORTANT:

   One normal Tetris block contains:

   10 × 10 = 100 grains.

   We use 120 grains as the minimum
   connected group.

   Therefore one piece won't instantly
   disappear by itself.

   Two pieces of the same colour that
   connect can clear.
*/

const MIN_CONNECTED_SAND = 120;


/* =====================================================
   SAND GRID
===================================================== */

/*
   0 = empty

   1 = cyan
   2 = yellow
   3 = purple
   4 = green
   5 = pink
   6 = blue
   7 = orange
*/

const sand =
    new Uint8Array(
        SAND_COLS *
        SAND_ROWS
    );


/* =====================================================
   COLOURS
===================================================== */

const COLOURS = [

    "#00d9ff",   // cyan
    "#ffe600",   // yellow
    "#b84cff",   // purple
    "#31e875",   // green
    "#ff477e",   // pink
    "#4f7cff",   // blue
    "#ff9d35"    // orange

];


/* =====================================================
   TETRIS PIECES
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
    document.getElementById(
        "gameOverSound"
    );

const lineClearSound =
    document.getElementById(
        "lineClearSound"
    );

const soundButton =
    document.getElementById(
        "soundButton"
    );

let soundEnabled = true;


/* =====================================================
   AUDIO FUNCTIONS
===================================================== */

function startMusic() {

    if (
        !bgMusic ||
        !soundEnabled
    ) {

        return;

    }


    bgMusic.volume = 0.35;


    bgMusic.play()
        .catch(() => {

            /*
               Browsers may block autoplay.

               The first user interaction will
               allow the music to start.
            */

        });

}


function playSound(audio) {

    if (
        !audio ||
        !soundEnabled
    ) {

        return;

    }


    audio.currentTime = 0;

    audio.play()
        .catch(() => {});

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


            if (
                soundEnabled
            ) {

                startMusic();

            }

            else {

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

function sandIndex(
    x,
    y
) {

    return (
        y *
        SAND_COLS
    ) + x;

}


/* =====================================================
   GET SAND
===================================================== */

function getSand(
    x,
    y
) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {

        return 0;

    }


    return sand[
        sandIndex(
            x,
            y
        )
    ];

}


/* =====================================================
   SET SAND
===================================================== */

function setSand(
    x,
    y,
    value
) {

    if (
        x < 0 ||
        x >= SAND_COLS ||
        y < 0 ||
        y >= SAND_ROWS
    ) {

        return;

    }


    sand[
        sandIndex(
            x,
            y
        )
    ] = value;

}


/* =====================================================
   IS SAND
===================================================== */

function isSand(
    x,
    y
) {

    return (
        getSand(x, y) !== 0
    );

}


/* =====================================================
   CLEAR ALL SAND
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

        name:
            template.name,

        colour:
            template.colour,

        shape:
            template.shape.map(
                row =>
                    [...row]
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
                currentPiece
                    .shape[0]
                    .length
            ) / 2
        );


    drawNext();


    /*
       If the new piece cannot enter,
       game over.
    */

    if (
        collision()
    ) {

        gameOver();

    }

}


/* =====================================================
   SAND COLLISION FOR TETRIS CELL
===================================================== */

function sandCellOccupied(
    boardX,
    boardY
) {

    const grainsPerBlock =
        BLOCK /
        SAND_SIZE;


    const startX =
        boardX *
        grainsPerBlock;


    const startY =
        boardY *
        grainsPerBlock;


    const endX =
        startX +
        grainsPerBlock;


    const endY =
        startY +
        grainsPerBlock;


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
   TETRIS COLLISION
===================================================== */

function collision() {

    if (!currentPiece) {

        return true;

    }


    for (
        let y = 0;
        y <
        currentPiece.shape.length;
        y++
    ) {

        for (
            let x = 0;
            x <
            currentPiece.shape[y].length;
            x++
        ) {

            if (
                !currentPiece.shape[y][x]
            ) {

                continue;

            }


            const bx =
                currentPiece.x +
                x;


            const by =
                currentPiece.y +
                y;


            /*
               Left wall
            */

            if (
                bx < 0
            ) {

                return true;

            }


            /*
               Right wall
            */

            if (
                bx >= COLS
            ) {

                return true;

            }


            /*
               Bottom
            */

            if (
                by >= ROWS
            ) {

                return true;

            }


            /*
               Sand collision
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
   TURN PIECE INTO SAND
===================================================== */

function turnPieceIntoSand() {

    const grainsPerBlock =
        BLOCK /
        SAND_SIZE;


    for (
        let py = 0;
        py <
        currentPiece.shape.length;
        py++
    ) {

        for (
            let px = 0;
            px <
            currentPiece.shape[py].length;
            px++
        ) {

            if (
                !currentPiece
                    .shape[py][px]
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
               SAME colour for every grain
               from this Tetris piece.

               This is VERY important.

               Otherwise the grains would be
               different colour IDs and would
               never connect.
            */

            const colour =
                currentPiece.colour + 1;


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
                        colour
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
       Bottom to top.

       This allows grains to fall naturally.
    */

    for (
        let y =
            SAND_ROWS - 2;

        y >= 0;

        y--
    ) {

        /*
           Randomise horizontal preference.

           This makes the pile look natural.
        */

        const leftFirst =
            Math.random() >
            0.5;


        for (
            let x = 1;

            x <
            SAND_COLS - 1;

            x++
        ) {

            const current =
                getSand(
                    x,
                    y
                );


            if (!current) {

                continue;

            }


            /*
               DOWN
            */

            if (
                !isSand(
                    x,
                    y + 1
                )
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
               LEFT FIRST
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
   SAND SIMULATION
===================================================== */

function simulateSand() {

    /*
       Two steps is enough.

       More steps = heavier CPU usage.
    */

    updateSand();

    updateSand();

}


/* =====================================================
   FIND CONNECTED SAME-COLOUR GROUP
===================================================== */

function findConnectedGroup(
    startX,
    startY,
    visited
) {

    const startColour =
        getSand(
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
        queue.length
    ) {

        const current =
            queue.pop();


        const x =
            current[0];


        const y =
            current[1];


        group.push([
            x,
            y
        ]);


        /*
           ONLY four directions.

              UP
               ↑
           LEFT ← → RIGHT
               ↓
             DOWN

           Diagonal touching does NOT connect.
        */

        const neighbours = [

            [x, y - 1],

            [x, y + 1],

            [x - 1, y],

            [x + 1, y]

        ];


        for (
            const neighbour
            of neighbours
        ) {

            const nx =
                neighbour[0];


            const ny =
                neighbour[1];


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
               MUST be the exact
               same colour.
            */

            if (
                getSand(
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
   CLEAR SAME-COLOUR CONNECTIONS
===================================================== */

function checkSandConnections() {

    const visited =
        new Uint8Array(
            SAND_COLS *
            SAND_ROWS
        );


    let totalCleared = 0;

    let groupsCleared = 0;


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
                sandIndex(
                    x,
                    y
                );


            if (
                visited[index]
            ) {

                continue;

            }


            if (
                !getSand(
                    x,
                    y
                )
            ) {

                continue;

            }


            const group =
                findConnectedGroup(
                    x,
                    y,
                    visited
                );


            /*
               A single piece is about
               100 grains.

               Requiring 120 means a group
               normally needs sand from
               multiple pieces.
            */

            if (
                group.length <
                MIN_CONNECTED_SAND
            ) {

                continue;

            }


            /*
               Clear the entire connected
               same-colour group.
            */

            for (
                const cell
                of group
            ) {

                setSand(
                    cell[0],
                    cell[1],
                    0
                );

            }


            totalCleared +=
                group.length;


            groupsCleared++;

        }

    }


    if (
        totalCleared === 0
    ) {

        return;

    }


    /*
       SCORE

       Larger groups give more points.
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


    playSound(
        lineClearSound
    );


    const popup =
        document.getElementById(
            "linePopup"
        );


    const popupText =
        document.getElementById(
            "linePopupText"
        );


    if (
        groupsCleared >= 2
    ) {

        popupText.textContent =
            "COLOUR COMBO! 🌈💥";

    }

    else {

        popupText.textContent =
            "COLOUR CONNECT! ✨";

    }


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
       Very subtle Tetris grid.
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

            const value =
                sand[
                    sandIndex(
                        x,
                        y
                    )
                ];


            if (!value) {

                continue;

            }


            const colour =
                COLOURS[
                    value - 1
                ];


            ctx.fillStyle =
                colour;


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


                    /*
                       Main block.
                    */

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
                        "rgba(255,255,255,0.30)";


                    ctx.fillRect(
                        px + 3,
                        py + 3,
                        BLOCK - 6,
                        4
                    );


                    /*
                       Small shine.
                    */

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
   DRAW NEXT PIECE
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
            120 -
            width
        ) / 2;


    const startY =
        (
            120 -
            height
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
                            nextPiece.colour
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
   MOVE LEFT / RIGHT
===================================================== */

function move(
    direction
) {

    if (
        !gameRunning ||
        paused ||
        !currentPiece
    ) {

        return;

    }


    currentPiece.x +=
        direction;


    if (
        collision()
    ) {

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


    if (
        collision()
    ) {

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


    while (
        !collision()
    ) {

        currentPiece.y++;

    }


    currentPiece.y--;


    lockPiece();


    draw();

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
       Normal position.
    */

    if (
        !collision()
    ) {

        draw();

        return;

    }


    /*
       Try moving right.
    */

    currentPiece.x++;


    if (
        !collision()
    ) {

        draw();

        return;

    }


    /*
       Try moving left twice.
    */

    currentPiece.x -= 2;


    if (
        !collision()
    ) {

        draw();

        return;

    }


    /*
       Rotation impossible.
       Restore everything.
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
       Convert the falling block
       into physical sand.
    */

    turnPieceIntoSand();


    /*
       Immediately check whether
       this created a same-colour
       connection.
    */

    checkSandConnections();


    /*
       Spawn the next falling piece.
    */

    spawnPiece();


    dropCounter = 0;


    draw();

}


/* =====================================================
   UPDATE UI
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

function update(
    time = 0
) {

    if (
        !gameRunning
    ) {

        return;

    }


    const delta =
        time -
        lastTime;


    lastTime =
        time;


    if (!paused) {

        dropCounter +=
            delta;


        /*
           Automatic falling.
        */

        if (
            dropCounter >=
            dropInterval
        ) {

            softDrop();

        }


        /*
           Sand physics.

           Lightweight.
        */

        simulateSand();


        /*
           Occasionally check for
           connections created by
           falling sand.

           We also check immediately
           when a piece lands.
        */

        if (
            Math.random() < 0.06
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
   START GAME
===================================================== */

function startGame() {

    clearSand();


    currentPiece =
        null;


    nextPiece =
        null;


    score = 0;

    lines = 0;

    level = 1;


    dropInterval =
        800;


    dropCounter =
        0;


    gameRunning =
        true;


    paused =
        false;


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

    if (
        !gameRunning
    ) {

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

    }

    else {

        hideOverlay();

        lastTime =
            performance.now();

    }

}


/* =====================================================
   RESTART
===================================================== */

function restartGame() {

    if (
        bgMusic
    ) {

        bgMusic.currentTime = 0;

    }


    startGame();

}


/* =====================================================
   GAME OVER
===================================================== */

function gameOver() {

    gameRunning =
        false;


    playSound(
        gameOverSound
    );


    if (
        bgMusic
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


if (
    mainOverlayButton
) {

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

            }

            else {

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


if (
    pauseButton
) {

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


if (
    restartButton
) {

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


if (
    backButton
) {

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

        /*
           LEFT
        */

        if (
            event.key ===
            "ArrowLeft"
        ) {

            event.preventDefault();

            move(-1);

            return;

        }


        /*
           RIGHT
        */

        if (
            event.key ===
            "ArrowRight"
        ) {

            event.preventDefault();

            move(1);

            return;

        }


        /*
           DOWN
        */

        if (
            event.key ===
            "ArrowDown"
        ) {

            event.preventDefault();

            softDrop();

            return;

        }


        /*
           UP / ROTATE
        */

        if (
            event.key ===
            "ArrowUp"
        ) {

            event.preventDefault();

            rotatePiece();

            return;

        }


        /*
           SPACE / HARD DROP
        */

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            hardDrop();

            return;

        }


        /*
           P / PAUSE
        */

        if (
            event.key.toLowerCase() ===
            "p"
        ) {

            event.preventDefault();

            pauseGame();

        }

    }
);


/* =====================================================
   MOBILE LEFT
===================================================== */

const leftButton =
    document.getElementById(
        "leftButton"
    );


if (
    leftButton
) {

    leftButton.addEventListener(
        "click",
        () => {

            move(-1);

        }
    );

}


/* =====================================================
   MOBILE RIGHT
===================================================== */

const rightButton =
    document.getElementById(
        "rightButton"
    );


if (
    rightButton
) {

    rightButton.addEventListener(
        "click",
        () => {

            move(1);

        }
    );

}


/* =====================================================
   MOBILE ROTATE
===================================================== */

const rotateButton =
    document.getElementById(
        "rotateButton"
    );


if (
    rotateButton
) {

    rotateButton.addEventListener(
        "click",
        rotatePiece
    );

}


/* =====================================================
   MOBILE DOWN
===================================================== */

const downButton =
    document.getElementById(
        "downButton"
    );


if (
    downButton
) {

    downButton.addEventListener(
        "click",
        softDrop
    );

}


/* =====================================================
   MOBILE HARD DROP
===================================================== */

const dropButton =
    document.getElementById(
        "dropButton"
    );


if (
    dropButton
) {

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
