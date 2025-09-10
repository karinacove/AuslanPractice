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

  currentSentence = { 
    animal, 
    number, 
    food: foodItem, 
    colour, 
    verb 
  };
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

  // Level 1 & 2 helper signs
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

  // Level 1
  if (currentLevel === 1) {
    comboDiv.innerHTML = isOdd
      ? `<img src="${compositeImagePath(currentSentence.animal + '-' + currentSentence.number)}">`
      : `<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}">`;

  // Level 2
  } else if (currentLevel === 2) {
    comboDiv.innerHTML = isOdd
      ? `<img src="${compositeImagePath(currentSentence.food + '-' + currentSentence.colour)}">`
      : `<img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;

  // Level 3
  } else if (currentLevel === 3) {
    comboDiv.innerHTML = isOdd
      ? `<img src="${compositeImagePath(currentSentence.animal + '-' + currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${compositeImagePath(currentSentence.food + '-' + currentSentence.colour)}">`
      : `<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}"><img src="${signPathFor('want')}"><img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;

 } else if (currentLevel === 4) {
  if (isOdd) {
    // Odd rounds → separate signs + verb
    const animalImg = Object.assign(document.createElement("img"), {
      src: signPathFor(currentSentence.animal)
    });
    const numberImg = Object.assign(document.createElement("img"), {
      src: signPathFor(currentSentence.number)
    });
    const verbImg = Object.assign(document.createElement("img"), {
      src: signPathFor(currentSentence.verb)
    });
    const foodImg = Object.assign(document.createElement("img"), {
      src: signPathFor(currentSentence.food)
    });
    const colourImg = Object.assign(document.createElement("img"), {
      src: signPathFor(currentSentence.colour)
    });

    comboDiv.appendChild(animalImg);
    comboDiv.appendChild(numberImg);
    comboDiv.appendChild(verbImg);
    comboDiv.appendChild(foodImg);
    comboDiv.appendChild(colourImg);

    if (currentSentence.verb === "donthave") {
      // Wrap food with X overlay
      const wrapper = document.createElement("div");
      wrapper.className = "dontHaveWrapper";

      const xDiv = document.createElement("div");
      xDiv.className = "xOverlay";
      xDiv.textContent = "X";

      comboDiv.removeChild(foodImg);
      wrapper.appendChild(foodImg);
      wrapper.appendChild(xDiv);
      comboDiv.appendChild(wrapper);
    }

  } else {
    // Even rounds → composite animal-number + food-colour, no separate verb sign
    const animalNumberImg = Object.assign(document.createElement("img"), {
      src: compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`)
    });
    comboDiv.appendChild(animalNumberImg);

    const foodColourImg = Object.assign(document.createElement("img"), {
      src: compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`)
    });

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
  }
}

  questionArea.appendChild(comboDiv);
  buildAnswerBoxes(isOdd);
  buildDraggables(isOdd);
  updateScoreDisplay();
}

/* ===== BUILD ANSWER BOXES ===== */
/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(isOdd){
  answerArea.innerHTML = "";
  let dropLabels = [];

  if(currentLevel === 1){
    dropLabels = isOdd ? ["animal","howmany?"] : ["animal+howmany?"];
  } 
  else if(currentLevel === 2){
    dropLabels = isOdd ? ["food","colour"] : ["food+colour"];
  } 
  else if(currentLevel === 3){
    dropLabels = isOdd ? ["animal","howmany?","verb","food","colour"] 
                       : ["animal+howmany?","verb","food+colour"];
  } 
else if(currentLevel === 4){
  if(isOdd){
    dropLabels = ["animal","howmany?","verb","food","colour"];
  } else {
    // Verb is silent here, so only 2 dropzones
    dropLabels = ["animal+howmany?","food+colour"];
  }
}


  dropLabels.forEach(label=>{
    const dz = document.createElement("div"); 
    dz.className = "dropzone"; 
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e => e.preventDefault()); 
    dz.addEventListener("drop", dropHandler);

    // Level 3 special rule: verb is always fixed "want"
    if(currentLevel === 3 && label === "verb"){ 
      const img = document.createElement("img"); 
      img.src = signPathFor("want"); 
      dz.appendChild(img); 
      dz.dataset.filled = "want"; 
      dz.classList.add("filled"); 
      dz.dataset.permanent = "true"; 
    }

    // Level 4 does NOT fix the verb → students drag it
    // so no special handling here

    answerArea.appendChild(dz);
  });
}


