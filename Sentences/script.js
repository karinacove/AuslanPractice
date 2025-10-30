/* ===========================
   script.js - Complete Game
   =========================== */

/* ===== CONFIG ===== */
const FORM_FIELD_MAP = {
  name: "entry.1040637824",
  class: "entry.1755746645",
  subject: "entry.1979136660",
  timeTaken: "entry.120322685",
  percent: "entry.1519181393",
  // you provided these earlier — keep them or add more for levels 6..12 if you have them
  level1: { correct: "entry.1150173566", incorrect: "entry.28043347" },
  level2: { correct: "entry.1424808967", incorrect: "entry.352093752" },
  level3: { correct: "entry.475324608", incorrect: "entry.1767451434" },
  level4: { correct: "entry.1405337882", incorrect: "entry.1513946929" },
  level5: { correct: "entry.1234567890", incorrect: "entry.0987654321" }
  // add level6..level12 mapping here if you have them
};

/* ===== DOM Elements (match your HTML) ===== */
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

/* ===== GAME STATE ===== */
const SAVE_KEY = "sentencesGameSave_v1";
let currentLevel = 1;             // 1..12
let questionIndex = 0;            // 0..9 within a level (10 questions)
let totalCorrect = 0;
let totalIncorrect = 0;
let levelCorrect = {};            // counts per level
let levelIncorrect = {};
for (let i=1;i<=12;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }

let startTime = null;
let pausedTimeAccum = 0;         // seconds saved before current start
let running = false;

let currentPair = null; // object describing current sentence and expected answers
let answersHistory = []; // store attempts {level,question,chosen,correct}

let dragItem = null, dragClone = null, isTouch = false;
let lastTap = 0; // for double-tap detection
const DOUBLE_TAP_MS = 350;

/* ===== VOCAB (as you provided) ===== */
const topics = {
  animals: ["dog","cat","mouse","rabbit","fish","bird"],
  food: ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"],
  emotions: ["angry","annoyed","ashamed","bored","confident","confused","danger","disappointed","excited","exhausted","focus","frustrated","happy","jealous","lonely","loved","nervous","pain","proud","relax","sad","scared","shock","shy","sick","silly","stressed","support","surprised","tease","thankful","tired","worried"]
};
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const zones = ["green","blue","yellow","red"];
const verbs = ["have","donthave"];
const helpers = { see: "assets/signs/helpers/see.png", feel: "assets/signs/helpers/feel.png" };

