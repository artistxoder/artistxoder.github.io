// --- Get DOM Elements ---
// Note: We get the canvas here, but rely on the HTML script
// to handle button visibility and calling startGame/showMainMenu.
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    throw new Error("Game canvas not found!");
}
const ctx = canvas.getContext('2d');

// --- Game Constants & Configuration ---
const BIRD_WIDTH = 35;        // Adjust size as needed for your android_icon.png
const BIRD_HEIGHT = 35;
const BIRD_START_X = canvas.width / 4; // Start further left
const BIRD_START_Y = canvas.height / 2;
const GRAVITY = 0.4;          // Slightly increased gravity
const LIFT = -7;              // Negative value for upward force
const ROTATION_FACTOR = 0.08; // How much the bird tilts

const PIPE_WIDTH = 60;
const BASE_PIPE_GAP = 120;    // Base vertical gap between pipes
const PIPE_GAP_VARIATION = 40;// How much the gap can randomly vary (+/-)
const PIPE_SPAWN_RATE = 100;  // Lower number = pipes spawn more often (frames)
const INITIAL_PIPE_SPEED = 2;
const PIPE_SPEED_INCREASE = 0.001; // How much speed increases per frame
const PIPE_COLOR_TOP = '#00AA00'; // Darker green
const PIPE_COLOR_BOTTOM = '#00FF00'; // Lighter green (theme color)

const SCORE_FONT = 'bold 24px "Courier New", Courier, monospace';
const SCORE_COLOR = '#00FF00'; // Theme color
const GAMEOVER_FONT = 'bold 30px "Courier New", Courier, monospace';
const GAMEOVER_COLOR = '#FF0000'; // Red for game over
const GAMEOVER_SUB_FONT = '18px "Courier New", Courier, monospace';

// --- Game State Variables ---
let bird;
let pipes;
let frameCount;
let score;
let pipeSpeed;
let gameState = 'READY'; // 'READY', 'PLAYING', 'GAME_OVER'
let isBirdImageLoaded = false;
let particles; // For potential future particle effects
let screenShakeMagnitude = 0;

// --- Bird Image Loading ---
const birdImage = new Image();
birdImage.src = 'android_icon.png'; // Make sure this path is correct
birdImage.onload = () => {
    console.log("Bird image loaded.");
    isBirdImageLoaded = true;
    // Draw initial bird state or wait screen if needed
    drawReadyScreen();
};
birdImage.onerror = () => {
    console.error("Failed to load bird image!");
    // Optionally draw a placeholder if image fails
    isBirdImageLoaded = true; // Allow game to start with placeholder
};

// --- Bird Object ---
function createBird() {
    return {
        x: BIRD_START_X,
        y: BIRD_START_Y,
        width: BIRD_WIDTH,
        height: BIRD_HEIGHT,
        gravity: GRAVITY,
        lift: LIFT,
        velocity: 0,
        rotation: 0, // Angle in radians

        show() {
            if (!isBirdImageLoaded) { // Draw placeholder if image not loaded
                 ctx.fillStyle = 'yellow';
                 ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
                 return;
             }
            // Save context state
            ctx.save();
            // Translate context to the bird's center
            ctx.translate(this.x, this.y);
            // Rotate context
            ctx.rotate(this.rotation);
            // Draw the image centered horizontally and vertically
            ctx.drawImage(birdImage, -this.width / 2, -this.height / 2, this.width, this.height);
            // Restore context state
            ctx.restore();
        },

        update() {
            this.velocity += this.gravity;
            this.y += this.velocity;

            // Calculate rotation based on velocity (simple approach)
            // Limit rotation to avoid spinning too much
            this.rotation = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, this.velocity * ROTATION_FACTOR));

            // Keep bird within bounds (top/bottom collision)
            if (this.y >= canvas.height - this.height / 2) {
                this.y = canvas.height - this.height / 2;
                this.velocity = 0;
                this.rotation = 0; // Reset rotation when grounded
                triggerGameOver(); // Ground is lava!
            }
            if (this.y <= this.height / 2) {
                this.y = this.height / 2;
                this.velocity = 0; // Stop upward momentum at ceiling
            }
        },

        flap() {
            this.velocity = this.lift;
            // Optional: Add flap particles here
        }
    };
}

