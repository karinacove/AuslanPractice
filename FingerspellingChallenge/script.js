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
keyboardContainer.style.zIndex = "9999";
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
// KEYBOARD SETUP
// -------------------------
function setupKeyboard() {
  const layout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  keyboardContainer.innerHTML = "";

  const header = document.createElement("div");
  header.id = "keyboard-header";
  keyboardContainer.appendChild(header);

  layout.forEach((row, rowIndex) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "keyboard-row";

    row.split("").forEach(letter => {
      const key = document.createElement("div");
      key.className = "keyboard-key";
      key.textContent = letter;

      key.onclick = () => {
        wordInput.value += letter.toLowerCase();
        wordInput.dispatchEvent(new Event("input"));

        key.classList.add("pop");
        setTimeout(() => key.classList.remove("pop"), 120);
      };

      rowDiv.appendChild(key);

      // Backspace
      if (rowIndex === 2 && letter === "M") {
        const backspace = document.createElement("div");
        backspace.textContent = "←";
        backspace.className = "keyboard-key wide";

        backspace.onclick = () => {
          wordInput.value = wordInput.value.slice(0, -1);
          wordInput.dispatchEvent(new Event("input"));
        };

        rowDiv.appendChild(backspace);
      }
    });

    keyboardContainer.appendChild(rowDiv);
  });

  const footer = document.createElement("div");
  footer.id = "keyboard-footer";
  keyboardContainer.appendChild(footer);

  dragElement(keyboardContainer, ["#keyboard-header", "#keyboard-footer"]);
}

// -------------------------
// DRAG FUNCTION
// -------------------------
function dragElement(elmnt, handles = ["#keyboard-header"]) {
  const elements = handles.map(sel => elmnt.querySelector(sel)).filter(Boolean);

  let startX = 0, startY = 0, initialX = 0, initialY = 0, dragging = false;

  elements.forEach(handle => {
    handle.addEventListener("mousedown", startDrag);
    handle.addEventListener("touchstart", startTouch, { passive: false });
  });

  function startDrag(e) {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = elmnt.offsetLeft;
    initialY = elmnt.offsetTop;

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  }

  function startTouch(e) {
    e.preventDefault();
    const t = e.touches[0];
    dragging = true;
    startX = t.clientX;
    startY = t.clientY;
    initialX = elmnt.offsetLeft;
    initialY = elmnt.offsetTop;

    document.addEventListener("touchmove", moveTouch, { passive: false });
    document.addEventListener("touchend", stop);
  }

  function move(e) {
    if (!dragging) return;
    elmnt.style.left = `${initialX + (e.clientX - startX)}px`;
    elmnt.style.top = `${initialY + (e.clientY - startY)}px`;
    elmnt.style.transform = "none";
  }

  function moveTouch(e) {
    if (!dragging) return;
    const t = e.touches[0];
    elmnt.style.left = `${initialX + (t.clientX - startX)}px`;
    elmnt.style.top = `${initialY + (t.clientY - startY)}px`;
    elmnt.style.transform = "none";
    e.preventDefault();
  }

  function stop() {
    dragging = false;
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", stop);
    document.removeEventListener("touchmove", moveTouch);
    document.removeEventListener("touchend", stop);
  }
}

// -------------------------
// INPUT HANDLING
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
      setTimeout(nextWord, 300);

    } else {
      incorrectWords.push(typed);

      wordInput.classList.add("breathe");

      setTimeout(() => {
        wordInput.value = "";
        wordInput.classList.remove("breathe");
        showLetterByLetter(currentWord);
      }, 400);
    }
  }
});

// -------------------------
// KEYBOARD TOGGLE
// -------------------------
function toggleKeyboard(e) {
  e.preventDefault();

  if (keyboardContainer.style.display === "none") {
    keyboardContainer.style.display = "block";
    keyboardContainer.style.top = "50%";
    keyboardContainer.style.left = "50%";
    keyboardContainer.style.transform = "translate(-50%, -50%)";
  } else {
    keyboardContainer.style.display = "none";
  }
}

// -------------------------
// BUTTON EVENTS (UPDATED)
// -------------------------
modeTimed.onclick = () => {
  gameMode = "timed";
  modeTimed.classList.add("selected");
  modeLevel.classList.remove("selected");
  lengthContainer.style.display = "flex";
};

modeLevel.onclick = () => {
  gameMode = "levelup";
  modeLevel.classList.add("selected");
  modeTimed.classList.remove("selected");
  lengthContainer.style.display = "none";
  wordLength = 3;
  startGame();
};

