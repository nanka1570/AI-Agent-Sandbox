// ブロック崩し メインスクリプト

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 定数 ---
const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

const PADDLE_W = 100;
const PADDLE_H = 12;
const PADDLE_Y = CANVAS_H - 40;
const PADDLE_SPEED = 6;

const BALL_RADIUS = 8;
const BALL_BASE_SPEED = 4.5;

const BLOCK_COLS = 10;
const BLOCK_ROWS = 5;
const BLOCK_W = 52;
const BLOCK_H = 20;
const BLOCK_PADDING = 6;
const BLOCK_OFFSET_TOP = 60;
const BLOCK_OFFSET_LEFT = (CANVAS_W - (BLOCK_COLS * (BLOCK_W + BLOCK_PADDING) - BLOCK_PADDING)) / 2;

// ブロックの行ごとの色（上から順）
const BLOCK_COLORS = ['#e94560', '#ff6b35', '#f7c59f', '#4ecdc4', '#45b7d1'];
// 行ごとのスコア
const BLOCK_SCORES = [50, 40, 30, 20, 10];

// --- ゲーム状態 ---
let score = 0;
let lives = 3;
let level = 1;
let gameState = 'idle'; // 'idle' | 'playing' | 'paused' | 'gameover' | 'clear'

// --- オブジェクト ---
let paddle = {
  x: CANVAS_W / 2 - PADDLE_W / 2,
  y: PADDLE_Y,
  w: PADDLE_W,
  h: PADDLE_H,
};

let ball = {
  x: CANVAS_W / 2,
  y: PADDLE_Y - BALL_RADIUS - 2,
  vx: BALL_BASE_SPEED,
  vy: -BALL_BASE_SPEED,
  stuck: true, // パドルに貼り付いている状態
};

let blocks = [];

// --- 入力管理 ---
const keys = {};
let mouseX = null;

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  // スペースで発射
  if (e.key === ' ' && gameState === 'playing' && ball.stuck) {
    launchBall();
  }
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});
canvas.addEventListener('mouseleave', () => {
  mouseX = null;
});
canvas.addEventListener('click', () => {
  if (gameState === 'playing' && ball.stuck) launchBall();
});

document.getElementById('startBtn').addEventListener('click', () => {
  startGame();
});

// --- ブロック生成 ---
function createBlocks() {
  blocks = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      blocks.push({
        x: BLOCK_OFFSET_LEFT + col * (BLOCK_W + BLOCK_PADDING),
        y: BLOCK_OFFSET_TOP + row * (BLOCK_H + BLOCK_PADDING),
        w: BLOCK_W,
        h: BLOCK_H,
        color: BLOCK_COLORS[row],
        score: BLOCK_SCORES[row],
        alive: true,
      });
    }
  }
}

// --- ゲーム開始・リセット ---
function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  gameState = 'playing';
  document.getElementById('startBtn').textContent = 'リスタート';
  document.getElementById('message').textContent = 'スペース or クリックでボールを発射';
  createBlocks();
  resetBall();
  updateUI();
  requestAnimationFrame(gameLoop);
}

function resetBall() {
  ball.x = paddle.x + paddle.w / 2;
  ball.y = PADDLE_Y - BALL_RADIUS - 2;
  const speed = BALL_BASE_SPEED + (level - 1) * 0.5;
  ball.vx = speed * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = -speed;
  ball.stuck = true;
}

function launchBall() {
  ball.stuck = false;
  document.getElementById('message').textContent = '';
}

// --- UI更新 ---
function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('level').textContent = level;
}

