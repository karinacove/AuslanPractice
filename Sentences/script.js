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

/* ===== DOM ELEMENTS ===== */
const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");
const leftDraggables = document.getElementById("draggablesLeft");
const rightDraggables = document.getElementById("draggablesRight");
const bottomVerbs = document.getElementById("verbDraggables");
const questionArea = document.getElementById("questionArea");
const sentenceRow1 = document.getElementById("sentenceRow1");
const sentenceRow2 = document.getElementById("sentenceRow2");
const sentenceRow3 = document.getElementById("sentenceRow3");
const answerArea = document.getElementById("answerArea");
const feedbackDiv = document.getElementById("feedback");
const scoreDisplay = document.getElementById("scoreDisplay");
const checkBtn = document.getElementById("checkBtn");
const againBtn = document.getElementById("againBtn");
const finishBtn = document.getElementById("finishBtn");
const endModal = document.getElementById("endModal");
const googleForm = document.getElementById("googleForm");

/* ===== GAME STATE ===== */
const SAVE_KEY = "sentencesGameSave_v2";
let currentLevel = 1;
let roundInLevel = 0;
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_LEVELS = 12;

let correctCount = 0;
let incorrectCount = 0;

let levelCorrect = {};
let levelIncorrect = {};
for (let i = 1; i <= TOTAL_LEVELS; i++) { levelCorrect[i] = 0; levelIncorrect[i] = 0; }

let answersHistory = [];
let startTime = null;
let savedTimeElapsed = 0;

let usedDraggables = new Set();
let usedCombos = new Set();

let formSubmittedFlag = localStorage.getItem("sentencesGame_submitted") === "1";

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
  verbs: ["want","have","donthave","feel"],
  helpers: { i: "i.png", see: "see.png", feel: "feel.png", what: "what.png", why: "why.png" }
};

/* ===== Helpers ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function timeNowSeconds(){ return Math.round(Date.now()/1000); }
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = seconds || 0; startTime = Date.now(); }

/* ===== Level config (kept consistent with your intentions) =====
   simple: levels 1-3 (signs), 4-6 (images)
   compound/bonus mapping follows earlier spec
*/
const levels = {
  1: { lineCount:1, qItems:["animals"], type: "sign" },
  2: { lineCount:1, qItems:["food"], type: "sign" },
  3: { lineCount:1, qItems:["emotions"], type: "sign", starter: "feel" },
  4: { lineCount:1, qItems:["animals"], type: "image" },
  5: { lineCount:1, qItems:["food"], type: "image" },
  6: { lineCount:1, qItems:["emotions"], type: "image", starter: "feel" },
  7: { lineCount:2, qItems:["animals+numbers","food+colours"], type: "sign", verb: ["have","donthave"] },
  8: { lineCount:2, qItems:["animals+numbers","emotions+zones"], type: "sign", verb: ["feel"] },
  9: { lineCount:2, qItems:["animals+numbers","food+colours"], type: "image", verb: ["have","donthave"] },
  10:{ lineCount:2, qItems:["animals+numbers","emotions+zones"], type: "image", verb: ["feel"] },
  11:{ lineCount:3, qItems:["animals+numbers","emotions+zones","food+colours"], type: "sign", verb: ["feel","have","donthave"] },
  12:{ lineCount:3, qItems:["animals+numbers","emotions+zones","food+colours"], type: "image", verb: ["feel","have","donthave"] }
};

