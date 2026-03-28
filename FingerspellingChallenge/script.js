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
const gameScreen = document.getElementById("game-screen");
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const letterDisplay = document.getElementById("letter-display");
const againButton = document.getElementById("again-button");
const finishButton = document.getElementById("finishButton");
const keyboardBtn = document.getElementById("keyboard-btn");
const keyboardContainer = document.getElementById("keyboard-container");
const endModal = document.getElementById("end-modal");
const endModalContent = document.getElementById("end-modal-content");
const continueBtn = document.getElementById("continue-btn");
const againButtonModal = document.getElementById("again-button-modal");
const menuButton = document.getElementById("menu-button");
const lengthContainer = document.getElementById("length-container");
const lengthOptions = document.querySelectorAll(".length-option");
const modeTimed = document.getElementById("mode-timed");
const modeLevel = document.getElementById("mode-levelup");
const slowIcon = document.getElementById("slow-icon");
const fastIcon = document.getElementById("fast-icon");
const scoreImage = document.getElementById("score-image");
const countdownVideo = document.getElementById("countdown-video");
const scoreText = document.getElementById("score-text");
const timeText = document.getElementById("time-text");

// -------------------------
// Game State
// -------------------------
let timer;
let timeLeft = 120;
let score = 0;
let currentWord = "";
let currentLetterIndex = 0;
let letterTimeouts = [];
let speed = parseInt(speedSlider.value) || 150;
let correctWords = 0;
let gameMode = "";
let wordLength = 3;
let guessedWords = new Set();
let incorrectWords = [];
let wordBank = {};
let wordBankLoaded = false;
let isPaused = false;
let usedWords = new Set();
let startTimestamp = 0;

// -------------------------
// Load Word Bank
// -------------------------
fetch("data/wordlist.json")
  .then((response) => response.json())
  .then((data) => {
    wordBank = data;
    wordBankLoaded = true;
  })
  .catch((error) => console.error("Error loading word list:", error));

// -------------------------
// LEADERBOARD
// -------------------------
let leaderboard = JSON.parse(localStorage.getItem("fspLeaderboard")) || {};

if (!leaderboard.timed) leaderboard.timed = {};
if (!leaderboard.levelup) leaderboard.levelup = {};
if (!leaderboard.levelup.top10) leaderboard.levelup.top10 = [];
if (!leaderboard.levelup.personal) leaderboard.levelup.personal = {};

function saveLeaderboard() {
  localStorage.setItem("fspLeaderboard", JSON.stringify(leaderboard));
}

// -------------------------
// Utility Functions
// -------------------------
function clearLetters() {
  letterTimeouts.forEach(clearTimeout);
  letterTimeouts = [];
  letterDisplay.textContent = "";
}

function showLetterByLetter(word) {
  clearLetters();
  currentLetterIndex = 0;

  const sliderValue = parseInt(speedSlider.value) || 100;
  const maxDelay = 1200;
  const minDelay = 80;
  const displayDuration = Math.max(minDelay, maxDelay - sliderValue * 5);
  const letterGap = Math.max(40, displayDuration / 3);
  const delay = 300;

  word.split("").forEach((letter, index) => {
    const timeout = setTimeout(() => {
      if (!isPaused) {
        letterDisplay.textContent = letter.toLowerCase();

        setTimeout(() => {
          if (!isPaused && letterDisplay.textContent === letter.toLowerCase()) {
            letterDisplay.textContent = "";
          }
        }, displayDuration);
      }
    }, delay + index * (displayDuration + letterGap));

    letterTimeouts.push(timeout);
  });
}

againButton.addEventListener("click", () => {
  if (isPaused) return;

  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();

  showLetterByLetter(currentWord);
});

function updateScore() {
  if (scoreImage) {
    const cappedScore = Math.min(score, 80);
    scoreImage.src = `Assets/score/${cappedScore}.png`;
  }

  if (score >= 80 && gameMode === "levelup") {
    endGame();
  }
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      if (timeLeft <= 0) endGame();
    }
  }, 1000);
}

