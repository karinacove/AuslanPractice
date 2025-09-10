/* ===== CONFIG ===== */
const FORM_FIELD_MAP = {
  name: "entry.1040637824",
  class: "entry.1755746645",
  subject: "entry.1979136660",
  timeTaken: "entry.120322685",
  percent: "entry.1519181393",
  level1: { correct: "entry.1150173566", incorrect: "entry.28043347" },
  level2: { correct: "entry.1424808967", incorrect: "entry.352093752" },
  level3: { correct: "entry.475324608", incorrect: "entry.1767451434" },
  level4: { correct: "entry.1405337882", incorrect: "entry.1513946929" }
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
const googleForm = document.getElementById("googleForm");

/* ===== MODAL BUTTONS ===== */
const againBtnEnd = document.getElementById("againBtnEnd");
const againBtnStop = document.getElementById("againBtnStop");
const finishBtn = document.getElementById("finishBtn");
const finishBtnStop = document.getElementById("finishBtnStop");

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

/* ===== GAME VARIABLES ===== */
let currentLevel = 1;
let roundInLevel = 0;
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let startTime = null;
let savedTimeElapsed = 0;
let answersHistory = [];
let levelCorrect = { 1: 0, 2: 0, 3: 0, 4: 0 };
let levelIncorrect = { 1: 0, 2: 0, 3: 0, 4: 0 };
const TOTAL_LEVELS = 4;

/* ===== VOCAB ===== */
const animals = ["dog","cat","mouse","rabbit","fish","bird"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const food = ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"];
const verbs = ["want","have","donthave"];
const helpers = ["i","see","what"];

/* ===== HELPERS ===== */
function shuffleArray(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function signPathFor(word){
  if(animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if(numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if(food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if(colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if(verbs.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if(helpers.includes(word)) return `assets/signs/helpers/${word}.png`;
  return "";
}
function compositeImagePath(combo){ return `assets/images/${combo}.png`; }

/* ===== TIMER HELPERS ===== */
function getTimeElapsed(){ return savedTimeElapsed + Math.round((Date.now()-startTime)/1000); }
function setTimeElapsed(seconds){ savedTimeElapsed=seconds; startTime=Date.now(); }

/* ===== SAVE/RESUME ===== */
const SAVE_KEY = "sentencesGameSave";
function saveProgress(){
  localStorage.setItem(SAVE_KEY,JSON.stringify({
    studentName, studentClass, currentLevel, roundInLevel, correctCount, incorrectCount,
    answersHistory, levelCorrect, levelIncorrect, timeElapsed:getTimeElapsed()
  }));
}
function loadProgress(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch{return null;} }
function clearProgress(){ localStorage.removeItem(SAVE_KEY); }

function showResumeModal(saved){
  const modal=document.getElementById("resumeModal");
  const msg=document.getElementById("resumeMessage");
  const cont=document.getElementById("resumeContinue");
  const again=document.getElementById("resumeAgain");
  msg.textContent=`Welcome back ${saved.studentName}! Continue from Level ${saved.currentLevel}, Question ${saved.roundInLevel+1}?`;
  cont.onclick=()=>{ modal.style.display="none"; restoreProgress(saved); };
  again.onclick=()=>{ modal.style.display="none"; clearProgress(); resetGame(); };
  modal.style.display="flex";
}

function restoreProgress(saved){
  studentName=saved.studentName; studentClass=saved.studentClass;
  currentLevel=saved.currentLevel; roundInLevel=saved.roundInLevel;
  correctCount=saved.correctCount; incorrectCount=saved.incorrectCount;
  answersHistory=saved.answersHistory||[];
  levelCorrect=saved.levelCorrect||{1:0,2:0,3:0,4:0};
  levelIncorrect=saved.levelIncorrect||{1:0,2:0,3:0,4:0};
  setTimeElapsed(saved.timeElapsed||0);
  buildQuestion();
}

/* ===== SENTENCE GENERATION (unchanged) ===== */
// ... keep all your sentence, buildQuestion, drag/drop, check answer, again button code ...

/* ===== GAME FLOW ===== */
function nextRound(){ 
  roundInLevel++; 
  if(roundInLevel>=10) endLevel(); 
  else { buildQuestion(); saveProgress(); } 
}

/* ===== SUBMISSION ===== */
async function submitResults(){
  const timeTaken=getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent = totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0;

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name,studentName);
  fd.append(FORM_FIELD_MAP.class,studentClass);
  fd.append(FORM_FIELD_MAP.subject,"Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken,timeTaken);
  fd.append(FORM_FIELD_MAP.percent,percent);

  for(let l=1;l<=TOTAL_LEVELS;l++){
    const cf=FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf=FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if(cf) fd.append(cf,levelCorrect[l]);
    if(inf) fd.append(inf,levelIncorrect[l]);
  }

  try{ await fetch(googleForm.action,{method:"POST",body:fd,mode:"no-cors"}); }
  catch(err){ console.warn("Form submission failed",err); }
}

/* ===== END LEVEL/FINISH LOGIC ===== */
async function endLevel(){
  if(currentLevel < TOTAL_LEVELS){  
    // Move to next level
    currentLevel++;
    roundInLevel = 0;
    buildQuestion();
    saveProgress();
  } else {
    // Final level reached → now finish
    await submitResults();
    clearProgress();
    endModal.style.display="block";
    document.getElementById("endGif").src="assets/auslan-clap.gif";
    const totalCorrect = correctCount;
    const totalAttempts = correctCount+incorrectCount;
    document.getElementById("finalScore").textContent=`${totalCorrect}/${totalAttempts}`;
    document.getElementById("finalPercent").textContent=Math.round((totalCorrect/totalAttempts)*100)+"%";
  }
}

/* ===== END MODAL BUTTONS ===== */
finishBtn.onclick=()=>window.location.href="../index.html";
againBtnEnd.onclick=()=>{ endModal.style.display="none"; resetGame(); };

/* ===== STOP BUTTON ===== */
stopBtn.addEventListener("click",()=>{
  savedTimeElapsed=getTimeElapsed();
  const percent=Math.round((correctCount/(correctCount+incorrectCount))*100);
  const modal=document.getElementById("stopModal"); modal.style.display="block";
  document.getElementById("stopTime").textContent=`${Math.floor(savedTimeElapsed/60)}m ${savedTimeElapsed%60}s`;
  document.getElementById("stopPercent").textContent=percent+"%";

  document.getElementById("continueBtn").onclick=()=>{ modal.style.display="none"; startTime=Date.now(); };
  document.getElementById("againBtnStop").onclick=()=>{ modal.style.display="none"; resetGame(); };
  document.getElementById("finishBtnStop").onclick=async()=>{
    modal.style.display="none";
    await submitResults();
    clearProgress();
    window.location.href="../index.html";
  };
});

/* ===== START/RESET GAME ===== */
function startGame(){ startTime=Date.now(); buildQuestion(); }
function resetGame(){ currentLevel=1; roundInLevel=0; correctCount=0; incorrectCount=0; savedTimeElapsed=0; startGame(); }
function updateScoreDisplay(){ scoreDisplay.textContent=`Level ${currentLevel} - Question ${roundInLevel+1}/10`; }

/* ===== INIT ===== */
window.addEventListener("load",()=>{
  const saved=loadProgress();
  if(saved&&saved.studentName){ showResumeModal(saved); }
  else resetGame();
});
