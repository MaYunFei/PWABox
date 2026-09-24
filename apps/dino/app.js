// ==========================================
// 断网小恐龙 (T-Rex Runner) 纯原生引擎
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const startBtn = document.getElementById('startBtn');
const scoreText = document.getElementById('scoreText');
const hiScoreText = document.getElementById('hiScoreText');
const speedBadge = document.getElementById('speedBadge');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');

// ==========================================
// Web Audio 工业级音效引擎（自解锁 + 防静音拦截）
// ==========================================
const SOUND_KEY = 'pwabox_dino_sound';
let audioCtx = null;
let soundEnabled = localStorage.getItem(SOUND_KEY) !== '0';

// 确保 AudioContext 在用户手势后处于激活状态
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 统一声调合成器（音量提升至清晰明亮的 0.2，避免底层异常）
function playTone(freq, duration, type = 'square', gainVal = 0.2) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    // 优雅的线性淡出，兼容所有移动端 WebKit 内核
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Audio play error:", e);
  }
}

// 经典跳跃声（清脆的上升滑音）
function playJumpSound() {
  playTone(450, 0.08, 'square', 0.18);
  setTimeout(() => playTone(700, 0.08, 'square', 0.18), 35);
}

// 百分得分声（标志性双音节哔哔）
function playScoreSound() {
  playTone(850, 0.1, 'square', 0.22);
  setTimeout(() => playTone(1100, 0.15, 'square', 0.22), 100);
}

// 撞击失败声（低沉断电杂音）
function playHitSound() {
  playTone(200, 0.18, 'sawtooth', 0.25);
  setTimeout(() => playTone(120, 0.22, 'sawtooth', 0.28), 70);
}

// 更新音效按钮状态
function updateSoundUI() {
  soundToggleBtn.innerHTML = `<i data-lucide="${soundEnabled ? 'volume-2' : 'volume-x'}" class="w-4 h-4 ${soundEnabled ? 'text-neutral-700 dark:text-neutral-200' : 'text-rose-500'}"></i>`;
  soundToggleBtn.title = soundEnabled ? '音效: 已开启 (点击静音)' : '音效: 已静音 (点击开启)';
  lucide.createIcons();
}

soundToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, soundEnabled ? '1' : '0');
  updateSoundUI();

  // ★ 如果切为开启，立刻播放一声提示音！既给用户确定感，又顺便解锁浏览器的 AudioContext
  if (soundEnabled) {
    getAudioContext();
    playTone(600, 0.08, 'square', 0.15);
  }
});

// 首屏立即同步音效图标状态
updateSoundUI();

// 游戏常量
const GROUND_Y = 240;
const INITIAL_SPEED = 6;
const MAX_SPEED = 14;
const GRAVITY = 0.65;
const JUMP_FORCE = -12.5;

let isPlaying = false;
let isGameOver = false;
let score = 0;
let hiScore = parseInt(localStorage.getItem('pwabox_dino_hi') || '0', 10);
let speed = INITIAL_SPEED;
let distance = 0;
let animationFrameId = null;
let lastHundred = 0;

// 街机生涯战绩系统
const STATS_KEY = 'pwabox_dino_career_stats';
function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { games: 0, jumps: 0, ducks: 0 };
  } catch (e) {
    return { games: 0, jumps: 0, ducks: 0 };
  }
}

let careerStats = getStats();

function updateStatsUI() {
  const statHiScore = document.getElementById('statHiScore');
  const statGames = document.getElementById('statGames');
  const statJumps = document.getElementById('statJumps');
  const statDucks = document.getElementById('statDucks');

  if (statHiScore) statHiScore.textContent = hiScore;
  if (statGames) statGames.textContent = careerStats.games;
  if (statJumps) statJumps.textContent = careerStats.jumps;
  if (statDucks) statDucks.textContent = careerStats.ducks;
}

function saveStats() {
  localStorage.setItem(STATS_KEY, JSON.stringify(careerStats));
  updateStatsUI();
}

updateStatsUI();

const resetStatsBtn = document.getElementById('resetStatsBtn');
if (resetStatsBtn) {
  resetStatsBtn.addEventListener('click', () => {
    if (confirm('确定清空街机生涯数据与最高分吗？')) {
      careerStats = { games: 0, jumps: 0, ducks: 0 };
      hiScore = 0;
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem('pwabox_dino_hi');
      hiScoreText.textContent = 'HI 00000';
      updateStatsUI();
    }
  });
}

