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

const levels = {
  1: { lineCount: 1, type: "sign", qItems: ["animal", "number"] },
  2: { lineCount: 1, type: "sign", qItems: ["food", "colour"] },
  3: { lineCount: 1, type: "sign", qItems: ["emotion", "zone"], starter: "feel" },
  4: { lineCount: 1, type: "image", qItems: ["animal", "number"] },
  5: { lineCount: 1, type: "image", qItems: ["food", "colour"] },
  6: { lineCount: 1, type: "image", qItems: ["emotion", "zone"], starter: "feel" },
  7: { lineCount: 2, type: "sign", qItems: ["animal+number","food+colour"], verb: ["has","donthave"] },
  8: { lineCount: 2, type: "sign", qItems: ["animal+number","emotion+zone"], verb: ["feel"] },
  9: { lineCount: 2, type: "image", qItems: ["animal+number","food+colour"], verb: ["has","donthave"] },
  10:{ lineCount: 2, type: "image", qItems: ["animal+number","emotion+zone"], verb: ["feel"] },
  11:{ lineCount: 3, type: "sign", qItems: ["animal+number","emotion+zone","food+colour"], verb: ["feel","has","donthave"] },
  12:{ lineCount: 3, type: "image", qItems: ["animal+number","emotion+zone","food+colour"], verb: ["feel","has","donthave"] },
};

/* ===== DOM Elements ===== */
const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");
const scoreDisplay = document.getElementById("scoreDisplay");
const stopBtn = document.getElementById("stopBtn");
const leftDraggables = document.getElementById("draggablesLeft");
const rightDraggables = document.getElementById("draggablesRight");
const questionArea = document.getElementById("questionArea");
const answerArea = document.getElementById("answerArea");
const feedbackDiv = document.getElementById("feedback");
const checkBtn = document.getElementById("checkBtn");
const againBtn = document.getElementById("againBtn");
const endModal = document.getElementById("endModal");
const finishBtn = document.getElementById("finishBtn");
const againBtnEnd = document.getElementById("againBtnEnd");
const googleForm = document.getElementById("googleForm");
const topicModal = document.getElementById("topicModal");
const resumeModal = document.getElementById("resumeModal");
const resumeMessage = document.getElementById("resumeMessage");
const resumeContinue = document.getElementById("resumeContinue");
const resumeAgain = document.getElementById("resumeAgain");
const stopModal = document.getElementById("stopModal");
const stopPercent = document.getElementById("stopPercent");
const stopContinue = document.getElementById("continueBtn");
const stopAgain = document.getElementById("againBtnStop");
const stopFinish = document.getElementById("finishBtnStop");

/* ===== STUDENT INFO (expected to be set earlier in index) ===== */
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;
}

/* ===== GAME STATE ===== */
const SAVE_KEY = "sentencesGameSave_v1";
let currentLevel = 1;        // 1..12
let roundInLevel = 0;        // 0..9 (10 questions per level)
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
  verbs: ["want","have","donthave"],
  helpers: { i: "assets/signs/helpers/i.png", see: "assets/signs/helpers/see.png", feel: "assets/signs/helpers/feel.png", what: "assets/signs/helpers/what.png" }
};

/* ===== Helpers ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
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
  if (VOCAB.zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if (VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if (Object.values(VOCAB.helpers).includes(word)) return word;
  return "";
}

/* ===== Sentence rendering ===== */
function renderSentenceRows(signs){
  const row1 = document.getElementById("sentenceRow1");
  const row2 = document.getElementById("sentenceRow2");
  const row3 = document.getElementById("sentenceRow3");
  [row1,row2,row3].forEach(r=>r.innerHTML="");
  if(signs.length<=3){ signs.forEach(s=>appendSign(row1,s)); }
  else if(signs.length<=6){ signs.slice(0,3).forEach(s=>appendSign(row1,s)); signs.slice(3).forEach(s=>appendSign(row2,s)); }
  else{ signs.slice(0,3).forEach(s=>appendSign(row1,s)); signs.slice(3,6).forEach(s=>appendSign(row2,s)); signs.slice(6).forEach(s=>appendSign(row3,s)); }
}
function appendSign(container,src){
  if(src.endsWith(".mp4")){
    const v=document.createElement("video");
    v.src=src; v.autoplay=true; v.loop=true; v.muted=true; v.className="sign-video"; container.appendChild(v);
  }else{
    const i=document.createElement("img"); i.src=src; i.alt="Sign"; i.className="sign-img"; container.appendChild(i);
  }
}