/* ===== Sign path helper ===== */
function signPathFor(word){
  if (!word) return "";
  if (VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if (VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (VOCAB.colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (VOCAB.zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if (VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  // helpers stored as filenames in VOCAB.helpers
  if (Object.keys(VOCAB.helpers).includes(word)) return `assets/signs/helpers/${VOCAB.helpers[word]}`;
  return "";
}

/* ===== Build candidate pools (image combos) ===== */
const candidatePool = { animals: [], food: [], emotions: [] };
(function buildCandidatePools(){
  VOCAB.topics.animals.forEach(a=>{
    VOCAB.numbers.forEach(n => {
      candidatePool.animals.push({ key: `animals::${a}::${n}`, parts:{animal:a,number:n}, img: `assets/images/animals/${a}-${n}.png` });
    });
  });
  VOCAB.topics.food.forEach(f=>{
    VOCAB.colours.forEach(c=>{
      candidatePool.food.push({ key: `food::${f}::${c}`, parts:{food:f,colour:c}, img: `assets/images/food/${f}-${c}.png` });
    });
  });
  VOCAB.topics.emotions.forEach(em=>{
    VOCAB.zones.forEach(z=>{
      candidatePool.emotions.push({ key: `emotions::${em}::${z}`, parts:{emotion:em,zone:z}, img: `assets/images/emotions/${em}-${z}.png` });
    });
  });
})();

/* ===== Create draggable node (either sign/video or image fallback) ===== */
function createDraggableNodeFromCandidate(c, asSign=false){
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = c.key;
  if (asSign) {
    // show sign/video if available
    const parts = c.key.split("::");
    const token = parts[1];
    const sign = signPathFor(token);
    if (sign.endsWith(".mp4")) {
      const v = document.createElement("video");
      v.src = sign; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
      div.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = sign || c.img; img.alt = c.key;
      img.onerror = ()=> { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = (c.parts.animal||c.parts.food||c.parts.emotion) + (c.parts.number?`-${c.parts.number}`:""); div.appendChild(f); } };
      div.appendChild(img);
    }
  } else {
    // show image
    const img = document.createElement("img");
    img.src = c.img; img.alt = c.key;
    img.onerror = ()=> { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = (c.parts.animal||c.parts.food||c.parts.emotion) + (c.parts.number?`-${c.parts.number}`:""); div.appendChild(f); } };
    div.appendChild(img);
  }

  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", div.dataset.key); }catch{} });
  return div;
}

/* ===== Create simple draggable from a sign filename (verbs/helpers) ===== */
function createDraggableNodeFromSign(key, path){
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = key;
  if (path.endsWith(".mp4")) {
    const v = document.createElement("video");
    v.src = path; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
    div.appendChild(v);
  } else {
    const img = document.createElement("img");
    img.src = path; img.alt = key;
    img.onerror = ()=> { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = key; div.appendChild(f); } };
    div.appendChild(img);
  }
  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", div.dataset.key); }catch{} });
  return div;
}

/* ===== Create dropzone (answer area) ===== */
function createDropzone(placeholderText="", expectedKey=""){
  const dz = document.createElement("div");
  dz.className = "dropzone";
  dz.dataset.expected = expectedKey || "";
  dz.dataset.filled = "";
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder faint";
  placeholder.textContent = placeholderText || "";
  dz.appendChild(placeholder);
  answerArea.appendChild(dz);

  // click double tap to clear (mobile + desktop)
  dz.addEventListener("click", (ev) => {
    // single click does nothing; double-tap handled globally
  });

  // allow dropping by checking dragItem on mouseup/touchend (handled globally)
  return dz;
}

/* ===== Render sentence rows (helpers fixed, question items placed) ===== */
function renderSentenceRows(signSrcs){
  // signSrcs = array of objects { src: "...", isVideo: bool, key: "...", overlayOptional }
  [sentenceRow1, sentenceRow2, sentenceRow3].forEach(r => r.innerHTML = "");

  // distribute items according to rules:
  // if <=5, fit in row1; if >5 first row becomes max 3, second up to 5, third remainder (starting with WHY)
  const total = signSrcs.length;
  let row1Max = total <= 5 ? total : 3;
  let rows = [];
  rows.push(signSrcs.slice(0, row1Max));
  if (total > row1Max) {
    const row2Count = Math.min(total - row1Max, 5);
    rows.push(signSrcs.slice(row1Max, row1Max + row2Count));
    if (total > row1Max + row2Count) rows.push(signSrcs.slice(row1Max + row2Count));
  }

  rows.forEach((items, idx) => {
    const container = idx === 0 ? sentenceRow1 : (idx === 1 ? sentenceRow2 : sentenceRow3);
    // for third row and level 11/12 we may need a WHY at start — caller will include if needed
    items.forEach(it => {
      if (it.isVideo) {
        const v = document.createElement("video");
        v.src = it.src; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
        container.appendChild(v);
      } else {
        const img = document.createElement("img");
        img.src = it.src; img.alt = it.key || "item"; img.className = "sign-img";
        container.appendChild(img);
      }
    });
  });
}

/* ===== Populate draggables left/right & verbs bottom ===== */
function populateDraggablesForLevel(level, questionItems, questionType){
  // questionType: "image" => question uses images, draggables should be signs (signs/videos)
  // if questionType === "sign" => question shows signs, draggables should be images
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = ""; bottomVerbs.innerHTML = "";
  const sideCount = (level <= 6) ? 6 : 9;

  // Build pool of candidate objects depending on level qItems
  const leftPool = [];
  const rightPool = [];

  levels[level].qItems.forEach(q => {
    // q can be "animals", "food", "emotions", or combos with '+'
    const parts = q.split("+");
    parts.forEach(p => {
      if (p === "animals") {
        // push animal-number combos
        candidatePool.animals.forEach(c => leftPool.push(Object.assign({topic:"animals"}, c)));
      } else if (p === "food") {
        candidatePool.food.forEach(c => leftPool.push(Object.assign({topic:"food"}, c)));
      } else if (p === "emotions") {
        candidatePool.emotions.forEach(c => leftPool.push(Object.assign({topic:"emotions"}, c)));
      } else if (p === "numbers") {
        // treat as animals numbers again (we'll add variety)
        candidatePool.animals.forEach(c => leftPool.push(Object.assign({topic:"animals"}, c)));
      } else if (p === "colours") {
        candidatePool.food.forEach(c => leftPool.push(Object.assign({topic:"food"}, c)));
      } else if (p === "zones") {
        candidatePool.emotions.forEach(c => leftPool.push(Object.assign({topic:"emotions"}, c)));
      }
    });
  });

  // shuffle and split pool to left/right
  const shuffled = shuffleArray(leftPool);
  const leftSelection = shuffled.slice(0, Math.min(sideCount, shuffled.length));
  const rightSelection = shuffled.slice(sideCount, sideCount*2);

  // append draggables: if questionType is image -> draggables are signs (asSign = true)
  if (questionType === "image") {
    leftSelection.forEach(c => { if (!usedDraggables.has(c.key)) leftDraggables.appendChild(createDraggableNodeFromCandidate(c, true)); });
    rightSelection.forEach(c => { if (!usedDraggables.has(c.key)) rightDraggables.appendChild(createDraggableNodeFromCandidate(c, true)); });
  } else {
    // questionType sign -> draggables are images
    leftSelection.forEach(c => { if (!usedDraggables.has(c.key)) leftDraggables.appendChild(createDraggableNodeFromCandidate(c, false)); });
    rightSelection.forEach(c => { if (!usedDraggables.has(c.key)) rightDraggables.appendChild(createDraggableNodeFromCandidate(c, false)); });
  }

  // verbs (signs) at bottom if level defines them
  if (levels[level].verb) {
    levels[level].verb.forEach(v => {
      const path = signPathFor(v);
      bottomVerbs.appendChild(createDraggableNodeFromSign(`verb::${v}`, path || `assets/signs/verbs/${v}.png`));
    });
  }
}

/* ===== Build question & dropzones ===== */
function buildQuestion(){
  // clear previous
  answerArea.innerHTML = "";
  sentenceRow1.innerHTML = "";
  sentenceRow2.innerHTML = "";
  sentenceRow3.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
  updateScoreDisplay();

  const lvl = levels[currentLevel];
  if (!lvl) return;

  // --- helper images (constants) ---
  const helperImgs = [];
  helperImgs.push({ src: `assets/signs/helpers/${VOCAB.helpers.i}`, isVideo:false });
  const helperVerb = lvl.starter || (lvl.verb && lvl.verb[0]) || "see";
  helperImgs.push({ src: signPathFor(helperVerb) || `assets/signs/helpers/${VOCAB.helpers.see}`, isVideo: helperVerb && helperVerb.endsWith(".mp4") });
  helperImgs.push({ src: `assets/signs/helpers/${VOCAB.helpers.what}`, isVideo:false });

  // We'll create question items (as images or signs) depending on lvl.type
  const questionType = lvl.type || "image"; // default to image if missing
  const questionItems = [];

  // Choose candidates depending on qItems:
  // For simple single-topic levels pick up to 5 random unique items; for multi-topic pick more (up to 8)
  let desiredCount = 1;
  if (currentLevel <= 3) desiredCount = 1;
  else if (currentLevel <= 6) desiredCount = 1;
  else if (currentLevel <= 8) desiredCount = 2;
  else if (currentLevel <= 10) desiredCount = 4;
  else desiredCount = 6;

  // Build candidate list from qItems
  const pool = [];
  lvl.qItems.forEach(q => {
    const parts = q.split("+");
    parts.forEach(p => {
      if (p === "animals") candidatePool.animals.forEach(x => pool.push(x));
      if (p === "food") candidatePool.food.forEach(x => pool.push(x));
      if (p === "emotions") candidatePool.emotions.forEach(x => pool.push(x));
    });
  });

  const shuffledPool = shuffleArray(pool).filter(c => !usedDraggables.has(c.key));
  for (let i = 0; i < Math.min(desiredCount, shuffledPool.length); i++){
    questionItems.push(shuffledPool[i]);
  }

  // Build the full sentence sign sources: start constants then items (images for question)
  const sentenceSources = [];
  // add helpers images first (they should be visible as constants in row1)
  helperImgs.forEach(h => sentenceSources.push(Object.assign({}, h)));
  // then add question items (as image sources for the sentence)
  questionItems.forEach(qi => sentenceSources.push({ src: qi.img, isVideo: false, key: qi.key }));

  // For Level 11/12 when many items overflow to row 3 we need WHY at start of row3; we'll implement by inserting a WHY placeholder
  // We'll let renderSentenceRows display them and, if needed, we can prepend WHY separately:
  if (sentenceSources.length > 8) {
    // insert why as first element of row3 by adding a placeholder object at correct position (render will allocate rows)
    // We'll just ensure WHY is present as a separate object (renderSentenceRows uses splitting logic)
    sentenceSources.push({ src: signPathFor("why") || `assets/signs/helpers/${VOCAB.helpers.why}`, isVideo:false, key: "why" });
  }

  // Render
  renderSentenceRows(sentenceSources);

  // --- Dropzones (answer area): number depends on level ---
  let dropCount = 1;
  if (currentLevel >= 1 && currentLevel <= 3) dropCount = 1;
  else if (currentLevel >= 4 && currentLevel <= 6) dropCount = 2;
  else if (currentLevel >= 7 && currentLevel <= 8) dropCount = 2;
  else if (currentLevel >= 9 && currentLevel <= 10) dropCount = 5;
  else if (currentLevel === 11) dropCount = 3;
  else if (currentLevel === 12) dropCount = 8;

  for (let i = 0; i < dropCount; i++){
    createDropzone("", "");
  }

  // Populate draggables on sides / bottom (draggables are opposite of questionType)
  populateDraggablesForLevel(currentLevel, questionItems, questionType);

  // Update check visibility (initially none filled)
  updateCheckVisibility();
}

/* ===== Drag / Drop with clone for touch/mouse ===== */
let dragItem = null;
let dragClone = null;
let isTouch = false;

function startDrag(e){
  const tgt = e.target.closest(".draggable");
  if (!tgt) return;
  dragItem = tgt;
  isTouch = e.type.startsWith("touch");
  const rect = tgt.getBoundingClientRect();
  dragClone = tgt.cloneNode(true);
  dragClone.classList.add("drag-clone");
  Object.assign(dragClone.style, {
    position: "fixed",
    left: rect.left + "px",
    top: rect.top + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    opacity: "0.75",
    pointerEvents: "none",
    zIndex: 10000,
    transform: "translate(-50%,-50%)"
  });
  document.body.appendChild(dragClone);
  e.preventDefault();
  if (isTouch) {
    document.addEventListener("touchmove", moveDrag, { passive: false });
    document.addEventListener("touchend", endDrag);
  } else {
    document.addEventListener("mousemove", moveDrag);
    document.addEventListener("mouseup", endDrag);
  }
}

function moveDrag(e){
  if (!dragClone) return;
  let clientX, clientY;
  if (isTouch && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  dragClone.style.left = clientX + "px";
  dragClone.style.top = clientY + "px";
}

function handleDropClone(dz, draggedKey){
  if (!draggedKey || dz.dataset.filled) return;
  // find draggable in dom by key (either left/right) to clone visual
  const dom = document.querySelector(`.draggable[data-key="${draggedKey}"]`);
  if (!dom) return;
  const clone = dom.cloneNode(true);
  clone.classList.remove("draggable");
  dz.appendChild(clone);
  dz.dataset.filled = draggedKey;
  dz.classList.add("filled");
  updateCheckVisibility();
}

function endDrag(e){
  if (!dragItem || !dragClone) return;

  // detect drop by coordinates
  let clientX = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientX : e.clientX;
  let clientY = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientY : e.clientY;

  let dropped = false;
  document.querySelectorAll(".dropzone").forEach(dz => {
    const rect = dz.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && !dz.dataset.filled) {
      handleDropClone(dz, dragItem.dataset.key);
      dropped = true;
    }
  });

  dragClone.remove(); dragClone = null;
  if (isTouch) {
    document.removeEventListener("touchmove", moveDrag, { passive: false });
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }
  dragItem = null;
  if (dropped) {
    againBtn.style.display = "inline-block";
  }
}

document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive: false });

