const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const bestElement = document.getElementById('best');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayCopy = document.getElementById('overlayCopy');
const startButton = document.getElementById('startButton');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const keys = new Set();
const stars = Array.from({ length: 150 }, () => ({
  x: Math.random() * WIDTH,
  y: Math.random() * HEIGHT,
  size: Math.random() * 1.7 + 0.3,
  speed: Math.random() * 28 + 12,
  alpha: Math.random() * 0.7 + 0.2,
}));
const player = { x: WIDTH / 2, y: HEIGHT - 86, radius: 17, speed: 310, cooldown: 0, invulnerable: 0 };
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let score = 0;
let best = loadBest();
let lives = 3;
let spawnTimer = 0;
let elapsed = 0;
let running = false;
let paused = false;
let lastFrame = 0;

bestElement.textContent = String(best);

function loadBest() {
  try {
    return Number(localStorage.getItem('starfighter-best')) || 0;
  } catch (error) {
    console.warn('Could not read the STARFIGHTER best score:', error);
    return 0;
  }
}

function saveBest() {
  try {
    localStorage.setItem('starfighter-best', String(best));
  } catch (error) {
    console.warn('Could not save the STARFIGHTER best score:', error);
  }
}

function showOverlay(message, buttonLabel) {
  overlayCopy.textContent = message;
  startButton.textContent = buttonLabel;
  overlay.classList.add('visible');
}

function hideOverlay() {
  overlay.classList.remove('visible');
}

function startGame() {
  score = 0;
  lives = 3;
  elapsed = 0;
  spawnTimer = 0.35;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  particles = [];
  player.x = WIDTH / 2;
  player.y = HEIGHT - 86;
  player.cooldown = 0;
  player.invulnerable = 1.3;
  scoreElement.textContent = '0';
  livesElement.textContent = '3';
  keys.clear();
  running = true;
  paused = false;
  hideOverlay();
}

function endGame() {
  running = false;
  paused = false;
  keys.clear();
  showOverlay(`Mission over. You scored ${score.toLocaleString()} points.`, 'Fly again');
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  keys.clear();
  if (paused) showOverlay('Mission paused. Take a breath, pilot.', 'Resume mission');
  else hideOverlay();
}

function addExplosion(x, y, color, count = 14) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 150 + 35;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.random() * 0.45 + 0.3,
      maxLife: 0.75,
      size: Math.random() * 3 + 1,
      color,
    });
  }
}

function spawnEnemy() {
  const radius = Math.random() * 8 + 18;
  enemies.push({
    x: Math.random() * (WIDTH - radius * 2) + radius,
    y: -radius,
    radius,
    speed: Math.min(115 + elapsed * 2.8 + Math.random() * 55, 250),
    drift: (Math.random() - 0.5) * 90,
    fireTimer: Math.random() * 1.4 + 0.8,
    color: Math.random() > 0.5 ? '#ff6fae' : '#b08aff',
  });
}

function firePlayerShot() {
  bullets.push({ x: player.x - 7, y: player.y - 20, vy: -520, radius: 3 });
  bullets.push({ x: player.x + 7, y: player.y - 20, vy: -520, radius: 3 });
}

function fireEnemyShot(enemy) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  enemyBullets.push({
    x: enemy.x,
    y: enemy.y + enemy.radius,
    vx: (dx / length) * 190,
    vy: (dy / length) * 190,
    radius: 5,
  });
}

function update(delta) {
  elapsed += delta;
  for (const star of stars) {
    star.y += star.speed * delta;
    if (star.y > HEIGHT) {
      star.y = 0;
      star.x = Math.random() * WIDTH;
    }
  }

  const horizontal = Number(keys.has('ArrowRight') || keys.has('KeyD'))
    - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  const vertical = Number(keys.has('ArrowDown') || keys.has('KeyS'))
    - Number(keys.has('ArrowUp') || keys.has('KeyW'));
  const directionLength = Math.hypot(horizontal, vertical) || 1;
  player.x += (horizontal / directionLength) * player.speed * delta;
  player.y += (vertical / directionLength) * player.speed * delta;
  player.x = Math.max(25, Math.min(WIDTH - 25, player.x));
  player.y = Math.max(35, Math.min(HEIGHT - 35, player.y));
  player.cooldown = Math.max(0, player.cooldown - delta);
  player.invulnerable = Math.max(0, player.invulnerable - delta);
  if (keys.has('Space') && player.cooldown === 0) {
    firePlayerShot();
    player.cooldown = 0.19;
  }

  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(0.35, 1.05 - elapsed * 0.008) + Math.random() * 0.35;
  }

  for (const bullet of bullets) bullet.y += bullet.vy * delta;
  bullets = bullets.filter((bullet) => bullet.y > -20);

  for (const enemy of enemies) {
    enemy.y += enemy.speed * delta;
    enemy.x += Math.sin(elapsed * 1.8 + enemy.y * 0.01) * enemy.drift * delta;
    enemy.x = Math.max(enemy.radius, Math.min(WIDTH - enemy.radius, enemy.x));
    enemy.fireTimer -= delta;
    if (enemy.fireTimer <= 0 && enemy.y > 20 && enemy.y < HEIGHT - 120) {
      fireEnemyShot(enemy);
      enemy.fireTimer = Math.random() * 1.5 + 1.4;
    }
  }

  for (const bullet of enemyBullets) {
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
  }
  enemyBullets = enemyBullets.filter((bullet) =>
    bullet.y < HEIGHT + 20 && bullet.x > -20 && bullet.x < WIDTH + 20);

  for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
    const enemy = enemies[enemyIndex];
    const hitBulletIndex = bullets.findIndex((bullet) =>
      Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.radius + bullet.radius);
    if (hitBulletIndex !== -1) {
      bullets.splice(hitBulletIndex, 1);
      enemies.splice(enemyIndex, 1);
      addExplosion(enemy.x, enemy.y, enemy.color);
      score += 100;
      scoreElement.textContent = String(score);
      if (score > best) {
        best = score;
        bestElement.textContent = String(best);
        saveBest();
      }
      continue;
    }

    if (player.invulnerable === 0 && Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius * 0.7) {
      enemies.splice(enemyIndex, 1);
      damagePlayer(enemy.x, enemy.y);
    } else if (enemy.y > HEIGHT + enemy.radius) {
      enemies.splice(enemyIndex, 1);
      damagePlayer(enemy.x, HEIGHT - 18);
    }
  }

  if (player.invulnerable === 0) {
    const hitIndex = enemyBullets.findIndex((bullet) =>
      Math.hypot(bullet.x - player.x, bullet.y - player.y) < player.radius + bullet.radius);
    if (hitIndex !== -1) {
      const hit = enemyBullets.splice(hitIndex, 1)[0];
      damagePlayer(hit.x, hit.y);
    }
  }

  for (const particle of particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
  }
  particles = particles.filter((particle) => particle.life > 0);
}

