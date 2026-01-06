// app.js - Pomodoro Web con impostazioni complete + colori + audio

// DURATE (in secondi)
let workDuration = 25 * 60;
let shortBreakDuration = 5 * 60;
let longBreakDuration = 20 * 60;

// stato
let repetitions = 4;
let currentRep = 0;
let phase = 'idle';
let remaining = workDuration;
let running = false;
let timerId = null;

// elementi UI
const timeEl = document.getElementById('time');
const phaseEl = document.getElementById('phase');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');

const opacitySlider = document.getElementById('opacitySlider');
const removeBgBtn = document.getElementById('removeBgBtn');
const addBgBtn = document.getElementById('addBgBtn');

const stopAudioBtn = document.getElementById('stopAudioBtn');
const timerCard = document.querySelector('.timer-card');

const workInput = document.getElementById('workInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const repsSettingsInput = document.getElementById('repsSettingsInput');

// audio
const workEndAudio = new Audio('sounds/work_end.mp3');   // torna al lavoro
const breakEndAudio = new Audio('sounds/break_end.mp3'); // vai in pausa

let previousCardBg = '';

// input file nascosto (sfondo)
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

  switch (phase) {
    case 'idle': phaseEl.textContent = 'In attesa'; break;
    case 'work': phaseEl.textContent = `Lavoro (${currentRep + 1}/${repetitions})`; break;
    case 'shortBreak': phaseEl.textContent = 'Pausa breve'; break;
    case 'longBreak': phaseEl.textContent = 'Pausa lunga'; break;
    case 'finished': phaseEl.textContent = 'Completato'; break;
  }

  updateButtons();
}

function updateButtons() {
  if (phase === 'idle' || phase === 'finished') {
    startBtn.classList.remove('inactive');
    pauseBtn.classList.add('inactive');
    stopBtn.classList.add('inactive');
  } else if (running) {
    startBtn.classList.add('inactive');
    pauseBtn.classList.remove('inactive');
    stopBtn.classList.remove('inactive');
  } else {
    startBtn.classList.remove('inactive');
    pauseBtn.classList.add('inactive');
    stopBtn.classList.remove('inactive');
  }
}

// ===================== TIMER =====================
function tick() {
  if (remaining <= 0) {
    onPeriodEnd();
    return;
  }
  remaining--;
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
    timerId = setInterval(tick, 1000);
  }

  updateUI();
}

function pauseTimer() {
  running = false;
  clearInterval(timerId);
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

  stopAudioBtn.classList.remove('hidden');
  audio.currentTime = 0;
  audio.play();
}

function resetCardBackground() {
  timerCard.style.backgroundColor = previousCardBg;
}

stopAudioBtn.addEventListener('click', () => {
  workEndAudio.pause();
  breakEndAudio.pause();
  workEndAudio.currentTime = 0;
  breakEndAudio.currentTime = 0;
  resetCardBackground();
  stopAudioBtn.classList.add('hidden');
});

function saveSettings() {
  try {
    const bgImage = document.body.style.backgroundImage || '';

    localStorage.setItem('pomodoroSettings', JSON.stringify({
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      repetitions,
      cardOpacity: getComputedStyle(document.documentElement)
        .getPropertyValue('--card-opacity'),
      backgroundImage: bgImage
    }));
  } catch (e) {
    console.warn('Impossibile salvare le impostazioni (spazio insufficiente)');
  }
}

function loadSettings() {
  const saved = localStorage.getItem('pomodoroSettings');
  if (!saved) return;

  try {
    const data = JSON.parse(saved);

    if (data.workDuration) workDuration = data.workDuration;
    if (data.shortBreakDuration) shortBreakDuration = data.shortBreakDuration;
    if (data.longBreakDuration) longBreakDuration = data.longBreakDuration;
    if (data.repetitions) repetitions = data.repetitions;

    if (data.cardOpacity) {
      document.documentElement.style
        .setProperty('--card-opacity', data.cardOpacity);
      opacitySlider.value = data.cardOpacity;
    }

    if (data.backgroundImage) {
      document.body.style.backgroundImage = data.backgroundImage;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }

    if (phase === 'idle') {
      remaining = workDuration;
    }
  } catch (e) {
    console.warn('Errore nel caricare le impostazioni');
  }
}

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

    if (currentRep % 4 === 0) {
      phase = 'longBreak';
      remaining = longBreakDuration;
    } else {
      phase = 'shortBreak';
      remaining = shortBreakDuration;
    }

    showPhaseCard('#8be28b', breakEndAudio); // VERDE → pausa
    startTimer();
  }
  else if (phase === 'shortBreak' || phase === 'longBreak') {
    phase = 'work';
    remaining = workDuration;
    showPhaseCard('#f28c8c', workEndAudio); // ROSSO → torna al lavoro
    startTimer();
  }

  updateUI();
}

function syncSettingsUI() {
  workInput.value = Math.round(workDuration / 60);
  shortBreakInput.value = Math.round(shortBreakDuration / 60);
  longBreakInput.value = Math.round(longBreakDuration / 60);
  repsSettingsInput.value = repetitions;
}

// ===================== IMPOSTAZIONI =====================
function updateDurations(){
  workDuration = parseInt(workInput.value, 10) * 60;
  shortBreakDuration = parseInt(shortBreakInput.value, 10) * 60;
  longBreakDuration = parseInt(longBreakInput.value, 10) * 60;

  saveSettings();

  if (phase === 'idle') {
    remaining = workDuration;
    updateUI();
  }
}

workInput.addEventListener('change', updateDurations);
shortBreakInput.addEventListener('change', updateDurations);
longBreakInput.addEventListener('change', updateDurations);

// ===================== EVENTI =====================
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
stopBtn.addEventListener('click', stopTimer);

// MODAL impostazioni
settingsBtn.addEventListener('click', () => {
  syncSettingsUI();
  settingsModal.classList.remove('hidden');
});

closeSettings.addEventListener('click', () =>
  settingsModal.classList.add('hidden')
);

settingsModal.addEventListener('click', e => {
  if (e.target === settingsModal)
    settingsModal.classList.add('hidden');
});

opacitySlider.addEventListener('input', (e) => {
  const val = e.target.value;
  document.documentElement.style.setProperty('--card-opacity', val);
  saveSettings();
});

repsSettingsInput.addEventListener('change', () => {
  const v = parseInt(repsSettingsInput.value, 10);
  if (!isNaN(v) && v > 0) {
    repetitions = v;      // aggiorna la variabile principale
    saveSettings();       // salva le impostazioni aggiornate
    updateUI();           // aggiorna UI con le nuove ripetizioni
  }
});

addBgBtn.addEventListener('click', () => hiddenInput.click());

hiddenInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 1600;
      const scale = Math.min(1, MAX_WIDTH / img.width);

      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressed = canvas.toDataURL('image/jpeg', 0.7);

      document.body.style.backgroundImage = `url(${compressed})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';

      saveSettings();
    };
    img.src = reader.result;
  };

  reader.readAsDataURL(file);
});

removeBgBtn.addEventListener('click', () => {
  document.body.style.backgroundImage = '';
  document.body.style.background = 'linear-gradient(135deg,#f0f4ff,#fff)';
  saveSettings();
});

loadSettings();
updateUI();
