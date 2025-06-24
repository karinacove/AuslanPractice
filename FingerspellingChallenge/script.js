// -------------------------
// Initial Setup & User Info
// -------------------------
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
}

// -------------------------
// DOM References
// -------------------------
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
const keyboardBtn = document.getElementById("keyboard-btn");
const keyboardContainer = document.getElementById("keyboard-container");

// -------------------------
// Game State
// -------------------------
let timer;
let timeLeft = 120;
let score = 0;
let currentWord = "";
let currentLetterIndex = 0;
let letterTimeouts = [];
let speed = 100;
let correctWords = 0;
let gameMode = "timed";
let wordLength = 3;
let guessedWords = new Set();
let incorrectWords = [];
let wordBank = {};

// -------------------------
// Load Word Bank
// -------------------------
fetch("data/wordlist.json")
  .then((response) => response.json())
  .then((data) => wordBank = data)
  .catch((error) => console.error("Error loading word list:", error));

// -------------------------
// Core Functions
// -------------------------
function clearLetters() {
  letterTimeouts.forEach(clearTimeout);
  letterTimeouts = [];
  letterDisplay.textContent = "";
}

function showLetterByLetter(word) {
  clearLetters();
  currentLetterIndex = 0;
  let delay = 500; // initial pause

  word.split("").forEach((letter, index) => {
    const timeout = setTimeout(() => {
      letterDisplay.textContent = letter.toLowerCase();
      setTimeout(() => {
        if (letterDisplay.textContent === letter.toLowerCase()) {
          letterDisplay.textContent = "";
        }
      }, 400 - speed); // linger per letter
    }, delay + index * (400 - speed));
    letterTimeouts.push(timeout);
  });
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
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function nextWord() {
  if (gameMode === "levelup" && correctWords > 0 && correctWords % 10 === 0 && wordLength < 10) {
    wordLength++;
  }
  const words = wordBank[wordLength] || wordBank[3];
  currentWord = words[Math.floor(Math.random() * words.length)];
  showLetterByLetter(currentWord);
}

function startGame() {
  signinScreen.style.display = "none";
  gameScreen.style.display = "flex";
  score = 0;
  timeLeft = 120;
  correctWords = 0;
  guessedWords.clear();
  incorrectWords = [];
  wordInput.value = "";
  wordInput.focus();
  againButton.style.display = "block";
  updateScore();
  updateTimer();
  startTimer();
  setTimeout(nextWord, 400);
}

function endGame() {
  clearInterval(timer);
  clearLetters();
  wordInput.style.visibility = "hidden";
  againButton.style.display = "block";
  letterDisplay.textContent = "Great work!";
  submitResults();
  showFinishModal();
}

function submitResults() {
  const correct = Array.from(guessedWords).join(", ");
  const wrong = incorrectWords.join(", ");
  const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?entry.423692452=${encodeURIComponent(studentName)}&entry.1307864012=${encodeURIComponent(studentClass)}&entry.468778567=${encodeURIComponent(gameMode)}&entry.1083699348=${score}&entry.746947164=${encodeURIComponent(correct)}&entry.1534005804=${encodeURIComponent(wrong)}&entry.1974555000=${encodeURIComponent(speedSlider.value)}`;
  fetch(formURL, { method: "POST", mode: "no-cors" });
}

function showFinishModal() {
  const modal = document.createElement("div");
  modal.id = "finish-popup";
  modal.innerHTML = `
    <div style="background:white;padding:20px;border-radius:10px;text-align:center;max-width:300px;margin:10vh auto;">
      <h2>All done!</h2>
      <button onclick="location.reload()"><img src='Assets/Icons/Again.png' alt='Again' /></button>
      <button onclick="window.location.href='../hub.html'"><img src='Assets/Icons/menu.png' alt='Menu' /></button>
      <button onclick="localStorage.clear(); window.location.href='../index.html'"><img src='Assets/Icons/logout.png' alt='Logout' /></button>
    </div>
  `;
  document.body.appendChild(modal);
}

// -------------------------
// Event Listeners
// -------------------------
startButton.addEventListener("click", () => {
  gameMode = document.getElementById("game-mode").value;
  wordLength = parseInt(document.getElementById("word-length").value);
  if (gameMode === "levelup") {
    document.getElementById("length-container").style.display = "none";
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
    }
  }
});

speedSlider.addEventListener("input", () => {
  speed = parseInt(speedSlider.value);
});

againButton.addEventListener("click", () => {
  againButton.style.display = "block";
  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();
  showLetterByLetter(currentWord);
});

finishButton.addEventListener("click", endGame);

keyboardBtn.addEventListener("click", () => {
  if (keyboardContainer.style.display === "none") {
    showKeyboard();
  } else {
    keyboardContainer.style.display = "none";
  }
});

function showKeyboard() {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  keyboardContainer.innerHTML = "";
  letters.forEach(letter => {
    const key = document.createElement("button");
    key.className = "keyboard-key";
    key.textContent = letter;
    key.addEventListener("click", () => {
      wordInput.value += letter;
      wordInput.dispatchEvent(new Event("input"));
    });
    keyboardContainer.appendChild(key);
  });
  keyboardContainer.style.display = "flex";
}

// Setup initial values
speed = parseInt(speedSlider.value);
wordInput.focus();