// 恐龙对象
const dino = {
  x: 50,
  y: GROUND_Y - 44,
  width: 44,
  height: 48,
  vy: 0,
  isJumping: false,
  isDucking: false,
  legTimer: 0,
  legFrame: 0,

  reset() {
    this.x = 50;
    this.y = GROUND_Y - 44;
    this.vy = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.width = 44;
    this.height = 48;
  },

  jump() {
    if (!this.isJumping && isPlaying && !isGameOver) {
      getAudioContext();
      this.vy = JUMP_FORCE;
      this.isJumping = true;
      careerStats.jumps++;
      saveStats();
      playJumpSound();
    }
  },

  duck(state) {
    if (this.isJumping) return;
    if (state && !this.isDucking && isPlaying) {
      careerStats.ducks++;
      saveStats();
    }
    this.isDucking = state;
    if (state) {
      this.height = 28;
      this.y = GROUND_Y - 28;
      this.width = 56;
    } else {
      this.height = 48;
      this.y = GROUND_Y - 48;
      this.width = 44;
    }
  },

  update() {
    if (this.isJumping) {
      this.y += this.vy;
      this.vy += GRAVITY;

      if (this.y >= GROUND_Y - (this.isDucking ? 28 : 48)) {
        this.y = GROUND_Y - (this.isDucking ? 28 : 48);
        this.vy = 0;
        this.isJumping = false;
      }
    } else {
      this.legTimer++;
      if (this.legTimer > 6) {
        this.legFrame = this.legFrame === 0 ? 1 : 0;
        this.legTimer = 0;
      }
    }
  },

  draw(color) {
    ctx.fillStyle = color;
    const x = this.x;
    const y = this.y;

    if (this.isDucking) {
      // 俯身低姿态像素恐龙
      ctx.fillRect(x + 12, y + 6, 32, 14); // 身体躯干
      ctx.fillRect(x + 40, y + 2, 16, 12); // 头伸向前
      ctx.fillRect(x, y + 10, 14, 8);      // 尾巴
      // 眼睛
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#fafafa';
      ctx.fillRect(x + 46, y + 4, 3, 3);
      ctx.fillStyle = color;
      // 腿
      if (this.legFrame === 0) {
        ctx.fillRect(x + 22, y + 20, 6, 8);
        ctx.fillRect(x + 34, y + 20, 6, 6);
      } else {
        ctx.fillRect(x + 22, y + 20, 6, 6);
        ctx.fillRect(x + 34, y + 20, 6, 8);
      }
      return;
    }

    // 正常站立 / 跳跃像素恐龙
    // 头部
    ctx.fillRect(x + 22, y, 20, 18);
    // 嘴巴开口
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#fafafa';
    ctx.fillRect(x + 22, y + 12, 12, 3);
    // 眼睛 (撞毁显示 X，平时为单方块)
    if (isGameOver) {
      ctx.fillRect(x + 30, y + 4, 2, 6);
      ctx.fillRect(x + 28, y + 6, 6, 2);
    } else {
      ctx.fillRect(x + 28, y + 4, 4, 4);
    }
    ctx.fillStyle = color;

    // 身体躯干
    ctx.fillRect(x + 14, y + 18, 20, 16);
    // 尾巴
    ctx.fillRect(x, y + 20, 16, 10);
    ctx.fillRect(x + 4, y + 16, 12, 6);
    // 手臂小爪子
    ctx.fillRect(x + 30, y + 22, 6, 4);

    // 腿部动画
    if (this.isJumping) {
      // 跃起时双腿收起
      ctx.fillRect(x + 18, y + 34, 4, 10);
      ctx.fillRect(x + 26, y + 34, 4, 10);
    } else {
      // 奔跑交替摆动
      if (this.legFrame === 0) {
        ctx.fillRect(x + 16, y + 34, 4, 14);
        ctx.fillRect(x + 16, y + 46, 6, 2);
        ctx.fillRect(x + 26, y + 34, 4, 8);
      } else {
        ctx.fillRect(x + 16, y + 34, 4, 8);
        ctx.fillRect(x + 26, y + 34, 4, 14);
        ctx.fillRect(x + 26, y + 46, 6, 2);
      }
    }
  }
};

// 障碍物管理
let obstacles = [];
let spawnTimer = 0;

