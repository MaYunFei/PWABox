// PWABox - 轻记待办业务逻辑 (PC 桌面双栏工作台 + 移动端自适应)
const STORAGE_KEY = 'pwabox_todo_items';

let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';

// DOM 元素
const form = document.getElementById('addTodoForm');
const input = document.getElementById('todoInput');
const listEl = document.getElementById('todoList');
const emptyEl = document.getElementById('emptyList');

// 侧边栏看板统计
const badgeTotal = document.getElementById('badgeTotal');
const badgeActive = document.getElementById('badgeActive');
const badgeDone = document.getElementById('badgeDone');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const footerStatus = document.getElementById('footerStatus');
const clearDoneBtn = document.getElementById('clearDoneBtn');

// 备份弹窗
const backupModal = document.getElementById('backupModal');
const openBackupBtn = document.getElementById('openBackupBtn');
const closeBackupBtn = document.getElementById('closeBackupBtn');
const backupText = document.getElementById('backupText');
const copyBackupBtn = document.getElementById('copyBackupBtn');
const restoreBackupBtn = document.getElementById('restoreBackupBtn');

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  render();
}

function setFilter(filter) {
  currentFilter = filter;
  ['all', 'active', 'completed'].forEach(f => {
    const btn = document.getElementById(`tab${f.charAt(0).toUpperCase() + f.slice(1)}`);
    if (f === filter) {
      btn.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white transition-all duration-150 active:scale-[0.97] shadow-sm";
      btn.querySelector('span:last-child').className = "px-2 py-0.5 rounded-full bg-white/20 text-[11px]";
    } else {
      btn.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-[0.97]";
      btn.querySelector('span:last-child').className = "px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400";
    }
  });
  render();
}

function render() {
  const total = todos.length;
  const activeCount = todos.filter(t => !t.completed).length;
  const doneCount = todos.filter(t => t.completed).length;

  badgeTotal.textContent = total;
  badgeActive.textContent = activeCount;
  badgeDone.textContent = doneCount;

  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  footerStatus.textContent = activeCount === 0 && total > 0 ? "🎉 全部完成！" : `还有 ${activeCount} 项任务`;

  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    listEl.innerHTML = filtered.map(item => `
      <li class="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-sky-400 dark:hover:border-sky-500/50 transition-all duration-150 group">
        <div class="flex items-center gap-3 flex-1 min-w-0 mr-2 cursor-pointer" onclick="toggleTodo('${item.id}')">
          <button class="w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-150 flex-shrink-0 active:scale-[0.92] ${
            item.completed 
              ? 'bg-sky-600 border-sky-600 text-white shadow-xs' 
              : 'border-slate-300 dark:border-slate-700 hover:border-sky-500'
          }">
            ${item.completed ? '<i data-lucide="check" class="w-3.5 h-3.5 stroke-[2.5]"></i>' : ''}
          </button>
          <span class="text-xs sm:text-sm select-none truncate ${
            item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100 font-medium'
          }">
            ${item.text}
          </span>
        </div>
        <button onclick="deleteTodo('${item.id}')" class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-[0.97] transition-all duration-150" title="删除">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </li>
    `).join('');
  }

  lucide.createIcons();
}

function addTodo(text) {
  if (!text.trim()) return;
  todos.unshift({
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  });
  saveTodos();
}

function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(input.value);
  input.value = '';
});

clearDoneBtn.addEventListener('click', () => {
  if (confirm('确定清除所有已完成的待办事项吗？')) {
    todos = todos.filter(t => !t.completed);
    saveTodos();
  }
});

// 备份模态框
openBackupBtn.addEventListener('click', () => {
  backupText.value = JSON.stringify(todos, null, 2);
  backupModal.classList.remove('hidden');
});

closeBackupBtn.addEventListener('click', () => backupModal.classList.add('hidden'));

copyBackupBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(backupText.value).then(() => {
    alert('待办数据已成功复制到剪贴板！');
  });
});

restoreBackupBtn.addEventListener('click', () => {
  try {
    const parsed = JSON.parse(backupText.value);
    if (Array.isArray(parsed)) {
      todos = parsed;
      saveTodos();
      backupModal.classList.add('hidden');
      alert('数据恢复成功！');
    } else {
      alert('数据格式无效，恢复失败。');
    }
  } catch (err) {
    alert('JSON 解析错误，请检查文本是否完整。');
  }
});

// 检测 Standalone 独立运行模式（iOS Safari 或 Android PWA）
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone) {
  document.querySelectorAll('.standalone-hidden').forEach(el => el.classList.add('hidden'));
}

// PWA 独立安装（仅在非独立模式下有效）
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
// 独立深浅色外观控制（全局联动 + 独立覆盖）
// ==========================================
const LOCAL_THEME_KEY = 'pwabox_todo_theme';
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
    themeToggleBtn.innerHTML = `<i data-lucide="monitor" class="w-4 h-4 text-sky-600"></i>`;
    themeToggleBtn.title = `外观: 跟随系统 (${systemDark ? '当前深色' : '当前浅色'})`;
  } else if (mode === 'dark') {
    themeToggleBtn.innerHTML = `<i data-lucide="moon" class="w-4 h-4 text-sky-600"></i>`;
    themeToggleBtn.title = '外观: 手动深色';
  } else {
    themeToggleBtn.innerHTML = `<i data-lucide="sun" class="w-4 h-4 text-sky-600"></i>`;
    themeToggleBtn.title = '外观: 手动浅色';
  }

  ['system', 'light', 'dark'].forEach(m => {
    const btn = document.getElementById(`themeOpt${m.charAt(0).toUpperCase() + m.slice(1)}`);
    if (btn) {
      const check = btn.querySelector('.check-icon');
      if (m === mode) {
        btn.classList.add('bg-sky-50', 'dark:bg-sky-950/60', 'font-semibold', 'text-sky-600', 'dark:text-sky-300');
        if (check) check.classList.remove('hidden');
      } else {
        btn.classList.remove('bg-sky-50', 'dark:bg-sky-950/60', 'font-semibold', 'text-sky-600', 'dark:text-sky-300');
        if (check) check.classList.add('hidden');
      }
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

// 监听系统外观变化
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

applyTheme();
render();