/* ===== BUILD DRAGGABLES ===== */
let dragItem=null, dragClone=null, isTouch=false;
function buildDraggables(isOdd){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  let items=[], totalItems=16;

  // Correct items
  if(currentLevel===1) items = isOdd ? [currentSentence.animal,currentSentence.number] : [currentSentence.animal+"-"+currentSentence.number];
  else if(currentLevel===2) items = isOdd ? [currentSentence.food,currentSentence.colour] : [currentSentence.food+"-"+currentSentence.colour];
  else if(currentLevel===3) items = isOdd ? [currentSentence.animal,currentSentence.number,currentSentence.food,currentSentence.colour] : [currentSentence.animal+"-"+currentSentence.number,currentSentence.food+"-"+currentSentence.colour];
else if(currentLevel === 4){
  // Always include animal, number, verb, food, colour separately
  if(isOdd){
    items = [
      currentSentence.animal,
      currentSentence.number,
      currentSentence.verb,
      { img: compositeImagePath(currentSentence.food + "-" + currentSentence.colour), x: currentSentence.verb==="donthave" }
    ];
  } else {
    items = [
      currentSentence.animal,
      currentSentence.number,
      currentSentence.verb,
      currentSentence.food,
      currentSentence.colour
    ];

    // Wrap food+colour with X if verb is "donthave"
    if(currentSentence.verb==="donthave"){
      items[3] = { img: signPathFor(currentSentence.food), x: true }; // food
      items[4] = { img: signPathFor(currentSentence.colour), x: false }; // colour
    }
  }
}

  // Add decoys
  const used=new Set(items.map(i=>typeof i==="string"?i:i.img));
  while(items.length<totalItems){
    let decoy=randomItem([...animals,...numbers,...food,...colours,...verbs]);
    if(!used.has(decoy)){ items.push(decoy); used.add(decoy); }
  }

  items = shuffleArray(items);
  const halves=[items.slice(0,8),items.slice(8,16)];
  halves.forEach((group,idx)=>{
    const container=idx===0?leftDraggables:rightDraggables;
    group.forEach(word=>{
      const div=document.createElement("div"); div.className="draggable"; div.draggable=true; div.dataset.originalParent=idx===0?"draggablesLeft":"draggablesRight";
      if(typeof word==="string"){
        const img=document.createElement("img"); img.src=signPathFor(word); div.dataset.value=word; div.appendChild(img);
      } else {
        const wrapper=document.createElement("div"); wrapper.className="dontHaveWrapper";
        const img=document.createElement("img"); img.src=word.img; wrapper.appendChild(img);
        if(word.x){ const xDiv=document.createElement("div"); xDiv.className="xOverlay"; xDiv.textContent="X"; wrapper.appendChild(xDiv); }
        div.appendChild(wrapper); div.dataset.value="food+colour-X";
      }
      div.addEventListener("dragstart", e=>e.dataTransfer.setData("text/plain",div.dataset.value));
      container.appendChild(div);
    });
  });
}

