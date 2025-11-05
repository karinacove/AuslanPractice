/* ===== script.js - Full rebuilt version ===== */

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

/* ===== DOM ELEMENTS (match HTML) ===== */
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
const stopBtn = document.getElementById("stopBtn");
const endModal = document.getElementById("endModal");
const googleForm = document.getElementById("googleForm");
const resumeModal = document.getElementById("resumeModal");
const resumeContinue = document.getElementById("resumeContinue");
const resumeAgain = document.getElementById("resumeAgain");
const stopModal = document.getElementById("stopModal");
const stopPercent = document.getElementById("stopPercent");
const stopContinue = document.getElementById("continueBtn");
const stopAgain = document.getElementById("againBtnStop");
const stopFinish = document.getElementById("finishBtnStop");

/* ===== GAME STATE ===== */
const SAVE_KEY = "sentencesGameSave_v2";
let currentLevel = 1;        // 1..12
let roundInLevel = 0;        // 0..9
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

/* ===== Sign path helper (matches your assets structure) ===== */
function signPathFor(word){
  if (!word) return "";
  if (VOCAB.topics.animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (VOCAB.topics.food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (VOCAB.topics.emotions.includes(word)) return `assets/signs/emotions/sign-${word}.mp4`;
  if (VOCAB.numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (VOCAB.colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (VOCAB.zones.includes(word)) return `assets/signs/zones/${word}-sign.png`;
  if (VOCAB.verbs.includes(word)) return `assets/signs/verbs/${word}.png`;
  if (Object.keys(VOCAB.helpers).includes(word)) return `assets/signs/helpers/${VOCAB.helpers[word]}`;
  return "";
}

/* ===== Level config (keeps original plan + your later adjustments) ===== */
const levels = {
  1: {lineCount:1, type:"sign", qItems:["animals+numbers"],      dropCount:1},   // sign Q, images draggable
  2: {lineCount:1, type:"sign", qItems:["food+colours"],        dropCount:1},
  3: {lineCount:1, type:"sign", qItems:["emotions+zones"],      dropCount:1, starter: "feel"},
  4: {lineCount:1, type:"image", qItems:["animals+numbers"],    dropCount:2},   // image Q, sign draggables (split)
  5: {lineCount:1, type:"image", qItems:["food+colours"],       dropCount:2},
  6: {lineCount:1, type:"image", qItems:["emotions+zones"],     dropCount:2, starter: "feel"},
  7: {lineCount:2, type:"sign", qItems:["animals+numbers","food+colours"],    dropCount:2, verb:["has","donthave"]},
  8: {lineCount:2, type:"sign", qItems:["animals+numbers","emotions+zones"],  dropCount:2, verb:["feel"]},
  9: {lineCount:2, type:"image", qItems:["animals+numbers","food+colours"],   dropCount:5, verb:["has","donthave"]},
  10:{lineCount:2, type:"image", qItems:["animals+numbers","emotions+zones"], dropCount:5, verb:["feel"]},
  11:{lineCount:3, type:"sign", qItems:["animals+numbers","emotions+zones","food+colours"], dropCount:3, verb:["feel","has","donthave"], prefillWhy:true},
  12:{lineCount:3, type:"image", qItems:["animals+numbers","emotions+zones","food+colours"], dropCount:9, verb:["feel","has","donthave"], prefillWhy:true}
};

/* ===== Candidate pools (images combos) ===== */
const candidatePool = { animals: [], food: [], emotions: [] };
(function buildCandidatePools(){
  VOCAB.topics.animals.forEach(a=>{
    VOCAB.numbers.forEach(n=>{
      candidatePool.animals.push({ key:`animals::${a}::${n}`, parts:{animal:a,number:n}, img:`assets/images/animals/${a}-${n}.png` });
    });
  });
  VOCAB.topics.food.forEach(f=>{
    VOCAB.colours.forEach(c=>{
      candidatePool.food.push({ key:`food::${f}::${c}`, parts:{food:f,colour:c}, img:`assets/images/food/${f}-${c}.png` });
    });
  });
  VOCAB.topics.emotions.forEach(e=>{
    VOCAB.zones.forEach(z=>{
      candidatePool.emotions.push({ key:`emotions::${e}::${z}`, parts:{emotion:e,zone:z}, img:`assets/images/emotions/${e}-${z}.png` });
    });
  });
})();

/* ===== Render sentence rows (helpers + question items) ===== */
function renderSentenceRows(signs){
  if(!sentenceRow1||!sentenceRow2||!sentenceRow3) return;
  [sentenceRow1,sentenceRow2,sentenceRow3].forEach(r=>r.innerHTML="");
  if(!Array.isArray(signs)) return;

  // distribute logically across three rows
  const total = signs.length;
  let row1Count = Math.min(3, total);
  if(total <= 5) row1Count = total;
  const row1 = signs.slice(0, row1Count);
  const rest = signs.slice(row1Count);
  const row2Count = Math.min(5, rest.length);
  const row2 = rest.slice(0, row2Count);
  const row3 = rest.slice(row2Count);

  function appendTo(container, item){
    if(item.isVideo){
      const v = document.createElement("video");
      v.src = item.src; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className="sign-video";
      container.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = item.src; img.alt = item.key || ""; img.className="sign-img";
      // fallback: if image 404, show text
      img.onerror = () => { img.style.display="none"; if(!container.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = item.fallbackText || ""; container.appendChild(f); } };
      container.appendChild(img);
    }
  }

  row1.forEach(it=>appendTo(sentenceRow1, it));
  row2.forEach(it=>appendTo(sentenceRow2, it));
  row3.forEach(it=>appendTo(sentenceRow3, it));
}

/* ===== Create draggable nodes (image or sign/video) ===== */
function createDraggableNodeFromCandidate(c, asSign=false, overlay=null){
  const div = document.createElement("div");
  div.className = "draggable";
  div.draggable = true;
  div.dataset.key = c.key;
  div.dataset.img = c.img || "";

  if(asSign){
    // show sign for the main token (use token from key)
    const parts = c.key.split("::");
    const token = parts[1];
    const path = signPathFor(token) || c.img;
    if(path.endsWith(".mp4")){
      const v = document.createElement("video");
      v.src = path; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.className = "sign-video";
      div.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = path; img.alt = c.key;
      img.onerror = ()=>{ img.style.display="none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent=(c.parts.animal||c.parts.food||c.parts.emotion)||token; div.appendChild(f); } };
      div.appendChild(img);
    }
  } else {
    // show image (food/animal/emotion)
    const img = document.createElement("img");
    img.src = c.img; img.alt = c.key;
    img.onerror = ()=>{ img.style.display="none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent=(c.parts.animal||c.parts.food||c.parts.emotion) + (c.parts.number?`-${c.parts.number}`:""); div.appendChild(f); } };
    div.appendChild(img);

    // overlay (tick or cross) for levels where verb requires it - represented visually only (not saved)
    if(overlay === "have" || overlay === "donthave"){
      const ov = document.createElement("div");
      ov.className = "overlay " + (overlay === "have" ? "have" : "donthave");
      ov.textContent = (overlay === "have") ? "✓" : "✕";
      div.appendChild(ov);
    }
  }

  // dragstart sets dataTransfer
  div.addEventListener("dragstart", e => { try{ e.dataTransfer.setData("text/plain", div.dataset.key); }catch{} });
  return div;
}

/* ===== Create draggable simple sign (verbs/helpers) ===== */
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
    img.src = path || ""; img.alt = key;
    img.onerror = ()=>{ img.style.display="none"; if(!div.querySelector(".fallback")){ const f=document.createElement("div"); f.className="fallback"; f.textContent = key; div.appendChild(f); } };
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
  const ph = document.createElement("div");
  ph.className = "placeholder faint";
  ph.textContent = placeholderText || "";
  dz.appendChild(ph);
  answerArea.appendChild(dz);
  return dz;
}

/* ===== Restore draggable to side if removed (rebuild from key) ===== */
function restoreDraggableToSide(key){
  if(!key) return;
  if(document.querySelector(`.draggable[data-key="${key}"]`)) return;
  if(usedDraggables.has(key)) return;
  const parts = key.split("::");
  if(parts.length < 2) return;
  const topic = parts[0], a = parts[1], b = parts[2] || "";
  const c = { key, parts: {}, img: `assets/images/${topic}/${a}${b?'-'+b:''}.png` };
  if(topic === "animals"){ c.parts.animal = a; c.parts.number = b; }
  if(topic === "food"){ c.parts.food = a; c.parts.colour = b; }
  if(topic === "emotions"){ c.parts.emotion = a; c.parts.zone = b; }
  // append to the shorter side
  const container = (leftDraggables && rightDraggables && leftDraggables.childElementCount <= rightDraggables.childElementCount) ? leftDraggables : rightDraggables;
  if(container) container.appendChild(createDraggableNodeFromCandidate(c,false));
}

/* ===== Populate draggables for a level =====
   - For sign questions => draggables are images (animals/food/emotion images)
   - For image questions => draggables are signs (sign files)
   - Left/Right counts: levels 1-6 => 6 each, 7-12 => 9 each
   - Verbs always placed at bottom container as sign draggables
*/
function populateDraggablesForLevel(level, questionItems, questionType, verbList){
  if(!leftDraggables || !rightDraggables || !bottomVerbs) return;
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  bottomVerbs.innerHTML = "";

  const sideCount = (level <= 6) ? 6 : 9;

  // Build a pool from the level qItems (use candidatePool)
  const pool = [];
  levels[level].qItems.forEach(q=>{
    q.split("+").forEach(p=>{
      if(p === "animals") candidatePool.animals.forEach(x=>pool.push(Object.assign({topic:"animals"}, x)));
      if(p === "food") candidatePool.food.forEach(x=>pool.push(Object.assign({topic:"food"}, x)));
      if(p === "emotions") candidatePool.emotions.forEach(x=>pool.push(Object.assign({topic:"emotions"}, x)));
      if(p === "numbers") candidatePool.animals.forEach(x=>pool.push(Object.assign({topic:"animals"}, x)));
      if(p === "colours") candidatePool.food.forEach(x=>pool.push(Object.assign({topic:"food"}, x)));
      if(p === "zones") candidatePool.emotions.forEach(x=>pool.push(Object.assign({topic:"emotions"}, x)));
    });
  });

  // Shuffle and pick 2*sideCount candidates if possible
  const shuffled = shuffleArray(pool).filter(c=>!usedDraggables.has(c.key));
  const leftSelection = shuffled.slice(0, sideCount);
  const rightSelection = shuffled.slice(sideCount, sideCount*2);

  if(questionType === "image"){
    // question shows images => we want sign draggables (show sign/video for token)
    leftSelection.forEach(c => leftDraggables.appendChild(createDraggableNodeFromCandidate(c,true)));
    rightSelection.forEach(c => rightDraggables.appendChild(createDraggableNodeFromCandidate(c,true)));
  } else {
    // question shows signs => draggables are images (c.img)
    // For levels 7/9 where verb is 'has'/'donthave' we add overlay on food images if they are part of the pool
    const verbIs = (verbList && verbList.length>0) ? verbList[0] : null;
    leftSelection.forEach(c => {
      let overlay = null;
      if(verbIs && c.topic === "food") overlay = verbIs; // overlay visual only
      leftDraggables.appendChild(createDraggableNodeFromCandidate(c,false,overlay));
    });
    rightSelection.forEach(c => {
      let overlay = null;
      if(verbIs && c.topic === "food") overlay = verbIs;
      rightDraggables.appendChild(createDraggableNodeFromCandidate(c,false,overlay));
    });
  }

  // Verb draggables at bottom (always as signs)
  if(Array.isArray(verbList) && verbList.length){
    verbList.forEach(v => {
      const path = signPathFor(v) || `assets/signs/verbs/${v}.png`;
      bottomVerbs.appendChild(createDraggableNodeFromSign(`verb::${v}`, path));
    });
  }
}

/* ===== Build question (core) ===== */
function buildQuestion(){
  // guard DOM
  if(!sentenceRow1||!sentenceRow2||!sentenceRow3||!answerArea) return;

  // clear UI
  answerArea.innerHTML = "";
  sentenceRow1.innerHTML = "";
  sentenceRow2.innerHTML = "";
  sentenceRow3.innerHTML = "";
  feedbackDiv && (feedbackDiv.innerHTML = "");
  checkBtn && (checkBtn.style.display = "none");
  againBtn && (againBtn.style.display = "none");
  updateScoreDisplay();

  const lvl = levels[currentLevel];
  if(!lvl) return;

  // helpers always: "I" "see/feel" "what" (or "I see what" / "I feel what")
  const helperImgs = [];
  helperImgs.push({ src: signPathFor("i") || `assets/signs/helpers/${VOCAB.helpers.i}`, isVideo:false, fallbackText:"I" });
  const helperVerb = lvl.starter || (lvl.verb && lvl.verb[0]) || "see";
  const helperVerbPath = signPathFor(helperVerb) || `assets/signs/helpers/${VOCAB.helpers.see}`;
  helperImgs.push({ src: helperVerbPath, isVideo: helperVerbPath.endsWith(".mp4"), fallbackText: helperVerb });
  helperImgs.push({ src: signPathFor("what") || `assets/signs/helpers/${VOCAB.helpers.what}`, isVideo:false, fallbackText:"what" });

  // Determine question items: pick from pool according to desiredCount
  let desiredCount = 1;
  if (currentLevel <= 3) desiredCount = 1;
  else if (currentLevel <= 6) desiredCount = 1;
  else if (currentLevel <= 8) desiredCount = 2;
  else if (currentLevel <= 10) desiredCount = 4;
  else desiredCount = 6;

  // Build pool from qItems
  const pool = [];
  lvl.qItems.forEach(q => {
    q.split("+").forEach(p=>{
      if(p === "animals") candidatePool.animals.forEach(x=>pool.push(Object.assign({topic:"animals"}, x)));
      if(p === "food") candidatePool.food.forEach(x=>pool.push(Object.assign({topic:"food"}, x)));
      if(p === "emotions") candidatePool.emotions.forEach(x=>pool.push(Object.assign({topic:"emotions"}, x)));
    });
  });

  // filter out used combos & shuffle
  const filtered = shuffleArray(pool).filter(c => !usedCombos.has(c.key) && !usedDraggables.has(c.key));
  const questionItems = filtered.slice(0, Math.min(desiredCount, filtered.length));

  // Compose sentence sources: helpers first then question items (if question type is image we show images; if sign, we show sign paths)
  const sentenceSources = [];
  helperImgs.forEach(h => sentenceSources.push(Object.assign({}, h)));

  if(lvl.type === "image"){
    // question displays images
    questionItems.forEach(qi => sentenceSources.push({ src: qi.img, isVideo:false, key: qi.key, fallbackText: (qi.parts.animal||qi.parts.food||qi.parts.emotion) }));
  } else {
    // question displays signs (use signPathFor on a token)
    questionItems.forEach(qi => {
      const token = (qi.key.split("::")[1]) || "";
      const path = signPathFor(token) || qi.img;
      sentenceSources.push({ src: path, isVideo: path.endsWith(".mp4"), key: qi.key, fallbackText: token });
    });
  }

  // Special: level11/12 prefill 'why' on third row if requested
  if(lvl.prefillWhy){
    // add WHY at the end so renderSentenceRows may place it into row3
    sentenceSources.push({ src: signPathFor("why") || `assets/signs/helpers/${VOCAB.helpers.why}`, isVideo:false, fallbackText:"why" });
  }

  // render top sentence rows
  renderSentenceRows(sentenceSources);

  // Create dropzones (answer area) according to level.dropCount or default
  const dropCount = typeof lvl.dropCount === "number" ? lvl.dropCount : 1;
  for(let i=0;i<dropCount;i++){
    createDropzone("", ""); // expected keys left blank — we accept any for now or can set expected later
  }

  // Populate draggables opposite to question type
  populateDraggablesForLevel(currentLevel, questionItems, lvl.type, lvl.verb || []);

  // Update check visibility (none filled initially)
  updateCheckVisibility();
}

/* ===== Drag / Drop (clone) ===== */
let dragItem=null, dragClone=null, isTouch=false;
function startDrag(e){
  const tgt = e.target.closest(".draggable");
  if(!tgt) return;
  dragItem = tgt;
  isTouch = e.type.startsWith("touch");
  const rect = tgt.getBoundingClientRect();
  dragClone = tgt.cloneNode(true);
  dragClone.classList.add("drag-clone");
  Object.assign(dragClone.style,{
    position:"fixed",
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
  else{ clientX = e.clientX; clientY = e.clientY; }
  dragClone.style.left = clientX + "px";
  dragClone.style.top = clientY + "px";
}

function handleDropClone(dz, draggedKey){
  if(!dz || !draggedKey) return;
  if(dz.dataset.filled) return;
  // find original draggable DOM to clone appearance (if image/video)
  const srcDom = document.querySelector(`.draggable[data-key="${draggedKey}"]`);
  let clone;
  if(srcDom) clone = srcDom.cloneNode(true);
  else {
    // fallback small visual
    clone = document.createElement("div"); clone.className="draggable fallback"; clone.textContent=draggedKey;
  }
  clone.classList.remove("draggable");
  dz.appendChild(clone);
  dz.dataset.filled = draggedKey;
  dz.classList.add("filled");
  updateCheckVisibility();
}

function endDrag(e){
  if(!dragItem || !dragClone) return;
  // compute coordinates
  let clientX = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientX : e.clientX;
  let clientY = isTouch && e.changedTouches && e.changedTouches.length>0 ? e.changedTouches[0].clientY : e.clientY;

  let dropped = false;
  document.querySelectorAll(".dropzone").forEach(dz=>{
    const rect = dz.getBoundingClientRect();
    if(clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && !dz.dataset.filled){
      handleDropClone(dz, dragItem.dataset.key);
      dropped = true;
    }
  });

  // cleanup
  dragClone.remove(); dragClone = null;
  if(isTouch){ document.removeEventListener("touchmove", moveDrag, { passive:false }); document.removeEventListener("touchend", endDrag); }
  else { document.removeEventListener("mousemove", moveDrag); document.removeEventListener("mouseup", endDrag); }
  dragItem = null;

  if(dropped && againBtn) againBtn.style.display = "inline-block";
}

/* ===== Double-tap removal (mobile) & double-click on desktop ===== */
let lastTap = 0;
if(answerArea){
  answerArea.addEventListener("click", (ev) => {
    const dz = ev.target.closest(".dropzone");
    if(!dz) return;
    const now = Date.now();
    if(now - lastTap < 350){
      // clear
      if(dz.dataset.filled){
        const filledKey = dz.dataset.filled;
        dz.innerHTML = ""; // remove clone
        const ph = document.createElement("div"); ph.className = "placeholder faint"; ph.textContent = "";
        dz.appendChild(ph);
        dz.dataset.filled = "";
        dz.classList.remove("filled","incorrect","correct");
        restoreDraggableToSide(filledKey);
        updateCheckVisibility();
      }
    }
    lastTap = now;
  });
}

/* attach global listeners */
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive:false });

/* ===== Check button visibility ===== */
function updateCheckVisibility(){
  if(!checkBtn) return;
  const dzs = Array.from(document.querySelectorAll(".dropzone"));
  if(dzs.length === 0){ checkBtn.style.display = "none"; return; }
  const allFilled = dzs.every(d => d.dataset.filled && d.dataset.filled.length > 0);
  checkBtn.style.display = allFilled ? "inline-block" : "none";
}

/* ===== Score display ===== */
function updateScoreDisplay(){
  if(!scoreDisplay) return;
  const percent = (() => {
    const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
    const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
    const total = totalCorrect + totalIncorrect;
    return total > 0 ? Math.round((totalCorrect/total)*100) : 0;
  })();
  scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/${QUESTIONS_PER_LEVEL} — ${percent}%`;
}

/* ===== Check / Submit logic ===== */
if(checkBtn){
  checkBtn.addEventListener("click", async () => {
    checkBtn.style.display = "none";
    const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
    let allCorrect = true;
    const thisRoundCorrect = [];
    const thisRoundIncorrect = [];

    dzs.forEach(dz=>{
      const filled = dz.dataset.filled || "";
      const expected = dz.dataset.expected || "";
      if(!filled){
        dz.classList.add("incorrect");
        allCorrect = false;
        thisRoundIncorrect.push(null);
      } else {
        // simple correctness: if expected specified -> check; otherwise accept
        if(expected){
          if(filled.includes(expected)) { dz.classList.add("correct"); thisRoundCorrect.push(filled); }
          else { dz.classList.add("incorrect"); thisRoundIncorrect.push(filled); allCorrect = false; }
        } else {
          dz.classList.add("correct"); thisRoundCorrect.push(filled);
        }
      }
    });

    // update counters & used sets
    if(allCorrect){
      levelCorrect[currentLevel] = (levelCorrect[currentLevel]||0) + dzs.length;
      correctCount += dzs.length;
      dzs.forEach(dz => { if(dz.dataset.filled) usedDraggables.add(dz.dataset.filled); });
      thisRoundCorrect.forEach(k => { if(k) usedCombos.add(k); });
    } else {
      // mark incorrect items as used (remove from sides)
      thisRoundIncorrect.forEach(k=>{
        if(k){
          levelIncorrect[currentLevel] = (levelIncorrect[currentLevel]||0) + 1;
          incorrectCount++;
          usedDraggables.add(k);
          const dom = document.querySelector(`.draggable[data-key="${k}"]`);
          if(dom && dom.parentElement) dom.parentElement.removeChild(dom);
        }
      });
      // correct ones in this round are considered used
      thisRoundCorrect.forEach(k => { if(k) usedDraggables.add(k); });
    }

    // show feedback image
    if(feedbackDiv){
      feedbackDiv.innerHTML = "";
      const fb = document.createElement("img");
      fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
      fb.alt = allCorrect ? "Correct" : "Wrong";
      feedbackDiv.appendChild(fb);
    }

    answersHistory.push({ level: currentLevel, round: roundInLevel, correct: thisRoundCorrect.slice(), incorrect: thisRoundIncorrect.slice() });
    saveProgress();

    // after short delay advance or allow retry
    setTimeout(async ()=>{
      if(feedbackDiv) feedbackDiv.innerHTML = "";
      if(allCorrect){
        // advance round/level
        if(roundInLevel + 1 >= QUESTIONS_PER_LEVEL){
          // completed level
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
        // show again button to retry
        if(againBtn) againBtn.style.display = "inline-block";
        updateCheckVisibility();
      }
    }, 1000);
  });
}

/* ===== Again button behavior ===== */
if(againBtn){
  againBtn.addEventListener("click", () => {
    // clear current dropzones so student can retry same Q
    document.querySelectorAll(".dropzone").forEach(dz=>{
      dz.innerHTML = ""; const ph = document.createElement("div"); ph.className="placeholder faint"; ph.textContent = ""; dz.appendChild(ph);
      dz.dataset.filled = ""; dz.classList.remove("filled","incorrect","correct");
    });
    againBtn.style.display = "none";
    updateCheckVisibility();
  });
}

/* ===== Stop modal logic ===== */
if(stopBtn){
  stopBtn.addEventListener("click", () => {
    // pause timer
    savedTimeElapsed = getTimeElapsed();
    startTime = null;
    const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
    const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
    const total = totalCorrect + totalIncorrect;
    const percent = total > 0 ? Math.round((totalCorrect/total)*100) : 0;
    if(stopPercent) stopPercent.textContent = `Score so far: ${percent}% — Time: ${getTimeElapsed()}s`;
    if(stopModal) { stopModal.style.display = "flex"; stopModal.style.zIndex = 6000; }
  });
}
if(stopContinue) stopContinue && stopContinue.addEventListener("click", ()=>{
  if(stopModal) stopModal.style.display = "none";
  setTimeElapsed(savedTimeElapsed);
});
if(stopAgain) stopAgain && stopAgain.addEventListener("click", async ()=>{
  if(stopModal) stopModal.style.display = "none";
  await submitToGoogleForm(true);
  usedDraggables.clear(); usedCombos.clear();
  for(let i=1;i<=TOTAL_LEVELS;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
  correctCount = 0; incorrectCount = 0; answersHistory = [];
  currentLevel = 1; roundInLevel = 0;
  setTimeElapsed(0);
  buildQuestion();
});
if(stopFinish) stopFinish && stopFinish.addEventListener("click", async ()=>{
  if(stopModal) stopModal.style.display = "none";
  await submitToGoogleForm(true);
  window.location.href = "../index.html";
});

/* ===== Save / Load / Clear progress ===== */
function saveProgress(){
  const payload = {
    studentName: studentNameSpan ? studentNameSpan.textContent : "",
    studentClass: studentClassSpan ? studentClassSpan.textContent : "",
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

/* ===== Restore progress ===== */
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

/* ===== Google Form submission (silent) ===== */
async function submitToGoogleForm(silent=true){
  if(!googleForm) return false;
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;

  if(totalCorrect < 1) return false; // per spec don't submit if none correct

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentNameSpan ? studentNameSpan.textContent : "");
  fd.append(FORM_FIELD_MAP.class, studentClassSpan ? studentClassSpan.textContent : "");
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

/* ===== Final submit and show end modal ===== */
async function finalSubmitThenEnd(){
  await submitToGoogleForm(true);
  clearProgress();
  // populate final data if elements exist
  const finalTime = document.getElementById("finalTime");
  const finalScore = document.getElementById("finalScore");
  const finalPercent = document.getElementById("finalPercent");
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalIncorrect = Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if(finalTime) finalTime.textContent = getTimeElapsed() + "s";
  if(finalScore) finalScore.textContent = `${totalCorrect} / ${totalAttempts}`;
  if(finalPercent) finalPercent.textContent = `${percent}%`;
  if(endModal){ endModal.style.display = "flex"; endModal.style.zIndex = 6000; }
}

/* ===== Resume modal check and init ===== */
function showResumeModalIfNeeded(){
  const saved = loadProgress();
  if(saved){
    // show resume modal if present
    if(resumeModal){
      resumeModal.style.display = "flex";
      resumeModal.style.zIndex = 6000;
      if(resumeContinue){
        resumeContinue.onclick = ()=>{
          resumeModal.style.display = "none";
          restoreProgress(saved);
          buildQuestion();
          startTime = Date.now();
        };
      }
      if(resumeAgain){
        resumeAgain.onclick = ()=>{
          resumeModal.style.display = "none";
          clearProgress();
          usedDraggables.clear(); usedCombos.clear();
          currentLevel = 1; roundInLevel = 0;
          buildQuestion();
          setTimeElapsed(0);
        };
      }
      return;
    }
  }
  // else start fresh
  setTimeElapsed(0);
  startTime = Date.now();
  buildQuestion();
}

/* ===== On window load init & student checks ===== */
window.addEventListener("load", ()=>{
  // ensure student info present
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";
  if(!studentName || !studentClass){
    alert("Please log in first.");
    // try to redirect if path exists
    try{ window.location.href = "../index.html"; }catch(e){}
    return;
  }
  // populate DOM spans if present
  if(studentNameSpan) studentNameSpan.textContent = studentName;
  if(studentClassSpan) studentClassSpan.textContent = studentClass;

  // wire finish button (if image used as id)
  if(finishBtn) finishBtn.addEventListener("click", ()=>{ window.location.href = "../index.html"; });

  // load progress & show resume or start
  showResumeModalIfNeeded();
});
