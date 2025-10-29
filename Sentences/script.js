/* =========================
   Sentences Game - script.js
   Full working version with:
   - topic selector (images)
   - odd/even sign <-> image logic
   - drag/drop with touch support
   - save/resume, continue/new behavior
   - silent Google Form submit on finish
   - end modal with auslan-clap.gif + redirect to index.html
   ========================= */

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
  // If you add level5 fields to the Google Form, extend this object accordingly.
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

/* === Modals and topic modal IDs expected in HTML:
   - topicModal (contains .topicBtn with data-topic)
   - resumeModal, resumeMessage, resumeContinue, resumeAgain
   - stopModal, stopTime, stopPercent, continueBtn, againBtnStop, finishBtnStop
   - endModal, endGif, finalScore, finalPercent
*/

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
let currentLevel = 1;            // levels 1..TOTAL_LEVELS
let roundInLevel = 0;           // 0..9 (question index inside level)
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let startTime = null;
let savedTimeElapsed = 0;
let answersHistory = [];        // store {level,label,value,correct,topic}
let levelCorrect = {};          // dynamic by level
let levelIncorrect = {};
const TOTAL_LEVELS = 5;         // user requested end of level 5

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

// Map a keyword to an asset path (signs are <word>-sign.png in their category)
function signPathFor(word){
  if(!word) return "";
  if(helpers.includes(word)) return `assets/signs/helpers/${word}.png`;
  if(animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if(numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if(food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if(colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if(verbs.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if(emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
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
  const payload = {
    studentName, studentClass, currentLevel, roundInLevel, correctCount, incorrectCount,
    answersHistory, levelCorrect, levelIncorrect, timeElapsed:getTimeElapsed(), currentTopic,
    savedAt: Date.now()
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}
function loadProgress(){ try{ return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e){ return null; } }
function clearProgress(){ localStorage.removeItem(SAVE_KEY); }

/* Submit a saved progress object (used when user chooses New while a save exists) */
async function submitSavedProgress(saved){
  if(!saved) return;
  try{
    const timeTaken = saved.timeElapsed || 0;
    const totalCorrect = Object.values(saved.levelCorrect || {}).reduce((a,b)=>a+b,0);
    const totalAttempts = totalCorrect + Object.values(saved.levelIncorrect || {}).reduce((a,b)=>a+b,0);
    const percent = totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0;
    const fd = new FormData();
    fd.append(FORM_FIELD_MAP.name, saved.studentName || studentName);
    fd.append(FORM_FIELD_MAP.class, saved.studentClass || studentClass);
    fd.append(FORM_FIELD_MAP.subject, `Sentences - ${saved.currentTopic || currentTopic || 'Sentences'}`);
    fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
    fd.append(FORM_FIELD_MAP.percent, percent);
    for(let l=1;l<=TOTAL_LEVELS;l++){
      const cf = FORM_FIELD_MAP[`level${l}`]?.correct;
      const inf = FORM_FIELD_MAP[`level${l}`]?.incorrect;
      if(cf) fd.append(cf, formatSavedAnswersForLevel(saved, l, true));
      if(inf) fd.append(inf, formatSavedAnswersForLevel(saved, l, false));
    }
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
  }catch(err){ console.warn("Saved form submission failed", err); }
}
function formatSavedAnswersForLevel(saved, level, correct=true){
  const history = saved.answersHistory || [];
  return history.filter(a=>a.level===level && a.correct===correct).sort((a,b)=>a.label.localeCompare(b.label)).map(a=>`${a.label}-${a.value}`).join(",");
}

/* ===== RESUME / TOPIC MODAL LOGIC ===== */
function showResumeModal(saved){
  const modal = document.getElementById("resumeModal");
  const msg = document.getElementById("resumeMessage");
  const cont = document.getElementById("resumeContinue");
  const again = document.getElementById("resumeAgain");
  if(!modal || !msg || !cont || !again){
    // if modal not present, just restore or reset
    if(saved) restoreProgress(saved); else resetGame();
    return;
  }
  msg.textContent = `Welcome back ${saved.studentName}! Continue Level ${saved.currentLevel}, Q ${saved.roundInLevel+1}?`;
  cont.onclick = () => { modal.style.display = "none"; restoreProgress(saved); };
  again.onclick = async () => {
    // New: submit saved progress, clear and show topic modal
    modal.style.display = "none";
    await submitSavedProgress(saved);
    clearProgress();
    currentTopic = "";
    localStorage.removeItem("sentencesTopic");
    const topicModal = document.getElementById("topicModal");
    if(topicModal) topicModal.style.display = "flex";
    else resetGame();
  };
  modal.style.display = "flex";
}

function restoreProgress(saved){
  if(!saved) return resetGame();
  studentName = saved.studentName; studentClass = saved.studentClass;
  currentLevel = saved.currentLevel; roundInLevel = saved.roundInLevel;
  correctCount = saved.correctCount; incorrectCount = saved.incorrectCount;
  answersHistory = saved.answersHistory || [];
  levelCorrect = saved.levelCorrect || initializeLevelCounts();
  levelIncorrect = saved.levelIncorrect || initializeLevelCounts();
  currentTopic = saved.currentTopic || currentTopic || localStorage.getItem("sentencesTopic") || "animals";
  localStorage.setItem("sentencesTopic", currentTopic);
  setTimeElapsed(saved.timeElapsed || 0);
  buildQuestion();
}

/* ===== TOPIC SELECTION UI HOOKS ===== */
function chooseTopic(topic){
  currentTopic = topic;
  localStorage.setItem("sentencesTopic", topic);
  const topicModal = document.getElementById("topicModal");
  if(topicModal) topicModal.style.display = "none";
  resetGame();
}
document.querySelectorAll(".topicBtn").forEach(btn => btn.addEventListener("click", ()=>chooseTopic(btn.dataset.topic)));

/* ===== LEVEL COUNTERS HELPER ===== */
function initializeLevelCounts(){
  const obj = {};
  for(let l=1;l<=TOTAL_LEVELS;l++){ obj[l]=0; }
  return obj;
}

/* ===== GENERATE SENTENCE =====
   builds currentSentence based on currentTopic and currentLevel
*/
function generateSentence(){
  if(currentTopic === "emotions"){
    const emotion = randomItem(emotions);
    const zone = randomItem(emotionZones);
    currentSentence = { emotion, zone };
    return;
  }
  if(currentTopic === "animals"){
    const animal = randomItem(animals);
    const number = randomItem(numbers);
    const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";
    const foodItem = randomItem(food);
    const colour = randomItem(colours);
    currentSentence = { animal, number, food: foodItem, colour, verb };
    return;
  }
  if(currentTopic === "food"){
    const foodItem = randomItem(food);
    const colour = randomItem(colours);
    const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";
    const animal = randomItem(animals);
    const number = randomItem(numbers);
    currentSentence = { food: foodItem, colour, verb, animal, number };
    return;
  }
  // fallback
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const foodItem = randomItem(food);
  const colour = randomItem(colours);
  const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";
  currentSentence = { animal, number, food: foodItem, colour, verb };
}

/* ===== BUILD QUESTION =====
   odd/even logic:
   - isOdd (question number 1,3,5... => true) => display signs in question, images in draggables
   - even => display composite image in question, signs in draggables
*/
function buildQuestion(){
  // initialize level counters if empty
  if(Object.keys(levelCorrect).length === 0) levelCorrect = initializeLevelCounts();
  if(Object.keys(levelIncorrect).length === 0) levelIncorrect = initializeLevelCounts();

  generateSentence();
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";

  // Hide controls until user interacts (they'll appear when draggables are dropped)
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  // Determine odd/even based on human-facing question number (roundInLevel is 0-based)
  const questionNumber = roundInLevel + 1;
  const isOdd = (questionNumber % 2 === 1);

  // Show small helpers (i see what) for early levels if desired
  if(currentLevel <= 2){
    const helperDiv = document.createElement("div");
    helpers.forEach(h => {
      const elPath = signPathFor(h);
      const node = createMediaElementForPath(elPath, { className: "helperSign" });
      helperDiv.appendChild(node);
    });
    questionArea.appendChild(helperDiv);
  }

  // Build topic-specific content with odd/even swap
  if(currentTopic === "emotions"){
    buildQuestionForEmotions(isOdd);
  } else {
    buildQuestionForAnimalsOrFood(isOdd);
  }

  updateScoreDisplay();
}

/* ===== CREATE MEDIA ELEMENT (img or video) ===== */
function createMediaElementForPath(path, opts = {}){
  if(!path) { const empty = document.createElement("div"); empty.textContent=""; return empty; }
  const lower = path.toLowerCase();
  if(lower.endsWith(".mp4")){
    const vid = document.createElement("video");
    vid.src = path; vid.autoplay = true; vid.loop = true; vid.muted = true; vid.playsInline = true;
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

/* ===== BUILD QUESTION: EMOTIONS (odd/even) ===== */
function buildQuestionForEmotions(isOdd){
  const comboDiv = document.createElement("div");
  comboDiv.className = "comboDiv emotionsCombo";

  if(isOdd){
    // show signs in question (emotion sign video + zone sign image)
    // For emotions, helper sign paths: signPathFor(emotion) returns .mp4; zone returns png
    const vid = createMediaElementForPath(signPathFor(currentSentence.emotion));
    const zoneImg = createMediaElementForPath(signPathFor(currentSentence.zone));
    comboDiv.appendChild(vid);
    comboDiv.appendChild(zoneImg);
    questionArea.appendChild(comboDiv);
    buildAnswerBoxesEmotions(isOdd);
    // Draggables should be images (composite) for odd questions
    buildDraggablesEmotionsImages(isOdd);
  } else {
    // even question: image shown in question, signs are draggables
    const imagePath = compositeImagePath(`${currentSentence.emotion}-${currentSentence.zone}`);
    comboDiv.appendChild(createMediaElementForPath(imagePath));
    questionArea.appendChild(comboDiv);
    buildAnswerBoxesEmotions(isOdd);
    // Draggables are signs (video + images)
    buildDraggablesEmotionsSigns(isOdd);
  }
}

/* ===== BUILD QUESTION: ANIMALS or FOOD (odd/even) ===== */
function buildQuestionForAnimalsOrFood(isOdd){
  const comboDiv = document.createElement("div");
  comboDiv.className = "comboDiv";

  // The displayed question content depends on level and topic AND odd/even:
  // We will use the isOdd flag to decide whether to show signs (odd) or image (even).
  if(currentLevel === 1){
    if(isOdd){
      // signs in question
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.animal)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.number)));
      questionArea.appendChild(comboDiv);
      // draggables should be images (composite)
      buildDraggablesImagesForLevel1();
      buildAnswerBoxesLevel1(isOdd);
    } else {
      // image in question
      comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`)));
      questionArea.appendChild(comboDiv);
      // draggables should be signs
      buildDraggablesSignsForLevel1();
      buildAnswerBoxesLevel1(isOdd);
    }
    return;
  }

  if(currentLevel === 2){
    // Level 2 is topic-specific: animals -> animal+number, food -> food+colour
    if(currentTopic === "animals"){
      if(isOdd){
        // signs in question
        comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.animal)));
        comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.number)));
        questionArea.appendChild(comboDiv);
        buildDraggablesImagesForLevel2Animals();
        buildAnswerBoxesLevel2(isOdd);
      } else {
        comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`)));
        questionArea.appendChild(comboDiv);
        buildDraggablesSignsForLevel2Animals();
        buildAnswerBoxesLevel2(isOdd);
      }
    } else { // food topic
      if(isOdd){
        comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.food)));
        comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.colour)));
        questionArea.appendChild(comboDiv);
        buildDraggablesImagesForLevel2Food();
        buildAnswerBoxesLevel2(isOdd);
      } else {
        comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`)));
        questionArea.appendChild(comboDiv);
        buildDraggablesSignsForLevel2Food();
        buildAnswerBoxesLevel2(isOdd);
      }
    }
    return;
  }

  // For Level 3 and 4 (and 5 if used as review), we reuse mixed structures.
  if(currentLevel === 3){
    if(isOdd){
      // show signs in question (animal, number, want sign, food, colour)
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.animal)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.number)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor("want")));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.food)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.colour)));
      questionArea.appendChild(comboDiv);
      // draggables are composite images (animal-number and food-colour)
      buildDraggablesMixedImages();
      buildAnswerBoxes(isOdd);
    } else {
      // show composite images in question (animal-number composite, then want sign, then food-colour composite)
      comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor("want")));
      comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`)));
      questionArea.appendChild(comboDiv);
      // draggables are signs for the parts
      buildDraggablesMixedSigns();
      buildAnswerBoxes(isOdd);
    }
    return;
  }

  if(currentLevel === 4){
    // Keep same style as prior: mix of composite and signs with don't-have handling
    if(isOdd){
      // show composite animal-number and composite food-colour (with X overlay if don't have)
      comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`)));
      const foodCompositePath = compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`);
      const foodNode = createMediaElementForPath(foodCompositePath);
      if(currentSentence.verb === "donthave"){
        const wrapper = document.createElement("div"); wrapper.className = "dontHaveWrapper";
        wrapper.appendChild(foodNode);
        const xDiv = document.createElement("div"); xDiv.className = "xOverlay"; xDiv.textContent = "X";
        wrapper.appendChild(xDiv);
        comboDiv.appendChild(wrapper);
      } else comboDiv.appendChild(foodNode);
      questionArea.appendChild(comboDiv);
      buildDraggablesLevel4Images(isOdd);
      buildAnswerBoxes(isOdd);
    } else {
      // show signs in question (animal,number,verb,[food maybe X],colour)
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.animal)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.number)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.verb)));
      if(currentSentence.verb === "donthave"){
        const foodSign = createMediaElementForPath(signPathFor(currentSentence.food));
        const wrapper = document.createElement("div"); wrapper.className="dontHaveWrapper";
        wrapper.appendChild(foodSign);
        const xDiv = document.createElement("div"); xDiv.className="xOverlay"; xDiv.textContent="X";
        wrapper.appendChild(xDiv);
        comboDiv.appendChild(wrapper);
      } else comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.food)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.colour)));
      questionArea.appendChild(comboDiv);
      buildDraggablesLevel4Signs(isOdd);
      buildAnswerBoxes(isOdd);
    }
    return;
  }

  // Level 5 (review/combined): show review composites (we'll treat as odd/even same rules)
  if(currentLevel === 5){
    if(isOdd){
      // show signs in question for review
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.animal)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.number)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.food)));
      comboDiv.appendChild(createMediaElementForPath(signPathFor(currentSentence.colour)));
      questionArea.appendChild(comboDiv);
      buildDraggablesMixedImages();
      buildAnswerBoxes(isOdd);
    } else {
      comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`)));
      comboDiv.appendChild(createMediaElementForPath(compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`)));
      questionArea.appendChild(comboDiv);
      buildDraggablesMixedSigns();
      buildAnswerBoxes(isOdd);
    }
  }
}

