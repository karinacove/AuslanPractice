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

/* ===== MODAL BUTTONS (from HTML) ===== */
const againBtnEnd = document.getElementById("againBtnEnd");
const againBtnStop = document.getElementById("againBtnStop");
const finishBtn = document.getElementById("finishBtn");
const finishBtnStop = document.getElementById("finishBtnStop");

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
let levelCorrect = {1:0,2:0,3:0,4:0};
let levelIncorrect = {1:0,2:0,3:0,4:0};
const TOTAL_LEVELS = 4;

/* ===== VOCAB ===== */
const animals = ["dog","cat","mouse","rabbit","fish","bird"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const food = ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"];
const verbs = ["want","have","donthave"];
const helpers = ["i","see","what"];

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
  // seconds
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
    levelCorrect,
    levelIncorrect,
    timeElapsed: getTimeElapsed()
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); }
  catch { return null; }
}
function clearProgress() { localStorage.removeItem(SAVE_KEY); }

function showResumeModal(saved) {
  const modal = document.getElementById("resumeModal");
  const msg = document.getElementById("resumeMessage");
  const cont = document.getElementById("resumeContinue");
  const again = document.getElementById("resumeAgain");

  msg.textContent = `Welcome back ${saved.studentName}! Continue from Level ${saved.currentLevel}, Question ${saved.roundInLevel + 1}?`;

  cont.onclick = () => { modal.style.display = "none"; restoreProgress(saved); };
  again.onclick = () => { modal.style.display = "none"; clearProgress(); resetGame(); };

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
  levelCorrect = saved.levelCorrect || {1:0,2:0,3:0,4:0};
  levelIncorrect = saved.levelIncorrect || {1:0,2:0,3:0,4:0};
  setTimeElapsed(saved.timeElapsed || 0);
  buildQuestion();
}

/* ===== SENTENCE GENERATION ===== */
function generateSentence() {
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const foodItem = randomItem(food);
  const colour = randomItem(colours);
  const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";
  currentSentence = { animal, number, food: foodItem, colour, verb };
}

function buildQuestion() {
  generateSentence(); // pick a new sentence
  const isOdd = roundInLevel % 2 === 1;
  buildAnswerBoxes(isOdd);
  buildDraggables(isOdd);
  updateScoreDisplay();
}

/* ===== BUILD ANSWER BOXES =====
   placeholders: "animal", "howmany", "animal+howmany", "food", "colour", "food+colour", "verb"
*/
function buildAnswerBoxes(isOdd) {
  answerArea.innerHTML = "";
  let dropLabels = [];

  if (currentLevel === 1) dropLabels = isOdd ? ["animal", "howmany"] : ["animal+howmany"];
  else if (currentLevel === 2) dropLabels = isOdd ? ["food", "colour"] : ["food+colour"];
  else if (currentLevel === 3) dropLabels = isOdd ? ["animal", "howmany", "verb", "food", "colour"] : ["animal+howmany", "verb", "food+colour"];
  else if (currentLevel === 4) dropLabels = isOdd ? ["animal", "howmany", "verb", "food", "colour"] : ["animal+howmany", "verb", "food+colour"];

  dropLabels.forEach(label => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);

    // Level 3: prefill verb as permanent "want"
    if (currentLevel === 3 && label === "verb") {
      const img = document.createElement("img");
      img.src = signPathFor("want");
      dz.appendChild(img);
      dz.dataset.filled = "want";
      dz.classList.add("filled");
      dz.dataset.permanent = "true";
    }

    // Level 4: prefill verb as permanent (have/donthave)
    if (currentLevel === 4 && label === "verb") {
      if (!currentSentence.verb) currentSentence.verb = Math.random() < 0.5 ? "have" : "donthave";

      const img = document.createElement("img");
      if (currentSentence.verb === "donthave") {
        img.src = signPathFor("have");
        const wrapper = document.createElement("div");
        wrapper.className = "dontHaveWrapper";
        wrapper.appendChild(img);
        const xOverlay = document.createElement("div");
        xOverlay.className = "xOverlay";
        xOverlay.textContent = "X";
        wrapper.appendChild(xOverlay);
        dz.appendChild(wrapper);
      } else {
        img.src = signPathFor("have");
        dz.appendChild(img);
      }

      dz.dataset.filled = currentSentence.verb;
      dz.classList.add("filled");
      dz.dataset.permanent = "true";
    }

    answerArea.appendChild(dz);
  });
}