// --- Pipe Handling ---
function createPipe() {
    const gapVariation = (Math.random() * PIPE_GAP_VARIATION * 2) - PIPE_GAP_VARIATION;
    const currentPipeGap = BASE_PIPE_GAP + gapVariation;
    const minTopHeight = 40; // Minimum height for top pipe
    const maxTopHeight = canvas.height - currentPipeGap - minTopHeight;

    const topHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight + 1)) + minTopHeight;
    const bottomY = topHeight + currentPipeGap;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: bottomY,
        scored: false // Flag to ensure score increases only once
    });
}

function updatePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        // Check for scoring
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x - bird.width / 2) {
             score++;
             pipes[i].scored = true;
             // Optional: Play score sound
         }

        // Remove pipes that are off-screen
        if (pipes[i].x < -PIPE_WIDTH) {
            pipes.splice(i, 1);
        }
    }

    // Increase speed gradually
    pipeSpeed += PIPE_SPEED_INCREASE;
}

function drawPipes() {
    pipes.forEach(pipe => {
        // Create gradient for pipes
        const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        gradient.addColorStop(0, PIPE_COLOR_TOP);
        gradient.addColorStop(0.5, PIPE_COLOR_BOTTOM);
        gradient.addColorStop(1, PIPE_COLOR_TOP);
        ctx.fillStyle = gradient;

        // Draw top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        // Draw bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);

        // Add simple edge lines for definition
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
    });
}

// --- Collision Detection ---
function checkCollisions() {
    // Ground collision is handled in bird.update()

    // Pipe collision
    for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        // Basic bounding box collision check
        if (
            bird.x + bird.width / 2 > p.x && // Bird's right edge past pipe's left edge
            bird.x - bird.width / 2 < p.x + PIPE_WIDTH && // Bird's left edge before pipe's right edge
            (bird.y - bird.height / 2 < p.topHeight || // Bird's top edge hits top pipe
             bird.y + bird.height / 2 > p.bottomY)    // Bird's bottom edge hits bottom pipe
        ) {
             return true; // Collision detected
        }
    }
    return false; // No collision
}

// --- Screen Shake ---
function triggerScreenShake(magnitude = 5, duration = 10) { // Duration in frames
    screenShakeMagnitude = magnitude;
    let shakeTimer = duration;
    function reduceShake() {
        if (shakeTimer > 0) {
            screenShakeMagnitude *= 0.9; // Dampen shake
            shakeTimer--;
            requestAnimationFrame(reduceShake);
        } else {
            screenShakeMagnitude = 0;
        }
    }
    reduceShake();
}


// --- Drawing ---
function drawScore() {
    ctx.font = SCORE_FONT;
    ctx.fillStyle = SCORE_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
}

function drawReadyScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
     // Optional: Draw background
     if (isBirdImageLoaded) {
         bird = createBird(); // Create bird instance for initial display
         bird.show();
     }
     ctx.fillStyle = SCORE_COLOR;
     ctx.font = '20px "Courier New", Courier, monospace';
     ctx.textAlign = 'center';
     ctx.fillText('Click or Space to Start', canvas.width / 2, canvas.height / 2 + 50);
 }

function drawGameOverScreen() {
    ctx.fillStyle = GAMEOVER_COLOR;
    ctx.font = GAMEOVER_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = SCORE_COLOR;
    ctx.font = SCORE_FONT;
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = GAMEOVER_SUB_FONT;
    ctx.fillText('Click or Space to Return', canvas.width / 2, canvas.height / 2 + 60);
}