/* ===== Level descriptor ===== */
function levelDescriptor(level){
  if(level>=1 && level<=3) return {type:"simple",topicIndex:level};
  if(level>=4 && level<=6) return {type:"two",topicIndex:level-3};
  if(level===7) return {type:"compound",layout:"A"};
  if(level===8) return {type:"compound",layout:"B"};
  if(level===9) return {type:"compound",layout:"C"};
  if(level===10) return {type:"compound",layout:"D"};
  if(level===11) return {type:"bonus",layout:"E"};
  if(level===12) return {type:"bonus",layout:"F"};
  return {type:"simple",topicIndex:1};
}

/* ===== Draggable filename helpers ===== */
function buildDraggableFilename(topic,a,b){ return `assets/images/${topic}/${a}-${b}.png`; }
function draggableKey(topic,a,b){ return `${topic}::${a}::${b}`; }

/* ===== Candidate pools ===== */
const candidatePool={animals:[],food:[],emotions:[]};
(function(){
  VOCAB.topics.animals.forEach(a=>VOCAB.numbers.forEach(n=>candidatePool.animals.push({key:draggableKey("animals",a,n),img:buildDraggableFilename("animals",a,n),parts:{animal:a,number:n}})));
  VOCAB.topics.food.forEach(f=>VOCAB.colours.forEach(c=>candidatePool.food.push({key:draggableKey("food",f,c),img:buildDraggableFilename("food",f,c),parts:{food:f,colour:c}})));
  VOCAB.topics.emotions.forEach(e=>VOCAB.zones.forEach(z=>candidatePool.emotions.push({key:draggableKey("emotions",e,z),img:buildDraggableFilename("emotions",e,z),parts:{emotion:e,zone:z}})));
})();

/* ===== Drag / Drop ===== */
let dragItem=null, dragClone=null, isTouch=false;
function startDrag(e){
  const tgt=e.target.closest(".draggable"); if(!tgt) return;
  dragItem=tgt; isTouch=e.type.startsWith("touch");
  const rect=tgt.getBoundingClientRect();
  dragClone=tgt.cloneNode(true);
  Object.assign(dragClone.style,{position:"fixed",left:rect.left+"px",top:rect.top+"px",width:rect.width+"px",height:rect.height+"px",opacity:"0.7",pointerEvents:"none",zIndex:10000,transform:"translate(-50%,-50%)"});
  dragClone.classList.add("drag-clone"); document.body.appendChild(dragClone);
  e.preventDefault();
  if(isTouch){ document.addEventListener("touchmove",moveDrag,{passive:false}); document.addEventListener("touchend",endDrag); }
  else{ document.addEventListener("mousemove",moveDrag); document.addEventListener("mouseup",endDrag); }
}
function moveDrag(e){
  if(!dragClone) return;
  let clientX,clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX=e.touches[0].clientX; clientY=e.touches[0].clientY; }
  else{ clientX=e.clientX; clientY=e.clientY; }
  dragClone.style.left=clientX+"px"; dragClone.style.top=clientY+"px";
}
function endDrag(e){
  if(!dragItem||!dragClone) return;
  dragClone.remove(); dragClone=null;
  if(isTouch){ document.removeEventListener("touchmove",moveDrag,{passive:false}); document.removeEventListener("touchend",endDrag); }
  else{ document.removeEventListener("mousemove",moveDrag); document.removeEventListener("mouseup",endDrag); }
  let clientX=isTouch&&e.changedTouches&&e.changedTouches.length>0?e.changedTouches[0].clientX:e.clientX;
  let clientY=isTouch&&e.changedTouches&&e.changedTouches.length>0?e.changedTouches[0].clientY:e.clientY;
  let dropped=false;
  document.querySelectorAll(".dropzone").forEach(dz=>{
    const rect=dz.getBoundingClientRect();
    if(clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom&&dz.childElementCount===0){
      const clone=dragItem.cloneNode(true);
      clone.classList.remove("draggable"); dz.appendChild(clone); dz.dataset.filled=dragItem.dataset.key; dz.classList.add("filled");
      dropped=true;
    }
  });
  if(dropped){ againBtn.style.display="inline-block"; checkBtn.style.display=Array.from(document.querySelectorAll(".dropzone")).every(d=>d.dataset.filled)?"inline-block":"none"; }
  dragItem=null;
}
document.addEventListener("mousedown",startDrag);
document.addEventListener("touchstart",startDrag,{passive:false});

