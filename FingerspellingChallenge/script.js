// =====================================================
// FINGERSPELLING CHALLENGE – FINAL STABLE VERSION
// Leaderboard + Google Forms + Top 10 + Personal Best
// =====================================================

// -------------------------
// USER INFO
// -------------------------
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
}

// -------------------------
// DOM
// -------------------------
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const letterDisplay = document.getElementById("letter-display");
const finishButton = document.getElementById("finishButton");
const endModal = document.getElementById("end-modal");
const againButtonModal = document.getElementById("again-button-modal");
const menuButton = document.getElementById("menu-button");
const lengthContainer = document.getElementById("length-container");
const lengthOptions = document.querySelectorAll(".length-option");
const modeTimed = document.getElementById("mode-timed");
const modeLevel = document.getElementById("mode-levelup");
const scoreImage = document.getElementById("score-image");
const scoreText = document.getElementById("score-text");
const timeText = document.getElementById("time-text");

// -------------------------
// GAME STATE
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
let isPaused = false;
let startTimestamp = 0;
let letterTimeouts = [];

// -------------------------
// WORD BANK
// -------------------------
let wordBank = {};
let wordBankLoaded = false;

fetch("data/wordlist.json")
  .then(res => res.json())
  .then(data => {
    wordBank = data;
    wordBankLoaded = true;
  });

// -------------------------
// LEADERBOARD
// -------------------------
let leaderboard = JSON.parse(localStorage.getItem("fspLeaderboard")) || {
  timed: {},
  levelup: { top10: [], personal: {} }
};

function saveLeaderboard() {
  localStorage.setItem("fspLeaderboard", JSON.stringify(leaderboard));
}

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
    }, 300 + i * delay);

    letterTimeouts.push(t);
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
  const words = wordBank[wordLength] || wordBank[3];
  const pool = words.filter(w => !usedWords.has(w));

  if (pool.length === 0) return endGame();

  currentWord = pool[Math.floor(Math.random() * pool.length)];
  usedWords.add(currentWord);

  setTimeout(() => showLetterByLetter(currentWord), 200);
}

function startGame() {

  if (!wordBankLoaded) {
    alert("Loading words...");
    return;
  }

  score = 0;
  correctWords = 0;
  timeLeft = 120;
  usedWords.clear();
  guessedWords.clear();
  incorrectWords = [];
  wordInput.value = "";

  if (gameMode === "levelup") wordLength = 3;

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

  const result = updateLeaderboard();
  showFinishModal(result);
}

// =====================================================
// LEADERBOARD LOGIC
// =====================================================

function updateLeaderboard() {

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);

  let newTop10 = false;
  let newPersonal = false;

  if (gameMode === "timed") {

    if (!leaderboard.timed[wordLength]) {
      leaderboard.timed[wordLength] = { top10: [], personal: {} };
    }

    const board = leaderboard.timed[wordLength];

    // PERSONAL BEST
    if (!board.personal[studentName] || score > board.personal[studentName]) {
      board.personal[studentName] = score;
      newPersonal = true;
    }

    // TOP 10
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

// =====================================================
// GOOGLE FORM
// =====================================================

function submitToGoogle(scoreValue, timeValue) {

  const correctList = Array.from(guessedWords).join(", ");
  const incorrectList = incorrectWords.join(", ");

  const scoreToSend = gameMode === "timed"
    ? scoreValue
    : `${timeValue}s`;

  const modeLabel = `${gameMode} (${wordLength} letters)`;

  const formURL =
    `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?` +
    `entry.423692452=${encodeURIComponent(studentName)}` +
    `&entry.1307864012=${encodeURIComponent(studentClass)}` +
    `&entry.468778567=${encodeURIComponent(modeLabel)}` +
    `&entry.1083699348=${encodeURIComponent(scoreToSend)}` +
    `&entry.746947164=${encodeURIComponent(correctList)}` +       // ✅ CORRECT WORDS
    `&entry.1534005804=${encodeURIComponent(incorrectList)}` +   // ✅ INCORRECT WORDS
    `&entry.1974555000=${encodeURIComponent(speedSlider.value)}`; // (optional speed)

  fetch(formURL, { method: "POST", mode: "no-cors" });
}

// =====================================================
// DISPLAY LEADERBOARD (HOME SCREEN)
// =====================================================

function renderLeaderboards() {

  const timedDiv = document.getElementById("timed-leaderboard");
  const levelDiv = document.getElementById("level-leaderboard");

  if (!timedDiv || !levelDiv) return;

  // TIMED (show current length only for simplicity)
  const board = leaderboard.timed[wordLength];
  timedDiv.innerHTML = board
    ? board.top10.map((e,i)=>`${i+1}. ${e.name} - ${e.score}`).join("<br>")
    : "No scores yet";

  // LEVEL
  levelDiv.innerHTML = leaderboard.levelup.top10
    .map((e,i)=>`${i+1}. ${e.name} - ${e.time}s`)
    .join("<br>");
}

// =====================================================
// MODAL
// =====================================================

function showFinishModal(result) {

  const { newTop10, newPersonal, elapsed } = result;

  scoreText.textContent = `Score: ${score}`;
  timeText.textContent = `Time: ${elapsed}s`;

  let message = "";

  if (newTop10) message += "🎉 NEW TOP 10!\n";
  if (newPersonal) message += "⭐ NEW PERSONAL BEST!";

  if (message) {
    const msg = document.createElement("div");
    msg.style.marginTop = "10px";
    msg.innerText = message;
    document.getElementById("end-modal-content").appendChild(msg);
  }

  endModal.style.display = "flex";
}

// =====================================================
// INPUT
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
// MODE SELECT
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

// =====================================================
// BUTTONS
// =====================================================

finishButton.addEventListener("click", endGame);

againButtonModal.addEventListener("click", ()=>{
  endModal.style.display="none";
  startGame();
});

menuButton.addEventListener("click", ()=>{
  window.location.href="../index.html";
});

// Initial render
renderLeaderboards();
