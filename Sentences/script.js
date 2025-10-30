/* ===========================
   script.js - Complete replacement
   =========================== */

/* ===== CONFIG / FORM MAP ===== */
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
  level5: { correct: "entry.116543611", incorrect: "entry.1475510168" }
};

const SAVE_KEY = "sentencesGameSave";

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

/* ===== GAME VARIABLES ===== */
let currentLevel = 1;
let roundInLevel = 0; // 0-based
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let startTime = null;
let savedTimeElapsed = 0;
let answersHistory = [];
let levelCorrect = {1:0,2:0,3:0,4:0,5:0};
let levelIncorrect = {1:0,2:0,3:0,4:0,5:0};
const TOTAL_LEVELS = 5;
const QUESTIONS_PER_LEVEL = 10;

let selectedTopic = localStorage.getItem("selectedTopic") || null;

/* ===== VOCAB (kept exactly) ===== */
const topics = {
  animals: ["dog","cat","mouse","rabbit","fish","bird"],
  food: ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"],
  emotions: ["angry","annoyed","ashamed","bored","confident","confused","danger","disappointed","excited","exhausted","focus","frustrated","happy","jealous","lonely","loved","nervous","pain","proud","relax","sad","scared","shock","shy","sick","silly","stressed","support","surprised","tease","thankful","tired","worried"]
};
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const zones = ["green","blue","yellow","red"];
const verbs = ["want","have","donthave"];
const helpers = ["i","see","feel","what"];

