const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const gridWidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;

const roomName = 'default';

const aspeed = document.getElementById('speed');

const socket = io();

class Snake {
    constructor(allowControl) {
        this.allowControl = allowControl;
        this.segments = [{
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight),
        }];

        this.speed = 5;
        this.speedRunning = 8;
        this.dx = 0;
        this.dy = 0;
        this.lastMove = { x: this.speed, y: 0, sp: 0 };
        this.score = 0;
        this.stamina = 100;
        this.consumeStamina = 15;
        this.deltaTime = 0;
        this.maxGab = 15;
        this.gab = this.maxGab;
        this.state = 0;
    }

    moveSnake() {
        const head = { x: this.segments[0].x + this.dx, y: this.segments[0].y + this.dy };
        this.segments.unshift(head);
        var rectWidth = (gridSize + this.score / 16) / gridSize;
        if (head.x < 0 - rectWidth) head.x = gridWidth - rectWidth;
        if (head.x >= gridWidth) head.x = 0;
        if (head.y < 0 - rectWidth) head.y = gridHeight - rectWidth;
        if (head.y >= gridHeight) head.y = 0;

        if (this.isSnakeCollided()) {
            // gameOver();
            return;
        } else {
            // this.segments.pop();

            if (foods.length > 0) {
                var eatFd = false;
                foods.forEach((food, index) => {
                    var foodRect = { x: food.x * gridSize, y: food.y * gridSize };
                    if (this.isCollision(foodRect)) {
                        eatFood(1, index);
                        foods.splice(index, 1);
                        this.score++;
                        eatFd = true;

                    }
                }
                );

                for (let playerId in players) {
                    players[playerId].segments.forEach((segment, index) => {
                        var segmentRect = { x: segment.x * gridSize, y: segment.y * gridSize };
                        if (this.isCollision(segmentRect) && playerId != socket.id) {
                            socket.emit("gameOver", { roomName: roomName, id: socket.id })
                            window.location.reload();
                            return;
                        }

                    });
                }

                if (!eatFd) {
                    this.segments.pop();
                }
            }

        }
    }

    drawSnake() {

        var startColor = [49, 87, 44];
        var endColor = [79, 119, 45];

        if (!this.allowControl) {
            startColor = [106, 4, 15];
            endColor = [208, 0, 0];
        }


        this.score = this.segments.length - 1;
        const size = gridSize + this.score / 16;

        const colorDiff = endColor.map((channel, index) => channel - startColor[index]);

        this.state = 0;

        this.segments.forEach((segment, index) => {

            const segmentColor = startColor.map((channel, i) => Math.floor(channel + (colorDiff[i] / this.segments.length) * index));
            const segmentColorCSS = `rgb(${segmentColor[0]}, ${segmentColor[1]}, ${segmentColor[2]})`;
            if (this.state > size-5 || index == 0 || index == this.segments.length - 1) {
                ctx.fillStyle = segmentColorCSS;
                this.state = 0;

                ctx.beginPath();
                ctx.arc(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                this.state++;
            }
        });
    }




    isSnakeCollided() {
        const head = this.segments[0];
        return this.segments.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
    }

    isCollision(rect2) {
        var circleCenterX = this.segments[0].x * gridSize + gridSize / 2;
        var circleCenterY = this.segments[0].y * gridSize + gridSize / 2;

        var rectWidth = gridSize + this.score / 16;
        var rectHeight = rectWidth;

        var rectX = circleCenterX - rectWidth / 2;
        var rectY = circleCenterY - rectHeight / 2;

        return rectX < rect2.x + gridSize &&
            rectX + rectWidth > rect2.x &&
            rectY < rect2.y + gridSize &&
            rectY + rectHeight > rect2.y;
    }


}

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    drawFood() {
        ctx.fillStyle = 'red';

        ctx.fillRect(this.x * gridSize, this.y * gridSize, gridSize, gridSize);
    }
}

function joinRoom() {
    socket.emit('joinRoom', roomName);
}

joinRoom();
var player;


socket.on('connect', () => {
    players[socket.id] = new Snake(true);
    player = players[socket.id];
}
);

function eatFood(arg, arg2) {
    socket.emit('eatFood', { roomName: roomName, quantity: arg, index: arg2 });
}

socket.on('addFood', (data) => {
    foods = []
    data.forEach((foodData) => {
        foods.push(new Food(foodData.x, foodData.y));
    });
}
);



var players = {};
var foods = [];

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

            let isRunning = gamepad.buttons[7].value;

            let magnitude = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
            dx = rawDx / magnitude;
            dy = rawDy / magnitude;
            if (!(Math.abs(rawDx) < 0.01 && Math.abs(rawDy) < 0.01)) {
                player.lastMove = {
                    x: dx * (player.speed + (player.speedRunning - player.speed) * isRunning),
                    y: dy * (player.speed + (player.speedRunning - player.speed) * isRunning),
                    sp: isRunning
                };
            }
        }
    }, 100);
});

socket.on('disconnect', () => {
    delete players[socket.id];
}
);

socket.on('updatePosition', (positions) => {
    if (positions.id === socket.id) {
        return;
    }
    if (!players[positions.id]) {
        players[positions.id] = new Snake(false);
    }
    players[positions.id].segments = positions.positions;
});

socket.on('move', (data) => {
    if (player.allowControl) {
        player.dx = data.dx;
        player.dy = data.dy;
    }
});

function Position() {
    socket.emit('Position', { id: socket.id, positions: player.segments, roomName: roomName });
}


function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (player) {
        sX = player.lastMove.x;
        sY = player.lastMove.y;
        sp = player.lastMove.sp;
        aspeed.innerHTML = Math.round((player.speed + sp * (player.speedRunning - player.speed)) * player.deltaTime * 1000);
        player.dx = sX * player.deltaTime;
        player.dy = sY * player.deltaTime;

        player.moveSnake();
        player.drawSnake();
        Position();
    }




    for (let playerId in players) {
        if (playerId === socket.id) {
            continue;
        } else {
            players[playerId].drawSnake();

            console.log(players[playerId], playerId)

            var sig = players[playerId].lastMove;
            if (sig.x == 0 && sig.y == 0) {
                delete players[playerId];
            }
        }
    }

    if (foods.length > 0) {
        foods.forEach((food) => {

            food.drawFood();
        });
    }
}

socket.on('initSnake', (data) => {
    for (let playerId in data) {
        if (playerId === socket.id) {
            player.segments = data[playerId];
        } else {
            if (playerId != "snake" && !players[playerId]) {
                players[playerId] = new Snake(false);
            }
        }
    }
});

socket.on('gameOver', (data) => {
    console.log(data.id);
    if (data.id != socket.id) {
        delete players[data.id];
    }

});

var lastFrameTime = 0;

function gameLoop() {
    var currentTime = performance.now();
    var deltaTime = currentTime - lastFrameTime;

    if (player) {
        player.deltaTime = deltaTime / 1000;
    }

    update();
    lastFrameTime = currentTime;

    requestAnimationFrame(gameLoop);
}

eatFood(20, -1);
gameLoop();