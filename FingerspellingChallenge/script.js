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
const endModal = document.getElementById("end-modal");
const continueBtn = document.getElementById("continue-btn");
const againButtonModal = document.getElementById("again-button-modal");
const menuButton = document.getElementById("menu-button");
const logoutButton = document.getElementById("logout-button");


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
let isPaused = false;

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
      if (!isPaused) {
        letterDisplay.textContent = letter.toLowerCase();
        setTimeout(() => {
          if (!isPaused && letterDisplay.textContent === letter.toLowerCase()) {
            letterDisplay.textContent = "";
          }
        }, 400 - speed); // linger per letter
      }
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
    if (!isPaused) {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) endGame();
    }
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
  isPaused = true;
  endModal.style.display = "flex";
  const percentage = correctWords + incorrectWords.length > 0
    ? Math.round((correctWords / (correctWords + incorrectWords.length)) * 100)
    : 100;
  endModal.querySelector("#score-percentage").textContent = `${percentage}% Correct`;
  document.getElementById("clap-display").innerHTML = `<img src="Assets/auslan-clap.gif" alt="Clap" />`;
}

function hideFinishModal() {
  isPaused = false;
  endModal.style.display = "none";
  wordInput.focus();
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
  if (isPaused) return;
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
  if (isPaused) return;
  againButton.style.display = "block";
  wordInput.value = "";
  wordInput.style.visibility = "visible";
  wordInput.focus();
  showLetterByLetter(currentWord);
});

finishButton.addEventListener("click", showFinishModal);

continueBtn.addEventListener("click", hideFinishModal);

keyboardBtn.addEventListener("click", () => {
  if (keyboardContainer.style.display === "none") {
    showKeyboard();
  } else {
    keyboardContainer.style.display = "none";
  }
});

againButtonModal.addEventListener("click", () => {
  window.location.href = "../FingerspellingChallenge/index.html";
});

menuButton.addEventListener("click", () => {
  window.location.href = "../index.html";
});

logoutButton.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../index.html";
});

function setupKeyboard() {
  const keyboard = document.getElementById("onScreenKeyboard");
  if (!keyboard) return;

  keyboard.innerHTML = `
    <div id="keyboard-header">
      <button id="closeKeyboardBtn">✖</button>
    </div>
  `;

  const layout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  layout.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "keyboard-row";
    row.split("").forEach(letter => {
      const key = document.createElement("button");
      key.className = "key";
      key.textContent = letter;
      key.addEventListener("click", () => {
        if (currentGuess.length < 5) {
          currentGuess += letter;
          updateGrid();
        }
      });
      rowDiv.appendChild(key);
    });
    keyboard.appendChild(rowDiv);
  });

  const controlRow = document.createElement("div");
  controlRow.className = "keyboard-row";

  const backspace = document.createElement("button");
  backspace.textContent = "←";
  backspace.className = "key wide";
  backspace.onclick = () => {
    currentGuess = currentGuess.slice(0, -1);
    updateGrid();
  };

  const enter = document.createElement("button");
  enter.textContent = "↵";
  enter.className = "key wide";
  enter.onclick = () => {
    if (currentGuess.length === 5) {
      if (!validWords.includes(currentGuess.toUpperCase())) {
        showInvalidWordMessage(currentGuess);
        return;
      }
      checkGuess();
    }
  };

  controlRow.append(backspace, enter);
  keyboard.appendChild(controlRow);

  document.getElementById("closeKeyboardBtn").onclick = () => keyboard.style.display = "none";

  dragElement(keyboard);
}

function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = elmnt.querySelector("#keyboard-header");

  if (header) {
    header.onmousedown = dragMouseDown;
    header.ontouchstart = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    if (e.type === "touchstart") {
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;
      document.ontouchmove = elementDrag;
      document.ontouchend = closeDragElement;
    } else {
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    let clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    let clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    pos1 = pos3 - clientX;
    pos2 = pos4 - clientY;
    pos3 = clientX;
    pos4 = clientY;

    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.transform = "none";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
}