/* ===== HELPERS ===== */
function shuffle(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function nowSeconds(){ return Math.floor(Date.now()/1000); }
function getTimeElapsed(){ return pausedTimeAccum + (startTime ? Math.floor((Date.now()-startTime)/1000) : 0); }
function startTimer(){ if(!startTime){ startTime = Date.now(); } running = true; }
function pauseTimer(){ if(startTime){ pausedTimeAccum = getTimeElapsed(); startTime = null; } running = false; }

/* helper to create <img> with error fallback */
function makeImg(src, alt="img", classes=""){
  const i = document.createElement("img");
  i.src = src;
  i.alt = alt;
  if (classes) i.className = classes;
  i.onerror = ()=>{ i.style.display = "none"; };
  return i;
}

/* build sign path helpers (for signs that live in assets/signs/...) */
function signPathFor(item, typeHint){
  // item can be "dog" "two" "red" etc.
  if (!item) return "";
  if (topics.animals.includes(item)) return `assets/signs/animals/${item}-sign.png`;
  if (topics.food.includes(item)) return `assets/signs/food/${item}-sign.png`;
  if (topics.emotions.includes(item)) return `assets/signs/emotions/sign-${item}.mp4`; // emotion signs are mp4
  if (numbers.includes(item) || /^\d+$/.test(item)) return `assets/signs/numbers/${item}-sign.png`;
  if (colours.includes(item)) return `assets/signs/colours/${item}-sign.png`;
  if (zones.includes(item)) return `assets/signs/zones/${item}.png`;
  if (verbs.includes(item)) return `assets/signs/verbs/${item}.png`;
  if (["i","see","feel","what"].includes(item)) return `assets/signs/helpers/${item}.png`;
  return "";
}

/* image asset path for draggables (left/right image sets) */
/* naming convention examples from you: assets/images/animals/bird-five.png */
function imagePathFor(topic, label){
  // topic = 'animals'/'food'/'emotions'
  // label is e.g. 'bird-five' or 'apple-red' or 'angry-zone-blue'
  // We'll expect stored filenames follow 'name-extra.png' convention; this function simply builds path
  return `assets/images/${topic}/${label}.png`;
}

/* ===== LEVEL / QUESTION GENERATION =====
   We'll create a function that, given currentLevel and questionIndex, generates:
   - the sentence starter (helper sign)
   - the signs to display (one or two)
   - the dropzone setup (1 or 2 dropzones + placeholders)
   - the draggables: left & right arrays of filenames and their values
*/
function makeQuestionFor(level, qIdx){
  // We'll return an object describing the question:
  // { starterSignPath, starterText, signs: [{type:'animal'|'food'|'emotion'|'number'|'colour'|'zone'|'verb', value, signPath}], dropzones: [{placeholder}], leftSet: [{id,label, imgPath}], rightSet: [...] , expected: [value(s)] }
  // We'll cycle through 3 topic groups: animals (1,4,7,10?), food (2,5,8,11?), emotions (3,6,9,12?) per your description you wanted to go back to them all in one game - simpler: levels 1,4,7,10 -> animals base; 2,5,8,11 -> food base; 3,6,9,12 -> emotions base.
  const groupIdx = ((level-1) % 3); // 0 -> animals base, 1 -> food base, 2 -> emotions base
  let baseTopic = groupIdx===0? "animals" : groupIdx===1? "food" : "emotions";
  // helpers: animals->numbers; food->colours; emotions->zones
  let extraPool = groupIdx===0? numbers : groupIdx===1? colours : zones;

  // helper starter: 'see' for animals & food; 'feel' for emotions levels (you specified level3 uses "I feel what?")
  // We'll decide: if baseTopic === 'emotions' then use feel; else use see.
  const starter = (baseTopic === "emotions") ? { text: "I feel what?", sign: helpers.feel } : { text: "I see what?", sign: helpers.see };

  // Setup by level:
  if (level >=1 && level <=3){
    // Level 1/2/3: Sentence starter + two signs shown, answer is single dropzone expecting word1+word2 combo.
    // left/right draggables are images from assets/images/{topic}/...; 6 on left and 6 on right (per your request)
    // We'll pick the correct pair and then add decoys (no duplicates).
    let word1, word2;
    if (baseTopic==="animals"){ word1 = pick(topics.animals); word2 = pick(numbers); }
    else if (baseTopic==="food"){ word1 = pick(topics.food); word2 = pick(colours); }
    else { word1 = pick(topics.emotions); word2 = pick(zones); }

    // expected combo (string)
    const expected = `${word1}-${word2}`;

    // draggables: left and right arrays (6 each)
    // We need at least one draggable that matches expected (we'll build combined filenames to map to asset file names).
    // For animals images the filename might be like 'bird-five' where 'five' corresponds to a number word.
    // We'll generate candidate names for the left/right pools and ensure the correct combo appears among them as one draggable (the answer).
    // For simplicity in our system we will represent draggables by an id string equal to the expected combo or decoy combos.
    const leftPool = []; const rightPool = [];
    // We'll build 6 left / 6 right items where left are topic items and right are extra items, but draggables are single images (you asked assets/images/animals/bird-five.png as a single image)
    // For level 1..3 the draggables will be combined images (topic+extra), we must supply 6 left + 6 right (we'll generate 12 unique combined images, including correct one).
    const combinedCandidates = new Set();
    combinedCandidates.add(expected); // ensure correct included
    // fill with decoys: use random word1 from topic and random word2 from extraPool
    while (combinedCandidates.size < 12){
      const a = baseTopic==="animals"? pick(topics.animals) : baseTopic==="food"? pick(topics.food) : pick(topics.emotions);
      const b = pick(extraPool);
      combinedCandidates.add(`${a}-${b}`);
    }
    const combinedArray = shuffle(Array.from(combinedCandidates));
    // split to 6 left + 6 right
    const leftVals = combinedArray.slice(0,6);
    const rightVals = combinedArray.slice(6,12);
    const leftSet = leftVals.map(v => {
      return { id: v, label: v, imgPath: `assets/images/${baseTopic}/${v}.png` };
    });
    const rightSet = rightVals.map(v => {
      return { id: v, label: v, imgPath: `assets/images/${baseTopic}/${v}.png` };
    });

    // dropzones: one with placeholder "word1+word2"
    const dropzones = [{ placeholder: "word1+word2" }];

    // signs to display under starter: show separate sign images for word1 and word2 (word2 may be number/colour/zone)
    const signs = [
      { type: baseTopic === "emotions" ? "emotion" : baseTopic.slice(0,-1), value: word1, signPath: signPathFor(word1) },
      { type: baseTopic==="animals" ? "number" : baseTopic==="food" ? "colour" : "zone", value: word2, signPath: signPathFor(word2) }
    ];

    return { starter, signs, dropzones, leftSet, rightSet, expected: [expected], levelType: "singleCombo" };
  }

  if (level >=4 && level <=6){
    // Levels 4/5/6 are opposite layout: two dropzones. First is topic clue, second is additional info clue.
    // Left column: topic images (9), Right column: extra info images (9). They are separate images (topic-only vs extra-only).
    // The expected answer: two separate values (word1, word2).
    let word1, word2;
    if (baseTopic==="animals"){ word1 = pick(topics.animals); word2 = pick(numbers); }
    else if (baseTopic==="food"){ word1 = pick(topics.food); word2 = pick(colours); }
    else { word1 = pick(topics.emotions); word2 = pick(zones); }

    const expected = [word1, word2];

    // Build left 9 unique topic images (includes correct word1)
    const topicPool = shuffle((baseTopic==="animals"? topics.animals : baseTopic==="food"? topics.food : topics.emotions).slice());
    const leftVals = (topicPool.indexOf(word1) === -1) ? [word1].concat(topicPool.slice(0,8)) : topicPool.slice(0,9);
    // ensure unique and length 9
    const leftSet = leftVals.slice(0,9).map(w => ({ id: w, label: w, imgPath: `assets/images/${baseTopic}/${w}.png` }));

    // Build right 9 unique extra items (numbers/colours/zones) includes correct word2
    const extraList = shuffle(extraPool.slice());
    const rightVals = (extraList.indexOf(word2) === -1) ? [word2].concat(extraList.slice(0,8)) : extraList.slice(0,9);
    const rightSet = rightVals.slice(0,9).map(w => ({ id: w, label: w, imgPath: `assets/images/${groupIdx===0? "numbers": groupIdx===1? "colours": "zones"}/${w}.png` }));

    // dropzones (two): first placeholder topic, second placeholder extra
    const dropzones = [{ placeholder: baseTopic.slice(0,-1) }, { placeholder: groupIdx===0? "number" : groupIdx===1? "colour" : "zone" }];

    // signs: show the signs at top as in the single case too (two signs)
    const signs = [
      { type: baseTopic === "emotions" ? "emotion" : baseTopic.slice(0,-1), value: word1, signPath: signPathFor(word1) },
      { type: groupIdx===0 ? "number" : groupIdx===1 ? "colour" : "zone", value: word2, signPath: signPathFor(word2) }
    ];

    return { starter, signs, dropzones, leftSet, rightSet, expected, levelType:"twoSeparate" };
  }

  if (level >=7 && level <=10){
    // Level 7 & 9 structure: two part sentences where first dropzones map to animal+number and the second to food+colour with overlay for have/donthave.
    // Level 7: like "join two parts" - left 9 animal+number images, right 9 food+colour images with overlays tick/x
    // Level 8/10 are inverse layouts where sentence starter still at top but dropzones and draggables arranged differently (we treat similarly but with placeholder differences)
    // We'll create: leftSet combined (animal-number), rightSet combined (food-colour with overlay), and expected will be pair [animal-number, food-colour] plus required verb for overlay presence.
    // Choose random elements for answer
    const animal = pick(topics.animals);
    const num = pick(numbers);
    const food = pick(topics.food);
    const colour = pick(colours);
    // randomly assign verb 'have' or 'donthave' to the food+colour side (so overlay tick or x)
    const verbChoice = pick(verbs);

    const expected = [`${animal}-${num}`, `${food}-${colour}`, verbChoice];

    // left combined candidates: make unique combined animal-number values (9)
    const combinedLeft = new Set([ `${animal}-${num}` ]);
    while (combinedLeft.size < 9){
      combinedLeft.add(`${pick(topics.animals)}-${pick(numbers)}`);
    }
    const leftSet = shuffle(Array.from(combinedLeft)).slice(0,9).map(id => ({ id, label:id, imgPath:`assets/images/animals/${id}.png` }));

    // right combined candidates: food-colour (9), include correct with verb overlay data in returned object
    const combinedRight = new Set([ `${food}-${colour}` ]);
    while (combinedRight.size < 9){
      combinedRight.add(`${pick(topics.food)}-${pick(colours)}`);
    }
    const rightSet = shuffle(Array.from(combinedRight)).slice(0,9).map(id => {
      // overlay info for correct item will be used at check time by reading verbChoice
      return { id, label:id, imgPath:`assets/images/food/${id}.png`, overlayVerb: (id === `${food}-${colour}`) ? verbChoice : pick(verbs) };
    });

    // dropzones: two (animal+number target, food+colour target) OR in inverse layouts we still show two but placeholders differ
    const dropzones = [{ placeholder: "animal+number" }, { placeholder: "food+colour" }];

    // signs: the top signs should show verb sign for "have/donthave" in the middle perhaps; your spec asked to include verb sign in top sentence (have/donthave)
    // We'll show a small verb sign in the starter area for Level7 (below starter).
    const signs = [
      { type: "verb", value: verbChoice, signPath: signPathFor(verbChoice) }
    ];

    return { starter, signs, dropzones, leftSet, rightSet, expected, levelType: "combinedHaveDontHave" };
  }

  if (level >=11 && level <=12){
    // Bonus complex rounds - we follow your descriptions roughly:
    // Level11: "I see what?" then below: animal number feel emotion zone why? verb food colour
    // We'll produce leftSet with combined animal-number, middle with combined feel + emotion+zone, bottom verbs and food/colour choices
    // For interface simplicity, we'll still return leftSet and rightSet and 3 dropzones: combined animal-number, emotion-zone, and why-food-colour/verb.
    const animal = pick(topics.animals);
    const num = pick(numbers);
    const emotion = pick(topics.emotions);
    const zone = pick(zones);
    const food = pick(topics.food);
    const colour = pick(colours);
    const verbChoice = pick(verbs);

    const expected = [`${animal}-${num}`, `${emotion}-${zone}`, `${verbChoice}-${food}-${colour}`];

    // left 9 combined animal-number
    const leftCombined = new Set([ `${animal}-${num}` ]);
    while (leftCombined.size < 9) leftCombined.add(`${pick(topics.animals)}-${pick(numbers)}`);
    const leftSet = shuffle(Array.from(leftCombined)).slice(0,9).map(id => ({ id, label:id, imgPath:`assets/images/animals/${id}.png` }));

    // rightSet: mix of emotion-zone & food-colour combos (we'll mix categories but identify by ids)
    const rightCombined = new Set([ `${emotion}-${zone}`, `${food}-${colour}` ]);
    while (rightCombined.size < 9) rightCombined.add(`${pick(topics.emotions)}-${pick(zones)}`);
    while (rightCombined.size < 9) rightCombined.add(`${pick(topics.food)}-${pick(colours)}`);
    const rightSet = shuffle(Array.from(rightCombined)).slice(0,9).map(id => ({ id, label:id, imgPath: `assets/images/${ topics.animals.includes(id.split("-")[0])? "animals": topics.food.includes(id.split("-")[0])? "food" : "emotions"}/${id}.png` }));

    const dropzones = [{ placeholder: "animal+number" }, { placeholder: "emotion+zone" }, { placeholder: "why? verb+food+colour" }];

    const signs = []; // top starter remains

    return { starter, signs, dropzones, leftSet, rightSet, expected, levelType: "bonus" };
  }

  // fallback
  return null;
}

/* ===== UI: render question ===== */
function clearUI(){
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
}

function renderQuestion(){
  clearUI();
  const q = makeQuestionFor(currentLevel, questionIndex);
  currentPair = q;
  if (!q) return;

  // render starter
  const starterDiv = document.createElement("div");
  starterDiv.className = "starter";
  const starterImg = makeImg(q.starter.sign, q.starter.text);
  starterDiv.appendChild(starterImg);
  const starterText = document.createElement("div");
  starterText.textContent = q.starter.text;
  starterText.style.fontWeight = "bold";
  starterText.style.marginLeft = "8px";
  starterDiv.appendChild(starterText);
  questionArea.appendChild(starterDiv);

  // render any signs (some may be mp4 emotion files) in-line after starter
  const signsWrap = document.createElement("div");
  signsWrap.className = "signsWrap";
  q.signs.forEach(s=>{
    if (!s) return;
    if (s.signPath && s.signPath.endsWith(".mp4")){
      const v = document.createElement("video");
      v.src = s.signPath;
      v.autoplay = false;
      v.muted = true;
      v.loop = false;
      v.width = 120;
      v.height = 120;
      v.style.objectFit = "contain";
      signsWrap.appendChild(v);
    } else {
      const im = makeImg(s.signPath, s.value);
      im.style.maxWidth = "120px";
      signsWrap.appendChild(im);
    }
  });
  questionArea.appendChild(signsWrap);

  // build dropzones based on q.dropzones
  q.dropzones.forEach((dz,i)=>{
    const d = document.createElement("div");
    d.className = "dropzone";
    d.dataset.placeholder = dz.placeholder;
    d.dataset.index = i;
    d.addEventListener("dragover", e=>e.preventDefault());
    d.addEventListener("drop", (e)=>{
      e.preventDefault();
      // If a native drag data exists try to use it
      const payload = e.dataTransfer && e.dataTransfer.getData ? e.dataTransfer.getData("text/plain") : null;
      if (payload){
        placeDroppedToZone(payload, d);
      }
    });
    // double-tap / double-click detection to remove
    d.addEventListener("click", (ev)=>{
      const t = Date.now();
      if (t - lastTap < DOUBLE_TAP_MS){
        // double tap: remove item
        removeFromDropzone(d);
      }
      lastTap = t;
    });
    answerArea.appendChild(d);
  });

  // create draggables on left and right according to q.leftSet and q.rightSet
  // left
  q.leftSet.forEach(item=>{
    const div = document.createElement("div");
    div.className = "draggable";
    div.tabIndex = 0;
    div.dataset.value = item.id;
    div.dataset.originalParent = leftDraggables.id;
    div.style.width = "115px";
    div.style.height = "115px";

    const img = document.createElement("img");
    img.src = item.imgPath;
    img.alt = item.label;
    img.style.width = "115px";
    img.style.height = "115px";
    img.onerror = ()=>{ img.style.display = "none"; div.textContent = item.label; };

    div.appendChild(img);
    // attach native dragstart
    div.addEventListener("dragstart", (e)=> { try { e.dataTransfer.setData("text/plain", item.id); } catch(_){} });
    leftDraggables.appendChild(div);
  });

  // right
  q.rightSet.forEach(item=>{
    const div = document.createElement("div");
    div.className = "draggable";
    div.tabIndex = 0;
    div.dataset.value = item.id;
    div.dataset.originalParent = rightDraggables.id;
    div.style.width = "115px";
    div.style.height = "115px";

    const img = document.createElement("img");
    img.src = item.imgPath;
    img.alt = item.label;
    img.style.width = "115px";
    img.style.height = "115px";
    img.onerror = ()=>{ img.style.display = "none"; div.textContent = item.label; };

    // if item has overlayVerb property (have/donthave) keep it as data attribute for later checks
    if (item.overlayVerb) div.dataset.overlayVerb = item.overlayVerb;

    div.appendChild(img);
    div.addEventListener("dragstart", (e)=> { try { e.dataTransfer.setData("text/plain", item.id); } catch(_){} });
    rightDraggables.appendChild(div);
  });

  // attach pointer handlers for clone drag start
  // (we attach at document level once, below initialization)

  // update score display
  updateScoreDisplay();

  // start timer if not running
  if (!running) { startTimer(); }
}

/* ===== Drag clone system (mouse + touch) ===== */
function startPointerDrag(e){
  const el = e.target.closest && e.target.closest(".draggable");
  if (!el) return;
  dragItem = el;
  isTouch = e.type === "touchstart" || (e.touches && e.touches.length>0);
  const rect = el.getBoundingClientRect();
  dragClone = el.cloneNode(true);
  dragClone.style.position = "fixed";
  dragClone.style.left = rect.left + "px";
  dragClone.style.top = rect.top + "px";
  dragClone.style.width = rect.width + "px";
  dragClone.style.height = rect.height + "px";
  dragClone.style.opacity = "0.9";
  dragClone.style.pointerEvents = "none";
  dragClone.style.zIndex = 5000;
  dragClone.classList.add("drag-clone");
  document.body.appendChild(dragClone);
  if (isTouch){
    document.addEventListener("touchmove", movePointerDrag, { passive:false });
    document.addEventListener("touchend", endPointerDrag);
  } else {
    document.addEventListener("mousemove", movePointerDrag);
    document.addEventListener("mouseup", endPointerDrag);
  }
  e.preventDefault();
}

function movePointerDrag(e){
  if (!dragClone) return;
  let clientX, clientY;
  if (e.touches && e.touches.length>0){ clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }
  dragClone.style.left = (clientX - dragClone.offsetWidth/2) + "px";
  dragClone.style.top = (clientY - dragClone.offsetHeight/2) + "px";
}

function endPointerDrag(e){
  if (!dragItem || !dragClone) { cleanupDrag(); return; }
  let clientX, clientY;
  if (e.changedTouches && e.changedTouches.length>0){ clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }

  // find dropzone under pointer
  const dzs = Array.from(document.querySelectorAll(".dropzone"));
  let dropped = false;
  for (const dz of dzs){
    const r = dz.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom && !dz.dataset.filled){
      // place a clone of dragItem inside dz
      const node = dragItem.cloneNode(true);
      node.classList.remove("draggable");
      node.style.pointerEvents = "auto";
      node.style.width = "100%";
      node.style.height = "100%";
      dz.appendChild(node);
      dz.dataset.filled = dragItem.dataset.value; // store the id like "dog-two" or "apple"
      // if draggable carried overlayVerb info, transfer it
      if (dragItem.dataset.overlayVerb) dz.dataset.overlayVerb = dragItem.dataset.overlayVerb;
      dz.classList.add("filled");
      dropped = true;
      break;
    }
  }

  cleanupDrag();

  if (dropped){
    // show check button
    if (checkBtn) checkBtn.style.display = "inline-block";
    againBtn.style.display = "none";
  }
}

