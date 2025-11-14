/* ===== script.js - Full rewrite (all features) ===== */

/* ===== CONFIG / FORM MAPPING ===== */
const FORM_FIELD_MAP = {
  name: "entry.1040637824",
  class: "entry.1755746645",
  subject: "entry.1979136660",
  timeTaken: "entry.120322685",
  percent: "entry.1519181393",
  level1: { correct: "entry.1150173566", incorrect: "entry.28043347" },
  level2: { correct: "entry.1424808967", incorrect: "entry.352093752" },
  level3: { correct: "entry.475324608", incorrect: "entry.1767451434" },
  level4: { correct: "entry.1405337882", incorrect: "entry.1513946929" },
  level5: { correct: "entry.116543611", incorrect: "entry.1475510168" },
  level6: { correct: "entry.2131150011", incorrect: "entry.767086245" },
  level7: { correct: "entry.1966278295", incorrect: "entry.844369956" },
  level8: { correct: "entry.1728216980", incorrect: "entry.1910455979" },
  level9: { correct: "entry.1244163508", incorrect: "entry.1798293024" },
  level10:{ correct: "entry.1386510395", incorrect: "entry.140484839" },
  level11:{ correct: "entry.1057376731", incorrect: "entry.1932856854" },
  level12:{ correct: "entry.1570476410", incorrect: "entry.1307112644" }
};

/* ===== DOM ELEMENTS (match HTML) ===== */
const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");
const leftDraggables = document.getElementById("draggablesLeft");
const rightDraggables = document.getElementById("draggablesRight");
const bottomVerbs = document.getElementById("verbDraggables");
const questionArea = document.getElementById("questionArea");
const sentenceRow1 = document.getElementById("sentenceRow1");
const sentenceRow2 = document.getElementById("sentenceRow2");
const sentenceRow3 = document.getElementById("sentenceRow3");
const answerArea = document.getElementById("answerArea");
const feedbackDiv = document.getElementById("feedback");
const scoreDisplay = document.getElementById("scoreDisplay");
const checkBtn = document.getElementById("checkBtn");
const againBtn = document.getElementById("againBtn");
const finishBtn = document.getElementById("finishBtn");
const stopBtn = document.getElementById("stopBtn");
const endModal = document.getElementById("endModal");
const googleForm = document.getElementById("googleForm");
const resumeModal = document.getElementById("resumeModal");
const resumeContinue = document.getElementById("resumeContinue");
const resumeAgain = document.getElementById("resumeAgain");
const stopModal = document.getElementById("stopModal");
const stopPercent = document.getElementById("stopPercent");
const stopContinue = document.getElementById("continueBtn");
const stopAgain = document.getElementById("againBtnStop");
const stopFinish = document.getElementById("finishBtnStop");

/* ===== GAME STATE ===== */
const SAVE_KEY = "sentencesGameSave_v2";
let currentLevel = 1;        // 1..12
let roundInLevel = 0;        // 0..9
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_LEVELS = 12;

let correctCount = 0;
let incorrectCount = 0;

let levelCorrect = {};       // per-level counters
let levelIncorrect = {};
for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }

let answersHistory = [];     // {level,round,correctKeys,incorrectKeys}

let startTime = null;
let savedTimeElapsed = 0;     // seconds accumulated before pause

let usedDraggables = new Set(); // permanently removed / used items
let usedCombos = new Set();     // combos answered correctly first-try (prevent as future questions)

let formSubmittedFlag = localStorage.getItem("sentencesGame_submitted") === "1";

/* ===== VOCAB (DO NOT CHANGE) ===== */
const VOCAB = {
  topics: {
    animals: ["dog","cat","mouse","rabbit","fish","bird"],
    food: ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"],
    emotions: ["angry","annoyed","ashamed","bored","confident","confused","danger","disappointed","excited","exhausted","focus","frustrated","happy","jealous","lonely","loved","nervous","pain","proud","relax","sad","scared","shock","shy","sick","silly","stressed","support","surprised","tease","thankful","tired","worried"]
  },
  colours: ["red","green","blue","orange","yellow","pink","purple","brown","black","white"],
  numbers: ["one","two","three","four","five","six","seven","eight","nine","ten"],
  zones: ["green","blue","yellow","red"],
  verbs: ["want","have","donthave","feel"],
  helpers: { i: "i.png", see: "see.png", feel: "feel.png", what: "what.png", why: "why.png" }
};

