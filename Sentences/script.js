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
const continueBtn = document.getElementById("continueBtn");
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

/* ===== TOPIC ===== */
let currentTopic = localStorage.getItem("sentencesTopic") || ""; // "animals" | "food" | "emotions"

/* ===== VOCAB ===== */
const animals = ["dog","cat","mouse","rabbit","fish","bird"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const food = ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"];
const verbs = ["want","have","donthave"];
const helpers = ["i","see","what"];
const emotions = ["happy","sad","angry","scared","excited","tired","surprised","bored"];
const emotionZones = ["green","blue","yellow","red"];

/* ===== HELPERS ===== */
function shuffleArray(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function signPathFor(word){
  // Return a path (may be .png or .mp4). Caller must create appropriate element.
  if(!word) return "";
  // helpers (png)
  if(helpers.includes(word)) return `assets/signs/helpers/${word}.png`;
  // animals
  if(animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  // numbers
  if(numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  // food
  if(food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  // colours
  if(colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  // verbs
  if(verbs.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  // emotions (video signs)
  if(emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  // emotion zone image (png)
  if(emotionZones.includes(word)) return `assets/signs/emotions/sign-${word}.png`;
  return "";
}
function compositeImagePath(combo){ return `assets/images/${combo}.png`; }

/* ===== TIMER HELPERS ===== */
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed=seconds; startTime=Date.now(); }

/* ===== SAVE/RESUME ===== */
const SAVE_KEY = "sentencesGameSave";
function saveProgress(){
  localStorage.setItem(SAVE_KEY,JSON.stringify({
    studentName, studentClass, currentLevel, roundInLevel, correctCount, incorrectCount,
    answersHistory, levelCorrect, levelIncorrect, timeElapsed:getTimeElapsed(), currentTopic
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
  if(!saved) return resetGame();
  studentName=saved.studentName; studentClass=saved.studentClass;
  currentLevel=saved.currentLevel; roundInLevel=saved.roundInLevel;
  correctCount=saved.correctCount; incorrectCount=saved.incorrectCount;
  answersHistory=saved.answersHistory||[];
  levelCorrect=saved.levelCorrect||{1:0,2:0,3:0,4:0};
  levelIncorrect=saved.levelIncorrect||{1:0,2:0,3:0,4:0};
  currentTopic = saved.currentTopic || currentTopic || localStorage.getItem("sentencesTopic") || "animals";
  localStorage.setItem("sentencesTopic", currentTopic);
  setTimeElapsed(saved.timeElapsed||0);
  buildQuestion();
}

function resumeProgress(){
  const saved = loadProgress();
  if(saved) showResumeModal(saved);
  else resetGame();
}

/* ===== TOPIC SELECTION UI HOOKS ===== */
function chooseTopic(topic){
  currentTopic = topic;
  localStorage.setItem("sentencesTopic", topic);
  document.getElementById("topicModal")?.style.setProperty("display","none");
  resetGame();
}

/* bind topic buttons if present */
document.querySelectorAll(".topicBtn").forEach(btn => btn.addEventListener("click", ()=>chooseTopic(btn.dataset.topic)));

/* ===== GENERATE SENTENCE ===== */
function generateSentence(){
  if(currentTopic === "emotions"){
    const emotion = randomItem(emotions);
    const zone = randomItem(emotionZones);
    currentSentence = { emotion, zone };
    return;
  }

  // For animals or food topics we keep a similar structure, but adapt for the topic:
  if(currentTopic === "animals"){
    const animal = randomItem(animals);
    const number = randomItem(numbers);
    const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";
    // we still include a random food and colour for mixed levels like level 3/4 (to reuse structure)
    const foodItem = randomItem(food);
    const colour = randomItem(colours);
    currentSentence = { animal, number, food: foodItem, colour, verb };
    return;
  }

  if(currentTopic === "food"){
    const foodItem = randomItem(food);
    const colour = randomItem(colours);
    const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";
    // include an animal/number fallback for any mixed levels that expect them (keeps logic consistent)
    const animal = randomItem(animals);
    const number = randomItem(numbers);
    currentSentence = { food: foodItem, colour, verb, animal, number };
    return;
  }

  // default fallback
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

  // Show helpers for levels 1/2 as before (but skip for emotions if you don't want helpers)
  if (currentTopic !== "emotions" && currentLevel <= 2) {
    const helperDiv = document.createElement("div");
    helpers.forEach(h => {
      const elPath = signPathFor(h);
      const node = createMediaElementForPath(elPath, {className: "helperSign"});
      helperDiv.appendChild(node);
    });
    questionArea.appendChild(helperDiv);
  } else if (currentTopic === "emotions" && currentLevel <= 2) {
    // emotions also uses "i see what" helpers if desired
    const helperDiv = document.createElement("div");
    ["i","see","what"].forEach(h => {
      const elPath = signPathFor(h);
      const node = createMediaElementForPath(elPath, {className: "helperSign"});
      helperDiv.appendChild(node);
    });
    questionArea.appendChild(helperDiv);
  }

  // Branch by topic
  if (currentTopic === "emotions") {
    buildQuestionForEmotions(isOdd);
  } else {
    buildQuestionForAnimalsOrFood(isOdd);
  }

  updateScoreDisplay();
}

/* ===== CREATE MEDIA ELEMENT (img or video) ===== */
function createMediaElementForPath(path, opts = {}) {
  const lower = path.toLowerCase();
  if (!path) {
    const empty = document.createElement("div");
    empty.textContent = "";
    return empty;
  }
  if (lower.endsWith(".mp4")) {
    const vid = document.createElement("video");
    vid.src = path;
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    if(opts.className) vid.className = opts.className;
    if(opts.width) vid.width = opts.width;
    return vid;
  } else {
    const img = document.createElement("img");
    img.src = path;
    if(opts.className) img.className = opts.className;
    if(opts.width) img.width = opts.width;
    return img;
  }
}

/* ===== BUILD QUESTION: EMOTIONS ===== */
function buildQuestionForEmotions(isOdd){
  const comboDiv = document.createElement("div");
  comboDiv.className = "comboDiv emotionsCombo";

  if (isOdd) {
    // composite image (emotion-zone)
    const composite = compositeImagePath(`${currentSentence.emotion}-${currentSentence.zone}`);
    const node = createMediaElementForPath(composite);
    comboDiv.appendChild(node);
  } else {
    // show the emotion sign video + zone image side by side
    const videoPath = signPathFor(currentSentence.emotion); // .mp4
    const zoneImgPath = signPathFor(currentSentence.zone); // .png
    comboDiv.appendChild(createMediaElementForPath(videoPath));
    comboDiv.appendChild(createMediaElementForPath(zoneImgPath));
  }

  questionArea.appendChild(comboDiv);
  buildAnswerBoxesEmotions(isOdd);
  buildDraggablesEmotions(isOdd);
}

/* ===== BUILD QUESTION: ANIMALS or FOOD (re-uses prior structure) ===== */
function buildQuestionForAnimalsOrFood(isOdd){
  const comboDiv = document.createElement("div");
  comboDiv.className = "comboDiv";

  // We keep level behaviour consistent with previous file.
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
      const animalNumberImg = createMediaElementForPath(compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`));
      comboDiv.appendChild(animalNumberImg);
      const foodColourImg = createMediaElementForPath(compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`));
      if (currentSentence.verb === "donthave") {
        const wrapper = document.createElement("div");
        wrapper.className = "dontHaveWrapper";
        const xDiv = document.createElement("div");
        xDiv.className = "xOverlay"; xDiv.textContent = "X";
        wrapper.appendChild(foodColourImg);
        wrapper.appendChild(xDiv);
        comboDiv.appendChild(wrapper);
      } else comboDiv.appendChild(foodColourImg);
    } else {
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.animal)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.number)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.verb)));
      if (currentSentence.verb === "donthave") {
        const foodImg = createMediaElementForPath(signPathFor(currentSentence.food));
        const wrapper = document.createElement("div"); wrapper.className = "dontHaveWrapper";
        const xDiv = document.createElement("div"); xDiv.className = "xOverlay"; xDiv.textContent = "X";
        wrapper.appendChild(foodImg); wrapper.appendChild(xDiv);
        comboDiv.appendChild(wrapper);
      } else comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.food)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.colour)));
    }
  }

  questionArea.appendChild(comboDiv);
  buildAnswerBoxes(isOdd); // uses generic builder that supports animals/food structure
  buildDraggables(isOdd);  // uses generic builder
}