function cleanupDrag(){
  try { if (dragClone && dragClone.parentElement) dragClone.parentElement.removeChild(dragClone); } catch(_) {}
  dragClone = null; dragItem = null;
  if (isTouch){
    document.removeEventListener("touchmove", movePointerDrag);
    document.removeEventListener("touchend", endPointerDrag);
  } else {
    document.removeEventListener("mousemove", movePointerDrag);
    document.removeEventListener("mouseup", endPointerDrag);
  }
}

/* attach pointer start handler globally */
document.addEventListener("mousedown", startPointerDrag);
document.addEventListener("touchstart", startPointerDrag, { passive:false });

/* ===== Dropzone helpers ===== */
function placeDroppedToZone(payload, dz){
  // payload is dataTransfer text being the id like "dog-two"
  if (dz.dataset.filled) return; // occupied
  // find draggable whose dataset.value === payload in page and clone it
  const source = Array.from(document.querySelectorAll(".draggable")).find(d => d.dataset.value === payload);
  if (!source) return;
  const node = source.cloneNode(true);
  node.classList.remove("draggable");
  dz.appendChild(node);
  dz.dataset.filled = payload;
  if (source.dataset.overlayVerb) dz.dataset.overlayVerb = source.dataset.overlayVerb;
  dz.classList.add("filled");
  if (checkBtn) checkBtn.style.display = "inline-block";
}

