/* =====================================================
   RAA'S TETRIS 2
   🌈 TINY COLOURFUL SAND EDITION
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

const COLS = 10;
const ROWS = 20;

const BLOCK = 30;


/* =====================================================
   TINY SAND SETTINGS
===================================================== */

const SAND_SIZE = 3;
const SAND_GAP = 1;

const PARTICLES_PER_BLOCK = 28;

const MAX_SAND_PARTICLES = 7000;

const SAND_GRAVITY = 0.18;
const SAND_MAX_SPEED = 2.8;

const SAND_WIDTH =
    Math.floor(canvas.width / (SAND_SIZE + SAND_GAP));

const SAND_HEIGHT =
    Math.floor(canvas.height / (SAND_SIZE + SAND_GAP));


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

bgMusic.volume = 0.45;
gameOverSound.volume = 0.7;
lineClearSound.volume = 0.65;

/* =====================================================
new
===================================================== */

let sandSpatialGrid = new Map();

function getSpatialKey(x, y) {

    const gx =
        Math.floor(x / 8);

    const gy =
        Math.floor(y / 8);

    return gx + "," + gy;

}


function rebuildSandSpatialGrid() {

    sandSpatialGrid.clear();


    for (
        const particle of sandParticles
    ) {

        const key =
            getSpatialKey(
                particle.x,
                particle.y
            );


        let bucket =
            sandSpatialGrid.get(key);


        if (!bucket) {

            bucket = [];

            sandSpatialGrid.set(
                key,
                bucket
            );

        }


        bucket.push(
            particle
        );

    }

}


function getNearbyParticles(
    particle
) {

    const results = [];

    const gx =
        Math.floor(
            particle.x / 8
        );

    const gy =
        Math.floor(
            particle.y / 8
        );


    for (
        let yy = -1;
        yy <= 1;
        yy++
    ) {

        for (
            let xx = -1;
            xx <= 1;
            xx++
        ) {

            const bucket =
                sandSpatialGrid.get(
                    (
                        gx + xx
                    ) +
                    "," +
                    (
                        gy + yy
                    )
                );


            if (bucket) {

                results.push(
                    ...bucket
                );

            }

        }

    }


    return results;

}


/* =====================================================
   SOUND BUTTON
===================================================== */

function updateSoundButton() {

    soundButton.textContent =
        soundEnabled ? "🔊" : "🔇";

    soundButton.setAttribute(
        "aria-label",
        soundEnabled
            ? "Mute sound"
            : "Turn sound on"
    );

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
    { once: true }
);

document.addEventListener(
    "touchstart",
    startMusic,
    { once: true }
);


/* =====================================================
   TETRIS PIECES
===================================================== */

const PIECES = [

    {
        name: "I",
        color: "#00d9ff",

        shape: [
            [1, 1, 1, 1]
        ]
    },

    {
        name: "O",
        color: "#ffe600",

        shape: [
            [1, 1],
            [1, 1]
        ]
    },

    {
        name: "T",
        color: "#b84cff",

        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "S",
        color: "#31e875",

        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },

    {
        name: "Z",
        color: "#ff477e",

        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },

    {
        name: "J",
        color: "#4f7cff",

        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },

    {
        name: "L",
        color: "#ff9d35",

        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    }

];


/* =====================================================
   COLOUR PALETTES
===================================================== */

const COLOR_PALETTES = {

    "#00d9ff": [
        "#00d9ff",
        "#20e4ff",
        "#63edff",
        "#00bfe8",
        "#8af5ff"
    ],

    "#ffe600": [
        "#ffe600",
        "#fff04a",
        "#ffd000",
        "#fff77a",
        "#ffea29"
    ],

    "#b84cff": [
        "#b84cff",
        "#c866ff",
        "#9f35ff",
        "#d891ff",
        "#a957ff"
    ],

    "#31e875": [
        "#31e875",
        "#53f28d",
        "#18c961",
        "#7affaa",
        "#28dc70"
    ],

    "#ff477e": [
        "#ff477e",
        "#ff6894",
        "#ff2f69",
        "#ff8aaa",
        "#e83268"
    ],

    "#4f7cff": [
        "#4f7cff",
        "#7097ff",
        "#3566e8",
        "#91adff",
        "#5278e8"
    ],

    "#ff9d35": [
        "#ff9d35",
        "#ffb45e",
        "#ff8618",
        "#ffd080",
        "#ff9b2f"
    ]

};