lengthOptions.forEach(option => {
  option.onclick = () => {
    lengthOptions.forEach(o => o.classList.remove("selected"));
    option.classList.add("selected");

    wordLength = parseInt(option.dataset.length);
    startGame();
  };
});

keyboardBtn.onclick = toggleKeyboard;
keyboardBtn.ontouchstart = toggleKeyboard;

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
    const isLast = i === word.length - 1;

    const t = setTimeout(() => {
      if (!isPaused) {
        letterDisplay.textContent = letter;

        setTimeout(() => {
          if (!isPaused) {
            // ✅ keep last letter visible slightly longer
            if (!isLast) {
              letterDisplay.textContent = "";
            } else {
              setTimeout(() => {
                letterDisplay.textContent = "";
              }, 150); // 👈 final letter delay
            }
          }
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

      if (timeLeft <= 0) {
        timeLeft = 0;
        endGame();
      }
    }
  }, 1000);
}

function nextWord() {

  // ✅ LEVEL UP LOGIC (every 10 correct words)
  if (gameMode === "levelup") {
    const level = Math.floor(correctWords / 10) + 3; // starts at 3 letters

    if (level > 10) {
      endGame(); // finished all levels
      return;
    }

    wordLength = level;
  }

  const words = wordBank[wordLength] || [];
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
  if (!wordBankLoaded) return setTimeout(startGame, 200);

  document.getElementById("signin-screen").style.display = "none";
  document.getElementById("leaderboards").style.display = "none";
  gameScreen.style.display = "flex";
  keyboardContainer.style.display = "none";

  score = 0;
  timeLeft = 120;
  correctWords = 0;
  wordLength = 3;
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
      countdownVideo.style.display = "block";
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

  const totalAttempts = correctWords + incorrectWords.length;
  const percentage = totalAttempts > 0
    ? Math.round((correctWords / totalAttempts) * 100)
    : 100;

  showPauseModal(elapsed, percentage);
}

function finishEarly() {
  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);

  const result = updateLeaderboard(elapsed);

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

  document.getElementById("leaderboard-message")?.remove();

  finishButton.style.display = "inline-block";
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
// Leaderboard Logic (LOCAL)
// -------------------------
function updateLeaderboard(elapsed) {
  let newTop10 = false;
  let newPersonal = false;

  if (gameMode === "timed") {

    if (!leaderboard.timed[wordLength]) {
      leaderboard.timed[wordLength] = { top10: [], personal: {} };
    }

    const board = leaderboard.timed[wordLength];

    if (
      !board.personal[studentName] ||
      score > board.personal[studentName].score
    ) {
      board.personal[studentName] = {
        score: score,
        class: studentClass
      };
      newPersonal = true;
    }

    const all = Object.entries(board.personal)
      .map(([name, data]) => ({
        name,
        score: data.score,
        class: data.class
      }))
      .sort((a, b) => b.score - a.score);

    board.top10 = all.slice(0, 10);
    newTop10 = board.top10.some(e => e.name === studentName);

  } else {

    // LEVEL UP MODE
    const board = leaderboard.levelup;

    if (
      !board.personal[studentName] ||
      correctWords > board.personal[studentName].words ||
      (
        correctWords === board.personal[studentName].words &&
        elapsed < board.personal[studentName].time
      )
    ) {
      board.personal[studentName] = {
        words: correctWords,
        time: elapsed,
        class: studentClass
      };
      newPersonal = true;
    }

    const all = Object.entries(board.personal)
      .map(([name, data]) => ({
        name,
        words: data.words,
        time: data.time,
        class: data.class
      }))
      .sort((a, b) => {
        if (b.words !== a.words) return b.words - a.words;
        return a.time - b.time;
      });

    board.top10 = all.slice(0, 10);
    newTop10 = board.top10.some(e => e.name === studentName);
  }

  saveLeaderboard();
  renderLocalLeaderboard();

  return { newTop10, newPersonal, elapsed };
}

// -------------------------
// Google Form Submit (BACKGROUND)
// -------------------------
function submitToGoogle(scoreValue, timeValue, finishedEarly = false) {

  const correctList = Array.from(guessedWords).sort().join(", ");
  const incorrectList = incorrectWords.sort().join(", ");

  const totalAttempts = correctWords + incorrectWords.length;

  const percentage = totalAttempts > 0
    ? Math.round((correctWords / totalAttempts) * 100)
    : 100;

  const speedSetting = speedSlider.value;

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

  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse";

  const params = new URLSearchParams({
    "entry.423692452": studentName,
    "entry.1307864012": studentClass,
    "entry.468778567": gameMode === "timed"
      ? `timed (${wordLength})${finishedEarly ? " - early finish" : ""}`
      : `level up${finishedEarly ? " - early finish" : ""}`,
    "entry.1083699348": scoreValue,
    "entry.1584601141": percentage,
    "entry.1220441930": timeValue,
    "entry.746947164": correctList,
    "entry.1534005804": incorrectList,
    "entry.1974555000": speedSetting,
    "entry.669299007": rank
  });

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: params
  });

  console.log("✅ Sent to Google Form");
}


