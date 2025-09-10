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
const logoffBtn = document.getElementById("logoffBtn");

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
function shuffleArray(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
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
function setTimeElapsed(seconds){ savedTimeElapsed = seconds; startTime = Date.now(); }

/* ===== PROGRESS SAVE/RESUME ===== */
const SAVE_KEY = "sentencesGameSave";
function saveProgress(){
  const saveData = {studentName, studentClass, currentLevel, roundInLevel, correctCount, incorrectCount, answersHistory, levelCorrect, levelIncorrect, timeElapsed:getTimeElapsed()};
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}
function loadProgress(){ try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } }
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
  studentName=saved.studentName;
  studentClass=saved.studentClass;
  currentLevel=saved.currentLevel;
  roundInLevel=saved.roundInLevel;
  correctCount=saved.correctCount;
  incorrectCount=saved.incorrectCount;
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
  currentSentence={animal, number, food:foodItem, colour, verb};
}

/* ===== BUILD QUESTION ===== */
function buildQuestion(){
  generateSentence();
  const isOdd=roundInLevel%2===1;
  buildQuestionArea(isOdd);
  buildAnswerBoxes(isOdd);
  buildDraggables(isOdd);
  updateScoreDisplay();
  checkBtn.style.display="none";
  againBtn.style.display="none";
  feedbackDiv.innerHTML="";
}

function buildQuestionArea(isOdd){
  questionArea.innerHTML = "";
  let items = [];

  switch(currentLevel){
    case 1:
      // Level 1: animal + number
      items = isOdd ? [currentSentence.animal, currentSentence.number]
                    : [`${currentSentence.animal}-${currentSentence.number}`];
      break;

    case 2:
      // Level 2: food + colour
      items = isOdd ? [currentSentence.food, currentSentence.colour]
                    : [`${currentSentence.food}-${currentSentence.colour}`];
      break;

    case 3:
      // Level 3: mixed sentence
      items = isOdd
        ? [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour]
        : [`${currentSentence.animal}-${currentSentence.number}`, currentSentence.verb, `${currentSentence.food}-${currentSentence.colour}`];
      break;

    case 4:
      // Level 4: sentence with mixed composites
      items = isOdd
        ? [`${currentSentence.animal}-${currentSentence.number}`, currentSentence.verb, `${currentSentence.food}-${currentSentence.colour}`]
        : [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];
      break;
  }

  items.forEach(item=>{
    const img = document.createElement("img");
    // Use composite path for "-" items, otherwise sign path
    img.src = item.includes("-") ? compositeImagePath(item) : signPathFor(item);
    img.className = "questionSign";
    questionArea.appendChild(img);
  });
}

/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(isOdd){
  answerArea.innerHTML="";
  let dropLabels=[];
  if(currentLevel===1) dropLabels=isOdd?["animal","howmany"]:["animal+howmany"];
  else if(currentLevel===2) dropLabels=isOdd?["food","colour"]:["food+colour"];
  else if(currentLevel===3||currentLevel===4) dropLabels=isOdd?["animal","howmany","verb","food","colour"]:["animal+howmany","verb","food+colour"];

  dropLabels.forEach(label=>{
    const dz=document.createElement("div");
    dz.className="dropzone";
    dz.dataset.placeholder=label;
    dz.addEventListener("dragover",e=>e.preventDefault());
    dz.addEventListener("drop",dropHandler);

    if(label==="verb"){
      const img=document.createElement("img");
      if(currentLevel===3){ img.src=signPathFor("want"); dz.dataset.filled="want"; dz.classList.add("filled"); dz.dataset.permanent="true"; dz.appendChild(img); }
      if(currentLevel===4){
        const verb=currentSentence.verb;
        if(verb==="donthave"){ 
          img.src=signPathFor("have");
          const wrapper=document.createElement("div"); wrapper.className="dontHaveWrapper";
          wrapper.appendChild(img);
          const xOverlay=document.createElement("div"); xOverlay.className="xOverlay"; xOverlay.textContent="X";
          wrapper.appendChild(xOverlay); dz.appendChild(wrapper);
        } else { img.src=signPathFor("have"); dz.appendChild(img); }
        dz.dataset.filled=verb; dz.classList.add("filled"); dz.dataset.permanent="true";
      }
    }
    answerArea.appendChild(dz);
  });
}