/* ===== BUILD ANSWER BOXES helpers ===== */
function buildAnswerBoxes(isOdd){
  // generic build for multi-part answers (used for many levels)
  answerArea.innerHTML = "";
  let dropLabels = [];
  if(currentLevel === 1) dropLabels = isOdd ? ["animal","howmany?"] : ["animal+howmany?"];
  else if(currentLevel === 2) {
    // topic-specific
    if(currentTopic === "animals") dropLabels = isOdd ? ["animal","howmany?"] : ["animal+howmany?"];
    else dropLabels = isOdd ? ["food","colour"] : ["food+colour"];
  }
  else if(currentLevel === 3) dropLabels = isOdd ? ["animal","howmany?","verb","food","colour"] : ["animal+howmany?","verb","food+colour"];
  else if(currentLevel === 4) dropLabels = isOdd ? ["animal","howmany?","verb","food","colour"] : ["animal+howmany?","food+colour"];
  else if(currentLevel === 5) dropLabels = isOdd ? ["animal","howmany?","food","colour"] : ["animal+howmany?","food+colour"];

  dropLabels.forEach(label=>{
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);

    // if verb slot for level 3, make it prefilled as 'want'
    if(currentLevel===3 && label==="verb"){
      const node = createMediaElementForPath(signPathFor("want"));
      dz.appendChild(node);
      dz.dataset.filled = "want";
      dz.classList.add("filled");
      dz.dataset.permanent = "true";
    }
    answerArea.appendChild(dz);
  });
}

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

