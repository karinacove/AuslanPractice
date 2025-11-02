/* ===== CONFIG / FORM MAPPING ===== */
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
  level5: { correct: "entry.116543611", incorrect: "entry.1475510168" },
  level6: { correct: "entry.2131150011", incorrect: "entry.767086245" },
  level7: { correct: "entry.1966278295", incorrect: "entry.844369956" },
  level8: { correct: "entry.1728216980", incorrect: "entry.1910455979" },
  level9: { correct: "entry.1244163508", incorrect: "entry.1798293024" },
  level10:{ correct: "entry.1386510395", incorrect: "entry.140484839" },
  level11:{ correct: "entry.1057376731", incorrect: "entry.1932856854" },
  level12:{ correct: "entry.1570476410", incorrect: "entry.1307112644" }
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

/* ===== STUDENT INFO (expected to be set earlier in index) ===== */
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;
}

/* ===== GAME STATE ===== */
const SAVE_KEY = "sentencesGameSave_v1";
let currentLevel = 1;        // 1..12
let roundInLevel = 0;        // 0..9 (10 questions per level)
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_LEVELS = 12;

let correctCount = 0;
let incorrectCount = 0;

let levelCorrect = {};       // per-level counters
let levelIncorrect = {};
for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }

let answersHistory = [];     // {level,round,correctKeys,incorrectKeys}

let startTime = null;
let savedTimeElapsed = 0;     // seconds accumulated before pause

let usedDraggables = new Set(); // permanently removed / used items
let usedCombos = new Set();     // combos answered correctly first-try (prevent as future questions)

/* ===== VOCAB ===== */
const VOCAB = {
  topics: {
    animals: ["dog","cat","mouse","rabbit","fish","bird"],
    food: ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"],
    emotions: ["angry","annoyed","ashamed","bored","confident","confused","danger","disappointed","excited","exhausted","focus","frustrated","happy","jealous","lonely","loved","nervous","pain","proud","relax","sad","scared","shock","shy","sick","silly","stressed","support","surprised","tease","thankful","tired","worried"]
  },
  colours: ["red","green","blue","orange","yellow","pink","purple","brown","black","white"],
  numbers: ["one","two","three","four","five","six","seven","eight","nine","ten"],
  zones: ["green","blue","yellow","red"],
  verbs: ["want","have","donthave"],
  helpers: { see: "assets/signs/helpers/see.png", feel: "assets/signs/helpers/feel.png" }
};