/* =====================================================
   GAME STATE
===================================================== */

let board = [];

let sandParticles = [];

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

let sandAccumulator = 0;

let animationID = null;


/* =====================================================
   CREATE TETRIS BOARD
===================================================== */

function createBoard() {

    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );

}


/* =====================================================
   RANDOM PIECE
===================================================== */

function randomPiece() {

    const template =
        PIECES[
            Math.floor(
                Math.random() * PIECES.length
            )
        ];

    return {

        name: template.name,

        color: template.color,

        shape: template.shape.map(
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
        nextPiece || randomPiece();

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
   GET RANDOM COLOUR
===================================================== */

function getParticleColour(baseColour) {

    const palette =
        COLOR_PALETTES[baseColour];

    if (!palette) {
        return baseColour;
    }

    return palette[
        Math.floor(
            Math.random() *
            palette.length
        )
    ];

}


/* =====================================================
   CREATE TINY SAND PARTICLES
===================================================== */

function createSandFromPiece() {

    currentPiece.shape.forEach(
        (row, localY) => {

            row.forEach(
                (value, localX) => {

                    if (!value) {
                        return;
                    }


                    const cellX =
                        (
                            currentPiece.x +
                            localX
                        ) * BLOCK;

                    const cellY =
                        (
                            currentPiece.y +
                            localY
                        ) * BLOCK;


                    /*
                       Create many tiny particles
                       inside this one Tetris cell.
                    */

                    for (
                        let i = 0;
                        i < PARTICLES_PER_BLOCK;
                        i++
                    ) {

                        const particle = {

                            x:
                                cellX +
                                Math.random() *
                                (BLOCK - SAND_SIZE),

                            y:
                                cellY +
                                Math.random() *
                                (BLOCK - SAND_SIZE),

                            vx:
                                (Math.random() - 0.5) *
                                0.5,

                            vy:
                                Math.random() *
                                0.5,

                            color:
                                getParticleColour(
                                    currentPiece.color
                                ),

                            size:
                                SAND_SIZE +
                                (
                                    Math.random() > 0.8
                                        ? 1
                                        : 0
                                ),

                            settled: false,

                            life:
                                Math.random()

                        };


                        sandParticles.push(
                            particle
                        );

                    }

                }
            );

        }
    );

}


/* =====================================================
   REMOVE OLD TETRIS CELL
===================================================== */

function clearPieceFromBoard() {

    /*
       The normal board is only used
       for collision while the piece
       is falling.

       Once it lands, the piece becomes
       particles instead.
    */

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
                boardY >= 0 &&
                boardY < ROWS &&
                boardX >= 0 &&
                boardX < COLS
            ) {

                board[boardY][boardX] =
                    null;

            }

        }

    }

}


/* =====================================================
   PARTICLE COLLISION
===================================================== */

function particleBlocked(
    particle,
    newX,
    newY
) {

    /*
       Floor
    */

    if (
        newY +
        particle.size >=
        canvas.height
    ) {

        return true;

    }


    /*
       Walls
    */

    if (
        newX < 0 ||
        newX +
        particle.size >
        canvas.width
    ) {

        return true;

    }


    /*
       Only check nearby particles.

       This is MUCH faster than checking
       every particle in the entire game.
    */

    const nearby =
        getNearbyParticles(
            particle
        );


    for (
        const other of nearby
    ) {

        if (
            other === particle
        ) {

            continue;

        }


        const dx =
            (
                other.x +
                other.size / 2
            ) -
            (
                newX +
                particle.size / 2
            );


        const dy =
            (
                other.y +
                other.size / 2
            ) -
            (
                newY +
                particle.size / 2
            );


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const minimumDistance =
            (
                other.size +
                particle.size
            ) * 0.48;


        if (
            distance <
            minimumDistance
        ) {

            return true;

        }

    }


    return false;

}