/* ===== DRAG & DROP ===== */
function startDrag(e){
  const target=e.target.closest(".draggable"); if(!target) return;
  dragItem=target; isTouch=e.type.startsWith("touch");
  const rect=target.getBoundingClientRect();
  dragClone=target.cloneNode(true);
  Object.assign(dragClone.style,{position:"fixed",left:rect.left+"px",top:rect.top+"px",width:rect.width+"px",height:rect.height+"px",opacity:"0.7",pointerEvents:"none",zIndex:"10000"});
  document.body.appendChild(dragClone); e.preventDefault();
  if(isTouch){ document.addEventListener("touchmove", moveDrag,{passive:false}); document.addEventListener("touchend", endDrag); }
  else { document.addEventListener("mousemove", moveDrag); document.addEventListener("mouseup", endDrag); }
}
function moveDrag(e){
  if(!dragClone) return;
  let clientX,clientY;
  if(isTouch&&e.touches.length>0){ clientX=e.touches[0].clientX; clientY=e.touches[0].clientY; }
  else { clientX=e.clientX; clientY=e.clientY; }
  dragClone.style.left=clientX-dragClone.offsetWidth/2+"px";
  dragClone.style.top=clientY-dragClone.offsetHeight/2+"px";
}
function endDrag(e){
  if(!dragItem||!dragClone) return;
  let clientX,clientY;
  if(isTouch&&e.changedTouches&&e.changedTouches.length>0){ clientX=e.changedTouches[0].clientX; clientY=e.changedTouches[0].clientY; }
  else { clientX=e.clientX; clientY=e.clientY; }

  let dropped=false;
  document.querySelectorAll(".dropzone").forEach(dz=>{
    const rect=dz.getBoundingClientRect();
    if(clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom&&dz.childElementCount===0){
      dz.appendChild(dragItem.cloneNode(true)); dz.dataset.filled=dragItem.dataset.value; dz.classList.add("filled"); dropped=true;
    }
  });
  if(dragClone) document.body.removeChild(dragClone); dragClone=null; dragItem=null;
  if(isTouch){ document.removeEventListener("touchmove", moveDrag,{passive:false}); document.removeEventListener("touchend", endDrag); }
  else { document.removeEventListener("mousemove", moveDrag); document.removeEventListener("mouseup", endDrag); }

  if(dropped){ againBtn.style.display="inline-block"; const allFilled=Array.from(document.querySelectorAll(".dropzone")).every(d=>d.dataset.filled); checkBtn.style.display=allFilled?"inline-block":"none"; }
}

document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, {passive:false});
function dropHandler(e){ e.preventDefault(); }

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click", () => {
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;

  dropzones.forEach((dz,i)=>{
    if(dz.dataset.permanent==="true"){ dz.classList.add("correct"); return; }
    let expected="";
    if(currentLevel===1) expected=(roundInLevel%2===1)?(i===0?currentSentence.animal:currentSentence.number):currentSentence.animal+"-"+currentSentence.number;
    else if(currentLevel===2) expected=(roundInLevel%2===1)?(i===0?currentSentence.food:currentSentence.colour):currentSentence.food+"-"+currentSentence.colour;
    else if(currentLevel===3) expected=(roundInLevel%2===1?[currentSentence.animal,currentSentence.number,currentSentence.verb,currentSentence.food,currentSentence.colour][i]:[currentSentence.animal+"-"+currentSentence.number,currentSentence.verb,currentSentence.food+"-"+currentSentence.colour][i]);
    else if(currentLevel===4){
      if(dz.dataset.placeholder==="animal+howmany?") expected=currentSentence.animal+"-"+currentSentence.number;
      else if(dz.dataset.placeholder==="verb") expected=currentSentence.verb;
      else if(dz.dataset.placeholder==="food+colour") expected=currentSentence.food+"-"+currentSentence.colour;
    }
    const isCorrect = dz.dataset.filled===expected || (dz.dataset.placeholder==="food+colour" && currentSentence.verb==="donthave" && dz.dataset.filled.includes("X"));
    if(isCorrect){ correctCount++; levelCorrect[currentLevel]++; dz.classList.add("correct"); }
    else{ incorrectCount++; levelIncorrect[currentLevel]++; allCorrect=false; dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("correct","filled"); dz.classList.add("incorrect"); }

    // Save answers
    const items = dz.dataset.filled.split("-").map(v=>v.trim());
    const labels = dz.dataset.placeholder.includes("+")?dz.dataset.placeholder.split("+"):[dz.dataset.placeholder];
    labels.forEach((lbl,idx)=>{ answersHistory.push({level:currentLevel,label:lbl,value:items[idx]||"",correct:isCorrect}); });
  });

  const fb=document.createElement("img"); fb.src=allCorrect?"assets/correct.png":"assets/wrong.png"; feedbackDiv.appendChild(fb);
  saveProgress();
  setTimeout(()=>{ feedbackDiv.innerHTML=""; if(allCorrect) nextRound(); else { buildDraggables(roundInLevel%2===1); checkBtn.style.display="none"; againBtn.style.display="inline-block"; } },2000);
});