/* ===== Helpers ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function timeNowSeconds(){ return Math.round(Date.now()/1000); }
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = seconds || 0; startTime = Date.now(); }

/* sign path helper */
function signPathFor(word){
  if (!word) return "";
  if (VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (VOCAB.topics.food && VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (VOCAB.topics.emotions && VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if (VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (VOCAB.colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (VOCAB.zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if (VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if (Object.values(VOCAB.helpers).includes(word)) return word;
  return "";
}

function renderSentenceRows(signs) {
  // signs = array of image/video paths in order
  const row1 = document.getElementById("sentenceRow1");
  const row2 = document.getElementById("sentenceRow2");
  const row3 = document.getElementById("sentenceRow3");
  
  // clear old rows
  [row1, row2, row3].forEach(r => r.innerHTML = "");

  // distribute across rows based on count
  if (signs.length <= 3) {
    signs.forEach(src => appendSign(row1, src));
  } else if (signs.length <= 6) {
    signs.slice(0, 3).forEach(src => appendSign(row1, src));
    signs.slice(3).forEach(src => appendSign(row2, src));
  } else {
    signs.slice(0, 3).forEach(src => appendSign(row1, src));
    signs.slice(3, 6).forEach(src => appendSign(row2, src));
    signs.slice(6).forEach(src => appendSign(row3, src));
  }
}

function appendSign(container, src) {
  const isVideo = src.endsWith(".mp4");
  if (isVideo) {
    const vid = document.createElement("video");
    vid.src = src;
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = true;
    vid.className = "sign-video";
    container.appendChild(vid);
  } else {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Sign";
    img.className = "sign-img";
    container.appendChild(img);
  }
}

/* Descriptor */
function levelDescriptor(level){
  if (level >=1 && level <=3) return { type: "simple", topicIndex: level }; // 1 animals, 2 food, 3 emotions
  if (level >=4 && level <=6) return { type: "two", topicIndex: level-3 }; // 4 animals(opposite),5 food(opposite),6 emotions(opposite)
  if (level ===7) return { type: "compound", layout: "A" };
  if (level ===8) return { type: "compound", layout: "B" };
  if (level ===9) return { type: "compound", layout: "C" };
  if (level ===10) return { type: "compound", layout: "D" };
  if (level ===11) return { type: "bonus", layout: "E" };
  if (level ===12) return { type: "bonus", layout: "F" };
  return { type: "simple", topicIndex: 1 };
}

/* Build draggable filename */
function buildDraggableFilename(topic, a, b){
  if(topic==="animals"){ return `assets/images/animals/${a}-${b}.png`; }
  if(topic==="food"){ return `assets/images/food/${a}-${b}.png`; }
  if(topic==="emotions"){ return `assets/images/emotions/${a}-${b}.png`; }
  return "";
}
function draggableKey(topic,a,b){ return `${topic}::${a}::${b}`; }

/* Candidate pools */
const candidatePool = { animals: [], food: [], emotions: [] };
(function buildCandidatePools(){
  VOCAB.topics.animals.forEach(animal=>{
    VOCAB.numbers.forEach(num=>{
      const key = draggableKey("animals",animal,num);
      candidatePool.animals.push({ key, img: buildDraggableFilename("animals",animal,num), parts: { animal, number: num } });
    });
  });
  VOCAB.topics.food.forEach(food=>{
    VOCAB.colours.forEach(col=>{
      const key = draggableKey("food",food,col);
      candidatePool.food.push({ key, img: buildDraggableFilename("food",food,col), parts: { food, colour: col } });
    });
  });
  VOCAB.topics.emotions.forEach(em=>{
    VOCAB.zones.forEach(z=>{
      const key = draggableKey("emotions",em,z);
      candidatePool.emotions.push({ key, img: buildDraggableFilename("emotions",em,z), parts: { emotion: em, zone: z } });
    });
  });
})();

/* ===== Drag clone machinery (mouse + touch) - preserved with centering ===== */
let dragItem = null;
let dragClone = null;
let isTouch = false;

function startDrag(e){
  const tgt = e.target.closest(".draggable");
  if(!tgt) return;
  dragItem = tgt;
  isTouch = e.type.startsWith("touch");
  const rect = tgt.getBoundingClientRect();
  dragClone = tgt.cloneNode(true);
  Object.assign(dragClone.style, {
    position: "fixed",
    left: rect.left + "px",
    top: rect.top + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    opacity: "0.95",
    pointerEvents: "none",
    zIndex: 5000,
    transform: "translate(-50%,-50%)"
  });
  dragClone.classList.add("drag-clone");
  document.body.appendChild(dragClone);
  e.preventDefault();
  if(isTouch){
    document.addEventListener("touchmove", moveDrag, { passive:false });
    document.addEventListener("touchend", endDrag);
  } else {
    document.addEventListener("mousemove", moveDrag);
    document.addEventListener("mouseup", endDrag);
  }
}
function moveDrag(e){
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }
  dragClone.style.left = clientX + "px";
  dragClone.style.top = clientY + "px";
}
function endDrag(e){
  if(!dragItem || !dragClone) return;
  let clientX, clientY;
  if(isTouch && e.changedTouches && e.changedTouches.length>0){ clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }

  let dropped = false;
  const dzs = Array.from(document.querySelectorAll(".dropzone"));
  for(const dz of dzs){
    const rect = dz.getBoundingClientRect();
    if(clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom){
      if(dz.childElementCount === 0){
        const node = dragItem.cloneNode(true);
        node.classList.remove("draggable");
        node.classList.add("dropped");
        // center the dropped image for better visuals
        node.style.display = "block";
        node.style.margin = "auto";
        dz.appendChild(node);
        // store filled key AFTER we append (so restore can find it)
        dz.dataset.filled = dragItem.dataset.key;
        dz.dataset.src = dragItem.dataset.img || "";
        dz.classList.add("filled");
        dropped = true;
      }
    }
  }

  if(dragClone && dragClone.parentElement) dragClone.parentElement.removeChild(dragClone);
  dragClone = null;
  dragItem = null;
  if(isTouch){
    document.removeEventListener("touchmove", moveDrag, { passive:false });
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }

  if(dropped) updateCheckVisibility();
}

// global pointer start
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive:false });

function dropHandler(e){ e.preventDefault(); }

/* ===== UI helpers ===== */
function updateScoreDisplay(){
  scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/${QUESTIONS_PER_LEVEL}`;
}

/* ===== Double-tap / double-click removal on dropzones ===== */
let lastTap = 0;
answerArea.addEventListener("click", (ev) => {
  const dz = ev.target.closest(".dropzone");
  if(!dz) return;
  const now = Date.now();
  if (now - lastTap < 350){ // double tap detected
    if(dz.dataset.filled){
      const filledKey = dz.dataset.filled; // capture BEFORE clearing
      // remove node and metadata
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.dataset.src = "";
      dz.classList.remove("filled","incorrect","correct");
      // restore draggable to its side container if not permanently removed
      restoreDraggableByKeyToSide(filledKey);
      updateCheckVisibility();
    }
  }
  lastTap = now;
});

/* restore draggable */
function restoreDraggableByKeyToSide(key){
  if(!key) return;
  if(document.querySelector(`.draggable[data-key="${key}"]`)) return;
  if(usedDraggables.has(key)) return;
  const parts = key.split("::");
  if(parts.length !== 3) return;
  const topic = parts[0], a = parts[1], b = parts[2];
  const container = (leftDraggables.childElementCount <= rightDraggables.childElementCount) ? leftDraggables : rightDraggables;
  const div = createDraggableNodeFromParts(topic, a, b);
  if(container) container.appendChild(div);
}

/* create draggable from parts */
function createDraggableNodeFromParts(topic,a,b){
  const key = draggableKey(topic,a,b);
  const imgSrc = buildDraggableFilename(topic,a,b);
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = key;
  div.dataset.img = imgSrc;
  div.style.userSelect = "none";
  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = `${a}-${b}`;
  img.onerror = function(){ img.style.display = "none"; if(!div.querySelector(".fallback")){ const f = document.createElement("div"); f.className="fallback"; f.textContent = `${a}-${b}`; div.appendChild(f); } };
  div.appendChild(img);
  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", key);}catch{} });
  return div;
}

/* populate draggables (left + right arrays provided) */
function populateDraggables(leftCandidates, rightCandidates, leftCount=6, rightCount=6){
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";

  const leftSelection = leftCandidates.slice(0,leftCount);
  const rightSelection = rightCandidates.slice(0,rightCount);

  leftSelection.forEach(c => {
    if(usedDraggables.has(c.key)) return;
    const div = document.createElement("div");
    div.className = "draggable";
    div.draggable = true;
    div.dataset.key = c.key;
    div.dataset.img = c.img;
    if(c.overlay) div.dataset.overlay = c.overlay; // for have/donthave
    const img = document.createElement("img");
    img.src = c.img;
    img.alt = c.key;
    img.onerror = () => { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f = document.createElement("div"); f.className="fallback"; f.textContent = (c.parts.animal||c.parts.food||c.parts.emotion) + (c.parts.number?`-${c.parts.number}`:""); div.appendChild(f);} };
    div.appendChild(img);
    if(c.overlay){ // create overlay marker (tick or X) as text (no image provided)
      const ov = document.createElement("div");
      ov.className = "overlay " + c.overlay;
      ov.textContent = (c.overlay === "have") ? "✓" : "✕"; // simple symbol overlay
      div.appendChild(ov);
    }
    div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", c.key);}catch{} });
    leftDraggables.appendChild(div);
  });

  rightSelection.forEach(c => {
    if(usedDraggables.has(c.key)) return;
    const div = document.createElement("div");
    div.className = "draggable";
    div.draggable = true;
    div.dataset.key = c.key;
    div.dataset.img = c.img;
    if(c.overlay) div.dataset.overlay = c.overlay;
    const img = document.createElement("img");
    img.src = c.img;
    img.alt = c.key;
    img.onerror = () => { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f = document.createElement("div"); f.className="fallback"; f.textContent = (c.parts.food||c.parts.colour||c.parts.zone) + (c.parts.colour?`-${c.parts.colour}`:""); div.appendChild(f);} };
    div.appendChild(img);
    if(c.overlay){
      const ov = document.createElement("div");
      ov.className = "overlay " + c.overlay;
      ov.textContent = (c.overlay === "have") ? "✓" : "✕";
      div.appendChild(ov);
    }
    div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", c.key);}catch{} });
    rightDraggables.appendChild(div);
  });

  document.querySelectorAll(".draggable").forEach(d=> d.style.cursor = "grab");
}

/* updateCheckVisibility */
function updateCheckVisibility(){
  checkBtn.style.display = "none";
  const desc = levelDescriptor(currentLevel);
  const required = Array.from(answerArea.querySelectorAll(".dropzone"));
  if(required.length === 0) return;
  const allFilled = required.every(d=>d.dataset.filled && d.dataset.filled.length>0);
  if(allFilled) checkBtn.style.display = "inline-block";
}

function handleDrop(e) {
  e.preventDefault();
  updateCheckVisibility();
}

/* ===== Build the question UI and draggables for the current level and round ===== */
function buildQuestion(){
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  updateScoreDisplay();

  const desc = levelDescriptor(currentLevel);

  // helper: pick unused candidate (combo) from pool preferring not usedCombos
  function pickUnusedCombo(poolArr){
    // poolArr is candidatePool.animals/food/emotions
    const shuffled = shuffleArray(poolArr).filter(c => !usedDraggables.has(c.key));
    for(const c of shuffled){
      if(!usedCombos.has(c.key)) return c;
    }
    return shuffled[0] || null;
  }

  if(desc.type === "simple"){
    const topicIndex = desc.topicIndex; // 1 animals, 2 food, 3 emotions
    const topicName = topicIndex === 1 ? "animals" : (topicIndex===2 ? "food" : "emotions");
    // pick a correct candidate that hasn't been used as a correct combo before (usedCombos)
    let correctCandidate = null;
    if(topicName === "animals") correctCandidate = pickUnusedCombo(candidatePool.animals);
    if(topicName === "food") correctCandidate = pickUnusedCombo(candidatePool.food);
    if(topicName === "emotions") correctCandidate = pickUnusedCombo(candidatePool.emotions);
    // fallback
    if(!correctCandidate){
      const pool = (topicName==="animals") ? candidatePool.animals : (topicName==="food") ? candidatePool.food : candidatePool.emotions;
      correctCandidate = shuffleArray(pool).find(c => !usedDraggables.has(c.key)) || pool[0];
    }
    const parts = correctCandidate ? correctCandidate.key.split("::") : [topicName,"",""];
    let word1 = parts[1] || (topicName==="animals"? randomItem(VOCAB.topics.animals) : topicName==="food"? randomItem(VOCAB.topics.food) : randomItem(VOCAB.topics.emotions));
    let word2 = parts[2] || (topicName==="animals"? randomItem(VOCAB.numbers) : topicName==="food"? randomItem(VOCAB.colours) : randomItem(VOCAB.zones));
    // display helper (see/feel) + signs
    const helperType = (topicName === "emotions") ? VOCAB.helpers.feel : VOCAB.helpers.see;
    const helperImg = document.createElement("img"); helperImg.src = helperType; helperImg.alt = "helper"; helperImg.style.maxWidth="120px";
    const qdiv = document.createElement("div"); qdiv.className="questionRow";
    qdiv.appendChild(helperImg);
    // sign1
    const sign1 = document.createElement(VOCAB.topics.emotions.includes(word1) ? "video" : "img");
    if(sign1.tagName==="VIDEO"){ sign1.src = signPathFor(word1); sign1.autoplay=true; sign1.loop=true; sign1.muted=true; }
    else sign1.src = signPathFor(word1);
    sign1.alt = word1; qdiv.appendChild(sign1);
    // sign2
    const sign2 = document.createElement(VOCAB.topics.emotions.includes(word2) ? "video" : "img");
    if(sign2.tagName==="VIDEO"){ sign2.src = signPathFor(word2); sign2.autoplay=true; sign2.loop=true; sign2.muted=true; }
    else sign2.src = signPathFor(word2);
    sign2.alt = word2; qdiv.appendChild(sign2);
    questionArea.appendChild(qdiv);

// Single dropzone with faint clue
const dz = document.createElement("div");
dz.className = "dropzone";
dz.dataset.placeholder = `${word1}+${word2}`;

// NEW: topic-based hint only
let hintLabel = "";
if (topicName === "animals") hintLabel = "animal + number";
else if (topicName === "food") hintLabel = "food + colour";
else if (topicName === "emotions") hintLabel = "emotion + zone";
dz.innerHTML = `<div class="placeholder faint">${hintLabel}</div>`;

// handlers
dz.addEventListener("dragover", e => e.preventDefault());
dz.addEventListener("drop", handleDrop);

answerArea.appendChild(dz);
dz.dataset.expected = correctCandidate.key;

    // pick decoys from same pool (avoid usedDraggables and same key)
    let pool = (topicName==="animals") ? shuffleArray(candidatePool.animals)
               : (topicName==="food") ? shuffleArray(candidatePool.food)
               : shuffleArray(candidatePool.emotions);
    pool = pool.filter(c => c.key !== (correctCandidate.key) && !usedDraggables.has(c.key));
    const decoys = pool.slice(0,11);
    const allItems = shuffleArray([ ...decoys, correctCandidate ]);
    const leftItems = allItems.slice(0,6);
    const rightItems = allItems.slice(6,12);
    populateDraggables(leftItems, rightItems, 6, 6);

    // expected key for checking
    dz.dataset.expected = correctCandidate.key;

  } else if(desc.type === "two"){
    const topicIndex = desc.topicIndex;
    const topicName = topicIndex === 1 ? "animals" : (topicIndex===2 ? "food" : "emotions");
    // pick a word1, word2 (avoid combos previously marked usedCombos if possible)
    let chosen = null;
    const pool = (topicName==="animals") ? candidatePool.animals : (topicName==="food") ? candidatePool.food : candidatePool.emotions;
    for(const c of shuffleArray(pool)){
      if(!usedCombos.has(c.key) && !usedDraggables.has(c.key)){ chosen = c; break; }
    }
    if(!chosen) chosen = shuffleArray(pool).find(c=>!usedDraggables.has(c.key)) || pool[0];
    const parts = chosen.key.split("::");
    const word1 = parts[1], word2 = parts[2];
    const helperType = (topicName === "emotions") ? VOCAB.helpers.feel : VOCAB.helpers.see;
    const helperImg = document.createElement("img"); helperImg.src = helperType; helperImg.alt = "helper";
    helperImg.onerror = () => { helperImg.style.display = "none"; };
    const qdiv = document.createElement("div"); qdiv.className="questionRow";
    qdiv.appendChild(helperImg);
    const s1 = document.createElement(VOCAB.topics.emotions.includes(word1) ? "video" : "img"); if(s1.tagName==="VIDEO"){ s1.src = signPathFor(word1); s1.autoplay=true; s1.loop=true; s1.muted=true; } else s1.src = signPathFor(word1); s1.alt = word1; qdiv.appendChild(s1);
    const s2 = document.createElement(VOCAB.topics.emotions.includes(word2) ? "video" : "img"); if(s2.tagName==="VIDEO"){ s2.src = signPathFor(word2); s2.autoplay=true; s2.loop=true; s2.muted=true; } else s2.src = signPathFor(word2); s2.alt = word2; qdiv.appendChild(s2);
    questionArea.appendChild(qdiv);

    // Two dropzones
    const dz1 = document.createElement("div"); dz1.className="dropzone"; dz1.dataset.placeholder = "topic";
    dz1.addEventListener("dragover", e=>e.preventDefault()); dz1.addEventListener("drop", dropHandler);
    const dz2 = document.createElement("div"); dz2.className="dropzone"; dz2.dataset.placeholder = "extra";
    dz2.addEventListener("dragover", e=>e.preventDefault()); dz2.addEventListener("drop", dropHandler);
    answerArea.appendChild(dz1); answerArea.appendChild(dz2);

    // set expected values for checking
    dz1.dataset.expectedType = topicName; dz1.dataset.expectedValue = word1;
    dz2.dataset.expectedType = (topicName==="animals"?"numbers":(topicName==="food"?"colours":"zones"));
    dz2.dataset.expectedValue = word2;

    // build left candidates (full combos) and right candidates (extras)
    const leftPool = shuffleArray(pool).filter(c => !usedDraggables.has(c.key)).slice(0,9);
    const rightSel = [];
    if(topicName==="animals"){
      shuffleArray(VOCAB.numbers).slice(0,6).forEach(n => rightSel.push({ key: `numbers::${n}`, img: `assets/images/numbers/${n}.png`, parts:{number:n} }));
    } else if(topicName==="food"){
      shuffleArray(VOCAB.colours).slice(0,6).forEach(c => rightSel.push({ key: `colours::${c}`, img: `assets/images/colours/${c}.png`, parts:{colour:c} }));
    } else {
      shuffleArray(VOCAB.zones).slice(0,6).forEach(z => rightSel.push({ key: `zones::${z}`, img: `assets/images/zones/${z}.png`, parts:{zone:z} }));
    }
    populateDraggables(leftPool.slice(0,6), rightSel, Math.min(6,leftPool.length), rightSel.length);

    dz1.dataset.expectedExact = word1;
    dz2.dataset.expectedExact = word2;

  } else if(desc.type === "compound" || desc.type === "bonus"){
    // For compound/bonus layouts we will pick all required parts and also pick a verb where needed
    questionArea.innerHTML = "";
    const helperImg = document.createElement("img"); helperImg.src = VOCAB.helpers.see; helperImg.alt = "see";
    helperImg.onerror = () => { helperImg.style.display = "none"; };
    const qtop = document.createElement("div"); qtop.className = "questionRow";
    qtop.appendChild(helperImg);
    questionArea.appendChild(qtop);

    const dzs = [];

    if(desc.layout === "A"){
      // Level 7: top sentence then below: dropzone1 = animal+number, dropzone2 = food+colour
      // Also choose a verb for the sentence (have/donthave) and display its sign between sentence rows
      const verb = randomItem(["have","donthave"]);
      // display verb sign under the top row
      const verbSign = document.createElement("img"); verbSign.src = signPathFor(verb); verbSign.alt = verb; verbSign.className="inlineVerb";
      qtop.appendChild(verbSign);

      const dz1 = document.createElement("div"); dz1.className="dropzone"; dz1.dataset.placeholder="animal+number";
      const dz2 = document.createElement("div"); dz2.className="dropzone"; dz2.dataset.placeholder="food+colour";
      [dz1,dz2].forEach(d=>{ d.addEventListener("dragover",e=>e.preventDefault()); d.addEventListener("drop", dropHandler); answerArea.appendChild(d); dzs.push(d); });

      // Pick expected combos: animal+number and food+colour
      const leftCandidates = shuffleArray(candidatePool.animals).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      const rightCandidates = shuffleArray(candidatePool.food).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      // overlay random have/donthave on right candidates
      rightCandidates.forEach(c => { c.overlay = Math.random()>0.5 ? "have" : "donthave"; });

      populateDraggables(leftCandidates, rightCandidates, leftCandidates.length, rightCandidates.length);

      dz1.dataset.expectedType = "animals_combo"; dz2.dataset.expectedType = "food_combo";
      dz1.dataset.expectedVerb = verb; dz2.dataset.expectedVerb = verb; // so check can enforce overlay for food when verb is present

    } else if(desc.layout === "B"){
      // Level 8: 5 dropzones animal, number, verb, food, colour
      const keys = ["animal","number","verb","food","colour"];
      keys.forEach(k => {
        const dz = document.createElement("div"); dz.className="dropzone"; dz.dataset.placeholder = k;
        dz.addEventListener("dragover", e=>e.preventDefault()); dz.addEventListener("drop", dropHandler);
        answerArea.appendChild(dz); dzs.push(dz);
      });
      const leftCandidates = shuffleArray(candidatePool.animals).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      const rightCandidates = shuffleArray(candidatePool.food).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      populateDraggables(leftCandidates, rightCandidates, leftCandidates.length, rightCandidates.length);
      // append two verb drag elements to bottom (have / donthave)
      const verbs = [{key:"verb::have", img: signPathFor("have"), parts:{verb:"have"}},{key:"verb::donthave", img: signPathFor("donthave"), parts:{verb:"donthave"}}];
      verbs.forEach(v=>{
        const div = document.createElement("div"); div.className="draggable"; div.draggable=true; div.dataset.key=v.key; div.dataset.img=v.img;
        const img = document.createElement("img"); img.src=v.img; img.alt=v.key; div.appendChild(img); rightDraggables.appendChild(div);
      });
    } else if(desc.layout === "C"){
      // Level 9: dropzones animal, number, emotion+zone
      const dz1 = document.createElement("div"); dz1.className="dropzone"; dz1.dataset.placeholder="animal";
      const dz2 = document.createElement("div"); dz2.className="dropzone"; dz2.dataset.placeholder="number";
      const dz3 = document.createElement("div"); dz3.className="dropzone"; dz3.dataset.placeholder="emotion+zone";
      [dz1,dz2,dz3].forEach(d=>{ d.addEventListener("dragover",e=>e.preventDefault()); d.addEventListener("drop", dropHandler); answerArea.appendChild(d); dzs.push(d); });
      const leftCandidates = shuffleArray(candidatePool.animals).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      const rightCandidates = shuffleArray(candidatePool.emotions).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      populateDraggables(leftCandidates, rightCandidates, leftCandidates.length, rightCandidates.length);
    } else if(desc.layout === "D"){
      // Level 10: two dropzones animal+number and emotion+zone (right candidates with overlays sometimes)
      const dz1 = document.createElement("div"); dz1.className="dropzone"; dz1.dataset.placeholder="animal+number";
      const dz2 = document.createElement("div"); dz2.className="dropzone"; dz2.dataset.placeholder="emotion+zone";
      [dz1,dz2].forEach(d=>{ d.addEventListener("dragover",e=>e.preventDefault()); d.addEventListener("drop", dropHandler); answerArea.appendChild(d); dzs.push(d); });
      const leftCandidates = shuffleArray(candidatePool.animals).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      const rightCandidates = shuffleArray(candidatePool.emotions).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      rightCandidates.forEach((c,idx)=>{ if(Math.random()>0.5) c.overlay="have"; else c.overlay="donthave"; });
      populateDraggables(leftCandidates, rightCandidates, leftCandidates.length, rightCandidates.length);
    } else if(desc.layout === "E" || desc.layout === "F"){
      // Bonus layouts
      const placeholders = desc.layout === "E" ? ["animal","number","emotion","zone","verb","food","colour"] : ["animal","number","emotion","zone","food+colour"];
      placeholders.forEach(ph => {
        const dz = document.createElement("div"); dz.className="dropzone"; dz.dataset.placeholder = ph;
        dz.addEventListener("dragover",e=>e.preventDefault()); dz.addEventListener("drop", dropHandler);
        answerArea.appendChild(dz);
      });
      const leftCandidates = shuffleArray(candidatePool.animals).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      const rightCandidates = shuffleArray(candidatePool.food).filter(c=>!usedDraggables.has(c.key)).slice(0,9);
      populateDraggables(leftCandidates, rightCandidates, leftCandidates.length, rightCandidates.length);
    }
    // done compound/bonus build
  }

  updateCheckVisibility();
} // end buildQuestion

/* ===== Check button logic (full handling for simple, two, compound, bonus) ===== */
checkBtn.addEventListener("click", () => {
  checkBtn.style.display = "none";

  const desc = levelDescriptor(currentLevel);
  const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;
  const currentRoundCorrect = [];
  const currentRoundIncorrect = [];

  function checkDropzone(dz){
    const filledKey = dz.dataset.filled || "";
    if(!filledKey){ allCorrect = false; return; }

    // simple exact expected key
    if(dz.dataset.expected){
      if(filledKey === dz.dataset.expected){
        dz.classList.add("correct"); currentRoundCorrect.push(filledKey);
      } else {
        dz.classList.add("incorrect"); currentRoundIncorrect.push(filledKey); allCorrect = false;
      }
      return;
    }

    // expectedExact: check if the filledKey includes expected token (e.g., word present)
    if(dz.dataset.expectedExact){
      const expected = dz.dataset.expectedExact;
      if(filledKey.includes(expected)){ dz.classList.add("correct"); currentRoundCorrect.push(filledKey); }
      else { dz.classList.add("incorrect"); currentRoundIncorrect.push(filledKey); allCorrect = false; }
      return;
    }

    // expectedType handling (animals_combo, food_combo or generic)
    if(dz.dataset.expectedType){
      const et = dz.dataset.expectedType;
      const expectedValue = dz.dataset.expectedValue;
      if(et === "animals_combo"){
        if(filledKey.startsWith("animals::")){ dz.classList.add("correct"); currentRoundCorrect.push(filledKey); }
        else { dz.classList.add("incorrect"); currentRoundIncorrect.push(filledKey); allCorrect = false; }
      } else if(et === "food_combo"){
        // if verb expected overlay exists, verify overlay matches expected verb
        if(filledKey.startsWith("food::")){
          // if dz expects a verb overlay (many compound levels pass dataset.expectedVerb)
          const expectedVerb = dz.dataset.expectedVerb || null;
          const placedOverlay = (() => {
            // the draggable in DOM may be removed, but we can lookup dataset.overlay on the draggable in the side (if still present)
            const dom = document.querySelector(`.draggable[data-key="${filledKey}"]`);
            if(dom && dom.dataset && dom.dataset.overlay) return dom.dataset.overlay;
            // fallback: maybe the dropped element was the clone; check the node inside the dropzone
            const node = Array.from(dz.querySelectorAll("[data-overlay]"))[0];
            if(node && node.dataset && node.dataset.overlay) return node.dataset.overlay;
            // fallback check dataset on the dropzone if saved
            return dz.dataset.overlay || null;
          })();
          if(expectedVerb){
            if(placedOverlay === expectedVerb){ dz.classList.add("correct"); currentRoundCorrect.push(filledKey); }
            else { dz.classList.add("incorrect"); currentRoundIncorrect.push(filledKey); allCorrect = false; }
          } else {
            dz.classList.add("correct"); currentRoundCorrect.push(filledKey);
          }
        } else { dz.classList.add("incorrect"); currentRoundIncorrect.push(filledKey); allCorrect = false; }
      } else {
        // generic expectedType: check expectedValue contained
        if(expectedValue && filledKey.includes(expectedValue)){ dz.classList.add("correct"); currentRoundCorrect.push(filledKey); }
        else { dz.classList.add("incorrect"); currentRoundIncorrect.push(filledKey); allCorrect = false; }
      }
      return;
    }

    // if no expectation metadata, accept anything
    dz.classList.add("correct"); currentRoundCorrect.push(filledKey);
  }

  dzs.forEach(checkDropzone);

  // Update counts & mark used items
  if(allCorrect){
    levelCorrect[currentLevel] = (levelCorrect[currentLevel] || 0) + dzs.length;
    correctCount += dzs.length;
    dzs.forEach(dz => { if(dz.dataset.filled) usedDraggables.add(dz.dataset.filled); });
    // If this round had ZERO incorrect items and is first try, mark combos so they won't be asked again
    // (we assume combos are keys like animals::dog::two)
    currentRoundCorrect.forEach(k=> {
      if(k && !usedCombos.has(k)) usedCombos.add(k);
    });
  } else {
    // for incorrect keys remove their draggable dom and mark used permanently
    currentRoundIncorrect.forEach(k => {
      levelIncorrect[currentLevel] = (levelIncorrect[currentLevel] || 0) + 1;
      incorrectCount++;
      const dom = document.querySelector(`.draggable[data-key="${k}"]`);
      if(dom && dom.parentElement) dom.parentElement.removeChild(dom);
      usedDraggables.add(k);
      // clear any dropzone that had that filledKey
      const dz = dzs.find(d=> d.dataset.filled === k);
      if(dz){ dz.innerHTML = ""; dz.dataset.filled = ""; dz.classList.remove("filled"); }
    });
    // mark correct ones as used too so they don't reappear
    currentRoundCorrect.forEach(k => { if(k) usedDraggables.add(k); });
  }

  // feedback image
  feedbackDiv.innerHTML = "";
  const fbImg = document.createElement("img");
  fbImg.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  fbImg.alt = allCorrect ? "Correct" : "Wrong";
  feedbackDiv.appendChild(fbImg);

  // push to answers history
  answersHistory.push({ level: currentLevel, round: roundInLevel, correct: currentRoundCorrect.slice(), incorrect: currentRoundIncorrect.slice() });

  saveProgress();

  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if(allCorrect){
      if(roundInLevel + 1 >= QUESTIONS_PER_LEVEL){
        showClapThenAdvance(() => {
          if(currentLevel < TOTAL_LEVELS){
            currentLevel++;
            roundInLevel = 0;
            buildQuestion();
          } else {
            finalSubmitThenEnd();
          }
        });
      } else {
        roundInLevel++;
        buildQuestion();
      }
    } else {
      // allow user another attempt on same question (again button shows)
      againBtn.style.display = "inline-block";
      // also re-check check visibility (in case dropzones are empty)
      updateCheckVisibility();
    }
  }, 2000);
});

/* ===== 'Again' button in-level: allows retry (rebuild same question state but keep removed items removed) ===== */
againBtn.addEventListener("click", () => {
  feedbackDiv.innerHTML = "";
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz => dz.classList.remove("incorrect"));
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== Clap and advance ===== */
function showClapThenAdvance(cb){
  const gif = document.createElement("img");
  gif.src = "assets/auslan-clap.gif";
  gif.alt = "Clap";
  feedbackDiv.innerHTML = "";
  feedbackDiv.appendChild(gif);
  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if(typeof cb === "function") cb();
  }, 2000);
}

/* ===== Google Form submission (silent) ===== */
let formSubmittedFlag = localStorage.getItem("sentencesGame_submitted") === "1";

async function submitToGoogleForm(silent=true){
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;

  if(totalCorrect < 1) return false; // per spec don't submit if none correct

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);

  for(let lvl=1; lvl<=TOTAL_LEVELS; lvl++){
    fd.append(FORM_FIELD_MAP[`level${lvl}`].correct, levelCorrect[lvl] || 0);
    fd.append(FORM_FIELD_MAP[`level${lvl}`].incorrect, levelIncorrect[lvl] || 0);
  }

  try{
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
    formSubmittedFlag = true;
    localStorage.setItem("sentencesGame_submitted", "1");
    return true;
  }catch(e){
    console.warn("Form submission failed:", e);
    return false;
  }
}

/* ===== Final submission and end modal ===== */
async function finalSubmitThenEnd(){
  await submitToGoogleForm(true);
  clearProgress();
  if(document.getElementById("finalTime")) document.getElementById("finalTime").textContent = getTimeElapsed() + "s";
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if(document.getElementById("finalScore")) document.getElementById("finalScore").textContent = `${totalCorrect} / ${totalAttempts}`;
  if(document.getElementById("finalPercent")) document.getElementById("finalPercent").textContent = `${percent}%`;

  const endGif = document.getElementById("endGif");
  if(endGif){ endGif.src = "assets/auslan-clap.gif"; endGif.style.display = "block"; }
  if(endModal){ endModal.style.display = "flex"; endModal.style.zIndex = 5000; }
}

/* Finish & Again (end modal) wiring */
if (finishBtn) finishBtn.addEventListener("click", async () => {
  window.location.href = "../index.html";
});
if (againBtnEnd) againBtnEnd.addEventListener("click", () => {
  if(endModal) endModal.style.display = "none";
  currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0;
  for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
  answersHistory = [];
  usedDraggables.clear(); usedCombos.clear();
  setTimeElapsed(0);
  buildQuestion();
});

/* ===== STOP modal wiring ===== */
if(stopBtn){
  stopBtn.addEventListener("click", () => {
    if(resumeModal && resumeModal.style.display === "flex") return;
    savedTimeElapsed = getTimeElapsed();
    startTime = null;
    const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
    const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
    const totalAttempts = totalCorrect + totalIncorrect;
    const percent = totalAttempts>0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
    if(stopPercent) stopPercent.textContent = `Score so far: ${percent}% — Time: ${getTimeElapsed()}s`;
    if(stopModal) { stopModal.style.display = "flex"; stopModal.style.zIndex = 5000; }
  });
}
if(stopContinue) stopContinue.addEventListener("click", () => {
  if(stopModal) stopModal.style.display = "none";
  setTimeElapsed(savedTimeElapsed);
});
if(stopAgain) stopAgain.addEventListener("click", async () => {
  if(stopModal) stopModal.style.display = "none";
  await submitToGoogleForm(true);
  usedDraggables.clear(); usedCombos.clear();
  for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
  correctCount = 0; incorrectCount = 0; answersHistory = [];
  currentLevel = 1; roundInLevel = 0;
  setTimeElapsed(0);
  buildQuestion();
});
if(stopFinish) stopFinish.addEventListener("click", async () => {
  if(stopModal) stopModal.style.display = "none";
  await submitToGoogleForm(true);
  window.location.href = "../index.html";
});

/* ===== Save / Load / Clear progress (localStorage) ===== */
function saveProgress(){
  const payload = {
    studentName, studentClass,
    currentLevel, roundInLevel,
    correctCount, incorrectCount,
    levelCorrect, levelIncorrect,
    answersHistory,
    savedTimeElapsed: getTimeElapsed(),
    usedDraggables: Array.from(usedDraggables),
    usedCombos: Array.from(usedCombos)
  };
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }catch(e){ console.warn("save failed",e); }
}
function loadProgress(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function clearProgress(){
  try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem("sentencesGame_submitted"); }catch(e){}
}

/* ===== Restore saved payload to state ===== */
function restoreProgress(saved){
  if(!saved) return;
  studentName = saved.studentName || studentName;
  studentClass = saved.studentClass || studentClass;
  currentLevel = Number(saved.currentLevel) || 1;
  roundInLevel = Number(saved.roundInLevel) || 0;
  correctCount = Number(saved.correctCount) || 0;
  incorrectCount = Number(saved.incorrectCount) || 0;
  levelCorrect = saved.levelCorrect || levelCorrect;
  levelIncorrect = saved.levelIncorrect || levelIncorrect;
  answersHistory = saved.answersHistory || [];
  savedTimeElapsed = Number(saved.savedTimeElapsed) || 0;
  usedDraggables = new Set((saved.usedDraggables) ? saved.usedDraggables : []);
  usedCombos = new Set((saved.usedCombos) ? saved.usedCombos : []);
  setTimeElapsed(saved.savedTimeElapsed || 0);
  buildQuestion();
}

/* ===== Resume modal logic (show and attach handlers) ===== */
function showResumeModal(saved){
  if(!resumeModal || !saved) return;
  if(stopModal) stopModal.style.display = "none";
  if(endModal) endModal.style.display = "none";
  if(topicModal) topicModal.style.display = "none";
  resumeMessage.textContent = `You have progress saved at Level ${saved.currentLevel}, Question ${Number(saved.roundInLevel)+1}. Continue or start over?`;
  resumeModal.style.display = "flex";
  resumeModal.style.zIndex = 5000;

  resumeContinue.parentNode.replaceChild(resumeContinue.cloneNode(true), resumeContinue);
  resumeAgain.parentNode.replaceChild(resumeAgain.cloneNode(true), resumeAgain);

  const newCont = document.getElementById("resumeContinue");
  const newAgain = document.getElementById("resumeAgain");

  newCont.addEventListener("click", () => {
    resumeModal.style.display = "none";
    restoreProgress(saved);
    startTime = Date.now();
  }, { once: true });

  newAgain.addEventListener("click", async () => {
    resumeModal.style.display = "none";
    const totalCorrect = Object.values(saved.levelCorrect || {}).reduce((a,b)=>a+b,0);
    if(totalCorrect > 0 && !formSubmittedFlag){
      await submitToGoogleForm(true);
    }
    clearProgress();
    usedDraggables.clear(); usedCombos.clear();
    for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
    correctCount = 0; incorrectCount = 0; answersHistory = [];
    currentLevel = 1; roundInLevel = 0;
    setTimeElapsed(0);
    buildQuestion();
  }, { once: true });
}

/* ===== INITIALISATION on window load ===== */
window.addEventListener("load", () => {
  [againBtn, finishBtn, againBtnEnd].forEach(b => { if(b){ b.style.zIndex = 6001; b.style.cursor = "pointer"; }});
  const saved = loadProgress();
  if(saved){
    showResumeModal(saved);
  } else {
    setTimeElapsed(0);
    startTime = Date.now();
    buildQuestion();
  }
});