/* ===== BUILD ANSWER BOXES (generic for animals/food/levels 1-4) ===== */
function buildAnswerBoxes(isOdd){
  answerArea.innerHTML = "";
  let dropLabels = [];
  if(currentLevel === 1) dropLabels = isOdd ? ["animal","howmany?"] : ["animal+howmany?"];
  else if(currentLevel === 2) dropLabels = isOdd ? ["food","colour"] : ["food+colour"];
  else if(currentLevel === 3) dropLabels = isOdd ? ["animal","howmany?","verb","food","colour"] : ["animal+howmany?","verb","food+colour"];
  else if(currentLevel === 4) dropLabels = isOdd ? ["animal","howmany?","verb","food","colour"] : ["animal+howmany?","food+colour"];

  dropLabels.forEach(label=>{
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);

    if(currentLevel===3 && label==="verb"){
      const imgNode = createMediaElementForPath(signPathFor("want"));
      dz.appendChild(imgNode); dz.dataset.filled="want"; dz.classList.add("filled"); dz.dataset.permanent="true";
    }
    answerArea.appendChild(dz);
  });
}

/* ===== BUILD DRAGGABLES (generic for animals/food) ===== */
let dragItem=null, dragClone=null, isTouch=false;
function buildDraggables(isOdd){
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  let items=[], totalItems=16;

  if(currentLevel===1) items=isOdd?[currentSentence.animal,currentSentence.number]:[`${currentSentence.animal}-${currentSentence.number}`];
  else if(currentLevel===2) items=isOdd?[currentSentence.food,currentSentence.colour]:[`${currentSentence.food}-${currentSentence.colour}`];
  else if(currentLevel===3) items=isOdd?[currentSentence.animal,currentSentence.number,currentSentence.food,currentSentence.colour]:[`${currentSentence.animal}-${currentSentence.number}`,`${currentSentence.food}-${currentSentence.colour}`];
  else if(currentLevel===4){
    if(isOdd) items=[currentSentence.animal,currentSentence.number,currentSentence.verb,currentSentence.food,currentSentence.colour];
    else items=[`${currentSentence.animal}-${currentSentence.number}`];
    if(!isOdd && currentSentence.verb==="donthave") items.push(`${currentSentence.food}-${currentSentence.colour}-X`);
    else if(!isOdd) items.push(`${currentSentence.food}-${currentSentence.colour}`);
  }

  const used=new Set(items);
  while(items.length<totalItems){
    let decoy;
    if(currentLevel===4){
      if(isOdd) decoy=randomItem([...animals,...numbers,...food,...colours,...verbs]);
      else { 
        const a=randomItem(animals),n=randomItem(numbers),f=randomItem(food),c=randomItem(colours);
        decoy=Math.random()<0.5?`${a}-${n}`:`${f}-${c}`; if(Math.random()<0.15) decoy+="-X";
      }
    } else {
      decoy=randomItem([...animals,...numbers,...food,...colours]);
      if(!isOdd && (currentLevel<4)) { 
        if(currentLevel===1) decoy=`${randomItem(animals)}-${randomItem(numbers)}`;
        if(currentLevel===2) decoy=`${randomItem(food)}-${randomItem(colours)}`;
        if(currentLevel===3) decoy=Math.random()<0.5?`${randomItem(animals)}-${randomItem(numbers)}`:`${randomItem(food)}-${randomItem(colours)}`;
      }
    }
    if(!used.has(decoy)) { items.push(decoy); used.add(decoy); }
  }

  items=shuffleArray(items);
  const halves=[items.slice(0,8),items.slice(8,16)];

  halves.forEach((group,idx)=>{
    const container=idx===0?leftDraggables:rightDraggables;
    group.forEach(val=>{
      const div=document.createElement("div"); div.className="draggable"; div.draggable=true;
      div.dataset.originalParent=container.id;

      if(typeof val==="string"){
        if(val.includes("-")){
          if(val.endsWith("-X")){
            const base=val.replace(/-X$/,"");
            const imgNode = createMediaElementForPath(compositeImagePath(base));
            const wrapper=document.createElement("div"); wrapper.className="dontHaveWrapper";
            wrapper.appendChild(imgNode);
            const xDiv=document.createElement("div"); xDiv.className="xOverlay"; xDiv.textContent="X";
            wrapper.appendChild(xDiv); div.appendChild(wrapper); div.dataset.value=val;
          } else {
            const imgNode = createMediaElementForPath(compositeImagePath(val));
            div.appendChild(imgNode); div.dataset.value=val;
          }
        } else {
          const node = createMediaElementForPath(signPathFor(val));
          div.appendChild(node); div.dataset.value=val;
        }
      } else { div.textContent=String(val); div.dataset.value=String(val); }

      div.addEventListener("dragstart", e=>e.dataTransfer.setData("text/plain", div.dataset.value));
      container.appendChild(div);
    });
  });
}

