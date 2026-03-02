const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

let score = 0;
let lives = 3;
let level = 1;
let highscore = localStorage.getItem("spaceHighscore") || 0;
document.getElementById("highscore").innerText = "Highscore: " + highscore;

let keys = {};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let explosions = [];
let stars = [];

const STAR_COUNT = 100;
for(let i=0;i<STAR_COUNT;i++){
    stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, speed: Math.random()*1+0.5, size: Math.random()*2+1});
}

// Spieler Icon
const playerImg = document.createElement("canvas");
playerImg.width = 60; playerImg.height = 60;
const pctx = playerImg.getContext("2d");
pctx.fillStyle="#00ffff";
pctx.beginPath();
pctx.moveTo(0,30); pctx.lineTo(50,10); pctx.lineTo(50,50); pctx.closePath();
pctx.fill();

// Gegner Icon
const enemyImg = document.createElement("canvas");
enemyImg.width = 60; enemyImg.height = 60;
const ectx = enemyImg.getContext("2d");
ectx.fillStyle="#ff0066";
ectx.fillRect(0,0,60,60);
ectx.fillStyle="black"; ectx.beginPath(); ectx.arc(20,25,6,0,Math.PI*2); ectx.fill();
ectx.beginPath(); ectx.arc(40,25,6,0,Math.PI*2); ectx.fill();
ectx.fillRect(15,40,30,8);

// Boss Icon
const bossImg = document.createElement("canvas");
bossImg.width=100; bossImg.height=100;
const bctx = bossImg.getContext("2d");
bctx.fillStyle="#ff00ff";
bctx.fillRect(0,0,100,100);
bctx.fillStyle="yellow"; bctx.fillRect(20,40,60,20);

class Player{
    constructor(){
        this.width=60; this.height=60;
        this.x=100; this.y=canvas.height/2 - this.height/2;
        this.speed=6;
    }
    draw(){ ctx.drawImage(playerImg,this.x,this.y,this.width,this.height); }
    update(){
        if(keys["ArrowUp"]||keys["w"]) this.y-=this.speed;
        if(keys["ArrowDown"]||keys["s"]) this.y+=this.speed;
        if(keys["ArrowLeft"]||keys["a"]) this.x-=this.speed;
        if(keys["ArrowRight"]||keys["d"]) this.x+=this.speed;
        this.x=Math.max(0,Math.min(canvas.width-this.width,this.x));
        this.y=Math.max(0,Math.min(canvas.height-this.height,this.y));
    }
}

class Bullet{
    constructor(x,y,speed=8,color="#00ffff"){ this.x=x; this.y=y; this.width=10; this.height=4; this.speed=speed; this.color=color;}
    draw(){ ctx.fillStyle=this.color; ctx.fillRect(this.x,this.y,this.width,this.height); }
    update(){ this.x+=this.speed; }
}

class Enemy{
    constructor(isBoss=false){
        this.width = isBoss ? 100 : 60;
        this.height = isBoss ? 100 : 60;
        this.x = canvas.width;
        this.y = Math.random()*(canvas.height-this.height);
        this.speed = 2 + level*0.5;
        this.isBoss = isBoss;
        this.health = isBoss ? 10+level*2 : 1;
        this.shootTimer = 0;
    }
    draw(){ ctx.drawImage(this.isBoss?bossImg:enemyImg,this.x,this.y,this.width,this.height);}
    update(){
        this.x -= this.speed;
        if(this.isBoss && Date.now()-this.shootTimer>800){
            enemyBullets.push(new Bullet(this.x,this.y+this.height/2,-6,"#ff00ff"));
            this.shootTimer=Date.now();
        }
    }
}

class Explosion{
    constructor(x,y){ this.x=x; this.y=y; this.radius=0; this.maxRadius=30;}
    draw(){ ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fillStyle="orange"; ctx.fill();}
    update(){ this.radius+=2; }
}

const player = new Player();

// spawn enemy
function spawnEnemy(){
    if(score>0 && score%1500===0){ // Boss alle 1500 Punkte
        enemies.push(new Enemy(true));
    }else{
        enemies.push(new Enemy());
    }
}
setInterval(spawnEnemy, 1500);

function updateUI(){
    document.getElementById("score").innerText="Score: "+score;
    document.getElementById("lives").innerText="Lives: "+lives;
    document.getElementById("level").innerText="Level: "+level;
}

function detectCollision(a,b){
    return a.x<a.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y;
}

function gameLoop(){
    // Hintergrund Sterne
    ctx.fillStyle="black"; ctx.fillRect(0,0,canvas.width,canvas.height);
    stars.forEach(star=>{
        star.x -= star.speed + level*0.2;
        if(star.x<0) star.x=canvas.width;
        ctx.fillStyle="white"; ctx.fillRect(star.x,star.y,star.size,star.size);
    });

    player.update(); player.draw();

    bullets.forEach((bullet,i)=>{
        bullet.update(); bullet.draw();
        if(bullet.x>canvas.width) bullets.splice(i,1);
    });

    enemyBullets.forEach((b,i)=>{
        b.update(); b.draw();
        if(b.x<0) enemyBullets.splice(i,1);
        if(detectCollision(b,player)){ lives--; enemyBullets.splice(i,1);}
    });

    enemies.forEach((enemy,ei)=>{
        enemy.update(); enemy.draw();

        if(enemy.x<0 && !enemy.isBoss){ enemies.splice(ei,1); lives--; }

        bullets.forEach((bullet,bi)=>{
            if(detectCollision(bullet,enemy)){
                enemy.health--;
                bullets.splice(bi,1);
                if(enemy.health<=0){
                    explosions.push(new Explosion(enemy.x,enemy.y));
                    if(enemy.isBoss){ lives++; } // Boss gibt Leben
                    score += enemy.isBoss?500:100;
                    enemies.splice(ei,1);
                }
            }
        });

        if(detectCollision(player,enemy)){
            lives--; enemies.splice(ei,1);
        }
    });

    explosions.forEach((exp,i)=>{
        exp.update(); exp.draw();
        if(exp.radius>exp.maxRadius) explosions.splice(i,1);
    });

    if(score>level*1000) level++;
    if(lives<=0){
        if(score>highscore) localStorage.setItem("spaceHighscore",score);
        alert("GAME OVER! Score: "+score);
        document.location.reload();
    }

    updateUI();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", e=>{
    keys[e.key]=true;
    if(e.key===" ") bullets.push(new Bullet(player.x+player.width,player.y+player.height/2));
});
document.addEventListener("keyup", e=>{ keys[e.key]=false; });

gameLoop();