/* ===== DRAGGABLE BUILDERS (images vs signs depending on odd/even & topic) ===== */

/* -- Images draggables for Level 1 (composite animal-number) -- */
function buildDraggablesImagesForLevel1(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  const correctComposite = `${currentSentence.animal}-${currentSentence.number}`;
  buildImageDraggablesPool([correctComposite], createImageDecoyForLevel1);
}

/* -- Signs draggables for Level 1 -- */
function buildDraggablesSignsForLevel1(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  const correctParts = [currentSentence.animal, currentSentence.number];
  buildSignDraggablesPool(correctParts, createSignDecoyForLevel1);
}

/* -- Images for Level 2 animals -- */
function buildDraggablesImagesForLevel2Animals(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  const correctComposite = `${currentSentence.animal}-${currentSentence.number}`;
  buildImageDraggablesPool([correctComposite], ()=> `${randomItem(animals)}-${randomItem(numbers)}`);
}

/* -- Signs for Level 2 animals -- */
function buildDraggablesSignsForLevel2Animals(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  buildSignDraggablesPool([currentSentence.animal, currentSentence.number], ()=> randomItem([...animals, ...numbers]));
}

/* -- Images for Level 2 food -- */
function buildDraggablesImagesForLevel2Food(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  const correctComposite = `${currentSentence.food}-${currentSentence.colour}`;
  buildImageDraggablesPool([correctComposite], ()=> `${randomItem(food)}-${randomItem(colours)}`);
}

