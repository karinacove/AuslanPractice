/* ===== SENTENCES GAME — full script ===== */

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
const row1 = document.getElementById("sentenceRow1");
const row2 = document.getElementById("sentenceRow2");
const row3 = document.getElementById("sentenceRow3");
const answerArea = document.getElementById("answerArea");
const feedbackDiv = document.getElementById("feedback");
const checkBtn = document.getElementById("checkBtn");
const againBtn = document.getElementById("againBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const endModal = document.getElementById("endModal");
const googleForm = document.getElementById("googleForm");

/* ===== GAME STATE ===== */
const SAVE_KEY = "sentencesGameSave_v2";
let currentLevel = 1;        // 1..12
let roundInLevel = 0;        // 0..9
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_LEVELS = 12;

let correctCount = 0;
let incorrectCount = 0;

let levelCorrect = {};
let levelIncorrect = {};
for (let i = 1; i <= TOTAL_LEVELS; i++) { levelCorrect[i] = 0; levelIncorrect[i] = 0; }

let answersHistory = []; // {level, round, correct:[], incorrect:[]}
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
  helpers: { i: "assets/signs/helpers/i.png", see: "assets/signs/helpers/see.png", feel: "assets/signs/helpers/feel.png", what: "assets/signs/helpers/what.png", why: "assets/signs/helpers/why.png" }
};

/* ===== LEVEL CONFIG (dropzone counts etc) ===== */
/* dropzones mapping not exhaustive here — we'll compute dropCount in buildQuestion */
const levels = {
  1: { lineCount:1, qItems:["animals"], type:"sign" },
  2: { lineCount:1, qItems:["food"], type:"sign" },
  3: { lineCount:1, qItems:["emotions"], type:"sign" },
  4: { lineCount:1, qItems:["animals"], type:"image" },
  5: { lineCount:1, qItems:["food"], type:"image" },
  6: { lineCount:1, qItems:["emotions"], type:"image" },
  7: { lineCount:2, qItems:["animals+numbers","food+colours"], type:"sign" },
  8: { lineCount:2, qItems:["animals+numbers","emotions+zones"], type:"sign" },
  9: { lineCount:2, qItems:["animals+numbers","food+colours"], type:"image" },
  10:{ lineCount:2, qItems:["animals+numbers","emotions+zones"], type:"image" },
  11:{ lineCount:3, qItems:["animals+numbers","emotions+zones","food+colours"], type:"sign" },
  12:{ lineCount:3, qItems:["animals+numbers","emotions+zones","food+colours"], type:"image" }
};

