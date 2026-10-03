/**
 * Zenith — Modern Focus & Productivity Studio
 * Interactive Logic & Web Audio Synthesizer
 */

// ==========================================
// 1. Digital Clock & Date
// ==========================================
function updateClock() {
  const clockEl = document.getElementById('clock-display');
  const dateEl = document.getElementById('date-display');
  if (!clockEl || !dateEl) return;

  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 2. Synthesized Web Audio Engine
// ==========================================
class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.soundType = 'rain'; // 'rain' | 'drone' | 'pink'
    this.nodes = [];
    this.gainNode = null;
    this.volume = 0.3;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = parseFloat(val);
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  play() {
    this.init();
    this.stop();
    this.isPlaying = true;

    if (this.soundType === 'rain') {
      this.startRainSynth();
    } else if (this.soundType === 'drone') {
      this.startDroneSynth();
    } else if (this.soundType === 'pink') {
      this.startOceanWavesSynth();
    }
  }

  stop() {
    this.nodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {
        // ignore already stopped nodes
      }
    });
    this.nodes = [];
    this.isPlaying = false;
  }

  setMode(type) {
    this.soundType = type;
    if (this.isPlaying) {
      this.play();
    }
  }

  startRainSynth() {
    // Generate pink noise buffer for rain
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate soft rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();

    this.nodes.push(whiteNoise, filter);
  }

  startDroneSynth() {
    // 432 Hz Healing / Zen Drone with subtle harmonic detuning
    const freqs = [216, 432, 648];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      oscGain.gain.setValueAtTime(0.15 / (idx + 1), this.ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(this.gainNode);
      osc.start();
      this.nodes.push(osc, oscGain);
    });
  }

  startOceanWavesSynth() {
    // Pink noise with modulated filter to simulate ocean swells
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    // LFO for slow breathing wave cycles
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.gainNode);

    lfo.start();
    noise.start();

    this.nodes.push(noise, filter, lfo, lfoGain);
  }

  playChime(type = 'success') {
    this.init();
    const osc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    } else {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.2);
    }

    chimeGain.gain.setValueAtTime(0.2, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }
}

const audio = new AmbientAudioEngine();

// UI bindings for sound controls
const soundBtn = document.getElementById('sound-toggle-btn');
const soundPopover = document.getElementById('sound-popover');
const soundIconOff = document.getElementById('sound-icon-off');
const soundIconOn = document.getElementById('sound-icon-on');
const soundText = document.getElementById('sound-state-text');
const ambientVol = document.getElementById('ambient-vol');

if (soundBtn) {
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!audio.isPlaying) {
      audio.play();
      soundIconOff.classList.add('hidden');
      soundIconOn.classList.remove('hidden');
      soundText.textContent = 'Sound: On';
    } else {
      audio.stop();
      soundIconOff.classList.remove('hidden');
      soundIconOn.classList.add('hidden');
      soundText.textContent = 'Sound: Off';
    }
  });

  soundBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    soundPopover.classList.toggle('open');
  });

  // Toggle popover on double click or hover indicator
  soundBtn.addEventListener('mouseenter', () => {
    soundPopover.classList.add('open');
  });

  document.addEventListener('click', (e) => {
    if (!soundPopover.contains(e.target) && !soundBtn.contains(e.target)) {
      soundPopover.classList.remove('open');
    }
  });
}

document.querySelectorAll('.sound-mode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sound-mode').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    audio.setMode(btn.dataset.sound);
  });
});

if (ambientVol) {
  ambientVol.addEventListener('input', (e) => {
    audio.setVolume(e.target.value);
  });
}

// ==========================================
// 3. Pomodoro Focus Engine
// ==========================================
let timerInterval = null;
let currentMode = 'work';
let totalSeconds = 25 * 60;
let remainingSeconds = 25 * 60;
let isRunning = false;
let sessionsCompleted = parseInt(localStorage.getItem('zenith_sessions') || '0', 10);
let totalFocusMins = parseInt(localStorage.getItem('zenith_focus_mins') || '0', 10);

const timerDisplay = document.getElementById('timer-display');
const timerRing = document.getElementById('timer-ring');
const startBtn = document.getElementById('timer-start-btn');
const startBtnLabel = document.getElementById('start-btn-label');
const resetBtn = document.getElementById('timer-reset-btn');
const skipBtn = document.getElementById('timer-skip-btn');
const statusBadge = document.getElementById('timer-status-badge');
const sessionCountEl = document.getElementById('session-count');
const focusMinsStat = document.getElementById('focus-mins-stat');