/* -- Signs for Level 2 food -- */
function buildDraggablesSignsForLevel2Food(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  buildSignDraggablesPool([currentSentence.food, currentSentence.colour], ()=> randomItem([...food, ...colours]));
}

/* -- Mixed image pool for level 3/5 odd questions (composite images) -- */
function buildDraggablesMixedImages(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  const base = [`${currentSentence.animal}-${currentSentence.number}`, `${currentSentence.food}-${currentSentence.colour}`];
  buildImageDraggablesPool(base, ()=> Math.random()<0.5? `${randomItem(animals)}-${randomItem(numbers)}` : `${randomItem(food)}-${randomItem(colours)}`);
}

/* -- Mixed sign pool for level 3/5 even questions (signs for parts) -- */
function buildDraggablesMixedSigns(){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  buildSignDraggablesPool([currentSentence.animal, currentSentence.number, currentSentence.food, currentSentence.colour], ()=> randomItem([...animals, ...numbers, ...food, ...colours]));
}

/* -- Level 4/other images (composite + maybe -X) -- */
function buildDraggablesLevel4Images(isOdd){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  const items = isOdd ? [currentSentence.animal, currentSentence.number, currentSentence.food, currentSentence.colour] : [`${currentSentence.animal}-${currentSentence.number}`, `${currentSentence.food}-${currentSentence.colour}`];
  // For images in level4, create composite elements pool
  if(isOdd) {
    // show signs in question so images are draggable as composites (for odd we will present their images)
    buildImageDraggablesPool([`${currentSentence.animal}-${currentSentence.number}`, `${currentSentence.food}-${currentSentence.colour}`], ()=> Math.random()<0.5? `${randomItem(animals)}-${randomItem(numbers)}` : `${randomItem(food)}-${randomItem(colours)}`);
  } else {
    // when signs in draggables for even, this won't be called
    buildImageDraggablesPool([`${currentSentence.animal}-${currentSentence.number}`, `${currentSentence.food}-${currentSentence.colour}`], ()=> `${randomItem(animals)}-${randomItem(numbers)}`);
  }
}