/* ===== BUILD DRAGGABLES: EMOTIONS ===== */
function buildDraggablesEmotions(isOdd){
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  let items = [], totalItems = 16;

  if(isOdd) items = [currentSentence.emotion, currentSentence.zone];
  else items = [`${currentSentence.emotion}-${currentSentence.zone}`];

  const used = new Set(items);
  while(items.length < totalItems){
    let decoy;
    if(isOdd){
      decoy = Math.random() < 0.5 ? randomItem(emotions) : randomItem(emotionZones);
    } else {
      decoy = `${randomItem(emotions)}-${randomItem(emotionZones)}`;
    }
    if(!used.has(decoy)){ items.push(decoy); used.add(decoy); }
  }

  items = shuffleArray(items);
  const halves = [items.slice(0,8), items.slice(8,16)];

  halves.forEach((group, idx) => {
    const container = idx === 0 ? leftDraggables : rightDraggables;
    group.forEach(val => {
      const div = document.createElement("div"); div.className = "draggable"; div.draggable = true;
      div.dataset.originalParent = container.id;
      if(typeof val === "string"){
        if(val.includes("-")){
          const node = createMediaElementForPath(compositeImagePath(val));
          div.appendChild(node); div.dataset.value = val;
        } else {
          // it's either an emotion (mp4) or zone (png)
          const path = signPathFor(val);
          const node = createMediaElementForPath(path);
          div.appendChild(node); div.dataset.value = val;
        }
      } else {
        div.textContent = String(val); div.dataset.value = String(val);
      }
      div.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", div.dataset.value));
      container.appendChild(div);
    });
  });
}

