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
const logoutButton = document.getElementById("logout-button");
const modeOptions = document.querySelectorAll(".mode-option");
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
let isPaused = false;

// -------------------------
// Load Word Bank
// -------------------------
fetch("data/wordlist.json")
  .then((response) => response.json())
  .then((data) => (wordBank = data))
  .catch((error) => console.error("Error loading word list:", error));

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
  const filteredWords = words.filter(w => !guessedWords.has(w));
  if (filteredWords.length === 0) {
    endGame();
    return;
  }
  currentWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
  setTimeout(() => showLetterByLetter(currentWord), 200);
}

function startGame() {
  document.getElementById("signin-screen").style.display = "none";
  gameScreen.style.display = "flex";

  score = 0;
  timeLeft = 120;
  correctWords = 0;
  guessedWords.clear();
  incorrectWords = [];
  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();
  againButton.style.display = "block";
  updateScore();

  if (gameMode === "timed") {
    countdownVideo.style.display = "block";
    countdownVideo.currentTime = 0;
    countdownVideo.play();
    startTimer();
  } else {
    countdownVideo.style.display = "none";
  }

  setTimeout(nextWord, 400);
}

function endGame() {
  clearInterval(timer);
  clearLetters();
  wordInput.style.visibility = "hidden";
  submitResults();
  showFinishModal(true);
}

function submitResults() {
  const correct = Array.from(guessedWords).join(", ");
  const wrong = incorrectWords.join(", ");
  const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?entry.423692452=${encodeURIComponent(studentName)}&entry.1307864012=${encodeURIComponent(studentClass)}&entry.468778567=${encodeURIComponent(gameMode)}&entry.1083699348=${score}&entry.746947164=${encodeURIComponent(correct)}&entry.1534005804=${encodeURIComponent(wrong)}&entry.1974555000=${encodeURIComponent(speedSlider.value)}`;
  fetch(formURL, { method: "POST", mode: "no-cors" });
}

function showFinishModal(isGameEnd = false) {
  isPaused = true;
  endModal.style.display = "flex";
  const percentage = correctWords + incorrectWords.length > 0
    ? Math.round((correctWords / (correctWords + incorrectWords.length)) * 100)
    : 100;
  const minutes = Math.floor((120 - timeLeft) / 60);
  const seconds = (120 - timeLeft) % 60;

  endModalContent.querySelector("#score-percentage").textContent = `${percentage}% Correct`;
  scoreText.textContent = `Score: ${score}`;
  timeText.textContent = `Time: ${minutes} mins ${seconds} sec`;
  document.getElementById("clap-display").innerHTML = isGameEnd ? `<img src="Assets/auslan-clap.gif" alt="Clap" />` : "";

  againButtonModal.style.display = "inline-block";
  menuButton.style.display = "inline-block";
  continueBtn.style.display = isGameEnd ? "none" : "inline-block";
}

function hideFinishModal() {
  isPaused = false;
  endModal.style.display = "none";
  wordInput.focus();
  if (gameMode === "timed" && countdownVideo.paused) {
    countdownVideo.play();
  }
}

function setupKeyboard() {
  const layout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  keyboardContainer.innerHTML = "";

  const header = document.createElement("div");
  header.id = "keyboard-header";
  header.style.height = "16px";
  header.style.background = "#eee";
  header.style.cursor = "move";
  keyboardContainer.appendChild(header);

  layout.forEach((row, rowIndex) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "keyboard-row";

    row.split("").forEach(letter => {
      const key = document.createElement("div");
      key.className = "keyboard-key";
      key.textContent = letter;

      key.addEventListener("click", () => {
        wordInput.value += letter.toLowerCase();
        wordInput.dispatchEvent(new Event("input"));
        key.classList.add("pop");
        setTimeout(() => key.classList.remove("pop"), 150);
      });

      rowDiv.appendChild(key);

      if (rowIndex === 2 && letter === "M") {
        const backspace = document.createElement("div");
        backspace.textContent = "←";
        backspace.className = "keyboard-key key wide";
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
  footer.style.height = "16px";
  footer.style.background = "#eee";
  footer.style.cursor = "move";
  keyboardContainer.appendChild(footer);

  dragElement(keyboardContainer, ["#keyboard-header", "#keyboard-footer"]);
}

function dragElement(elmnt, handleSelectors = ["#keyboard-header"]) {
  const handles = handleSelectors.map(sel => elmnt.querySelector(sel)).filter(Boolean);
  let startX = 0, startY = 0, initialX = 0, initialY = 0, dragging = false;

  handles.forEach(handle => {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = elmnt.offsetLeft;
      initialY = elmnt.offsetTop;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", stopDrag);
    });

    handle.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      dragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      initialX = elmnt.offsetLeft;
      initialY = elmnt.offsetTop;
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", stopDrag);
    });
  });

  function onMouseMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    elmnt.style.left = `${initialX + dx}px`;
    elmnt.style.top = `${initialY + dy}px`;
    elmnt.style.transform = "none";
  }

  function onTouchMove(e) {
    if (!dragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    elmnt.style.left = `${initialX + dx}px`;
    elmnt.style.top = `${initialY + dy}px`;
    elmnt.style.transform = "none";
    e.preventDefault();
  }

  function stopDrag() {
    dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", stopDrag);
  }
}

// -------------------------
// Event Listeners
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
        wordInput.classList.add("breathe");
        const againImg = document.querySelector("#again-button img");
        if (againImg) {
          againImg.classList.add("breathe");
          setTimeout(() => againImg.classList.remove("breathe"), 800);
        }
        setTimeout(() => {
          wordInput.value = "";
          wordInput.classList.remove("breathe");
          showLetterByLetter(currentWord);
        }, 500);
      }
    }, 50);
  }
});

modeTimed.addEventListener("click", () => {
  gameMode = "timed";
  modeTimed.classList.add("selected");
  modeLevel.classList.remove("selected");
  lengthContainer.style.display = "flex";
});

modeLevel.addEventListener("click", () => {
  gameMode = "levelup";
  modeLevel.classList.add("selected");
  modeTimed.classList.remove("selected");
  lengthContainer.style.display = "none";
  wordLength = 3;
  startGame();
});

lengthOptions.forEach(option => {
  option.addEventListener("click", () => {
    lengthOptions.forEach(o => o.classList.remove("selected"));
    option.classList.add("selected");
    wordLength = parseInt(option.dataset.length);
    startGame();
  });
});

keyboardBtn.addEventListener("click", toggleKeyboard);
keyboardBtn.addEventListener("touchstart", toggleKeyboard);

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

finishButton.addEventListener("click", () => {
  isPaused = true;
  if (gameMode === "timed" && countdownVideo && !countdownVideo.paused) {
    countdownVideo.pause();
  }
  showFinishModal(false);
});

continueBtn.addEventListener("click", hideFinishModal);

againButtonModal.addEventListener("click", () => {
  isPaused = false;
  startGame();
});

menuButton.addEventListener("click", () => window.location.href = "../index.html");

logoutButton.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../index.html";
});

againButton.addEventListener("click", () => {
  if (isPaused) return;
  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();
  showLetterByLetter(currentWord);
});

speedSlider.addEventListener("input", () => {
  speed = parseInt(speedSlider.value);
});

// Auto-end game when video ends
countdownVideo.addEventListener("ended", () => {
  if (gameMode === "timed") {
    endGame();
  }
});

setupKeyboard();
