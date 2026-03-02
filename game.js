const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

let score = 0;
let lives = 3;
let level = 1;
let highscore = localStorage.getItem("spaceHighscore") || 0;

document.getElementById("highscore").innerText = "Highscore: " + highscore;

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

let keys = {};
let bullets = [];
let enemies = [];
let explosions = [];

class Player {
    constructor() {
        this.width = 60;
        this.height = 60;
        this.x = 100;
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = 6;
    }

    draw() {
        ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    }

    update() {
        if (keys["ArrowUp"] || keys["w"]) this.y -= this.speed;
        if (keys["ArrowDown"] || keys["s"]) this.y += this.speed;
        if (keys["ArrowLeft"] || keys["a"]) this.x -= this.speed;
        if (keys["ArrowRight"] || keys["d"]) this.x += this.speed;

        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 4;
        this.speed = 8;
    }

    draw() {
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.speed;
    }
}

class Enemy {
    constructor() {
        this.width = 60;
        this.height = 60;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.speed = 2 + level * 0.5;
    }

    draw() {
        ctx.drawImage(enemyImg, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= this.speed;
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 30;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "orange";
        ctx.fill();
    }

    update() {
        this.radius += 2;
    }
}

const player = new Player();

function spawnEnemy() {
    enemies.push(new Enemy());
}

setInterval(spawnEnemy, 1500);

function updateUI() {
    document.getElementById("score").innerText = "Score: " + score;
    document.getElementById("lives").innerText = "Lives: " + lives;
    document.getElementById("level").innerText = "Level: " + level;
}

function detectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    bullets.forEach((bullet, i) => {
        bullet.update();
        bullet.draw();
        if (bullet.x > canvas.width) bullets.splice(i, 1);
    });

    enemies.forEach((enemy, ei) => {
        enemy.update();
        enemy.draw();

        if (enemy.x < 0) {
            enemies.splice(ei, 1);
            lives--;
        }

        bullets.forEach((bullet, bi) => {
            if (detectCollision(bullet, enemy)) {
                score += 100;
                explosions.push(new Explosion(enemy.x, enemy.y));
                bullets.splice(bi, 1);
                enemies.splice(ei, 1);
            }
        });

        if (detectCollision(player, enemy)) {
            lives--;
            enemies.splice(ei, 1);
        }
    });

    explosions.forEach((explosion, i) => {
        explosion.update();
        explosion.draw();
        if (explosion.radius > explosion.maxRadius)
            explosions.splice(i, 1);
    });

    if (score > level * 1000) level++;

    if (lives <= 0) {
        if (score > highscore) {
            localStorage.setItem("spaceHighscore", score);
        }
        alert("Game Over! Score: " + score);
        document.location.reload();
    }

    updateUI();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.key === " ") {
        bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2));
    }
});

document.addEventListener("keyup", e => {
    keys[e.key] = false;
});

gameLoop();
