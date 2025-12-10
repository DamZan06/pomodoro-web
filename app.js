// app.js - Pomodoro Web con modal impostazioni + opacità regolabile
const POMODORO = 25 * 60; // per test rapido
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 20 * 60;

let repetitions = 4;
let currentRep = 0;
let phase = 'idle';
let remaining = POMODORO;
let running = false;
let timerId = null;

// elementi
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

const stopAudioBtn = document.getElementById('stopAudioBtn');
const timerCard = document.querySelector('.timer-card');

let previousBg = document.body.style.backgroundImage || '';

// suoni
const workEndAudio = new Audio('sounds/work_end.mp3');
const breakEndAudio = new Audio('sounds/break_end.mp3');

// input file nascosto per sfondo
const hiddenInput = document.createElement('input');
hiddenInput.type = 'file';
hiddenInput.accept = 'image/*';
hiddenInput.style.display = 'none';
document.body.appendChild(hiddenInput);

// formattazione tempo
function formatTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = (sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

// aggiornamento UI
function updateUI(){
  timeEl.textContent = formatTime(remaining);
  switch(phase){
    case 'idle': phaseEl.textContent = 'In attesa'; break;
    case 'work': phaseEl.textContent = `Lavoro (${currentRep+1}/${repetitions})`; break;
    case 'shortBreak': phaseEl.textContent = 'Pausa breve'; break;
    case 'longBreak': phaseEl.textContent = 'Pausa lunga'; break;
    case 'finished': phaseEl.textContent = 'Completato'; break;
  }
  updateButtons();
}

function updateButtons(){
  if(phase === 'idle' || phase === 'finished'){
    startBtn.classList.remove('inactive');
    pauseBtn.classList.add('inactive');
    stopBtn.classList.add('inactive');
  } else if(running){
    startBtn.classList.add('inactive');
    pauseBtn.classList.remove('inactive');
    stopBtn.classList.remove('inactive');
  } else {
    startBtn.classList.remove('inactive');
    pauseBtn.classList.add('inactive');
    stopBtn.classList.remove('inactive');
  }
}

function tick(){
  if(remaining <= 0){
    onPeriodEnd();
    return;
  }
  remaining--;
  updateUI();
}

function startTimer(){
  if(phase === 'idle' || phase === 'finished'){
    currentRep = 0;
    phase = 'work';
    remaining = POMODORO;
  }
  if(!running){
    running = true;
    timerId = setInterval(tick,1000);
  }
  updateUI();
}

function pauseTimer(){
  running = false;
  clearInterval(timerId);
  updateUI();
}

function stopTimer(){
  running = false;
  clearInterval(timerId);
  phase = 'idle';
  remaining = POMODORO;
  currentRep = 0;
  resetBackground();
  updateUI();
}

function showPhaseBackground(color, audio){
  // recupera opacità attuale
  const opacity = getComputedStyle(document.documentElement).getPropertyValue('--card-opacity') || 0.6;

  // salva colore precedente
  previousBg = timerCard.style.backgroundColor || `rgba(255,255,255,${opacity})`;

  // imposta nuovo colore con stessa opacità
  timerCard.style.backgroundColor = `rgba(${hexToRgb(color)},${opacity})`;

  stopAudioBtn.classList.remove('hidden');
  audio.currentTime = 0;
  audio.play();
}

// ripristino colore precedente
function resetBackground(){
  timerCard.style.backgroundColor = previousBg;
}

// funzione helper per convertire esadecimale -> rgb
function hexToRgb(hex) {
  hex = hex.replace('#','');
  const bigint = parseInt(hex,16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}



// tasto stop audio
stopAudioBtn.addEventListener('click', () => {
  workEndAudio.pause();
  workEndAudio.currentTime = 0;
  breakEndAudio.pause();
  breakEndAudio.currentTime = 0;
  resetBackground();
  stopAudioBtn.classList.add('hidden');
});




// gestione fine periodo
function onPeriodEnd(){
  clearInterval(timerId);
  running = false;

  if(phase === 'work'){
    // inizio pausa
    currentRep++;
    if(currentRep >= repetitions){
      phase = 'finished';
      remaining = 0;
      updateUI();
      return;
    }

    if(currentRep % 4 === 0){
      phase = 'longBreak';
      remaining = LONG_BREAK;
    } else {
      phase = 'shortBreak';
      remaining = SHORT_BREAK;
    }

    showPhaseBackground('#a0e6a0', workEndAudio); // verde pausa
    startTimer();
  }
  else if(phase === 'shortBreak' || phase === 'longBreak'){
    // fine pausa, ritorno lavoro
    phase = 'work';
    remaining = POMODORO;
    showPhaseBackground('#f28c8c', breakEndAudio); // rosso ritorno lavoro
    startTimer();
  }
  else {
    phase = 'idle';
    remaining = POMODORO;
  }

  updateUI();
}

// ripetizioni
repsInput.addEventListener('change', (e) => {
  const v = parseInt(e.target.value,10);
  if(!isNaN(v) && v > 0){
    repetitions = v;
  } else {
    repsInput.value = repetitions;
  }
  updateUI();
});

// sfondo
addBgBtn.addEventListener('click', () => hiddenInput.click());

hiddenInput.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if(!f) return;

  const reader = new FileReader();
  reader.onload = () => {
    document.body.style.backgroundImage = `url(${reader.result})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  };
  reader.readAsDataURL(f);
});

removeBgBtn.addEventListener('click', () => {
  document.body.style.backgroundImage = '';
  document.body.style.background = 'linear-gradient(135deg,#f0f4ff,#fff)';
});

// timer controls
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
stopBtn.addEventListener('click', stopTimer);

// MODAL impostazioni
settingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

// chiudi clic fuori
settingsModal.addEventListener('click', (e) => {
  if(e.target === settingsModal){
    settingsModal.classList.add('hidden');
  }
});

// controllo opacità card
opacitySlider.addEventListener('input', (e) => {
  const val = e.target.value;
  document.documentElement.style.setProperty('--card-opacity', val);
});

updateUI();


