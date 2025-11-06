/* ===== script.js - Full working version with fixes ===== */

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

/* ===== DOM ELEMENTS ===== */
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
let currentLevel = 1;
let roundInLevel = 0;
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_LEVELS = 12;

let correctCount = 0;
let incorrectCount = 0;

let levelCorrect = {};
let levelIncorrect = {};
for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }

let answersHistory = [];

let startTime = null;
let savedTimeElapsed = 0;

let usedDraggables = new Set();
let usedCombos = new Set();

let formSubmittedFlag = localStorage.getItem("sentencesGame_submitted") === "1";

/* ===== VOCAB ===== */
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

/* ===== Sign path helper ===== */
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

/* ===== Candidate pools ===== */
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

/* ===== expected answers holder ===== */
let expectedAnswers = [];

/* ===== Render sentence rows ===== */
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
    img.onerror = () => { img.style.display = 'none'; if(!container.querySelector('.fallback')){ const f=document.createElement('div'); f.className='fallback'; f.textContent = ''; container.appendChild(f);} };
    container.appendChild(img);
  }

  if ((level || currentLevel) <= 6) {
    items.forEach(it => appendItem(sentenceRow1, it));
    return;
  }

  const helpers = items.filter(it => it.isHelper);
  helpers.forEach(h => appendItem(sentenceRow1, h));

  const nonHelpers = items.filter(it => !it.isHelper);
  if(nonHelpers.length <= 5){ nonHelpers.forEach(n=>appendItem(sentenceRow2,n)); return; }
  nonHelpers.slice(0,3).forEach(n=>appendItem(sentenceRow2,n));
  nonHelpers.slice(3).forEach(n=>appendItem(sentenceRow3,n));
}

/* ===== Create draggable nodes ===== */
function createDraggableNodeFromCandidate(c, asSign=false, overlay=null){
  const div = document.createElement('div'); div.className='draggable'; div.draggable=true; div.dataset.key = c.key; div.dataset.img = c.img || '';

  if(asSign){
    const parts = (c.key||'').split('::');
    const token = parts[1] || '';
    const path = signPathFor(token) || c.img || '';
    if(path.endsWith('.mp4')){ const v=document.createElement('video'); v.src=path; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true; v.className='sign-video'; div.appendChild(v);} 
    else { const img=document.createElement('img'); img.src=path; img.alt=c.key; img.onerror=()=>{ img.style.display='none'; if(!div.querySelector('.fallback')){ const f=document.createElement('div'); f.className='fallback'; f.textContent=(c.parts && (c.parts.animal||c.parts.food||c.parts.emotion))||token; div.appendChild(f);} }; div.appendChild(img); }
  } else {
    const img=document.createElement('img'); img.src=c.img; img.alt=c.key; img.onerror=()=>{ img.style.display='none'; if(!div.querySelector('.fallback')){ const f=document.createElement('div'); f.className='fallback'; f.textContent=(c.parts && (c.parts.animal||c.parts.food||c.parts.emotion)) + (c.parts && c.parts.number?`-${c.parts.number}`:''); div.appendChild(f);} }; div.appendChild(img);
    if(overlay === 'have' || overlay === 'donthave'){ const ov=document.createElement('div'); ov.className='overlay ' + (overlay==='have'?'have':'donthave'); ov.textContent = overlay==='have'?'✓':'✕'; div.appendChild(ov);} 
  }

  div.addEventListener('dragstart', e => { try{ e.dataTransfer.setData('text/plain', div.dataset.key); }catch{} });
  return div;
}

/* ===== Create draggable simple sign ===== */
function createDraggableNodeFromSign(key, path){
  const div=document.createElement('div'); div.className='draggable'; div.draggable=true; div.dataset.key = key;
  if(path && path.endsWith('.mp4')){
    const v=document.createElement('video'); v.src=path; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true; v.className='sign-video'; div.appendChild(v);
  } else {
    const img=document.createElement('img'); img.src=path||''; img.alt=key; img.onerror=()=>{ img.style.display='none'; if(!div.querySelector('.fallback')){ const f=document.createElement('div'); f.className='fallback'; f.textContent=key; div.appendChild(f);} }; div.appendChild(img);
  }
  div.addEventListener('dragstart', e=>{ try{ e.dataTransfer.setData('text/plain', div.dataset.key); }catch{} });
  return div;
}

/* ===== Create dropzone ===== */
function createDropzone(placeholderText = "", expectedKey = ""){
  const dz = document.createElement('div'); dz.className='dropzone'; dz.dataset.expected = expectedKey || ''; dz.dataset.filled = '';
  const ph = document.createElement('div'); ph.className='placeholder faint'; ph.textContent = placeholderText || '';
  dz.appendChild(ph); answerArea.appendChild(dz); return dz;
}