function removeFromDropzone(dz){
  if (!dz || !dz.dataset.filled) return;
  // move the item back to its original container
  const origId = dz.querySelector && dz.querySelector(".draggable") && dz.querySelector(".draggable").dataset.originalParent;
  const parentId = dz.dataset.originalParent || dz.dataset.originalParent;
  const value = dz.dataset.filled;
  // try to find original container by data attribute stored on flex draggable elements
  const originalContainer = document.getElementById( (dz.querySelector && dz.querySelector(".draggable") && dz.querySelector(".draggable").dataset.originalParent) || "draggablesLeft" );
  // we will simply remove the appended node and rely on buildQuestion to keep pools; but user wanted return to original spot — we'll find a draggable with same dataset.value and append it back
  const originalDraggable = Array.from(document.querySelectorAll(".draggable")).find(d => d.dataset.value === value);
  if (originalDraggable && originalDraggable.parentElement && originalDraggable.parentElement.id !== (originalDraggable.dataset.originalParent || "draggablesLeft")){
    const container = document.getElementById(originalDraggable.dataset.originalParent || "draggablesLeft");
    if (container) container.appendChild(originalDraggable);
  }
  dz.innerHTML = "";
  delete dz.dataset.filled;
  delete dz.dataset.overlayVerb;
  dz.classList.remove("filled","incorrect","correct");
  if (checkBtn) checkBtn.style.display = "none";
}

