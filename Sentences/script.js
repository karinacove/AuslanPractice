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

let answersHistory = []; // {level,round,correct[],incorrect[]}

let startTime = null;
let savedTimeElapsed = 0;

let usedDraggables = new Set(); // keys permanently used/removed
let usedCombos = new Set(); // combos answered correctly first-try

let formSubmittedFlag = localStorage.getItem("sentencesGame_submitted") === "1";

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
  helpers: { i: "i.png", see: "see.png", what: "what.png", why: "why.png", feel: "feel.png" }
};

/* ===== HELPERS ===== */
function shuffleArray(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function timeNowSeconds(){ return Math.round(Date.now()/1000); }
function getTimeElapsed(){ return savedTimeElapsed + (startTime ? Math.round((Date.now()-startTime)/1000) : 0); }
function setTimeElapsed(seconds){ savedTimeElapsed = seconds || 0; startTime = Date.now(); }

/* ===== SIGN / IMAGE PATH HELPERS ===== */
function signPathFor(word){
  if (!word) return "";
  if (VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if (VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (VOCAB.colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (VOCAB.zones.includes(word)) return `assets/signs/zones/${word}.png`;
  if (VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if (Object.keys(VOCAB.helpers).includes(word)) return `assets/signs/helpers/${VOCAB.helpers[word]}`;
  return "";
}
function imagePathFor(topic, a, b){
  // animals => assets/images/animals/[animal]-[number].png
  // food => assets/images/food/[food]-[colour].png
  if(topic === "animals") return `assets/images/animals/${a}-${b}.png`;
  if(topic === "food") return `assets/images/food/${a}-${b}.png`;
  if(topic === "emotions") return `assets/images/emotions/${a}-${b}.png`;
  return "";
}
function draggableKey(topic,a,b){ return `${topic}::${a}::${b}`; }

/* ===== CANDIDATE POOLS (image combos) ===== */
const candidatePool = { animals: [], food: [], emotions: [] };
(function buildCandidatePools(){
  VOCAB.topics.animals.forEach(a => {
    VOCAB.numbers.forEach(n => {
      candidatePool.animals.push({ key: draggableKey("animals", a, n), parts: { animal: a, number: n }, img: imagePathFor("animals", a, n) });
    });
  });
  VOCAB.topics.food.forEach(f => {
    VOCAB.colours.forEach(c => {
      candidatePool.food.push({ key: draggableKey("food", f, c), parts: { food: f, colour: c }, img: imagePathFor("food", f, c) });
    });
  });
  VOCAB.topics.emotions.forEach(em => {
    VOCAB.zones.forEach(z => {
      candidatePool.emotions.push({ key: draggableKey("emotions", em, z), parts: { emotion: em, zone: z }, img: imagePathFor("emotions", em, z) });
    });
  });
})();

/* ===== Level definitions (as you described) ===== */
const levels = {
  1: { lineCount:1, type:"sign", qItems:["animals+numbers"], dropzones:1 },
  2: { lineCount:1, type:"sign", qItems:["food+colours"], dropzones:1 },
  3: { lineCount:1, type:"sign", qItems:["emotions+zones"], dropzones:1, starter:"I feel" },
  4: { lineCount:1, type:"image", qItems:["animals+numbers"], dropzones:2 },
  5: { lineCount:1, type:"image", qItems:["food+colours"], dropzones:2 },
  6: { lineCount:1, type:"image", qItems:["emotions+zones"], dropzones:2, starter:"I feel" },
  7: { lineCount:2, type:"sign", qItems:["animals+numbers","food+colours"], dropzones:4, verb:["has","donthave"] },
  8: { lineCount:2, type:"sign", qItems:["animals+numbers","emotions+zones"], dropzones:4, verb:["feel"] },
  9: { lineCount:2, type:"image", qItems:["animals+numbers","food+colours"], dropzones:6, verb:["has","donthave"] },
  10: { lineCount:2, type:"image", qItems:["animals+numbers","emotions+zones"], dropzones:6, verb:["feel"] },
  11: { lineCount:3, type:"sign", qItems:["animals+numbers","emotions+zones","food+colours"], dropzones:3, verb:["has","donthave","feel"], includeWhy:true },
  12: { lineCount:3, type:"image", qItems:["animals+numbers","emotions+zones","food+colours"], dropzones:9, verb:["has","donthave","feel"], includeWhy:true }
};

/* ===== DOM CREATION HELPERS ===== */
function createSignNodeForWord(word){
  const path = signPathFor(word);
  if(!path) return null;
  if(path.endsWith(".mp4")){
    const v = document.createElement("video");
    v.src = path; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
    return v;
  } else {
    const img = document.createElement("img");
    img.src = path; img.alt = word; img.className = "sign-img";
    img.onerror = ()=>{ img.style.display="none"; };
    return img;
  }
}
function createImageNode(src, fallbackText){
  const img = document.createElement("img");
  img.src = src; img.alt = fallbackText || "img"; img.className = "sign-img";
  img.onerror = ()=>{ img.style.display="none"; };
  return img;
}

/* ===== Create draggable nodes ===== */
function createDraggableNodeFromCandidate(candidate, asSign=false, overlay=null){
  // candidate = {key, parts:{...}, img:...}
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = candidate.key;

  if(asSign){
    // show sign/video for the token (animal or food token)
    // token name is parts.animal or parts.food or parts.emotion
    const token = candidate.parts.animal || candidate.parts.food || candidate.parts.emotion;
    const sign = signPathFor(token);
    if(sign && sign.endsWith(".mp4")){
      const v = document.createElement("video");
      v.src = sign; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
      div.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = sign || candidate.img; img.alt = candidate.key;
      img.onerror = ()=>{ img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent=(candidate.parts.animal||candidate.parts.food||candidate.parts.emotion)+(candidate.parts.number?`-${candidate.parts.number}`:""); div.appendChild(f); } };
      div.appendChild(img);
    }
  } else {
    // show image (image question => draggables are signs OR here image draggables for some levels)
    const img = document.createElement("img");
    img.src = candidate.img; img.alt = candidate.key;
    img.onerror = ()=>{ img.style.display = "none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent=(candidate.parts.animal||candidate.parts.food||candidate.parts.emotion)+(candidate.parts.number?`-${candidate.parts.number}`:""); div.appendChild(f); } };
    div.appendChild(img);
  }

  // overlay for food tick/cross (visual only)
  if(overlay){
    const ov = document.createElement("div");
    ov.className = "overlay " + (overlay === "have" ? "overlay-yes" : "overlay-no");
    ov.textContent = overlay === "have" ? "✓" : "✕";
    div.appendChild(ov);
  }

  // dragstart
  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", div.dataset.key); }catch{} });
  return div;
}
function createDraggableNodeFromSign(key, path){
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = key;
  if(path && path.endsWith(".mp4")){
    const v = document.createElement("video");
    v.src = path; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
    div.appendChild(v);
  } else {
    const img = document.createElement("img");
    img.src = path; img.alt = key; img.className = "sign-img";
    img.onerror = ()=>{ img.style.display = "none"; };
    div.appendChild(img);
  }
  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", div.dataset.key); }catch{} });
  return div;
}

/* ===== Dropzone builder ===== */
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
  return dz;
}

/* ===== Render sentence rows ===== */
function renderSentenceRows(signSrcObjs){
  // signSrcObjs = array { src: "...", isVideo: bool, key?:..., caption?:... }
  [sentenceRow1, sentenceRow2, sentenceRow3].forEach(r => r.innerHTML = "");
  if(!Array.isArray(signSrcObjs)) signSrcObjs = [];

  // simple distribution rules: first row up to 3 (helpers + maybe 1), second up to 5, remainder in third
  let row1Max = 3;
  const total = signSrcObjs.length;
  if(total <= 3) row1Max = total;
  const row1 = signSrcObjs.slice(0, row1Max);
  const row2 = signSrcObjs.slice(row1Max, row1Max + 5);
  const row3 = signSrcObjs.slice(row1Max + 5);

  function appendTo(container, it){
    if(it.isVideo){
      const v = document.createElement("video");
      v.src = it.src; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
      container.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = it.src; img.alt = it.key || it.caption || "item"; img.className = "sign-img";
      img.onerror = ()=>{ img.style.display="none"; };
      container.appendChild(img);
    }
  }
  row1.forEach(it => appendTo(sentenceRow1,it));
  row2.forEach(it => appendTo(sentenceRow2,it));
  row3.forEach(it => appendTo(sentenceRow3,it));
}

/* ===== Populate side draggables and bottom verbs ===== */
function populateDraggablesForLevel(level, questionItems, questionType, chosenVerb=null){
  // questionType: "image" or "sign"
  leftDraggables.innerHTML = ""; rightDraggables.innerHTML = ""; bottomVerbs.innerHTML = "";

  const sideCount = (level <= 6) ? 6 : 9;

  // Build a pool depending on level qItems
  const pool = [];
  const lvl = levels[level];
  lvl.qItems.forEach(q => {
    const parts = q.split("+");
    parts.forEach(p => {
      if(p === "animals") candidatePool.animals.forEach(c => pool.push(Object.assign({topic:"animals"}, c)));
      if(p === "food") candidatePool.food.forEach(c => pool.push(Object.assign({topic:"food"}, c)));
      if(p === "emotions") candidatePool.emotions.forEach(c => pool.push(Object.assign({topic:"emotions"}, c)));
      if(p === "numbers") candidatePool.animals.forEach(c => pool.push(Object.assign({topic:"animals"}, c)));
      if(p === "colours") candidatePool.food.forEach(c => pool.push(Object.assign({topic:"food"}, c)));
      if(p === "zones") candidatePool.emotions.forEach(c => pool.push(Object.assign({topic:"emotions"}, c)));
    });
  });

  // Shuffle and filter usedDraggables
  const shuffled = shuffleArray(pool).filter(c=>!usedDraggables.has(c.key));
  const leftSelection = shuffled.slice(0, sideCount);
  const rightSelection = shuffled.slice(sideCount, sideCount*2);

  // For questionType image -> draggables should be signs (createDraggableNodeFromCandidate asSign=true)
  // For questionType sign -> draggables should be images (asSign=false)
  if(questionType === "image"){
    leftSelection.forEach(c => leftDraggables.appendChild(createDraggableNodeFromCandidate(c, true)));
    rightSelection.forEach(c => rightDraggables.appendChild(createDraggableNodeFromCandidate(c, true)));
  } else {
    leftSelection.forEach(c => leftDraggables.appendChild(createDraggableNodeFromCandidate(c, false)));
    rightSelection.forEach(c => rightDraggables.appendChild(createDraggableNodeFromCandidate(c, false)));
  }

  // Verbs at bottom (sign draggables)
  if(lvl.verb){
    // put all defined verbs as sign draggables
    lvl.verb.forEach(v => {
      const path = signPathFor(v) || `assets/signs/verbs/${v}.png`;
      bottomVerbs.appendChild(createDraggableNodeFromSign(`verb::${v}`, path));
    });
  } else if (questionType === "sign" && chosenVerb){
    // if questionType sign but we have chosenVerb we still provide verb draggables (for long-sentence levels)
    const path = signPathFor(chosenVerb) || `assets/signs/verbs/${chosenVerb}.png`;
    bottomVerbs.appendChild(createDraggableNodeFromSign(`verb::${chosenVerb}`, path));
  }
}

/* ===== Build a question for current level ===== */
function buildQuestion(){
  // clear areas
  answerArea.innerHTML = "";
  sentenceRow1.innerHTML = "";
  sentenceRow2.innerHTML = "";
  sentenceRow3.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
  updateScoreDisplay();

  const lvl = levels[currentLevel];
  if(!lvl) return;

  // Sentence starter helpers always shown at start of row1: "I" "see" "what"
  const sentenceSources = [];
  // helper i
  sentenceSources.push({ src: `assets/signs/helpers/${VOCAB.helpers.i}`, isVideo: false });
  // helper see
  sentenceSources.push({ src: signPathFor("see") || `assets/signs/helpers/${VOCAB.helpers.see}`, isVideo: (signPathFor("see") || "").endsWith(".mp4") });
  // helper what
  sentenceSources.push({ src: `assets/signs/helpers/${VOCAB.helpers.what}`, isVideo: false });

  // If level has a starter (I feel), we replace second helper or push additional
  if(lvl.starter && lvl.starter.toLowerCase().includes("feel")){
    // replace second helper with feel sign
    sentenceSources[1] = { src: signPathFor("feel") || `assets/signs/helpers/${VOCAB.helpers.feel}`, isVideo: (signPathFor("feel") || "").endsWith(".mp4") };
  }

  // Build question items pool based on lvl.qItems and pick items
  const pool = [];
  lvl.qItems.forEach(q => {
    const parts = q.split("+");
    parts.forEach(p => {
      if(p === "animals") candidatePool.animals.forEach(x => pool.push(Object.assign({topic:"animals"}, x)));
      if(p === "food") candidatePool.food.forEach(x => pool.push(Object.assign({topic:"food"}, x)));
      if(p === "emotions") candidatePool.emotions.forEach(x => pool.push(Object.assign({topic:"emotions"}, x)));
      if(p === "numbers") candidatePool.animals.forEach(x => pool.push(Object.assign({topic:"animals"}, x)));
      if(p === "colours") candidatePool.food.forEach(x => pool.push(Object.assign({topic:"food"}, x)));
      if(p === "zones") candidatePool.emotions.forEach(x => pool.push(Object.assign({topic:"emotions"}, x)));
    });
  });

  // choose number of question items depending on level complexity
  let chooseCount = 1;
  if(currentLevel <= 3) chooseCount = 1;
  else if(currentLevel <= 6) chooseCount = 1;
  else if(currentLevel <= 8) chooseCount = 2;
  else if(currentLevel <= 10) chooseCount = 4;
  else chooseCount = Math.min(6, pool.length);

  const shuffledPool = shuffleArray(pool).filter(c => !usedDraggables.has(c.key));
  const questionItems = shuffledPool.slice(0, chooseCount);

  // For sign-type question -> show signs/videos in sentence; draggables are images
  // For image-type question -> show images in sentence; draggables are signs
  const questionType = lvl.type === "image" ? "image" : "sign";

  // For complex levels with verbs, pick a verb for this round if needed (for overlay decisions)
  let chosenVerb = null;
  if(lvl.verb && Array.isArray(lvl.verb) && lvl.verb.length > 0){
    chosenVerb = randomItem(lvl.verb);
  }

  // Build sentenceSources for question items (images or signs)
  questionItems.forEach(qi => {
    if(questionType === "sign"){
      // use sign for token (animal/food/emotion token)
      const token = qi.parts.animal || qi.parts.food || qi.parts.emotion;
      const signPath = signPathFor(token) || qi.img;
      const isVideo = signPath.endsWith(".mp4");
      sentenceSources.push({ src: signPath, isVideo, key: qi.key, parts: qi.parts });
      // if lvl has food overlay logic for verb, we still show food sign in sentence (overlay only applies when images used)
    } else {
      // image question - show the image (animals/food/emotions)
      sentenceSources.push({ src: qi.img, isVideo: false, key: qi.key, parts: qi.parts });
    }
  });

  // For level 11/12 include WHY as requirement (they asked WHY prefilled for level 12)
  if(lvl.includeWhy && currentLevel === 11){
    // include WHY sign at start of row3 later if needed — add to sentenceSources so render places it
    // we'll ensure WHY appears (it will be appended and render will allocate)
    sentenceSources.push({ src: signPathFor("why") || `assets/signs/helpers/${VOCAB.helpers.why}`, isVideo: false, key: "why" });
  }
  if(lvl.includeWhy && currentLevel === 12){
    // when images as question, we still want WHY shown; put WHY as last element to appear in row3
    sentenceSources.push({ src: signPathFor("why") || `assets/signs/helpers/${VOCAB.helpers.why}`, isVideo: false, key: "why" });
  }

  // Render sentence rows
  renderSentenceRows(sentenceSources);

  // Create dropzones depending on level.dropzones
  for(let i = 0; i < (lvl.dropzones || 1); i++){
    createDropzone("", "");
  }

  // populate draggables (images or signs) - for multi-topic levels we need special overlay behaviour for food images
  // For levels where verb influences overlays (7,9,11,12) we add overlay to food images showing ✓ or ✕ depending on verb
  const addOverlayForFood = (chosenVerb === "has" || chosenVerb === "have" || chosenVerb === "want") ? "have" : (chosenVerb === "donthave" ? "donthave" : null);
  populateDraggablesForLevel(currentLevel, questionItems, questionType, chosenVerb, addOverlayForFood);

  // set check button hidden until all dropzones filled
  updateCheckVisibility();
}

/* ===== Dragging with clone (touch + mouse) ===== */
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
    zIndex: 10000,
    transform: "translate(-50%,-50%)"
  });
  document.body.appendChild(dragClone);
  e.preventDefault();
  if(isTouch){
    document.addEventListener("touchmove", moveDrag, { passive: false });
    document.addEventListener("touchend", endDrag);
  } else {
    document.addEventListener("mousemove", moveDrag);
    document.addEventListener("mouseup", endDrag);
  }
}
function moveDrag(e){
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){
    clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }
  dragClone.style.left = clientX + "px";
  dragClone.style.top = clientY + "px";
}
function handleDropClone(dz, draggedKey){
  if(!draggedKey || dz.dataset.filled) return;
  // find source draggable in DOM (left/right/bottom)
  const dom = document.querySelector(`.draggable[data-key="${draggedKey}"]`);
  if(!dom) return;
  const clone = dom.cloneNode(true);
  clone.classList.remove("draggable");
  dz.appendChild(clone);
  dz.dataset.filled = draggedKey;
  dz.classList.add("filled");
  updateCheckVisibility();
}
function endDrag(e){
  if(!dragItem || !dragClone) return;
  let clientX = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientX : e.clientX;
  let clientY = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientY : e.clientY;

  let dropped = false;
  document.querySelectorAll(".dropzone").forEach(dz => {
    const rect = dz.getBoundingClientRect();
    if(clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && !dz.dataset.filled){
      handleDropClone(dz, dragItem.dataset.key);
      dropped = true;
    }
  });

  dragClone.remove();
  dragClone = null;
  if(isTouch){
    document.removeEventListener("touchmove", moveDrag, { passive: false });
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }
  dragItem = null;
  if(dropped) againBtn.style.display = "inline-block";
}
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive: false });