class Cactus {
  constructor(x, type) {
    this.x = x;
    this.type = type; // 0: 单小, 1: 双小, 2: 单大
    if (type === 0) {
      this.width = 16;
      this.height = 36;
    } else if (type === 1) {
      this.width = 34;
      this.height = 36;
    } else {
      this.width = 24;
      this.height = 48;
    }
    this.y = GROUND_Y - this.height;
    this.passed = false;
  }

  update() {
    this.x -= speed;
  }

  draw(color) {
    ctx.fillStyle = color;
    if (this.type === 0) {
      // 单株小仙人掌
      ctx.fillRect(this.x + 5, this.y, 6, this.height);
      ctx.fillRect(this.x, this.y + 10, 5, 14);
      ctx.fillRect(this.x, this.y + 10, 8, 4);
      ctx.fillRect(this.x + 11, this.y + 14, 5, 12);
      ctx.fillRect(this.x + 8, this.y + 22, 8, 4);
    } else if (this.type === 1) {
      // 双株并排小仙人掌
      ctx.fillRect(this.x + 4, this.y + 4, 6, 32);
      ctx.fillRect(this.x, this.y + 14, 5, 10);
      ctx.fillRect(this.x + 18, this.y, 6, 36);
      ctx.fillRect(this.x + 24, this.y + 12, 6, 12);
    } else {
      // 大仙人掌
      ctx.fillRect(this.x + 8, this.y, 8, this.height);
      ctx.fillRect(this.x, this.y + 14, 8, 18);
      ctx.fillRect(this.x, this.y + 14, 12, 6);
      ctx.fillRect(this.x + 16, this.y + 18, 8, 16);
      ctx.fillRect(this.x + 12, this.y + 28, 12, 6);
    }
  }
}

class Pterodactyl {
  constructor(x, heightLevel) {
    this.x = x;
    this.width = 46;
    this.height = 30;
    // 0: 低空(需跳过), 1: 中空(需下蹲滑过)
    this.y = heightLevel === 0 ? GROUND_Y - 32 : GROUND_Y - 60;
    this.wingFrame = 0;
    this.wingTimer = 0;
  }

  update() {
    this.x -= (speed + 1.2);
    this.wingTimer++;
    if (this.wingTimer > 10) {
      this.wingFrame = this.wingFrame === 0 ? 1 : 0;
      this.wingTimer = 0;
    }
  }

  draw(color) {
    ctx.fillStyle = color;
    const x = this.x;
    const y = this.y;

    // 翼龙尖嘴与身体
    ctx.fillRect(x + 16, y + 10, 18, 8);
    ctx.fillRect(x, y + 12, 16, 4); // 尖喙长嘴
    ctx.fillRect(x + 34, y + 12, 12, 4); // 尾翼

    // 扑翼动作
    if (this.wingFrame === 0) {
      // 翼向上
      ctx.fillRect(x + 18, y, 6, 12);
      ctx.fillRect(x + 24, y + 4, 8, 8);
    } else {
      // 翼向下
      ctx.fillRect(x + 18, y + 16, 6, 12);
      ctx.fillRect(x + 24, y + 16, 8, 8);
    }
  }
}

// 装饰背景：地面颗粒与星空/云朵
let groundOffset = 0;
const starsOrClouds = [
  { x: 150, y: 50, size: 2 },
  { x: 380, y: 70, size: 3 },
  { x: 620, y: 40, size: 2 },
  { x: 790, y: 80, size: 2.5 }
];

function updateBackground() {
  groundOffset = (groundOffset + speed) % 24;
  starsOrClouds.forEach(sc => {
    sc.x -= speed * 0.2;
    if (sc.x < -40) sc.x = 840;
  });
}

function drawBackground(lineColor, decorColor) {
  // 地面主水平线
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(800, GROUND_Y);
  ctx.stroke();

  // 地面虚线与小石子
  ctx.fillStyle = decorColor;
  for (let x = -groundOffset; x < 800; x += 24) {
    if ((x + groundOffset) % 48 === 0) {
      ctx.fillRect(x, GROUND_Y + 4, 8, 2);
      ctx.fillRect(x + 12, GROUND_Y + 8, 4, 2);
    }
  }

  // 浅色云朵 / 深色小星星
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    // 深色月亮
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(720, 50, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(714, 46, 14, 0, Math.PI * 2);
    ctx.fill();

    // 闪烁星星
    ctx.fillStyle = '#94a3b8';
    starsOrClouds.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
  } else {
    // 浅色蓬松云朵
    ctx.fillStyle = '#cbd5e1';
    starsOrClouds.forEach(c => {
      ctx.fillRect(c.x, c.y, 34, 10);
      ctx.fillRect(c.x + 8, c.y - 6, 18, 6);
    });
  }
}

