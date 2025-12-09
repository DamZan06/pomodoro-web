// app.js - Pomodoro Web con pulsanti sempre visibili e sfondo testuale

const POMODORO = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 20 * 60;

let repetitions = 4;
let currentRep = 0;
let phase = 'idle'; // 'idle'|'work'|'shortBreak'|'longBreak'|'finished'
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
const removeBgBtn = document.getElementById('removeBgBtn');
const addBgBtn = document.getElementById('addBgBtn');

// input file nascosto per aggiungere sfondo
const hiddenInput = document.createElement('input');
hiddenInput.type = 'file';
hiddenInput.accept = 'image/*';
hiddenInput.style.display = 'none';
document.body.appendChild(hiddenInput);

// formato tempo MM:SS
function formatTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = (sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

// aggiorna UI e pulsanti
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

// aggiorna lo stato dei pulsanti
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

// tick timer
function tick(){
  if(remaining <= 0){
    onPeriodEnd();
    return;
  }
  remaining--;
  updateUI();
}

// avvia o riprendi timer
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

// pausa timer
function pauseTimer(){
  running = false;
  clearInterval(timerId);
  updateUI();
}

// stop timer
function stopTimer(){
  running = false;
  clearInterval(timerId);
  phase = 'idle';
  remaining = POMODORO;
  currentRep = 0;
  updateUI();
}

// gestione fine periodo
function onPeriodEnd(){
  clearInterval(timerId);
  running = false;

  if(phase === 'work'){
    currentRep++;
    if(currentRep >= repetitions){
      phase = 'finished';
      remaining = 0;
      updateUI();
      return;
    }
    if(currentRep % 4 === 0) {
      phase = 'longBreak';
      remaining = LONG_BREAK;
    } else {
      phase = 'shortBreak';
      remaining = SHORT_BREAK;
    }
    startTimer(); // parte automaticamente
  } else if(phase === 'shortBreak' || phase === 'longBreak'){
    phase = 'work';
    remaining = POMODORO;
    startTimer();
  } else {
    phase = 'idle';
    remaining = POMODORO;
  }
  updateUI();
}

// gestione input ripetizioni
repsInput.addEventListener('change', (e) => {
  const v = parseInt(e.target.value,10);
  if(!isNaN(v) && v > 0){
    repetitions = v;
  } else {
    repsInput.value = repetitions;
  }
  updateUI();
});

// gestione pulsanti sfondo
addBgBtn.addEventListener('click', () => hiddenInput.click());

hiddenInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
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

// eventi pulsanti timer
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
stopBtn.addEventListener('click', stopTimer);

// inizializza
updateUI();
