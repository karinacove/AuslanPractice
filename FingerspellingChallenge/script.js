let wordLists = {};
let currentWord = "";
let currentIndex = 0;
let guessedWords = new Set();
let incorrectWords = [];
let mode = "";
let level = 3;
let timer;
let timerInterval;
let startTime;
let selectedWordLength = 3;
let score = 0;

// DOM Elements
const nameInput = document.getElementById("student-name");
const classInput = document.getElementById("student-class");
const modeSelect = document.getElementById("game-mode");
const wordLengthSelect = document.getElementById("word-length");
const lengthContainer = document.getElementById("length-container");
const gameScreen = document.getElementById("game-screen");
const signinScreen = document.getElementById("signin-screen");
const letterDisplay = document.getElementById("letter-display");
const wordInput = document.getElementById("word-input");
const speedSlider = document.getElementById("speed-slider");
const againButton = document.getElementById("again-button");
const finishButton = document.getElementById("finish-button");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

// Load word list
fetch("data/wordlist.json")
  .then(response => response.json())
  .then(data => {
    wordLists = data;
  })
  .catch(error => console.error("Error loading word list:", error));

// Show/hide word length selector
modeSelect.addEventListener("change", () => {
  lengthContainer.style.display = modeSelect.value === "timed" ? "block" : "none";
});

// Start Game
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
  scoreDisplay.textContent = "Score: 0";
  wordInput.value = "";
  letterDisplay.textContent = "";
  wordInput.focus();
  selectedWordLength = parseInt(wordLengthSelect?.value || "3");

  signinScreen.style.display = "none";
  gameScreen.style.display = "block";

  if (mode === "timed") {
    startTimedMode();
  } else {
    finishButton.style.display = "inline-block";
    showNextWord();
  }
});

// Timed Mode Setup
function startTimedMode() {
  let timeLeft = 120;
  timerDisplay.textContent = `Time: ${timeLeft}`;
  finishButton.style.display = "none";

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);

  showNextWord();
}

// Show Next Word
function showNextWord() {
  let pool =
    mode === "levelup"
      ? wordLists[level.toString()] || []
      : wordLists[selectedWordLength.toString()] || [];

  let filtered = pool.filter(w => !guessedWords.has(w));
  if (filtered.length === 0 && incorrectWords.length === 0) {
    if (mode === "levelup" && level < 10) {
      level++;
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
  displayLetters();
}

// Display letters one at a time
const startDelay = 500; // ms before first letter
const letterDuration = parseInt(speedSlider.value); // from slider
const gapDuration = 50; // ms blank gap between letters

function displayLetters() {
  const letters = currentWord.toUpperCase().split("");
  let index = 0;

  // Disable input during display
  wordInput.disabled = true;

  setTimeout(function showNext() {
    if (index < letters.length) {
      letterDisplay.textContent = letters[index];
      letterDisplay.classList.add("breathe");

      setTimeout(() => {
        letterDisplay.textContent = "";
        letterDisplay.classList.remove("breathe");

        setTimeout(showNext, gapDuration); // gap before next
      }, letterDuration);
      
      index++;
    } else {
      // Re-enable input after word shown
      wordInput.disabled = false;
      wordInput.focus();
    }
  }, startDelay);
}

// Submit word
document.getElementById("submit-word").addEventListener("click", checkWord);
wordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") checkWord();
});

function checkWord() {
  const input = wordInput.value.trim().toLowerCase();
  if (!input) return;

  if (input === currentWord.toLowerCase()) {
    guessedWords.add(currentWord);
    incorrectWords = incorrectWords.filter(w => w !== currentWord);
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
  } else if (!incorrectWords.includes(currentWord)) {
    incorrectWords.push(currentWord);
    againButton.classList.add("breathe");
    setTimeout(() => againButton.classList.remove("breathe"), 1000);
  }

  showNextWord();
}

// Replay Word
againButton.addEventListener("click", () => {
  currentIndex = 0;
  displayLetters();
});

// Finish Button (Level Up Mode)
finishButton.addEventListener("click", () => {
  endGame();
});

// End Game + Submit to Google Form
function endGame() {
  clearInterval(timerInterval);

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

  fetch(formURL, { method: "POST", mode: "no-cors" })
    .then(() => alert("Results submitted. Great job!"))
    .catch(() => alert("Error submitting results, but game is complete."));

  signinScreen.style.display = "block";
  gameScreen.style.display = "none";
}