function nextWord() {
  if (gameMode === "levelup" && correctWords > 0 && correctWords % 10 === 0 && wordLength < 10) {
    wordLength++;
  }

  const words = wordBank[wordLength] || wordBank[3];
  if (!words) return;

  const pool = words.filter(w => !usedWords.has(w));

  if (pool.length === 0) {
    endGame();
    return;
  }

  currentWord = pool[Math.floor(Math.random() * pool.length)];
  usedWords.add(currentWord);

  setTimeout(() => showLetterByLetter(currentWord), 200);
}

// -------------------------
// Game Flow
// -------------------------
function startGame() {

  if (!wordBankLoaded) {
    setTimeout(startGame, 200);
    return;
  }

  document.getElementById("signin-screen").style.display = "none";
  gameScreen.style.display = "flex";

  score = 0;
  timeLeft = 120;
  correctWords = 0;
  guessedWords.clear();
  incorrectWords = [];
  usedWords.clear();
  isPaused = false;

  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();

  againButton.style.display = "block";

  updateScore();
  clearLetters();
  clearInterval(timer);

  startTimestamp = Date.now();

  if (gameMode === "timed") {
    if (countdownVideo) {
      countdownVideo.currentTime = 0;
      countdownVideo.play();
      countdownVideo.style.display = "block";
    }
    startTimer();
  } else {
    if (countdownVideo) {
      countdownVideo.pause();
      countdownVideo.style.display = "none";
    }
  }

  setTimeout(nextWord, 400);
}

function endGame() {
  clearInterval(timer);
  clearLetters();
  wordInput.style.visibility = "hidden";
  isPaused = true;

  if (countdownVideo) countdownVideo.pause();

  // ALWAYS submit first
  submitToGoogle(score, Math.floor((Date.now() - startTimestamp) / 1000));

  // THEN update leaderboard + show modal
  const result = updateLeaderboard();

  showFinishModal(result, true);
}

// -------------------------
// LEADERBOARD LOGIC
// -------------------------
function updateLeaderboard() {

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);

  let newTop10 = false;
  let newPersonal = false;

  if (gameMode === "timed") {

    if (!leaderboard.timed[wordLength]) {
      leaderboard.timed[wordLength] = { top10: [], personal: {} };
    }

    const board = leaderboard.timed[wordLength];

    if (!board.personal[studentName] || score > board.personal[studentName]) {
      board.personal[studentName] = score;
      newPersonal = true;
    }

    board.top10.push({ name: studentName, score });
    board.top10.sort((a,b)=>b.score-a.score);
    board.top10 = board.top10.slice(0,10);

    if (board.top10.some(entry => entry.name === studentName && entry.score === score)) {
      newTop10 = true;
    }

  } else {

    const board = leaderboard.levelup;

    if (!board.personal[studentName] || elapsed < board.personal[studentName]) {
      board.personal[studentName] = elapsed;
      newPersonal = true;
    }

    board.top10.push({ name: studentName, time: elapsed });
    board.top10.sort((a,b)=>a.time-b.time);
    board.top10 = board.top10.slice(0,10);

    if (board.top10.some(entry => entry.name === studentName && entry.time === elapsed)) {
      newTop10 = true;
    }
  }

  saveLeaderboard();

  if (newTop10 || newPersonal) {
    submitToGoogle(score, elapsed);
  }

  renderLeaderboards();

  return { newTop10, newPersonal, elapsed };
}

// -------------------------
// GOOGLE FORM
// -------------------------
function submitToGoogle(scoreValue, timeValue) {
  const correct = Array.from(guessedWords).join(", ");
  const wrong = incorrectWords.join(", ");

  const formURL =
    `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?` +
    `entry.423692452=${encodeURIComponent(studentName)}` +
    `&entry.1307864012=${encodeURIComponent(studentClass)}` +
    `&entry.468778567=${encodeURIComponent(gameMode)}` +
    `&entry.1083699348=${encodeURIComponent(scoreValue)}` +
    `&entry.746947164=${encodeURIComponent(correct)}` +
    `&entry.1534005804=${encodeURIComponent(wrong)}` +
    `&entry.1974555000=${encodeURIComponent(speedSlider.value)}`;

  fetch(formURL, { method: "POST", mode: "no-cors" });
}

