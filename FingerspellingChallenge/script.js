// =====================================================
// FINGERSPELLING CHALLENGE – COMPLETE GAME SCRIPT
// Leaderboards + Personal Best + Confetti + Glow
// =====================================================


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
let correctWords = 0;
let currentWord = "";
let wordLength = 3;
let gameMode = "";
let usedWords = new Set();
let guessedWords = new Set();
let incorrectWords = [];
let wordBank = {};
let isPaused = false;
let startTimestamp = 0;
let letterTimeouts = [];


// -------------------------
// Leaderboard Structure
// -------------------------
let leaderboard = JSON.parse(localStorage.getItem("fspLeaderboard")) || {
  timed: {},       // per word length
  levelup: {
    top3: [],
    personal: {}
  }
};

function saveLeaderboard() {
  localStorage.setItem("fspLeaderboard", JSON.stringify(leaderboard));
}


// -------------------------
// Load Word Bank
// -------------------------
fetch("data/wordlist.json")
  .then(res => res.json())
  .then(data => wordBank = data)
  .catch(err => console.error("Word list error:", err));


// =====================================================
// GAME CORE
// =====================================================

function clearLetters() {
  letterTimeouts.forEach(clearTimeout);
  letterTimeouts = [];
  letterDisplay.textContent = "";
}

function showLetterByLetter(word) {
  clearLetters();
  const sliderValue = parseInt(speedSlider.value) || 100;
  const maxDelay = 1200;
  const minDelay = 80;
  const displayDuration = Math.max(minDelay, maxDelay - sliderValue * 5);
  const letterGap = Math.max(40, displayDuration / 3);

  word.split("").forEach((letter, index) => {
    const timeout = setTimeout(() => {
      if (!isPaused) {
        letterDisplay.textContent = letter.toLowerCase();
        setTimeout(() => {
          if (!isPaused) letterDisplay.textContent = "";
        }, displayDuration);
      }
    }, 300 + index * (displayDuration + letterGap));
    letterTimeouts.push(timeout);
  });
}

function updateScore() {
  if (scoreImage) {
    const capped = Math.min(score, 80);
    scoreImage.src = `Assets/score/${capped}.png`;
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
  const pool = words.filter(w => !usedWords.has(w));

  if (pool.length === 0) {
    endGame();
    return;
  }

  currentWord = pool[Math.floor(Math.random() * pool.length)];
  usedWords.add(currentWord);
  setTimeout(() => showLetterByLetter(currentWord), 200);
}

function startGame() {
  score = 0;
  correctWords = 0;
  timeLeft = 120;
  usedWords.clear();
  guessedWords.clear();
  incorrectWords = [];
  wordInput.value = "";
  wordLength = gameMode === "levelup" ? 3 : wordLength;

  isPaused = false;
  startTimestamp = Date.now();

  updateScore();
  clearInterval(timer);

  if (gameMode === "timed") startTimer();

  setTimeout(nextWord, 400);
}

function endGame() {
  clearInterval(timer);
  clearLetters();
  isPaused = true;
  updateLeaderboard();
  showFinishModal();
}


// =====================================================
// LEADERBOARD SYSTEM
// =====================================================

function updateLeaderboard() {

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
  let isNewAllTime = false;
  let isNewPersonal = false;

  if (gameMode === "timed") {

    if (!leaderboard.timed[wordLength]) {
      leaderboard.timed[wordLength] = { top3: [], personal: {} };
    }

    const board = leaderboard.timed[wordLength];

    // PERSONAL BEST
    if (!board.personal[studentName] || score > board.personal[studentName]) {
      board.personal[studentName] = score;
      isNewPersonal = true;
      submitPersonalBestToGoogle(score, null);
    }

    // TOP 3
    board.top3.push({ name: studentName, score });
    board.top3.sort((a,b) => b.score - a.score);
    board.top3 = board.top3.slice(0,3);

    if (board.top3[0].name === studentName && board.top3[0].score === score) {
      isNewAllTime = true;
    }

  } else {

    const board = leaderboard.levelup;

    if (!board.personal[studentName] || elapsed < board.personal[studentName]) {
      board.personal[studentName] = elapsed;
      isNewPersonal = true;
      submitPersonalBestToGoogle(null, elapsed);
    }

    board.top3.push({ name: studentName, time: elapsed });
    board.top3.sort((a,b) => a.time - b.time);
    board.top3 = board.top3.slice(0,3);

    if (board.top3[0].name === studentName && board.top3[0].time === elapsed) {
      isNewAllTime = true;
    }
  }

  saveLeaderboard();

  showCelebration(isNewAllTime, isNewPersonal);
}


// =====================================================
// GOOGLE SHEETS SUBMISSION
// =====================================================

function submitPersonalBestToGoogle(scoreValue, timeValue) {

  const url = `https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse?` +
    `entry.NAME=${encodeURIComponent(studentName)}` +
    `&entry.CLASS=${encodeURIComponent(studentClass)}` +
    `&entry.MODE=${encodeURIComponent(gameMode)}` +
    `&entry.SCORE=${scoreValue || ""}` +
    `&entry.TIME=${timeValue || ""}`;

  fetch(url, { method: "POST", mode: "no-cors" });
}


// =====================================================
// MODAL + CELEBRATION
// =====================================================

function showFinishModal() {

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
  const minutes = Math.floor(elapsed/60);
  const seconds = elapsed%60;

  scoreText.textContent = `Score: ${score}`;
  timeText.textContent = `Time: ${minutes}m ${seconds}s`;

  endModal.style.display = "flex";
}

function showCelebration(newAllTime, newPersonal) {

  const badge = document.getElementById("winner-badge");

  if (newAllTime) {
    badge.innerHTML = `<img src="Assets/new.png" class="gold-glow">`;
    launchConfetti();
  } else if (newPersonal) {
    badge.innerHTML = `<img src="Assets/personal.png" class="gold-glow">`;
  } else {
    badge.innerHTML = `<img src="Assets/current.png">`;
  }
}


// =====================================================
// CONFETTI
// =====================================================

function launchConfetti() {
  for (let i=0;i<120;i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random()*100 + "vw";
    confetti.style.animationDuration = (Math.random()*2+2)+"s";
    document.body.appendChild(confetti);
    setTimeout(()=>confetti.remove(),4000);
  }
}


// =====================================================
// INPUT HANDLER
// =====================================================

wordInput.addEventListener("input", () => {

  if (isPaused) return;
  const typed = wordInput.value.toLowerCase();

  if (typed.length === currentWord.length) {

    if (typed === currentWord) {
      score++;
      correctWords++;
      guessedWords.add(currentWord);
      wordInput.value="";
      updateScore();
      setTimeout(nextWord,400);
    } else {
      incorrectWords.push(typed);
      wordInput.value="";
      showLetterByLetter(currentWord);
    }
  }
});


// =====================================================
// MODE SELECTION
// =====================================================

modeTimed.addEventListener("click", ()=>{
  gameMode="timed";
  lengthContainer.style.display="flex";
});

modeLevel.addEventListener("click", ()=>{
  gameMode="levelup";
  lengthContainer.style.display="none";
  startGame();
});

lengthOptions.forEach(option=>{
  option.addEventListener("click",()=>{
    wordLength=parseInt(option.dataset.length);
    startGame();
  });
});

finishButton.addEventListener("click", endGame);
againButtonModal.addEventListener("click", ()=>{
  endModal.style.display="none";
  startGame();
});
menuButton.addEventListener("click", ()=>window.location.href="../index.html");
