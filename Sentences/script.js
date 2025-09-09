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
const cont = document.getElementById("resumeContinue");
const again = document.getElementById("resumeAgain");


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
let roundInLevel = 0; // 0..9
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let startTime = null;
let savedTimeElapsed = 0; // for resume
let answersHistory = [];

/* ===== VOCAB ===== */
const animals = ["dog","cat","mouse","rabbit","fish","bird"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const food = ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"];
const verbs = ["want","have","donthave"];
const helpers = ["i","see","what"];

const TOTAL_LEVELS = 4; // number of levels in the game

/* ===== HELPERS ===== */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function signPathFor(word) {
  if (animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (verbs.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if (helpers.includes(word)) return `assets/signs/helpers/${word}.png`;
  return "";
}
function compositeImagePath(combo) { return `assets/images/${combo}.png`; }

/* ===== TIMER HELPERS ===== */
function getTimeElapsed() {
  return savedTimeElapsed + Math.round((Date.now() - startTime) / 1000);
}
function setTimeElapsed(seconds) {
  savedTimeElapsed = seconds;
  startTime = Date.now();
}

/* ===== PROGRESS SAVE/RESUME ===== */
const SAVE_KEY = "sentencesGameSave";

function saveProgress() {
  const saveData = {
    studentName,
    studentClass,
    currentLevel,
    roundInLevel,
    correctCount,
    incorrectCount,
    answersHistory,
    timeElapsed: getTimeElapsed()
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch { return null; }
}

function clearProgress() {
  localStorage.removeItem(SAVE_KEY);
}

function showResumeModal(saved) {
  const modal = document.getElementById("resumeModal");
  const msg = document.getElementById("resumeMessage");
  const cont = document.getElementById("resumeContinue");
  const again = document.getElementById("resumeAgain");

  msg.textContent = `Welcome back ${saved.studentName}! Continue from Level ${saved.currentLevel}, Question ${saved.roundInLevel + 1}?`;

  cont.onclick = () => {
    modal.style.display = "none";
    restoreProgress(saved);
  };

  again.onclick = () => {
    modal.style.display = "none";
    clearProgress();
    resetGame();
  };

  modal.style.display = "flex";
}

function restoreProgress(saved) {
  studentName = saved.studentName;
  studentClass = saved.studentClass;
  currentLevel = saved.currentLevel;
  roundInLevel = saved.roundInLevel;
  correctCount = saved.correctCount;
  incorrectCount = saved.incorrectCount;
  answersHistory = saved.answersHistory || [];
  setTimeElapsed(saved.timeElapsed || 0);
  buildQuestion();
}

/* ===== SENTENCE GENERATION ===== */
function generateSentence() {
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const foodItem = randomItem(food);
  const colour = randomItem(colours);
  const verb = (currentLevel===4)?randomItem(["have","donthave"]):"want";
  currentSentence = { animal, number, food: foodItem, colour, verb };
}

function buildQuestion() {
  generateSentence();
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const isOdd = roundInLevel % 2 === 1;

  // --- HELPER SIGNS (Level 1 & 2 only) ---
  if (currentLevel <= 2) {
    const helperDiv = document.createElement("div");
    helpers.forEach(h => {
      const img = document.createElement("img");
      img.src = signPathFor(h);
      helperDiv.appendChild(img);
    });
    questionArea.appendChild(helperDiv);
  }

  // --- QUESTION IMAGES ---
  const comboDiv = document.createElement("div");

  if (isOdd) {
    if (currentLevel === 1) {
      comboDiv.innerHTML = `<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}">`;
    } else if (currentLevel === 2) {
      comboDiv.innerHTML = `<img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`;
    } else if (currentLevel === 3) {
      comboDiv.innerHTML =
        `<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}">
         <img src="${signPathFor('want')}">
         <img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`;
    } else if (currentLevel === 4) {
      const verbImg = currentSentence.verb === "donthave"
        ? `<div class="dontHaveWrapper"><img src="${signPathFor('have')}"><div class="xOverlay">X</div></div>`
        : `<img src="${signPathFor('have')}">`;

      comboDiv.innerHTML =
        `<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}">
         ${verbImg}
         <img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`;
    }
  } else {
    if (currentLevel === 1) {
      comboDiv.innerHTML =
        `<img src="${signPathFor(currentSentence.animal)}">
         <img src="${signPathFor(currentSentence.number)}">`;
    } else if (currentLevel === 2) {
      comboDiv.innerHTML =
        `<img src="${signPathFor(currentSentence.food)}">
         <img src="${signPathFor(currentSentence.colour)}">`;
    } else if (currentLevel === 3) {
      comboDiv.innerHTML =
        `<img src="${signPathFor(currentSentence.animal)}">
         <img src="${signPathFor(currentSentence.number)}">
         <img src="${signPathFor('want')}">
         <img src="${signPathFor(currentSentence.food)}">
         <img src="${signPathFor(currentSentence.colour)}">`;
    } else if (currentLevel === 4) {
      const verbImg = currentSentence.verb === "donthave"
        ? `<div class="dontHaveWrapper"><img src="${signPathFor('have')}"><div class="xOverlay">X</div></div>`
        : `<img src="${signPathFor('have')}">`;

      comboDiv.innerHTML =
        `<img src="${signPathFor(currentSentence.animal)}">
         <img src="${signPathFor(currentSentence.number)}">
         ${verbImg}
         <img src="${signPathFor(currentSentence.food)}">
         <img src="${signPathFor(currentSentence.colour)}">`;
    }
  }

  questionArea.appendChild(comboDiv);

  // --- ANSWER BOXES ---
  buildAnswerBoxes(isOdd);

  // --- DRAGGABLES ---
  buildDraggables(isOdd);

  updateScoreDisplay();
}

/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(isOdd) {
  answerArea.innerHTML = "";
  let dropLabels = [];

  if (currentLevel === 1) {
    dropLabels = isOdd ? ["animal", "how many?"] : ["animal+howmany?"];
  } else if (currentLevel === 2) {
    dropLabels = isOdd ? ["food", "colour"] : ["food+colour"];
  } else if (currentLevel === 3) {
    dropLabels = isOdd ? ["animal", "how many?", "verb", "food", "colour"] : ["animal+howmany?", "verb", "food+colour"];
  } else if (currentLevel === 4) {
    dropLabels = isOdd ? ["animal", "how many?", "verb", "food", "colour"] : ["animal+howmany?", "verb", "food+colour"];
  }

  dropLabels.forEach((label, i) => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;

    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);

    // Level 3: prefill verb ("want") in all questions, permanent
    if (currentLevel === 3 && label === "verb") {
      const img = document.createElement("img");
      img.src = signPathFor("want");
      dz.appendChild(img);
      dz.dataset.filled = "want";
      dz.classList.add("filled");
      dz.dataset.permanent = "true"; // NEW: mark as permanent
    }

    answerArea.appendChild(dz);
  });
}

/* ===== BUILD DRAGGABLES ===== */
function buildDraggables(isOdd){
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  let items = [];
  const totalItems = 16;

  // --- Correct answers ---
  if (currentLevel === 1) {
    items = isOdd ? [currentSentence.animal, currentSentence.number] : [currentSentence.animal+"-"+currentSentence.number];
  } else if (currentLevel === 2) {
    items = isOdd ? [currentSentence.food, currentSentence.colour] : [currentSentence.food+"-"+currentSentence.colour];
  } else if (currentLevel === 3) {
    // Level 3: NO verbs draggable
    items = isOdd
      ? [currentSentence.animal, currentSentence.number, currentSentence.food, currentSentence.colour]
      : [currentSentence.animal+"-"+currentSentence.number, currentSentence.food+"-"+currentSentence.colour];
  } else if (currentLevel === 4) {
    const verb = currentSentence.verb;
    const label = `${currentSentence.animal}-${currentSentence.number}-${verb}-${currentSentence.food}-${currentSentence.colour}`;
    items = [label];
  }

  // --- Add decoys, ensuring uniqueness ---
  const used = new Set(items);
  while (items.length < totalItems) {
    let decoy;
    if (isOdd) {
      if (currentLevel === 1) decoy = randomItem([...animals, ...numbers]);
      else if (currentLevel === 2) decoy = randomItem([...food, ...colours]);
      else if (currentLevel === 3) decoy = randomItem([...animals, ...numbers, ...food, ...colours]); // verbs excluded
      else decoy = randomItem([...animals, ...numbers, ...food, ...colours, ...verbs]);
    } else {
      let allCombos = [];
      if (currentLevel === 1) allCombos = animals.flatMap(a => numbers.map(n => `${a}-${n}`));
      else if (currentLevel === 2) allCombos = food.flatMap(f => colours.map(c => `${f}-${c}`));
      else if (currentLevel === 3) allCombos = [
        ...animals.flatMap(a => numbers.map(n => `${a}-${n}`)),
        ...food.flatMap(f => colours.map(c => `${f}-${c}`))
      ]; // verbs excluded
      decoy = randomItem(allCombos);
    }
    if (!used.has(decoy)) { items.push(decoy); used.add(decoy); }
  }

  items = shuffleArray(items);
  const halves = [items.slice(0,8), items.slice(8,16)];

  halves.forEach((group, idx) => {
    const container = idx === 0 ? leftDraggables : rightDraggables;
    group.forEach(word => {
      const div = document.createElement("div");
      div.className = "draggable";
      div.draggable = true;
      div.dataset.value = word;

      const img = document.createElement("img");
      if (currentLevel === 4 && word.includes("donthave")) {
        const parts = word.split("-");
        img.src = compositeImagePath(parts[3]+"-"+parts[4]);
        const wrapper = document.createElement("div");
        wrapper.className = "dontHaveWrapper";
        wrapper.appendChild(img);
        const xOverlay = document.createElement("div");
        xOverlay.className = "xOverlay";
        xOverlay.textContent = "X";
        wrapper.appendChild(xOverlay);
        div.appendChild(wrapper);
      } else if (currentLevel === 4 && word.includes("have")) {
        const parts = word.split("-");
        img.src = compositeImagePath(parts[3]+"-"+parts[4]);
        div.appendChild(img);
      } else {
        img.src = word.includes("-") ? compositeImagePath(word) : signPathFor(word);
        div.appendChild(img);
      }

      // --- Drag & touch support ---
      div.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", word));
      // no touchStartHandler needed; unified drag handles touch
      container.appendChild(div);
    });
  });
}

/* ===== UNIFIED DRAG & DROP ===== */
let dragItem=null, dragClone=null, isTouch=false;
function startDrag(e){
  const target=e.target.closest(".draggable"); if(!target) return;
  dragItem=target; isTouch=e.type.startsWith("touch");
  const rect=target.getBoundingClientRect();
  dragClone=target.cloneNode(true);
  dragClone.style.position="fixed"; dragClone.style.left=rect.left+"px"; dragClone.style.top=rect.top+"px";
  dragClone.style.width=rect.width+"px"; dragClone.style.height=rect.height+"px";
  dragClone.style.opacity="0.7"; dragClone.style.pointerEvents="none"; dragClone.style.zIndex="10000";
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
  const dropzones=document.querySelectorAll(".dropzone"); let dropped=false;
  dropzones.forEach(dz=>{
    const rect=dz.getBoundingClientRect();
    if(clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom&&dz.childElementCount===0){
      const value=dragItem.dataset.value;
      if(currentLevel===4 && value.includes("-")){
        const [animal,number,verb,food,colour]=value.split("-");
        document.querySelectorAll(".dropzone").forEach(dzBox=>{
          dzBox.innerHTML=""; dzBox.classList.add("filled");
          if(dzBox.dataset.placeholder==="animal+number"){ const img=document.createElement("img"); img.src=compositeImagePath(`${animal}-${number}`); dzBox.appendChild(img); dzBox.dataset.filled=`${animal}-${number}`; }
          else if(dzBox.dataset.placeholder==="verb"){ const img=document.createElement("img"); img.src=signPathFor(verb); dzBox.appendChild(img); dzBox.dataset.filled=verb; }
          else if(dzBox.dataset.placeholder==="food+colour"){ const img=document.createElement("img"); img.src=compositeImagePath(`${food}-${colour}`); dzBox.appendChild(img); dzBox.dataset.filled=verb==="donthave"?"donthave":`${food}-${colour}`; if(verb==="donthave"){ const xDiv=document.createElement("div"); xDiv.className="xOverlay"; xDiv.textContent="X"; dzBox.appendChild(xDiv); } }
        });
      } else { const img=document.createElement("img"); img.src=value.includes("-")?compositeImagePath(value):signPathFor(value); dz.appendChild(img); dz.dataset.filled=value; dz.classList.add("filled"); }
      dropped=true;
    }
  });
  if(dragClone) document.body.removeChild(dragClone);
  dragClone=null; dragItem=null;
  if(isTouch){ document.removeEventListener("touchmove", moveDrag,{passive:false}); document.removeEventListener("touchend", endDrag); }
  else { document.removeEventListener("mousemove", moveDrag); document.removeEventListener("mouseup", endDrag); }
  if(dropped){
    againBtn.style.display="inline-block";
    const allFilled=Array.from(document.querySelectorAll(".dropzone")).every(d=>d.dataset.filled);
    checkBtn.style.display=allFilled?"inline-block":"none";
  }
}
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, {passive:false});

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click", () => {
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;

  dropzones.forEach((dz, i) => {
    // Permanent "want" is always correct
    if (dz.dataset.permanent === "true") {
      dz.classList.add("correct");
      return;
    }

    let expected = "";
    if (currentLevel === 1) {
      expected = (roundInLevel % 2 === 1) ? (i === 0 ? currentSentence.animal : currentSentence.number) : currentSentence.animal + "-" + currentSentence.number;
    } else if (currentLevel === 2) {
      expected = (roundInLevel % 2 === 1) ? (i === 0 ? currentSentence.food : currentSentence.colour) : currentSentence.food + "-" + currentSentence.colour;
    } else if (currentLevel === 3) {
      const seq = roundInLevel % 2 === 1
        ? [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour]
        : [currentSentence.animal + "-" + currentSentence.number, currentSentence.verb, currentSentence.food + "-" + currentSentence.colour];
      expected = seq[i] || "";
    } else if (currentLevel === 4) {
      const seq = [currentSentence.animal + "-" + currentSentence.number, currentSentence.verb, currentSentence.food + "-" + currentSentence.colour];
      if (dz.dataset.placeholder === "animal+number") expected = seq[0];
      else if (dz.dataset.placeholder === "verb") expected = seq[1];
      else if (dz.dataset.placeholder === "food+colour") expected = currentSentence.verb === "donthave" ? "donthave" : seq[2];
    }

    if (dz.dataset.filled === expected) {
      correctCount++;
      dz.classList.add("correct");
    } else {
      incorrectCount++;
      allCorrect = false;
      dz.classList.remove("filled");
      dz.classList.remove("correct");
      dz.classList.add("incorrect");
      dz.innerHTML = ""; 
      dz.dataset.filled = "";
    }
  });

  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  feedbackDiv.appendChild(fb);

  saveProgress();
  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if (allCorrect) nextRound();
    else {
      buildDraggables(roundInLevel % 2 === 1);
      checkBtn.style.display = "none";
      againBtn.style.display = "inline-block";
    }
  }, 2000);
});