/* ===== HELPERS ===== */
function shuffleArray(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function signPathFor(word){
  if(!word) return "";
  if (topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if (numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if (verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if (helpers.includes(word)) return `assets/signs/helpers/${word}.png`;
  return "";
}

/* ===== TIMER HELPERS ===== */
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = (seconds || 0); startTime = Date.now(); }

/* ===== SAVE / LOAD / CLEAR ===== */
function saveProgress(){
  const payload = {
    studentName, studentClass, currentLevel, roundInLevel, correctCount, incorrectCount,
    answersHistory, levelCorrect, levelIncorrect, timeElapsed: getTimeElapsed(),
    selectedTopic
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); } catch(e){ console.warn("save failed", e); }
}
function loadProgress(){
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e){ return null; }
}
function clearProgress(){
  try { localStorage.removeItem(SAVE_KEY); } catch(e){ }
}

/* ===== TOPIC MODAL ===== */
function openTopicModal(){ 
  if (!topicModal) return;
  topicModal.style.display = "flex";
  topicModal.style.zIndex = 3000;
}
document.querySelectorAll(".topicBtn").forEach(btn=>{
  btn.addEventListener("click", e=>{
    selectedTopic = e.currentTarget.dataset.topic;
    localStorage.setItem("selectedTopic", selectedTopic);
    topicModal.style.display = "none";
    // reset progress for new topic
    currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0;
    levelCorrect = {1:0,2:0,3:0,4:0,5:0};
    levelIncorrect = {1:0,2:0,3:0,4:0,5:0};
    answersHistory = [];
    setTimeElapsed(0);
    buildQuestion();
  });
});

/* ===== GENERATE SENTENCE ===== */
function generateSentence(){
  if (!selectedTopic) selectedTopic = randomItem(Object.keys(topics));
  const mainTopic = selectedTopic;
  const word1 = randomItem(topics[mainTopic]);
  let word2;
  if (mainTopic === "animals") word2 = randomItem(numbers);
  else if (mainTopic === "food") word2 = randomItem(colours);
  else word2 = randomItem(zones);
  let verb = "want";
  if (currentLevel === 3) verb = randomItem(["want","have"]);
  if (currentLevel >= 4) verb = randomItem(verbs);
  currentSentence = { topic: mainTopic, word1, word2, verb };
}

/* ===== BUILD DROP ZONES ===== */
function buildDropZones(isOdd){
  answerArea.innerHTML = "";
  let dropLabels = [];
  switch(currentLevel){
    case 1: dropLabels = isOdd ? ["word1","word2"] : ["word1+word2"]; break;
    case 2: dropLabels = isOdd ? ["word1","word2"] : ["word1+word2"]; break;
    case 3: dropLabels = isOdd ? ["word1","word2","verb"] : ["word1+word2","verb"]; break;
    case 4:
    case 5: dropLabels = ["word1","word2","verb"]; break;
    default: dropLabels = ["word1","word2"]; break;
  }
  dropLabels.forEach(label=>{
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e=>e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    answerArea.appendChild(dz);
  });
}

/* ===== BUILD DRAGGABLES ===== */
let dragItem = null, dragClone = null, isTouch = false;

function buildDraggables(isOdd){
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";

  const { word1, word2, verb } = currentSentence;
  let items = [];

  switch(currentLevel){
    case 1: items = isOdd ? [word1, word2] : [`${word1}-${word2}`]; break;
    case 2: items = isOdd ? [word1, word2] : [`${word1}-${word2}`]; break;
    case 3: items = isOdd ? [word1, word2, verb] : [`${word1}-${word2}`, verb]; break;
    case 4: items = [word1, word2, verb]; break;
    case 5: items = [word1, word2, verb]; break;
    default: items = [word1, word2]; break;
  }

  // decoys
  let decoyPool = [];
  if (currentLevel < 5){
    decoyPool = [...(topics[selectedTopic] || [])];
    if (selectedTopic === "animals") decoyPool = decoyPool.concat(numbers);
    else if (selectedTopic === "food") decoyPool = decoyPool.concat(colours);
    else decoyPool = decoyPool.concat(zones);
  } else {
    decoyPool = [...topics.animals, ...topics.food, ...topics.emotions, ...colours, ...numbers, ...zones];
  }

  const combo = `${word1}-${word2}`;
  decoyPool = decoyPool.filter(d => !items.includes(d) && d !== combo);

  let decoys = shuffleArray(decoyPool);
  while (items.length < 16 && decoys.length > 0) items.push(decoys.pop());
  items = shuffleArray(items);

  const halves = [items.slice(0,8), items.slice(8,16)];
  halves.forEach((group, idx) => {
    const container = idx === 0 ? leftDraggables : rightDraggables;
    group.forEach(val => {
      const div = document.createElement("div");
      div.className = "draggable";
      div.draggable = true;
      div.dataset.value = val;
      div.dataset.originalParent = container.id;

      const img = document.createElement("img");
      const path = signPathFor(val);
      img.src = path || "";
      img.alt = val;
      img.onerror = () => {
        img.style.display = "none";
        if (!div.querySelector(".fallback")){
          const f = document.createElement("div");
          f.className = "fallback";
          f.textContent = val;
          div.appendChild(f);
        }
      };
      div.appendChild(img);

      // native dragstart fallback
      div.addEventListener("dragstart", e => {
        try { e.dataTransfer.setData("text/plain", val); } catch(err){}
      });

      container.appendChild(div);
    });
  });
}

/* ===== DRAG CLONE (mouse + touch) ===== */
function startDrag(e){
  const t = e.target.closest ? e.target.closest(".draggable") : null;
  if (!t) return;
  dragItem = t;
  isTouch = e.type.startsWith("touch");
  const rect = t.getBoundingClientRect();
  dragClone = t.cloneNode(true);
  Object.assign(dragClone.style, {
    position: "fixed",
    left: rect.left + "px",
    top: rect.top + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    opacity: "0.85",
    pointerEvents: "none",
    zIndex: 5000
  });
  document.body.appendChild(dragClone);
  e.preventDefault();

  if (isTouch){
    document.addEventListener("touchmove", moveDrag, { passive:false });
    document.addEventListener("touchend", endDrag);
  } else {
    document.addEventListener("mousemove", moveDrag);
    document.addEventListener("mouseup", endDrag);
  }
}

function moveDrag(e){
  if (!dragClone) return;
  let clientX, clientY;
  if (isTouch && e.touches && e.touches.length>0){
    clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }
  dragClone.style.left = (clientX - dragClone.offsetWidth/2) + "px";
  dragClone.style.top = (clientY - dragClone.offsetHeight/2) + "px";
}

function endDrag(e){
  if (!dragItem || !dragClone) return;
  let clientX, clientY;
  if (isTouch && e.changedTouches && e.changedTouches.length>0){
    clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }

  let dropped = false;
  document.querySelectorAll(".dropzone").forEach(dz=>{
    const rect = dz.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && dz.childElementCount === 0){
      const node = dragItem.cloneNode(true);
      node.classList.remove("draggable");
      dz.appendChild(node);
      dz.dataset.filled = dragItem.dataset.value;
      dz.classList.add("filled");
      dropped = true;
    }
  });

  if (dragClone && dragClone.parentElement) document.body.removeChild(dragClone);
  dragClone = null;
  dragItem = null;

  if (isTouch){
    document.removeEventListener("touchmove", moveDrag, { passive:false });
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }

  if (dropped){
    againBtn.style.display = "inline-block";
    checkBtn.style.display = Array.from(document.querySelectorAll(".dropzone")).every(d => !!d.dataset.filled) ? "inline-block" : "none";
  }
}

// global listeners to start our custom clone drag
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive:false });

function dropHandler(e){
  e.preventDefault();
  // native drop is supported but we primarily use our clone logic
}

