// مفتاح التخزين الدائم الخاص بحمادة
const STORAGE_KEY = 'hamada_productivity_pro_v2';

let appState = {
  balance: 0,
  spentBalance: 0,
  totalFocusMinutes: 0,
  totalTasksCompleted: 0,
  darkMode: true,
  pomoSettings: {
    focus: 25,
    short: 5,
    long: 15,
    reward: 25
  },
  tasks: [],
  challenges: [
    { id: 1, title: 'ماراثون المذاكرة (10 ساعات)', type: 'hours', target: 10, reward: 500, claimed: false },
    { id: 2, title: 'إنجاز 15 مهمة بنجاح', type: 'tasks', target: 15, reward: 300, claimed: false }
  ],
  rewards: [
    { id: 1, title: 'ساعة استراحة وألعاب 🎮', cost: 100 },
    { id: 2, title: 'مشروبك أو أكلتك المفضلة ☕', cost: 150 },
    { id: 3, title: 'مشاهدة فيلم سهرة 🎬', cost: 250 }
  ]
};

const quotes = [
  "استمر يا حمادة، كل دقيقة تركيز تقربك خطوة من هدفك الكبير!",
  "النجاح هو مجموع مجهودات صغيرة تتكرر يوماً بعد يوم.",
  "لا تؤجل عمل اليوم، مكافأتك بانتظارك في المتجر!",
  "التركيز العميق هو القوة الخارقة في هذا العصر.",
  "أنت تصنع مستقبلك بما تفعله الآن يا بطل."
];

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      appState = { ...appState, ...JSON.parse(saved) };
    } catch (e) {
      console.error('خطأ في استرجاع البيانات', e);
    }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  updateGlobalUI();
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'alarm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {}
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== التنقل والمظهر ====================
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`.nav-item[data-target="${tabName}"]`).classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.target));
});

const themeBtn = document.getElementById('theme-toggle');
function applyTheme() {
  if (appState.darkMode) {
    document.body.classList.remove('light-mode');
    themeBtn.textContent = '☀️';
  } else {
    document.body.classList.add('light-mode');
    themeBtn.textContent = '🌙';
  }
}
themeBtn.addEventListener('click', () => {
  appState.darkMode = !appState.darkMode;
  applyTheme();
  saveState();
});

// ==================== 1. البومودورو ====================
let currentMode = 'focus';
let timerInterval = null;
let isRunning = false;
let totalSeconds = appState.pomoSettings.focus * 60;
let remainingSeconds = totalSeconds;

const timeLeftEl = document.getElementById('time-left');
const progressRing = document.getElementById('progress-ring');
const startPauseBtn = document.getElementById('start-pause-btn');

function updateTimerDisplay() {
  const mins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const secs = (remainingSeconds % 60).toString().padStart(2, '0');
  timeLeftEl.textContent = `${mins}:${secs}`;

  const offset = 283 - (remainingSeconds / totalSeconds) * 283;
  progressRing.style.strokeDashoffset = offset;
}

function setTimerMode(mode) {
  clearInterval(timerInterval);
  isRunning = false;
  startPauseBtn.textContent = 'بدء التركيز';
  currentMode = mode;

  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');

  const mins = appState.pomoSettings[mode];
  totalSeconds = mins * 60;
  remainingSeconds = totalSeconds;
  
  const rewardLabel = document.getElementById('session-reward-label');
  rewardLabel.textContent = mode === 'focus' 
    ? `مكافأة الجلسة: +${appState.pomoSettings.reward} 💰` 
    : 'استراحة هادئة لتجديد الطاقة';

  updateTimerDisplay();
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => setTimerMode(btn.dataset.mode));
});

startPauseBtn.addEventListener('click', () => {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = 'استكمال';
  } else {
    isRunning = true;
    startPauseBtn.textContent = 'إيقاف مؤقت';
    timerInterval = setInterval(() => {
      remainingSeconds--;
      updateTimerDisplay();

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        playSound('alarm');
        handleTimerComplete();
      }
    }, 1000);
  }
});

document.getElementById('reset-timer-btn').addEventListener('click', () => {
  setTimerMode(currentMode);
});

function handleTimerComplete() {
  if (currentMode === 'focus') {
    const earned = Number(appState.pomoSettings.reward);
    appState.balance += earned;
    appState.totalFocusMinutes += Number(appState.pomoSettings.focus);
    
    const selectedTaskId = document.getElementById('active-task-select').value;
    if (selectedTaskId) {
      const task = appState.tasks.find(t => t.id == selectedTaskId);
      if (task && !task.completed) {
        toggleTaskComplete(task.id);
      }
    }

    playSound('coin');
    showToast(`عاش يا حمادة! كسبت +${earned} 💰`);
    saveState();
    renderChallenges();
  } else {
    showToast('انتهت الراحة! استعد لجولة جديدة.');
  }
  setTimerMode(currentMode);
}