/* ===== Restore draggable to side ===== */
function restoreDraggableToSide(key){
  if(!key) return; if(document.querySelector(`.draggable[data-key="${key}"]`)) return; if(usedDraggables.has(key)) return;
  const parts = key.split('::'); if(parts.length<2) return; const topic=parts[0], a=parts[1], b=parts[2]||'';
  const c = { key, parts:{}, img:`assets/images/${topic}/${a}${b?'-'+b:''}.png` };
  if(topic==='animals'){ c.parts.animal=a; c.parts.number=b; }
  if(topic==='food'){ c.parts.food=a; c.parts.colour=b; }
  if(topic==='emotions'){ c.parts.emotion=a; c.parts.zone=b; }
  const container = (leftDraggables && rightDraggables && leftDraggables.childElementCount <= rightDraggables.childElementCount) ? leftDraggables : rightDraggables;
  if(container) container.appendChild(createDraggableNodeFromCandidate(c,false));
}

/* ===== Populate draggables for a level ===== */
function populateDraggablesForLevel(level, questionItems, questionType, verbList){
  if(!leftDraggables || !rightDraggables || !bottomVerbs) return;
  leftDraggables.innerHTML = '';
  rightDraggables.innerHTML = '';
  bottomVerbs.innerHTML = '';
  const sideCount = (level <= 6) ? 6 : 9;

  const pool = [];
  levels[level].qItems.forEach(q=>{
    q.split('+').forEach(p=>{
      if(p==='animals') candidatePool.animals.forEach(x=>pool.push(Object.assign({topic:'animals'}, x)));
      if(p==='food') candidatePool.food.forEach(x=>pool.push(Object.assign({topic:'food'}, x)));
      if(p==='emotions') candidatePool.emotions.forEach(x=>pool.push(Object.assign({topic:'emotions'}, x)));
      if(p==='numbers') candidatePool.animals.forEach(x=>pool.push(Object.assign({topic:'animals'}, x)));
      if(p==='colours') candidatePool.food.forEach(x=>pool.push(Object.assign({topic:'food'}, x)));
      if(p==='zones') candidatePool.emotions.forEach(x=>pool.push(Object.assign({topic:'emotions'}, x)));
    });
  });

  const shuffled = shuffleArray(pool).filter(c=>!usedDraggables.has(c.key));
  const leftSelection = shuffled.slice(0, sideCount);
  const rightSelection = shuffled.slice(sideCount, sideCount*2);

  if(questionType === 'image'){
    leftSelection.forEach(c=> leftDraggables.appendChild(createDraggableNodeFromCandidate(c,false)));
    rightSelection.forEach(c=> rightDraggables.appendChild(createDraggableNodeFromCandidate(c,false)));
  } else {
    leftSelection.forEach(c=> leftDraggables.appendChild(createDraggableNodeFromCandidate(c,true)));
    rightSelection.forEach(c=> rightDraggables.appendChild(createDraggableNodeFromCandidate(c,true)));
  }

  if(Array.isArray(verbList)){
    verbList.forEach(v=>{
      const path = signPathFor(v);
      bottomVerbs.appendChild(createDraggableNodeFromSign(v,path));
    });
  }
}

/* ===== DRAG & DROP EVENTS ===== */
answerArea.addEventListener('dragover', e => e.preventDefault());
answerArea.addEventListener('drop', e=>{
  e.preventDefault(); const dz = e.target.closest('.dropzone'); if(!dz) return;
  const key = e.dataTransfer.getData('text/plain'); if(!key) return;
  const draggedEl = document.querySelector(`.draggable[data-key="${key}"]`);
  if(!draggedEl) return;

  if(dz.dataset.filled){ restoreDraggableToSide(dz.dataset.filled); dz.dataset.filled=''; dz.innerHTML=''; dz.appendChild(createDropPlaceholder()); }

  dz.appendChild(draggedEl); dz.dataset.filled=key; checkBtn.style.display='inline-block';
});

/* ===== Placeholder for dropzone ===== */
function createDropPlaceholder(){
  const ph = document.createElement('div'); ph.className='placeholder faint'; ph.textContent='Drop here'; return ph;
}

