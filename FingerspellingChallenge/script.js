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
const stopButton = document.getElementById("stopButton");
const finishButton = document.getElementById("finish-button");
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
let letterTimeouts = [];
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
  .then((res) => res.json())
  .then((data) => {
    wordBank = data;
    wordBankLoaded = true;
  })
  .catch((err) => console.error("Word list error:", err));

// -------------------------
// Leaderboard (Local)
// -------------------------
let leaderboard = JSON.parse(localStorage.getItem("fspLeaderboard")) || {
  timed: {},
  levelup: { top10: [], personal: {} }
};

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

  const speed = parseInt(speedSlider.value) || 100;
  const delay = Math.max(80, 1200 - speed * 5);

  word.split("").forEach((letter, i) => {
    const t = setTimeout(() => {
      if (!isPaused) {
        letterDisplay.textContent = letter;
        setTimeout(() => {
          if (!isPaused) letterDisplay.textContent = "";
        }, delay);
      }
    }, i * (delay + 50));

    letterTimeouts.push(t);
  });
}

function updateScore() {
  if (scoreImage) {
    scoreImage.src = `Assets/score/${Math.min(score, 80)}.png`;
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
  const words = wordBank[wordLength] || [];
  const pool = words.filter(w => !usedWords.has(w));

  if (!pool.length) return endGame();

  currentWord = pool[Math.floor(Math.random() * pool.length)];
  usedWords.add(currentWord);

  setTimeout(() => showLetterByLetter(currentWord), 200);
}

// -------------------------
// Game Flow
// -------------------------
function startGame() {
  if (!wordBankLoaded) return setTimeout(startGame, 200);

  document.getElementById("signin-screen").style.display = "none";
  document.getElementById("leaderboards").style.display = "none";
  gameScreen.style.display = "flex";

  score = 0;
  correctWords = 0;
  guessedWords.clear();
  incorrectWords = [];
  usedWords.clear();
  isPaused = false;

  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();

  updateScore();
  clearLetters();
  clearInterval(timer);

  startTimestamp = Date.now();

  if (gameMode === "timed") {
    if (countdownVideo) {
      countdownVideo.currentTime = 0;
      countdownVideo.style.display = "block"; // 🔥 REQUIRED
      countdownVideo.play();
    }
    startTimer();
  } else {
    countdownVideo?.pause();
  }

  setTimeout(nextWord, 400);
}

function pauseGame() {
  if (isPaused) return;

  isPaused = true;

  clearInterval(timer);
  clearLetters();
  wordInput.style.visibility = "hidden";
  countdownVideo?.pause();

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);

  // calculate percentage
  const totalAttempts = correctWords + incorrectWords.length;
  const percentage = totalAttempts > 0
    ? Math.round((correctWords / totalAttempts) * 100)
    : 100;

  // show modal (PAUSE MODE)
  showPauseModal(elapsed, percentage);
}

function finishEarly() {
  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);

  const result = updateLeaderboard(elapsed);

  // 🔥 mark early finish
  submitToGoogle(score, elapsed, true);

  showFinishModal(result, true);
}

function showPauseModal(elapsed, percentage) {
  endModal.style.display = "flex";

  document.getElementById("clap-display").innerHTML = "";

  scoreText.textContent = `Score: ${score}`;
  timeText.textContent = `Time: ${elapsed}s`;

  document.getElementById("score-percentage").textContent =
    `${percentage}% Correct`;

  // clear old message
  document.getElementById("leaderboard-message")?.remove();

  // BUTTONS
finishButton.style.display = "inline-block"; // modal finish button
continueBtn.style.display = "inline-block";
againButtonModal.style.display = "inline-block";
menuButton.style.display = "none";
}