document.getElementById('settings-timer-btn').addEventListener('click', () => {
  const box = document.getElementById('pomo-settings-box');
  box.classList.toggle('hidden');
  document.getElementById('set-focus').value = appState.pomoSettings.focus;
  document.getElementById('set-short').value = appState.pomoSettings.short;
  document.getElementById('set-long').value = appState.pomoSettings.long;
  document.getElementById('set-reward').value = appState.pomoSettings.reward;
});

document.getElementById('save-pomo-settings').addEventListener('click', () => {
  appState.pomoSettings.focus = Number(document.getElementById('set-focus').value) || 25;
  appState.pomoSettings.short = Number(document.getElementById('set-short').value) || 5;
  appState.pomoSettings.long = Number(document.getElementById('set-long').value) || 15;
  appState.pomoSettings.reward = Number(document.getElementById('set-reward').value) || 25;
  saveState();
  setTimerMode(currentMode);
  document.getElementById('pomo-settings-box').classList.add('hidden');
  showToast('تم حفظ إعدادات المؤقت ✅');
});

// ==================== 2. المهام ====================
const dateInput = document.getElementById('selected-date');
const todayStr = new Date().toISOString().split('T')[0];
dateInput.value = todayStr;

function updateDateLabel() {
  const label = document.getElementById('date-label');
  if (dateInput.value === todayStr) label.textContent = 'اليوم';
  else label.textContent = new Date(dateInput.value).toLocaleDateString('ar-EG', { weekday: 'long' });
  renderTasks();
}

dateInput.addEventListener('change', updateDateLabel);

document.getElementById('prev-day').addEventListener('click', () => {
  const d = new Date(dateInput.value);
  d.setDate(d.getDate() - 1);
  dateInput.value = d.toISOString().split('T')[0];
  updateDateLabel();
});

document.getElementById('next-day').addEventListener('click', () => {
  const d = new Date(dateInput.value);
  d.setDate(d.getDate() + 1);
  dateInput.value = d.toISOString().split('T')[0];
  updateDateLabel();
});

document.getElementById('add-task-btn').addEventListener('click', () => {
  const title = document.getElementById('task-title').value.trim();
  const price = Number(document.getElementById('task-price').value) || 10;
  const time = document.getElementById('task-time').value;

  if (!title) return showToast('اكتب اسم المهمة أولاً!');

  appState.tasks.push({
    id: Date.now(),
    title,
    price,
    time,
    date: dateInput.value,
    completed: false,
    notified: false
  });

  document.getElementById('task-title').value = '';
  saveState();
  renderTasks();
  showToast('تمت إضافة المهمة بنجاح');
});

function toggleTaskComplete(id) {
  const task = appState.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  if (task.completed) {
    appState.balance += task.price;
    appState.totalTasksCompleted += 1;
    playSound('coin');
    showToast(`كفو يا حمادة! +${task.price} 💰`);
  } else {
    appState.balance = Math.max(0, appState.balance - task.price);
    appState.totalTasksCompleted = Math.max(0, appState.totalTasksCompleted - 1);
  }

  saveState();
  renderTasks();
  renderChallenges();
}

function deleteTask(id) {
  appState.tasks = appState.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  const select = document.getElementById('active-task-select');
  const dayTasks = appState.tasks.filter(t => t.date === dateInput.value);

  list.innerHTML = dayTasks.length === 0 
    ? '<p style="text-align:center; color:var(--text-muted); padding:25px;">لا توجد مهام مسجلة في هذا اليوم.</p>' 
    : '';

  select.innerHTML = '<option value="">-- ربط الجلسة بمهمة حالية --</option>';
  appState.tasks.filter(t => t.date === todayStr && !t.completed).forEach(t => {
    select.innerHTML += `<option value="${t.id}">${t.title} (+${t.price} 💰)</option>`;
  });

  dayTasks.forEach(task => {
    const div = document.createElement('div');
    div.className = `task-item ${task.completed ? 'completed' : ''}`;
    div.innerHTML = `
      <div class="task-left" onclick="toggleTaskComplete(${task.id})">
        <div class="check-circle">${task.completed ? '✓' : ''}</div>
        <div class="task-info">
          <span class="task-name">${task.title}</span>
          ${task.time ? `<small>⏰ ${task.time}</small>` : ''}
        </div>
      </div>
      <span class="price-tag">+${task.price} 💰</span>
      <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
    `;
    list.appendChild(div);
  });
}

document.getElementById('enable-notif-btn').addEventListener('click', () => {
  if ('Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') showToast('تم تفعيل الإشعارات بنجاح 🔔');
      else showToast('يرجى السماح بالإشعارات من المتصفح');
    });
  }
});

// ==================== 3. التحديات ====================
document.getElementById('toggle-add-challenge').addEventListener('click', () => {
  document.getElementById('add-challenge-box').classList.toggle('hidden');
});

document.getElementById('save-challenge-btn').addEventListener('click', () => {
  const title = document.getElementById('chal-title').value.trim();
  const type = document.getElementById('chal-type').value;
  const target = Number(document.getElementById('chal-target').value);
  const reward = Number(document.getElementById('chal-reward').value);

  if (!title || !target) return showToast('أكمل بيانات التحدي!');

  appState.challenges.push({ id: Date.now(), title, type, target, reward, claimed: false });
  document.getElementById('chal-title').value = '';
  document.getElementById('add-challenge-box').classList.add('hidden');
  saveState();
  renderChallenges();
  showToast('تم إطلاق التحدي الجديد 🔥');
});