function draw() {
    // Apply screen shake offset
    const shakeX = (Math.random() - 0.5) * 2 * screenShakeMagnitude;
    const shakeY = (Math.random() - 0.5) * 2 * screenShakeMagnitude;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear canvas (respecting potential shake)
    ctx.clearRect(-shakeX, -shakeY, canvas.width + Math.abs(shakeX), canvas.height + Math.abs(shakeY));

    // --- Draw game elements based on state ---
    if (gameState === 'PLAYING' || gameState === 'GAME_OVER') {
        // Optional: Draw background image/gradient first
        drawPipes();
        bird.show();
        drawScore();
    }

    if (gameState === 'GAME_OVER') {
        drawGameOverScreen();
    }
     if (gameState === 'READY') {
         // Already drawn by the initial call or image load
     }

    ctx.restore(); // Remove shake translation
}

// --- Game Logic Update ---
function update() {
    bird.update();
    updatePipes();

    if (checkCollisions()) {
        triggerGameOver();
    }

    // Spawn pipes periodically
    if (frameCount % PIPE_SPAWN_RATE === 0) {
        createPipe();
    }
}

// --- Game Loop ---
function gameLoop() {
    if (gameState === 'PLAYING') {
        frameCount++;
        update();
    }

    draw(); // Draw regardless of state to show messages

    // Continue loop if playing or game over (to show message)
    if (gameState !== 'READY') {
        requestAnimationFrame(gameLoop);
    }
}

// --- Game State Management ---
function initializeGameInternals() {
    if (!isBirdImageLoaded) {
         console.warn("Image not loaded yet, cannot start game.");
         // Optionally display a loading message on canvas
         return;
     }
    console.log("Initializing game internals...");

    bird = createBird();
    pipes = [];
    particles = [];
    frameCount = 0;
    score = 0;
    pipeSpeed = INITIAL_PIPE_SPEED;
    gameState = 'PLAYING';

    // Clear any existing pipes/state visually
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Remove old listeners before adding new ones (prevents duplicates)
    document.removeEventListener('click', handleInput);
    document.removeEventListener('keydown', handleInput);

    // Add game input listeners
    document.addEventListener('click', handleInput);
    document.addEventListener('keydown', handleInput);

    // Start the loop
    gameLoop();
}

function triggerGameOver() {
    if (gameState === 'PLAYING') {
        console.log("Game Over Triggered!");
        gameState = 'GAME_OVER';
        triggerScreenShake(8, 15); // Shake screen on game over
        // Optional: Play game over sound
        // Remove game listeners? No, keep them to detect restart input.
    }
}

function resetAndShowMenu() {
    console.log("Resetting and showing menu...");
    gameState = 'READY';
    pipes = []; // Clear pipes immediately for redraw

    // Call the function defined in the HTML script
    if (typeof window.showMainMenu === 'function') {
        window.showMainMenu();
    } else {
        console.error('showMainMenu function not found. Cannot return to menu.');
        // Fallback: maybe just redraw the ready screen?
        drawReadyScreen();
    }
}

// --- Input Handling ---
function handleInput(event) {
    // Prevent spacebar from scrolling the page
    if (event.code === 'Space') {
        event.preventDefault();
    }

    // Actions based on game state
    if (gameState === 'PLAYING') {
        if (event.type === 'click' || (event.type === 'keydown' && event.code === 'Space')) {
            bird.flap();
        }
    } else if (gameState === 'GAME_OVER') {
         if (event.type === 'click' || (event.type === 'keydown' && event.code === 'Space')) {
             resetAndShowMenu();
         }
     }
     // Note: Starting the game (`READY` -> `PLAYING`) is handled by the `startGame` function
     // called from the HTML button, not directly here.
 }


// --- Expose startGame to the global scope ---
// The script in the HTML file will call this function.
window.startGame = initializeGameInternals;

// --- Initial Draw (if image loads quickly) ---
if (isBirdImageLoaded) {
     drawReadyScreen();
}

console.log("flappyBird.js loaded. Canvas dimensions:", canvas.width, "x", canvas.height);