/* ===== BUILD ANSWER BOXES =====
   placeholders: "animal", "howmany", "animal+howmany", "food", "colour", "food+colour", "verb"
*/
function buildAnswerBoxes(isOdd) {
  answerArea.innerHTML = "";
  let dropLabels = [];

  if (currentLevel === 1) dropLabels = isOdd ? ["animal", "howmany"] : ["animal+howmany"];
  else if (currentLevel === 2) dropLabels = isOdd ? ["food", "colour"] : ["food+colour"];
  else if (currentLevel === 3) dropLabels = isOdd ? ["animal", "howmany", "verb", "food", "colour"] : ["animal+howmany", "verb", "food+colour"];
  else if (currentLevel === 4) dropLabels = isOdd ? ["animal", "howmany", "verb", "food", "colour"] : ["animal+howmany", "verb", "food+colour"];

  dropLabels.forEach(label => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);

    // Level 3: prefill verb as permanent "want"
    if (currentLevel === 3 && label === "verb") {
      const img = document.createElement("img");
      img.src = signPathFor("want");
      dz.appendChild(img);
      dz.dataset.filled = "want";
      dz.classList.add("filled");
      dz.dataset.permanent = "true";
    }

    // Level 4: prefill verb as permanent (have/donthave)
    if (currentLevel === 4 && label === "verb") {
      if (!currentSentence.verb) currentSentence.verb = Math.random() < 0.5 ? "have" : "donthave";

      const img = document.createElement("img");
      if (currentSentence.verb === "donthave") {
        img.src = signPathFor("have");
        const wrapper = document.createElement("div");
        wrapper.className = "dontHaveWrapper";
        wrapper.appendChild(img);
        const xOverlay = document.createElement("div");
        xOverlay.className = "xOverlay";
        xOverlay.textContent = "X";
        wrapper.appendChild(xOverlay);
        dz.appendChild(wrapper);
      } else {
        img.src = signPathFor("have");
        dz.appendChild(img);
      }

      dz.dataset.filled = currentSentence.verb;
      dz.classList.add("filled");
      dz.dataset.permanent = "true";
    }

    answerArea.appendChild(dz);
  });
}

/* ===== BUILD DRAGGABLES ===== */
function buildDraggables(isOdd) {
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  let items = [];
  const totalItems = 16;

  if (currentLevel === 1) {
    items = isOdd ? [currentSentence.animal, currentSentence.number] : [currentSentence.animal + "-" + currentSentence.number];
  } else if (currentLevel === 2) {
    items = isOdd ? [currentSentence.food, currentSentence.colour] : [currentSentence.food + "-" + currentSentence.colour];
  } else if (currentLevel === 3) {
    items = isOdd ? [currentSentence.animal, currentSentence.number, currentSentence.food, currentSentence.colour] : [currentSentence.animal + "-" + currentSentence.number, currentSentence.food + "-" + currentSentence.colour];
  } else if (currentLevel === 4) {
    // Odd: composite images with X if donthave, Even: individual signs
    if (isOdd) {
      items = [
        `${currentSentence.animal}-${currentSentence.number}`,
        currentSentence.verb,
        `${currentSentence.food}-${currentSentence.colour}`
      ];
    } else {
      items = [
        currentSentence.animal,
        currentSentence.number,
        currentSentence.verb,
        currentSentence.food,
        currentSentence.colour
      ];
    }
  }

  // Add decoys
  const used = new Set(items);
  while (items.length < totalItems) {
    let decoy;
    if (isOdd) {
      if (currentLevel === 1) decoy = randomItem([...animals, ...numbers]);
      else if (currentLevel === 2) decoy = randomItem([...food, ...colours]);
      else if (currentLevel === 3) decoy = randomItem([...animals, ...numbers, ...food, ...colours]);
      else if (currentLevel === 4) decoy = randomItem([...animals, ...numbers, ...food, ...colours, ...verbs]);
    } else {
      let allCombos = [];
      if (currentLevel === 1) allCombos = animals.flatMap(a => numbers.map(n => `${a}-${n}`));
      else if (currentLevel === 2) allCombos = food.flatMap(f => colours.map(c => `${f}-${c}`));
      else if (currentLevel === 3) allCombos = [
        ...animals.flatMap(a => numbers.map(n => `${a}-${n}`)),
        ...food.flatMap(f => colours.map(c => `${f}-${c}`))
      ];
      else if (currentLevel === 4) allCombos = [
        ...animals.flatMap(a => numbers.map(n => `${a}-${n}`)),
        ...food.flatMap(f => colours.map(c => `${f}-${c}`)),
        ...verbs
      ];
      decoy = randomItem(allCombos);
    }
    if (!used.has(decoy)) { items.push(decoy); used.add(decoy); }
  }

  items = shuffleArray(items);
  const halves = [items.slice(0, 8), items.slice(8, 16)];

  halves.forEach((group, idx) => {
    const container = idx === 0 ? leftDraggables : rightDraggables;
    group.forEach(word => {
      const div = document.createElement("div");
      div.className = "draggable";
      div.draggable = true;
      div.dataset.value = word;

      let img;

      // LEVEL 4: verb X overlay
      if (currentLevel === 4 && (word === "donthave" || word === "have")) {
        if (word === "donthave") {
          img = document.createElement("img");
          img.src = compositeImagePath(currentSentence.food+'-'+currentSentence.colour);
          const wrapper = document.createElement("div");
          wrapper.className = "dontHaveWrapper";
          wrapper.appendChild(img);
          const xOverlay = document.createElement("div");
          xOverlay.className = "xOverlay";
          xOverlay.textContent = "X";
          wrapper.appendChild(xOverlay);
          div.appendChild(wrapper);
        } else {
          img = document.createElement("img");
          img.src = signPathFor("have");
          div.appendChild(img);
        }
      } else {
        img = document.createElement("img");
        img.src = word.includes("-") ? compositeImagePath(word) : signPathFor(word);
        div.appendChild(img);
      }

      div.addEventListener("dragstart", e => {
        try { e.dataTransfer.setData("text/plain", word); } catch (err) {}
      });

      container.appendChild(div);
    });
  });
}