// --- 更新処理 ---
function update() {
  if (gameState !== 'playing') return;

  // パドル移動（キーボード）
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    paddle.x = Math.max(0, paddle.x - PADDLE_SPEED);
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    paddle.x = Math.min(CANVAS_W - paddle.w, paddle.x + PADDLE_SPEED);
  }

  // パドル移動（マウス）
  if (mouseX !== null) {
    paddle.x = Math.max(0, Math.min(CANVAS_W - paddle.w, mouseX - paddle.w / 2));
  }

  // ボールがパドルに貼り付いているときは追従
  if (ball.stuck) {
    ball.x = paddle.x + paddle.w / 2;
    return;
  }

  // ボール移動
  ball.x += ball.vx;
  ball.y += ball.vy;

  // 左右壁
  if (ball.x - BALL_RADIUS <= 0) {
    ball.x = BALL_RADIUS;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + BALL_RADIUS >= CANVAS_W) {
    ball.x = CANVAS_W - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx);
  }

  // 上壁
  if (ball.y - BALL_RADIUS <= 0) {
    ball.y = BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
  }

  // パドルとの当たり判定
  if (
    ball.vy > 0 &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.y + BALL_RADIUS >= paddle.y &&
    ball.y - BALL_RADIUS <= paddle.y + paddle.h
  ) {
    // パドルの中心からの位置でvxを変える（角度変化）
    const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1〜1
    const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    ball.vx = hitPos * speed * 1.2;
    ball.vy = -Math.sqrt(Math.max(0, speed ** 2 - ball.vx ** 2));
    ball.y = paddle.y - BALL_RADIUS;
  }

  // 下に落ちた
  if (ball.y - BALL_RADIUS > CANVAS_H) {
    lives--;
    updateUI();
    if (lives <= 0) {
      gameState = 'gameover';
      document.getElementById('message').textContent = 'ゲームオーバー';
    } else {
      document.getElementById('message').textContent = 'スペース or クリックでボールを発射';
      resetBall();
    }
    return;
  }

  // ブロックとの当たり判定
  for (const block of blocks) {
    if (!block.alive) continue;
    if (circleRect(ball, block)) {
      block.alive = false;
      score += block.score;
      updateUI();
      reflectBall(ball, block);

      // 全ブロック破壊でクリア
      if (blocks.every(b => !b.alive)) {
        level++;
        updateUI();
        const allClear = level > 3;
        if (allClear) {
          gameState = 'clear';
          document.getElementById('message').textContent = `全ステージクリア！ 最終スコア: ${score}`;
        } else {
          document.getElementById('message').textContent = `レベル ${level} スタート！スペース or クリックで発射`;
          createBlocks();
          resetBall();
        }
      }
      break; // 1フレームで1ブロックのみ処理
    }
  }
}

// 円と矩形の当たり判定
function circleRect(ball, rect) {
  const nearX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
  const dx = ball.x - nearX;
  const dy = ball.y - nearY;
  return dx * dx + dy * dy <= BALL_RADIUS * BALL_RADIUS;
}

// ブロックに当たったときの反射方向を決める
function reflectBall(ball, rect) {
  const overlapLeft = (ball.x + BALL_RADIUS) - rect.x;
  const overlapRight = (rect.x + rect.w) - (ball.x - BALL_RADIUS);
  const overlapTop = (ball.y + BALL_RADIUS) - rect.y;
  const overlapBottom = (rect.y + rect.h) - (ball.y - BALL_RADIUS);

  const minH = Math.min(overlapLeft, overlapRight);
  const minV = Math.min(overlapTop, overlapBottom);

  if (minH < minV) {
    ball.vx *= -1;
  } else {
    ball.vy *= -1;
  }
}

// --- 描画処理 ---
function draw() {
  // 背景
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // グリッド風背景（装飾）
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  // ブロック
  for (const block of blocks) {
    if (!block.alive) continue;
    ctx.fillStyle = block.color;
    ctx.beginPath();
    ctx.roundRect(block.x, block.y, block.w, block.h, 4);
    ctx.fill();
    // ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(block.x + 2, block.y + 2, block.w - 4, 5, 2);
    ctx.fill();
  }

  // パドル
  const paddleGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
  paddleGrad.addColorStop(0, '#e94560');
  paddleGrad.addColorStop(1, '#c73652');
  ctx.fillStyle = paddleGrad;
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
  ctx.fill();

  // ボール
  const ballGrad = ctx.createRadialGradient(
    ball.x - 2, ball.y - 2, 1,
    ball.x, ball.y, BALL_RADIUS
  );
  ballGrad.addColorStop(0, '#ff6666');
  ballGrad.addColorStop(1, '#cc0000');
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // オーバーレイ（ゲームオーバー / クリア）
  if (gameState === 'gameover') {
    drawOverlay('GAME OVER', `スコア: ${score}`, '#e94560');
  } else if (gameState === 'clear') {
    drawOverlay('CONGRATULATIONS!', `最終スコア: ${score}`, '#4ecdc4');
  } else if (gameState === 'idle') {
    drawOverlay('ブロック崩し', 'スタートボタンを押してください', '#e94560');
  }
}

function drawOverlay(title, sub, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = color;
  ctx.font = 'bold 40px Segoe UI';
  ctx.textAlign = 'center';
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 20);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#eee';
  ctx.font = '20px Segoe UI';
  ctx.fillText(sub, CANVAS_W / 2, CANVAS_H / 2 + 24);
  ctx.textAlign = 'left';
}

// --- メインループ ---
let lastState = null;
function gameLoop() {
  update();
  draw();
  if (gameState === 'playing' || gameState !== lastState) {
    lastState = gameState;
    requestAnimationFrame(gameLoop);
  }
}

// --- 初期描画 ---
draw();