/* ===== BUILD ANSWER BOXES: EMOTIONS ===== */
function buildAnswerBoxesEmotions(isOdd){
  answerArea.innerHTML = "";
  const labels = isOdd ? ["emotion","zone"] : ["emotion+zone"];
  labels.forEach(label=>{
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    answerArea.appendChild(dz);
  });
}

/* ===== DRAG & DROP ===== */
function startDrag(e){
  const target=e.target.closest(".draggable"); if(!target)return;
  dragItem=target; isTouch=e.type.startsWith("touch");
  const rect=target.getBoundingClientRect();
  dragClone=target.cloneNode(true);
  Object.assign(dragClone.style,{position:"fixed",left:rect.left+"px",top:rect.top+"px",width:rect.width+"px",height:rect.height+"px",opacity:"0.7",pointerEvents:"none",zIndex:"10000"});
  document.body.appendChild(dragClone); e.preventDefault();
  if(isTouch){document.addEventListener("touchmove",moveDrag,{passive:false}); document.addEventListener("touchend",endDrag);}
  else{document.addEventListener("mousemove",moveDrag); document.addEventListener("mouseup",endDrag);}
}
function moveDrag(e){
  if(!dragClone)return; let clientX,clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX=e.touches[0].clientX; clientY=e.touches[0].clientY;}
  else{clientX=e.clientX;clientY=e.clientY;}
  dragClone.style.left=clientX-dragClone.offsetWidth/2+"px"; dragClone.style.top=clientY-dragClone.offsetHeight/2+"px";
}
function endDrag(e){
  if(!dragItem||!dragClone)return; let clientX,clientY;
  if(isTouch && e.changedTouches && e.changedTouches.length>0){ clientX=e.changedTouches[0].clientX; clientY=e.changedTouches[0].clientY;}
  else{clientX=e.clientX; clientY=e.clientY;}
  let dropped=false;
  document.querySelectorAll(".dropzone").forEach(dz=>{
    const rect=dz.getBoundingClientRect();
    if(clientX>=rect.left && clientX<=rect.right && clientY>=rect.top && clientY<=rect.bottom && dz.childElementCount===0){
      const node=dragItem.cloneNode(true); node.classList.remove("draggable"); dz.appendChild(node);
      dz.dataset.filled=dragItem.dataset.value; dz.classList.add("filled"); dropped=true;
    }
  });
  if(dragClone) document.body.removeChild(dragClone);
  dragClone=null; dragItem=null;
  if(isTouch){document.removeEventListener("touchmove",moveDrag,{passive:false});document.removeEventListener("touchend",endDrag);}
  else{document.removeEventListener("mousemove",moveDrag);document.removeEventListener("mouseup",endDrag);}
  if(dropped){againBtn.style.display="inline-block"; checkBtn.style.display=Array.from(document.querySelectorAll(".dropzone")).every(d=>d.dataset.filled)?"inline-block":"none";}
}
document.addEventListener("mousedown",startDrag); document.addEventListener("touchstart",startDrag,{passive:false});
function dropHandler(e){ e.preventDefault(); }

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click", ()=>{
  const dropzones=Array.from(answerArea.querySelectorAll(".dropzone")); let allCorrect=true;
  dropzones.forEach((dz,i)=>{
    if(dz.dataset.permanent==="true"){ dz.classList.add("correct"); return; }
    let expected=""; let isCorrect=false; const filled=dz.dataset.filled||"";

    if(currentTopic === "emotions"){
      // Emotions expected values
      if(currentLevel >= 1){ // same structure for levels applied (we can keep levels for emotion, but simplify)
        if(roundInLevel%2===1){
          expected = (i===0) ? currentSentence.emotion : currentSentence.zone;
          isCorrect = filled === expected;
        } else {
          expected = `${currentSentence.emotion}-${currentSentence.zone}`;
          isCorrect = filled === expected;
        }
      }
    } else {
      // original logic for animals/food
      if(currentLevel===1){
        expected=(roundInLevel%2===1)?(i===0?currentSentence.animal:currentSentence.number):`${currentSentence.animal}-${currentSentence.number}`;
        isCorrect=filled===expected;
      } else if(currentLevel===2){
        expected=(roundInLevel%2===1)?(i===0?currentSentence.food:currentSentence.colour):`${currentSentence.food}-${currentSentence.colour}`;
        isCorrect=filled===expected;
      } else if(currentLevel===3){
        const odd=[currentSentence.animal,currentSentence.number,currentSentence.verb,currentSentence.food,currentSentence.colour];
        const even=[`${currentSentence.animal}-${currentSentence.number}`,currentSentence.verb,`${currentSentence.food}-${currentSentence.colour}`];
        expected=(roundInLevel%2===1)?odd[i]:even[i]; isCorrect=filled===expected;
      } else if(currentLevel===4){
        const isOdd=roundInLevel%2===1;
        if(isOdd){
          if(dz.dataset.placeholder==="animal") expected=currentSentence.animal;
          else if(dz.dataset.placeholder==="howmany?") expected=currentSentence.number;
          else if(dz.dataset.placeholder==="verb") expected=currentSentence.verb;
          else if(dz.dataset.placeholder==="food") expected=currentSentence.food;
          else if(dz.dataset.placeholder==="colour") expected=currentSentence.colour;

          if(dz.dataset.placeholder==="food" && currentSentence.verb==="donthave"){
            isCorrect=filled===expected || filled===`${expected}-X` || (filled && filled.includes(expected));
          } else isCorrect=filled===expected;
        } else {
          if(dz.dataset.placeholder==="animal+howmany?") expected=`${currentSentence.animal}-${currentSentence.number}`;
          else if(dz.dataset.placeholder==="food+colour") expected=`${currentSentence.food}-${currentSentence.colour}`;
          else expected=dz.dataset.placeholder||"";
          if(dz.dataset.placeholder==="food+colour" && currentSentence.verb==="donthave") isCorrect=filled===expected || filled===`${expected}-X` || (filled && filled.includes(expected));
          else isCorrect=filled===expected;
        }
      }
    }

    if(isCorrect){ correctCount++; levelCorrect[currentLevel]++; dz.classList.add("correct"); }
    else{ incorrectCount++; levelIncorrect[currentLevel]++; allCorrect=false; dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("correct","filled"); dz.classList.add("incorrect"); }

    if(filled){
      // map labels
      const items = filled.split("-").map(v=>v.trim());
      const labels = dz.dataset.placeholder.includes("+") ? dz.dataset.placeholder.split("+") : [dz.dataset.placeholder];
      labels.forEach((lbl,idx)=>{ answersHistory.push({level:currentLevel,label:lbl,value:items[idx]||items.join("-")||"",correct:isCorrect,topic:currentTopic}); });
    }
  });

  const fb=document.createElement("img");
  fb.src=allCorrect?"assets/correct.png":"assets/wrong.png";
  feedbackDiv.appendChild(fb);
  saveProgress();

  setTimeout(()=>{
    feedbackDiv.innerHTML="";
    if(allCorrect) nextRound();
    else{ restoreDraggablePositions(); checkBtn.style.display="none"; againBtn.style.display="inline-block"; }
  },2000);
});