/* -- Level 4 signs (when signs are draggables) -- */
function buildDraggablesLevel4Signs(isOdd){
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = "";
  // signs pool should include animal, number, verb, food, colour
  const base = [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];
  buildSignDraggablesPool(base, ()=> randomItem([...animals, ...numbers, ...food, ...colours, ...verbs]));
}

/* ===== DRAGGABLES for EMOTIONS: images vs signs ===== */
function buildDraggablesEmotionsImages(isOdd){
  // images draggable pool for odd questions
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  const correctComposite = `${currentSentence.emotion}-${currentSentence.zone}`;
  buildImageDraggablesPool([correctComposite], ()=> `${randomItem(emotions)}-${randomItem(emotionZones)}`);
}
function buildDraggablesEmotionsSigns(isOdd){
  // signs draggable pool for even questions (signs and zone images)
  leftDraggables.innerHTML=""; rightDraggables.innerHTML="";
  buildSignDraggablesPool([currentSentence.emotion, currentSentence.zone], ()=> randomItem([...emotions, ...emotionZones]));
}

/* ===== GENERIC BUILDERS FOR IMAGE/ SIGN POOLS ===== */

/* Build a pool of image draggables (composite images like dog-one.png) */
function buildImageDraggablesPool(initialCorrectArr, decoyGenerator){
  const totalItems = 16;
  const items = initialCorrectArr.slice();
  const used = new Set(items);
  while(items.length < totalItems){
    const decoy = decoyGenerator();
    if(!used.has(decoy)) { items.push(decoy); used.add(decoy); }
  }
  finalizeDraggableRender(items);
}

/* Build a pool of sign draggables (individual parts like dog-sign.png or number-sign.png) */
function buildSignDraggablesPool(initialCorrectParts, decoyGenerator){
  const totalItems = 16;
  const items = initialCorrectParts.slice();
  const used = new Set(items);
  while(items.length < totalItems){
    const decoy = decoyGenerator();
    if(!used.has(decoy)) { items.push(decoy); used.add(decoy); }
  }
  finalizeDraggableRender(items);
}

/* Render draggables into left/right containers, creating appropriate element for sign vs composite image based on value */
function finalizeDraggableRender(items){
  const shuffled = shuffleArray(items);
  const halves = [shuffled.slice(0,8), shuffled.slice(8,16)];
  halves.forEach((group, idx) => {
    const container = idx === 0 ? leftDraggables : rightDraggables;
    container.innerHTML = "";
    group.forEach(val => {
      const div = document.createElement("div");
      div.className = "draggable";
      div.draggable = true;
      div.dataset.originalParent = container.id;
      // If val includes "-" we treat as composite image; otherwise individual sign
      if(typeof val === "string" && val.includes("-")){
        // composite image
        const imgNode = createMediaElementForPath(compositeImagePath(val));
        div.appendChild(imgNode);
        div.dataset.value = val;
      } else {
        // single token -> signPathFor()
        const path = signPathFor(val);
        const node = createMediaElementForPath(path);
        div.appendChild(node);
        div.dataset.value = val;
      }
      // dragstart
      div.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", div.dataset.value));
      container.appendChild(div);
    });
  });
}