/* ===== DROP HANDLING (native) ===== */
function dropHandler(e) {
  e.preventDefault();
  const dz = e.currentTarget;
  const value = e.dataTransfer.getData("text/plain");
  if (!value) return;
  handleDropOnZone(dz, value);
}

/* ===== UNIFIED TOUCH/MOUSE DRAG (clone visual) ===== */
let dragItem = null, dragClone = null, isTouch = false;

function startDrag(e) {
  const target = e.target.closest(".draggable");
  if (!target) return;
  // only start custom drag for touch or if left-button mousedown (avoid interfering with native HTML5 drag)
  if (e.type === "mousedown" && e.button !== 0) return;

  dragItem = target;
  isTouch = e.type.startsWith("touch");
  const rect = target.getBoundingClientRect();
  dragClone = target.cloneNode(true);
  dragClone.style.position = "fixed";
  dragClone.style.left = rect.left + "px";
  dragClone.style.top = rect.top + "px";
  dragClone.style.width = rect.width + "px";
  dragClone.style.height = rect.height + "px";
  dragClone.style.opacity = "0.75";
  dragClone.style.pointerEvents = "none";
  dragClone.style.zIndex = 10000;
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

function moveDrag(e) {
  if (!dragClone) return;
  let clientX, clientY;
  if (isTouch && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }
  dragClone.style.left = (clientX - dragClone.offsetWidth / 2) + "px";
  dragClone.style.top = (clientY - dragClone.offsetHeight / 2) + "px";
}

function endDrag(e) {
  if (!dragClone || !dragItem) return;

  let clientX, clientY;
  if (isTouch && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX; clientY = e.clientY;
  }

  // find dropzone under point
  const dropzones = Array.from(document.querySelectorAll(".dropzone"));
  let dropped = false;
  for (const dz of dropzones) {
    const rect = dz.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      // if dropzone occupied and not permanent, allow overwrite? We disallow overwriting non-permanent filled zones in this implementation
      if (dz.dataset.permanent === "true") { /* do nothing on permanent */ }
      else {
        handleDropOnZone(dz, dragItem.dataset.value);
        dropped = true;
        break;
      }
    }
  }

  // cleanup clone and listeners
  if (dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
  dragClone = null; dragItem = null;
  if (isTouch) {
    document.removeEventListener("touchmove", moveDrag);
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }

  if (dropped) {
    againBtn.style.display = "inline-block";
    const allFilled = Array.from(document.querySelectorAll(".dropzone")).every(d => d.dataset.filled);
    checkBtn.style.display = allFilled ? "inline-block" : "none";
  }
}

document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive: false });

