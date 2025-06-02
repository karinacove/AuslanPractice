// script.js

let wordLists = {};
let currentWord = "";
let currentIndex = 0;
let guessedWords = new Set();
let incorrectWords = [];
let mode = "";
let level = 3;
let timer;
let startTime;

const nameInput = document.getElementById("name");
const classInput = document.getElementById("class");
const modeSelect = document.getElementById("mode");
const gameScreen = document.getElementById("game-screen");
const signinScreen = document.getElementById("signin-screen");
const letterDisplay = document.getElementById("letter-display");
const answerInput = document.getElementById("answer");
const againButton = document.getElementById("again-button");
const speedSlider = document.getElementById("speed-slider");
const finishButton = document.getElementById("finish-button");

// Load word list
fetch("data/wordlist.json")
  .then(response => response.json())
  .then(data => {
    wordLists = data;
  })
  .catch(error => console.error("Error loading word list:", error));

function startGame() {
  mode = modeSelect.value;
  level = 3;
  guessedWords.clear();
  incorrectWords = [];
  signinScreen.style.display = "none";
  gameScreen.style.display = "block";
  answerInput.value = "";
  answerInput.focus();

  if (mode === "time") {
    startTime = Date.now();
    timer = setTimeout(() => endGame(), 2 * 60 * 1000);
    finishButton.style.display = "none";
  } else {
    finishButton.style.display = "inline-block";
  }

  showNextWord();
}

document.getElementById("start-button").addEventListener("click", startGame);

function showNextWord() {
  let wordPool = mode === "level" ? wordLists[level.toString()] || [] : getAllWords();

  let filtered = wordPool.filter(w => !guessedWords.has(w));
  if (filtered.length === 0 && incorrectWords.length === 0) {
    if (mode === "level" && level < 10) {
      level++;
      showNextWord();
      return;
    } else {
      endGame();
      return;
    }
  }

  currentWord = (incorrectWords.length > 0) ? incorrectWords[0] :
                 filtered[Math.floor(Math.random() * filtered.length)];
  currentIndex = 0;
  letterDisplay.textContent = "";
  answerInput.value = "";
  answerInput.focus();
  displayLetters();
}

function displayLetters() {
  if (currentIndex < currentWord.length) {
    letterDisplay.textContent = currentWord[currentIndex].toUpperCase();
    currentIndex++;
    setTimeout(displayLetters, 2100 - speedSlider.value * 20);
  } else {
    letterDisplay.textContent = "";
  }
}

answerInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    submitAnswer();
  }
});

document.getElementById("submit-button").addEventListener("click", submitAnswer);

function submitAnswer() {
  const guess = answerInput.value.trim().toLowerCase();
  if (guess === currentWord.toLowerCase()) {
    guessedWords.add(currentWord);
    incorrectWords = incorrectWords.filter(w => w !== currentWord);
  } else if (!incorrectWords.includes(currentWord)) {
    incorrectWords.push(currentWord);
    againButton.classList.add("breathe");
    setTimeout(() => againButton.classList.remove("breathe"), 1000);
    answerInput.value = "";
    answerInput.focus();
    return;
  }

  showNextWord();
}

document.getElementById("again-button").addEventListener("click", function () {
  currentIndex = 0;
  displayLetters();
});

finishButton.addEventListener("click", endGame);

function getAllWords() {
  return Object.values(wordLists).flat();
}

function endGame() {
  clearTimeout(timer);
  const correct = Array.from(guessedWords).join(", ");
  const wrong = incorrectWords.join(", ");
  const score = guessedWords.size;
  const speed = speedSlider.value;
  const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSfOFWu8FcUR3bOwg0mo_3Kb2O7p4m0TLvfUpZjx0zdzqKac4Q/formResponse?entry.423692452=${encodeURIComponent(nameInput.value)}&entry.1307864012=${encodeURIComponent(classInput.value)}&entry.468778567=${encodeURIComponent(mode)}&entry.1083699348=${score}&entry.746947164=${encodeURIComponent(correct)}&entry.1534005804=${encodeURIComponent(wrong)}&entry.1974555000=${encodeURIComponent(speed)}`;

  fetch(formURL, { method: "POST", mode: "no-cors" })
    .then(() => alert("Results submitted. Great job!"))
    .catch(() => alert("Error submitting results, but game is complete."));

  gameScreen.style.display = "none";
  signinScreen.style.display = "block";
}