const RING_CIRCUMFERENCE = 2 * Math.PI * 120; // 753.98
if (timerRing) {
  timerRing.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
}

function updateTimerRing() {
  if (!timerRing) return;
  const progress = remainingSeconds / totalSeconds;
  const offset = RING_CIRCUMFERENCE - progress * RING_CIRCUMFERENCE;
  timerRing.style.strokeDashoffset = offset;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }
  updateTimerRing();
  if (sessionCountEl) sessionCountEl.textContent = sessionsCompleted;
  if (focusMinsStat) focusMinsStat.textContent = totalFocusMins;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtnLabel.textContent = 'Pause';
  statusBadge.textContent = currentMode === 'work' ? 'In Flow State' : 'Resting';
  audio.playChime('success');

  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      if (currentMode === 'work' && remainingSeconds % 60 === 0) {
        totalFocusMins++;
        localStorage.setItem('zenith_focus_mins', totalFocusMins);
        if (focusMinsStat) focusMinsStat.textContent = totalFocusMins;
      }
      renderTimer();
    } else {
      completeSession();
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  startBtnLabel.textContent = 'Resume';
  statusBadge.textContent = 'Paused';
}

function resetTimer() {
  pauseTimer();
  startBtnLabel.textContent = 'Start Focus';
  remainingSeconds = totalSeconds;
  statusBadge.textContent = 'Ready to Focus';
  renderTimer();
}

function completeSession() {
  pauseTimer();
  audio.playChime('success');
  triggerConfetti();

  if (currentMode === 'work') {
    sessionsCompleted++;
    localStorage.setItem('zenith_sessions', sessionsCompleted);
    statusBadge.textContent = 'Focus Done! Take a break';
    switchMode('short', 5);
  } else {
    statusBadge.textContent = 'Break Finished!';
    switchMode('work', 25);
  }
}

function switchMode(mode, mins) {
  currentMode = mode;
  totalSeconds = mins * 60;
  remainingSeconds = totalSeconds;
  document.querySelectorAll('.timer-mode-pills .pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.mode === mode);
  });
  resetTimer();
}

if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });
}

if (resetBtn) resetBtn.addEventListener('click', resetTimer);

if (skipBtn) {
  skipBtn.addEventListener('click', () => {
    completeSession();
  });
}

document.querySelectorAll('.timer-mode-pills .pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const mode = pill.dataset.mode;
    const mins = parseInt(pill.dataset.mins, 10);
    switchMode(mode, mins);
  });
});

renderTimer();

// ==========================================
// 4. Task Matrix with Confetti & Storage
// ==========================================
let tasks = JSON.parse(localStorage.getItem('zenith_tasks') || '[]');
if (tasks.length === 0) {
  tasks = [
    { id: 1, text: 'Initialize Git and push clean project to GitHub', tag: 'Code', completed: false },
    { id: 2, text: 'Experience ambient binaural focus synth', tag: 'Focus', completed: false },
    { id: 3, text: 'Customize theme colors and test scratchpad sync', tag: 'Design', completed: true }
  ];
}

let activeFilter = 'all';
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskTagSelect = document.getElementById('task-tag-select');
const tasksList = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const tasksDoneStat = document.getElementById('tasks-done-stat');

function saveTasks() {
  localStorage.setItem('zenith_tasks', JSON.stringify(tasks));
  updateStats();
}

function updateStats() {
  const doneCount = tasks.filter(t => t.completed).length;
  if (tasksDoneStat) tasksDoneStat.textContent = doneCount;
}

function renderTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = '';

  const filtered = tasks.filter(task => {
    if (activeFilter === 'active') return !task.completed;
    if (activeFilter === 'completed') return task.completed;
    return true;
  });

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion">
        <span class="task-title">${escapeHtml(task.text)}</span>
        <span class="task-tag">${escapeHtml(task.tag)}</span>
      </div>
      <button class="task-delete-btn" title="Delete Task" aria-label="Delete Task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;

    // Toggle Checkbox
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTasks();
      if (task.completed) {
        audio.playChime('success');
        triggerConfetti();
      }
      renderTasks();
    });

    // Delete
    const deleteBtn = li.querySelector('.task-delete-btn');
    deleteBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    tasksList.appendChild(li);
  });

  updateStats();
}