/* ===== Double-tap / double-click to clear a dropzone ===== */
let lastTap = 0;
answerArea.addEventListener("click", (ev) => {
  const dz = ev.target.closest(".dropzone");
  if (!dz) return;
  const now = Date.now();
  if (now - lastTap < 350) {
    if (dz.dataset.filled) {
      const filledKey = dz.dataset.filled;
      dz.innerHTML = "";
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder faint";
      placeholder.textContent = "";
      dz.appendChild(placeholder);
      dz.dataset.filled = "";
      dz.classList.remove("filled","incorrect","correct");
      // restore draggable to side if not used permanently
      restoreDraggableToSide(filledKey);
      updateCheckVisibility();
    }
  }
  lastTap = now;
});

/* ===== Restore draggable to the side columns (if not present) ===== */
function restoreDraggableToSide(key){
  if (!key) return;
  if (document.querySelector(`.draggable[data-key="${key}"]`)) return; // already present
  if (usedDraggables.has(key)) return;
  // reconstruct from key tokens (topic::a::b)
  const parts = key.split("::");
  if (parts.length < 2) return;
  const topic = parts[0], a = parts[1], b = parts[2] || "";
  // create candidate-like object
  const c = { key, parts: {}, img: `assets/images/${topic}/${a}${b?'-'+b:''}.png` };
  if (topic === "animals") c.parts.animal = a, c.parts.number = b;
  if (topic === "food") c.parts.food = a, c.parts.colour = b;
  if (topic === "emotions") c.parts.emotion = a, c.parts.zone = b;
  // append to smaller side
  const container = (leftDraggables.childElementCount <= rightDraggables.childElementCount) ? leftDraggables : rightDraggables;
  container.appendChild(createDraggableNodeFromCandidate(c, false));
}

