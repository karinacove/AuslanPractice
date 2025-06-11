let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const logoutBtn = document.getElementById("logout-btn");
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

// Logout clears localStorage and redirects
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentClass");
    window.location.href = "../index.html";
  });
}


let wordLists = {};
let currentWord = "";
let currentIndex = 0;
let guessedWords = new Set();
let incorrectWords = [];
let mode = "";
let level = 3;
let timerInterval;
let selectedWordLength = 3;
let score = 0;
let correctCount = 0;
let delayBeforeStart = 500;
let letterGap = 50;
let isSpelling = false; // Prevent overlapping replay

// DOM Elements
document.getElementById('start-screen').style.display = 'none';
document.getElementById('game-container').style.display = 'block';const modeSelect = document.getElementById("game-mode");
const wordLengthSelect = document.getElementById("word-length");
const lengthContainer = document.getElementById("length-container");
const gameScreen = document.getElementById("game-screen");
const signinScreen = document.getElementById("signin-screen");
const letterDisplay = document.getElementById("letter-display");
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const againButton = document.getElementById("again-button");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const clapDisplay = document.getElementById("clap-display");
const endButton = document.createElement("button");
endButton.id = "end-button";
endButton.textContent = "End Game";
endButton.style.position = "absolute";
endButton.style.top = "10px";
endButton.style.right = "10px";
endButton.style.zIndex = "6";
endButton.style.padding = "10px 20px";
endButton.style.fontSize = "16px";
endButton.style.cursor = "pointer";
endButton.style.display = "none";
document.body.appendChild(endButton);

// Load word list
fetch("data/wordlist.json")
  .then(response => response.json())
  .then(data => {
    wordLists = data;
  })
  .catch(error => console.error("Error loading word list:", error));

modeSelect.addEventListener("change", () => {
  lengthContainer.style.display = modeSelect.value === "timed" ? "block" : "none";
});

document.getElementById("start-button").addEventListener("click", () => {
  const name = nameInput.value.trim();
  const studentClass = classInput.value.trim();

  if (!name || !studentClass) {
    alert("Please enter name and class.");
    return;
  }

  mode = modeSelect.value;
  guessedWords.clear();
  incorrectWords = [];
  level = 3;
  score = 0;
  correctCount = 0;
  scoreDisplay.textContent = "Score: 0";
  wordInput.value = "";
  letterDisplay.textContent = "";
  wordInput.focus();
  selectedWordLength = parseInt(wordLengthSelect?.value || "3");

  signinScreen.style.display = "none";
  gameScreen.style.display = "flex";
  clapDisplay.innerHTML = "";
  againButton.style.display = "block";
  againButton.style.width = "100px";
  againButton.style.height = "auto";
  againButton.style.margin = "20px auto 0";

  endButton.disabled = false;
  if (mode === "levelup") {
    endButton.style.display = "inline-block";
  } else {
    endButton.style.display = "none";
  }

  if (mode === "timed") {
    startTimedMode();
  } else {
    setTimeout(showNextWord, delayBeforeStart);
  }
});

function startTimedMode() {
  let timeLeft = 120;
  timerDisplay.textContent = `Time: ${timeLeft}`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);

  setTimeout(showNextWord, delayBeforeStart);
}

function showNextWord() {
  let pool =
    mode === "levelup"
      ? wordLists[level.toString()] || []
      : wordLists[selectedWordLength.toString()] || [];

  let filtered = pool.filter(w => !guessedWords.has(w));
  if (filtered.length === 0 && incorrectWords.length === 0) {
    if (mode === "levelup" && level < 10) {
      level++;
      correctCount = 0;
      showNextWord();
      return;
    } else {
      endGame();
      return;
    }
  }

  currentWord =
    incorrectWords.length > 0
      ? incorrectWords[0]
      : filtered[Math.floor(Math.random() * filtered.length)];

  currentIndex = 0;
  wordInput.value = "";
  letterDisplay.textContent = "";
  setTimeout(displayLetters, 500); // 0.5 second delay before fingerspelling
}

function displayLetters() {
  if (isSpelling) return;
  isSpelling = true;

  const speed = parseInt(speedSlider.value);
  const letterDuration = 1200 - speed * 5;
  const interLetterGap = letterGap;

  let index = 0;

  function showLetter() {
    if (index < currentWord.length) {
      letterDisplay.textContent = currentWord[index].toUpperCase();
      setTimeout(() => {
        letterDisplay.textContent = "";
        setTimeout(showLetter, interLetterGap);
      }, letterDuration);
      index++;
    } else {
      isSpelling = false;
    }
  }

  showLetter();
}

wordInput.addEventListener("input", () => {
  if (wordInput.value.trim().length === currentWord.length) {
    checkWord();
  }
});

againButton.addEventListener("click", () => {
  if (!isSpelling && currentWord) {
    displayLetters();
  }
});

function checkWord() {
  const input = wordInput.value.trim().toLowerCase();
  if (!input) return;

  if (input === currentWord.toLowerCase()) {
    guessedWords.add(currentWord);
    incorrectWords = incorrectWords.filter(w => w !== currentWord);
    score++;
    correctCount++;
    scoreDisplay.textContent = `Score: ${score}`;

    if (mode === "levelup" && correctCount >= 10 && level < 10) {
      level++;
      correctCount = 0;
    }
  } else if (!incorrectWords.includes(currentWord)) {
    incorrectWords.push(currentWord);
    againButton.classList.add("breathe");
    setTimeout(() => againButton.classList.remove("breathe"), 1000);
  }

  showNextWord();
}

endButton.addEventListener("click", () => {
  endButton.disabled = true;
  endGame();
});

function endGame() {
  clearInterval(timerInterval);
  endButton.style.display = "none";

  const correct = Array.from(guessedWords).join(", ");
  const wrong = incorrectWords.join(", ");
  const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?entry.423692452=${encodeURIComponent(
    nameInput.value
  )}&entry.1307864012=${encodeURIComponent(
    classInput.value
  )}&entry.468778567=${encodeURIComponent(
    mode
  )}&entry.1083699348=${score}&entry.746947164=${encodeURIComponent(
    correct
  )}&entry.1534005804=${encodeURIComponent(
    wrong
  )}&entry.1974555000=${encodeURIComponent(speedSlider.value)}`;

  fetch(formURL, { method: "POST", mode: "no-cors" }).then(() => {
    letterDisplay.textContent = "";
    clapDisplay.innerHTML = `<img src='Assets/Icons/auslan-clap.gif' alt='Clap' style='max-width:150px;' />`;
    againButton.style.display = "none";
    endButton.style.display = "none";

    setTimeout(() => {
      clapDisplay.innerHTML = "";
      clapDisplay.innerHTML += `<h2>Score: ${score}</h2>`;
      againButton.style.display = "block";
    }, 3000);
  });
}
