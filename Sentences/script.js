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
  level10: { correct: "entry.1386510395", incorrect: "entry.140484839" },
  level11: { correct: "entry.1057376731", incorrect: "entry.1932856854" },
  level12: { correct: "entry.1570476410", incorrect: "entry.1307112644" }
};

/* ===== LEVEL CONFIG ===== */
const levels = {
  1: { lineCount:1, type:"sign", qItems:["animals","numbers"] },
  2: { lineCount:1, type:"sign", qItems:["food","colours"] },
  3: { lineCount:1, type:"sign", qItems:["emotions","zones"], starter:"feel" },
  4: { lineCount:1, type:"image", qItems:["animals","numbers"] },
  5: { lineCount:1, type:"image", qItems:["food","colours"] },
  6: { lineCount:1, type:"image", qItems:["emotions","zones"], starter:"feel" },
  7: { lineCount:2, type:"sign", qItems:["animals+numbers","food+colours"], verb:["has","donthave"] },
  8: { lineCount:2, type:"sign", qItems:["animals+numbers","emotions+zones"], verb:["feel"] },
  9: { lineCount:2, type:"image", qItems:["animals+numbers","food+colours"], verb:["has","donthave"] },
  10: { lineCount:2, type:"image", qItems:["animals+numbers","emotions+zones"], verb:["feel"] },
  11: { lineCount:3, type:"sign", qItems:["animals+numbers","emotions+zones","food+colours"], verb:["feel","has","donthave"] },
  12: { lineCount:3, type:"image", qItems:["animals+numbers","emotions+zones","food+colours"], verb:["feel","has","donthave"] }
};

/* ===== DOM ELEMENTS ===== */
const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");
const leftDraggables = document.getElementById("draggablesLeft");
const rightDraggables = document.getElementById("draggablesRight");
const bottomVerbs = document.getElementById("verbDraggables"); 
const scoreDisplay = document.getElementById("scoreDisplay");
const checkBtn = document.getElementById("checkBtn");
const againBtn = document.getElementById("againBtn");
const finishBtn = document.getElementById("finishBtn");

/* ===== STUDENT INFO ===== */
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
const SAVE_KEY = "sentencesGameSave_v2";
let currentLevel = 1, roundInLevel = 0;
const TOTAL_LEVELS = 12;
let correctCount = 0, incorrectCount = 0;
let levelCorrect = {}, levelIncorrect = {};
for (let i = 1; i <= TOTAL_LEVELS; i++) { levelCorrect[i] = 0; levelIncorrect[i] = 0; }
let answersHistory = [];
let startTime = null, savedTimeElapsed = 0;
let usedDraggables = new Set(), usedCombos = new Set();
let formSubmittedFlag = localStorage.getItem("sentencesGame_submitted") === "1";

/* ===== VOCAB ===== */
const VOCAB = {
  topics: {
    animals: ["dog","cat","mouse","rabbit","fish","bird"],
    food: ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"],
    emotions: ["angry","annoyed","ashamed","bored","confident","confused","danger","disappointed","excited","exhausted","focus","frustrated","happy","jealous","lonely","loved","nervous","pain","proud","relax","sad","scared","shock","shy","sick","silly","stressed","support","surprised","tease","thankful","tired","worried"],
  },
  colours: ["red","green","blue","orange","yellow","pink","purple","brown","black","white"],
  numbers: ["one","two","three","four","five","six","seven","eight","nine","ten"],
  zones: ["green","blue","yellow","red"],
  verbs: ["want","have","donthave","feel"],
  helpers: { i:"i.png", see:"see.png", what:"what.png" }
};

/* ===== HELPERS ===== */
const shuffleArray = arr => arr.slice().sort(()=>Math.random()-0.5);
const randomItem = arr => arr[Math.floor(Math.random()*arr.length)];
const getTimeElapsed = () => savedTimeElapsed + (startTime ? Math.floor((Date.now()-startTime)/1000) : 0);
const setTimeElapsed = seconds => { savedTimeElapsed = seconds || 0; startTime = Date.now(); };

/* ===== CREATE DRAGGABLE NODE ===== */
function createDraggableNode(topic,val1,val2="") {
  const key = `${topic}::${val1}::${val2}`;
  const div = document.createElement("div");
  div.className = "draggable"; 
  div.draggable = true; 
  div.dataset.key = key;

  let path = "";
  if (topic === "helpers") path = `assets/signs/helpers/${VOCAB.helpers[val1]}`;
  else if (topic === "emotions") path = `assets/signs/emotions/sign-${val1}.mp4`;
  else path = `assets/images/${topic}/${val1}${val2 ? '-' + val2 : ''}.png`;

  if (path.endsWith(".mp4")) {
    const v = document.createElement("video");
    v.src = path; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
    v.width = 80; v.height = 80;
    div.appendChild(v);
  } else {
    const img = document.createElement("img");
    img.src = path; img.alt = key;
    img.onerror = () => {
      img.style.display = "none";
      if (!div.querySelector(".fallback")) {
        const f = document.createElement("div");
        f.className = "fallback";
        f.textContent = val1 + (val2 ? `-${val2}` : "");
        div.appendChild(f);
      }
    };
    div.appendChild(img);
  }

  div.addEventListener("dragstart", e => { try { e.dataTransfer.setData("text/plain", key); } catch {} });
  return div;
}

