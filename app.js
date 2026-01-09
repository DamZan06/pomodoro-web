// ===================== DURATE (secondi) =====================
let workDuration = 25 * 60;
let shortBreakDuration = 5 * 60;
let longBreakDuration = 20 * 60;

// ===================== STATO =====================
let repetitions = 4;
let currentRep = 0;
let phase = 'idle';
let remaining = workDuration;
let running = false;
let timerId = null;
let endTime = null;

// ===================== UI =====================
const timeEl = document.getElementById('time');
const phaseEl = document.getElementById('phase');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettingsBtn = document.getElementById('saveSettings');

const opacitySlider = document.getElementById('opacitySlider');
const addBgBtn = document.getElementById('addBgBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

const workInput = document.getElementById('workInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const repsSettingsInput = document.getElementById('repsSettingsInput');

const timerCard = document.querySelector('.timer-card');
const stopAudioBtn = document.getElementById('stopAudioBtn');

// ===================== AUDIO =====================
const workEndAudio = new Audio('sounds/break_end.mp3');
const breakEndAudio = new Audio('sounds/work_end.mp3');

// ===================== STATO VISIVO =====================
let previousCardBg = '';
let originalOpacity = parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue('--card-opacity')
);

// ===================== FILE INPUT =====================
const hiddenInput = document.createElement('input');
hiddenInput.type = 'file';
hiddenInput.accept = 'image/*';
hiddenInput.style.display = 'none';
document.body.appendChild(hiddenInput);

// ===================== UTIL =====================
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  const n = parseInt(hex, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// ===================== UI =====================
function updateUI() {
  timeEl.textContent = formatTime(remaining);

  const map = {
    idle: 'In attesa',
    work: `Lavoro (${currentRep + 1}/${repetitions})`,
    shortBreak: 'Pausa breve',
    longBreak: 'Pausa lunga',
    finished: 'Completato'
  };

  phaseEl.textContent = map[phase];
  updateButtons();
}

function updateButtons() {
  startBtn.classList.toggle('inactive', running);
  pauseBtn.classList.toggle('inactive', !running);
  stopBtn.classList.toggle('inactive', phase === 'idle');
}

// ===================== TIMER (orologio reale) =====================
function tick() {
  if (!endTime) return;

  remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));

  if (remaining <= 0) {
    onPeriodEnd();
  }

  updateUI();
}

function startTimer() {
  if (phase === 'idle' || phase === 'finished') {
    currentRep = 0;
    phase = 'work';
    remaining = workDuration;
  }

  if (!running) {
    running = true;
    endTime = Date.now() + remaining * 1000;
    timerId = setInterval(tick, 500);
  }

  updateUI();
}

function pauseTimer() {
  running = false;
  clearInterval(timerId);
  remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  endTime = null;
  updateUI();
}

function stopTimer() {
  running = false;
  clearInterval(timerId);
  phase = 'idle';
  remaining = workDuration;
  currentRep = 0;
  resetCardBackground();
  updateUI();
}

// ===================== COLORI + AUDIO =====================
function showPhaseCard(colorHex, audio) {
  const opacity = getComputedStyle(document.documentElement)
    .getPropertyValue('--card-opacity') || 0.6;

  previousCardBg = timerCard.style.backgroundColor ||
    `rgba(255,255,255,${opacity})`;

  timerCard.style.backgroundColor =
    `rgba(${hexToRgb(colorHex)},${opacity})`;

  audio.currentTime = 0;
  audio.play();
  stopAudioBtn.classList.remove('hidden');
}

function resetCardBackground() {
  timerCard.style.backgroundColor = previousCardBg;
}

stopAudioBtn.onclick = () => {
  workEndAudio.pause();
  breakEndAudio.pause();
  resetCardBackground();
  stopAudioBtn.classList.add('hidden');
};

// ===================== FINE PERIODO =====================
function onPeriodEnd() {
  clearInterval(timerId);
  running = false;

  if (phase === 'work') {
    currentRep++;

    if (currentRep >= repetitions) {
      phase = 'finished';
      remaining = 0;
      updateUI();
      return;
    }

    phase = currentRep % 4 === 0 ? 'longBreak' : 'shortBreak';
    remaining = phase === 'longBreak' ? longBreakDuration : shortBreakDuration;

    showPhaseCard('#8be28b', breakEndAudio);
  } else {
    phase = 'work';
    remaining = workDuration;

    showPhaseCard('#f28c8c', workEndAudio);
  }

  endTime = Date.now() + remaining * 1000;
  running = true;
  timerId = setInterval(tick, 500);
  updateUI();
}

// ===================== IMPOSTAZIONI =====================
function syncSettingsUI() {
  workInput.value = workDuration / 60;
  shortBreakInput.value = shortBreakDuration / 60;
  longBreakInput.value = longBreakDuration / 60;
  repsSettingsInput.value = repetitions;
}

settingsBtn.onclick = () => {
  originalOpacity = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--card-opacity')
  );
  syncSettingsUI();
  opacitySlider.value = originalOpacity;
  settingsModal.classList.remove('hidden');
};

opacitySlider.oninput = e =>
  document.documentElement.style.setProperty('--card-opacity', e.target.value);

closeSettings.onclick = () => {
  document.documentElement.style.setProperty('--card-opacity', originalOpacity);
  settingsModal.classList.add('hidden');
};

saveSettingsBtn.onclick = () => {
  workDuration = workInput.value * 60;
  shortBreakDuration = shortBreakInput.value * 60;
  longBreakDuration = longBreakInput.value * 60;
  repetitions = repsSettingsInput.value;

  saveSettings();
  settingsModal.classList.add('hidden');
};

// ===================== BACKGROUND =====================
addBgBtn.onclick = () => hiddenInput.click();

hiddenInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    document.body.style.backgroundImage = `url(${reader.result})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    saveSettings();
  };
  reader.readAsDataURL(file);
};

removeBgBtn.onclick = () => {
  document.body.style.backgroundImage = '';
  saveSettings();
};

// ===================== STORAGE =====================
function saveSettings() {
  localStorage.setItem('pomodoroSettings', JSON.stringify({
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    repetitions,
    cardOpacity: getComputedStyle(document.documentElement)
      .getPropertyValue('--card-opacity'),
    backgroundImage: document.body.style.backgroundImage
  }));
}

function loadSettings() {
  const s = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
  Object.assign({
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    repetitions
  }, s);

  if (s.cardOpacity)
    document.documentElement.style.setProperty('--card-opacity', s.cardOpacity);
  if (s.backgroundImage)
    document.body.style.backgroundImage = s.backgroundImage;
}

// ===================== AVVIO =====================
loadSettings();
updateUI();

startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
stopBtn.onclick = stopTimer;
