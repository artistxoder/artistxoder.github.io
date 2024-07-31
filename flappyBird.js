const canvas = document.getElementById('gameCanvas');
const startButton = document.getElementById('startButton');
const ctx = canvas.getContext('2d');
let gameStarted = false;
let bird, pipes, frameCount, pipeWidth, pipeGap;

// Create and load the bird image
const birdImage = new Image();
birdImage.src = 'android_icon.png'; // Path to the image file

function initializeGame() {
    resizeCanvas(); // Resize canvas on initialization

    bird = {
        x: 50,
        y: canvas.height / 2,
        width: 40, // Adjust size according to the image
        height: 40, // Adjust size according to the image
        gravity: 0.3, // Reduced gravity for slower fall
        lift: -10, // Reduced lift for smoother flap
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

    pipes = [];
    pipeWidth = 50;
    pipeGap = 200; // Increased gap between pipes
    frameCount = 0;

    document.addEventListener('click', () => {
        if (gameStarted) {
            bird.flap();
        }
    });

    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const canvasWidth = window.innerWidth * 0.8; // Example: 80% of viewport width
    const canvasHeight = window.innerHeight * 0.8; // Example: 80% of viewport height
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

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
        pipe.x -= 1.5; // Reduced speed for pipes
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
    if (frameCount % 120 === 0) { // Reduced pipe frequency
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
}

startButton.addEventListener('click', startGame);

// Ensure the image is loaded before starting the game
birdImage.onload = () => {
    initializeGame();
};