/* ===== Helpers ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : null; }
function timeNowSeconds(){ return Math.round(Date.now()/1000); }
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = seconds || 0; startTime = Date.now(); }

/* ===== Sign path helper (matches your assets structure) ===== */
function signPathFor(word){
  if (!word) return "";
  if (VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if (VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (VOCAB.colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (VOCAB.zones.includes(word)) return `assets/signs/zones/${word}-sign.png`;
  if (VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if (Object.keys(VOCAB.helpers).includes(word)) return `assets/signs/helpers/${VOCAB.helpers[word]}`;
  return "";
}

/* ===== Level config ===== */
const levels = {
  1: {lineCount:1, type:"sign", qItems:["animals+numbers"],      dropCount:1},
  2: {lineCount:1, type:"sign", qItems:["food+colours"],        dropCount:1},
  3: {lineCount:1, type:"sign", qItems:["emotions+zones"],      dropCount:1, starter: "feel"},
  4: {lineCount:1, type:"image", qItems:["animals+numbers"],    dropCount:2},
  5: {lineCount:1, type:"image", qItems:["food+colours"],       dropCount:2},
  6: {lineCount:1, type:"image", qItems:["emotions+zones"],     dropCount:2, starter: "feel"},
  7: {lineCount:2, type:"sign", qItems:["animals+numbers","food+colours"],    dropCount:2, verb:["have","donthave"]},
  8: {lineCount:2, type:"sign", qItems:["animals+numbers","emotions+zones"],  dropCount:2, verb:["feel"]},
  9: {lineCount:2, type:"image", qItems:["animals+numbers","food+colours"],   dropCount:5, verb:["have","donthave"]},
  10:{lineCount:2, type:"image", qItems:["animals+numbers","emotions+zones"], dropCount:5, verb:["feel"]},
  11:{lineCount:3, type:"sign", qItems:["animals+numbers","emotions+zones","food+colours"], dropCount:3, verb:["feel","have","donthave"], prefillWhy:true},
  12:{lineCount:3, type:"image", qItems:["animals+numbers","emotions+zones","food+colours"], dropCount:9, verb:["feel","have","donthave"], prefillWhy:true}
};

/* ===== Candidate pools (built from VOCAB) ===== */
const candidatePool = { animals: [], food: [], emotions: [] };
(function buildCandidatePools(){
  VOCAB.topics.animals.forEach(a=>{
    VOCAB.numbers.forEach(n=>{
      candidatePool.animals.push({ key:`animals::${a}::${n}`, parts:{animal:a,number:n}, img:`assets/images/animals/${a}-${n}.png` });
    });
  });
  VOCAB.topics.food.forEach(f=>{
    VOCAB.colours.forEach(c=>{
      candidatePool.food.push({ key:`food::${f}::${c}`, parts:{food:f,colour:c}, img:`assets/images/food/${f}-${c}.png` });
    });
  });
  VOCAB.topics.emotions.forEach(e=>{
    VOCAB.zones.forEach(z=>{
      candidatePool.emotions.push({ key:`emotions::${e}::${z}`, parts:{emotion:e,zone:z}, img:`assets/images/emotions/${e}-${z}.png` });
    });
  });
})();

/* ===== expected answers holder (per question) ===== */
let expectedAnswers = []; // length == number of dropzones; expectedAnswers[i] = key or '' (accept anything)

/* ===== Render sentence rows (visuals above answer area) ===== */
function renderSentenceRows(items, level) {
  if (!sentenceRow1 || !sentenceRow2 || !sentenceRow3) return;
  [sentenceRow1, sentenceRow2, sentenceRow3].forEach(r => r.innerHTML = "");
  if (!Array.isArray(items) || items.length === 0) return;

  function appendItem(container, item){
    if (!item) return;
    if (item.isVideo) {
      const v = document.createElement('video');
      v.src = item.src; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = 'sign-video';
      container.appendChild(v);
      return;
    }
    const img = document.createElement('img');
    img.src = item.src; img.alt = item.key || ''; img.className = item.isHelper ? 'helper-img' : 'sign-img';
    img.onerror = () => { img.style.display = 'none'; };
    container.appendChild(img);
  }

  // For levels 1-6: put everything on row1
  if ((level || currentLevel) <= 6) {
    items.forEach(it => appendItem(sentenceRow1, it));
    return;
  }

  // Levels 7+: helpers row1, rest distributed
  const helpers = items.filter(it => it.isHelper);
  helpers.forEach(h => appendItem(sentenceRow1, h));
  const nonHelpers = items.filter(it => !it.isHelper);
  if(nonHelpers.length <= 5){
    nonHelpers.forEach(n=>appendItem(sentenceRow2,n));
    return;
  }
  nonHelpers.slice(0,3).forEach(n=>appendItem(sentenceRow2,n));
  nonHelpers.slice(3).forEach(n=>appendItem(sentenceRow3,n));
}

/* ===== Create draggable DOM nodes for candidates / signs ===== */
function createDraggableNodeFromCandidate(c, asSign=false, overlay=null){
  const div = document.createElement('div');
  div.className = 'draggable';
  div.draggable = false; // we use custom drag (mousedown/touchstart)
  div.dataset.key = c.key;
  div.dataset.img = c.img || '';

  if(asSign){
    const parts = (c.key||'').split('::');
    const token = parts[1] || '';
    const path = signPathFor(token) || c.img || '';
    if(path.endsWith('.mp4')){
      const v = document.createElement('video'); v.src = path; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true; v.className='sign-video'; div.appendChild(v);
    } else {
      const img = document.createElement('img'); img.src = path; img.alt = c.key; div.appendChild(img);
    }
  } else {
    const img = document.createElement('img'); img.src = c.img; img.alt = c.key; div.appendChild(img);
    if(overlay === 'have' || overlay === 'donthave'){ const ov = document.createElement('div'); ov.className = 'overlay ' + (overlay==='have'?'have':'donthave'); ov.textContent = overlay==='have'?'✓':'✕'; div.appendChild(ov); }
  }

  // add small pointer cursor
  div.style.cursor = 'grab';
  // attach dataset for selection by CSS
  return div;
}
function createDraggableNodeFromSign(key, path){
  const div=document.createElement('div'); div.className='draggable'; div.draggable=false; div.dataset.key = key;
  if(path && path.endsWith('.mp4')){
    const v=document.createElement('video'); v.src=path; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true; v.className='sign-video'; div.appendChild(v);
  } else {
    const img=document.createElement('img'); img.src=path||''; img.alt=key; div.appendChild(img);
  }
  div.style.cursor='grab';
  return div;
}

/* ===== Create dropzone and attach handlers ===== */
function createDropzone(expectedKey = "") {
  const dz = document.createElement('div');
  dz.className = 'dropzone';
  dz.dataset.expected = expectedKey || '';
  dz.dataset.filled = ''; // store dropped key here
  const ph = document.createElement('div'); ph.className='placeholder faint'; ph.textContent = '';
  dz.appendChild(ph);
  // attach dragover/drop handlers for pointer-based drags using DataTransfer (desktop native drag)
  dz.addEventListener('dragover', (e)=>{ e.preventDefault(); });
  dz.addEventListener('drop', (e)=>{
    e.preventDefault();
    const draggedId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
    if(draggedId) {
      placeDraggedIntoDropzoneByKey(dz, draggedId);
    }
  });
  // for our custom clone drag end we rely on endDrag's collision detection (no extra hook needed)
  answerArea.appendChild(dz);
  return dz;
}

/* ===== Restore draggable to side if removed (rebuild from key) ===== */
function restoreDraggableToSide(key){
  if(!key) return;
  // if there's already a draggable with that key, do nothing
  if(document.querySelector(`.draggable[data-key="${key}"]`)) return;
  if(usedDraggables.has(key)) return;
  const parts = key.split('::'); if(parts.length < 2) return;
  const topic = parts[0], a = parts[1], b = parts[2] || '';
  const c = { key, parts: {}, img: `assets/images/${topic}/${a}${b?'-'+b:''}.png` };
  if(topic === 'animals'){ c.parts.animal = a; c.parts.number = b; }
  if(topic === 'food'){ c.parts.food = a; c.parts.colour = b; }
  if(topic === 'emotions'){ c.parts.emotion = a; c.parts.zone = b; }
  // add back to the shorter side for balance
  const container = (leftDraggables && rightDraggables && leftDraggables.childElementCount <= rightDraggables.childElementCount) ? leftDraggables : rightDraggables;
  if(container) {
    container.appendChild(createDraggableNodeFromCandidate(c,false));
  }
}

/* ===== Place dragged item into a dropzone by key (used by native drop & programmatic restore) ===== */
function placeDraggedIntoDropzoneByKey(dropzone, draggedKey){
  if(!dropzone || dropzone.classList.contains('filled')) return;
  // find the original draggable element if present
  const original = document.querySelector(`.draggable[data-key="${draggedKey}"]`);
  // clone the node to put into dropzone (we don't remove the original yet; original provides source)
  const node = (original && original.cloneNode(true)) || (function(){ const d=document.createElement('div'); d.textContent='?'; return d; })();
  node.style.position = 'static';
  node.classList.remove('drag-clone');
  dropzone.innerHTML = '';
  dropzone.appendChild(node);
  dropzone.classList.add('filled');
  dropzone.dataset.filled = draggedKey;
  // if original exists, remove it from sides so students can't drag duplicate same thing simultaneously
  if(original && original.parentElement && !original.closest('.dropzone')) original.parentElement.removeChild(original);
  updateCheckVisibility();
}

/* ===== Populate draggables for a level (ensures correct items are included exactly once) ===== */
function populateDraggablesForLevel(level, questionItems, questionType, verbList) {
  if (!leftDraggables || !rightDraggables || !bottomVerbs) return;
  leftDraggables.innerHTML = '';
  rightDraggables.innerHTML = '';
  bottomVerbs.innerHTML = '';

  // number of items each side
  const sideCount = (level <= 6) ? 6 : 9;
  const totalCount = sideCount * 2; // 12 for L1–6, 18 for L7–12

  // Build pool for potential decoys
  const pool = [];
  levels[level].qItems.forEach(q => {
    q.split('+').forEach(p => {
      if (p === 'animals') candidatePool.animals.forEach(x => pool.push({ ...x, topic: 'animals' }));
      if (p === 'food') candidatePool.food.forEach(x => pool.push({ ...x, topic: 'food' }));
      if (p === 'emotions') candidatePool.emotions.forEach(x => pool.push({ ...x, topic: 'emotions' }));
      if (p === 'numbers') candidatePool.animals.forEach(x => pool.push({ ...x, topic: 'animals' }));
      if (p === 'colours') candidatePool.food.forEach(x => pool.push({ ...x, topic: 'food' }));
      if (p === 'zones') candidatePool.emotions.forEach(x => pool.push({ ...x, topic: 'emotions' }));
    });
  });

  // Filter out any already permanently used
  let availablePool = shuffleArray(pool).filter(c => !usedDraggables.has(c.key));

  // Ensure each expected answer (questionItems) is in the pool
  const requiredKeys = (questionItems || []).map(qi => qi.key).filter(Boolean);
  requiredKeys.forEach(k => {
    if (!availablePool.some(x => x.key === k)) {
      const parts = k.split('::');
      const topic = parts[0];
      let found = null;
      if (topic === 'animals') found = candidatePool.animals.find(x => x.key === k);
      if (topic === 'food') found = candidatePool.food.find(x => x.key === k);
      if (topic === 'emotions') found = candidatePool.emotions.find(x => x.key === k);
      if (found) availablePool.unshift(found);
      else {
        availablePool.unshift({
          key: k,
          img: `assets/images/${topic}/${parts[1]}${parts[2] ? '-' + parts[2] : ''}.png`
        });
      }
    }
  });

  // Always guarantee the correct answer(s) exist once
  const correctAnswers = questionItems.map(qi => qi);
  const correctKeys = correctAnswers.map(a => a.key);
  // Remove any duplicates of the correct items from pool
  availablePool = availablePool.filter(p => !correctKeys.includes(p.key));
  // Take only enough decoys to fill remaining slots
  const decoyCount = Math.max(0, totalCount - correctAnswers.length);
  const decoys = shuffleArray(availablePool).slice(0, decoyCount);

  // Combine + shuffle so correct answers aren’t always first
  let finalSet = shuffleArray([...correctAnswers, ...decoys]);

  // Split into sides
  const leftSelection = finalSet.slice(0, sideCount);
  const rightSelection = finalSet.slice(sideCount, sideCount * 2);

  // Convert to DOM nodes and append
  if (questionType === 'image') {
    leftSelection.forEach(c => leftDraggables.appendChild(createDraggableNodeFromCandidate(c, true)));
    rightSelection.forEach(c => rightDraggables.appendChild(createDraggableNodeFromCandidate(c, true)));
  } else {
    const verbIs = (verbList && verbList.length > 0) ? verbList[0] : null;
    leftSelection.forEach(c => leftDraggables.appendChild(createDraggableNodeFromCandidate(c, false, verbIs && c.topic === 'food' ? verbIs : null)));
    rightSelection.forEach(c => rightDraggables.appendChild(createDraggableNodeFromCandidate(c, false, verbIs && c.topic === 'food' ? verbIs : null)));
  }

  // Bottom verbs (if any)
  if (Array.isArray(verbList) && verbList.length) {
    verbList.forEach(v => {
      const path = signPathFor(v) || `assets/signs/verbs/${v}-sign.png`;
      bottomVerbs.appendChild(createDraggableNodeFromSign(`verb::${v}`, path));
    });
  }

  enableDragAndDrop();
}

/* ===== Check button visibility helper ===== */
function updateCheckVisibility() {
  const allDropzones = Array.from(document.querySelectorAll(".dropzone"));
  const allFilled = allDropzones.length > 0 && allDropzones.every(z => z.classList.contains("filled"));
  if (checkBtn) checkBtn.style.display = allFilled ? "block" : "none";
}

/* ===== Custom drag (clone) ===== */
let dragItem = null, dragClone = null, isTouch = false;

function startDrag(e){
  const tgt = e.target.closest('.draggable');
  if(!tgt) return;
  dragItem = tgt;
  isTouch = e.type.startsWith('touch');

  // create clone for pointer following
  const rect = tgt.getBoundingClientRect();
  dragClone = tgt.cloneNode(true);
  dragClone.classList.add('drag-clone');
  Object.assign(dragClone.style, {
    position:'fixed',
    left: (rect.left + rect.width/2) + 'px',
    top: (rect.top + rect.height/2) + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    transform: 'translate(-50%,-50%)',
    opacity: '0.85',
    pointerEvents: 'none',
    zIndex: 10000,
    cursor: 'grabbing'
  });
  document.body.appendChild(dragClone);
  e.preventDefault();

  if(isTouch){
    document.addEventListener('touchmove', moveDrag, {passive:false});
    document.addEventListener('touchend', endDrag);
  } else {
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);
  }
}

function moveDrag(e){
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){
    clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    e.preventDefault();
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }
  dragClone.style.left = clientX + 'px';
  dragClone.style.top = clientY + 'px';

  // visual overlay for dropzones (optional: highlight)
  document.querySelectorAll('.dropzone').forEach(z=>{
    const rect = z.getBoundingClientRect();
    if(clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom){
      z.classList.add('drop-target');
    } else z.classList.remove('drop-target');
  });
}

function endDrag(e){
  if(!dragItem || !dragClone) { cleanupDrag(); return; }

  let clientX, clientY;
  if (isTouch && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }

  // detect dropzone collision
  const dropzones = Array.from(document.querySelectorAll('.dropzone'));
  let placed = false;
  for(const z of dropzones){
    const rect = z.getBoundingClientRect();
    if(clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom){
      // if dropzone is already filled, ignore
      if(!z.classList.contains('filled')){
        const draggedKey = dragItem.dataset.key;
        placeDraggedIntoDropzoneByKey(z, draggedKey);
        placed = true;
        break;
      }
    }
  }

  cleanupDrag();
  if(placed) updateCheckVisibility();
}

function cleanupDrag(){
  if(dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
  dragClone = null;
  dragItem = null;
  document.removeEventListener('mousemove', moveDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', moveDrag);
  document.removeEventListener('touchend', endDrag);
  document.querySelectorAll('.dropzone').forEach(z=>z.classList.remove('drop-target'));
}

// bind pointer start to draggables container (event delegation)
document.addEventListener('mousedown', startDrag);
document.addEventListener('touchstart', startDrag, {passive:false});

/* ===== Double-tap removal (mobile) & double-click on desktop ===== */
let lastTap = 0;
if (answerArea) {
  answerArea.addEventListener('click', (ev) => {
    const dz = ev.target.closest('.dropzone');
    if (!dz) return;
    const now = Date.now();
    const doubleClick = now - lastTap < 350;
    lastTap = now;
    if (doubleClick && dz.dataset.filled) {
      const filledKey = dz.dataset.filled;
      dz.innerHTML = '';
      const ph = document.createElement('div'); ph.className='placeholder faint'; ph.textContent=''; dz.appendChild(ph);
      dz.dataset.filled = '';
      dz.classList.remove('filled','incorrect','correct');
      // restore draggable to side
      restoreDraggableToSide(filledKey);
      updateCheckVisibility();
    }
  });
}

/* ===== UI helpers ===== */
function updateScoreDisplay() {
  if (!scoreDisplay) return;
  const totalAttempts = correctCount + incorrectCount;
  scoreDisplay.textContent = `Level ${currentLevel} • Round ${roundInLevel+1} • ${correctCount}✓ ${incorrectCount}✕`;
}

/* ===== Build question (core) ===== */
function buildQuestion(){
  if(!sentenceRow1||!sentenceRow2||!sentenceRow3||!answerArea) return;
  // clear visuals and answer area
  answerArea.innerHTML=''; [sentenceRow1,sentenceRow2,sentenceRow3].forEach(r=>r.innerHTML=''); if(feedbackDiv) feedbackDiv.innerHTML=''; if(checkBtn) checkBtn.style.display='none'; if(againBtn) againBtn.style.display='none';
  updateScoreDisplay();

  const lvl = levels[currentLevel];
  if(!lvl) return;

  // helper visuals
  const helperVerb = lvl.starter || (lvl.verb && lvl.verb[0]) || 'see';
  const helperItems = [
    { src: signPathFor('i'), isVideo: false, isHelper:true },
    { src: signPathFor(helperVerb), isVideo: (helperVerb && helperVerb.endsWith('.mp4')), isHelper:true },
    { src: signPathFor('what'), isVideo:false, isHelper:true }
  ];

  // build pool and choose questionItems
  const pool = [];
  lvl.qItems.forEach(q=> q.split('+').forEach(topic=>{
    if(topic==='animals') candidatePool.animals.forEach(x=>pool.push(Object.assign({topic:'animals'}, x)));
    if(topic==='food') candidatePool.food.forEach(x=>pool.push(Object.assign({topic:'food'}, x)));
    if(topic==='emotions') candidatePool.emotions.forEach(x=>pool.push(Object.assign({topic:'emotions'}, x)));
    if(topic==='numbers') candidatePool.animals.forEach(x=>pool.push(Object.assign({topic:'animals'}, x)));
    if(topic==='colours') candidatePool.food.forEach(x=>pool.push(Object.assign({topic:'food'}, x)));
    if(topic==='zones') candidatePool.emotions.forEach(x=>pool.push(Object.assign({topic:'emotions'}, x)));
  }));

  const filtered = shuffleArray(pool).filter(c => !usedCombos.has(c.key) && !usedDraggables.has(c.key));
  const desiredCount = typeof lvl.dropCount === 'number' ? lvl.dropCount : 1;

  // choose questionItems
  let questionItems = [];
  if(lvl.qItems.length === 1 && lvl.qItems[0] === 'animals+numbers'){
    const pick = randomItem(candidatePool.animals.filter(c=>!usedCombos.has(c.key) && !usedDraggables.has(c.key)));
    if(pick) questionItems.push(pick);
  } else {
    questionItems = filtered.slice(0, Math.max(1, Math.min(desiredCount, filtered.length)));
  }

  // build sentence visuals
  const sentenceSources = [];
  helperItems.forEach(h => sentenceSources.push(Object.assign({}, h)));

  questionItems.forEach(qi => {
    if(qi.key && qi.key.startsWith('animals::')){
      const parts = qi.key.split('::');
      const animal = parts[1]; const number = parts[2];
      if(lvl.type === 'sign'){
        sentenceSources.push({ src: signPathFor(animal), isVideo:false, key: qi.key });
        sentenceSources.push({ src: signPathFor(number), isVideo:false, key: qi.key });
      } else {
        sentenceSources.push({ src: qi.img, isVideo:false, key: qi.key });
      }
      return;
    }
    // FOOD + COLOURS (Level 2, Level 5)
    if(qi.key && qi.key.startsWith('food::')) {
        const parts = qi.key.split('::');
        const food = parts[1];
        const colour = parts[2];
        if (lvl.type === 'sign') {
        // show TWO SIGNS:   FOOD SIGN   +   COLOUR SIGN
            sentenceSources.push({
                src: signPathFor(food),
                isVideo: false,
                key: qi.key
            });
            sentenceSources.push({
                src: signPathFor(colour),
                isVideo: false,
                key: qi.key
            });
        } else {
            // image mode: composite image
            sentenceSources.push({
                src: qi.img,
                isVideo: false,
                key: qi.key
            });
        }
        return;
    }
        // EMOTIONS + ZONES (Levels 3,6,8,10,11,12)
    if (qi.key && qi.key.startsWith('emotions::')) {
        const parts = qi.key.split('::');
        const emotion = parts[1];
        const zone = parts[2];
        if (lvl.type === 'sign') {
            // emotion is ALWAYS a video (mp4)
            sentenceSources.push({
                src: signPathFor(emotion),
                isVideo: true,
                key: qi.key
            });
            // zone is ALWAYS a PNG sign
            sentenceSources.push({
                src: signPathFor(zone),
                isVideo: false,
                key: qi.key
            });
            } else {
            // IMAGE MODE → use composite image
            sentenceSources.push({
                src: qi.img,
                isVideo: false,
                key: qi.key
            });
        }
        return;
    }

    if(lvl.type === 'image'){
      sentenceSources.push({ src: qi.img, isVideo:false, key: qi.key });
    } else {
      const token = (qi.key||'').split('::')[1] || '';
      sentenceSources.push({ src: signPathFor(token) || qi.img, isVideo: (signPathFor(token) || qi.img).endsWith('.mp4'), key: qi.key });
    }
  });

  if(lvl.prefillWhy) sentenceSources.push({ src: signPathFor('why'), isVideo:false, isHelper:true });

  renderSentenceRows(sentenceSources, currentLevel);

  // build dropzones and expectedAnswers
  answerArea.innerHTML = '';
  expectedAnswers = [];
  if(questionItems.length){
    if(questionItems.length === 1 && desiredCount === 1){
      expectedAnswers.push(questionItems[0].key);
      createDropzone(questionItems[0].key);
    } else {
      for(let i=0;i<desiredCount;i++){
        const expected = (questionItems[i] && questionItems[i].key) ? questionItems[i].key : '';
        expectedAnswers.push(expected);
        createDropzone(expected);
      }
    }
  } else {
    for(let i=0;i<desiredCount;i++){
      expectedAnswers.push('');
      createDropzone('');
    }
  }

  // populate draggables opposite to question type
  populateDraggablesForLevel(currentLevel, questionItems, lvl.type, lvl.verb || []);
  // attach dataTransfer support to left/right children for native dragging (optional)
  attachNativeDragHandlers();

  // hide check until all dropzones filled
  updateCheckVisibility();
}

/* ===== Attach native dragstart on side draggables so drag & drop (desktop) works too ===== */
function attachNativeDragHandlers(){
  // set draggable true for native drag for those devices
  document.querySelectorAll('.draggable').forEach(d=>{
    d.setAttribute('draggable','true');
    d.addEventListener('dragstart', (ev)=>{
      try{ ev.dataTransfer.setData('text/plain', d.dataset.key); }
      catch(e){}
    });
  });
}

/* ===== Check function (single place) ===== */
if(checkBtn){
  checkBtn.addEventListener('click', async ()=>{
    // disable to avoid double clicks
    checkBtn.style.display = 'none';
    const dzs = Array.from(answerArea.querySelectorAll('.dropzone'));
    let allCorrect = true;
    const thisRoundCorrect = [];
    const thisRoundIncorrect = [];

    dzs.forEach((dz, i) => {
      const filledKey = dz.dataset.filled || '';
      const expected = dz.dataset.expected || '';
      // clear previous markers
      dz.classList.remove('correct','incorrect');
      if(!filledKey){
        dz.classList.add('incorrect');
        thisRoundIncorrect.push(null);
        allCorrect = false;
      } else {
        if(expected){
          if(filledKey === expected){
            dz.classList.add('correct');
            thisRoundCorrect.push(filledKey);
          } else {
            dz.classList.add('incorrect');
            thisRoundIncorrect.push(filledKey);
            allCorrect = false;
          }
        } else {
          // no expected key => accept as correct
          dz.classList.add('correct');
          thisRoundCorrect.push(filledKey);
        }
      }
    });

    // If any incorrect: restore them back to side and reset those dropzones
    if(!allCorrect){
      // show wrong icon feedback quickly
      if(feedbackDiv){ feedbackDiv.innerHTML=''; const fb=document.createElement('img'); fb.src='assets/wrong.png'; fb.alt='Wrong'; fb.style.maxWidth='120px'; feedbackDiv.appendChild(fb); }
      // restore incorrect after a short delay so students see mark
      setTimeout(()=>{
        dzs.forEach(dz=>{
          if(dz.classList.contains('incorrect') && dz.dataset.filled){
            const wrongKey = dz.dataset.filled;
            // put draggable back into a side pool
            restoreDraggableToSide(wrongKey);
            // reset dropzone
            dz.innerHTML = ''; const ph=document.createElement('div'); ph.className='placeholder faint'; ph.textContent=''; dz.appendChild(ph);
            dz.dataset.filled = '';
            dz.classList.remove('filled','incorrect','correct');
          }
        });
        if(feedbackDiv) feedbackDiv.innerHTML = '';
        updateCheckVisibility();
      }, 600);
      // also record incorrect keys for stats (but don't mark them permanently used)
      thisRoundIncorrect.forEach(k => { if(k){ levelIncorrect[currentLevel] = (levelIncorrect[currentLevel]||0) + 1; incorrectCount++; } });
      answersHistory.push({ level: currentLevel, round: roundInLevel, correct: thisRoundCorrect.slice(), incorrect: thisRoundIncorrect.slice() });
      saveProgress();
      return;
    }

    // All correct branch: commit the used draggables
    dzs.forEach(dz => {
      if(dz.dataset.filled){
        usedDraggables.add(dz.dataset.filled);
      }
    });
    thisRoundCorrect.forEach(k => { if(k) usedCombos.add(k); });

    // increment stats
    levelCorrect[currentLevel] = (levelCorrect[currentLevel]||0) + dzs.length;
    correctCount += dzs.length;

    // feedback
    if(feedbackDiv){ feedbackDiv.innerHTML=''; const fb=document.createElement('img'); fb.src='assets/correct.png'; fb.alt='Correct'; fb.style.maxWidth='120px'; feedbackDiv.appendChild(fb); }

    answersHistory.push({ level: currentLevel, round: roundInLevel, correct: thisRoundCorrect.slice(), incorrect: [] });
    saveProgress();

    // progress to next question after tiny delay
    setTimeout(async ()=>{
      if(feedbackDiv) feedbackDiv.innerHTML = '';
      // if finished level
      if(roundInLevel + 1 >= QUESTIONS_PER_LEVEL){
        if(currentLevel < TOTAL_LEVELS){
          currentLevel++; roundInLevel = 0;
          buildQuestion();
        } else {
          await finalSubmitThenEnd();
        }
      } else {
        roundInLevel++;
        buildQuestion();
      }
    }, 750);
  });
}

/* ===== Again button ===== */
if(againBtn){
  againBtn.addEventListener('click', ()=>{
    document.querySelectorAll('.dropzone').forEach(dz=>{
      dz.innerHTML = ''; const ph=document.createElement('div'); ph.className='placeholder faint'; ph.textContent=''; dz.appendChild(ph);
      dz.dataset.filled = ''; dz.classList.remove('filled','incorrect','correct');
    });
    againBtn.style.display = 'none';
    updateCheckVisibility();
  });
}

/* ===== Save / Load / Clear progress ===== */
function saveProgress(){
  const payload = {
    studentName: studentNameSpan ? studentNameSpan.textContent : '',
    studentClass: studentClassSpan ? studentClassSpan.textContent : '',
    currentLevel, roundInLevel, correctCount, incorrectCount, levelCorrect, levelIncorrect, answersHistory,
    savedTimeElapsed: getTimeElapsed(),
    usedDraggables: Array.from(usedDraggables),
    usedCombos: Array.from(usedCombos)
  };
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }catch(e){ console.warn('save failed', e); }
}
function loadProgress(){
  try{ const raw = localStorage.getItem(SAVE_KEY); if(!raw) return null; return JSON.parse(raw); }catch(e){ return null; }
}
function clearProgress(){ try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem('sentencesGame_submitted'); }catch(e){} }

/* ===== Restore progress ===== */
function restoreProgress(saved){
  if(!saved) return;
  currentLevel = Number(saved.currentLevel) || 1;
  roundInLevel = Number(saved.roundInLevel) || 0;
  correctCount = Number(saved.correctCount) || 0;
  incorrectCount = Number(saved.incorrectCount) || 0;
  levelCorrect = saved.levelCorrect || levelCorrect;
  levelIncorrect = saved.levelIncorrect || levelIncorrect;
  answersHistory = saved.answersHistory || [];
  savedTimeElapsed = Number(saved.savedTimeElapsed) || 0;
  usedDraggables = new Set(saved.usedDraggables || []);
  usedCombos = new Set(saved.usedCombos || []);
  setTimeElapsed(saved.savedTimeElapsed || 0);
}

/* ===== Google Form submit, final modal, resume/stop logic ===== */
async function submitToGoogleForm(silent=true){
  if(!googleForm) return false;
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if(totalCorrect < 1) return false;
  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentNameSpan ? studentNameSpan.textContent : '');
  fd.append(FORM_FIELD_MAP.class, studentClassSpan ? studentClassSpan.textContent : '');
  fd.append(FORM_FIELD_MAP.subject, 'Sentences');
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);
  for(let lvl=1; lvl<=TOTAL_LEVELS; lvl++){
    fd.append(FORM_FIELD_MAP[`level${lvl}`].correct, levelCorrect[lvl] || 0);
    fd.append(FORM_FIELD_MAP[`level${lvl}`].incorrect, levelIncorrect[lvl] || 0);
  }
  try{
    await fetch(googleForm.action, { method:'POST', body:fd, mode:'no-cors' });
    formSubmittedFlag = true;
    localStorage.setItem('sentencesGame_submitted','1');
    return true;
  }catch(e){
    console.warn('Form submission failed:', e);
    return false;
  }
}