/* ===== AGAIN BUTTON ===== */
function restoreDraggablePositions(){ document.querySelectorAll(".draggable").forEach(d=>{ const container=document.getElementById(d.dataset.originalParent); if(container) container.appendChild(d); }); }
againBtn.addEventListener("click", ()=>{
  restoreDraggablePositions();
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz=>{
    if(dz.dataset.permanent!=="true"){ dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("incorrect","filled","correct"); } else dz.classList.add("correct");
  });
  checkBtn.style.display="none"; againBtn.style.display="none";
});

/* ===== GAME FLOW ===== */
function nextRound(){ roundInLevel++; if(roundInLevel>=10){ if(currentLevel<TOTAL_LEVELS){ currentLevel++; roundInLevel=0; buildQuestion(); saveProgress(); } else endLevel(); } else { buildQuestion(); saveProgress(); } }

/* ===== GOOGLE FORM SUBMISSION ===== */
async function submitResults(){
  const timeTaken=getTimeElapsed();
  const totalCorrect=Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts=totalCorrect+Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent=totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0;
  const fd=new FormData();
  fd.append(FORM_FIELD_MAP.name,studentName); fd.append(FORM_FIELD_MAP.class,studentClass);
  fd.append(FORM_FIELD_MAP.subject,`Sentences - ${currentTopic||'Sentences'}`); fd.append(FORM_FIELD_MAP.timeTaken,timeTaken); fd.append(FORM_FIELD_MAP.percent,percent);
  for(let l=1;l<=TOTAL_LEVELS;l++){
    const cf=FORM_FIELD_MAP[`level${l}`]?.correct; const inf=FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if(cf) fd.append(cf,formatAnswersForLevel(l,true));
    if(inf) fd.append(inf,formatAnswersForLevel(l,false));
  }
  try{ await fetch(googleForm.action,{method:"POST",body:fd,mode:"no-cors"}); }
  catch(err){ console.warn("Form submission failed",err); }
}
function formatAnswersForLevel(level,correct=true){ return answersHistory.filter(a=>a.level===level && a.correct===correct).sort((a,b)=>a.label.localeCompare(b.label)).map(a=>`${a.label}-${a.value}`).join(","); }