/* ===== Helpers ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function timeNowSeconds(){ return Math.round(Date.now()/1000); }
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = seconds || 0; startTime = Date.now(); }

/* ===== Sign path helper (emotions -> mp4) ===== */
function signPathFor(word){
  if(!word) return "";
  if(VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if(VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if(VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if(VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if(VOCAB.colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if(VOCAB.zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if(VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if(VOCAB.helpers[word]) return VOCAB.helpers[word];
  return "";
}

/* ===== Candidate pools (image combos) ===== */
const candidatePool = { animals: [], food: [], emotions: [] };
(function buildPools(){
  // animals: animal + number
  VOCAB.topics.animals.forEach(a => {
    VOCAB.numbers.forEach(n => {
      candidatePool.animals.push({ key: `animals::${a}::${n}`, parts:{animal:a, number:n}, img:`assets/images/animals/${a}-${n}.png` });
    });
  });
  // food: food + colour
  VOCAB.topics.food.forEach(f => {
    VOCAB.colours.forEach(c => {
      candidatePool.food.push({ key:`food::${f}::${c}`, parts:{food:f, colour:c}, img:`assets/images/food/${f}-${c}.png` });
    });
  });
  // emotions: emotion + zone
  VOCAB.topics.emotions.forEach(em => {
    VOCAB.zones.forEach(z => {
      candidatePool.emotions.push({ key:`emotions::${em}::${z}`, parts:{emotion:em, zone:z}, img:`assets/images/emotions/${em}-${z}.png` });
    });
  });
})();

/* ===== Draggable node builders ===== */
function createCandidateDiv(c){
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = c.key;
  if(c.overlay) div.dataset.overlay = c.overlay;

  const img = document.createElement("img");
  img.src = c.img;
  img.alt = c.key;
  img.onerror = () => {
    img.style.display = "none";
    if(!div.querySelector(".fallback")){
      const f = document.createElement("div");
      f.className = "fallback";
      f.textContent = (c.parts.animal || c.parts.food || c.parts.emotion || c.parts.colour || c.parts.zone) + (c.parts.number ? `-${c.parts.number}` : "");
      div.appendChild(f);
    }
  };
  div.appendChild(img);

  if(c.overlay){
    const ov = document.createElement("div");
    ov.className = "overlay " + c.overlay;
    ov.textContent = c.overlay === "have" ? "✓" : "✕";
    div.appendChild(ov);
  }

  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", c.key); }catch{} });
  return div;
}

function createDraggableFromParts(topic, a, b){
  const key = `${topic}::${a}::${b || ""}`;
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = key;

  // helpers / verbs / signs / images
  if(topic === "helpers"){
    const src = VOCAB.helpers[a];
    const img = document.createElement("img");
    img.src = src;
    img.alt = a;
    img.onerror = () => { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = a; div.appendChild(f); } };
    div.appendChild(img);
  } else if(topic === "emotions"){
    // a is emotion, use mp4 sign
    const v = document.createElement("video");
    v.src = `assets/signs/emotions/sign-${a}.mp4`;
    v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
    v.width = 80; v.height = 80;
    div.appendChild(v);
  } else if(topic === "verbs"){
    const img = document.createElement("img");
    img.src = `assets/signs/verbs/${a}.png`;
    img.alt = a;
    img.onerror = () => { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = a; div.appendChild(f); } };
    div.appendChild(img);
  } else {
    // images for animals/food/emotions combos
    const fn = b ? `${a}-${b}` : a;
    const img = document.createElement("img");
    img.src = `assets/images/${topic}/${fn}.png`;
    img.alt = fn;
    img.onerror = () => { img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = fn; div.appendChild(f); } };
    div.appendChild(img);
  }

  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", key); }catch{} });
  return div;
}

/* ===== Populate left/right/bottom draggables ===== */
function populateDraggablesForLevel(level){
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  bottomVerbs.innerHTML = "";

  const leftCount = level <= 6 ? 6 : 9;
  const rightCount = level <= 6 ? 6 : 9;

  // Build pool of candidates for this level from candidatePool based on qItems
  const lvl = levels[level];
  const leftPool = [];
  const rightPool = [];

  if(lvl && lvl.qItems){
    lvl.qItems.forEach(q => {
      // q might be "animals" or "animals+numbers"
      const parts = q.split("+");
      parts.forEach(topic => {
        if(topic === "animals"){
          candidatePool.animals.forEach(c => leftPool.push({ ...c, topic: "animals" }), c => rightPool.push(c));
          // We'll use slices below
        } else if(topic === "food"){
          candidatePool.food.forEach(c => leftPool.push({ ...c, topic: "food" }), c => rightPool.push(c));
        } else if(topic === "emotions"){
          candidatePool.emotions.forEach(c => leftPool.push({ ...c, topic: "emotions" }), c => rightPool.push(c));
        } else if(topic === "numbers"){
          // numbers as individual image? For simplicity add animal-number combos to pools
          candidatePool.animals.forEach(c => leftPool.push({ ...c, topic: "animals" }));
        } else if(topic === "colours"){
          candidatePool.food.forEach(c => leftPool.push({ ...c, topic: "food" }));
        } else if(topic === "zones"){
          candidatePool.emotions.forEach(c => leftPool.push({ ...c, topic: "emotions" }));
        }
      });
    });
  }

  // shuffle and pick counts
  const leftSel = shuffleArray(leftPool).filter(c => !usedDraggables.has(c.key)).slice(0, leftCount);
  const rightSel = shuffleArray(leftPool).filter(c => !usedDraggables.has(c.key)).slice(0, rightCount); // use same pool for both sides

  leftSel.forEach(c => {
    // create element either as candidateDiv (image combo) or createDraggableFromParts for verbs/helpers
    if(c.img) leftDraggables.appendChild(createCandidateDiv(c));
    else leftDraggables.appendChild(createDraggableFromParts(c.topic, c.parts ? (c.parts.animal || c.parts.food || c.parts.emotion) : "", c.parts ? (c.parts.number || c.parts.colour || c.parts.zone) : ""));
  });
  rightSel.forEach(c => {
    if(c.img) rightDraggables.appendChild(createCandidateDiv(c));
    else rightDraggables.appendChild(createDraggableFromParts(c.topic, c.parts ? (c.parts.animal || c.parts.food || c.parts.emotion) : "", c.parts ? (c.parts.number || c.parts.colour || c.parts.zone) : ""));
  });

  // verbs at bottom for compound levels (take unique verbs from level if present)
  if(lvl && lvl.verb){
    lvl.verb.forEach(v => {
      bottomVerbs.appendChild(createDraggableFromParts("verbs", v));
    });
  }

  // Always include helpers as non-draggable visuals in sentence rows (we do not add them here)
}

/* ===== Create dropzone helper (in answerArea) ===== */
function createDropzone(placeholder = "") {
  const dz = document.createElement("div");
  dz.className = "dropzone";
  dz.dataset.filled = "";
  if (placeholder) dz.dataset.placeholder = placeholder;

  const ph = document.createElement("div");
  ph.className = "placeholder faint";
  ph.textContent = placeholder;
  dz.appendChild(ph);

  // mouse / touch handlers for dropping clones via handleDropClone
  dz.addEventListener("mouseup", () => { if (dragItem) handleDropClone(dz, dragItem.dataset.key); });
  dz.addEventListener("touchend", (e) => {
    if (!dragItem || !e.changedTouches || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    const r = dz.getBoundingClientRect();
    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
      handleDropClone(dz, dragItem.dataset.key);
    }
  });

  answerArea.appendChild(dz);
  return dz;
}

/* ===== handleDropClone: clones draggable into dropzone ===== */
function handleDropClone(dz, draggedKey) {
  if (!draggedKey || dz.childElementCount > 0) return;
  // find the source draggable (it may be removed after used)
  const src = document.querySelector(`.draggable[data-key="${draggedKey}"]`);
  // create clone node
  const clone = src ? src.cloneNode(true) : (() => {
    // fallback: attempt to build from key
    const parts = draggedKey.split("::");
    return createDraggableFromParts(parts[0], parts[1], parts[2]);
  })();

  if (clone) {
    clone.classList.remove("draggable");
    // remove event handlers on clone (safety)
    clone.removeAttribute("draggable");
    dz.appendChild(clone);
    dz.dataset.filled = draggedKey;
    dz.classList.add("filled");
    updateCheckVisibility();
  }
}

/* ===== Build the top sentence rows for the current question ===== */
function buildQuestion() {
  // clear rows and answer area
  [row1, row2, row3].forEach(r => r.innerHTML = "");
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
  updateScoreDisplay();

  const desc = levels[currentLevel];
  if (!desc) return;

  // Decide question items: build an array of items (either images or signs) to show in sentence rows.
  // For simplicity we will pick candidate items from candidatePool depending on level type.
  let questionItems = []; // each item: { type: "image"|"sign", src, key, parts }

  // Pick appropriate number of items based on complexity:
  // For levels 1-3 & 4-6 -> 1 item (a combo)
  // 7-10 -> 2-5 items depending; 11-12 -> up to 8
  if (currentLevel <= 6) {
    // pick a single combo from the relevant pool
    const poolName = (desc.type === "image") ? (currentLevel <= 3 ? "animals" : "animals") : "animals";
    // map level to topic: 1 animals,2 food,3 emotions,4 animals(image),5 food(image),6 emotions(image)
    const topic = currentLevel === 1 || currentLevel === 4 ? "animals" : currentLevel === 2 || currentLevel === 5 ? "food" : "emotions";
    const pool = candidatePool[topic];
    const candidate = pool[Math.floor(Math.random()*pool.length)];
    if (candidate) {
      // question displays image or sign depending on type
      if (desc.type === "image") {
        questionItems.push({ type: "image", src: candidate.img, key: candidate.key, parts: candidate.parts });
      } else {
        // sign -> for emotions it's mp4; for others use signPathFor for each part? We'll display the sign image for the combo by showing the sign for the animal (or food/emotion sign)
        // Simpler: show the sign for the primary word (animal/food/emotion)
        const mainWord = candidate.parts.animal || candidate.parts.food || candidate.parts.emotion;
        const src = signPathFor(mainWord);
        questionItems.push({ type: "sign", src, key: candidate.key, parts: candidate.parts });
      }
    }
  } else {
    // for levels 7-12 build a variable number of items (2..8)
    const poolNames = [];
    desc.qItems.forEach(q => {
      q.split("+").forEach(t => {
        if (t === "animals") poolNames.push("animals");
        if (t === "food") poolNames.push("food");
        if (t === "emotions") poolNames.push("emotions");
        if (t === "numbers") poolNames.push("animals");
        if (t === "colours") poolNames.push("food");
        if (t === "zones") poolNames.push("emotions");
      });
    });
    // create a mixed list from pools
    let mixed = [];
    poolNames.forEach(p => mixed = mixed.concat(candidatePool[p]));
    mixed = shuffleArray(mixed);
    const count = Math.min(8, Math.max(2, Math.floor(2 + Math.random() * 6))); // between 2 and 8
    for (let i=0;i<count && i<mixed.length;i++){
      const c = mixed[i];
      if (desc.type === "image") questionItems.push({ type: "image", src: c.img, key: c.key, parts: c.parts });
      else {
        const main = c.parts.animal || c.parts.food || c.parts.emotion;
        questionItems.push({ type: "sign", src: signPathFor(main), key: c.key, parts: c.parts });
      }
    }
  }

  // Layout items into rows with helper images as constants
  // Build an array of src strings for display but with info objects
  const displayItems = questionItems.slice();

  // Placement rules: if total items <=5 put them on first row with helpers; if >=6 first row limited to 3, second up to 5, third remaining with why
  const total = displayItems.length;
  let row1Items = [], row2Items = [], row3Items = [];
  if (total <= 5) {
    row1Items = displayItems.slice(0);
  } else {
    row1Items = displayItems.slice(0, 3);
    row2Items = displayItems.slice(3, Math.min(8, 3+5));
    if (displayItems.length > 8) row3Items = displayItems.slice(8); // unlikely
    else if (displayItems.length > 8) row3Items = displayItems.slice(8);
    else row3Items = displayItems.slice(3+5);
  }

  // Helper for appending node (image or video)
  function appendNodeToRow(row, item){
    if(!item) return;
    if(item.type === "sign" && item.src && item.src.endsWith(".mp4")){
      const v = document.createElement("video");
      v.src = item.src;
      v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
      v.className = "sign-video";
      row.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.key || "";
      img.className = "sign-img";
      row.appendChild(img);
    }
  }

  // Row 1: always start with I + see/feel + what (constants)
  const helperI = document.createElement("img");
  helperI.src = VOCAB.helpers.i;
  helperI.alt = "I"; helperI.className = "sentence-constant";
  row1.appendChild(helperI);

  // choose helper (see/feel) — emotion levels or when descriptor present use feel
  const verbHelper = (currentLevel === 3 || currentLevel === 6 || (levels[currentLevel] && levels[currentLevel].type === "sign" && levels[currentLevel].qItems && levels[currentLevel].qItems.includes("emotions"))) ? "feel" : "see";
  const helperVerbImg = document.createElement("img");
  helperVerbImg.src = VOCAB.helpers[verbHelper];
  helperVerbImg.alt = verbHelper; helperVerbImg.className = "sentence-constant";
  row1.appendChild(helperVerbImg);

  const helperWhat = document.createElement("img");
  helperWhat.src = VOCAB.helpers.what;
  helperWhat.alt = "what"; helperWhat.className = "sentence-constant";
  row1.appendChild(helperWhat);

  // place row1 items
  row1Items.forEach(it => appendNodeToRow(row1, it));

  // if row2 exists, append items
  if(row2Items.length > 0){
    row2Items.forEach(it => appendNodeToRow(row2, it));
  }

  // if row3 exists, start with why image then items
  if(row3Items.length > 0){
    const whyImg = document.createElement("img");
    whyImg.src = VOCAB.helpers.why;
    whyImg.alt = "why";
    whyImg.className = "sentence-constant";
    row3.appendChild(whyImg);
    row3Items.forEach(it => appendNodeToRow(row3, it));
  }

  // Now create answer area dropzones — opposite of question type
  // If question displayed images => students drop signs (i.e. signs from signPathFor) OR if question displayed signs => students drop images
  // Determine num dropzones: for simple levels 1-3 => 1; 4-6 => 1; 7-8 => 2; 9-10 => 5; 11 => 3; 12 => 8 (as per your earlier spec)
  let dropCount = 1;
  if (currentLevel >= 4 && currentLevel <= 6) dropCount = 1;
  else if (currentLevel >= 7 && currentLevel <= 8) dropCount = 2;
  else if (currentLevel >= 9 && currentLevel <= 10) dropCount = 5;
  else if (currentLevel === 11) dropCount = 3;
  else if (currentLevel === 12) dropCount = 8;

  // create placeholders labels for dropzones based on level (simple labels)
  const placeholders = [];
  for (let i=0;i<dropCount;i++){
    placeholders.push(`Drop ${i+1}`);
  }

  placeholders.forEach(p => createDropzone(p));

  // populate left/right/bottom draggables for this level
  populateDraggablesForLevel(currentLevel);

  // update check visibility
  updateCheckVisibility();
}

/* ===== Drag / touch clone handling ===== */
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
  dragClone.classList.add("drag-clone");
  Object.assign(dragClone.style, {
    position: "fixed",
    left: rect.left + "px",
    top: rect.top + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    opacity: "0.8",
    pointerEvents: "none",
    zIndex: 99999,
    transform: "translate(-50%,-50%)"
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
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }
  dragClone.style.left = clientX + "px";
  dragClone.style.top = clientY + "px";
}

function endDrag(e){
  if(!dragItem || !dragClone) return;

  // compute drop target by coordinates
  let clientX = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientX : e.clientX;
  let clientY = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientY : e.clientY;

  // find a dropzone under these coords
  const el = document.elementFromPoint(clientX, clientY);
  const dz = el ? el.closest(".dropzone") : null;
  if (dz && dz.childElementCount === 0){
    // clone the dragItem into dropzone
    const clone = dragItem.cloneNode(true);
    clone.classList.remove("draggable");
    clone.removeAttribute("draggable");
    dz.appendChild(clone);
    dz.dataset.filled = dragItem.dataset.key;
    dz.classList.add("filled");
  }

  dragClone.remove(); dragClone = null;

  if (isTouch){
    document.removeEventListener("touchmove", moveDrag, { passive:false });
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }

  dragItem = null;
  updateCheckVisibility();
}

// attach start listeners on document (delegation)
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive:false });

/* ===== restore draggable from key back to side (when double-tap remove) ===== */
function restoreDraggableByKeyToSide(key) {
  if(!key) return;
  // If there is already a draggable on the sides with that key, skip
  if(document.querySelector(`.draggable[data-key="${key}"]`)) return;
  if(usedDraggables.has(key)) return;
  const parts = key.split("::");
  if(parts.length < 2) return;
  const topic = parts[0];
  const a = parts[1];
  const b = parts[2] || "";
  // choose side with fewer children
  const container = leftDraggables.childElementCount <= rightDraggables.childElementCount ? leftDraggables : rightDraggables;
  const div = createDraggableFromParts(topic, a, b);
  container.appendChild(div);
}

/* ===== Double-click / double-tap removal from dropzone ===== */
let lastTap = 0;
answerArea.addEventListener("click", (ev) => {
  const dz = ev.target.closest(".dropzone");
  if(!dz) return;
  const now = Date.now();
  if(now - lastTap < 350){
    if(dz.dataset.filled){
      const filledKey = dz.dataset.filled;
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("filled", "incorrect", "correct");
      restoreDraggableByKeyToSide(filledKey);
      updateCheckVisibility();
    }
  }
  lastTap = now;
});

/* ===== Update check button visibility ===== */
function updateCheckVisibility(){
  const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
  if(dzs.length === 0){ checkBtn.style.display = "none"; return; }
  const allFilled = dzs.every(d => d.dataset.filled && d.dataset.filled.length>0);
  checkBtn.style.display = allFilled ? "inline-block" : "none";
}

/* ===== update score display ===== */
function updateScoreDisplay(){
  if(scoreDisplay) scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/${QUESTIONS_PER_LEVEL}`;
}

/* ===== Check button handler =====
   (simple behaviour: mark correct/incorrect if expected metadata exists — otherwise accept anything) */
checkBtn.addEventListener("click", () => {
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;
  const currentRoundCorrect = [];
  const currentRoundIncorrect = [];

  dzs.forEach(dz => {
    const filledKey = dz.dataset.filled || "";
    if(!filledKey){
      allCorrect = false;
      dz.classList.add("incorrect");
      currentRoundIncorrect.push(null);
      return;
    }
    // For now accept anything (if you need precise expected matching, add dataset.expected on dz when creating)
    dz.classList.add("correct");
    currentRoundCorrect.push(filledKey);
  });

  // Update counts & used sets
  if(allCorrect){
    levelCorrect[currentLevel] = (levelCorrect[currentLevel] || 0) + dzs.length;
    correctCount += dzs.length;
    dzs.forEach(dz => { if(dz.dataset.filled) usedDraggables.add(dz.dataset.filled); });
    currentRoundCorrect.forEach(k => { if(k) usedCombos.add(k); });
  } else {
    // mark incorrect ones as used (so they don't reappear)
    dzs.forEach(dz => {
      if(!dz.dataset.filled){ levelIncorrect[currentLevel] = (levelIncorrect[currentLevel] || 0) + 1; incorrectCount++; }
    });
    currentRoundIncorrect.forEach(k => { if(k) usedDraggables.add(k); });
  }

  // show feedback briefly
  feedbackDiv.innerHTML = "";
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  fb.alt = allCorrect ? "Correct" : "Wrong";
  feedbackDiv.appendChild(fb);

  answersHistory.push({ level: currentLevel, round: roundInLevel, correct: currentRoundCorrect.slice(), incorrect: currentRoundIncorrect.slice() });
  saveProgress();

  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if(allCorrect){
      // advance
      if(roundInLevel + 1 >= QUESTIONS_PER_LEVEL){
        // level complete
        if(currentLevel < TOTAL_LEVELS){
          currentLevel++;
          roundInLevel = 0;
          buildQuestion();
        } else {
          // final submit / end
          finalSubmitThenEnd();
        }
      } else {
        roundInLevel++;
        buildQuestion();
      }
    } else {
      // allow retry: show again button
      againBtn.style.display = "inline-block";
      updateCheckVisibility();
    }
  }, 900);
});

/* ===== Save / Load / Clear progress ===== */
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
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }catch(e){ console.warn("save failed", e); }
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

/* ===== Final submission (silent) and end modal ===== */
async function submitToGoogleForm(silent=true){
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if(totalCorrect < 1) return false;

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
  }catch(e){ console.warn("form submit failed", e); return false; }
}

async function finalSubmitThenEnd(){
  await submitToGoogleForm(true);
  clearProgress();
  // show end modal if exists
  if(endModal){ endModal.style.display = "flex"; }
}

/* ===== Resume handling on load ===== */
function restoreProgressToState(saved){
  if(!saved) return;
  studentName = saved.studentName || studentName;
  studentClass = saved.studentClass || studentClass;
  currentLevel = Number(saved.currentLevel) || currentLevel;
  roundInLevel = Number(saved.roundInLevel) || roundInLevel;
  correctCount = Number(saved.correctCount) || correctCount;
  incorrectCount = Number(saved.incorrectCount) || incorrectCount;
  levelCorrect = saved.levelCorrect || levelCorrect;
  levelIncorrect = saved.levelIncorrect || levelIncorrect;
  answersHistory = saved.answersHistory || answersHistory;
  savedTimeElapsed = Number(saved.savedTimeElapsed) || savedTimeElapsed;
  usedDraggables = new Set(saved.usedDraggables || []);
  usedCombos = new Set(saved.usedCombos || []);
  setTimeElapsed(saved.savedTimeElapsed || 0);
}

function showResumeIfNeeded(){
  const saved = loadProgress();
  if(saved){
    // show resume modal if you have one in markup. If not, ask confirm
    const resumeModal = document.getElementById("resumeModal");
    if(resumeModal){
      // show custom modal (we assume there are buttons with ids resumeContinue/resumeAgain)
      resumeModal.style.display = "flex";
      const cont = document.getElementById("resumeContinue");
      const again = document.getElementById("resumeAgain");
      cont && cont.addEventListener("click", () => {
        resumeModal.style.display = "none";
        restoreProgressToState(saved);
        startTime = Date.now();
        buildQuestion();
      }, { once:true });
      again && again.addEventListener("click", () => {
        resumeModal.style.display = "none";
        clearProgress();
        startTime = Date.now();
        buildQuestion();
      }, { once:true });
    } else {
      // no modal markup - fallback: confirm
      if(confirm(`Resume saved at Level ${saved.currentLevel}, Question ${Number(saved.roundInLevel)+1}? Continue?`)){
        restoreProgressToState(saved);
      } else {
        clearProgress();
      }
      startTime = Date.now();
      buildQuestion();
    }
  } else {
    startTime = Date.now();
    buildQuestion();
  }
}

/* ===== INIT ===== */
window.addEventListener("load", () => {
  // sanity
  if(!studentName || !studentClass){
    alert("Please log in first."); window.location.href = "../index.html"; return;
  }
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;

  // hide check initially
  if(checkBtn) checkBtn.style.display = "none";
  // start/resume
  showResumeIfNeeded();
});