/* =====================================================
   UPDATE SAND PARTICLES
===================================================== */

function updateSand(deltaTime) {

    const dt =
        Math.min(
            deltaTime / 16.67,
            1.5
        );


    /*
       Rebuild the spatial grid once
       before moving particles.
    */

    rebuildSandSpatialGrid();


    /*
       Bottom particles first.
    */

    sandParticles.sort(
        (a, b) =>
            b.y - a.y
    );


    for (
        const particle of sandParticles
    ) {

        if (
            particle.settled
        ) {

            /*
               Occasionally wake particles
               so piles can still shift.
            */

            if (
                Math.random() < 0.006
            ) {

                particle.settled =
                    false;

            }
            else {

                continue;

            }

        }


        /*
           Gravity
        */

        particle.vy +=
            SAND_GRAVITY * dt;


        particle.vy =
            Math.min(
                particle.vy,
                SAND_MAX_SPEED
            );


        let moved = false;


        /*
           Move down
        */

        const downY =
            particle.y +
            particle.vy * dt;


        if (
            !particleBlocked(
                particle,
                particle.x,
                downY
            )
        ) {

            particle.y =
                downY;

            moved = true;

        }


        /*
           If blocked, slide diagonally.
        */

        if (!moved) {

            const directions =
                Math.random() > 0.5
                    ? [-1, 1]
                    : [1, -1];


            for (
                const direction
                of directions
            ) {

                const slideX =
                    particle.x +
                    direction *
                    2.2;


                const slideY =
                    particle.y +
                    1.5;


                if (
                    !particleBlocked(
                        particle,
                        slideX,
                        slideY
                    )
                ) {

                    particle.x =
                        slideX;

                    particle.y =
                        slideY;

                    particle.vy =
                        0.5;

                    moved = true;

                    break;

                }

            }

        }


        /*
           Nothing underneath?

           Let the grain settle.
        */

        if (!moved) {

            particle.vy = 0;

            particle.vx = 0;

            particle.settled = true;

        }


        /*
           Keep inside board.
        */

        if (
            particle.x < 0
        ) {

            particle.x = 0;

        }


        if (
            particle.x +
            particle.size >
            canvas.width
        ) {

            particle.x =
                canvas.width -
                particle.size;

        }

    }


    /*
       Safety limit.

       If something somehow creates too
       many particles, remove the oldest
       ones rather than freezing the browser.
    */

    if (
        sandParticles.length >
        MAX_SAND_PARTICLES
    ) {

        sandParticles =
            sandParticles.slice(
                sandParticles.length -
                MAX_SAND_PARTICLES
            );

    }

}

/* =====================================================
   SNAP PARTICLES TO ROWS FOR LINE CLEAR
===================================================== */

function buildSandRows() {

    const rowCounts =
        Array(
            ROWS
        ).fill(0);


    /*
       Each particle contributes to
       the tiny sand grid.
    */

    for (
        const particle of sandParticles
    ) {

        const row =
            Math.floor(
                particle.y /
                BLOCK
            );


        if (
            row >= 0 &&
            row < ROWS
        ) {

            rowCounts[row]++;

        }

    }


    return rowCounts;

}


/* =====================================================
   SAND LINE CLEAR
===================================================== */

