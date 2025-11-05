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

/* ===== LEVEL CONFIG ===== */
const levels = {
  1: { lineCount: 1, type: "sign", qItems: ["animal","number"] },
  2: { lineCount: 1, type: "sign", qItems: ["food","colour"] },
  3: { lineCount: 1, type: "sign", qItems: ["emotion","zone"], starter: "feel" },
  4: { lineCount: 1, type: "image", qItems: ["animal","number"] },
  5: { lineCount: 1, type: "image", qItems: ["food","colour"] },
  6: { lineCount: 1, type: "image", qItems: ["emotion","zone"], starter: "feel" },
  7: { lineCount: 2, type: "sign", qItems: ["animal+number","food+colour"], verb: ["has","donthave"] },
  8: { lineCount: 2, type: "sign", qItems: ["animal+number","emotion+zone"], verb: ["feel"] },
  9: { lineCount: 2, type: "image", qItems: ["animal+number","food+colour"], verb: ["has","donthave"] },
  10:{ lineCount: 2, type: "image", qItems: ["animal+number","emotion+zone"], verb: ["feel"] },
  11:{ lineCount: 3, type: "sign", qItems: ["animal+number","emotion+zone","food+colour"], verb: ["feel","has","donthave"] },
  12:{ lineCount: 3, type: "image", qItems: ["animal+number","emotion+zone","food+colour"], verb: ["feel","has","donthave"] }
};

/* ===== DOM ELEMENTS ===== */
const DOM = {
  studentName: document.getElementById("studentName"),
  studentClass: document.getElementById("studentClass"),
  scoreDisplay: document.getElementById("scoreDisplay"),
  stopBtn: document.getElementById("stopBtn"),
  leftDraggables: document.getElementById("draggablesLeft"),
  rightDraggables: document.getElementById("draggablesRight"),
  questionArea: document.getElementById("questionArea"),
  answerArea: document.getElementById("answerArea"),
  feedbackDiv: document.getElementById("feedback"),
  checkBtn: document.getElementById("checkBtn"),
  againBtn: document.getElementById("againBtn"),
  endModal: document.getElementById("endModal"),
  finishBtnEnd: document.getElementById("finishBtnEnd"),
  againBtnEnd: document.getElementById("againBtnEnd"),
  googleForm: document.getElementById("googleForm"),
  topicModal: document.getElementById("topicModal"),
  resumeModal: document.getElementById("resumeModal"),
  resumeMessage: document.getElementById("resumeMessage"),
  resumeContinue: document.getElementById("resumeContinue"),
  resumeAgain: document.getElementById("resumeAgain"),
  stopModal: document.getElementById("stopModal"),
  stopPercent: document.getElementById("stopPercent"),
  stopContinue: document.getElementById("continueBtn"),
  stopAgain: document.getElementById("againBtnStop"),
  stopFinish: document.getElementById("finishBtnStop")
};

/* ===== STUDENT INFO ===== */
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";
if(!studentName || !studentClass){ alert("Please log in first."); window.location.href="../index.html"; }
else { DOM.studentName.textContent=studentName; DOM.studentClass.textContent=studentClass; }

/* ===== GAME STATE ===== */
const SAVE_KEY="sentencesGameSave_v1";
let currentLevel=1, roundInLevel=0;
const QUESTIONS_PER_LEVEL=10, TOTAL_LEVELS=12;
let correctCount=0, incorrectCount=0;
let levelCorrect={}, levelIncorrect={};
for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
let answersHistory=[], savedTimeElapsed=0;
let usedDraggables=new Set(), usedCombos=new Set();
let startTime=null;
let dragItem=null, dragClone=null, isTouch=false;
let formSubmittedFlag=localStorage.getItem("sentencesGame_submitted")==="1";

/* ===== VOCAB ===== */
const VOCAB = {
  topics: { animals:["dog","cat","mouse","rabbit","fish","bird"], food:["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"], emotions:["angry","annoyed","ashamed","bored","confident","confused","danger","disappointed","excited","exhausted","focus","frustrated","happy","jealous","lonely","loved","nervous","pain","proud","relax","sad","scared","shock","shy","sick","silly","stressed","support","surprised","tease","thankful","tired","worried"] },
  colours: ["red","green","blue","orange","yellow","pink","purple","brown","black","white"],
  numbers: ["one","two","three","four","five","six","seven","eight","nine","ten"],
  zones: ["green","blue","yellow","red"],
  verbs: ["want","have","donthave"],
  helpers: { i:"assets/signs/helpers/i.png", see:"assets/signs/helpers/see.png", feel:"assets/signs/helpers/feel.png", what:"assets/signs/helpers/what.png" }
};

