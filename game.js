<!-- 🧠 game.js                    -->
<!-- ============================== -->
<script>
// =====================
// Game JavaScript Code
// =====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const jumpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const hitSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const coinSound = new Audio("https://actions.google.com/sounds/v1/cartoon/bling.ogg");

const birdSkins = ["yellow", "red", "blue", "purple", "orange", "pink"];
let unlockedSkins = JSON.parse(localStorage.getItem("unlockedSkins")) || ["yellow"];
let selectedSkin = localStorage.getItem("selectedSkin") || "yellow";
let highScore = localStorage.getItem("highScore") || 0;
let coinBank = parseInt(localStorage.getItem("coinBank")) || 0;
document.getElementById("highScore").innerText = highScore;

let pipes = [], coins = [], clouds = [],
    score = 0, coinsCollected = 0,
    isGameOver = false, gameStarted = false,
    pipeGap = 150, pipeSpeed = 2;

const gravity = 0.5, flapPower = -10, pipeWidth = 60;

const bird = {
  x: 80,
  y: 200,
  width: 30,
  height: 30,
  velocity: 0,
  draw() {
    ctx.fillStyle = selectedSkin;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "black";
    ctx.beginPath(); ctx.arc(this.x + 22, this.y + 10, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + 20, this.y + 20, 3, 0, Math.PI); ctx.stroke();
  },
  update() {
    this.velocity += gravity;
    this.y += this.velocity;
  },
  flap() {
    this.velocity = flapPower;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
};

function createPipe() {
  const top = Math.floor(Math.random() * 200) + 50;
  pipes.push({ x: canvas.width, top, bottom: top + pipeGap });
  if (Math.random() < 0.6) {
    coins.push({ x: canvas.width + 20, y: top + pipeGap / 2, size: 15 });
  }
}

function createCloud() {
  clouds.push({ x: canvas.width, y: Math.random() * 200, speed: 0.5 + Math.random() });
}

function drawClouds() {
  ctx.fillStyle = "#ffffffaa";
  clouds.forEach(cloud => {
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateClouds() {
  clouds.forEach(cloud => cloud.x -= cloud.speed);
  clouds = clouds.filter(c => c.x + 40 > 0);
}

function drawPipes() {
  pipes.forEach(p => {
    let gradient = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
    gradient.addColorStop(0, "#32cd32");
    gradient.addColorStop(1, "#228b22");
    ctx.fillStyle = gradient;
    ctx.fillRect(p.x, 0, pipeWidth, p.top);
    ctx.fillRect(p.x, p.bottom, pipeWidth, canvas.height - p.bottom);
  });
}

function drawCoins() {
  ctx.fillStyle = "gold";
  coins.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateCoins() {
  coins.forEach((c, i) => {
    c.x -= pipeSpeed;
    if (
      bird.x < c.x + c.size &&
      bird.x + bird.width > c.x - c.size &&
      bird.y < c.y + c.size &&
      bird.y + bird.height > c.y - c.size
    ) {
      coinSound.play();
      coins.splice(i, 1);
      coinsCollected++;
    }
  });
  coins = coins.filter(c => c.x + c.size > 0);
}

function updatePipes() {
  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;
    if (pipe.x + pipeWidth === bird.x) score++;
    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > pipe.bottom)
    ) {
      hitSound.currentTime = 0;
      hitSound.play();
      isGameOver = true;
    }
  });
  pipes = pipes.filter(p => p.x + pipeWidth > 0);
  if (score >= 30) {
    pipeSpeed = 3.5;
    pipeGap = 110;
  }
}

function drawScore() {
  ctx.fillStyle = "#ff6347";
  ctx.font = "20px 'Fredoka One', cursive";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Coins: " + (coinBank + coinsCollected), 10, 55);
}

function resetGame() {
  pipes = [];
  coins = [];
  clouds = [];
  score = 0;
  coinsCollected = 0;
  pipeSpeed = 2;
  pipeGap = 150;
  bird.y = 200;
  bird.velocity = 0;
  isGameOver = false;
  gameStarted = true;
}

function gameLoop() {
  if (!gameStarted) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawClouds(); updateClouds();
  bird.update(); bird.draw();
  if (bird.y + bird.height > canvas.height || bird.y < 0) isGameOver = true;
  if (!isGameOver) {
    updatePipes(); drawPipes();
    updateCoins(); drawCoins();
    drawScore();
    requestAnimationFrame(gameLoop);
  } else {
    if (score > highScore) {
      localStorage.setItem("highScore", score);
      highScore = score;
    }
    coinBank += coinsCollected;
    localStorage.setItem("coinBank", coinBank);
    setTimeout(() => document.getElementById("startScreen").style.display = "flex", 1000);
    document.getElementById("highScore").innerText = highScore;
  }
}

function startGame() {
  document.getElementById("startScreen").style.display = "none";
  resetGame();
  gameLoop();
}

function toggleShop() {
  const shop = document.getElementById("shopScreen");
  const start = document.getElementById("startScreen");
  if (shop.style.display === "none") {
    shop.style.display = "flex";
    start.style.display = "none";
    renderShop();
  } else {
    shop.style.display = "none";
    start.style.display = "flex";
  }
}

function renderShop() {
  const skinList = document.getElementById("skinList");
  skinList.innerHTML = "";
  birdSkins.forEach(color => {
    const div = document.createElement("div");
    div.className = "skin-option";
    div.style.backgroundColor = color;
    if (!unlockedSkins.includes(color)) {
      div.innerHTML = '<span style="color:white;font-size:10px">5💰</span>';
    }
    div.onclick = () => {
      if (!unlockedSkins.includes(color)) {
        if (coinBank >= 5) {
          coinBank -= 5;
          unlockedSkins.push(color);
          localStorage.setItem("coinBank", coinBank);
          localStorage.setItem("unlockedSkins", JSON.stringify(unlockedSkins));
        } else {
          alert("Not enough coins!");
          return;
        }
      }
      selectedSkin = color;
      localStorage.setItem("selectedSkin", color);
      toggleShop();
    };
    skinList.appendChild(div);
  });
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    if (!isGameOver) bird.flap();
  }
});

document.addEventListener("click", () => {
  if (!isGameOver && gameStarted) bird.flap();
});

setInterval(() => {
  if (!isGameOver && gameStarted) createPipe();
}, 1500);

setInterval(() => {
  if (!isGameOver && gameStarted) createCloud();
}, 3000);
</script>