/* ===== Restore draggable to side ===== */
function restoreDraggableByKeyToSide(key){
  if(!key) return;
  if(document.querySelector(`.draggable[data-key="${key}"]`)||usedDraggables.has(key)) return;
  const parts=key.split("::"); if(parts.length!==3) return;
  const div=createDraggableNodeFromParts(parts[0],parts[1],parts[2]);
  const container=(leftDraggables.childElementCount<=rightDraggables.childElementCount)?leftDraggables:rightDraggables;
  if(container) container.appendChild(div);
}

/* ===== Create draggable from parts ===== */
function createDraggableNodeFromParts(topic,a,b){
  const key=draggableKey(topic,a,b), imgSrc=buildDraggableFilename(topic,a,b);
  const div=document.createElement("div");
  div.className="draggable"; div.draggable=true; div.dataset.key=key; div.dataset.img=imgSrc; div.style.userSelect="none";
  const img=document.createElement("img"); img.src=imgSrc; img.alt=`${a}-${b}`;
  img.onerror=function(){ img.style.display="none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent=`${a}-${b}`; div.appendChild(f); } };
  div.appendChild(img);
  div.addEventListener("dragstart",e=>{try{e.dataTransfer.setData("text/plain",key);}catch{}});
  return div;
}

/* ===== Populate draggables ===== */
function populateDraggables(leftCandidates,rightCandidates,leftCount=6,rightCount=6){
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  leftCandidates.slice(0,leftCount).forEach(c=>{ if(usedDraggables.has(c.key)) return; leftDraggables.appendChild(createCandidateDiv(c)); });
  rightCandidates.slice(0,rightCount).forEach(c=>{ if(usedDraggables.has(c.key)) return; rightDraggables.appendChild(createCandidateDiv(c)); });
  document.querySelectorAll(".draggable").forEach(d=>d.style.cursor="grab");
}
function createCandidateDiv(c){
  const div=document.createElement("div"); div.className="draggable"; div.draggable=true; div.dataset.key=c.key; div.dataset.img=c.img;
  if(c.overlay) div.dataset.overlay=c.overlay;
  const img=document.createElement("img"); img.src=c.img; img.alt=c.key;
  img.onerror=()=>{ img.style.display="none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent=(c.parts.animal||c.parts.food||c.parts.emotion||c.parts.colour||c.parts.zone)+(c.parts.number?`-${c.parts.number}`:""); div.appendChild(f); } };
  div.appendChild(img);
  if(c.overlay){ const ov=document.createElement("div"); ov.className="overlay "+c.overlay; ov.textContent=(c.overlay==="have")?"✓":"✕"; div.appendChild(ov); }
  div.addEventListener("dragstart",e=>{try{e.dataTransfer.setData("text/plain",c.key);}catch{}});
  return div;
}

/* ===== Check visibility & score display ===== */
function updateCheckVisibility(){
  checkBtn.style.display="none";
  const required=Array.from(answerArea.querySelectorAll(".dropzone"));
  if(required.length===0) return;
  const allFilled=required.every(d=>d.dataset.filled && d.dataset.filled.length>0);
  if(allFilled) checkBtn.style.display="inline-block";
}
function updateScoreDisplay(){ scoreDisplay.textContent=`Level ${currentLevel} - Question ${roundInLevel+1}/${QUESTIONS_PER_LEVEL}`; }

/* ===== Double-tap removal ===== */
let lastTap=0;
answerArea.addEventListener("click",(ev)=>{
  const dz=ev.target.closest(".dropzone"); if(!dz) return;
  const now=Date.now();
  if(now-lastTap<350 && dz.dataset.filled){ const filledKey=dz.dataset.filled; dz.innerHTML=""; dz.dataset.filled=""; dz.dataset.src=""; dz.classList.remove("filled","incorrect","correct"); restoreDraggableByKeyToSide(filledKey); updateCheckVisibility(); }
  lastTap=now;
});

/* ===== Pick N random ===== */
function pickRandom(arr,count){ return shuffleArray(arr).slice(0,count); }

/* ===== Create dropzone ===== */
function createDropzone(placeholderText="",expectedKey=""){
  const dz=document.createElement("div"); dz.className="dropzone"; dz.dataset.expected=expectedKey;
  const placeholder=document.createElement("div"); placeholder.className="placeholder faint"; placeholder.textContent=placeholderText; dz.appendChild(placeholder);
  dz.addEventListener("mouseup",()=>{ if(dragItem) handleDropClone(dz,dragItem.dataset.key); });
  dz.addEventListener("touchend",(e)=>{ if(dragItem && e.changedTouches.length>0){ const t=e.changedTouches[0]; const r=dz.getBoundingClientRect(); if(t.clientX>=r.left && t.clientX<=r.right && t.clientY>=r.top && t.clientY<=r.bottom) handleDropClone(dz,dragItem.dataset.key); }});
  answerArea.appendChild(dz); return dz;
}


/* ===== Clap and advance ===== */
function showClapThenAdvance(cb){
  const gif = document.createElement("img");
  gif.src = "assets/auslan-clap.gif";
  gif.alt = "Clap";
  feedbackDiv.innerHTML = "";
  feedbackDiv.appendChild(gif);
  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if(typeof cb === "function") cb();
  }, 2000);
}

