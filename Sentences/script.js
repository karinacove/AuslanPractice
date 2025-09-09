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
let savedTimeElapsed = 0;
let answersHistory = [];

const TOTAL_LEVELS = 4;
let perLevelResults = Array.from({ length: TOTAL_LEVELS }, () => ({ correct: 0, incorrect: 0 }));

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

function clearProgress() { localStorage.removeItem(SAVE_KEY); }

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
  generateSentence();
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const isOdd = roundInLevel % 2 === 1;
  const comboDiv = document.createElement("div");

  // Question images logic simplified for brevity
  // (Use your existing composite images as in your previous code)
  questionArea.appendChild(comboDiv);

  buildAnswerBoxes(isOdd);
  buildDraggables(isOdd);
  updateScoreDisplay();
}

/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(isOdd) {
  answerArea.innerHTML = "";
  let dropLabels = [];
  if (currentLevel === 1) dropLabels = isOdd ? ["animal","how many?"] : ["animal+howmany?"];
  else if (currentLevel === 2) dropLabels = isOdd ? ["food","colour"] : ["food+colour"];
  else dropLabels = isOdd ? ["animal","how many?","verb","food","colour"] : ["animal+howmany?","verb","food+colour"];

  dropLabels.forEach(label => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label;
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    if (currentLevel === 3 && label === "verb") {
      const img = document.createElement("img");
      img.src = signPathFor("want");
      dz.appendChild(img);
      dz.dataset.filled = "want";
      dz.classList.add("filled");
      dz.dataset.permanent = "true";
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

  if (currentLevel === 1) items = isOdd ? [currentSentence.animal,currentSentence.number] : [currentSentence.animal+"-"+currentSentence.number];
  else if (currentLevel === 2) items = isOdd ? [currentSentence.food,currentSentence.colour] : [currentSentence.food+"-"+currentSentence.colour];
  else if (currentLevel === 3) items = isOdd ? [currentSentence.animal,currentSentence.number,currentSentence.food,currentSentence.colour] : [currentSentence.animal+"-"+currentSentence.number,currentSentence.food+"-"+currentSentence.colour];
  else if (currentLevel === 4) items = [`${currentSentence.animal}-${currentSentence.number}-${currentSentence.verb}-${currentSentence.food}-${currentSentence.colour}`];

  // Fill decoys
  const used = new Set(items);
  while (items.length < totalItems) {
    let decoy;
    if (isOdd) {
      if (currentLevel === 1) decoy = randomItem([...animals,...numbers]);
      else if (currentLevel === 2) decoy = randomItem([...food,...colours]);
      else if (currentLevel === 3) decoy = randomItem([...animals,...numbers,...food,...colours]);
      else decoy = randomItem([...animals,...numbers,...food,...colours,...verbs]);
    } else {
      let allCombos = [];
      if (currentLevel === 1) allCombos = animals.flatMap(a=>numbers.map(n=>`${a}-${n}`));
      else if (currentLevel === 2) allCombos = food.flatMap(f=>colours.map(c=>`${f}-${c}`));
      else if (currentLevel === 3) allCombos = [...animals.flatMap(a=>numbers.map(n=>`${a}-${n}`)),...food.flatMap(f=>colours.map(c=>`${f}-${c}`))];
      decoy = randomItem(allCombos);
    }
    if (!used.has(decoy)) { items.push(decoy); used.add(decoy); }
  }

  items = shuffleArray(items);
  const halves = [items.slice(0,8),items.slice(8,16)];
  halves.forEach((group, idx) => {
    const container = idx === 0 ? leftDraggables : rightDraggables;
    group.forEach(word => {
      const div = document.createElement("div");
      div.className = "draggable"; div.draggable = true; div.dataset.value = word;
      const img = document.createElement("img");
      img.src = word.includes("-") ? compositeImagePath(word) : signPathFor(word);
      div.appendChild(img);
      div.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", word));
      container.appendChild(div);
    });
  });
}

/* ===== DRAG & DROP HANDLERS ===== */
function dropHandler(e){ e.preventDefault(); }

/* ===== SCORE DISPLAY ===== */
function updateScoreDisplay() {
  const total = correctCount + incorrectCount;
  scoreDisplay.textContent = `Score: ${correctCount}/${total}`;
}

/* ===== GAME FLOW ===== */
function nextRound() {
  roundInLevel++;
  if (roundInLevel >= 10) endLevel();
  else { buildQuestion(); saveProgress(); }
}

async function endLevel() {
  if (currentLevel < TOTAL_LEVELS) {
    currentLevel++; roundInLevel=0; saveProgress(); buildQuestion();
  } else { await endGame(); }
}

async function endGame() {
  const timeTaken = getTimeElapsed();
  const total = correctCount + incorrectCount;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // --- Submit to Google Form ---
  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);

  for (let l = 1; l <= TOTAL_LEVELS; l++) {
    const cf = FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf = FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if (cf) fd.append(cf, perLevelResults[l-1].correct);
    if (inf) fd.append(inf, perLevelResults[l-1].incorrect);
  }

  try { await fetch(googleForm.action,{method:"POST",body:fd,mode:"no-cors"}); }
  catch(err){ console.warn("Form submission failed",err); }

  clearProgress();

  document.getElementById("endGif").src="assets/auslan-clap.gif";
  document.getElementById("finalTime").textContent=`${Math.floor(timeTaken/60)}:${(timeTaken%60).toString().padStart(2,"0")}`;
  document.getElementById("finalScore").textContent=`${correctCount}/${total}`;
  document.getElementById("finalPercent").textContent=percent + "%";

  endModal.style.display = "block";
}

/* ===== INITIALIZE GAME ===== */
startTime = Date.now();
buildQuestion();