function buildDraggables(isOdd){
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";

  let correctItems = [];

  // Determine correct items based on level and odd/even
  switch(currentLevel){
    case 1:
      correctItems = isOdd ? [currentSentence.animal, currentSentence.number] 
                           : [`${currentSentence.animal}-${currentSentence.number}`];
      break;
    case 2:
      correctItems = isOdd ? [currentSentence.food, currentSentence.colour] 
                           : [`${currentSentence.food}-${currentSentence.colour}`];
      break;
    case 3:
      correctItems = isOdd ? [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour]
                           : [`${currentSentence.animal}-${currentSentence.number}`, currentSentence.verb, `${currentSentence.food}-${currentSentence.colour}`];
      break;
    case 4:
      correctItems = isOdd ? [`${currentSentence.animal}-${currentSentence.number}`, currentSentence.verb, `${currentSentence.food}-${currentSentence.colour}`]
                           : [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];
      break;
  }

  const items = [...correctItems];
  const used = new Set(items);

  // Generate decoys of opposite type
  function generateDecoy(){
    let decoy = "";
    if(isOdd){
      // Question is image → draggables are signs → pick single words only
      const pool = [...animals, ...numbers, ...food, ...colours, ...verbs, ...helpers];
      decoy = randomItem(pool);
    } else {
      // Question is sign → draggables are images/composites
      const combos = [
        ...animals.flatMap(a=>numbers.map(n=>`${a}-${n}`)),
        ...food.flatMap(f=>colours.map(c=>`${f}-${c}`)),
        ...verbs
      ];
      decoy = randomItem(combos);
    }
    return used.has(decoy) ? generateDecoy() : decoy;
  }

  // Fill with decoys until 16 items total
  while(items.length < 16){
    const decoy = generateDecoy();
    items.push(decoy);
    used.add(decoy);
  }

  const shuffled = shuffleArray(items);

  // Split into left/right panels
  const halves = [shuffled.slice(0,8), shuffled.slice(8,16)];
  halves.forEach((group, idx)=>{
    const container = idx===0 ? leftDraggables : rightDraggables;
    group.forEach(word=>{
      const div = document.createElement("div");
      div.className="draggable";
      div.draggable=true;
      div.dataset.value=word;

      const img = document.createElement("img");
      // Display correctly depending on whether it's a single word (sign) or composite
      if(word.includes("-")) img.src = compositeImagePath(word);
      else img.src = signPathFor(word);

      div.appendChild(img);
      div.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", word));
      container.appendChild(div);
    });
  });
}

/* ===== DROP HANDLING ===== */
function dropHandler(e){
  e.preventDefault();
  const dz=e.currentTarget;
  const value=e.dataTransfer.getData("text/plain");
  if(!value) return;
  handleDropOnZone(dz,value);
}

/* ===== TOUCH/MOUSE DRAG ===== */
let dragItem=null, dragClone=null, isTouch=false;

function startDrag(e){
  const target=e.target.closest(".draggable");
  if(!target) return;
  if(e.type==="mousedown" && e.button!==0) return;
  dragItem=target; isTouch=e.type.startsWith("touch");
  const rect=target.getBoundingClientRect();
  dragClone=target.cloneNode(true);
  dragClone.style.position="fixed";
  dragClone.style.left=rect.left+"px"; dragClone.style.top=rect.top+"px";
  dragClone.style.width=rect.width+"px"; dragClone.style.height=rect.height+"px";
  dragClone.style.opacity="0.75"; dragClone.style.pointerEvents="none"; dragClone.style.zIndex=10000;
  document.body.appendChild(dragClone); e.preventDefault();
  if(isTouch){ document.addEventListener("touchmove",moveDrag,{passive:false}); document.addEventListener("touchend",endDrag);}
  else{ document.addEventListener("mousemove",moveDrag); document.addEventListener("mouseup",endDrag); }
}

function moveDrag(e){
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX=e.touches[0].clientX; clientY=e.touches[0].clientY; }
  else{ clientX=e.clientX; clientY=e.clientY; }
  dragClone.style.left=(clientX-dragClone.offsetWidth/2)+"px";
  dragClone.style.top=(clientY-dragClone.offsetHeight/2)+"px";
}