/* ===== Centralized drop handling logic (used by native drop & custom drag) ===== */
function handleDropOnZone(dz, value) {
  // Do not overwrite permanent dropzone
  if (dz.dataset.permanent === "true") return;

  // Level 4 special: if a full composite (animal-number-verb-food-colour) is dropped, fill relevant boxes
  if (currentLevel === 4 && typeof value === "string" && value.split("-").length === 5) {
    const [animal, number, verb, foodItem, colour] = value.split("-");
    // Fill all dropzones appropriately
    const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
    dzs.forEach(dzBox => {
      dzBox.innerHTML = "";
      dzBox.classList.add("filled");
      if (dzBox.dataset.placeholder === "animal+howmany") {
        const img = document.createElement("img");
        img.src = compositeImagePath(`${animal}-${number}`);
        dzBox.appendChild(img);
        dzBox.dataset.filled = `${animal}-${number}`;
      } else if (dzBox.dataset.placeholder === "verb") {
        const img = document.createElement("img");
        img.src = signPathFor(verb);
        dzBox.appendChild(img);
        dzBox.dataset.filled = verb;
      } else if (dzBox.dataset.placeholder === "food+colour") {
        const img = document.createElement("img");
        img.src = compositeImagePath(`${foodItem}-${colour}`);
        dzBox.appendChild(img);
        // special case for "donthave"
        dzBox.dataset.filled = (verb === "donthave") ? "donthave" : `${foodItem}-${colour}`;
        if (verb === "donthave") {
          const xDiv = document.createElement("div");
          xDiv.className = "xOverlay";
          xDiv.textContent = "X";
          dzBox.appendChild(xDiv);
        }
      } else {
        // individual placeholders (e.g. animal, howmany, etc)
        if (dzBox.dataset.placeholder === "animal") {
          const img = document.createElement("img");
          img.src = signPathFor(animal);
          dzBox.appendChild(img);
          dzBox.dataset.filled = animal;
        } else if (dzBox.dataset.placeholder === "howmany") {
          const img = document.createElement("img");
          img.src = signPathFor(number);
          dzBox.appendChild(img);
          dzBox.dataset.filled = number;
        } else if (dzBox.dataset.placeholder === "food") {
          const img = document.createElement("img");
          img.src = signPathFor(foodItem);
          dzBox.appendChild(img);
          dzBox.dataset.filled = foodItem;
        } else if (dzBox.dataset.placeholder === "colour") {
          const img = document.createElement("img");
          img.src = signPathFor(colour);
          dzBox.appendChild(img);
          dzBox.dataset.filled = colour;
        }
      }
    });
  } else {
    // Regular single drop into this dz
    dz.innerHTML = "";
    let imgEl;
    if (value.includes("-")) {
      imgEl = document.createElement("img");
      imgEl.src = compositeImagePath(value);
    } else {
      imgEl = document.createElement("img");
      imgEl.src = signPathFor(value);
    }
    dz.appendChild(imgEl);
    dz.dataset.filled = value;
    dz.classList.add("filled");
  }
}

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click", () => {
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;

  dropzones.forEach((dz, i) => {
    // Permanent "want" (level 3 verb) is always correct
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
      const seq = (roundInLevel % 2 === 1)
        ? [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour]
        : [currentSentence.animal + "-" + currentSentence.number, currentSentence.verb, currentSentence.food + "-" + currentSentence.colour];
      expected = seq[i] || "";
    } else if (currentLevel === 4) {
      // placeholders for level 4: either [animal, howmany, verb, food, colour] or ["animal+howmany","verb","food+colour"]
      if (dz.dataset.placeholder === "animal+howmany") expected = currentSentence.animal + "-" + currentSentence.number;
      else if (dz.dataset.placeholder === "verb") expected = currentSentence.verb;
      else if (dz.dataset.placeholder === "food+colour") expected = (currentSentence.verb === "donthave") ? "donthave" : (currentSentence.food + "-" + currentSentence.colour);
      else {
        // single placeholders
        if (dz.dataset.placeholder === "animal") expected = currentSentence.animal;
        else if (dz.dataset.placeholder === "howmany") expected = currentSentence.number;
        else if (dz.dataset.placeholder === "food") expected = currentSentence.food;
        else if (dz.dataset.placeholder === "colour") expected = currentSentence.colour;
      }
    }

    if (dz.dataset.filled === expected) {
      correctCount++;
      levelCorrect[currentLevel]++;
      dz.classList.add("correct");
    } else {
      incorrectCount++;
      levelIncorrect[currentLevel]++;
      allCorrect = false;
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("correct", "filled");
      dz.classList.add("incorrect");
    }
  });

  // show feedback image
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  feedbackDiv.appendChild(fb);

  saveProgress();

  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if (allCorrect) nextRound();
    else {
      // rebuild palette (so students can try again) and hide check
      buildDraggables(roundInLevel % 2 === 1);
      checkBtn.style.display = "none";
      againBtn.style.display = "inline-block";
    }
  }, 1200);
});

