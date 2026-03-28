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
// VIDEO END LISTENER
// -------------------------
if (countdownVideo) {
  countdownVideo.addEventListener("ended", () => {
    if (gameMode === "timed") {
      endGame();
    }
  });
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
  if (isPaused) return; // prevent double firing

  isPaused = true;

  clearInterval(timer);
  clearLetters();

  wordInput.style.visibility = "hidden";

  if (countdownVideo) countdownVideo.pause();

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);

  try {
    const result = updateLeaderboard();

    // 🔥 ONLY submit ONCE here
    if (result.newTop10 || result.newPersonal) {
      submitToGoogle(score, elapsed);
    }

    showFinishModal(result, true);

  } catch (err) {
    console.error("End game error:", err);

    // fallback so modal ALWAYS appears
    showFinishModal({ newTop10:false, newPersonal:false, elapsed }, true);
  }
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

    // ✅ PERSONAL BEST ONLY
    if (!board.personal[studentName] || score > board.personal[studentName]) {
      board.personal[studentName] = score;
      newPersonal = true;
    }

    // ✅ REBUILD TOP 10 FROM PERSONAL BESTS (NO DUPLICATES)
    const allPlayers = Object.entries(board.personal).map(([name, score]) => ({
      name,
      score
    }));

    allPlayers.sort((a, b) => b.score - a.score);
    board.top10 = allPlayers.slice(0, 10);

    // ✅ CHECK IF THEY MADE TOP 10
    newTop10 = board.top10.some(e => e.name === studentName);

  } else {

    const board = leaderboard.levelup;

    if (!board.personal[studentName] || elapsed < board.personal[studentName]) {
      board.personal[studentName] = elapsed;
      newPersonal = true;
    }

    const allPlayers = Object.entries(board.personal).map(([name, time]) => ({
      name,
      time
    }));

    allPlayers.sort((a, b) => a.time - b.time);
    board.top10 = allPlayers.slice(0, 10);

    newTop10 = board.top10.some(e => e.name === studentName);
  }

  saveLeaderboard();
  renderLeaderboards();

  return { newTop10, newPersonal, elapsed };
}

// -------------------------
// GOOGLE FORM
// -------------------------
function submitToGoogle(scoreValue, timeValue) {

  const correctList = Array.from(guessedWords).sort().join(", ");
  const incorrectList = incorrectWords.sort().join(", ");

  const totalAttempts = correctWords + incorrectWords.length;
  const percentage = totalAttempts > 0
    ? Math.round((correctWords / totalAttempts) * 100)
    : 100;

  const payload = {
    name: studentName,
    class: studentClass,
    mode: gameMode,
    length: wordLength,
    score: gameMode === "timed" ? scoreValue : "",
    time: gameMode === "levelup" ? timeValue : "",
    percentage: percentage,
    correct: correctList,
    incorrect: incorrectList
  };

  fetch("https://script.google.com/macros/s/AKfycbycpjm2edGCHqEeC3PztG_uU47oOmGI4-YS6cjKq5vUxRbqxNPUlAwN9vu7TwXY9b1qaA/exec", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(res => res.json())
  .then(data => console.log("Saved:", data))
  .catch(err => console.error("Error:", err));
}

async function loadLeaderboardFromGoogle() {

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbycpjm2edGCHqEeC3PztG_uU47oOmGI4-YS6cjKq5vUxRbqxNPUlAwN9vu7TwXY9b1qaA/exec");
    const data = await res.json();

    console.log("Leaderboard data:", data);

    renderLeaderboardFromData(data);

  } catch (err) {
    console.error("Leaderboard load failed:", err);
  }
}
function renderLeaderboardFromData(data) {

  const timedDiv = document.getElementById("timed-leaderboard");
  const levelDiv = document.getElementById("level-leaderboard");

  if (!timedDiv || !levelDiv) return;

  // FILTER + GROUP
  const timed = data.filter(d => d.mode === "timed" && d.length == wordLength);
  const level = data.filter(d => d.mode === "levelup");

  // BEST PER STUDENT (NO SPAM)
  const bestTimed = {};
  timed.forEach(entry => {
    if (!bestTimed[entry.name] || entry.score > bestTimed[entry.name].score) {
      bestTimed[entry.name] = entry;
    }
  });

  const bestLevel = {};
  level.forEach(entry => {
    if (!bestLevel[entry.name] || entry.time < bestLevel[entry.name].time) {
      bestLevel[entry.name] = entry;
    }
  });

  // SORT
  const timedList = Object.values(bestTimed)
    .sort((a,b)=>b.score-a.score)
    .slice(0,10);

  const levelList = Object.values(bestLevel)
    .sort((a,b)=>a.time-b.time)
    .slice(0,10);

  // DISPLAY
  timedDiv.innerHTML = timedList.length
    ? timedList.map((e,i)=>`${i+1}. ${e.name} - ${e.score}`).join("<br>")
    : "No scores yet";

  levelDiv.innerHTML = levelList.length
    ? levelList.map((e,i)=>`${i+1}. ${e.name} - ${e.time}s`).join("<br>")
    : "No scores yet";
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
finishButton.addEventListener("click", endGame);

againButtonModal.addEventListener("click", () => {
  isPaused = false;
  endModal.style.display = "none";
  startGame();
});

menuButton.addEventListener("click", () => window.location.href = "../index.html");

// -------------------------
// INIT
// -------------------------
loadLeaderboardFromGoogle();
