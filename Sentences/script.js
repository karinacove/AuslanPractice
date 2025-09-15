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
function buildQuestion() {
  generateSentence();
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const isOdd = roundInLevel % 2 === 1;

  if (currentLevel <= 2) {
    const helperDiv = document.createElement("div");
    helpers.forEach(h => {
      const img = document.createElement("img");
      img.src = signPathFor(h);
      helperDiv.appendChild(img);
    });
    questionArea.appendChild(helperDiv);
  }

  const comboDiv = document.createElement("div");

  if (currentLevel === 1) {
    comboDiv.innerHTML = isOdd
      ? `<img src="${compositeImagePath(currentSentence.animal + '-' + currentSentence.number)}">`
      : `<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}">`;
  } else if (currentLevel === 2) {
    comboDiv.innerHTML = isOdd
      ? `<img src="${compositeImagePath(currentSentence.food + '-' + currentSentence.colour)}">`
      : `<img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
  } else if (currentLevel === 3) {
    comboDiv.innerHTML = isOdd
      ? `<img src="${compositeImagePath(currentSentence.animal + '-' + currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${compositeImagePath(currentSentence.food + '-' + currentSentence.colour)}">`
      : `<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
  } else if (currentLevel === 4) {
    if (isOdd) {
      const animalNumberImg = Object.assign(document.createElement("img"), { src: compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`) });
      comboDiv.appendChild(animalNumberImg);

      const foodColourImg = Object.assign(document.createElement("img"), { src: compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`) });
      if (currentSentence.verb === "donthave") {
        const wrapper = document.createElement("div");
        wrapper.className = "dontHaveWrapper";
        const xDiv = document.createElement("div");
        xDiv.className = "xOverlay";
        xDiv.textContent = "X";
        wrapper.appendChild(foodColourImg);
        wrapper.appendChild(xDiv);
        comboDiv.appendChild(wrapper);
      } else {
        comboDiv.appendChild(foodColourImg);
      }
    } else {
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.animal) }));
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.number) }));
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.verb) }));
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.food) }));
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.colour) }));
    }
  }

  questionArea.appendChild(comboDiv);
  buildDraggables();
  startTime = Date.now();
}

/* ===== BUILD DRAGGABLES ===== */
function buildDraggables() {
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";

  let items = [];

  if (currentLevel === 4) {
    items.push(currentSentence.animal, currentSentence.number, currentSentence.food, currentSentence.colour, currentSentence.verb);
    // Add decoys
    const decoyVerbs = ["want","have","donthave"].filter(v => v!==currentSentence.verb);
    items.push(randomItem(animals), randomItem(numbers), randomItem(food), randomItem(colours), randomItem(decoyVerbs));
    items = shuffleArray(items);
  } else {
    items = shuffleArray([currentSentence.animal,currentSentence.number,currentSentence.food,currentSentence.colour]);
  }

  items.forEach(it=>{
    const div=document.createElement("div");
    div.className="draggable";
    div.draggable=true;
    const img = document.createElement("img");
    img.src = signPathFor(it);
    div.appendChild(img);
    leftDraggables.appendChild(div);

    div.addEventListener("dragstart",dragStart);
    div.addEventListener("touchstart",touchStart);
  });
}

/* ===== DRAG & DROP ===== */
let dragged=null;
function dragStart(e){ dragged=this; }
function allowDrop(e){ e.preventDefault(); }
function drop(e){
  e.preventDefault();
  if(dragged){ this.appendChild(dragged); dragged=null; }
}

/* ===== TOUCH SUPPORT ===== */
function touchStart(e){
  dragged=this;
  e.preventDefault();
  document.addEventListener("touchmove", touchMove, {passive:false});
  document.addEventListener("touchend", touchEnd);
}
function touchMove(e){ e.preventDefault(); const touch=e.touches[0]; const el=document.elementFromPoint(touch.clientX,touch.clientY); if(el && el.classList.contains("droppable")){el.style.background="#ddd";} }
function touchEnd(e){
  document.removeEventListener("touchmove", touchMove);
  document.removeEventListener("touchend", touchEnd);
  const touch=e.changedTouches[0];
  const el=document.elementFromPoint(touch.clientX,touch.clientY);
  if(el && el.classList.contains("droppable") && dragged){
    el.appendChild(dragged);
    dragged=null;
  }
}

/* ===== CHECK ANSWERS ===== */
checkBtn.addEventListener("click",()=>{
  let correctThisRound=0;
  let incorrectThisRound=0;
  const draggables=leftDraggables.querySelectorAll(".draggable img");
  draggables.forEach(d=>{
    const val=d.src.split("/").pop().replace("-sign.png","");
    if(Object.values(currentSentence).includes(val)){
      correctThisRound++;
    } else {
      incorrectThisRound++;
    }
  });
  levelCorrect[currentLevel]+=correctThisRound;
  levelIncorrect[currentLevel]+=incorrectThisRound;
  correctCount+=correctThisRound;
  incorrectCount+=incorrectThisRound;
  feedbackDiv.textContent=`Correct: ${correctThisRound}, Incorrect: ${incorrectThisRound}`;
  roundInLevel++;
  if(roundInLevel>=3){
    nextLevel();
  }else{
    againBtn.style.display="inline-block";
    checkBtn.style.display="none";
  }
});

/* ===== AGAIN BUTTON ===== */
againBtn.addEventListener("click",()=>{
  buildQuestion();
});

/* ===== LEVEL PROGRESSION ===== */
function nextLevel(){
  if(currentLevel<TOTAL_LEVELS){
    currentLevel++;
    roundInLevel=0;
    buildQuestion();
  }else{
    endGame();
  }
}

/* ===== END GAME ===== */
function endGame(){
  const timeTaken = getTimeElapsed();
  const minutes=Math.floor(timeTaken/60); const seconds=timeTaken%60;
  const percent=Math.round(correctCount/(correctCount+incorrectCount)*100);
  scoreDisplay.textContent=`${percent}% - ${minutes}m ${seconds}s`;
  endModal.style.display="flex";

  // Google Form submission
  const formData = new FormData();
  formData.append(FORM_FIELD_MAP.name, studentName);
  formData.append(FORM_FIELD_MAP.class, studentClass);
  formData.append(FORM_FIELD_MAP.subject, "Sentences");
  formData.append(FORM_FIELD_MAP.timeTaken, `${minutes} mins ${seconds} sec`);
  formData.append(FORM_FIELD_MAP.percent, percent);
  for(let lvl=1;lvl<=TOTAL_LEVELS;lvl++){
    formData.append(FORM_FIELD_MAP[`level${lvl}`].correct, levelCorrect[lvl]);
    formData.append(FORM_FIELD_MAP[`level${lvl}`].incorrect, levelIncorrect[lvl]);
  }
  fetch(googleForm.action,{method:"POST",body:formData,mode:"no-cors"});
  clearProgress();
}

/* ===== FINISH BUTTON ===== */
finishBtn.addEventListener("click",()=>{
  endGame();
});

/* ===== START GAME ===== */
const saved = loadProgress();
if(saved){ showResumeModal(saved); }
else{ buildQuestion(); }