/* ===== Google Form submission (silent) ===== */
let formSubmittedFlag = localStorage.getItem("sentencesGame_submitted") === "1";

async function submitToGoogleForm(silent=true){
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;

  if(totalCorrect < 1) return false; // per spec don't submit if none correct

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);

  for(let lvl=1; lvl<=TOTAL_LEVELS; lvl++){
    fd.append(FORM_FIELD_MAP[`level${lvl}`].correct, levelCorrect[lvl] || 0);
    fd.append(FORM_FIELD_MAP[`level${lvl}`].incorrect, levelIncorrect[lvl] || 0);
  }

  try{
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
    formSubmittedFlag = true;
    localStorage.setItem("sentencesGame_submitted", "1");
    return true;
  }catch(e){
    console.warn("Form submission failed:", e);
    return false;
  }
}

/* ===== Final submission and end modal ===== */
async function finalSubmitThenEnd(){
  await submitToGoogleForm(true);
  clearProgress();
  if(document.getElementById("finalTime")) document.getElementById("finalTime").textContent = getTimeElapsed() + "s";
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if(document.getElementById("finalScore")) document.getElementById("finalScore").textContent = `${totalCorrect} / ${totalAttempts}`;
  if(document.getElementById("finalPercent")) document.getElementById("finalPercent").textContent = `${percent}%`;

  const endGif = document.getElementById("endGif");
  if(endGif){ endGif.src = "assets/auslan-clap.gif"; endGif.style.display = "block"; }
  if(endModal){ endModal.style.display = "flex"; endModal.style.zIndex = 5000; }
}

/* Finish & Again (end modal) wiring */
if (finishBtn) finishBtn.addEventListener("click", async () => {
  window.location.href = "../index.html";
});
if (againBtnEnd) againBtnEnd.addEventListener("click", () => {
  if(endModal) endModal.style.display = "none";
  currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0;
  for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
  answersHistory = [];
  usedDraggables.clear(); usedCombos.clear();
  setTimeElapsed(0);
  buildQuestion();
});

/* ===== STOP modal wiring ===== */
if(stopBtn){
  stopBtn.addEventListener("click", () => {
    if(resumeModal && resumeModal.style.display === "flex") return;
    savedTimeElapsed = getTimeElapsed();
    startTime = null;
    const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
    const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
    const totalAttempts = totalCorrect + totalIncorrect;
    const percent = totalAttempts>0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
    if(stopPercent) stopPercent.textContent = `Score so far: ${percent}% — Time: ${getTimeElapsed()}s`;
    if(stopModal) { stopModal.style.display = "flex"; stopModal.style.zIndex = 5000; }
  });
}
if(stopContinue) stopContinue.addEventListener("click", () => {
  if(stopModal) stopModal.style.display = "none";
  setTimeElapsed(savedTimeElapsed);
});
if(stopAgain) stopAgain.addEventListener("click", async () => {
  if(stopModal) stopModal.style.display = "none";
  await submitToGoogleForm(true);
  usedDraggables.clear(); usedCombos.clear();
  for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
  correctCount = 0; incorrectCount = 0; answersHistory = [];
  currentLevel = 1; roundInLevel = 0;
  setTimeElapsed(0);
  buildQuestion();
});
if(stopFinish) stopFinish.addEventListener("click", async () => {
  if(stopModal) stopModal.style.display = "none";
  await submitToGoogleForm(true);
  window.location.href = "../index.html";
});

