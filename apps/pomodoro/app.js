// PWABox - 极简番茄钟业务逻辑 (PC 桌面双栏 + 手机全屏)

let durations = {
  work: parseInt(localStorage.getItem('pwabox_pomo_cfg_work') || '25', 10),
  short: parseInt(localStorage.getItem('pwabox_pomo_cfg_short') || '5', 10),
  long: 15
};

let currentMode = 'work';
let timeLeft = durations[currentMode] * 60;
let timer = null;
let isRunning = false;

// DOM
const timerDisplay = document.getElementById('timerDisplay');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const toggleIconBox = document.getElementById('toggleIconBox');
const resetBtn = document.getElementById('resetBtn');
const todayCountEl = document.getElementById('todayCount');
const todayMinutesEl = document.getElementById('todayMinutes');
const clearStatsBtn = document.getElementById('clearStatsBtn');

const modeWorkBtn = document.getElementById('modeWork');
const modeShortBtn = document.getElementById('modeShort');
const modeLongBtn = document.getElementById('modeLong');
const modeButtons = [modeWorkBtn, modeShortBtn, modeLongBtn];

// 滑块（桌面端与手机弹窗端双向同步）
const workSlider = document.getElementById('workSlider');
const shortSlider = document.getElementById('shortSlider');
const workDurationVal = document.getElementById('workDurationVal');
const shortDurationVal = document.getElementById('shortDurationVal');

const workSliderMobile = document.getElementById('workSliderMobile');
const shortSliderMobile = document.getElementById('shortSliderMobile');
const workDurationValMobile = document.getElementById('workDurationValMobile');
const shortDurationValMobile = document.getElementById('shortDurationValMobile');

function syncDurationUI() {
  if (workSlider) workSlider.value = durations.work;
  if (workDurationVal) workDurationVal.textContent = `${durations.work} 分钟`;
  if (workSliderMobile) workSliderMobile.value = durations.work;
  if (workDurationValMobile) workDurationValMobile.textContent = `${durations.work} 分钟`;

  if (shortSlider) shortSlider.value = durations.short;
  if (shortDurationVal) shortDurationVal.textContent = `${durations.short} 分钟`;
  if (shortSliderMobile) shortSliderMobile.value = durations.short;
  if (shortDurationValMobile) shortDurationValMobile.textContent = `${durations.short} 分钟`;
}

syncDurationUI();

function handleWorkChange(val) {
  durations.work = parseInt(val, 10);
  syncDurationUI();
  localStorage.setItem('pwabox_pomo_cfg_work', durations.work);
  if (!isRunning && currentMode === 'work') {
    timeLeft = durations.work * 60;
    updateDisplay();
  }
}

function handleShortChange(val) {
  durations.short = parseInt(val, 10);
  syncDurationUI();
  localStorage.setItem('pwabox_pomo_cfg_short', durations.short);
  if (!isRunning && currentMode === 'short') {
    timeLeft = durations.short * 60;
    updateDisplay();
  }
}

if (workSlider) workSlider.addEventListener('input', (e) => handleWorkChange(e.target.value));
if (workSliderMobile) workSliderMobile.addEventListener('input', (e) => handleWorkChange(e.target.value));
if (shortSlider) shortSlider.addEventListener('input', (e) => handleShortChange(e.target.value));
if (shortSliderMobile) shortSliderMobile.addEventListener('input', (e) => handleShortChange(e.target.value));

// 手机端设置弹窗控制
const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const confirmSettingsBtn = document.getElementById('confirmSettingsBtn');

if (mobileSettingsBtn && settingsModal) {
  mobileSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  if (confirmSettingsBtn) confirmSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
}

// Web Audio API 提示音
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);

    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  } catch (e) {
    console.log(e);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(timeLeft);
  document.title = `${formatTime(timeLeft)} - 番茄钟 | PWABox`;
}

function updateToggleBtnState() {
  const iconBox = document.getElementById('toggleIconBox');
  const btn = document.getElementById('toggleBtn');
  const txt = document.getElementById('toggleText');
  if (!btn || !txt) return;

  const totalSeconds = (currentMode === 'long' ? 15 : durations[currentMode]) * 60;
  const isStarted = timeLeft < totalSeconds;

  if (isRunning) {
    // 运行中：按钮呈中性深色/微晶反差暂停状态，图标为暂停
    txt.textContent = "暂停专注";
    btn.className = "px-8 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-base shadow-lg shadow-black/10 active:scale-[0.97] transition-all duration-150 flex items-center gap-2.5";
    if (iconBox) {
      iconBox.innerHTML = '<i data-lucide="pause" class="w-5 h-5 fill-current"></i>';
      lucide.createIcons({ root: iconBox });
    }
  } else {
    // 未运行：如果是中途暂停，显示“继续”；如果是全新状态，根据模式显示“开始专注”或“开始休息”
    const actionWord = isStarted 
      ? "继续" 
      : (currentMode === 'work' ? "开始专注" : "开始休息");
    txt.textContent = actionWord;
    btn.className = "px-8 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-base shadow-lg shadow-red-500/25 active:scale-[0.97] transition-all duration-150 flex items-center gap-2.5";
    if (iconBox) {
      iconBox.innerHTML = '<i data-lucide="play" class="w-5 h-5 fill-current"></i>';
      lucide.createIcons({ root: iconBox });
    }
  }
}