/* ===== DRAG & DROP (supports touch) ===== */
let dragItem = null, dragClone = null, isTouch = false;
function startDrag(e){
  const target = e.target.closest(".draggable");
  if(!target) return;
  dragItem = target;
  isTouch = e.type.startsWith("touch");
  const rect = target.getBoundingClientRect();
  dragClone = target.cloneNode(true);
  Object.assign(dragClone.style, { position: "fixed", left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px", opacity: "0.7", pointerEvents: "none", zIndex: "10000" });
  document.body.appendChild(dragClone);
  e.preventDefault();
  if(isTouch){ document.addEventListener("touchmove", moveDrag, {passive:false}); document.addEventListener("touchend", endDrag); }
  else { document.addEventListener("mousemove", moveDrag); document.addEventListener("mouseup", endDrag); }
}
function moveDrag(e){
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }
  dragClone.style.left = clientX - dragClone.offsetWidth/2 + "px";
  dragClone.style.top = clientY - dragClone.offsetHeight/2 + "px";
}
function endDrag(e){
  if(!dragItem || !dragClone) return;
  let clientX, clientY;
  if(isTouch && e.changedTouches && e.changedTouches.length>0){ clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }
  let dropped = false;
  document.querySelectorAll(".dropzone").forEach(dz => {
    const rect = dz.getBoundingClientRect();
    if(clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && dz.childElementCount === 0){
      const node = dragItem.cloneNode(true);
      node.classList.remove("draggable");
      dz.appendChild(node);
      dz.dataset.filled = dragItem.dataset.value;
      dz.classList.add("filled");
      dropped = true;
    }
  });
  if(dragClone) document.body.removeChild(dragClone);
  dragClone = null; dragItem = null;
  if(isTouch){ document.removeEventListener("touchmove", moveDrag, {passive:false}); document.removeEventListener("touchend", endDrag); }
  else { document.removeEventListener("mousemove", moveDrag); document.removeEventListener("mouseup", endDrag); }
  if(dropped){
    // show again and possibly show check if all dropzones filled
    againBtn.style.display = "inline-block";
    const allFilled = Array.from(document.querySelectorAll(".dropzone")).every(d => d.dataset.filled);
    checkBtn.style.display = allFilled ? "inline-block" : "none";
  }
}
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, {passive:false});
function dropHandler(e){ e.preventDefault(); }

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click", ()=>{
  // Hide controls immediately while evaluating
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;

  dropzones.forEach((dz, i) => {
    if(dz.dataset.permanent === "true"){ dz.classList.add("correct"); return; }
    const filled = dz.dataset.filled || "";
    let expected = "";
    let isCorrect = false;

    // Determine expected value based on topic, level and odd/even
    const questionNumber = roundInLevel + 1;
    const isOdd = (questionNumber % 2 === 1);

    if(currentTopic === "emotions"){
      if(isOdd){
        expected = (i === 0) ? currentSentence.emotion : currentSentence.zone;
      } else {
        expected = `${currentSentence.emotion}-${currentSentence.zone}`;
      }
      isCorrect = (filled === expected);
    } else {
      // animals / food topics
      if(currentLevel === 1){
        expected = isOdd ? (i===0 ? currentSentence.animal : currentSentence.number) : `${currentSentence.animal}-${currentSentence.number}`;
        isCorrect = (filled === expected);
      } else if(currentLevel === 2){
        if(currentTopic === "animals"){
          expected = isOdd ? (i===0 ? currentSentence.animal : currentSentence.number) : `${currentSentence.animal}-${currentSentence.number}`;
        } else {
          expected = isOdd ? (i===0 ? currentSentence.food : currentSentence.colour) : `${currentSentence.food}-${currentSentence.colour}`;
        }
        isCorrect = (filled === expected);
      } else if(currentLevel === 3){
        const oddArr = [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];
        const evenArr = [`${currentSentence.animal}-${currentSentence.number}`, currentSentence.verb, `${currentSentence.food}-${currentSentence.colour}`];
        expected = isOdd ? oddArr[i] : evenArr[i];
        isCorrect = (filled === expected);
      } else if(currentLevel === 4){
        const isOddLevel = isOdd;
        if(isOddLevel){
          if(dz.dataset.placeholder === "animal") expected = currentSentence.animal;
          else if(dz.dataset.placeholder === "howmany?") expected = currentSentence.number;
          else if(dz.dataset.placeholder === "verb") expected = currentSentence.verb;
          else if(dz.dataset.placeholder === "food") expected = currentSentence.food;
          else if(dz.dataset.placeholder === "colour") expected = currentSentence.colour;

          if(dz.dataset.placeholder === "food" && currentSentence.verb === "donthave"){
            isCorrect = (filled === expected) || (filled === `${expected}-X`) || (filled && filled.includes(expected));
          } else isCorrect = (filled === expected);
        } else {
          if(dz.dataset.placeholder === "animal+howmany?") expected = `${currentSentence.animal}-${currentSentence.number}`;
          else if(dz.dataset.placeholder === "food+colour") expected = `${currentSentence.food}-${currentSentence.colour}`;
          else expected = dz.dataset.placeholder || "";
          if(dz.dataset.placeholder === "food+colour" && currentSentence.verb === "donthave") isCorrect = (filled === expected) || (filled === `${expected}-X`) || (filled && filled.includes(expected));
          else isCorrect = (filled === expected);
        }
      } else if(currentLevel === 5){
        // review level - accept either parts or composite depending on placeholder
        if(dz.dataset.placeholder && dz.dataset.placeholder.includes("+")){
          // composite expected
          if(dz.dataset.placeholder === "animal+howmany?") expected = `${currentSentence.animal}-${currentSentence.number}`;
          else if(dz.dataset.placeholder === "food+colour") expected = `${currentSentence.food}-${currentSentence.colour}`;
        } else {
          // single parts
          if(dz.dataset.placeholder === "animal") expected = currentSentence.animal;
          if(dz.dataset.placeholder === "howmany?") expected = currentSentence.number;
          if(dz.dataset.placeholder === "food") expected = currentSentence.food;
          if(dz.dataset.placeholder === "colour") expected = currentSentence.colour;
        }
        isCorrect = (filled === expected);
      }
    }

    // Mark results
    if(isCorrect){
      correctCount++; levelCorrect[currentLevel] = (levelCorrect[currentLevel] || 0) + 1;
      dz.classList.add("correct");
    } else {
      incorrectCount++; levelIncorrect[currentLevel] = (levelIncorrect[currentLevel] || 0) + 1;
      allCorrect = false;
      dz.classList.remove("correct","filled");
      dz.classList.add("incorrect");
      // clear filled so student can try again once we reset
      dz.innerHTML = "";
      dz.dataset.filled = "";
    }

    // record answer into history
    if(filled){
      const items = filled.split("-").map(v=>v.trim());
      const labels = dz.dataset.placeholder && dz.dataset.placeholder.includes("+") ? dz.dataset.placeholder.split("+") : [dz.dataset.placeholder];
      labels.forEach((lbl, idx) => {
        answersHistory.push({ level: currentLevel, label: lbl||"", value: items[idx] || items.join("-") || "", correct: isCorrect, topic: currentTopic });
      });
    }
  }); // dropzones.forEach

  // show feedback image
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  feedbackDiv.appendChild(fb);
  saveProgress();

  setTimeout(()=>{
    feedbackDiv.innerHTML = "";
    if(allCorrect){
      // Advance to next question
      nextRound();
    } else {
      // Incorrect -> reset current question state for retry
      // restore draggables back to original containers so student can try again
      restoreDraggablePositions();
      // reset dropzones (already cleared above)
      Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz=>{
        if(dz.dataset.permanent !== "true"){ dz.innerHTML = ""; dz.dataset.filled = ""; dz.classList.remove("incorrect","filled","correct"); }
        else dz.classList.add("correct");
      });
      // show Again button for clearing positions if student wants to re-drag
      againBtn.style.display = "inline-block";
      checkBtn.style.display = "none";
    }
  }, 1200);
});