async function finalSubmitThenEnd(){
  await submitToGoogleForm(true);
  clearProgress();
  const finalTime = document.getElementById('finalTime');
  const finalScore = document.getElementById('finalScore');
  const finalPercent = document.getElementById('finalPercent');
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if(finalTime) finalTime.textContent = getTimeElapsed() + 's';
  if(finalScore) finalScore.textContent = `${totalCorrect} / ${totalAttempts}`;
  if(finalPercent) finalPercent.textContent = `${percent}%`;
  if(endModal){ endModal.style.display = 'flex'; endModal.style.zIndex = 6000; }
}

/* ===== Resume modal logic ===== */
function showResumeModalIfNeeded(){
  const saved = loadProgress();
  if(saved){
    if(resumeModal){
      resumeModal.style.display='flex'; resumeModal.style.zIndex=6000;
      if(resumeContinue){
        resumeContinue.onclick = ()=>{
          resumeModal.style.display='none';
          restoreProgress(saved);
          buildQuestion();
          startTime = Date.now();
        };
      }
      if(resumeAgain){
        resumeAgain.onclick = ()=>{
          resumeModal.style.display='none';
          clearProgress();
          usedDraggables.clear(); usedCombos.clear();
          currentLevel = 1; roundInLevel = 0;
          buildQuestion(); setTimeElapsed(0);
        };
      }
      return;
    }
  }
  setTimeElapsed(0); startTime = Date.now(); buildQuestion();
}