// -------------------------
// MODAL
// -------------------------
function showFinishModal(result, isGameEnd = false) {

  isPaused = true;
  clearInterval(timer);

  endModal.style.display = "flex";

  const { newTop10, newPersonal, elapsed } = result;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  // SCORE / TIME DISPLAY
  if (gameMode === "timed") {
    scoreText.textContent = `Score: ${score}`;
    timeText.textContent = `Time: ${minutes} mins ${seconds} sec`;
  } else {
    scoreText.textContent = `Completed!`;
    timeText.textContent = `Time: ${minutes} mins ${seconds} sec`;
  }

  // PERCENTAGE
  const totalAttempts = correctWords + incorrectWords.length;
  const percentage = totalAttempts > 0
    ? Math.round((correctWords / totalAttempts) * 100)
    : 100;

  endModalContent.querySelector("#score-percentage").textContent =
    `${percentage}% Correct`;

  // LEADERBOARD MESSAGE
  let message = "";

  if (newTop10) message += "🏆 Top 10 Leaderboard!\n";
  if (newPersonal) message += "⭐ New Personal Best!\n";

  // FIND POSITION (TIMED)
  if (gameMode === "timed") {
    const board = leaderboard.timed[wordLength]?.top10 || [];
    const position = board.findIndex(e => e.name === studentName && e.score === score);
    if (position !== -1) {
      message += `You placed #${position + 1}!`;
    }
  }

  // FIND POSITION (LEVEL UP)
  if (gameMode === "levelup") {
    const board = leaderboard.levelup.top10 || [];
    const position = board.findIndex(e => e.name === studentName && e.time === elapsed);
    if (position !== -1) {
      message += `You placed #${position + 1}!`;
    }
  }

  // DISPLAY MESSAGE
  let msgDiv = document.getElementById("leaderboard-message");
  if (!msgDiv) {
    msgDiv = document.createElement("div");
    msgDiv.id = "leaderboard-message";
    msgDiv.style.marginTop = "10px";
    endModalContent.appendChild(msgDiv);
  }
  msgDiv.innerText = message;

  // CLAP GIF
  document.getElementById("clap-display").innerHTML =
    isGameEnd ? `<img src="Assets/auslan-clap.gif" alt="Clap" />` : "";

  // BUTTONS
  againButtonModal.style.display = "inline-block";
  menuButton.style.display = "inline-block";

  const finishHomeBtn = document.getElementById("finish-home-button");
  if (finishHomeBtn) finishHomeBtn.style.display = "inline-block";

  continueBtn.style.display = "none";
}
// -------------------------
// INPUT
// -------------------------
wordInput.addEventListener("input", () => {

  if (isPaused) return;

  const typed = wordInput.value.toLowerCase();

  if (typed.length === currentWord.length) {

    setTimeout(() => {
      if (typed === currentWord) {
        score++;
        correctWords++;
        guessedWords.add(currentWord);
        updateScore();
        wordInput.value = "";
        setTimeout(nextWord, 400);
      } else {
        incorrectWords.push(typed);
        wordInput.value = "";
        showLetterByLetter(currentWord);
      }
    }, 50);
  }
});

// -------------------------
// MODE SELECT
// -------------------------
modeTimed.addEventListener("click", () => {
  gameMode = "timed";
  lengthContainer.style.display = "flex";
});

modeLevel.addEventListener("click", () => {
  gameMode = "levelup";
  lengthContainer.style.display = "none";
  startGame();
});

lengthOptions.forEach(option => {
  option.addEventListener("click", () => {
    wordLength = parseInt(option.dataset.length);
    startGame();
  });
});

// -------------------------
// BUTTONS
// -------------------------
finishButton.addEventListener("click", () => showFinishModal({elapsed:0}, false));

againButtonModal.addEventListener("click", () => {
  isPaused = false;
  endModal.style.display = "none";
  startGame();
});

menuButton.addEventListener("click", () => window.location.href = "../index.html");

// -------------------------
// INIT
// -------------------------
renderLeaderboards();
