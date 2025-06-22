let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html"; // Adjust path if needed
} else {
  if (studentInfoDiv) {
    studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  }
  if (gameContainer) {
    gameContainer.style.display = "block";
  }
}

// Elements
const signinScreen = document.getElementById("signin-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const timerDisplay = document.querySelector("#timer .value");
const scoreDisplay = document.querySelector("#score .value");
const letterDisplay = document.getElementById("letter-display").style.border = "2px solid red";
const againButton = document.getElementById("again-button");
const finishButton = document.getElementById("finishButton");

// State
let timer;
let timeLeft = 120;
let score = 0;
let currentWord = "";
let currentLetterIndex = 0;
let letterTimeouts = [];
let speed = 100;
let correctWords = 0;
let gameMode = "timed"; // or "levelup"
let wordLength = 3;
let guessedWords = new Set();
let incorrectWords = [];

let wordBank = {};

// Load word bank from JSON
fetch("data/wordlist.json")
  .then((response) => response.json())
  .then((data) => {
    wordBank = data;
  })
  .catch((error) => console.error("Error loading word list:", error));

function showLetterByLetter(word) {
  clearLetters();
  currentLetterIndex = 0;
  letterDisplay.textContent = "";
  let delay = 400;

  word.split("").forEach((letter, index) => {
    const timeout = setTimeout(() => {
      letterDisplay.textContent = letter.toLowerCase();
      setTimeout(() => {
        if (letterDisplay.textContent === letter.toLowerCase()) {
          letterDisplay.textContent = "";
        }
      }, 300 - speed);
    }, delay + index * (300 - speed));
    letterTimeouts.push(timeout);
  });
}

function clearLetters() {
  letterTimeouts.forEach(clearTimeout);
  letterTimeouts = [];
  letterDisplay.textContent = "";
}

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
  wordInput.style.display = "visible";
  wordInput.focus();

  againButton.style.display = "none";
  startTimer();
  setTimeout(nextWord, 400); // Initial delay
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
}

function submitResults() {
  const correct = Array.from(guessedWords).join(", ");
  const wrong = incorrectWords.join(", ");
  const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?entry.423692452=${encodeURIComponent(
    studentName
  )}&entry.1307864012=${encodeURIComponent(
    studentClass
  )}&entry.468778567=${encodeURIComponent(
    gameMode
  )}&entry.1083699348=${score}&entry.746947164=${encodeURIComponent(
    correct
  )}&entry.1534005804=${encodeURIComponent(
    wrong
  )}&entry.1974555000=${encodeURIComponent(speedSlider.value)}`;
  fetch(formURL, { method: "POST", mode: "no-cors" });
  setTimeout(() => window.location.href = "../index.html", 3000);
}

// Event Listeners
startButton.addEventListener("click", () => {
  const selectedMode = document.getElementById("game-mode");
  const selectedLength = document.getElementById("word-length");
  gameMode = selectedMode ? selectedMode.value : "timed";
  wordLength = selectedLength ? parseInt(selectedLength.value) : 3;
    if (gameMode === "levelup") {
    document.getElementById("length-container").style.display = "none";
  } else {
    document.getElementById("length-container").style.display = "block";
}

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
      againButton.style.display = "block";
    }
  }
});

speedSlider.addEventListener("input", () => {
  speed = parseInt(speedSlider.value);
});

againButton.addEventListener("click", () => {
  againButton.style.display = "none";
  showLetterByLetter(currentWord);
  wordInput.style.visibility = "visible";
  wordInput.value = "";
  wordInput.focus();
});

if (finishButton) {
  finishButton.addEventListener("click", endGameManually);
}

// Initial Setup
wordInput.style.display = "block";
wordInput.style.visibility = "visible";
wordInput.focus();
againButton.style.display = "none";
speed = parseInt(speedSlider.value);

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  window.location.href = "../index.html";
});
