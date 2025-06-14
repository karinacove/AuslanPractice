// -------------------------
// Student Sign-in Handling
// -------------------------
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const logoutBtn = document.getElementById("logoutBtn");
const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const signinScreen = document.getElementById("signin-screen");
const gameScreen = document.getElementById("game-screen");

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html"; 
} else {
  if (studentInfoDiv) {
    studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  }
  if (gameContainer) {
    gameContainer.style.display = "block";
  }
}

// Logout clears localStorage and redirects
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  window.location.href = "../index.html";
});

// -------------------------
// Game Variables
// -------------------------
let wordLists = {};
let currentWord = "";
let guessedWords = new Set();
let incorrectWords = [];
let mode = "";
let level = 3;
let timerInterval;
let selectedWordLength = 3;
let score = 0;
let correctCount = 0;
let isSpelling = false;

// DOM Elements
const modeSelect = document.getElementById("game-mode");
const wordLengthSelect = document.getElementById("word-length");
const letterDisplay = document.getElementById("letter-display");
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const againButton = document.getElementById("again-button");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const clapDisplay = document.getElementById("clap-display");
const finishButton = document.getElementById("finishButton");
const startGame = document.getElementById("start-button");
const endButton = document.getElementById("end-button");

// -------------------------
// Load Word List
// -------------------------
fetch("data/wordlist.json")
  .then(response => response.json())
  .then(data => {
    wordLists = data;
  })
  .catch(error => {
    console.error("Error loading word list:", error);
    alert("Failed to load word list. Try refreshing the page.");
  });

// -------------------------
// Game Setup & Start
// -------------------------
modeSelect.addEventListener("change", () => {
  document.getElementById("length-container").style.display = modeSelect.value === "timed" ? "block" : "none";
});

document.getElementById("start-button").addEventListener("click", () => {
  if (!studentName || !studentClass) {
    alert("Please log in first.");
    return;
  }

  mode = modeSelect.value;
  guessedWords.clear();
  incorrectWords = [];
  level = 3;
  score = 0;
  correctCount = 0;
  scoreDisplay.textContent = "Score: 0";
  wordInput.value = "";
  letterDisplay.textContent = "";
  wordInput.focus();
  selectedWordLength = parseInt(wordLengthSelect?.value || "3");
  document.getElementById("speed-container").style.marginTop = "30vh";


  signinScreen.style.display = "none";
  gameScreen.style.display = "flex";
  clapDisplay.innerHTML = "";
  againButton.style.display = "block";

  endButton.disabled = false;
  endButton.style.display = mode === "levelup" ? "inline-block" : "none";

  document.getElementById("start-button").style.display = "none";

  if (mode === "timed") {
    startTimedMode();
  } else {
    setTimeout(showNextWord, 500);
  }
});

// -------------------------
// Timer Mode
// -------------------------
function startTimedMode() {
  let timeLeft = 120;
  timerDisplay.textContent = `Time: ${timeLeft}`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);

  setTimeout(showNextWord, 500);
}

// -------------------------
// Show Word for Spelling
// -------------------------
function showNextWord() {
  let pool = mode === "levelup" ? wordLists[level.toString()] || [] : wordLists[selectedWordLength.toString()] || [];
  let filtered = pool.filter(w => !guessedWords.has(w));

  if (!filtered.length && !incorrectWords.length) {
    if (mode === "levelup" && level < 10) {
      level++;
      correctCount = 0;
      showNextWord();
      return;
    } else {
      endGame();
      return;
    }
  }

  currentWord = incorrectWords.length ? incorrectWords.shift() : filtered[Math.floor(Math.random() * filtered.length)];
  letterDisplay.textContent = "";
  setTimeout(displayLetters, 500);
}

// -------------------------
// Display Letters Sequentially
// -------------------------
function displayLetters() {
  if (isSpelling) return;
  isSpelling = true;

  let speed = parseInt(speedSlider.value);
  let letterDuration = 1200 - speed * 5;
  let index = 0;

  function showLetter() {
    if (index < currentWord.length) {
      letterDisplay.textContent = currentWord[index].toUpperCase();
      setTimeout(() => {
        letterDisplay.textContent = "";
        setTimeout(showLetter, 50);
      }, letterDuration);
      index++;
    } else {
      isSpelling = false;
    }
  }

  showLetter();
}

// -------------------------
// Word Checking Logic
// -------------------------
wordInput.addEventListener("input", () => {
  if (wordInput.value.trim().length === currentWord.length) {
    checkWord();
  }
});

function checkWord() {
  let input = wordInput.value.trim().toLowerCase();
  if (!input) return;

  if (input === currentWord.toLowerCase()) {
    guessedWords.add(currentWord);
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
  } else {
    incorrectWords.push(currentWord);
    againButton.classList.add("breathe");
    setTimeout(() => againButton.classList.remove("breathe"), 1000);
  }

  showNextWord();
}

// -------------------------
// End Game Logic
// -------------------------
finishButton.addEventListener("click", () => {
  finishButton.disabled = true;
  endGame();
});

function endGame() {
  clearInterval(timerInterval);
  letterDisplay.textContent = "";
  clapDisplay.innerHTML = `<img src='Assets/Icons/auslan-clap.gif' alt='Clap' style='max-width:150px;' />`;
  againButton.style.display = "none";
}