function damagePlayer(x, y) {
  if (!running || player.invulnerable > 0) return;
  lives -= 1;
  livesElement.textContent = String(lives);
  player.invulnerable = 1.35;
  addExplosion(x, y, '#66f4ff', 18);
  if (lives <= 0) endGame();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#101632');
  gradient.addColorStop(0.55, '#0a1023');
  gradient.addColorStop(1, '#080b17');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH * 0.72, HEIGHT * 0.35, 8, WIDTH * 0.72, HEIGHT * 0.35, 390);
  glow.addColorStop(0, 'rgba(80, 68, 173, 0.2)');
  glow.addColorStop(1, 'rgba(80, 68, 173, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = '#d7e7ff';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

function drawShip(x, y, size, color, isPlayer = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowBlur = isPlayer ? 22 : 17;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (isPlayer) {
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, size * 0.82);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size * 0.7, size * 0.82);
  } else {
    ctx.moveTo(0, size);
    ctx.lineTo(size, -size * 0.6);
    ctx.lineTo(size * 0.44, -size * 0.35);
    ctx.lineTo(0, -size * 0.75);
    ctx.lineTo(-size * 0.44, -size * 0.35);
    ctx.lineTo(-size, -size * 0.6);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = isPlayer ? '#eaffff' : '#20122a';
  ctx.beginPath();
  ctx.ellipse(0, isPlayer ? -size * 0.08 : 0, size * 0.2, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (isPlayer) {
    ctx.fillStyle = '#ffcb75';
    ctx.globalAlpha = 0.65 + Math.random() * 0.35;
    ctx.beginPath();
    ctx.moveTo(-size * 0.23, size * 0.72);
    ctx.lineTo(0, size * 1.45);
    ctx.lineTo(size * 0.23, size * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function draw() {
  drawBackground();

  for (const bullet of bullets) {
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#66f4ff';
    ctx.fillStyle = '#b7fcff';
    ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 15);
  }
  ctx.shadowBlur = 0;

  for (const bullet of enemyBullets) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff6fae';
    ctx.fillStyle = '#ff9ac4';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  for (const enemy of enemies) drawShip(enemy.x, enemy.y, enemy.radius, enemy.color);
  if (player.invulnerable === 0 || Math.floor(performance.now() / 90) % 2 === 0) {
    drawShip(player.x, player.y, player.radius, '#66f4ff', true);
  }

  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function frame(timestamp) {
  const delta = Math.min((timestamp - (lastFrame || timestamp)) / 1000, 0.04);
  lastFrame = timestamp;
  if (running && !paused) update(delta);
  draw();
  requestAnimationFrame(frame);
}

const keyMap = {
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  w: 'KeyW',
  W: 'KeyW',
  a: 'KeyA',
  A: 'KeyA',
  s: 'KeyS',
  S: 'KeyS',
  d: 'KeyD',
  D: 'KeyD',
  ' ': 'Space',
};

window.addEventListener('keydown', (event) => {
  const code = keyMap[event.key] || event.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) event.preventDefault();
  if (event.key === 'Escape') {
    togglePause();
    return;
  }
  if (!running && ['Space', 'Enter'].includes(code)) {
    startGame();
    return;
  }
  if (running && !paused) keys.add(code);
  if (paused && ['Space', 'Enter'].includes(code)) togglePause();
});

window.addEventListener('keyup', (event) => {
  keys.delete(keyMap[event.key] || event.code);
});
window.addEventListener('blur', () => keys.clear());
startButton.addEventListener('click', () => {
  if (paused) togglePause();
  else startGame();
});

document.querySelectorAll('[data-control]').forEach((button) => {
  const controlCodes = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    fire: 'Space',
  };
  const control = controlCodes[button.dataset.control];
  const press = (event) => {
    event.preventDefault();
    if (!running) startGame();
    if (!paused && control) {
      button.setPointerCapture(event.pointerId);
      keys.add(control);
    }
  };
  const release = () => keys.delete(control);
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

requestAnimationFrame(frame);