/* ===== HELPERS ===== */
const shuffleArray = arr => arr.slice().sort(()=>Math.random()-0.5);
const randomItem = arr => arr[Math.floor(Math.random()*arr.length)];
const timeNowSeconds = () => Math.round(Date.now()/1000);
const getTimeElapsed = () => savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0);
const setTimeElapsed = s => { savedTimeElapsed = s||0; startTime = Date.now(); };
const signPathFor = word=>{
  if(!word) return "";
  if(VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if(VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if(VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if(VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if(VOCAB.colours.includes(word)) return `assets/signs/colours/${word}.png`;
  if(VOCAB.zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if(VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if(Object.values(VOCAB.helpers).includes(word)) return word;
  return "";
};
function renderSentenceRows(signs){
  const r1=document.getElementById("sentenceRow1"), r2=document.getElementById("sentenceRow2"), r3=document.getElementById("sentenceRow3");
  [r1,r2,r3].forEach(r=>r.innerHTML="");
  if(signs.length<=3) signs.forEach(s=>appendSign(r1,s));
  else if(signs.length<=6){ signs.slice(0,3).forEach(s=>appendSign(r1,s)); signs.slice(3).forEach(s=>appendSign(r2,s)); }
  else{ signs.slice(0,3).forEach(s=>appendSign(r1,s)); signs.slice(3,6).forEach(s=>appendSign(r2,s)); signs.slice(6).forEach(s=>appendSign(r3,s)); }
}
function appendSign(container,src){
  if(src.endsWith(".mp4")){ const v=document.createElement("video"); v.src=src; v.autoplay=true; v.loop=true; v.muted=true; v.className="sign-video"; container.appendChild(v); }
  else{ const i=document.createElement("img"); i.src=src; i.alt="Sign"; i.className="sign-img"; container.appendChild(i); }
}

/* ===== DRAG & DROP ===== */
function startDrag(e){
  const tgt = e.target.closest(".draggable"); if(!tgt) return;
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
  document.querySelectorAll(".dropzone").forEach(dz=>{
    const rect=dz.getBoundingClientRect();
    if(clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom&&dz.childElementCount===0){
      handleDropClone(dz, dragItem.dataset.key);
    }
  });
  dragItem=null;
}
document.addEventListener("mousedown",startDrag);
document.addEventListener("touchstart",startDrag,{passive:false});

/* ===== HANDLE DROP ===== */
function handleDropClone(dropzone,key){
  if(!key || !dropzone) return;
  const clone=dragItem.cloneNode(true);
  clone.classList.remove("draggable"); dropzone.appendChild(clone);
  dropzone.dataset.filled=key; dropzone.classList.add("filled");
  usedDraggables.add(key);
  updateCheckVisibility();
  DOM.againBtn.style.display="inline-block";
}

/* ===== BUILD QUESTION ===== */
function buildQuestion(){
  DOM.answerArea.innerHTML="";
  updateScoreDisplay();
  const levelData = levels[currentLevel];
  // For demo: pick random 2 draggables per level
  const leftCandidates = []; const rightCandidates = [];
  if(levelData.qItems.includes("animal")) leftCandidates.push(...VOCAB.topics.animals.map(a=>({key:a,img:signPathFor(a)})));
  if(levelData.qItems.includes("number")) rightCandidates.push(...VOCAB.numbers.map(n=>({key:n,img:signPathFor(n)})));
  // Populate draggables
  populateDraggables(leftCandidates,rightCandidates);
  // Create dropzones
  const dz1=createDropzone("Drop here 1"); const dz2=createDropzone("Drop here 2");
}

/* ===== POPULATE DRAGGABLES ===== */
function populateDraggables(left,right){ DOM.leftDraggables.innerHTML=""; DOM.rightDraggables.innerHTML=""; left.forEach(c=>DOM.leftDraggables.appendChild(createCandidateDiv(c))); right.forEach(c=>DOM.rightDraggables.appendChild(createCandidateDiv(c))); }
function createCandidateDiv(c){ const div=document.createElement("div"); div.className="draggable"; div.draggable=true; div.dataset.key=c.key; const img=document.createElement("img"); img.src=c.img; div.appendChild(img); div.addEventListener("dragstart",e=>{try{e.dataTransfer.setData("text/plain",c.key);}catch{}}); return div; }

/* ===== CHECK VISIBILITY & SCORE ===== */
function updateCheckVisibility(){ DOM.checkBtn.style.display=Array.from(DOM.answerArea.querySelectorAll(".dropzone")).every(d=>d.dataset.filled)?"inline-block":"none"; }
function updateScoreDisplay(){ DOM.scoreDisplay.textContent=`Level ${currentLevel} - Question ${roundInLevel+1}/${QUESTIONS_PER_LEVEL}`; }

/* ===== INITIAL LOAD ===== */
window.addEventListener("load",()=>{
  const saved = loadProgress();
  if(saved) showResumeModal(saved);
  else { setTimeElapsed(0); startTime=Date.now(); buildQuestion(); }
});