/* ===== Save / Load / Clear progress (localStorage) ===== */
function saveProgress(){
  const payload = {
    studentName, studentClass,
    currentLevel, roundInLevel,
    correctCount, incorrectCount,
    levelCorrect, levelIncorrect,
    answersHistory,
    savedTimeElapsed: getTimeElapsed(),
    usedDraggables: Array.from(usedDraggables),
    usedCombos: Array.from(usedCombos)
  };
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }catch(e){ console.warn("save failed",e); }
}
function loadProgress(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function clearProgress(){
  try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem("sentencesGame_submitted"); }catch(e){}
}

/* ===== Restore saved payload to state ===== */
function restoreProgress(saved){
  if(!saved) return;
  studentName = saved.studentName || studentName;
  studentClass = saved.studentClass || studentClass;
  currentLevel = Number(saved.currentLevel) || 1;
  roundInLevel = Number(saved.roundInLevel) || 0;
  correctCount = Number(saved.correctCount) || 0;
  incorrectCount = Number(saved.incorrectCount) || 0;
  levelCorrect = saved.levelCorrect || levelCorrect;
  levelIncorrect = saved.levelIncorrect || levelIncorrect;
  answersHistory = saved.answersHistory || [];
  savedTimeElapsed = Number(saved.savedTimeElapsed) || 0;
  usedDraggables = new Set((saved.usedDraggables) ? saved.usedDraggables : []);
  usedCombos = new Set((saved.usedCombos) ? saved.usedCombos : []);
  setTimeElapsed(saved.savedTimeElapsed || 0);
  buildQuestion();
}

/* ===== Resume modal logic (show and attach handlers) ===== */
function showResumeModal(saved){
  if(!resumeModal || !saved) return;
  if(stopModal) stopModal.style.display = "none";
  if(endModal) endModal.style.display = "none";
  if(topicModal) topicModal.style.display = "none";
  resumeMessage.textContent = `You have progress saved at Level ${saved.currentLevel}, Question ${Number(saved.roundInLevel)+1}. Continue or start over?`;
  resumeModal.style.display = "flex";
  resumeModal.style.zIndex = 5000;

  resumeContinue.parentNode.replaceChild(resumeContinue.cloneNode(true), resumeContinue);
  resumeAgain.parentNode.replaceChild(resumeAgain.cloneNode(true), resumeAgain);

  const newCont = document.getElementById("resumeContinue");
  const newAgain = document.getElementById("resumeAgain");

  newCont.addEventListener("click", () => {
    resumeModal.style.display = "none";
    restoreProgress(saved);
    startTime = Date.now();
  }, { once: true });

  newAgain.addEventListener("click", async () => {
    resumeModal.style.display = "none";
    const totalCorrect = Object.values(saved.levelCorrect || {}).reduce((a,b)=>a+b,0);
    if(totalCorrect > 0 && !formSubmittedFlag){
      await submitToGoogleForm(true);
    }
    clearProgress();
    usedDraggables.clear(); usedCombos.clear();
    for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
    correctCount = 0; incorrectCount = 0; answersHistory = [];
    currentLevel = 1; roundInLevel = 0;
    setTimeElapsed(0);
    buildQuestion();
  }, { once: true });
}

/* ===== INITIALISATION on window load ===== */
window.addEventListener("load", () => {
  [againBtn, finishBtn, againBtnEnd].forEach(b => { if(b){ b.style.zIndex = 6001; b.style.cursor = "pointer"; }});
  const saved = loadProgress();
  if(saved){
    showResumeModal(saved);
  } else {
    setTimeElapsed(0);
    startTime = Date.now();
    buildQuestion();
  }
});