/* ===== END LEVEL/FINISH LOGIC ===== */
async function endLevel(){
  await submitResults();
  clearProgress();
  endModal.style.display="block";
  document.getElementById("endGif").src="assets/auslan-clap.gif";
  const totalCorrect=correctCount; const totalAttempts=correctCount+incorrectCount;
  document.getElementById("finalScore").textContent=`${totalCorrect}/${totalAttempts}`;
  document.getElementById("finalPercent").textContent=Math.round((totalCorrect/totalAttempts)*100)+"%";
}

/* ===== END MODAL BUTTONS ===== */
document.getElementById("finishBtn").onclick = () => {
  window.location.href = "../index.html";
};

document.getElementById("againBtnEnd").onclick = () => {
  endModal.style.display = "none";
  resetGame();
};

/* ===== STOP BUTTON ===== */
stopBtn.addEventListener("click", () => {
  savedTimeElapsed = getTimeElapsed();
  const percent = Math.round((correctCount / (correctCount + incorrectCount || 1)) * 100);

  const modal = document.getElementById("stopModal");
  modal.style.display = "block";

  document.getElementById("stopTime").textContent =
    `${Math.floor(savedTimeElapsed / 60)}m ${savedTimeElapsed % 60}s`;
  document.getElementById("stopPercent").textContent = percent + "%";

  document.getElementById("continueBtn").onclick = () => {
    modal.style.display = "none";
    startTime = Date.now();
  };

  document.getElementById("againBtnStop").onclick = () => {
    modal.style.display = "none";
    resetGame();
  };

  document.getElementById("finishBtnStop").onclick = async () => {
    modal.style.display = "none";
    await submitResults();
    clearProgress();
    window.location.href = "../index.html";
  };
});