/* ===== AGAIN BUTTON =====
   - Put draggables back into their original containers, clear dropzones (except permanent)
*/
function restoreDraggablePositions(){
  document.querySelectorAll(".draggable").forEach(d=>{
    const parentId = d.dataset.originalParent;
    const container = document.getElementById(parentId);
    if(container) container.appendChild(d);
  });
}
againBtn.addEventListener("click", ()=>{
  restoreDraggablePositions();
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz=>{
    if(dz.dataset.permanent!=="true"){ dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("incorrect","filled","correct"); } else dz.classList.add("correct");
  });
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== GAME FLOW ===== */
function nextRound(){
  roundInLevel++;
  if(roundInLevel >= 10){
    // move to next level
    if(currentLevel < TOTAL_LEVELS){
      currentLevel++;
      roundInLevel = 0;
      buildQuestion();
      saveProgress();
    } else {
      // End of all levels: submit and show end modal
      endGameFlow();
    }
  } else {
    buildQuestion();
    saveProgress();
  }
}

/* ===== GOOGLE FORM SUBMISSION ===== */
async function submitResults(){
  // submit current in-memory results to Google Form silently
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent = totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0;
  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, `Sentences - ${currentTopic||'Sentences'}`);
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);
  for(let l=1;l<=TOTAL_LEVELS;l++){
    const cf = FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf = FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if(cf) fd.append(cf, formatAnswersForLevel(l, true));
    if(inf) fd.append(inf, formatAnswersForLevel(l, false));
  }
  try{ await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" }); }
  catch(err){ console.warn("Form submission failed", err); }
}
function formatAnswersForLevel(level, correct=true){
  return answersHistory.filter(a => a.level === level && a.correct === correct).sort((a,b)=> a.label.localeCompare(b.label)).map(a=>`${a.label}-${a.value}`).join(",");
}