/* ===== CHECK ANSWER ===== */
if (checkBtn) checkBtn.addEventListener("click", ()=>{
  if (!currentPair) return;
  const dzs = Array.from(document.querySelectorAll(".dropzone"));
  // collect filled values in order
  const filledVals = dzs.map(d => d.dataset.filled || "");
  // now determine correctness depending on currentPair.expected
  let correct = true;
  const expected = currentPair.expected || [];
  // For singleCombo expected[0] is 'word1-word2'
  // For twoSeparate expected is [word1, word2]
  // For combinedHaveDontHave expected is [animal-num, food-colour, verbChoice]
  // For bonus expected is array of expected strings
  if (currentPair.levelType === "singleCombo"){
    const provided = filledVals[0] || "";
    if (provided !== expected[0]) correct = false;
  } else if (currentPair.levelType === "twoSeparate"){
    // expected is [word1, word2]
    if (filledVals.length < 2) correct = false;
    else {
      if (filledVals[0] !== expected[0]) correct = false;
      if (filledVals[1] !== expected[1]) correct = false;
    }
  } else if (currentPair.levelType === "combinedHaveDontHave"){
    // check left == expected[0], right == expected[1], and if overlayVerb on dropzone or draggable matches expected[2] for the right dropzone
    if (filledVals[0] !== expected[0]) correct = false;
    if (filledVals[1] !== expected[1]) correct = false;
    // check overlay verb
    const dzRight = dzs[1];
    const overlay = dzRight && dzRight.dataset.overlayVerb ? dzRight.dataset.overlayVerb : null;
    if (overlay !== expected[2]) correct = false;
  } else if (currentPair.levelType === "bonus"){
    // expect filledVals to match expected array length and equality
    for (let i=0;i<expected.length;i++){
      if ((filledVals[i]||"") !== expected[i]) { correct = false; break; }
    }
  } else {
    // generic comparison element-wise
    for (let i=0;i<expected.length;i++){
      if ((filledVals[i]||"") !== expected[i]) { correct = false; break; }
    }
  }

  // create where the check button sits an ephemeral feedback image
  const feedbackWrapper = document.createElement("div");
  feedbackWrapper.style.display = "inline-block";
  feedbackWrapper.style.width = checkBtn.offsetWidth + "px";
  feedbackWrapper.style.height = checkBtn.offsetHeight + "px";

  const fbImg = document.createElement("img");
  fbImg.src = correct ? "assets/correct.png" : "assets/wrong.png";
  fbImg.alt = correct ? "Correct" : "Wrong";
  fbImg.style.width = "100%";
  feedbackWrapper.appendChild(fbImg);

  // insert feedback image where check button is (replace checkBtn temporarily)
  const controlParent = checkBtn.parentElement;
  if (controlParent){
    controlParent.replaceChild(feedbackWrapper, checkBtn);
  } else {
    // fallback to appending into feedbackDiv
    feedbackDiv.appendChild(feedbackWrapper);
  }

  // record attempt(s)
  const attemptValue = (filledVals.length===1) ? filledVals[0] : filledVals.join("|");
  answersHistory.push({ level: currentLevel, question: questionIndex, value: attemptValue, correct });

  // update counters
  if (correct){
    totalCorrect++; levelCorrect[currentLevel]++; // success: keep draggable
  } else {
    totalIncorrect++; levelIncorrect[currentLevel]++;
    // for incorrect: remove the incorrect draggable from pools so student can't pick it again
    // remove from both left and right containers any draggable with dataset.value equal to wrong item(s)
    filledVals.forEach(v=>{
      if (!v) return;
      // find matching draggable elements currently present (not the one in dropzone clone)
      const drags = Array.from(document.querySelectorAll(".draggable")).filter(d => d.dataset.value === v);
      drags.forEach(d => {
        // remove from DOM so decoy can't be used again
        try { d.parentNode.removeChild(d); } catch(e){}
      });
    });
  }

  // hide any "again" button while feedback shows
  againBtn.style.display = "none";

  // after 2 seconds revert feedback and either progress or allow retry
  setTimeout(()=>{
    // restore check button position (replace feedbackWrapper back with checkBtn)
    if (controlParent){
      try { controlParent.replaceChild(checkBtn, feedbackWrapper); } catch(e){}
    } else {
      feedbackDiv.innerHTML = "";
    }

    // if correct -> nextQuestion, else clear the erroneous dropzones for retry
    if (correct){
      // clear the dropzones for next question and increment index
      questionIndex++;
      // after each question save progress
      saveProgress();
      // If finished level (10 questions) -> show clap then next level
      if (questionIndex >= 10){
        // show clap animation
        showClapThenAdvance();
      } else {
        // build next question in same level
        renderQuestion();
      }
    } else {
      // clear incorrect dropzones only (set to empty prepared for reattempt)
      document.querySelectorAll(".dropzone").forEach(d => {
        if (d.dataset.filled){
          d.innerHTML = "";
          delete d.dataset.filled;
          delete d.dataset.overlayVerb;
          d.classList.remove("filled","incorrect","correct");
        }
      });
      // hide check and show again button to let student try another draggable
      if (checkBtn) checkBtn.style.display = "none";
      againBtn.style.display = "inline-block";
      // save progress too (we updated incorrect counts)
      saveProgress();
    }

  }, 2000);
});