function endDrag(e){
  if(!dragClone||!dragItem) return;
  let clientX, clientY;
  if(isTouch && e.changedTouches && e.changedTouches.length>0){ clientX=e.changedTouches[0].clientX; clientY=e.changedTouches[0].clientY; }
  else{ clientX=e.clientX; clientY=e.clientY; }

  const dropzones=Array.from(document.querySelectorAll(".dropzone"));
  let dropped=false;
  for(const dz of dropzones){
    const rect=dz.getBoundingClientRect();
    if(clientX>=rect.left && clientX<=rect.right && clientY>=rect.top && clientY<=rect.bottom){
      if(dz.dataset.permanent==="true"){} else { handleDropOnZone(dz,dragItem.dataset.value); dropped=true; break; }
    }
  }
  if(dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
  dragClone=null; dragItem=null;
  if(isTouch){ document.removeEventListener("touchmove",moveDrag); document.removeEventListener("touchend",endDrag);}
  else{ document.removeEventListener("mousemove",moveDrag); document.removeEventListener("mouseup",endDrag);}
  if(dropped){ againBtn.style.display="inline-block"; const allFilled=Array.from(document.querySelectorAll(".dropzone")).every(d=>d.dataset.filled); checkBtn.style.display=allFilled?"inline-block":"none"; }
}

document.addEventListener("mousedown",startDrag);
document.addEventListener("touchstart",startDrag,{passive:false});

/* ===== DROP LOGIC ===== */
function handleDropOnZone(dz,value){
  if(dz.dataset.permanent==="true") return;
  dz.innerHTML=""; const img=document.createElement("img"); img.src=value.includes("-")?compositeImagePath(value):signPathFor(value); dz.appendChild(img);
  dz.dataset.filled=value; dz.classList.add("filled");
  againBtn.style.display="inline-block";
  const allFilled=Array.from(document.querySelectorAll(".dropzone")).every(d=>d.dataset.filled); checkBtn.style.display=allFilled?"inline-block":"none";
}

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click",()=>{
  const dropzones=Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect=true;
  dropzones.forEach((dz,i)=>{
    if(dz.dataset.permanent==="true"){ dz.classList.add("correct"); return; }
    let expected="";
    if(currentLevel===1){ expected=(roundInLevel%2===1)?(i===0?currentSentence.animal:currentSentence.number):currentSentence.animal+"-"+currentSentence.number; }
    else if(currentLevel===2){ expected=(roundInLevel%2===1)?(i===0?currentSentence.food:currentSentence.colour):currentSentence.food+"-"+currentSentence.colour; }
    else if(currentLevel===3){
      const seq=(roundInLevel%2===1)?[currentSentence.animal,currentSentence.number,currentSentence.verb,currentSentence.food,currentSentence.colour]:[currentSentence.animal+"-"+currentSentence.number,currentSentence.verb,currentSentence.food+"-"+currentSentence.colour];
      expected=seq[i]||"";
    } else if(currentLevel===4){
      if(dz.dataset.placeholder==="animal+howmany") expected=currentSentence.animal+"-"+currentSentence.number;
      else if(dz.dataset.placeholder==="verb") expected=currentSentence.verb;
      else if(dz.dataset.placeholder==="food+colour") expected=(currentSentence.verb==="donthave")?"donthave":(currentSentence.food+"-"+currentSentence.colour);
      else if(dz.dataset.placeholder==="animal") expected=currentSentence.animal;
      else if(dz.dataset.placeholder==="howmany") expected=currentSentence.number;
      else if(dz.dataset.placeholder==="food") expected=currentSentence.food;
      else if(dz.dataset.placeholder==="colour") expected=currentSentence.colour;
    }
    if(dz.dataset.filled===expected){ correctCount++; levelCorrect[currentLevel]++; dz.classList.add("correct"); }
    else{ incorrectCount++; levelIncorrect[currentLevel]++; allCorrect=false; dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("correct","filled"); dz.classList.add("incorrect"); }
  });
  const fb=document.createElement("img"); fb.src=allCorrect?"assets/correct.png":"assets/wrong.png"; feedbackDiv.appendChild(fb);
  saveProgress();
  setTimeout(()=>{
    feedbackDiv.innerHTML="";
    if(allCorrect) nextRound();
    else{ buildDraggables(roundInLevel%2===1); checkBtn.style.display="none"; againBtn.style.display="inline-block"; }
  },1200);
});

/* ===== AGAIN BUTTON ===== */
againBtn.addEventListener("click",()=>{
  buildDraggables(roundInLevel%2===1);
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz=>{
    if(dz.dataset.permanent!=="true"){ dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("correct","incorrect","filled"); }
    else dz.classList.add("correct");
  });
  checkBtn.style.display="none"; againBtn.style.display="none";
});

