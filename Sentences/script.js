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
  1: { lineCount: 1, type: "sign", qItems: ["animals","numbers"] },
  2: { lineCount: 1, type: "sign", qItems: ["food","colours"] },
  3: { lineCount: 1, type: "sign", qItems: ["emotions","zones"] },
  4: { lineCount: 1, type: "image", qItems: ["animals","numbers"] },
  5: { lineCount: 1, type: "image", qItems: ["food","colours"] },
  6: { lineCount: 1, type: "image", qItems: ["emotions","zones"] },
  7: { lineCount: 2, type: "sign", qItems: ["animals+numbers","food+colours"], verbs:["has","donthave"] },
  8: { lineCount: 2, type: "sign", qItems: ["animals+numbers","emotions+zones"], verbs:["feel"] },
  9: { lineCount: 2, type: "image", qItems: ["animals+numbers","food+colours"], verbs:["has","donthave"] },
  10:{ lineCount: 2, type: "image", qItems: ["animals+numbers","emotions+zones"], verbs:["feel"] },
  11:{ lineCount: 3, type: "sign", qItems: ["animals+numbers","emotions+zones","food+colours"], verbs:["feel","has","donthave"] },
  12:{ lineCount: 3, type: "image", qItems: ["animals+numbers","emotions+zones","food+colours"], verbs:["feel","has","donthave"] }
};

/* ===== DOM ELEMENTS ===== */
const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");
const scoreDisplay = document.getElementById("scoreDisplay");
const stopBtn = document.getElementById("stopBtn");
const leftDraggables = document.getElementById("draggablesLeft");
const rightDraggables = document.getElementById("draggablesRight");
const verbsContainer = document.getElementById("verbsContainer"); // new container for verbs
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

/* ===== VOCAB ===== */
const VOCAB = {
  topics: {
    animals: ["dog","cat","mouse","rabbit","fish","bird"],
    food: ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"],
    emotions: ["angry","bored","confident","happy","sad","surprised","shy"]
  },
  colours: ["red","green","blue","orange","yellow","pink","purple","brown","black","white"],
  numbers: ["one","two","three","four","five","six","seven","eight","nine","ten"],
  zones: ["green","blue","yellow","red"],
  verbs: ["want","have","donthave","feel"]
};

/* ===== HELPERS ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function timeNowSeconds(){ return Math.round(Date.now()/1000); }
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = seconds || 0; startTime = Date.now(); }

/* ===== CREATE DRAGGABLE NODE ===== */
function createDraggableNode(topic,a,b){
  const key = `${topic}::${a}::${b}`;
  const imgSrc = `assets/images/${topic}/${a}-${b}.png`;
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = key;
  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = key;
  img.onerror = () => { img.style.display="none"; };
  div.appendChild(img);
  div.addEventListener("dragstart",e=>{ try{ e.dataTransfer.setData("text/plain",key);} catch{} });
  return div;
}

/* ===== POPULATE DRAGGABLES ===== */
function populateDraggables(leftCandidates,rightCandidates,verbs=[]){
  leftDraggables.innerHTML="";
  rightDraggables.innerHTML="";
  verbsContainer.innerHTML="";
  let leftCount = (currentLevel<=6)?6:9;
  let rightCount = leftCount;

  leftCandidates.slice(0,leftCount).forEach(c=>{ if(!usedDraggables.has(c.key)) leftDraggables.appendChild(createDraggableNode(c.topic,c.part1,c.part2)); });
  rightCandidates.slice(0,rightCount).forEach(c=>{ if(!usedDraggables.has(c.key)) rightDraggables.appendChild(createDraggableNode(c.topic,c.part1,c.part2)); });
  verbs.forEach(v => { verbsContainer.appendChild(createDraggableNode("verbs",v,"")); });
}

/* ===== SAVE / LOAD / RESTORE ===== */
function saveProgress(){
  const payload = { studentName, studentClass, currentLevel, roundInLevel, correctCount, incorrectCount, levelCorrect, levelIncorrect, answersHistory, savedTimeElapsed:getTimeElapsed(), usedDraggables:Array.from(usedDraggables), usedCombos:Array.from(usedCombos)};
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); } catch(e){ console.warn(e); }
}

function loadProgress(){
  try{ return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e){ return null; }
}

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
  usedDraggables = new Set(saved.usedDraggables || []);
  usedCombos = new Set(saved.usedCombos || []);
  setTimeElapsed(saved.savedTimeElapsed || 0);
  buildQuestion();
}

/* ===== BUILD QUESTION ===== */
function buildQuestion(){
  questionArea.innerHTML="";
  answerArea.innerHTML="";
  const lvlConfig = levels[currentLevel];
  if(!lvlConfig) return;

  // Determine candidates
  let leftCandidates=[], rightCandidates=[], verbs=[];
  lvlConfig.qItems.forEach(q => {
    if(q.includes("+")){
      const [topic1,topic2] = q.split("+");
      VOCAB[topic1].forEach(p1 => VOCAB[topic2].forEach(p2 => {
        const key = `${topic1}::${p1}::${p2}`;
        leftCandidates.push({topic:topic1,part1:p1,part2:p2,key});
        rightCandidates.push({topic:topic2,part1:p2,part2:"",key});
      }));
    } else {
      VOCAB[q].forEach(p => { leftCandidates.push({topic:q,part1:p,part2:"",key:`${q}::${p}::`}); rightCandidates.push({topic:q,part1:p,part2:"",key:`${q}::${p}::`}); });
    }
  });

  if(lvlConfig.verbs) verbs = lvlConfig.verbs;

  populateDraggables(shuffleArray(leftCandidates), shuffleArray(rightCandidates), verbs);
  updateScoreDisplay();
}

/* ===== SCORE DISPLAY ===== */
function updateScoreDisplay(){
  scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/${QUESTIONS_PER_LEVEL}`;
}

/* ===== INITIALISATION ===== */
window.addEventListener("load", () => {
  const saved = loadProgress();
  if(saved){
    // Show resume modal if needed (similar logic as before)
    restoreProgress(saved);
  } else {
    setTimeElapsed(0);
    startTime = Date.now();
    buildQuestion();
  }
});