/* ===== STOP modal logic ===== */
if(stopBtn){
  stopBtn.addEventListener('click', ()=>{
    savedTimeElapsed = getTimeElapsed();
    startTime = null;
    const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
    const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
    const total = totalCorrect + totalIncorrect;
    const percent = total > 0 ? Math.round((totalCorrect/total)*100) : 0;
    if(stopPercent) stopPercent.textContent = `Score so far: ${percent}% — Time: ${getTimeElapsed()}s`;
    if(stopModal){ stopModal.style.display='flex'; stopModal.style.zIndex = 6000; }
  });
}
if(stopContinue) stopContinue && stopContinue.addEventListener('click', ()=>{ if(stopModal) stopModal.style.display='none'; setTimeElapsed(savedTimeElapsed); });
if(stopAgain) stopAgain && stopAgain.addEventListener('click', async ()=>{
  if(stopModal) stopModal.style.display='none';
  await submitToGoogleForm(true);
  usedDraggables.clear(); usedCombos.clear();
  for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
  correctCount=0; incorrectCount=0; answersHistory=[];
  currentLevel=1; roundInLevel=0; setTimeElapsed(0);
  buildQuestion();
});
if(stopFinish) stopFinish && stopFinish.addEventListener('click', async ()=>{
  if(stopModal) stopModal.style.display='none';
  await submitToGoogleForm(true);
  window.location.href = '../index.html';
});

/* ===== Init on load ===== */
window.addEventListener('load', ()=>{
  let studentName = localStorage.getItem('studentName') || '';
  let studentClass = localStorage.getItem('studentClass') || '';
  if(!studentName || !studentClass){ alert('Please log in first.'); try{ window.location.href = '../index.html'; }catch(e){} return; }
  if(studentNameSpan) studentNameSpan.textContent = studentName;
  if(studentClassSpan) studentClassSpan.textContent = studentClass;
  if(finishBtn) finishBtn.addEventListener('click', ()=>{ window.location.href = '../index.html'; });
  showResumeModalIfNeeded();
});

/* ===== Expose small helpers for debugging (optional) ===== */
window._sentences = { buildQuestion, levels, candidatePool, expectedAnswers, saveProgress, loadProgress };

/* ===== End of script.js ===== */