/* ===== Check button visibility ===== */
function updateCheckVisibility(){
  const dzs = Array.from(document.querySelectorAll(".dropzone"));
  if (dzs.length === 0) { checkBtn.style.display = "none"; return; }
  const allFilled = dzs.every(d => d.dataset.filled && d.dataset.filled.length > 0);
  checkBtn.style.display = allFilled ? "inline-block" : "none";
}

/* ===== Score display ===== */
function updateScoreDisplay(){
  scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel + 1}/${QUESTIONS_PER_LEVEL}`;
}

/* ===== Create dropzones used elsewhere (kept) ===== */
/* (already defined above as createDropzone) */

/* ===== Submit / check logic (simple version) ===== */
checkBtn.addEventListener("click", () => {
  checkBtn.style.display = "none";
  const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;
  const currentRoundCorrect = [];
  const currentRoundIncorrect = [];

  dzs.forEach(dz => {
    const filledKey = dz.dataset.filled || "";
    if (!filledKey) { allCorrect = false; dz.classList.add("incorrect"); currentRoundIncorrect.push(null); return; }
    // simple correctness: if expected was set, check contains expected token, otherwise accept
    const expected = dz.dataset.expected || "";
    if (expected) {
      if (filledKey.includes(expected)) { dz.classList.add("correct"); currentRoundCorrect.push(filledKey); }
      else { dz.classList.add("incorrect"); currentRoundIncorrect.push(filledKey); allCorrect = false; }
    } else {
      dz.classList.add("correct"); currentRoundCorrect.push(filledKey);
    }
  });

  if (allCorrect) {
    levelCorrect[currentLevel] = (levelCorrect[currentLevel] || 0) + dzs.length;
    correctCount += dzs.length;
    dzs.forEach(dz => { if (dz.dataset.filled) usedDraggables.add(dz.dataset.filled); });
    currentRoundCorrect.forEach(k => { if (k) usedCombos.add(k); });
  } else {
    currentRoundIncorrect.forEach(k => {
      if (k) {
        levelIncorrect[currentLevel] = (levelIncorrect[currentLevel] || 0) + 1;
        incorrectCount++;
        // remove draggable visually from sides if present
        const dom = document.querySelector(`.draggable[data-key="${k}"]`);
        if (dom && dom.parentElement) dom.parentElement.removeChild(dom);
        usedDraggables.add(k);
      }
    });
    currentRoundCorrect.forEach(k => { if (k) usedDraggables.add(k); });
  }

  // feedback
  feedbackDiv.innerHTML = "";
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  fb.alt = allCorrect ? "Correct" : "Wrong";
  feedbackDiv.appendChild(fb);

  answersHistory.push({ level: currentLevel, round: roundInLevel, correct: currentRoundCorrect.slice(), incorrect: currentRoundIncorrect.slice() });
  saveProgress();

  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if (allCorrect) {
      if (roundInLevel + 1 >= QUESTIONS_PER_LEVEL) {
        // advance level
        if (currentLevel < TOTAL_LEVELS) {
          currentLevel++;
          roundInLevel = 0;
          buildQuestion();
        } else {
          finalSubmitThenEnd();
        }
      } else {
        roundInLevel++;
        buildQuestion();
      }
    } else {
      // allow retry: show 'again' button (already shown earlier when drop occurred)
      againBtn.style.display = "inline-block";
      updateCheckVisibility();
    }
  }, 1200);
});

/* ===== Save / Load / Clear progress ===== */
function saveProgress(){
  const payload = {
    studentName, studentClass: studentClassSpan.textContent,
    currentLevel, roundInLevel,
    correctCount, incorrectCount,
    levelCorrect, levelIncorrect,
    answersHistory,
    savedTimeElapsed: getTimeElapsed(),
    usedDraggables: Array.from(usedDraggables),
    usedCombos: Array.from(usedCombos)
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); } catch(e){ console.warn("save failed", e); }
}

function loadProgress(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}

function clearProgress(){
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem("sentencesGame_submitted"); } catch(e){}
}

/* ===== Google submit & final modal (kept simple) ===== */
async function submitToGoogleForm(silent=true){
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if (totalCorrect < 1) return false;

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClassSpan.textContent);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);
  for (let lvl=1; lvl<=TOTAL_LEVELS; lvl++){
    fd.append(FORM_FIELD_MAP[`level${lvl}`].correct, levelCorrect[lvl] || 0);
    fd.append(FORM_FIELD_MAP[`level${lvl}`].incorrect, levelIncorrect[lvl] || 0);
  }
  try{
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
    formSubmittedFlag = true;
    localStorage.setItem("sentencesGame_submitted","1");
    return true;
  } catch(e){ console.warn("form submit failed", e); return false; }
}

async function finalSubmitThenEnd(){
  await submitToGoogleForm(true);
  clearProgress();
  // show end modal if present
  if (endModal) {
    // fill final stats if your HTML has those elements (optional)
    endModal.style.display = "flex";
    endModal.style.zIndex = 6000;
  }
}

/* ===== Resume modal check & init ===== */
function showResumeModalIfNeeded(){
  const saved = loadProgress();
  if (saved) {
    // show your modal if present -- simple confirm for now
    const resumeModal = document.getElementById("resumeModal");
    if (resumeModal) {
      resumeModal.style.display = "flex";
      resumeModal.style.zIndex = 6000;
      document.getElementById("resumeContinue").onclick = () => {
        resumeModal.style.display = "none";
        // restore
        restoreProgress(saved);
        buildQuestion();
        startTime = Date.now();
      };
      document.getElementById("resumeAgain").onclick = () => {
        resumeModal.style.display = "none";
        clearProgress();
        usedDraggables.clear(); usedCombos.clear();
        currentLevel = 1; roundInLevel = 0;
        buildQuestion();
        startTime = Date.now();
      };
      return;
    }
  }
  // else start fresh
  setTimeElapsed(0);
  startTime = Date.now();
  buildQuestion();
}

function restoreProgress(saved){
  if (!saved) return;
  currentLevel = Number(saved.currentLevel) || 1;
  roundInLevel = Number(saved.roundInLevel) || 0;
  correctCount = Number(saved.correctCount) || 0;
  incorrectCount = Number(saved.incorrectCount) || 0;
  levelCorrect = saved.levelCorrect || levelCorrect;
  levelIncorrect = saved.levelIncorrect || levelIncorrect;
  answersHistory = saved.answersHistory || [];
  savedTimeElapsed = Number(saved.savedTimeElapsed) || 0;
  usedDraggables = new Set(saved.usedDraggables || []);
  usedCombos = new Set(saved.usedCombos || []);
  setTimeElapsed(saved.savedTimeElapsed || 0);
}

/* ===== Initialisation ===== */
window.addEventListener("load", () => {
  // ensure UI elements exist
  if (!leftDraggables || !rightDraggables || !answerArea || !sentenceRow1) {
    console.error("Required DOM elements missing.");
    return;
  }
  showResumeModalIfNeeded();
});