// 碰撞检测（采用微收缩矩形保障良好手感）
function checkCollision(dino, obs) {
  const pad = 6;
  return (
    dino.x + pad < obs.x + obs.width - pad &&
    dino.x + dino.width - pad > obs.x + pad &&
    dino.y + pad < obs.y + obs.height - pad &&
    dino.y + dino.height > obs.y + pad
  );
}

// 主游戏循环
function gameLoop() {
  if (!isPlaying) return;

  const isDark = document.documentElement.classList.contains('dark');
  const mainColor = isDark ? '#f3f4f6' : '#1f2937';
  const lineColor = isDark ? '#374151' : '#d1d5db';
  const decorColor = isDark ? '#4b5563' : '#9ca3af';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateBackground();
  drawBackground(lineColor, decorColor);

  dino.update();
  dino.draw(mainColor);

  // 生成障碍物
  spawnTimer += speed;
  if (spawnTimer > 480) {
    const r = Math.random();
    if (r > 0.8 && score > 250) {
      // 翼龙
      obstacles.push(new Pterodactyl(820, Math.random() > 0.5 ? 0 : 1));
    } else {
      // 仙人掌
      const type = Math.floor(Math.random() * 3);
      obstacles.push(new Cactus(820, type));
    }
    spawnTimer = Math.floor(Math.random() * 120);
  }

  // 移动与绘制障碍物
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.update();
    obs.draw(mainColor);

    if (checkCollision(dino, obs)) {
      gameOver();
      return;
    }

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // 计分推进
  distance += speed * 0.08;
  score = Math.floor(distance);
  const scoreStr = String(score).padStart(5, '0');
  scoreText.textContent = scoreStr;

  // 整百报喜音效
  if (score > 0 && score % 100 === 0 && score !== lastHundred) {
    lastHundred = score;
    playScoreSound();
  }

  // 随距离平滑加速
  speed = Math.min(INITIAL_SPEED + (score / 350) * 0.8, MAX_SPEED);
  speedBadge.textContent = `${(speed / INITIAL_SPEED).toFixed(1)}x 速度`;

  animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
  getAudioContext();
  careerStats.games++;
  saveStats();
  isGameOver = false;
  isPlaying = true;
  score = 0;
  distance = 0;
  lastHundred = 0;
  speed = INITIAL_SPEED;
  obstacles = [];
  spawnTimer = 200;
  dino.reset();

  overlay.classList.add('opacity-0', 'pointer-events-none');
  scoreText.textContent = '00000';
  speedBadge.textContent = '1.0x 速度';

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
  isPlaying = false;
  isGameOver = true;
  playHitSound();

  if (score > hiScore) {
    const isNewRecord = hiScore > 0;
    hiScore = score;
    localStorage.setItem('pwabox_dino_hi', hiScore);
    hiScoreText.textContent = `HI ${String(hiScore).padStart(5, '0')}`;
    const statHiScore = document.getElementById('statHiScore');
    if (statHiScore) statHiScore.textContent = hiScore;
    if (isNewRecord && typeof confetti === 'function') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  }

  overlayTitle.textContent = `💥 GAME OVER (${score} 分)`;
  startBtn.textContent = '再玩一次';
  overlay.classList.remove('opacity-0', 'pointer-events-none');

  // 重新绘制一帧让撞击状态显现
  const isDark = document.documentElement.classList.contains('dark');
  dino.draw(isDark ? '#f3f4f6' : '#1f2937');
}

// 交互按键监听（键盘）
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
    e.preventDefault();
    if (!isPlaying) startGame(); else dino.jump();
  } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
    e.preventDefault();
    if (isPlaying) dino.duck(true);
  }
});

window.addEventListener('keyup', (e) => {
  if (['ArrowDown', 'KeyS'].includes(e.code)) {
    dino.duck(false);
  }
});

// 触屏与点击支持（画布直接点击起跳）
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!isPlaying) startGame(); else dino.jump();
});

// 📱 移动端专属大按钮操控（带物理触控震动反馈）
const mobileJumpBtn = document.getElementById('mobileJumpBtn');
const mobileDuckBtn = document.getElementById('mobileDuckBtn');