/* ===== show clap then advance level/next question ===== */
function showClapThenAdvance(){
  // show auslan clap gif for 2s then either go to next level or end game after level 12
  const clap = document.createElement("img");
  clap.src = "assets/auslan-clap.gif";
  clap.alt = "Clap";
  clap.style.width = "160px";
  const controls = document.getElementById("controls") || document.body;
  // display in feedbackDiv
  feedbackDiv.innerHTML = "";
  feedbackDiv.appendChild(clap);
  setTimeout(()=>{
    feedbackDiv.innerHTML = "";
    // end of level, move to next level
    if (currentLevel < 12){
      currentLevel++;
      questionIndex = 0;
      saveProgress();
      renderQuestion();
    } else {
      // final level done -> submit results and show end modal
      submitResultsIfNeeded().then(()=>{
        // clear stored progress
        clearProgress();
        // show end modal with clap and stats
        showEndModal();
      });
    }
  }, 2000);
}

/* ===== again button behavior (in-level retry) ===== */
if (againBtn) againBtn.addEventListener("click", ()=>{
  // clear dropzones only
  document.querySelectorAll(".dropzone").forEach(d => {
    d.innerHTML = "";
    delete d.dataset.filled;
    delete d.dataset.overlayVerb;
    d.classList.remove("filled","incorrect","correct");
  });
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== Save / Load / Clear progress ===== */
function saveProgress(){
  const payload = {
    studentName, studentClass,
    currentLevel, questionIndex,
    totalCorrect, totalIncorrect,
    levelCorrect, levelIncorrect,
    pausedTimeAccum: getTimeElapsed(),
    answersHistory,
    timestamp: Date.now()
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }
  catch(e){ console.warn("save failed", e); }
}

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e){ return null; }
}