if (taskForm) {
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = taskInput.value.trim();
    if (!val) return;

    tasks.unshift({
      id: Date.now(),
      text: val,
      tag: taskTagSelect.value,
      completed: false
    });

    taskInput.value = '';
    saveTasks();
    renderTasks();
  });
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderTasks();
  });
});

renderTasks();

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================
// 5. Scratchpad & Auto-Save
// ==========================================
const scratchpad = document.getElementById('scratchpad-text');
const notesMeta = document.getElementById('notes-meta');
const clearNotesBtn = document.getElementById('clear-notes-btn');
const savedIndicator = document.getElementById('saved-indicator');

if (scratchpad) {
  scratchpad.value = localStorage.getItem('zenith_notes') || '';
  updateNotesMeta();

  scratchpad.addEventListener('input', () => {
    localStorage.setItem('zenith_notes', scratchpad.value);
    updateNotesMeta();
    savedIndicator.style.opacity = '1';
  });
}

function updateNotesMeta() {
  if (!scratchpad || !notesMeta) return;
  const text = scratchpad.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = text.length;
  notesMeta.textContent = `${words} words | ${chars} chars`;
}

if (clearNotesBtn) {
  clearNotesBtn.addEventListener('click', () => {
    if (confirm('Clear scratchpad content?')) {
      scratchpad.value = '';
      localStorage.removeItem('zenith_notes');
      updateNotesMeta();
    }
  });
}

// ==========================================
// 6. Theme Switcher
// ==========================================
const themeBtn = document.getElementById('theme-btn');
const themeMenu = document.getElementById('theme-menu');
const themeLabel = document.getElementById('current-theme-label');

const themeNames = {
  violet: 'Cyber Violet',
  cyan: 'Hyper Neon',
  amber: 'Sunset Flame',
  emerald: 'Emerald Matrix'
};

const savedTheme = localStorage.getItem('zenith_theme') || 'violet';
applyTheme(savedTheme);

if (themeBtn) {
  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeMenu.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!themeMenu.contains(e.target)) {
      themeMenu.classList.remove('open');
    }
  });
}

document.querySelectorAll('.theme-option').forEach(opt => {
  opt.addEventListener('click', () => {
    const theme = opt.dataset.setTheme;
    applyTheme(theme);
    themeMenu.classList.remove('open');
  });
});

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('zenith_theme', theme);
  if (themeLabel) themeLabel.textContent = themeNames[theme] || 'Cyber Violet';

  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.setTheme === theme);
  });
}

// ==========================================
// 7. Confetti Particle Canvas Animation
// ==========================================
const canvas = document.getElementById('confetti-canvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function triggerConfetti() {
  if (!canvas || !ctx) return;
  resizeCanvas();

  const colors = ['#9333ea', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'];
  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.45,
      r: Math.random() * 6 + 3,
      dx: (Math.random() - 0.5) * 12,
      dy: Math.random() * -10 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleInc: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0,
      opacity: 1
    });
  }

  if (!isAnimatingConfetti) {
    animateConfetti();
  }
}

let isAnimatingConfetti = false;
function animateConfetti() {
  if (!ctx || particles.length === 0) {
    isAnimatingConfetti = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  isAnimatingConfetti = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, index) => {
    p.tiltAngle += p.tiltAngleInc;
    p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2 + p.dy * 0.2;
    p.x += Math.sin(p.tiltAngle) * 2 + p.dx * 0.4;
    p.dy += 0.2; // Gravity
    p.opacity -= 0.008;

    ctx.beginPath();
    ctx.lineWidth = p.r / 2;
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = Math.max(p.opacity, 0);
    ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
    ctx.stroke();

    if (p.opacity <= 0 || p.y > canvas.height) {
      particles.splice(index, 1);
    }
  });

  requestAnimationFrame(animateConfetti);
}

// ==========================================
// 8. Rotating Quotes
// ==========================================
const quotes = [
  { text: '"Simplicity is prerequisite for reliability."', author: "— Edsger W. Dijkstra" },
  { text: '"First, solve the problem. Then, write the code."', author: "— John Johnson" },
  { text: '"Make it work, make it right, make it fast."', author: "— Kent Beck" },
  { text: '"Focus is a muscle; the more you practice, the stronger it grows."', author: "— Deep Work" }
];

const quoteEl = document.getElementById('daily-quote');
const authorEl = document.getElementById('daily-author');
if (quoteEl && authorEl) {
  const randomQ = quotes[Math.floor(Math.random() * quotes.length)];
  quoteEl.textContent = randomQ.text;
  authorEl.textContent = randomQ.author;
}