/* ===== AGAIN BUTTON (clear non-permanent answers) ===== */
againBtn.addEventListener("click", () => {
  buildDraggables(roundInLevel % 2 === 1);
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz => {
    if (dz.dataset.permanent !== "true") {
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("correct", "incorrect", "filled");
    } else {
      dz.classList.add("correct"); // keep permanent filled
    }
  });
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== GAME FLOW ===== */
function nextRound() {
  roundInLevel++;
  if (roundInLevel >= 10) {
    endLevel();
  } else {
    buildQuestion();
    saveProgress();
  }
}

/* ===== FORM SUBMISSION (Levels 1-4 only) ===== */
async function submitResults() {
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);

  for (let l = 1; l <= TOTAL_LEVELS; l++) {
    const cf = FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf = FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if (cf) fd.append(cf, levelCorrect[l]);
    if (inf) fd.append(inf, levelIncorrect[l]);
  }

  try {
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
  } catch (err) {
    console.warn("Form submission failed", err);
  }
}

/* ===== END LEVEL / FINISH ===== */
async function endLevel() {
  if (currentLevel < TOTAL_LEVELS) {
    // advance to next level
    currentLevel++;
    roundInLevel = 0;
    buildQuestion();
    saveProgress();
    return;
  }

  // final level completed -> submit and show end modal
  await submitResults();
  clearProgress();
  endModal.style.display = "block";
  document.getElementById("endGif").src = "assets/auslan-clap.gif";
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  document.getElementById("finalTime").textContent = `${Math.floor(getTimeElapsed()/60)}m ${getTimeElapsed()%60}s`;
  document.getElementById("finalScore").textContent = `${totalCorrect}/${totalAttempts}`;
  document.getElementById("finalPercent").textContent = Math.round((totalAttempts>0 ? (totalCorrect / totalAttempts * 100) : 0)) + "%";
}

/* ===== END MODAL BUTTONS ===== */
if (finishBtn) finishBtn.onclick = () => { window.location.href = "../index.html"; };
if (againBtnEnd) againBtnEnd.onclick = () => { endModal.style.display = "none"; resetGame(); };
const logoffBtn = document.getElementById("logoffBtn");
if (logoffBtn) logoffBtn.onclick = () => { window.location.href = "../index.html"; };

/* ===== STOP BUTTON ===== */
stopBtn.addEventListener("click", () => {
  savedTimeElapsed = getTimeElapsed();
  const totalAttempts = correctCount + incorrectCount;
  const percent = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const modal = document.getElementById("stopModal");
  modal.style.display = "block";
  document.getElementById("stopTime").textContent = `${Math.floor(savedTimeElapsed/60)}m ${savedTimeElapsed%60}s`;
  document.getElementById("stopPercent").textContent = percent + "%";

  document.getElementById("continueBtn").onclick = () => { modal.style.display = "none"; startTime = Date.now(); };
  document.getElementById("againBtnStop").onclick = () => { modal.style.display = "none"; resetGame(); };

  document.getElementById("finishBtnStop").onclick = async () => {
    modal.style.display = "none";
    await submitResults();
    clearProgress();
    // show end modal (instead of redirect)
    endModal.style.display = "block";
    document.getElementById("endGif").src = "assets/auslan-clap.gif";
    const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
    const totalAttempts2 = totalCorrect + Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
    document.getElementById("finalTime").textContent = `${Math.floor(getTimeElapsed()/60)}m ${getTimeElapsed()%60}s`;
    document.getElementById("finalScore").textContent = `${totalCorrect}/${totalAttempts2}`;
    document.getElementById("finalPercent").textContent = Math.round((totalAttempts2>0 ? (totalCorrect/totalAttempts2*100) : 0)) + "%";
  };
});

/* ===== START/RESET/UTILS ===== */
function startGame(){ startTime = Date.now(); buildQuestion(); }
function resetGame(){
  currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0;
  savedTimeElapsed = 0;
  levelCorrect = {1:0,2:0,3:0,4:0};
  levelIncorrect = {1:0,2:0,3:0,4:0};
  answersHistory = [];
  setTimeElapsed(0);
  startGame();
}
function updateScoreDisplay(){ scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/10`; }

/* ===== INIT ===== */
window.addEventListener("load", () => {
  const saved = loadProgress();
  if (saved && saved.studentName) { showResumeModal(saved); }
  else { resetGame(); }
});