/* ===== END GAME FLOW =====
   When all levels complete (end of TOTAL_LEVELS),
   submit results, clear save, show end modal with clap gif and final stats,
   then redirect to index.html after finish click (or short timeout).
*/
async function endGameFlow(){
  await submitResults();
  clearProgress();
  // show end modal with results
  endModal.style.display = "block";
  const gif = document.getElementById("endGif");
  if(gif) gif.src = "assets/auslan-clap.gif";
  const totalCorrect = correctCount;
  const totalAttempts = correctCount + incorrectCount || 1;
  const percent = Math.round((totalCorrect/totalAttempts)*100);
  const finalScoreEl = document.getElementById("finalScore");
  const finalPercentEl = document.getElementById("finalPercent");
  const finalTimeEl = document.getElementById("finalTime");
  if(finalScoreEl) finalScoreEl.textContent = `${totalCorrect}/${totalAttempts}`;
  if(finalPercentEl) finalPercentEl.textContent = percent + "%";
  if(finalTimeEl) finalTimeEl.textContent = `${Math.floor(getTimeElapsed()/60)}m ${getTimeElapsed()%60}s`;

  // clicking finish redirects to index.html
  finishBtn.onclick = () => {
    window.location.href = "index.html";
  };
  // auto redirect after a short delay (6s) as fallback
  setTimeout(()=>{ window.location.href = "index.html"; }, 6000);
}

/* ===== STOP BUTTON (continue/new/finish) ===== */
stopBtn.addEventListener("click", () => {
  savedTimeElapsed = getTimeElapsed();
  const percent = Math.round((correctCount / (correctCount + incorrectCount || 1)) * 100);

  const modal = document.getElementById("stopModal");
  if(!modal) return;
  modal.style.display = "block";
  const stopTime = document.getElementById("stopTime");
  const stopPercent = document.getElementById("stopPercent");
  if(stopTime) stopTime.textContent = `${Math.floor(savedTimeElapsed/60)}m ${savedTimeElapsed%60}s`;
  if(stopPercent) stopPercent.textContent = percent + "%";

  // Continue resumes the timer and hides modal
  document.getElementById("continueBtn").onclick = () => {
    modal.style.display = "none";
    startTime = Date.now();
  };

  // New: submit saved progress silently (if exists), clear, and go to topic select
  document.getElementById("againBtnStop").onclick = async () => {
    modal.style.display = "none";
    const saved = loadProgress();
    if(saved) await submitSavedProgress(saved);
    clearProgress();
    currentTopic = "";
    localStorage.removeItem("sentencesTopic");
    const topicModal = document.getElementById("topicModal");
    if(topicModal) topicModal.style.display = "flex";
    else resetGame();
  };

  // Finish: submit current results silently, clear and go to index.html
  document.getElementById("finishBtnStop").onclick = async () => {
    modal.style.display = "none";
    await submitResults();
    clearProgress();
    window.location.href = "index.html";
  };
});

/* ===== RESUME MODAL BUTTONS (alternate bindings) ===== */
document.getElementById("resumeContinue")?.addEventListener("click", ()=>{
  document.getElementById("resumeModal").style.display = "none";
  const saved = loadProgress();
  if(saved) restoreProgress(saved);
  else resetGame();
});
document.getElementById("resumeAgain")?.addEventListener("click", async ()=>{
  document.getElementById("resumeModal").style.display = "none";
  const saved = loadProgress();
  if(saved) await submitSavedProgress(saved);
  clearProgress();
  currentTopic = "";
  localStorage.removeItem("sentencesTopic");
  const topicModal = document.getElementById("topicModal");
  if(topicModal) topicModal.style.display = "flex";
  else resetGame();
});

/* ===== START/RESET GAME ===== */
function startGame(){
  startTime = Date.now();
  buildQuestion();
}

function resetGame(){
  currentLevel = 1;
  roundInLevel = 0;
  correctCount = 0;
  incorrectCount = 0;
  savedTimeElapsed = 0;
  answersHistory = [];
  levelCorrect = initializeLevelCounts();
  levelIncorrect = initializeLevelCounts();
  saveTopicToLocal();
  startGame();
}

function saveTopicToLocal(){ if(currentTopic) localStorage.setItem("sentencesTopic", currentTopic); }

/* ===== UPDATE UI ===== */
function updateScoreDisplay(){
  const topicLabel = currentTopic ? (currentTopic.charAt(0).toUpperCase() + currentTopic.slice(1)) : "Sentences";
  scoreDisplay.textContent = `${topicLabel} - Level ${currentLevel} - Question ${roundInLevel + 1}/10`;
}

/* ===== INIT ===== */
window.addEventListener("load", ()=>{
  const saved = loadProgress();

  // If no topic chosen, show topic modal
  if(!currentTopic){
    const topicModal = document.getElementById("topicModal");
    if(topicModal){
      topicModal.style.display = "flex";
      return; // wait for topic selection
    } else {
      currentTopic = "animals"; // fallback
    }
  }

  if(saved && saved.studentName){
    showResumeModal(saved);
  } else {
    resetGame();
  }
});
