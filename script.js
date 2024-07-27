const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const birdImage = new Image();
birdImage.src = 'android_icon.png'; // Path to the image file

// Set up the canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    // Reset bird position after resizing
    bird.x = 50;
    bird.y = canvas.height / 2;
}

const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 40, // Adjust size according to the image
    height: 40, // Adjust size according to the image
    gravity: 0.6,
    lift: -15,
    velocity: 0,
    show() {
        ctx.drawImage(birdImage, this.x, this.y, this.width, this.height);
    },
    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;
        if (this.y > canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },
    flap() {
        this.velocity = this.lift;
    }
};

const pipes = [];
const pipeWidth = 20;
const pipeGap = 100;

function createPipe() {
    const topHeight = Math.random() * (canvas.height / 2);
    const bottomHeight = canvas.height - topHeight - pipeGap;
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomHeight: bottomHeight
    });
}

function drawPipes() {
    pipes.forEach(pipe => {
        ctx.fillStyle = 'green';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight);
        pipe.x -= 2;
    });
    if (pipes[0] && pipes[0].x < -pipeWidth) {
        pipes.shift();
    }
}

function collisionDetection() {
    for (let i = 0; i < pipes.length; i++) {
        if (bird.x + bird.width > pipes[i].x && bird.x < pipes[i].x + pipeWidth) {
            if (bird.y < pipes[i].topHeight || bird.y + bird.height > canvas.height - pipes[i].bottomHeight) {
                return true;
            }
        }
    }
    return false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bird.show();
    drawPipes();
}

function update() {
    bird.update();
    if (collisionDetection()) {
        alert('Game Over! Click "OK" to restart.');
        resetGame();
    }
    if (frameCount % 90 === 0) {
        createPipe();
    }
}

function gameLoop() {
    frameCount++;
    update();
    draw();
    if (gameStarted) {
        requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        canvas.style.display = 'block'; // Show canvas
        startButton.style.display = 'none'; // Hide start button
        initializeGame();
        gameLoop();
    }
}

function resetGame() {
    gameStarted = false;
    startButton.style.display = 'block'; // Show start button
    canvas.style.display = 'none'; // Hide canvas
    // Reset game state
    pipes.length = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
}

let frameCount = 0;
let gameStarted = false;
const startButton = document.getElementById('startButton');

// Ensure the image is loaded before starting the game
birdImage.onload = () => {
    resizeCanvas(); // Resize canvas on load
    initializeGame(); // Initialize game after image is loaded
};

function initializeGame() {
    // Initialize the game parameters and events
    document.addEventListener('click', () => {
        if (gameStarted) {
            bird.flap();
        }
    });
    window.addEventListener('resize', resizeCanvas);
}

startButton.addEventListener('click', startGame);
