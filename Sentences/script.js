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
const answerArea = document.getElementById("answerArea");
const feedbackDiv = document.getElementById("feedbackDiv");
const endModal = document.getElementById("endModal");

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

/* ===== STUDENT INFO ===== */
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";
if(!studentName || !studentClass){
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;
}

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
  helpers: { i: "assets/signs/helpers/i.png", see: "assets/signs/helpers/see.png", feel: "assets/signs/helpers/feel.png", what: "assets/signs/helpers/what.png" }
};

/* ===== HELPERS ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function timeNowSeconds(){ return Math.round(Date.now()/1000); }
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = seconds || 0; startTime = Date.now(); }

/* ===== LEVEL CONFIG ===== */
const levels = {
  1: {lineCount:1,qItems:["animals"],verb:["have"]},
  2: {lineCount:1,qItems:["food"],verb:["want"]},
  3: {lineCount:1,qItems:["emotions"],verb:["feel"]},
  4: {lineCount:1,qItems:["numbers"],verb:["have"]},
  5: {lineCount:1,qItems:["colours"],verb:["want"]},
  6: {lineCount:1,qItems:["zones"],verb:["feel"]},
  7: {lineCount:2,qItems:["animals+numbers","food+colours"],verb:["have","donthave"]},
  8: {lineCount:2,qItems:["animals+numbers","emotions+zones"],verb:["feel"]},
  9: {lineCount:2,qItems:["food+colours","emotions+zones"],verb:["have","donthave"]},
  10: {lineCount:2,qItems:["animals+numbers","food+colours","emotions+zones"],verb:["feel","have","donthave"]},
  11: {lineCount:3,qItems:["animals","food","emotions"],verb:["have","donthave","feel"]},
  12: {lineCount:3,qItems:["animals+numbers","food+colours","emotions+zones"],verb:["feel","have","donthave"]}
};

/* ===== SIGN PATH / DRAGGABLE HELPERS ===== */
function signPathFor(word){
  if (!word) return "";
  if (VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if (VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (VOCAB.colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (VOCAB.zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if (VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if(Object.values(VOCAB.helpers).includes(word)) return word;
  return "";
}
function draggableKey(topic,a,b=""){ return `${topic}::${a}::${b}`; }
function createDraggableNode(topic,a,b=""){
  const key=draggableKey(topic,a,b);
  const div=document.createElement("div");
  div.className="draggable"; div.draggable=true; div.dataset.key=key;
  const path = (topic==="helpers") ? VOCAB.helpers[a] : (b?`assets/images/${topic}/${a}-${b}.png`:`assets/images/${topic}/${a}.png`);
  if(path.endsWith(".mp4")){
    const v=document.createElement("video"); v.src=path; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true; v.width=80; v.height=80; div.appendChild(v);
  }else{
    const img=document.createElement("img"); img.src=path; img.alt=key; img.onerror=()=>{img.style.display="none"; const f=document.createElement("div"); f.className="fallback"; f.textContent=a+(b?`-${b}`:""); div.appendChild(f);}; div.appendChild(img);
  }
  div.addEventListener("dragstart",e=>{ try{ e.dataTransfer.setData("text/plain",key);}catch{} });
  return div;
}

/* ===== DROPZONE CREATION ===== */
function createDropzone(placeholderText="",expectedKey=""){
  const dz=document.createElement("div"); dz.className="dropzone"; dz.dataset.expected=expectedKey;
  dz.style.minWidth="60px"; dz.style.minHeight="60px"; dz.style.border="2px dashed #888"; dz.style.display="inline-flex"; dz.style.alignItems="center"; dz.style.justifyContent="center"; dz.style.margin="2px";
  const placeholder=document.createElement("div"); placeholder.className="placeholder faint"; placeholder.textContent=placeholderText; dz.appendChild(placeholder);
  answerArea.appendChild(dz); return dz;
}

/* ===== POPULATE QUESTION ROWS ===== */
function generateQuestion(level=currentLevel){
  answerArea.innerHTML="";
  const lvl = levels[level]; if(!lvl) return;
  // For each line
  for(let i=0;i<lvl.lineCount;i++){
    const qItems = lvl.qItems[i].split("+");
    qItems.forEach(item=>{
      // Helper first
      Object.keys(VOCAB.helpers).forEach(h=>{
        const dz = createDropzone(h); dz.appendChild(createDraggableNode("helpers",h));
      });
      // Topic / verb
      if(VOCAB.topics[item]){
        randomItem(VOCAB.topics[item]).split(",").forEach(t=>{
          createDropzone(t);
        });
      }
    });
  }
}

/* ===== DRAG / DROP LOGIC ===== */
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
  dragItem=null;
  updateCheckVisibility();
}
document.addEventListener("mousedown",startDrag);
document.addEventListener("touchstart",startDrag,{passive:false});
function updateCheckVisibility(){
  if(Array.from(document.querySelectorAll(".dropzone")).every(d=>d.dataset.filled)) checkBtn.style.display="inline-block";
  else checkBtn.style.display="none";
}

/* ===== INIT ===== */
generateQuestion();
updateScoreDisplay();