function switchMode(modeKey) {
  if (isRunning) stopTimer();
  currentMode = modeKey;
  timeLeft = (modeKey === 'long' ? 15 : durations[modeKey]) * 60;

  modeButtons.forEach(btn => {
    btn.className = "px-4 sm:px-5 py-2 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all duration-150 active:scale-[0.97]";
  });

  const activeBtn = modeKey === 'work' ? modeWorkBtn : (modeKey === 'short' ? modeShortBtn : modeLongBtn);
  activeBtn.className = "px-4 sm:px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 bg-red-500 text-white shadow-xs active:scale-[0.97]";

  updateDisplay();
  updateToggleBtnState();
}

function startTimer() {
  isRunning = true;
  updateToggleBtnState();

  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      stopTimer();
      playChime();
      if (currentMode === 'work') {
        recordCompletedPomodoro();
        alert('🎉 专注完成！休息一下吧。');
        switchMode('short');
      } else {
        alert('☕️ 休息结束，准备开始新的专注！');
        switchMode('work');
      }
    }
  }, 1000);
}

function stopTimer() {
  isRunning = false;
  clearInterval(timer);
  updateToggleBtnState();
}

function resetTimer() {
  stopTimer();
  timeLeft = (currentMode === 'long' ? 15 : durations[currentMode]) * 60;
  updateDisplay();
  updateToggleBtnState();
}

// 统计持久化
function getTodayKey() {
  const today = new Date().toISOString().split('T')[0];
  return `pwabox_pomodoro_${today}`;
}

function loadStats() {
  const count = parseInt(localStorage.getItem(getTodayKey()) || '0', 10);
  if (todayCountEl) todayCountEl.textContent = count;
  if (todayMinutesEl) todayMinutesEl.textContent = count * durations.work;

  const todayCountMobile = document.getElementById('todayCountMobile');
  const todayMinutesMobile = document.getElementById('todayMinutesMobile');
  if (todayCountMobile) todayCountMobile.textContent = count;
  if (todayMinutesMobile) todayMinutesMobile.textContent = count * durations.work;
}

function recordCompletedPomodoro() {
  const key = getTodayKey();
  const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, count);
  loadStats();
}

function handleClearStats() {
  if (confirm('确定清空今日专注记录吗？')) {
    localStorage.removeItem(getTodayKey());
    loadStats();
  }
}

if (clearStatsBtn) clearStatsBtn.addEventListener('click', handleClearStats);
const clearStatsBtnMobile = document.getElementById('clearStatsBtnMobile');
if (clearStatsBtnMobile) clearStatsBtnMobile.addEventListener('click', handleClearStats);

// 快捷键支持 (PC 键盘交互)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (isRunning) stopTimer(); else startTimer();
  } else if (e.key === 'r' || e.key === 'R') {
    resetTimer();
  }
});

toggleBtn.addEventListener('click', () => {
  if (isRunning) stopTimer(); else startTimer();
});

resetBtn.addEventListener('click', resetTimer);
modeWorkBtn.addEventListener('click', () => switchMode('work'));
modeShortBtn.addEventListener('click', () => switchMode('short'));
modeLongBtn.addEventListener('click', () => switchMode('long'));

// 检测 Standalone 独立运行模式（iOS Safari 或 Android PWA）
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone) {
  document.querySelectorAll('.standalone-hidden').forEach(el => el.classList.add('hidden'));
}

// 安装引导（仅在非 standalone 下有效）
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

// ==========================================
// 独立深浅色外观控制（状态显性化菜单）
// ==========================================
const THEME_KEY = 'pwabox_pomodoro_theme';
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeMenu = document.getElementById('themeMenu');
const themeIcon = document.getElementById('themeIcon');

function setThemeMode(mode) {
  localStorage.setItem(THEME_KEY, mode);
  applyTheme();
  themeMenu.classList.add('hidden');
}

function applyTheme() {
  const mode = localStorage.getItem(THEME_KEY) || 'system';
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  document.documentElement.classList.toggle('dark', isDark);

  if (mode === 'system') {
    themeToggleBtn.innerHTML = `<i data-lucide="monitor" class="w-4 h-4 text-red-500"></i>`;
    themeToggleBtn.title = `外观: 跟随系统 (${systemDark ? '当前深色' : '当前浅色'})`;
  } else if (mode === 'dark') {
    themeToggleBtn.innerHTML = `<i data-lucide="moon" class="w-4 h-4 text-red-500"></i>`;
    themeToggleBtn.title = '外观: 手动深色';
  } else {
    themeToggleBtn.innerHTML = `<i data-lucide="sun" class="w-4 h-4 text-red-500"></i>`;
    themeToggleBtn.title = '外观: 手动浅色';
  }

  ['system', 'light', 'dark'].forEach(m => {
    const btn = document.getElementById(`themeOpt${m.charAt(0).toUpperCase() + m.slice(1)}`);
    const check = btn.querySelector('.check-icon');
    if (m === mode) {
      btn.classList.add('bg-red-50', 'dark:bg-red-950/60', 'font-semibold', 'text-red-600', 'dark:text-red-300');
      check.classList.remove('hidden');
    } else {
      btn.classList.remove('bg-red-50', 'dark:bg-red-950/60', 'font-semibold', 'text-red-600', 'dark:text-red-300');
      check.classList.add('hidden');
    }
  });

  lucide.createIcons();
}

themeToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  themeMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  themeMenu.classList.add('hidden');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') {
    applyTheme();
  }
});

// 初始化
applyTheme();
updateDisplay();
loadStats();
lucide.createIcons();
