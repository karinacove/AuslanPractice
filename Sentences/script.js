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

  const comboDiv = document.createElement("div");

  if(currentLevel <= 3){
    // Use previous logic for Levels 1-3
    // ...omitted here for brevity, keep as in your previous script
  }

  // Level 4
  else {
    if(isOdd){
      // Case 1: Question = individual signs, draggable = composite images
      [currentSentence.animal,currentSentence.number,currentSentence.verb,currentSentence.food,currentSentence.colour].forEach(word=>{
        const img = document.createElement("img");
        img.src = signPathFor(word);
        comboDiv.appendChild(img);
      });
      buildAnswerBoxes(2); // two answer boxes
      buildLevel4DraggablesCase1(); 
    } else {
      // Case 2: Question = composite images
      const aniNumDiv = document.createElement("img");
      aniNumDiv.src = compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`);
      comboDiv.appendChild(aniNumDiv);

      const foodColDiv = document.createElement("div");
      const foodImg = document.createElement("img");
      foodImg.src = compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`);
      foodColDiv.appendChild(foodImg);
      if(currentSentence.verb === "donthave"){
        const xDiv = document.createElement("div");
        xDiv.className="xOverlay"; xDiv.textContent="X";
        foodColDiv.appendChild(xDiv);
      }
      comboDiv.appendChild(foodColDiv);

      buildAnswerBoxes(5); // five answer boxes
      buildLevel4DraggablesCase2(); 
    }
  }

  questionArea.appendChild(comboDiv);
  startTime=Date.now();
}

/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(count){
  answerArea.innerHTML="";
  for(let i=0;i<count;i++){
    const div=document.createElement("div");
    div.className="answerBox";
    div.dataset.index=i;
    div.addEventListener("dragover",allowDrop);
    div.addEventListener("drop",dropItem);
    answerArea.appendChild(div);
  }
}

/* ===== DRAG & DROP HELPERS ===== */
let draggedItem=null;
function dragStart(ev){ draggedItem=ev.target; }
function allowDrop(ev){ ev.preventDefault(); }
function dropItem(ev){
  ev.preventDefault();
  if(!draggedItem) return;
  ev.target.appendChild(draggedItem);
}

/* ===== BUILD DRAGGABLES LEVEL 4 CASE 1 ===== */
function buildLevel4DraggablesCase1(){
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  const correctAnimalNumber = compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`);
  const correctFoodColour = compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`);
  const items = [];

  items.push({src: correctAnimalNumber, correct:true});
  items.push({src: correctFoodColour, correct:true, xOverlay: currentSentence.verb==="donthave"});

  // Add decoys
  for(let i=0;i<14;i++){
    const decoyAnimal=randomItem(animals);
    const decoyNumber=randomItem(numbers);
    const decoyFood=randomItem(food);
    const decoyColour=randomItem(colours);
    if(i%2===0) items.push({src: compositeImagePath(`${decoyAnimal}-${decoyNumber}`), correct:false});
    else items.push({src: compositeImagePath(`${decoyFood}-${decoyColour}`), correct:false, xOverlay: Math.random()<0.5});
  }

  const shuffled = shuffleArray(items);
  shuffled.forEach((item,i)=>{
    const img = document.createElement("img");
    img.src=item.src;
    img.draggable=true;
    img.addEventListener("dragstart",dragStart);
    if(item.xOverlay){
      const xDiv = document.createElement("div");
      xDiv.className="xOverlay"; xDiv.textContent="X";
      img.parentElement?.appendChild(xDiv);
    }
    if(i<8) leftDraggables.appendChild(img);
    else rightDraggables.appendChild(img);
  });
}

/* ===== BUILD DRAGGABLES LEVEL 4 CASE 2 ===== */
function buildLevel4DraggablesCase2(){
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  const items=[];

  // correct signs
  [currentSentence.animal,currentSentence.number,currentSentence.verb,currentSentence.food,currentSentence.colour].forEach(word=>{
    items.push({src:signPathFor(word), correct:true});
  });

  // decoys
  for(let i=0;i<11;i++){
    const decoyWord=randomItem([...animals,...numbers,...food,...colours,...verbs]);
    items.push({src:signPathFor(decoyWord), correct:false});
  }

  const shuffled = shuffleArray(items);
  shuffled.forEach((item,i)=>{
    const img = document.createElement("img");
    img.src=item.src;
    img.draggable=true;
    img.addEventListener("dragstart",dragStart);
    if(i<8) leftDraggables.appendChild(img);
    else rightDraggables.appendChild(img);
  });
}

/* ===== CHECK ANSWERS ===== */
checkBtn.onclick=function(){
  let allCorrect=true;
  const boxes=answerArea.querySelectorAll(".answerBox");
  boxes.forEach((box,i)=>{
    const item=box.querySelector("img");
    if(!item) { allCorrect=false; return; }
    // validate logic depending on level/case
    // omitted for brevity
  });

  if(allCorrect){ feedbackDiv.textContent="Correct!"; correctCount++; levelCorrect[currentLevel]++; }
  else { feedbackDiv.textContent="Incorrect."; incorrectCount++; levelIncorrect[currentLevel]++; }

  answersHistory.push({sentence: currentSentence, correct: allCorrect});
  againBtn.style.display="inline-block";
};

/* ===== AGAIN BUTTON ===== */
againBtn.onclick=function(){
  buildQuestion();
  checkBtn.style.display="inline-block";
  againBtn.style.display="none";
  feedbackDiv.innerHTML="";
};

/* ===== STOP/FINISH ===== */
finishBtn.onclick=function(){
  sendToGoogleForm();
  clearProgress();
  alert(`Finished! Your score: ${correctCount} correct, ${incorrectCount} incorrect.`);
  window.location.href="../hub.html";
};

/* ===== GOOGLE FORM SUBMIT ===== */
function sendToGoogleForm(){
  const formData=new FormData();
  formData.append(FORM_FIELD_MAP.name,studentName);
  formData.append(FORM_FIELD_MAP.class,studentClass);
  formData.append(FORM_FIELD_MAP.subject,"Auslan Sentences");
  formData.append(FORM_FIELD_MAP.timeTaken,getTimeElapsed());
  const percent=Math.round((correctCount/(correctCount+incorrectCount))*100);
  formData.append(FORM_FIELD_MAP.percent,percent);

  for(let lvl=1;lvl<=TOTAL_LEVELS;lvl++){
    formData.append(FORM_FIELD_MAP[`level${lvl}`].correct,levelCorrect[lvl]);
    formData.append(FORM_FIELD_MAP[`level${lvl}`].incorrect,levelIncorrect[lvl]);
  }

  fetch(googleForm.action,{method:"POST",body:formData}).catch(console.error);
}

/* ===== INITIALISE GAME ===== */
const saved=loadProgress();
if(saved){ showResumeModal(saved); }
else { buildQuestion(); }