function endGame() {
  if (isPaused) return;

  isPaused = true;
  clearInterval(timer);
  clearLetters();
  wordInput.style.visibility = "hidden";
  countdownVideo?.pause();

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);

  try {
    const result = updateLeaderboard(elapsed);

    if (result.newTop10 || result.newPersonal) {
      submitToGoogle(score, elapsed);
    }

    showFinishModal(result);

  } catch (err) {
    console.error("End game error:", err);
    showFinishModal({ newTop10: false, newPersonal: false, elapsed });
  }
}

// -------------------------
// Leaderboard Logic
// -------------------------
function updateLeaderboard(elapsed) {
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

    const all = Object.entries(board.personal)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);

    board.top10 = all.slice(0, 10);
    newTop10 = board.top10.some(e => e.name === studentName);

  } else {
    const board = leaderboard.levelup;

    if (!board.personal[studentName] || elapsed < board.personal[studentName]) {
      board.personal[studentName] = elapsed;
      newPersonal = true;
    }

    const all = Object.entries(board.personal)
      .map(([name, time]) => ({ name, time }))
      .sort((a, b) => a.time - b.time);

    board.top10 = all.slice(0, 10);
    newTop10 = board.top10.some(e => e.name === studentName);
  }

  saveLeaderboard();
  return { newTop10, newPersonal, elapsed };
}

// -------------------------
// Google Submit (SAFE JSON)
// -------------------------
function submitToGoogle(scoreValue, timeValue, finishedEarly = false) {

  const correctList = Array.from(guessedWords).sort().join(", ");
  const incorrectList = incorrectWords.sort().join(", ");

  const totalAttempts = correctWords + incorrectWords.length;

  const percentage = totalAttempts > 0
    ? Math.round((correctWords / totalAttempts) * 100)
    : 100;

  const speedSetting = speedSlider.value;

  // 🏆 rank (from local leaderboard)
  let rank = "";

  if (gameMode === "timed") {
    const board = leaderboard.timed[wordLength]?.top10 || [];
    const pos = board.findIndex(e => e.name === studentName && e.score === score);
    if (pos !== -1) rank = pos + 1;
  } else {
    const board = leaderboard.levelup.top10 || [];
    const pos = board.findIndex(e => e.name === studentName && e.time === timeValue);
    if (pos !== -1) rank = pos + 1;
  }

  const params = new URLSearchParams();

  params.append("name", studentName);
  params.append("class", studentClass);
  params.append("mode", gameMode === "timed"
    ? `timed (${wordLength})${finishedEarly ? " - early finish" : ""}`
    : `level up${finishedEarly ? " - early finish" : ""}`
  );
  params.append("score", scoreValue);
  params.append("time", timeValue);
  params.append("percentage", percentage);
  params.append("correct", correctList);
  params.append("incorrect", incorrectList);
  params.append("speed", speedSetting);
  params.append("rank", rank);

  fetch("https://script.google.com/macros/s/AKfycbySClPLCY2JTATVc9R-SJdMa7W5cjlvBvO1Fm557-TO1nCC_9OT9FJgY0-O370A-POnYg/exec", {
    method: "POST",
    body: params
  })
  .then(res => res.text())
  .then(data => {
    console.log("Saved:", data);
    setTimeout(loadLeaderboardFromGoogle, 1000);
  })
  .catch(err => console.error("Error:", err));
}