/* ===== CHECK ANSWER ===== */
if (checkBtn) checkBtn.addEventListener("click", ()=>{
  const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;
  dzs.forEach(dz=>{
    const filled = dz.dataset.filled || "";
    let expected = "";
    if (dz.dataset.placeholder === "word1") expected = currentSentence.word1;
    else if (dz.dataset.placeholder === "word2") expected = currentSentence.word2;
    else if (dz.dataset.placeholder === "verb") expected = currentSentence.verb;
    const correct = (filled === expected);
    if (correct){
      correctCount++; levelCorrect[currentLevel]++; dz.classList.add("correct");
    } else {
      incorrectCount++; levelIncorrect[currentLevel]++; dz.classList.add("incorrect");
      allCorrect = false;
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("filled","correct");
    }
    if (filled) answersHistory.push({level:currentLevel,label:dz.dataset.placeholder,value:filled,correct});
  });

  feedbackDiv.innerHTML = "";
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  fb.alt = allCorrect ? "Correct" : "Wrong";
  feedbackDiv.appendChild(fb);

  saveProgress();

  setTimeout(()=>{
    feedbackDiv.innerHTML = "";
    if (allCorrect) nextRound();
    else againBtn.style.display = "inline-block";
  }, 900);
});

/* ===== AGAIN (in-level retry) ===== */
if (againBtn) againBtn.addEventListener("click", ()=>{
  feedbackDiv.innerHTML = "";
  document.querySelectorAll(".dropzone").forEach(dz=>{
    dz.innerHTML = "";
    dz.dataset.filled = "";
    dz.classList.remove("incorrect","filled","correct");
  });
  // restore draggables to their original containers
  document.querySelectorAll(".draggable").forEach(d=>{
    const container = document.getElementById(d.dataset.originalParent || "draggablesLeft");
    if (container && d.parentElement !== container) container.appendChild(d);
  });
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== NEXT ROUND & UI UPDATE ===== */
function nextRound(){
  roundInLevel++;
  if (roundInLevel >= QUESTIONS_PER_LEVEL){
    if (currentLevel < TOTAL_LEVELS){
      currentLevel++;
      roundInLevel = 0;
      buildQuestion();
      saveProgress();
    } else {
      endGame();
    }
  } else {
    buildQuestion();
    saveProgress();
  }
}
function updateScoreDisplay(){
  scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/${QUESTIONS_PER_LEVEL}`;
}

/* ===== GOOGLE FORM SUBMISSION ===== */
async function submitResults(){
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, selectedTopic || "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);
  for (let lvl=1; lvl<=TOTAL_LEVELS; lvl++){
    fd.append(FORM_FIELD_MAP[`level${lvl}`].correct, levelCorrect[lvl] || 0);
    fd.append(FORM_FIELD_MAP[`level${lvl}`].incorrect, levelIncorrect[lvl] || 0);
  }
  try {
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
  } catch(e){
    console.warn("Form submit likely blocked by no-cors (expected):", e);
  }
  clearProgress();
}

/* ===== END / FINISH ===== */
function endGame(){
  if (document.getElementById("finalTime")) document.getElementById("finalTime").textContent = getTimeElapsed() + "s";
  const total = correctCount + incorrectCount;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  if (document.getElementById("finalScore")) document.getElementById("finalScore").textContent = `${correctCount} / ${total}`;
  if (document.getElementById("finalPercent")) document.getElementById("finalPercent").textContent = `${percent}%`;
  if (endModal) { endModal.style.display = "flex"; endModal.style.zIndex = 5000; }
}

/* finish/again end modal handlers (images used as buttons) */
if (finishBtn) finishBtn.addEventListener("click", async ()=>{
  if (dragClone && dragClone.parentElement) { dragClone.parentElement.removeChild(dragClone); dragClone = null; }
  await submitResults();
  window.location.href = "../hub.html";
});
if (againBtnEnd) againBtnEnd.addEventListener("click", ()=>{
  if (endModal) endModal.style.display = "none";
  currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0;
  levelCorrect = {1:0,2:0,3:0,4:0,5:0};
  levelIncorrect = {1:0,2:0,3:0,4:0,5:0};
  setTimeElapsed(0);
  buildQuestion();
});

/* ===== RESTORE from saved object ===== */
function restoreProgress(saved){
  if (!saved) return;
  studentName = saved.studentName || studentName;
  studentClass = saved.studentClass || studentClass;
  currentLevel = Number(saved.currentLevel) || 1;
  roundInLevel = Number(saved.roundInLevel) || 0;
  correctCount = Number(saved.correctCount) || 0;
  incorrectCount = Number(saved.incorrectCount) || 0;
  answersHistory = saved.answersHistory || [];
  levelCorrect = saved.levelCorrect || {1:0,2:0,3:0,4:0,5:0};
  levelIncorrect = saved.levelIncorrect || {1:0,2:0,3:0,4:0,5:0};
  selectedTopic = saved.selectedTopic || selectedTopic;
  setTimeElapsed(Number(saved.timeElapsed) || 0);
  buildQuestion();
}

/* ===== RESUME MODAL (single clean layer) ===== */
function showResumeModal(saved){
  if (!resumeModal || !saved) return;

  // hide other modals
  [stopModal, endModal, topicModal].forEach(m => { if (m) m.style.display = "none"; });

  resumeMessage.textContent = `You have progress saved at Level ${saved.currentLevel}, Question ${saved.roundInLevel + 1}. Continue or start over?`;
  resumeModal.style.display = "flex";
  resumeModal.style.zIndex = 5000;

  // remove previous listeners cleanly by using a one-time handler
  const onContinue = () => {
    resumeModal.style.display = "none";
    restoreProgress(saved);
    startTime = Date.now();
    // tidy any stray clone
    if (dragClone && dragClone.parentElement) { dragClone.parentElement.removeChild(dragClone); dragClone = null; }
    // update displayed student info again (in case changed)
    studentNameSpan.textContent = studentName;
    studentClassSpan.textContent = studentClass;
  };
  const onAgain = () => {
    resumeModal.style.display = "none";
    clearProgress();
    currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0;
    levelCorrect = {1:0,2:0,3:0,4:0,5:0};
    levelIncorrect = {1:0,2:0,3:0,4:0,5:0};
    answersHistory = [];
    setTimeElapsed(0);
    buildQuestion();
  };

  // remove old listeners by replacing the elements with clones and re-querying
  const continueClone = resumeContinue.cloneNode(true);
  resumeContinue.parentNode.replaceChild(continueClone, resumeContinue);
  const againClone = resumeAgain.cloneNode(true);
  resumeAgain.parentNode.replaceChild(againClone, resumeAgain);

  // rebind
  continueClone.addEventListener("click", onContinue, { once: true });
  againClone.addEventListener("click", onAgain, { once: true });
}

/* ===== STOP MODAL HANDLERS ===== */
if (stopBtn){
  stopBtn.addEventListener("click", ()=>{
    if (resumeModal && resumeModal.style.display === "flex") return; // don't open stop if resume is showing
    [resumeModal, endModal, topicModal].forEach(m => { if (m) m.style.display = "none"; });
    const total = correctCount + incorrectCount;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    if (stopPercent) stopPercent.textContent = `Score so far: ${percent}%`;
    if (stopModal) { stopModal.style.display = "flex"; stopModal.style.zIndex = 5000; }
  });
}
if (stopContinue) stopContinue.addEventListener("click", ()=>{ if (stopModal) stopModal.style.display = "none"; });
if (stopAgain) stopAgain.addEventListener("click", ()=>{
  if (stopModal) stopModal.style.display = "none";
  currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0;
  levelCorrect = {1:0,2:0,3:0,4:0,5:0};
  levelIncorrect = {1:0,2:0,3:0,4:0,5:0};
  answersHistory = [];
  setTimeElapsed(0);
  buildQuestion();
});
if (stopFinish) stopFinish.addEventListener("click", async ()=>{
  if (stopModal) stopModal.style.display = "none";
  await submitResults();
  window.location.href = "../index.html";
});

/* ===== BUILD QUESTION (main) ===== */
function buildQuestion(){
  generateSentence();
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const isOdd = (roundInLevel % 2) === 1;

  // Show main sign image for word1 (fallback to text)
  const { word1, word2, verb } = currentSentence;
  const q1 = document.createElement("div");
  q1.className = "questionSign";
  const img1 = document.createElement("img");
  img1.src = signPathFor(word1);
  img1.alt = word1;
  img1.onerror = () => { img1.style.display = "none"; q1.textContent = word1; };
  q1.appendChild(img1);
  questionArea.appendChild(q1);

  // placeholder area for extra info (keeps layout stable)
  const qExtra = document.createElement("div");
  qExtra.className = "questionExtra";
  qExtra.textContent = ""; // leave empty - styling handles layout
  questionArea.appendChild(qExtra);

  buildDropZones(isOdd);
  buildDraggables(isOdd);
  updateScoreDisplay();
}

/* ===== INITIALISATION ===== */
window.addEventListener("load", ()=>{
  // ensure top-layer buttons visible
  [againBtn, finishBtn, againBtnEnd].forEach(b => { if (b){ b.style.zIndex = 6000; b.style.cursor = "pointer"; }});

  const saved = loadProgress();
  if (saved){
    showResumeModal(saved);
  } else if (selectedTopic){
    setTimeElapsed(0);
    startTime = Date.now();
    buildQuestion();
  } else {
    openTopicModal();
  }
});