function triggerHaptic(duration = 15) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(duration); } catch (e) {}
  }
}

if (mobileJumpBtn) {
  mobileJumpBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    triggerHaptic(20);
    if (!isPlaying) startGame(); else dino.jump();
  });
}

if (mobileDuckBtn) {
  mobileDuckBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    triggerHaptic(15);
    if (isPlaying) dino.duck(true);
  });
  const releaseDuck = (e) => {
    e.preventDefault();
    dino.duck(false);
  };
  mobileDuckBtn.addEventListener('pointerup', releaseDuck);
  mobileDuckBtn.addEventListener('pointercancel', releaseDuck);
  mobileDuckBtn.addEventListener('pointerleave', releaseDuck);
}

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

// 初始化最高分
hiScoreText.textContent = `HI ${String(hiScore).padStart(5, '0')}`;

// ==========================================
// 独立深浅色外观控制（全局联动 + 独立覆盖）
// ==========================================
const LOCAL_THEME_KEY = 'pwabox_dino_theme';
const GLOBAL_THEME_KEY = 'pwabox_theme_global';
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeMenu = document.getElementById('themeMenu');

function getActiveThemeMode() {
  return localStorage.getItem(LOCAL_THEME_KEY) || localStorage.getItem(GLOBAL_THEME_KEY) || 'system';
}

function setThemeMode(mode) {
  localStorage.setItem(LOCAL_THEME_KEY, mode);
  applyTheme();
  themeMenu.classList.add('hidden');
}

function applyTheme() {
  const mode = getActiveThemeMode();
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  document.documentElement.classList.toggle('dark', isDark);

  if (mode === 'system') {
    themeToggleBtn.innerHTML = `<i data-lucide="monitor" class="w-4 h-4"></i>`;
    themeToggleBtn.title = `外观: 跟随系统 (${systemDark ? '当前深色' : '当前浅色'})`;
  } else if (mode === 'dark') {
    themeToggleBtn.innerHTML = `<i data-lucide="moon" class="w-4 h-4"></i>`;
    themeToggleBtn.title = '外观: 手动深色';
  } else {
    themeToggleBtn.innerHTML = `<i data-lucide="sun" class="w-4 h-4"></i>`;
    themeToggleBtn.title = '外观: 手动浅色';
  }

  ['system', 'light', 'dark'].forEach(m => {
    const btn = document.getElementById(`themeOpt${m.charAt(0).toUpperCase() + m.slice(1)}`);
    if (btn) {
      const check = btn.querySelector('.check-icon');
      if (m === mode) {
        btn.classList.add('bg-neutral-100', 'dark:bg-neutral-800', 'font-semibold', 'text-amber-600', 'dark:text-amber-400');
        if (check) check.classList.remove('hidden');
      } else {
        btn.classList.remove('bg-neutral-100', 'dark:bg-neutral-800', 'font-semibold', 'text-amber-600', 'dark:text-amber-400');
        if (check) check.classList.add('hidden');
      }
    }
  });

  lucide.createIcons();

  // 重绘当前静态画面
  if (!isPlaying) {
    const mainColor = isDark ? '#f3f4f6' : '#1f2937';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(isDark ? '#374151' : '#d1d5db', isDark ? '#4b5563' : '#9ca3af');
    dino.draw(mainColor);
  }
}

themeToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  themeMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  themeMenu.classList.add('hidden');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getActiveThemeMode() === 'system') {
    applyTheme();
  }
});

// 跨标签页 / 大厅主题修改即时联动
window.addEventListener('storage', (e) => {
  if (e.key === GLOBAL_THEME_KEY || e.key === LOCAL_THEME_KEY) {
    applyTheme();
  }
});

// 检测 Standalone 独立运行模式（PWA 离线独立应用）
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone) {
  document.querySelectorAll('.standalone-hidden').forEach(el => el.classList.add('hidden'));
}

// 独立安装引导
let deferredAppPrompt;
const installAppBtn = document.getElementById('installAppBtn');
if (!isStandalone) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredAppPrompt = e;
    installAppBtn.classList.remove('hidden');
    installAppBtn.classList.add('flex');
  });

  installAppBtn.addEventListener('click', async () => {
    if (!deferredAppPrompt) return;
    deferredAppPrompt.prompt();
    await deferredAppPrompt.userChoice;
    installAppBtn.classList.add('hidden');
    deferredAppPrompt = null;
  });
}

applyTheme();