/* ===== RESUME MODAL BUTTONS (for direct IDs also used elsewhere) ===== */
document.getElementById("resumeContinue")?.addEventListener("click", ()=>{
  document.getElementById("resumeModal").style.display = "none";
  resumeProgress();
});
document.getElementById("resumeAgain")?.addEventListener("click", ()=>{
  document.getElementById("resumeModal").style.display = "none";
  resetGame();
});

/* ===== START/RESET GAME ===== */
function startGame() {
  startTime = Date.now();
  buildQuestion();
}

function resetGame() {
  currentLevel = 1;
  roundInLevel = 0;
  correctCount = 0;
  incorrectCount = 0;
  savedTimeElapsed = 0;
  answersHistory = [];
  levelCorrect = {1:0,2:0,3:0,4:0};
  levelIncorrect = {1:0,2:0,3:0,4:0};
  saveTopicToLocal();
  startGame();
}

function saveTopicToLocal(){
  if(currentTopic) localStorage.setItem("sentencesTopic", currentTopic);
}

/* ===== UPDATE UI ===== */
function updateScoreDisplay() {
  scoreDisplay.textContent = `${(currentTopic? currentTopic.charAt(0).toUpperCase()+currentTopic.slice(1) : "Sentences")} - Level ${currentLevel} - Question ${roundInLevel + 1}/10`;
}

/* ===== INIT ===== */
window.addEventListener("load", () => {
  // Bind drag/drop start for touch devices (already bound via document listeners)
  // Check saved progress
  const saved = loadProgress();

  // If topic not chosen yet show topic modal (if present in HTML)
  if(!currentTopic){
    const topicModal = document.getElementById("topicModal");
    if(topicModal){
      topicModal.style.display = "flex";
      // topic buttons must call chooseTopic
      return;
    } else {
      // fallback default
      currentTopic = "animals";
    }
  }

  if (saved && saved.studentName) {
    showResumeModal(saved);
  } else {
    resetGame();
  }
});