function claimChallenge(id) {
  const chal = appState.challenges.find(c => c.id === id);
  if (chal && !chal.claimed) {
    chal.claimed = true;
    appState.balance += chal.reward;
    playSound('coin');
    showToast(`مبروك الجائزة! +${chal.reward} 💰`);
    saveState();
    renderChallenges();
  }
}

function renderChallenges() {
  const list = document.getElementById('challenges-list');
  list.innerHTML = '';
  const currentHours = +(appState.totalFocusMinutes / 60).toFixed(1);

  appState.challenges.forEach(chal => {
    const currentVal = chal.type === 'hours' ? currentHours : appState.totalTasksCompleted;
    const pct = Math.min(100, Math.round((currentVal / chal.target) * 100));
    const isDone = currentVal >= chal.target;

    const div = document.createElement('div');
    div.className = 'challenge-card';
    div.innerHTML = `
      <div class="chal-top">
        <strong>${chal.title}</strong>
        <span class="price-tag">${chal.reward} 💰</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${pct}%"></div>
      </div>
      <div class="chal-footer">
        <span>التقدم: ${currentVal} / ${chal.target} ${chal.type === 'hours' ? 'ساعة' : 'مهمة'}</span>
        ${isDone && !chal.claimed 
          ? `<button class="buy-btn" onclick="claimChallenge(${chal.id})">استلم الجائزة 🎉</button>` 
          : chal.claimed ? '<span style="color:var(--success)">تم الاستلام ✓</span>' : `<span>${pct}%</span>`}
      </div>
    `;
    list.appendChild(div);
  });
}

// ==================== 4. المتجر (مستقل) ====================
document.getElementById('toggle-add-reward').addEventListener('click', () => {
  document.getElementById('add-reward-box').classList.toggle('hidden');
});

document.getElementById('save-reward-btn').addEventListener('click', () => {
  const title = document.getElementById('reward-title').value.trim();
  const cost = Number(document.getElementById('reward-cost').value);
  if (!title || !cost) return showToast('أدخل اسم المكافأة وتكلفتها');

  appState.rewards.push({ id: Date.now(), title, cost });
  document.getElementById('reward-title').value = '';
  document.getElementById('add-reward-box').classList.add('hidden');
  saveState();
  renderRewards();
  showToast('تمت إضافة المكافأة للمتجر 🛍️');
});

function buyReward(id) {
  const reward = appState.rewards.find(r => r.id === id);
  if (!reward) return;

  if (appState.balance >= reward.cost) {
    appState.balance -= reward.cost;
    appState.spentBalance = (appState.spentBalance || 0) + reward.cost;
    playSound('coin');
    showToast(`استمتع بمكافأتك: ${reward.title} 🎉`);
    saveState();
    renderRewards();
  } else {
    showToast(`رصيدك لا يكفي! تحتاج ${reward.cost - appState.balance} 💰 إضافية`);
  }
}

function renderRewards() {
  const list = document.getElementById('rewards-store-list');
  list.innerHTML = '';
  appState.rewards.forEach(r => {
    const div = document.createElement('div');
    div.className = 'reward-item';
    div.innerHTML = `
      <div>
        <strong>${r.title}</strong>
        <small style="display:block; color:var(--accent-gold); margin-top:3px;">التكلفة: ${r.cost} 💰</small>
      </div>
      <button class="buy-btn" onclick="buyReward(${r.id})">شراء 🛍️</button>
    `;
    list.appendChild(div);
  });
}

// ==================== 5. المحفظة والنسخ الاحتياطي ====================
document.getElementById('export-data-btn').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `hamada_pro_backup_${todayStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('تم تصدير النسخة الاحتياطية 📥');
});

document.getElementById('import-data-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      appState = { ...appState, ...imported };
      saveState();
      initApp();
      showToast('تمت استعادة البيانات بنجاح ✅');
    } catch (err) {
      showToast('ملف غير صالح!');
    }
  };
  reader.readAsText(file);
});

// ==================== التشغيل العام ====================
function updateGlobalUI() {
  document.getElementById('header-balance').textContent = appState.balance;
  document.getElementById('wallet-big-balance').textContent = `${appState.balance} 💰`;
  document.getElementById('spent-balance').textContent = `${appState.spentBalance || 0} 💰`;
  document.getElementById('total-hours-display').textContent = `${(appState.totalFocusMinutes / 60).toFixed(1)} ساعة`;
  document.getElementById('total-tasks-display').textContent = `${appState.totalTasksCompleted} مهمة`;
}

function initApp() {
  loadState();
  applyTheme();
  setTimerMode('focus');
  updateDateLabel();
  renderChallenges();
  renderRewards();
  updateGlobalUI();
  document.getElementById('daily-quote').textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
}

initApp();
