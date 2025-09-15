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
const againBtnEnd = document.getElementById("againBtnEnd");
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

/* ===== GENERATE SENTENCE ===== */
function generateSentence(){
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const foodItem = randomItem(food);
  const colour = randomItem(colours);
  const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";

  currentSentence = { animal, number, food: foodItem, colour, verb };
}

/* ===== BUILD QUESTION ===== */
function buildQuestion(){
  generateSentence();
  questionArea.innerHTML = "";
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const isOdd = roundInLevel % 2 === 1;
  if(currentLevel <= 2){
    const helperDiv=document.createElement("div");
    helpers.forEach(h=>{
      const img=document.createElement("img");
      img.src=signPathFor(h);
      helperDiv.appendChild(img);
    });
    questionArea.appendChild(helperDiv);
  }

  const comboDiv=document.createElement("div");
  comboDiv.className="questionCombo";

  if(currentLevel<4){
    if(currentLevel===1){
      comboDiv.innerHTML=isOdd
        ? `<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}">`
        : `<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}">`;
    } else if(currentLevel===2){
      comboDiv.innerHTML=isOdd
        ? `<img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`
        : `<img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
    } else if(currentLevel===3){
      comboDiv.innerHTML=isOdd
        ? `<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`
        : `<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
    }
    questionArea.appendChild(comboDiv);
    buildAnswerBoxes(isOdd);
    buildDraggables(isOdd);
    updateScoreDisplay();
    return;
  }

  // ===== LEVEL 4 =====
  const showSigns = Math.random()<0.5;
  currentSentence.showSigns = showSigns;

  if(showSigns){
    // Question is signs → draggable images
    [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour].forEach(word=>{
      const img=document.createElement("img");
      img.src=signPathFor(word);
      comboDiv.appendChild(img);
    });
    buildAnswerBoxes(true); 
    buildDraggablesLevel4("images");
  } else {
    // Question is images → draggable signs
    const animalNumberImg = Object.assign(document.createElement("img"), {src:compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`)});
    const foodColourImg = Object.assign(document.createElement("img"), {src:compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`)});
    comboDiv.appendChild(animalNumberImg);
    comboDiv.appendChild(foodColourImg);
    if(currentSentence.verb==="donthave"){
      const xDiv=document.createElement("div");
      xDiv.className="xOverlay";
      xDiv.textContent="X";
      comboDiv.appendChild(xDiv);
    }
    buildAnswerBoxes(false);
    buildDraggablesLevel4("signs");
  }

  questionArea.appendChild(comboDiv);
  updateScoreDisplay();
}

/* ===== BUILD LEVEL 4 DRAGGABLES ===== */
function buildDraggablesLevel4(type){
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  const items=[currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];

  const totalItems=16;
  const used=new Set(items);
  while(items.length<totalItems){
    let decoy=randomItem([...animals,...numbers,...food,...colours,...verbs]);
    if(!used.has(decoy)){ items.push(decoy); used.add(decoy); }
  }

  const shuffled=shuffleArray(items);
  const halves=[shuffled.slice(0,8), shuffled.slice(8,16)];

  halves.forEach((group,idx)=>{
    const container=idx===0?leftDraggables:rightDraggables;
    group.forEach(val=>{
      const div=document.createElement("div");
      div.className="draggable";
      div.draggable=true;
      let img=document.createElement("img");
      if(type==="images"){
        if(verbs.includes(val)) img.src=compositeImagePath(val);
        else if(animals.includes(val)) img.src=compositeImagePath(`${val}-${currentSentence.number}`);
        else if(food.includes(val)) img.src=compositeImagePath(`${val}-${currentSentence.colour}`);
        else if(colours.includes(val)) img.src=compositeImagePath(`${currentSentence.food}-${val}`);
      } else { img.src=signPathFor(val); }
      div.appendChild(img);
      container.appendChild(div);
      div.addEventListener("dragstart",dragStart);
      div.addEventListener("touchstart",touchStart);
    });
  });
}

/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(useSigns){
  answerArea.innerHTML="";
  const words=[currentSentence.animal,currentSentence.number,currentSentence.verb,currentSentence.food,currentSentence.colour];
  words.forEach(w=>{
    const div=document.createElement("div");
    div.className="answerBox";
    div.dataset.correct=w;
    answerArea.appendChild(div);
  });
}

/* ===== DRAG & DROP ===== */
function dragStart(e){ e.dataTransfer.setData("text/plain",e.target.firstChild.src); }
function touchStart(e){ e.dataTransfer=setTouchData(e.target.firstChild.src); }
function allowDrop(e){ e.preventDefault(); }
function drop(e){ e.preventDefault(); const src=e.dataTransfer.getData("text/plain"); e.target.appendChild(Object.assign(document.createElement("img"),{src})); }

/* ===== CHECK ANSWERS ===== */
function checkAnswers(){
  let correct=0,incorrect=0;
  const boxes=document.querySelectorAll(".answerBox");
  boxes.forEach(b=>{
    const img=b.querySelector("img");
    if(!img) return incorrect++;
    const val=b.dataset.correct;
    if(img.src.includes(val)) correct++; else incorrect++;
  });
  correctCount+=correct; incorrectCount+=incorrect;
  levelCorrect[currentLevel]+=correct; levelIncorrect[currentLevel]+=incorrect;
  answersHistory.push({level:currentLevel, correct, incorrect});
  roundInLevel++;
  if(roundInLevel>=3){ 
    if(currentLevel<TOTAL_LEVELS){ currentLevel++; roundInLevel=0; } 
    else endGame();
  }
  buildQuestion();
}

/* ===== SCORE DISPLAY ===== */
function updateScoreDisplay(){ scoreDisplay.textContent=`Level ${currentLevel} - Correct: ${correctCount} | Incorrect: ${incorrectCount}`; }

/* ===== END GAME ===== */
function endGame(){
  const timeTaken=getTimeElapsed();
  endModal.style.display="flex";
  document.getElementById("totalScore").textContent=`Score: ${correctCount} / ${correctCount+incorrectCount} in ${timeTaken} sec`;
  submitToGoogleForm();
}

/* ===== GOOGLE FORM SUBMISSION ===== */
function submitToGoogleForm(){
  const formData=new FormData();
  formData.append(FORM_FIELD_MAP.name,studentName);
  formData.append(FORM_FIELD_MAP.class,studentClass);
  formData.append(FORM_FIELD_MAP.subject,"Sentences");
  formData.append(FORM_FIELD_MAP.timeTaken,getTimeElapsed());
  const total=(correctCount+incorrectCount);
  formData.append(FORM_FIELD_MAP.percent,Math.round((correctCount/total)*100));
  for(let l=1;l<=TOTAL_LEVELS;l++){
    formData.append(FORM_FIELD_MAP[`level${l}`].correct,levelCorrect[l]);
    formData.append(FORM_FIELD_MAP[`level${l}`].incorrect,levelIncorrect[l]);
  }
  fetch("https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse",{method:"POST",body:formData,mode:"no-cors"});
}

/* ===== EVENT LISTENERS ===== */
checkBtn.addEventListener("click",checkAnswers);
againBtn.addEventListener("click",()=>buildQuestion());
finishBtn.addEventListener("click",endGame);
stopBtn.addEventListener("click",endGame);

/* ===== INIT ===== */
const saved=loadProgress();
if(saved) showResumeModal(saved); else buildQuestion();
