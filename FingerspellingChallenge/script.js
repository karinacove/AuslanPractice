// -------------------------
// Initial Setup
// -------------------------
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
}

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const signinScreen = document.getElementById("signin-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const timerDisplay = document.querySelector("#timer .value");
const scoreDisplay = document.querySelector("#score .value");
const letterDisplay = document.getElementById("letter-display");
const againButton = document.getElementById("again-button");
const finishButton = document.getElementById("finishButton");

if (studentInfoDiv) {
  studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
}
if (gameContainer) {
  gameContainer.style.display = "block";
}

// -------------------------
// Game State
// -------------------------
let timer;
let timeLeft = 120;
let score = 0;
let currentWord = "";
let letterTimeouts = [];
let speed = 60; // Slower by default
let correctWords = 0;
let gameMode = "timed";
let wordLength = 3;
let guessedWords = new Set();
let incorrectWords = [];
let wordBank = {};
let speedMultiplier = 1;

// -------------------------
// Load Word List
// -------------------------
fetch("data/wordlist.json")
  .then((response) => response.json())
  .then((data) => {
    wordBank = data;
  })
  .catch((error) => console.error("Error loading word list:", error));

// -------------------------
// Letter Display
// -------------------------
function showLetterByLetter(word) {
  clearLetters();
  currentLetterIndex = 0;
  letterDisplay.textContent = "";
  const baseDelay = 300 * speedMultiplier;
  const displayDuration = 200 * speedMultiplier;

  word.split("").forEach((letter, index) => {
    const timeout = setTimeout(() => {
      letterDisplay.textContent = letter.toLowerCase();
      const hideTimeout = setTimeout(() => {
        if (letterDisplay.textContent === letter.toLowerCase()) {
          letterDisplay.textContent = "";
        }
      }, displayDuration);
      letterTimeouts.push(hideTimeout);
    }, 500 + index * baseDelay); // start after 0.5s, then spaced per letter
    letterTimeouts.push(timeout);
  });
}

function clearLetters() {
  letterTimeouts.forEach(clearTimeout);
  letterTimeouts = [];
  letterDisplay.textContent = "";
}

// -------------------------
// Game Functions
// -------------------------
function startGame() {
  signinScreen.style.display = "none";
  gameScreen.style.display = "flex";
  score = 0;
  timeLeft = 120;
  correctWords = 0;
  guessedWords.clear();
  incorrectWords = [];
  updateScore();
  updateTimer();
  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();
  againButton.style.display = "block";
  startTimer();
  setTimeout(nextWord, 500); // Delay before first word
}

function nextWord() {
  if (gameMode === "levelup" && correctWords > 0 && correctWords % 10 === 0 && wordLength < 10) {
    wordLength++;
  }
  const words = wordBank[wordLength] || wordBank[3];
  currentWord = words[Math.floor(Math.random() * words.length)];
  showLetterByLetter(currentWord);
}

function updateScore() {
  scoreDisplay.textContent = score;
}

function updateTimer() {
  timerDisplay.textContent = timeLeft;
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(timer);
  clearLetters();
  wordInput.style.visibility = "hidden";
  againButton.style.display = "block";
  letterDisplay.textContent = "Great work!";
  submitResults();
}

function endGameManually() {
  clearInterval(timer);
  clearLetters();
  wordInput.style.visibility = "hidden";
  againButton.style.display = "block";
  letterDisplay.textContent = "Great work!";
  submitResults();
  showEndModal();
}

function submitResults() {
  const correct = Array.from(guessedWords).join(", ");
  const wrong = incorrectWords.join(", ");
  const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?entry.423692452=${encodeURIComponent(studentName)}&entry.1307864012=${encodeURIComponent(studentClass)}&entry.468778567=${encodeURIComponent(gameMode)}&entry.1083699348=${score}&entry.746947164=${encodeURIComponent(correct)}&entry.1534005804=${encodeURIComponent(wrong)}&entry.1974555000=${encodeURIComponent(speedSlider.value)}`;
  fetch(formURL, { method: "POST", mode: "no-cors" });
}

function showEndModal() {
  const modal = document.createElement("div");
  modal.id = "end-modal";
  modal.style.position = "fixed";
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = 9999;

  const options = [
    { id: "continue", img: "Assets/Icons/continue.png", action: startGame },
    { id: "again", img: "Assets/Icons/Again.png", action: () => location.reload() },
    { id: "menu", img: "Assets/Icons/menu.png", action: () => location.href = "../index.html" },
    { id: "logout", img: "Assets/Icons/logout.png", action: () => {
      localStorage.clear();
      location.href = "../index.html";
    }}
  ];

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.id = opt.id;
    btn.style.background = "transparent";
    btn.style.border = "none";
    btn.style.margin = "10px";
    btn.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = opt.img;
    img.alt = opt.id;
    img.style.height = "80px";
    btn.appendChild(img);

    btn.onclick = () => {
      modal.remove();
      opt.action();
    };

    modal.appendChild(btn);
  });

  document.body.appendChild(modal);
}

// -------------------------
// Event Listeners
// -------------------------
startButton.addEventListener("click", () => {
  const selectedMode = document.getElementById("game-mode");
  const selectedLength = document.getElementById("word-length");
  gameMode = selectedMode ? selectedMode.value : "timed";
  wordLength = selectedLength ? parseInt(selectedLength.value) : 3;
  document.getElementById("length-container").style.display = (gameMode === "levelup") ? "none" : "block";
  startGame();
});

wordInput.addEventListener("input", () => {
  const typed = wordInput.value.trim().toLowerCase();
  if (typed.length === currentWord.length) {
    if (typed === currentWord) {
      score++;
      correctWords++;
      guessedWords.add(currentWord);
      updateScore();
      wordInput.value = "";
      setTimeout(nextWord, 400);
    } else {
      incorrectWords.push(typed);
      wordInput.classList.add("breathe");
      setTimeout(() => wordInput.classList.remove("breathe"), 300);
    }
  }
});

speedSlider.addEventListener("input", () => {
  const val = parseInt(speedSlider.value); // range 0–200
  speedMultiplier = 1 + (200 - val) / 100; // inverse: low slider = slow
});


againButton.addEventListener("click", () => {
  showLetterByLetter(currentWord);
  wordInput.style.visibility = "visible";
  wordInput.value = "";
  wordInput.focus();
});

finishButton.addEventListener("click", () => {
  endGameManually();
});