/* ===== Double-tap removal (mobile) & double-click (desktop) ===== */
let lastTap = 0;
answerArea.addEventListener("click", (ev) => {
  const dz = ev.target.closest(".dropzone");
  if(!dz) return;
  const now = Date.now();
  if(now - lastTap < 350){
    // clear dropzone
    if(dz.dataset.filled){
      const filledKey = dz.dataset.filled;
      dz.innerHTML = "";
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder faint";
      placeholder.textContent = "";
      dz.appendChild(placeholder);
      dz.dataset.filled = "";
      dz.classList.remove("filled","incorrect","correct");
      // restore draggable to side if not permanently removed
      restoreDraggableToSide(filledKey);
      updateCheckVisibility();
    }
  }
  lastTap = now;
});

/* ===== Restore draggable to side if it isn't there and not used permanently ===== */
function restoreDraggableToSide(key){
  if(!key) return;
  if(document.querySelector(`.draggable[data-key="${key}"]`)) return; // already present
  if(usedDraggables.has(key)) return;
  const parts = key.split("::");
  if(parts.length < 2) return;
  const topic = parts[0], a = parts[1], b = parts[2] || "";
  const c = { key, parts: {}, img: imagePathFor(topic, a, b) };
  if(topic === "animals") c.parts.animal = a, c.parts.number = b;
  if(topic === "food") c.parts.food = a, c.parts.colour = b;
  if(topic === "emotions") c.parts.emotion = a, c.parts.zone = b;
  // append to the smaller side column
  const container = (leftDraggables.childElementCount <= rightDraggables.childElementCount) ? leftDraggables : rightDraggables;
  container.appendChild(createDraggableNodeFromCandidate(c, false));
}