// -------------------------
// LOCAL Leaderboard Render
// -------------------------
function renderLocalLeaderboard() {

  const timedDiv = document.getElementById("timed-leaderboard");
  const levelDiv = document.getElementById("level-leaderboard");

  if (!timedDiv || !levelDiv) return;

  // =========================
  // TIMED MODE
  // =========================
  const timedBoard = leaderboard.timed[wordLength]?.top10 || [];

  const allTime = [...timedBoard].sort((a, b) => b.score - a.score);

  const classTop = timedBoard
    .filter(e => e.class && e.class === studentClass)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  let timedHTML = "";

  // 🏆 ALL TIME (NO NUMBER)
  timedHTML += `<strong>🏆 All-Time Best</strong><br>`;
  timedHTML += allTime.length
    ? `${allTime[0].name} (${allTime[0].class}) - ${allTime[0].score}<br><br>`
    : "No scores yet<br><br>";

  // 🎓 CLASS TOP 10
  timedHTML += `<strong>🎓 ${studentClass} Top 10</strong><br>`;
  timedHTML += classTop.length
    ? classTop.map((e, i) =>
        `${i + 1}. ${e.name} (${e.class}) - ${e.score}`
      ).join("<br>")
    : "No scores yet";

  timedDiv.innerHTML = timedHTML;


  // =========================
  // LEVEL UP MODE
  // =========================
  const levelBoard = leaderboard.levelup.top10 || [];

  // 🔥 SORT: MOST WORDS FIRST, THEN FASTEST TIME
  const sortedLevel = [...levelBoard].sort((a, b) => {
    if (b.words !== a.words) return b.words - a.words;
    return a.time - b.time;
  });

  const classTopLevel = sortedLevel
    .filter(e => e.class && e.class === studentClass)
    .slice(0, 10);

  let levelHTML = "";

  // 🏆 ALL TIME (NO NUMBER)
  levelHTML += `<strong>🏆 All-Time Best</strong><br>`;
  levelHTML += sortedLevel.length
    ? `${sortedLevel[0].name} (${sortedLevel[0].class}) - ${sortedLevel[0].words} words in ${sortedLevel[0].time}s<br><br>`
    : "No scores yet<br><br>";

  // 🎓 CLASS TOP 10
  levelHTML += `<strong>🎓 ${studentClass} Top 10</strong><br>`;
  levelHTML += classTopLevel.length
    ? classTopLevel.map((e, i) =>
        `${i + 1}. ${e.name} (${e.class}) - ${e.words} words in ${e.time}s`
      ).join("<br>")
    : "No scores yet";

  levelDiv.innerHTML = levelHTML;
}

// -------------------------
// Modal
// -------------------------
function showFinishModal(result, isGameEnd = true) {
  endModal.style.display = "flex";

  document.getElementById("clap-display").innerHTML =
    isGameEnd ? `<img src="Assets/auslan-clap.gif" alt="Clap" />` : "";

  const { newTop10, newPersonal, elapsed } = result;

  scoreText.textContent = `Score: ${score}`;
  timeText.textContent = `Time: ${elapsed}s`;

  let msg = "";
  if (newTop10) msg += "🏆 Top 10!\n";
  if (newPersonal) msg += "⭐ Personal Best!";

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

  againButtonModal.style.display = "inline-block";
  menuButton.style.display = "inline-block";
  finishButton.style.display = "none";
  continueBtn.style.display = "none";

  document.getElementById("leaderboards").style.display = "block";
  
  renderLocalLeaderboard();
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
    window.location.href = "./index.html";
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
setupKeyboard();
renderLocalLeaderboard();
  if (!('ontouchstart' in window)) {
  keyboardBtn.style.display = "none";
}

// ✅ Keep UI fresh (optional)
setInterval(() => {
  if (!document.hidden) {
    renderLocalLeaderboard();
  }
}, 5000);
