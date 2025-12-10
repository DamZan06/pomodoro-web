// app.js - Pomodoro Web con salvataggio completo dello stato

const POMODORO = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 20 * 60;

let repetitions = 4;
let currentRep = 0;
let phase = 'idle';
let remaining = POMODORO;
let running = false;
let timerId = null;

// elementi DOM
const timeEl = document.getElementById('time');
const phaseEl = document.getElementById('phase');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const repsInput = document.getElementById('repsInput');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');

const opacitySlider = document.getElementById('opacitySlider');
const removeBgBtn = document.getElementById('removeBgBtn');
const addBgBtn = document.getElementById('addBgBtn');

const hiddenInput = document.createElement('input');
hiddenInput.type = 'file';
hiddenInput.accept = 'image/*';
hiddenInput.style.display = 'none';
document.body.appendChild(hiddenInput);

/* ---------------------------
          SALVATAGGIO
--------------------------- */

function saveState() {
  const state = {
    phase,
    remaining,
    running,
    repetitions,
    currentRep,
    timestamp: Date.now(),
    opacity: opacitySlider.value,
    background: document.body.style.backgroundImage || null
  };
  localStorage.setItem("pomodoroState", JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem("pomodoroState");
  if (!raw) return;

  try {
    const state = JSON.parse(raw);

    // impostazioni base
    phase = state.phase ?? 'idle';
    remaining = state.remaining ?? POMODORO;
    running = state.running ?? false;
    repetitions = state.repetitions ?? 4;
    currentRep = state.currentRep ?? 0;

    // opacità
    if (state.opacity !== undefined) {
      opacitySlider.value = state.opacity;
      document.documentElement.style.setProperty('--card-opacity', state.opacity);
    }

    // sfondo
    if (state.background) {
      document.body.style.backgroundImage = state.background;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }

    // correzione tempo passato OFFLINE
    if (running && state.timestamp) {
      const diffSec = Math.floor((Date.now() - state.timestamp) / 1000);
      remaining -= diffSec;

      if (remaining <= 0) {
        onPeriodEnd();
        return;
      }
    }

    if (running) {
      timerId = setInterval(tick, 1000);
    }

  } catch (e) {
    console.error("Errore caricando lo stato:", e);
  }
}

/* ---------------------------
          TIMER
--------------------------- */

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

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
  saveState();
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
    remaining = POMODORO;
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
  remaining = POMODORO;
  currentRep = 0;
  updateUI();
}

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
      remaining = LONG_BREAK;
    } else {
      phase = 'shortBreak';
      remaining = SHORT_BREAK;
    }

    startTimer();
  }

  else if (phase === 'shortBreak' || phase === 'longBreak') {
    phase = 'work';
    remaining = POMODORO;
    startTimer();
  }

  updateUI();
}

/* ---------------------------
        EVENTI DOM
--------------------------- */

repsInput.addEventListener('change', (e) => {
  const v = parseInt(e.target.value, 10);
  if (!isNaN(v) && v > 0) {
    repetitions = v;
  } else {
    repsInput.value = repetitions;
  }
  updateUI();
});

addBgBtn.addEventListener('click', () => hiddenInput.click());

hiddenInput.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (!f) return;

  const reader = new FileReader();
  reader.onload = () => {
    document.body.style.backgroundImage = `url(${reader.result})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    updateUI();
  };
  reader.readAsDataURL(f);
});

removeBgBtn.addEventListener('click', () => {
  document.body.style.backgroundImage = '';
  document.body.style.background = 'linear-gradient(135deg,#f0f4ff,#fff)';
  updateUI();
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
stopBtn.addEventListener('click', stopTimer);

settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) settingsModal.classList.add('hidden');
});

opacitySlider.addEventListener('input', (e) => {
  const val = e.target.value;
  document.documentElement.style.setProperty('--card-opacity', val);
  updateUI();
});

// CARICA STATO AL PRIMO AVVIO
loadState();
updateUI();