/* ===== GAME FLOW ===== */
function nextRound(){
  roundInLevel++;
  if(roundInLevel>=10) endLevel();
  else{ buildQuestion(); saveProgress(); }
}

/* ===== FORM SUBMISSION ===== */
async function submitResults(){
  const timeTaken=getTimeElapsed();
  const totalCorrect=Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts=totalCorrect+Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent=totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0;
  const fd=new FormData();
  fd.append(FORM_FIELD_MAP.name,studentName); fd.append(FORM_FIELD_MAP.class,studentClass); fd.append(FORM_FIELD_MAP.subject,"Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken,timeTaken); fd.append(FORM_FIELD_MAP.percent,percent);
  for(let l=1;l<=TOTAL_LEVELS;l++){
    const cf=FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf=FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if(cf) fd.append(cf,levelCorrect[l]);
    if(inf) fd.append(inf,levelIncorrect[l]);
  }
  try{ await fetch(googleForm.action,{method:"POST",body:fd,mode:"no-cors"}); } catch(err){ console.warn("Form submission failed",err);}
}

/* ===== END LEVEL / FINISH ===== */
async function endLevel(){
  if(currentLevel<TOTAL_LEVELS){ currentLevel++; roundInLevel=0; buildQuestion(); saveProgress(); return; }
  await submitResults(); clearProgress(); endModal.style.display="block"; document.getElementById("endGif").src="assets/auslan-clap.gif";
  const totalCorrect=Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts=totalCorrect+Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  document.getElementById("finalTime").textContent=`${Math.floor(getTimeElapsed()/60)}m ${getTimeElapsed()%60}s`;
  document.getElementById("finalScore").textContent=`${totalCorrect}/${totalAttempts}`;
  document.getElementById("finalPercent").textContent=Math.round(totalAttempts>0?(totalCorrect/totalAttempts*100):0)+"%";
}

/* ===== END MODAL BUTTONS ===== */
if(finishBtn) finishBtn.onclick=()=>{ window.location.href="../index.html"; };
if(againBtnEnd) againBtnEnd.onclick=()=>{ endModal.style.display="none"; resetGame(); };
if(logoffBtn) logoffBtn.onclick=()=>{ window.location.href="../index.html"; };

/* ===== STOP BUTTON ===== */
stopBtn.addEventListener("click",()=>{
  savedTimeElapsed=getTimeElapsed();
  const totalAttempts=correctCount+incorrectCount;
  const percent=totalAttempts>0?Math.round((correctCount/totalAttempts)*100):0;
  const modal=document.getElementById("stopModal"); modal.style.display="block";
  document.getElementById("stopTime").textContent=`${Math.floor(savedTimeElapsed/60)}m ${savedTimeElapsed%60}s`;
  document.getElementById("stopPercent").textContent=percent+"%";
  document.getElementById("continueBtn").onclick=()=>{ modal.style.display="none"; startTime=Date.now(); };
  document.getElementById("againBtnStop").onclick=()=>{ modal.style.display="none"; resetGame(); };
  document.getElementById("finishBtnStop").onclick=async()=>{
    modal.style.display="none"; await submitResults(); clearProgress();
    endModal.style.display="block"; document.getElementById("endGif").src="assets/auslan-clap.gif";
    const totalCorrect=Object.values(levelCorrect).reduce((a,b)=>a+b,0);
    const totalAttempts2=totalCorrect+Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
    document.getElementById("finalTime").textContent=`${Math.floor(getTimeElapsed()/60)}m ${getTimeElapsed()%60}s`;
    document.getElementById("finalScore").textContent=`${totalCorrect}/${totalAttempts2}`;
    document.getElementById("finalPercent").textContent=Math.round(totalAttempts2>0?(totalCorrect/totalAttempts2*100):0)+"%";
  };
});

/* ===== START/RESET/UTILS ===== */
function startGame(){ startTime=Date.now(); buildQuestion(); }
function resetGame(){ currentLevel=1; roundInLevel=0; correctCount=0; incorrectCount=0; savedTimeElapsed=0; levelCorrect={1:0,2:0,3:0,4:0}; levelIncorrect={1:0,2:0,3:0,4:0}; answersHistory=[]; setTimeElapsed(0); startGame(); }
function updateScoreDisplay(){ scoreDisplay.textContent=`Level ${currentLevel} - Question ${roundInLevel+1}/10`; }

/* ===== INIT ===== */
window.addEventListener("load",()=>{
  const saved=loadProgress();
  if(saved && saved.studentName) showResumeModal(saved);
  else resetGame();
});