/* ===== POPULATE DRAGGABLES ===== */
function populateDraggables(level) {
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  bottomVerbs.innerHTML = "";

  // Helpers always on top row
  Object.keys(VOCAB.helpers).forEach(h => {
    leftDraggables.appendChild(createDraggableNode("helpers", h));
  });

  const leftCandidates = [], rightCandidates = [];
  if (levels[level].qItems) {
    levels[level].qItems.forEach(q => {
      if (q.includes("+")) q.split("+").forEach(topic => addCandidate(topic, leftCandidates, rightCandidates));
      else addCandidate(q, leftCandidates, rightCandidates);
    });
  }

  const leftCount = level <= 6 ? 6 : 9;
  const rightCount = level <= 6 ? 6 : 9;
  leftCandidates.slice(0,leftCount).forEach(c => { if (!usedDraggables.has(c.key)) leftDraggables.appendChild(createDraggableNode(c.topic,c.val1,c.val2)); });
  rightCandidates.slice(0,rightCount).forEach(c => { if (!usedDraggables.has(c.key)) rightDraggables.appendChild(createDraggableNode(c.topic,c.val1,c.val2)); });

  // Verbs at bottom
  if (levels[level].verb) {
    levels[level].verb.forEach(v => {
      bottomVerbs.appendChild(createDraggableNode("verbs", v));
    });
  }

  function addCandidate(topic, leftArr, rightArr){
    if (VOCAB.topics[topic]) {
      VOCAB.topics[topic].forEach(t => {
        if (topic==="emotions") VOCAB.zones.forEach(z => { leftArr.push({topic,val1:t,val2:z}); rightArr.push({topic,val1:t,val2:z}); });
        else if (topic==="food") VOCAB.colours.forEach(c => { leftArr.push({topic,val1:t,val2:c}); rightArr.push({topic,val1:t,val2:c}); });
        else if (topic==="animals" || topic==="numbers") VOCAB.numbers.forEach(n => { leftArr.push({topic,val1:t,val2:n}); rightArr.push({topic,val1:t,val2:n}); });
      });
    }
  }
}

/* ===== DRAG / DROP ===== */
let dragItem=null, dragClone=null, isTouch=false;
function startDrag(e){
  const tgt=e.target.closest(".draggable"); if(!tgt) return;
  dragItem=tgt; isTouch=e.type.startsWith("touch");
  const rect=tgt.getBoundingClientRect();
  dragClone=tgt.cloneNode(true);
  Object.assign(dragClone.style,{
    position:"fixed",
    left:rect.left+"px",
    top:rect.top+"px",
    width:rect.width+"px",
    height:rect.height+"px",
    opacity:0.7,
    pointerEvents:"none",
    zIndex:10000,
    transform:"translate(-50%,-50%)"
  });
  dragClone.classList.add("drag-clone"); 
  document.body.appendChild(dragClone);
  e.preventDefault();
  if (isTouch){ 
    document.addEventListener("touchmove",moveDrag,{passive:false}); 
    document.addEventListener("touchend",endDrag);
  } else { 
    document.addEventListener("mousemove",moveDrag); 
    document.addEventListener("mouseup",endDrag);
  }
}
function moveDrag(e){
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX=e.touches[0].clientX; clientY=e.touches[0].clientY; }
  else{ clientX=e.clientX; clientY=e.clientY; }
  dragClone.style.left = clientX+"px";
  dragClone.style.top = clientY+"px";
}
function endDrag(e){
  if(!dragItem||!dragClone) return;
  dragClone.remove(); dragClone=null;
  if(isTouch){
    document.removeEventListener("touchmove",moveDrag,{passive:false}); 
    document.removeEventListener("touchend",endDrag);
  } else {
    document.removeEventListener("mousemove",moveDrag); 
    document.removeEventListener("mouseup",endDrag);
  }
  dragItem=null;
}
document.addEventListener("mousedown",startDrag);
document.addEventListener("touchstart",startDrag,{passive:false});

/* ===== SAVE / LOAD ===== */
function saveProgress(){
  const payload = {
    studentName, studentClass, currentLevel, roundInLevel,
    correctCount, incorrectCount,
    levelCorrect, levelIncorrect, answersHistory,
    savedTimeElapsed:getTimeElapsed(),
    usedDraggables:Array.from(usedDraggables), usedCombos:Array.from(usedCombos)
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}
function loadProgress(){
  const saved = localStorage.getItem(SAVE_KEY); 
  if (!saved) return false;
  try {
    const p = JSON.parse(saved);
    studentName = p.studentName || studentName;
    studentClass = p.studentClass || studentClass;
    currentLevel = p.currentLevel || 1;
    roundInLevel = p.roundInLevel || 0;
    correctCount = p.correctCount || 0;
    incorrectCount = p.incorrectCount || 0;
    levelCorrect = p.levelCorrect || levelCorrect;
    levelIncorrect = p.levelIncorrect || levelIncorrect;
    answersHistory = p.answersHistory || [];
    savedTimeElapsed = p.savedTimeElapsed || 0;
    usedDraggables = new Set(p.usedDraggables || []);
    usedCombos = new Set(p.usedCombos || []);
    return true;
  } catch { return false; }
}

/* ===== INIT GAME ===== */
function initGame(){
  if(loadProgress()) console.log("Progress restored");
  populateDraggables(currentLevel);
  startTime = Date.now();
}
initGame();