/* ===== AGAIN BUTTON ===== */
againBtn.addEventListener("click", ()=>{
  document.querySelectorAll(".draggable").forEach(d=>document.getElementById(d.dataset.originalParent).appendChild(d));
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz=>{
    if(dz.dataset.permanent!=="true"){ dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("incorrect","filled","correct"); } else dz.classList.add("correct");
  });
  checkBtn.style.display="none"; againBtn.style.display="none";
});

/* ===== GAME FLOW ===== */
function nextRound(){
  roundInLevel++;
  if(roundInLevel>=10){ currentLevel<TOTAL_LEVELS?(currentLevel++,roundInLevel=0,buildQuestion(),saveProgress()):endLevel(); }
  else buildQuestion(),saveProgress();
}

/* ===== GOOGLE FORM SUBMISSION ===== */
async function submitResults(){
  const timeTaken=getTimeElapsed();
  const totalCorrect=Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts=totalCorrect+Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent=totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0;

  const fd=new FormData();
  fd.append(FORM_FIELD_MAP.name,studentName);
  fd.append(FORM_FIELD_MAP.class,studentClass);
  fd.append(FORM_FIELD_MAP.subject,"Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken,timeTaken);
  fd.append(FORM_FIELD_MAP.percent,percent);

  for(let l=1;l<=TOTAL_LEVELS;l++){
    const cf=FORM_FIELD_MAP[`level${l}`]?.correct, inf=FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if(cf) fd.append(cf,formatAnswersForLevel(l,true));
    if(inf) fd.append(inf,formatAnswersForLevel(l,false));
  }

  try{ await fetch(googleForm.action,{method:"POST",body:fd,mode:"no-cors"}); } catch(err){ console.warn("Form submission failed",err); }
}
function formatAnswersForLevel(level,correct=true){
  return answersHistory.filter(a=>a.level===level && a.correct===correct)
    .sort((a,b)=>a.label.localeCompare(b.label))
    .map(a=>`${a.label}-${a.value}`).join(",");
}

/* ===== END LEVEL LOGIC ===== */
async function endLevel(){
  await submitResults(); clearProgress(); endModal.style.display="block";
  document.getElementById("endGif").src="assets/auslan-clap.gif";
  const totalCorrect=correctCount, totalAttempts=correctCount+incorrectCount;
  document.getElementById("finalScore").textContent=`${totalCorrect}/${totalAttempts}`;
  document.getElementById("finalPercent").textContent=Math.round((totalCorrect/totalAttempts)*100)+"%";
}
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
  document.getElementById("finishBtnStop").onclick=async()=>{ modal.style.display="none"; await submitResults(); clearProgress(); window.location.href="../index.html"; };
});

/* ===== START/RESET GAME ===== */
function startGame(){ startTime=Date.now(); buildQuestion(); }
function resetGame(){ currentLevel=1; roundInLevel=0; correctCount=0; incorrectCount=0; savedTimeElapsed=0; startGame(); }
function updateScoreDisplay(){ scoreDisplay.textContent=`Level ${currentLevel} - Question ${roundInLevel+1}/10`; }

/* ===== INIT ===== */
window.addEventListener("load",()=>{
  const saved=loadProgress();
  if(saved&&saved.studentName) showResumeModal(saved); else resetGame();
});