/* ===== Check answers ===== */
checkBtn.addEventListener('click', ()=>{
  const dzs = Array.from(answerArea.querySelectorAll('.dropzone'));
  dzs.forEach(dz=>{
    const filledKey = dz.dataset.filled;
    const expectedKey = dz.dataset.expected;
    if(!filledKey) return;
    if(filledKey === expectedKey){
      dz.classList.add('correct'); correctCount++; levelCorrect[currentLevel]++; answersHistory.push({level:currentLevel,key:filledKey,result:'correct'});
      dz.querySelector('.draggable').style.pointerEvents='none';
    } else {
      dz.classList.add('incorrect'); incorrectCount++; levelIncorrect[currentLevel]++; answersHistory.push({level:currentLevel,key:filledKey,result:'incorrect'});
      restoreDraggableToSide(filledKey);
      dz.dataset.filled=''; dz.innerHTML=''; dz.appendChild(createDropPlaceholder());
    }
  });
  checkBtn.style.display='none';
  scoreDisplay.textContent=`Correct: ${correctCount} | Incorrect: ${incorrectCount}`;
});

/* ===== Next question / Level logic ===== */
function nextRoundOrLevel(){
  roundInLevel++;
  if(roundInLevel>=QUESTIONS_PER_LEVEL){
    roundInLevel=0; currentLevel++;
    if(currentLevel>TOTAL_LEVELS){
      endGame(); return;
    }
  }
  setupRound();
}

/* ===== Setup a round ===== */
function setupRound(){
  expectedAnswers=[]; answerArea.innerHTML=''; feedbackDiv.innerHTML=''; checkBtn.style.display='none';
  const levelData = levels[currentLevel];
  const itemsForRow = [];
  levelData.qItems.forEach(q=>{
    const parts = q.split('+'); const chosenTopic = parts[0];
    const candidateArr = candidatePool[chosenTopic];
    if(candidateArr && candidateArr.length) itemsForRow.push(candidateArr[Math.floor(Math.random()*candidateArr.length)]);
  });
  itemsForRow.forEach(it=>{ it.src = it.img; });
  renderSentenceRows(itemsForRow,currentLevel);
  populateDraggablesForLevel(currentLevel, itemsForRow, levelData.type, levelData.verb);
  itemsForRow.forEach(it=>{ const dz = createDropzone(it.parts.animal||it.parts.food||it.parts.emotion, it.key); answerArea.appendChild(dz); expectedAnswers.push(it.key); });
}

/* ===== End game ===== */
function endGame(){
  stopModal.style.display='none'; endModal.style.display='block';
  const percent = Math.round((correctCount/(correctCount+incorrectCount))*100);
  document.getElementById("endPercent").textContent = percent + '%';
  sendToGoogleForms();
}

/* ===== Google Forms Submission ===== */
function sendToGoogleForms(){
  if(formSubmittedFlag) return;
  const url = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse";
  const data = new FormData();
  data.append(FORM_FIELD_MAP.name, studentNameSpan.textContent);
  data.append(FORM_FIELD_MAP.class, studentClassSpan.textContent);
  data.append(FORM_FIELD_MAP.subject, "Sentences");
  data.append(FORM_FIELD_MAP.timeTaken, getTimeElapsed());
  data.append(FORM_FIELD_MAP.percent, Math.round((correctCount/(correctCount+incorrectCount))*100));
  for(let i=1;i<=TOTAL_LEVELS;i++){
    data.append(FORM_FIELD_MAP[`level${i}`].correct, levelCorrect[i]);
    data.append(FORM_FIELD_MAP[`level${i}`].incorrect, levelIncorrect[i]);
  }
  fetch(url, { method:"POST", body:data, mode:"no-cors" }).then(()=>{ localStorage.setItem("sentencesGame_submitted","1"); formSubmittedFlag=true; });
}

/* ===== Initialize game ===== */
function initGame(){
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  if(saved && saved.currentLevel){
    resumeModal.style.display='block';
    resumeContinue.onclick=()=>{ resumeModal.style.display='none'; currentLevel=saved.currentLevel; roundInLevel=saved.round; correctCount=saved.correct; incorrectCount=saved.incorrect; setupRound(); };
    resumeAgain.onclick=()=>{ resumeModal.style.display='none'; localStorage.removeItem(SAVE_KEY); currentLevel=1; roundInLevel=0; correctCount=0; incorrectCount=0; setupRound(); };
  } else { currentLevel=1; roundInLevel=0; setupRound(); }
}

/* ===== Auto-save state ===== */
setInterval(()=>{
  localStorage.setItem(SAVE_KEY, JSON.stringify({ currentLevel, round:roundInLevel, correct:correctCount, incorrect:incorrectCount }));
}, 5000);

/* ===== Start ===== */
window.addEventListener('load', ()=>{
  startTime = Date.now();
  initGame();
});