function clearSandLines() {

    /*
       Instead of requiring exactly
       10 giant blocks, use a dense
       particle threshold.
    */

    const rowCounts =
        buildSandRows();


    const particleTarget =
        Math.floor(
            (
                canvas.width /
                (SAND_SIZE + SAND_GAP)
            ) * 0.78
        );


    let cleared = 0;


    for (
        let row = ROWS - 1;
        row >= 0;
        row--
    ) {

        if (
            rowCounts[row] <
            particleTarget
        ) {

            continue;

        }


        const top =
            row * BLOCK;


        const bottom =
            (row + 1) * BLOCK;


        /*
           Remove particles inside
           the completed row.
        */

        sandParticles =
            sandParticles.filter(
                particle => {

                    const particleCentre =
                        particle.y +
                        particle.size / 2;

                    return !(
                        particleCentre >= top &&
                        particleCentre < bottom
                    );

                }
            );


        /*
           Push everything above
           the deleted row downward.
        */

        for (
            const particle of sandParticles
        ) {

            if (
                particle.y <
                top
            ) {

                particle.y +=
                    BLOCK;

            }

        }


        cleared++;

        row++;

    }


    if (
        cleared === 0
    ) {

        return;

    }


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
            ) * 65
        );


    updateUI();


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


/* =====================================================
   MOVE PIECE
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
       IMPORTANT:

       No solid Tetris block is stored.

       The piece immediately becomes
       dozens of tiny colourful particles.
    */

    createSandFromPiece();


    clearPieceFromBoard();


    /*
       Start physics immediately.
    */

    updateSand(16);


    clearSandLines();


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
       Wall kick
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
       Very subtle grid.
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
       Draw slightly larger particles first.
    */

    for (
        const particle of sandParticles
    ) {

        ctx.fillStyle =
            particle.color;


        ctx.fillRect(
            Math.round(
                particle.x
            ),
            Math.round(
                particle.y
            ),
            particle.size,
            particle.size
        );

    }

}


/* =====================================================
   DRAW CURRENT TETRIS PIECE
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


                    /*
                       Main piece
                    */

                    ctx.fillStyle =
                        currentPiece.color;


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


                    /*
                       Border
                    */

                    ctx.strokeStyle =
                        "rgba(0,0,0,0.2)";


                    ctx.strokeRect(
                        px,
                        py,
                        BLOCK,
                        BLOCK
                    );

                }
            );

        }
    );

}


/* =====================================================
   DRAW
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
        shape[0].length * size;

    const height =
        shape.length * size;

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


                    const px =
                        startX +
                        x * size;

                    const py =
                        startY +
                        y * size;


                    nextCtx.fillStyle =
                        nextPiece.color;


                    nextCtx.fillRect(
                        px + 1,
                        py + 1,
                        size - 2,
                        size - 2
                    );


                    nextCtx.fillStyle =
                        "rgba(255,255,255,0.3)";


                    nextCtx.fillRect(
                        px + 3,
                        py + 3,
                        size - 6,
                        3
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
   LINE POPUP
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


    if (
        cleared === 1
    ) {

        text.textContent =
            "NICE! ✨";

    }

    else if (
        cleared === 2
    ) {

        text.textContent =
            "GREAT! 💖";

    }

    else if (
        cleared === 3
    ) {

        text.textContent =
            "AMAZING! 🌟";

    }

    else {

        text.textContent =
            "SAND TETRIS! 🌈";

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
           Tetris piece gravity
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
        */

        sandAccumulator +=
            deltaTime;


        if (
            sandAccumulator >= 16
        ) {

            updateSand(
                sandAccumulator
            );


            clearSandLines();


            sandAccumulator = 0;

        }


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


    sandParticles =
        [];


    score = 0;
    lines = 0;
    level = 1;


    dropInterval =
        800;


    dropCounter = 0;
    sandAccumulator = 0;


    nextPiece = null;


    gameRunning = true;
    paused = false;


    updateUI();


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


    animationID =
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


    bgMusic.pause();


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
   OVERLAY CANCEL
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
   INITIAL STATE
===================================================== */

board =
    createBoard();


sandParticles =
    [];


draw();


showOverlay(
    "Tetris 2",
    "Ready to play with sand?",
    "Start Game"
);
