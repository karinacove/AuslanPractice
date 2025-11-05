// ====== GLOBAL VARIABLES ======
let currentLevel = 1;
let score = 0;
let totalQuestions = 0;
let correctAnswers = 0;
let currentQuestion = null;
let selectedAnswers = [];
let dragSources = [];
let dropzones = [];

const leftArea = document.getElementById("draggablesLeft");
const rightArea = document.getElementById("draggablesRight");
const verbArea = document.getElementById("verbDraggables");
const checkBtn = document.getElementById("checkBtn");
const questionArea = document.getElementById("questionArea");
const row1 = document.getElementById("sentenceRow1");
const row2 = document.getElementById("sentenceRow2");
const row3 = document.getElementById("sentenceRow3");

// Safety check
if (!leftArea || !rightArea || !row1 || !row2 || !row3) {
  console.error("Missing HTML containers — check HTML structure");
}

// ====== HELPER LOAD ======
function loadHelpers() {
  row1.innerHTML = "";
  const helperI = createHelperImage("i");
  const helperVerb = createHelperImage(currentLevel === 3 ? "feel" : "see");
  const helperWhat = createHelperImage("what");

  row1.appendChild(helperI);
  row1.appendChild(helperVerb);
  row1.appendChild(helperWhat);
}

function createHelperImage(name) {
  const img = document.createElement("img");
  img.src = `assets/signs/helpers/${name}.png`;
  img.alt = name;
  img.className = "helper";
  return img;
}

// ====== BUILD QUESTION ======
function buildQuestion(level) {
  // Reset rows
  row2.innerHTML = "";
  row3.innerHTML = "";
  selectedAnswers = [];

  loadHelpers();

  // Determine question content by level
  const dropCount = getDropCountForLevel(level);
  createDropzones(dropCount);

  // Build the rest of the question
  if (level <= 3) {
    // Sign question → image draggable
    populateDraggables("images", level);
  } else if (level <= 6) {
    // Image question → sign draggable
    populateDraggables("signs", level);
  } else if (level <= 10) {
    // Complex sentences with overlays
    populateDraggables(level % 2 === 1 ? "images" : "signs", level);
  } else {
    // Level 11–12 mixed mode
    populateDraggables(level % 2 === 1 ? "images" : "signs", level);
  }

  // Hide check until all filled
  checkBtn.style.display = "none";
}

// ====== DROPPABLE AREAS ======
function createDropzones(count) {
  const targetRow = count <= 3 ? row2 : row3;
  targetRow.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.index = i;
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", handleDrop);
    targetRow.appendChild(dz);
  }

  dropzones = Array.from(targetRow.querySelectorAll(".dropzone"));
}

// ====== DRAGGABLES ======
function populateDraggables(type, level) {
  leftArea.innerHTML = "";
  rightArea.innerHTML = "";
  verbArea.innerHTML = "";

  let leftItems = [];
  let rightItems = [];
  let verbs = ["have", "donthave", "want", "see", "feel"];

  if (type === "images") {
    leftItems = ["dog", "cat", "bird", "fish"];
    rightItems = ["1", "2", "3", "4"];
  } else if (type === "signs") {
    leftItems = ["dog", "cat", "bird", "fish"];
    rightItems = ["1", "2", "3", "4"];
  }

  // Create draggable items
  makeDraggables(leftArea, leftItems, type);
  makeDraggables(rightArea, rightItems, type);
  makeDraggables(verbArea, verbs, "signs");
}

function makeDraggables(container, items, type) {
  items.forEach(word => {
    const drag = document.createElement("div");
    drag.className = "draggable";
    drag.draggable = true;
    drag.dataset.word = word;

    if (type === "images") {
      const img = document.createElement("img");
      img.src = `assets/images/animals/${word}.png`;
      drag.appendChild(img);
    } else if (type === "signs") {
      const img = document.createElement("img");
      img.src = `assets/signs/animals/${word}-sign.png`;
      drag.appendChild(img);
    }

    drag.addEventListener("dragstart", handleDragStart);
    container.appendChild(drag);
  });
}

function handleDragStart(e) {
  e.dataTransfer.setData("text", e.target.dataset.word);
}

function handleDrop(e) {
  e.preventDefault();
  const word = e.dataTransfer.getData("text");
  const dropped = document.createElement("span");
  dropped.textContent = word;
  e.target.innerHTML = "";
  e.target.appendChild(dropped);
  selectedAnswers.push(word);

  if (selectedAnswers.length === dropzones.length) {
    checkBtn.style.display = "block";
  }
}

// ====== LEVEL LOGIC ======
function getDropCountForLevel(level) {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  if (level <= 10) return 5;
  if (level === 11) return 3;
  if (level === 12) return 9;
  return 1;
}

// ====== GAME INIT ======
function initGame() {
  buildQuestion(currentLevel);
  setupModals();
}

function setupModals() {
  const resumeModal = document.getElementById("resumeModal");
  if (!resumeModal) return;
  resumeModal.style.display = "none";
}

// ====== START ======
document.addEventListener("DOMContentLoaded", initGame);