/* ===== AGAIN BUTTON ===== */
againBtn.addEventListener("click", () => {
  buildDraggables(roundInLevel % 2 === 1);
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz => {
    if (dz.dataset.permanent !== "true") { // don't clear permanent "want"
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("correct", "incorrect", "filled");
    } else {
      dz.classList.add("correct"); // permanent "want" always correct
    }
  });
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== GAME FLOW ===== */
stopBtn.addEventListener("click", () => {
  savedTimeElapsed = getTimeElapsed(); // pause timer
  const percent = Math.round((correctCount / (correctCount + incorrectCount)) * 100);

  // Show stop modal
  const modal = document.getElementById("stopModal");
  modal.style.display = "block";
  document.getElementById("stopTime").textContent = `${Math.floor(savedTimeElapsed/60)}m ${savedTimeElapsed%60}s`;
  document.getElementById("stopPercent").textContent = percent + "%";

  // Buttons inside modal
  document.getElementById("continueBtn").onclick = () => { 
    modal.style.display = "none"; 
    startTime = Date.now(); // resume timer
  };
  document.getElementById("againBtnStop").onclick = () => { 
    modal.style.display = "none"; 
    resetGame(); 
  };
  document.getElementById("finishBtnStop").onclick = async () => {
    modal.style.display = "none"; 
    await endLevel(); 
    window.location.href = "../index.html"; 
  };
});

/* ===== GAME FLOW ===== */
const TOTAL_LEVELS = 4; // number of levels

function nextRound() {
  roundInLevel++;
  if (roundInLevel >= 10) {
    // completed all rounds in current level
    endLevel();
  } else {
    buildQuestion();
    saveProgress();
  }
}

async function endLevel() {
  const timeTaken = getTimeElapsed();
  const percent = Math.round((correctCount / (correctCount + incorrectCount)) * 100);

  if (currentLevel < TOTAL_LEVELS) {
    // move to next level
    currentLevel++;
    roundInLevel = 0;
    startGame(); // starts next level
    saveProgress();
    return;
  }

  // --- Only after final level: submit to Google Form ---
  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);

  for (let l = 1; l <= TOTAL_LEVELS; l++) {
    const cf = FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf = FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if (cf) fd.append(cf, correctCount);  // optionally track per-level counts
    if (inf) fd.append(inf, incorrectCount);
  }

  try {
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
  } catch (err) {
    console.warn("Form submission failed", err);
  }

  // --- Show End Modal ---
  clearProgress();
  endModal.style.display = "block";
  document.getElementById("endGif").src = "assets/auslan-clap.gif";
  document.getElementById("finalScore").textContent = `${correctCount}/${correctCount + incorrectCount}`;
  document.getElementById("finalPercent").textContent = percent + "%";
}


  // --- Show End Modal ---
  clearProgress();
  endModal.style.display = "block";

  // Display Auslan clap GIF
  document.getElementById("endGif").src = "assets/auslan-clap.gif";

  // Display time and percentage
  document.getElementById("finalScore").textContent = `${correctCount}/${correctCount + incorrectCount}`;
  document.getElementById("finalPercent").textContent = percent + "%";
}

/* ===== END MODAL BUTTONS ===== */
document.getElementById("finishBtn").onclick = () => { 
  window.location.href = "../index.html"; 
};
document.getElementById("againBtnEnd").onclick = () => { 
  endModal.style.display = "none"; 
  resetGame(); 
};
document.getElementById("logoffBtn").onclick = () => { 
  window.location.href = "../index.html"; 
};

function startGame(){ startTime=Date.now(); buildQuestion(); }
function resetGame(){ currentLevel=1; roundInLevel=0; correctCount=0; incorrectCount=0; savedTimeElapsed=0; startGame(); }
function updateScoreDisplay(){ scoreDisplay.textContent=`Level ${currentLevel} - Question ${roundInLevel+1}/10`; }

/* ===== INIT ===== */
window.addEventListener("load",()=>{
  const saved=loadProgress();
  if(saved&&saved.studentName){ showResumeModal(saved); }
  else { resetGame(); }
});

/* ===== DROP HANDLER PLACEHOLDER ===== */
function dropHandler(e){ e.preventDefault(); }
