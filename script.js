const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const gridSize = 20;
const gridWidth = canvasWidth / gridSize;
const gridHeight = canvasHeight / gridSize;

var score = 0;

let snake = [{ x: 10, y: 10 }];
let speed = 0.1;
let speedRunning = 0.15;
var lastMove = { x: 0, y: 0 };

let dx = speed;
let dy = 0;

window.addEventListener("gamepadconnected", function (e) {
    var gamepad = e.gamepad;

    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        gamepad.index, gamepad.id,
        gamepad.buttons.length, gamepad.axes.length);
    window.setInterval(function () {
        var gamepad = navigator.getGamepads()[0];
        if (gamepad) {
            let rawDx = gamepad.axes[0];
            let rawDy = gamepad.axes[1];

            let isRunning = gamepad.buttons[0].pressed;

            let magnitude = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
            dx = rawDx / magnitude;
            dy = rawDy / magnitude;

            console.log(dx, dy);

            if (Math.abs(rawDx) < 0.01 && Math.abs(rawDy) < 0.01) {
                dx = lastMove.x;
                dy = lastMove.y;
            } else {

                lastMove = { x: dx * speed, y: dy * speed};
                dx = dx * (isRunning ? speedRunning : speed);
                dy = dy * (isRunning ? speedRunning : speed);
            }
        }
    }, 100);
});

function drawSnake() {
    const startColor = [49, 87, 44];
    const endColor = [79, 119, 45];

    const endSize = gridSize / 2;
    const startSize = gridSize + score / 3;

    const colorDiff = endColor.map((channel, index) => channel - startColor[index]);

    snake.forEach((segment, index) => {
        const segmentColor = startColor.map((channel, i) => Math.floor(channel + (colorDiff[i] / snake.length) * index));
        const segmentSize = startSize + (endSize - startSize) / snake.length * index / 3;

        const segmentColorCSS = `rgb(${segmentColor[0]}, ${segmentColor[1]}, ${segmentColor[2]})`;

        ctx.fillStyle = segmentColorCSS;

        ctx.beginPath();
        ctx.arc(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, segmentSize / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}
function isCollision(rect1, rect2) {
    var sizeSnake = gridSize + score / 3;
    return rect1.x < rect2.x + gridSize &&
        rect1.x + sizeSnake > rect2.x &&
        rect1.y < rect2.y + gridSize &&
        rect1.y + sizeSnake > rect2.y;
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    const headRect = { x: head.x * gridSize, y: head.y * gridSize };
    const foodRect = { x: food.x * gridSize, y: food.y * gridSize };
    snake.unshift(head);

    if (head.x < 0) head.x = gridWidth - 1;
    if (head.x >= gridWidth) head.x = 0;
    if (head.y < 0) head.y = gridHeight - 1;
    if (head.y >= gridHeight) head.y = 0;

    if (isSnakeCollided()) {
        // gameOver();
    } else {
        score++
    }
}


function isSnakeCollided() {
    const head = snake[0];
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}

let food = { x: 15, y: 15 };
function generateFood() {
    food = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
    };
}

function drawFood() {
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

// Fonction principale de mise à jour du jeu
function update() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    moveSnake();
    drawSnake();
    drawFood();
}

// Lancer le jeu
function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

// Démarrer le jeu
generateFood();
gameLoop();