function renderLeaderboardFromData(data) {
  const timedDiv = document.getElementById("timed-leaderboard");
  const levelDiv = document.getElementById("level-leaderboard");

  if (!timedDiv || !levelDiv) return;

  // FILTER
  const timed = data.filter(d => d.mode === "timed" && d.length == wordLength);
  const level = data.filter(d => d.mode === "levelup");

  // BEST PER PLAYER
  const bestTimed = {};
  timed.forEach(e => {
    if (!bestTimed[e.name] || e.score > bestTimed[e.name].score) {
      bestTimed[e.name] = e;
    }
  });

  const bestLevel = {};
  level.forEach(e => {
    if (!bestLevel[e.name] || e.time < bestLevel[e.name].time) {
      bestLevel[e.name] = e;
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
// Load Leaderboard (SAFE)
// -------------------------
async function loadLeaderboardFromGoogle() {
  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbySClPLCY2JTATVc9R-SJdMa7W5cjlvBvO1Fm557-TO1nCC_9OT9FJgY0-O370A-POnYg/exec");

    const text = await res.text();

    // 🔍 DEBUG (optional)
    console.log("RAW RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn("❌ Not valid JSON — skipping update");
      return;
    }

    renderLeaderboardFromData(data);

  } catch (err) {
    console.error("Leaderboard load failed:", err);
  }
}

// -------------------------
// Modal
// -------------------------
function showFinishModal(result, isGameEnd = true) {
  endModal.style.display = "flex";

  // ✅ ALWAYS show clap at game end
  document.getElementById("clap-display").innerHTML =
    isGameEnd ? `<img src="Assets/auslan-clap.gif" alt="Clap" />` : "";

  const { newTop10, newPersonal, elapsed } = result;

  scoreText.textContent = `Score: ${score}`;
  timeText.textContent = `Time: ${elapsed}s`;

  let msg = "";
  if (newTop10) msg += "🏆 Top 10!\n";
  if (newPersonal) msg += "⭐ Personal Best!";

  // 🏆 ADD RANK DISPLAY
  let rankText = "";

  if (gameMode === "timed") {
    const board = leaderboard.timed[wordLength]?.top10 || [];
    const pos = board.findIndex(e => e.name === studentName && e.score === score);
    if (pos !== -1) rankText = `You placed #${pos + 1}!`;
  } else {
    const board = leaderboard.levelup.top10 || [];
    const pos = board.findIndex(e => e.name === studentName && e.time === elapsed);
    if (pos !== -1) rankText = `You placed #${pos + 1}!`;
  }

  msg += rankText ? `\n${rankText}` : "";

  document.getElementById("leaderboard-message")?.remove();

  const div = document.createElement("div");
  div.id = "leaderboard-message";
  div.innerText = msg;
  endModalContent.appendChild(div);

  // ✅ BUTTON LOGIC
  againButtonModal.style.display = "inline-block";
  menuButton.style.display = "inline-block";
  finishButton.style.display = "none";
  continueBtn.style.display = "none";

  // 🔥 SHOW leaderboard again when game ends
  document.getElementById("leaderboards").style.display = "block";
}

// -------------------------
// Input
// -------------------------
wordInput.addEventListener("input", () => {
  if (isPaused) return;

  const typed = wordInput.value.toLowerCase();

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
      wordInput.value = "";
      showLetterByLetter(currentWord);
    }
  }
});

// -------------------------
// Buttons
// -------------------------
modeTimed.onclick = () => {
  gameMode = "timed";
  lengthContainer.style.display = "flex";
};

modeLevel.onclick = () => {
  gameMode = "levelup";
  startGame();
};

lengthOptions.forEach(opt =>
  opt.onclick = () => {
    wordLength = parseInt(opt.dataset.length);
    startGame();
  }
);

stopButton.onclick = pauseGame;

againButtonModal.onclick = () => {
  isPaused = false;
  endModal.style.display = "none";
  startGame();
};

finishButton.onclick = () => {
  finishEarly();
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 1500);
};

continueBtn.onclick = () => {
  isPaused = false;
  endModal.style.display = "none";

  wordInput.style.visibility = "visible";
  wordInput.focus();

  if (gameMode === "timed") {
    countdownVideo?.play();
    startTimer();
  }

  showLetterByLetter(currentWord);
};

menuButton.addEventListener("click", () => window.location.href = "./index.html");

againButton.addEventListener("click", () => {
  if (isPaused) return;
  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();
  showLetterByLetter(currentWord);
});

// -------------------------
// Init
// -------------------------
loadLeaderboardFromGoogle(); // initial load
setInterval(() => {
  if (!document.hidden) {
    loadLeaderboardFromGoogle();
  }
}, 5000);