function clearProgress(){
  try { localStorage.removeItem(SAVE_KEY); } catch(e){}
}

/* ===== Resume modal logic ===== */
function showResumeModal(saved){
  if (!resumeModal) return;
  resumeMessage.textContent = `You have progress saved at Level ${saved.currentLevel}, Question ${saved.questionIndex + 1}. Continue or start over?`;
  // hide other modals
  if (stopModal) stopModal.style.display = "none";
  if (endModal) endModal.style.display = "none";
  resumeModal.style.display = "flex";
  resumeModal.style.zIndex = 5000;

  // ensure single binding: replace nodes
  const newCont = resumeContinue.cloneNode(true);
  resumeContinue.parentNode.replaceChild(newCont, resumeContinue);
  const newAgain = resumeAgain.cloneNode(true);
  resumeAgain.parentNode.replaceChild(newAgain, resumeAgain);

  // re-get the nodes
  const resumeContinueBtn = document.getElementById(newCont.id);
  const resumeAgainBtn = document.getElementById(newAgain.id);

  resumeContinueBtn.addEventListener("click", ()=>{
    resumeModal.style.display = "none";
    // restore state
    restoreProgress(saved);
    // resume timer
    startTimer();
    renderQuestion();
  }, { once: true });

  resumeAgainBtn.addEventListener("click", async ()=>{
    resumeModal.style.display = "none";
    // if previously not submitted and at least 1 correct, submit first, per your spec "submit only if score 1 or higher"
    if ((saved.totalCorrect || 0) >= 1){
      await submitResults(true); // true = silent and allow clearing flag
    }
    clearProgress();
    // restart game
    currentLevel = 1; questionIndex = 0; totalCorrect = 0; totalIncorrect = 0;
    for (let i=1;i<=12;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
    answersHistory = [];
    pausedTimeAccum = 0;
    startTimer();
    renderQuestion();
  }, { once: true });
}

/* restoreProgress helper to rebuild state */
function restoreProgress(saved){
  if (!saved) return;
  studentName = saved.studentName || studentName;
  studentClass = saved.studentClass || studentClass;
  currentLevel = Number(saved.currentLevel) || 1;
  questionIndex = Number(saved.questionIndex) || 0;
  totalCorrect = Number(saved.totalCorrect) || 0;
  totalIncorrect = Number(saved.totalIncorrect) || 0;
  levelCorrect = saved.levelCorrect || levelCorrect;
  levelIncorrect = saved.levelIncorrect || levelIncorrect;
  answersHistory = saved.answersHistory || [];
  pausedTimeAccum = Number(saved.pausedTimeAccum) || 0;
}

/* ===== Stop modal handlers ===== */
if (stopBtn) stopBtn.addEventListener("click", ()=>{
  // if resume modal showing do nothing
  if (resumeModal && resumeModal.style.display === "flex") return;
  pauseTimer();
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if (stopPercent) stopPercent.textContent = `Score so far: ${percent}% - Time: ${getTimeElapsed()}s`;
  if (stopModal) stopModal.style.display = "flex";
});

if (stopContinue) stopContinue.addEventListener("click", ()=>{
  if (stopModal) stopModal.style.display = "none";
  startTimer();
});

if (stopAgain) stopAgain.addEventListener("click", async ()=>{
  // submit if at least 1 correct
  await submitResultsIfNeeded();
  // restart game from level 1
  currentLevel = 1; questionIndex = 0;
  totalCorrect = 0; totalIncorrect = 0;
  for (let i=1;i<=12;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
  answersHistory = [];
  pausedTimeAccum = 0;
  saveProgress();
  if (stopModal) stopModal.style.display = "none";
  startTimer();
  renderQuestion();
});

if (stopFinish) stopFinish.addEventListener("click", async ()=>{
  // submit (if needed) and then go to index, but do NOT clear stored data
  await submitResultsIfNeeded();
  window.location.href = "../index.html";
});

/* ===== Submit results =====
   - Only submit if totalCorrect >= 1 (per your rule)
   - Use FORM_FIELD_MAP keys that exist; skip missing ones.
   - Attempt silent POST via fetch with mode:'no-cors' (keeps user on page).
*/
async function submitResults(allowClear=false){
  // internal submit function to post final totals
  const timeTaken = getTimeElapsed();
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts > 0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;

  if (totalCorrect < 1) return; // don't submit if score < 1

  // Build FormData - prefer using the form element if available
  const fd = new FormData();
  if (FORM_FIELD_MAP.name) fd.append(FORM_FIELD_MAP.name, studentName);
  if (FORM_FIELD_MAP.class) fd.append(FORM_FIELD_MAP.class, studentClass);
  if (FORM_FIELD_MAP.subject) fd.append(FORM_FIELD_MAP.subject, "Sentences");
  if (FORM_FIELD_MAP.timeTaken) fd.append(FORM_FIELD_MAP.timeTaken, String(timeTaken));
  if (FORM_FIELD_MAP.percent) fd.append(FORM_FIELD_MAP.percent, String(percent));
  // per-level append if mapping exists
  for (let lvl=1; lvl<=12; lvl++){
    const map = FORM_FIELD_MAP[`level${lvl}`];
    if (!map) continue;
    fd.append(map.correct, String(levelCorrect[lvl] || 0));
    fd.append(map.incorrect, String(levelIncorrect[lvl] || 0));
  }

  // also attach answersHistory as JSON in a fallback field if google form doesn't have mapping (this won't be captured by standard form)
  // but we include for debugging as a field named 'entry.debug_answers' only if that field exists in FORM_FIELD_MAP
  if (FORM_FIELD_MAP.debugAnswers) fd.append(FORM_FIELD_MAP.debugAnswers, JSON.stringify(answersHistory));

  // send via fetch - we use the googleForm.action endpoint
  try {
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
  } catch(e){
    console.warn("submit request failed (mode no-cors might cause network error in console):", e);
  }

  if (allowClear){
    clearProgress();
  }
}

async function submitResultsIfNeeded(){
  await submitResults(true);
}

/* ===== End modal display ===== */
function showEndModal(){
  // populate final fields already in your HTML
  const finalTimeEl = document.getElementById("finalTime");
  const finalScoreEl = document.getElementById("finalScore");
  const finalPercentEl = document.getElementById("finalPercent");
  if (finalTimeEl) finalTimeEl.textContent = getTimeElapsed() + "s";
  const totalAttempts = totalCorrect + totalIncorrect;
  const percent = totalAttempts>0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;
  if (finalScoreEl) finalScoreEl.textContent = `${totalCorrect} / ${totalAttempts}`;
  if (finalPercentEl) finalPercentEl.textContent = `${percent}%`;

  // insert clap gif at top if there's an img placeholder
  const endGif = document.getElementById("endGif");
  if (endGif) { endGif.src = "assets/auslan-clap.gif"; }

  if (endModal) {
    endModal.style.display = "flex";
    endModal.style.zIndex = 6000;
  }

  // wire finish & again (images in HTML)
  const finish = document.getElementById("finishBtn");
  const again = document.getElementById("againBtnEnd");
  if (finish) finish.addEventListener("click", async ()=>{
    // final submission and redirect
    await submitResultsIfNeeded();
    window.location.href = "../index.html";
  });
  if (again) again.addEventListener("click", ()=>{
    // restart entire game
    endModal.style.display = "none";
    currentLevel = 1; questionIndex = 0;
    totalCorrect = 0; totalIncorrect = 0;
    for (let i=1;i<=12;i++){ levelCorrect[i]=0; levelIncorrect[i]=0; }
    answersHistory = [];
    pausedTimeAccum = 0;
    clearProgress();
    startTimer();
    renderQuestion();
  });
}

/* ===== update score display ===== */
function updateScoreDisplay(){
  const disp = `Level ${currentLevel} - Question ${questionIndex+1}/10`;
  if (scoreDisplay) scoreDisplay.textContent = disp;
}

/* ===== Initialization on load ===== */
window.addEventListener("load", ()=>{
  // wire global click handlers for resume if save exists
  const saved = loadProgress();
  if (saved && saved.currentLevel !== undefined){
    // show resume modal and pause
    pauseTimer();
    showResumeModal(saved);
  } else {
    // start fresh: level 1 question 0
    currentLevel = 1; questionIndex = 0; totalCorrect = 0; totalIncorrect = 0;
    pausedTimeAccum = 0;
    startTimer();
    renderQuestion();
  }
});

