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

/* ===== DOM ELEMENTS ===== */
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
let levelCorrect = {1:0,2:0,3:0,4:0};
let levelIncorrect = {1:0,2:0,3:0,4:0};
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

/* ===== SENTENCE GENERATION ===== */
function generateSentence(){
  const animal=randomItem(animals);
  const number=randomItem(numbers);
  const foodItem=randomItem(food);
  const colour=randomItem(colours);
  const verb=(currentLevel===4)?randomItem(["have","donthave"]):"want";
  currentSentence={animal,number,food:foodItem,colour,verb};
}

/* ===== BUILD QUESTION ===== */
function buildQuestion(){
  generateSentence();
  questionArea.innerHTML=""; answerArea.innerHTML=""; feedbackDiv.innerHTML="";
  checkBtn.style.display="none"; againBtn.style.display="none";

  const isOdd=roundInLevel%2===1;

  if(currentLevel<=2){
    const helperDiv=document.createElement("div");
    helpers.forEach(h=>{ const img=document.createElement("img"); img.src=signPathFor(h); helperDiv.appendChild(img); });
    questionArea.appendChild(helperDiv);
  }

  const comboDiv=document.createElement("div");
  if(isOdd){
    if(currentLevel===1) comboDiv.innerHTML=`<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}">`;
    else if(currentLevel===2) comboDiv.innerHTML=`<img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`;
    else if(currentLevel===3) comboDiv.innerHTML=`<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`;
    else if(currentLevel===4){
      const verbImg=currentSentence.verb==="donthave"?`<div class="dontHaveWrapper"><img src="${signPathFor('have')}"><div class="xOverlay">X</div></div>`:`<img src="${signPathFor('have')}">`;
      comboDiv.innerHTML=`<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}">${verbImg}<img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`;
    }
  } else {
    if(currentLevel===1) comboDiv.innerHTML=`<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}">`;
    else if(currentLevel===2) comboDiv.innerHTML=`<img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
    else if(currentLevel===3) comboDiv.innerHTML=`<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
    else if(currentLevel===4){
      const verbImg=currentSentence.verb==="donthave"?`<div class="dontHaveWrapper"><img src="${signPathFor('have')}"><div class="xOverlay">X</div></div>`:`<img src="${signPathFor('have')}">`;
      comboDiv.innerHTML=`<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}">${verbImg}<img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
    }
  }
  questionArea.appendChild(comboDiv);
  buildAnswerBoxes(isOdd); buildDraggables(isOdd); updateScoreDisplay();
}

/* ===== FULL ANSWER BOX + DRAGGABLE + CHECK/AGAIN LOGIC ===== */
let dragItem=null, dragClone=null, isTouch=false;

function buildAnswerBoxes(isOdd){
  answerArea.innerHTML="";
  let dropLabels=[];
  if(currentLevel===1) dropLabels=isOdd?["animal","howmany?"]:["animal+howmany?"];
  else if(currentLevel===2) dropLabels=isOdd?["food","colour"]:["food+colour"];
  else if(currentLevel===3) dropLabels=isOdd?["animal","howmany?","verb","food","colour"]:["animal+howmany?","verb","food+colour"];
  else if(currentLevel===4) dropLabels=isOdd?["animal","howmany?","verb","food","colour"]:["animal+howmany?","verb","food+colour"];

  dropLabels.forEach(label=>{
    const dz=document.createElement("div"); dz.className="dropzone"; dz.dataset.placeholder=label;
    dz.addEventListener("dragover", e=>e.preventDefault());
    dz.addEventListener("drop", dropHandler);

    if(currentLevel===3 && label==="verb"){
      const img=document.createElement("img"); img.src=signPathFor("want");
      dz.appendChild(img);
      dz.dataset.filled="want"; dz.classList.add("filled"); dz.dataset.permanent="true";
    }
    answerArea.appendChild(dz);
  });
}

function buildDraggables(isOdd){
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  let items=[], totalItems=16;

  if(currentLevel===1) items=isOdd?[currentSentence.animal,currentSentence.number]:[currentSentence.animal+"-"+currentSentence.number];
  else if(currentLevel===2) items=isOdd?[currentSentence.food,currentSentence.colour]:[currentSentence.food+"-"+currentSentence.colour];
  else if(currentLevel===3) items=isOdd?[currentSentence.animal,currentSentence.number,currentSentence.food,currentSentence.colour]:[currentSentence.animal+"-"+currentSentence.number,currentSentence.food+"-"+currentSentence.colour];
  else if(currentLevel===4) items=[`${currentSentence.animal}-${currentSentence.number}-${currentSentence.verb}-${currentSentence.food}-${currentSentence.colour}`];

  const used = new Set(items);
  while(items.length<totalItems){
    let decoy;
    if(isOdd){
      if(currentLevel===1) decoy=randomItem([...animals,...numbers]);
      else if(currentLevel===2) decoy=randomItem([...food,...colours]);
      else if(currentLevel===3) decoy=randomItem([...animals,...numbers,...food,...colours]);
      else decoy=randomItem([...animals,...numbers,...food,...colours,...verbs]);
    } else {
      let allCombos=[];
      if(currentLevel===1) allCombos=animals.flatMap(a=>numbers.map(n=>`${a}-${n}`));
      else if(currentLevel===2) allCombos=food.flatMap(f=>colours.map(c=>`${f}-${c}`));
      else if(currentLevel===3) allCombos=[...animals.flatMap(a=>numbers.map(n=>`${a}-${n}`)),...food.flatMap(f=>colours.map(c=>`${f}-${c}`))];
      decoy=randomItem(allCombos);
    }
    if(!used.has(decoy)){ items.push(decoy); used.add(decoy); }
  }

  items=shuffleArray(items);
  const halves=[items.slice(0,8),items.slice(8,16)];
  halves.forEach((group,idx)=>{
    const container=idx===0?leftDraggables:rightDraggables;
    group.forEach(word=>{
      const div=document.createElement("div"); div.className="draggable"; div.draggable=true; div.dataset.word=word;
      const img=document.createElement("img"); 
      img.src=isOdd?signPathFor(word.includes('-')?word.split('-')[0]:word):compositeImagePath(word);
      div.appendChild(img);
      div.addEventListener("dragstart", dragStart); div.addEventListener("touchstart", touchStart);
      container.appendChild(div);
    });
  });
}

/* ===== DRAG & DROP ===== */
function dragStart(e){ dragItem=this; }
function dropHandler(e){
  e.preventDefault();
  if(this.dataset.permanent==="true") return;
  const draggedWord=dragItem.dataset.word;
  this.innerHTML=""; const img=document.createElement("img"); img.src=dragItem.querySelector("img").src; this.appendChild(img);
  this.dataset.filled=draggedWord; this.classList.add("filled");
  dragItem.remove(); dragItem=null;
  checkBtn.style.display="inline-block";
}

/* ===== TOUCH SUPPORT ===== */
function touchStart(e){ dragItem=this; isTouch=true; }
function touchMove(e){ if(!isTouch) return; e.preventDefault(); }
function touchEnd(e){ isTouch=false; }

/* ===== CHECK / AGAIN BUTTONS ===== */
checkBtn.addEventListener("click", ()=>{
  let correct=true;
  const dzs=[...document.querySelectorAll(".dropzone")];
  dzs.forEach(dz=>{
    if(!dz.dataset.permanent){
      if(dz.dataset.filled!==dz.dataset.placeholder) correct=false;
    }
  });
  if(correct){
    feedbackDiv.textContent="Correct!";
    correctCount++; levelCorrect[currentLevel]++;
    answersHistory.push({sentence:currentSentence,correct:true});
    nextRound();
  } else {
    feedbackDiv.textContent="Some items are incorrect.";
    incorrectCount++; levelIncorrect[currentLevel]++;
    answersHistory.push({sentence:currentSentence,correct:false});
    againBtn.style.display="inline-block";
  }
});

againBtn.addEventListener("click", ()=>{ buildQuestion(); });

function nextRound(){
  roundInLevel++;
  if(roundInLevel>=4){ // per level pages
    currentLevel++;
    roundInLevel=0;
  }
  if(currentLevel> TOTAL_LEVELS){ endGame(); return; }
  buildQuestion();
}

function updateScoreDisplay(){ scoreDisplay.textContent=`Correct: ${correctCount} | Incorrect: ${incorrectCount}`; }

/* ===== END GAME ===== */
function endGame(){
  saveProgress();
  const percent=Math.round((correctCount/(correctCount+incorrectCount))*100);
  endModal.querySelector("#scoreDisplayEnd").textContent=`Your score: ${percent}%`;
  endModal.style.display="flex";
  submitToGoogleForm(percent);
}

async function submitToGoogleForm(percent){
  const formData=new FormData();
  formData.append(FORM_FIELD_MAP.name,studentName);
  formData.append(FORM_FIELD_MAP.class,studentClass);
  formData.append(FORM_FIELD_MAP.subject,"Sentences");
  formData.append(FORM_FIELD_MAP.timeTaken,getTimeElapsed());
  formData.append(FORM_FIELD_MAP.percent,percent);
  for(let lvl=1;lvl<=TOTAL_LEVELS;lvl++){
    formData.append(FORM_FIELD_MAP[`level${lvl}`].correct,levelCorrect[lvl]);
    formData.append(FORM_FIELD_MAP[`level${lvl}`].incorrect,levelIncorrect[lvl]);
  }
  await fetch(googleForm.action,{method:"POST",body:formData,mode:"no-cors"});
  clearProgress();
}

/* ===== RESET GAME ===== */
function resetGame(){
  currentLevel=1; roundInLevel=0; correctCount=0; incorrectCount=0;
  answersHistory=[]; levelCorrect={1:0,2:0,3:0,4:0}; levelIncorrect={1:0,2:0,3:0,4:0};
  savedTimeElapsed=0; startTime=Date.now();
  buildQuestion();
}

/* ===== INIT ===== */
window.addEventListener("load",()=>{
  const saved=loadProgress();
  if(saved && saved.studentName){ showResumeModal(saved); }
  else resetGame();
});
