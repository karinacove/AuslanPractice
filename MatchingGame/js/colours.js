// ====== GLOBALS ======
let currentLevel = 0;
let currentPage = 0;
let correctCount = 0;
let incorrectCount = 0;
let startTime = Date.now();
let gameEnded = false;

let currentColours = []; // 5 colours per page
const pagesPerLevel = 3;

const allColours = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "brown", "black", "white"];
const levels = [
  { type: "signToImage" },
  { type: "imageToSign" },
  { type: "mixed" },
  { type: "signToImage" },
  { type: "imageToSign" },
  { type: "mixed" }
];

// ====== DOM ELEMENTS ======
const gameBoard = document.getElementById("game-board");
const leftSigns = document.getElementById("left-signs");
const rightSigns = document.getElementById("right-signs");
const levelTitle = document.getElementById("level-title");
const scoreDisplay = document.getElementById("score-display");

// Modal
const modal = document.getElementById("end-modal");
const modalScoreDisplay = document.getElementById("score-display-modal");
const continueBtn = document.getElementById("continue-btn");
const finishBtn = document.getElementById("finish-btn");
const againBtn = document.getElementById("again-btn");

// ====== HELPERS ======
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function updateScore() {
  scoreDisplay.innerText = `Score: ${correctCount}`;
}

function showFeedback(el, success) {
  const feedback = document.createElement("div");
  feedback.className = success ? "correct" : "incorrect";
  el.appendChild(feedback);
  setTimeout(() => feedback.remove(), 1000);
}

// ====== DROP HANDLER ======
function drop(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData("text/plain");
  const src = e.dataTransfer.getData("src");

  const target = e.currentTarget;
  const expected = target.dataset.letter;

  if (data === expected) {
    target.style.backgroundImage = `url('assets/colours/clipart/${expected}.png')`;
    correctCount++;
    showFeedback(target, true);
  } else {
    incorrectCount++;
    showFeedback(target, false);
  }
  updateScore();

  // Move to next page if all slots filled
  if ([...document.querySelectorAll(".slot")].every(s => s.style.backgroundImage.includes("clipart"))) {
    currentPage++;
    if (currentPage >= pagesPerLevel) {
      currentPage = 0;
      currentLevel++;
    }
    saveProgress();
    setTimeout(() => loadPage(), 800);
  }
}

// ====== TOUCH HANDLER ======
function touchStart(e) {
  e.preventDefault();
  const target = e.target;
  const colour = target.dataset.letter;
  const src = target.src;

  const clone = target.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.pointerEvents = "none";
  clone.style.opacity = "0.7";
  clone.style.zIndex = "10000";
  document.body.appendChild(clone);

  const moveClone = (touch) => {
    clone.style.left = `${touch.clientX - clone.width / 2}px`;
    clone.style.top = `${touch.clientY - clone.height / 2}px`;
  };

  moveClone(e.touches[0]);

  const handleTouchMove = (ev) => moveClone(ev.touches[0]);
  const handleTouchEnd = (ev) => {
    const touch = ev.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains("slot")) {
      drop({
        preventDefault: () => {},
        dataTransfer: {
          getData: (k) => (k === "text/plain" ? colour : src),
        },
        currentTarget: el
      });
    }
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    clone.remove();
  };

  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, { passive: false });
}

// ====== PAGE LOADER ======
function loadPage() {
  if (currentLevel >= levels.length) {
    clearProgress();
    endGame();
    return;
  }

  const { type: mode } = levels[currentLevel];
  gameBoard.innerHTML = "";
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  levelTitle.innerText = `Level ${currentLevel + 1}: ` +
    (mode === "signToImage" ? "Match the Sign to the Picture" :
     mode === "imageToSign" ? "Match the Picture to the Sign" :
     "Match Signs and Pictures (Mixed)");

  // initialise colours once per level
  if (currentPage === 0 && currentColours.length === 0) {
    const shuffled = shuffle([...allColours]);
    currentColours = [];
    for (let i = 0; i < pagesPerLevel; i++) {
      currentColours.push(shuffle(shuffled.slice(i * 5, (i + 1) * 5)));
    }
  }

  const pageColours = currentColours[currentPage] || [];

  // build slots
  pageColours.forEach(colour => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.letter = colour;
    let showSign = mode === "imageToSign" || (mode === "mixed" && Math.random() < 0.5);
    slot.style.backgroundImage = `url('assets/colours/${showSign ? `signs/sign-${colour}.png` : `clipart/${colour}.png`}')`;
    gameBoard.appendChild(slot);
  });

  // build draggables
  const draggables = shuffle(pageColours);
  draggables.forEach(colour => {
    const img = document.createElement("img");
    img.src = `assets/colours/${mode === "signToImage" ? `clipart/${colour}.png` : `signs/sign-${colour}.png`}`;
    img.className = "draggable";
    img.dataset.letter = colour;
    img.draggable = true;
    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", colour);
      e.dataTransfer.setData("src", img.src);
    });
    img.addEventListener("touchstart", touchStart, { passive: false });
    leftSigns.appendChild(img);
  });

  // hook slots
  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", drop);
  });

  updateScore();
}

// ====== SAVE/LOAD PROGRESS ======
function saveProgress() {
  const data = { currentLevel, currentPage, correctCount, incorrectCount, currentColours };
  localStorage.setItem("coloursSavedProgress", JSON.stringify(data));
}

function loadProgress() {
  const data = JSON.parse(localStorage.getItem("coloursSavedProgress"));
  if (data) {
    currentLevel = data.currentLevel;
    currentPage = data.currentPage;
    correctCount = data.correctCount;
    incorrectCount = data.incorrectCount;
    currentColours = data.currentColours;
  }
}

function clearProgress() {
  localStorage.removeItem("coloursSavedProgress");
}

// ====== END GAME ======
function endGame() {
  if (gameEnded) return;
  gameEnded = true;

  const endTime = Date.now();
  const timeTaken = Math.round((endTime - startTime) / 1000);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  modalScoreDisplay.innerText = `Score: ${correctCount} in ${minutes}m ${seconds}s`;
  modal.style.display = "flex";

  submitResults(timeTaken);
}

function submitResults(timeTaken) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://docs.google.com/forms/d/e/FORM_ID/formResponse";

  const fields = {
    "entry.123456": "StudentName",
    "entry.234567": "ClassName",
    "entry.345678": "Colours",
    "entry.456789": timeTaken,
    "entry.567890": `${correctCount}/${correctCount + incorrectCount}`
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

// ====== BUTTONS ======
if (finishBtn) {
  finishBtn.addEventListener("click", () => {
    endGame();
    window.location.href = "../index.html";
  });
}

if (continueBtn) {
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    loadPage();
  });
}

if (againBtn) {
  againBtn.addEventListener("click", () => {
    clearProgress();
    location.reload();
  });
}

// ====== INIT ======
if (localStorage.getItem("coloursSavedProgress")) loadProgress();
loadPage();