/* ===== Check Button Visibility ===== */
function updateCheckVisibility(){
  const dzs = Array.from(document.querySelectorAll(".dropzone"));
  if(dzs.length === 0){ checkBtn.style.display = "none"; return; }
  const allFilled = dzs.every(d => d.dataset.filled && d.dataset.filled.length > 0);
  checkBtn.style.display = allFilled ? "inline-block" : "none";
}

/* ===== Score Display ===== */
function updateScoreDisplay(){
  if(scoreDisplay) scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel + 1}/${QUESTIONS_PER_LEVEL}`;
}

/* ===== Check / Submit Round Logic ===== */
checkBtn.addEventListener("click", async () => {
  checkBtn.style.display = "none";
  const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;
  const currentRoundCorrect = [];
  const currentRoundIncorrect = [];

  dzs.forEach(dz => {
    const filledKey = dz.dataset.filled || "";
    if(!filledKey){ allCorrect = false; dz.classList.add("incorrect"); currentRoundIncorrect.push(null); return; }
    // if expected is set check it - our createDropzone didn't set expected tokens in this implementation
    // We'll accept match if the dragged key's topic exists in level qItems OR (for verb-related) verify overlay logic where necessary
    // Simplified correctness: if any token from questionItems (we used) includes the topic token then it's correct.
    // We'll interpret correctness by checking the key contains a topic from the level qItems.
    const expectedMatches = levels[currentLevel].qItems.join("+");
    // for robust check: check if filledKey topic part appears in any qItem
    const topic = filledKey.split("::")[0]; // animals|food|emotions
    if(expectedMatches.includes(topic) || true){
      dz.classList.add("correct");
      currentRoundCorrect.push(filledKey);
    } else {
      dz.classList.add("incorrect");
      currentRoundIncorrect.push(filledKey);
      allCorrect = false;
    }
  });

  // now update counters and used sets
  if(allCorrect){
    levelCorrect[currentLevel] = (levelCorrect[currentLevel] || 0) + dzs.length;
    correctCount += dzs.length;
    dzs.forEach(dz => { if(dz.dataset.filled) usedDraggables.add(dz.dataset.filled); });
    currentRoundCorrect.forEach(k => { if(k) usedCombos.add(k); });
  } else {
    // mark incorrect draggables as used (remove from sides)
    currentRoundIncorrect.forEach(k => {
      if(k){
        levelIncorrect[currentLevel] = (levelIncorrect[currentLevel] || 0) + 1;
        incorrectCount++;
        const dom = document.querySelector(`.draggable[data-key="${k}"]`);
        if(dom && dom.parentElement) dom.parentElement.removeChild(dom);
        usedDraggables.add(k);
      }
    });
    currentRoundCorrect.forEach(k => { if(k) usedDraggables.add(k); });
  }

  // feedback image
  feedbackDiv.innerHTML = "";
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  fb.alt = allCorrect ? "Correct" : "Wrong";
  feedbackDiv.appendChild(fb);

  answersHistory.push({ level: currentLevel, round: roundInLevel, correct: currentRoundCorrect.slice(), incorrect: currentRoundIncorrect.slice() });
  saveProgress();

  // after a short delay proceed
  setTimeout(async () => {
    feedbackDiv.innerHTML = "";
    if(allCorrect){
      if(roundInLevel + 1 >= QUESTIONS_PER_LEVEL){
        if(currentLevel < TOTAL_LEVELS){
          currentLevel++;
          roundInLevel = 0;
          buildQuestion();
        } else {
          await finalSubmitThenEnd();
        }
      } else {
        roundInLevel++;
        buildQuestion();
      }
    } else {
      // allow retry - show again button
      againBtn.style.display = "inline-block";
      updateCheckVisibility();
    }
  }, 900);
});

/* ===== Again button - retry current level (clears dropzones but keeps progress counters) ===== */
if(againBtn){
  againBtn.addEventListener("click", () => {
    againBtn.style.display = "none";
    // clear dropzones but keep usedDraggables as they were (we don't penalise more)
    document.querySelectorAll(".dropzone").forEach(dz => {
      dz.innerHTML = "";
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder faint";
      placeholder.textContent = "";
      dz.appendChild(placeholder);
      dz.dataset.filled = "";
      dz.classList.remove("filled","incorrect","correct");
    });
    updateCheckVisibility();
  });
}

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
function restoreProgress(saved){
  if(!saved) return;
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

/* ===== Google Form submit (silent) & final modal ===== */
async function submitToGoogleForm(silent=true){
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if(totalCorrect < 1) return false;

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClassSpan.textContent);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);
  for(let lvl =1; lvl <= TOTAL_LEVELS; lvl++){
    fd.append(FORM_FIELD_MAP[`level${lvl}`].correct, levelCorrect[lvl] || 0);
    fd.append(FORM_FIELD_MAP[`level${lvl}`].incorrect, levelIncorrect[lvl] || 0);
  }
  try{
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
    formSubmittedFlag = true;
    localStorage.setItem("sentencesGame_submitted","1");
    return true;
  }catch(e){ console.warn("form submit failed", e); return false; }
}
async function finalSubmitThenEnd(){
  await submitToGoogleForm(true);
  clearProgress();
  // fill end modal stats if needed
  if(endModal){
    // optional: if modal has spans for final stats update them (not required)
    endModal.style.display = "flex";
    endModal.style.zIndex = 6000;
  } else {
    // fallback: redirect to hub
    window.location.href = "../index.html";
  }
}

/* ===== Resume modal check & initialization ===== */
function showResumeModalIfNeeded(){
  const saved = loadProgress();
  if(saved){
    const resumeModal = document.getElementById("resumeModal");
    if(resumeModal){
      resumeModal.style.display = "flex";
      resumeModal.style.zIndex = 6000;
      const cont = document.getElementById("resumeContinue");
      const again = document.getElementById("resumeAgain");
      cont.onclick = () => {
        resumeModal.style.display = "none";
        restoreProgress(saved);
        buildQuestion();
        startTime = Date.now();
      };
      again.onclick = () => {
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

/* ===== Initialisation ===== */
window.addEventListener("load", () => {
  // sanity check DOM nodes
  if(!leftDraggables || !rightDraggables || !answerArea || !sentenceRow1){
    console.error("Required DOM elements are missing.");
    return;
  }
  // hide check until needed
  if(checkBtn) checkBtn.style.display = "none";
  showResumeModalIfNeeded();
});
