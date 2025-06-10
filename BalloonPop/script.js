// Balloon Pop Game - Full Game Script with Login Integration

const urlParams = new URLSearchParams(window.location.search);
const playerName = urlParams.get("name");
const playerClass = urlParams.get("class");

if (!playerName || !playerClass) {
  window.location.href = "../index.html"; // Redirect to root login if missing
}

const form = document.forms["scoreForm"];
form["entry.1234567890"].value = playerName; // Update with real Google Form field ID
form["entry.0987654321"].value = playerClass;

let level = 1;
let score = 0;
let errors = 0;

const mrsC = document.getElementById("mrsC");
const speechBubble = document.getElementById("speechBubble");
const signImage = document.getElementById("signImage");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const balloonsContainer = document.getElementById("balloonsContainer");
const resultScreen = document.getElementById("resultScreen");
const finalScore = document.getElementById("finalScore");
const playAgainButton = document.getElementById("playAgain");

const colours = ["green", "red", "orange", "yellow", "purple", "pink", "blue", "brown", "black", "white"];

function getNumberRange(level) {
  if (level <= 3) return [0, 20];
  if (level <= 6) return [21, 50];
  if (level <= 9) return [51, 100];
  return [0, 100];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColour() {
  return colours[Math.floor(Math.random() * colours.length)];
}

function createBalloon(correct = false, correctNumber = 0, correctColour = "") {
  const balloon = document.createElement("img");
  const colour = correct ? correctColour : getRandomColour();
  const [min, max] = getNumberRange(level);
  const number = correct ? correctNumber : getRandomInt(min, max);
  balloon.src = `assets/colour/${colour}.png`;
  balloon.classList.add("balloon");
  balloon.dataset.number = number;
  balloon.dataset.colour = colour;
  balloon.style.left = `${Math.random() * 90}%`;
  balloonsContainer.appendChild(balloon);

  balloon.addEventListener("click", () => {
    if (correct && number == correctNumber && colour == correctColour) {
      score++;
      showCorrect(balloon);
    } else {
      errors++;
      showError(balloon);
    }
    scoreDisplay.textContent = `Score: ${score}`;
  });
}

function showCorrect(balloon) {
  balloon.classList.add("correct");
  setTimeout(() => balloon.remove(), 500);
  setTimeout(startRound, 1000);
}

function showError(balloon) {
  balloon.classList.add("pop");
  setTimeout(() => balloon.remove(), 500);
}

function startRound() {
  balloonsContainer.innerHTML = "";
  const [min, max] = getNumberRange(level);
  const correctNumber = getRandomInt(min, max);
  const correctColour = getRandomColour();
  signImage.src = `assets/number/${correctNumber}.png`;

  const correctIndex = getRandomInt(0, 8);
  for (let i = 0; i < 9; i++) {
    if (i === correctIndex) {
      createBalloon(true, correctNumber, correctColour);
    } else {
      createBalloon(false);
    }
  }
}

function nextLevel() {
  level++;
  if (level > 12) {
    showResult();
  } else {
    levelDisplay.textContent = `Level: ${level}`;
    startRound();
  }
}

function showResult() {
  finalScore.textContent = `Score: ${score}`;
  resultScreen.style.display = "block";
  submitResults();
}

playAgainButton.addEventListener("click", () => {
  window.location.href = `index.html?name=${encodeURIComponent(playerName)}&class=${encodeURIComponent(playerClass)}`;
});

function submitResults() {
  form["entry.1122334455"].value = score; // Replace with actual ID
  form["entry.5544332211"].value = errors;
  form.submit();
}

window.addEventListener("load", () => {
  levelDisplay.textContent = `Level: ${level}`;
  scoreDisplay.textContent = `Score: ${score}`;
  startRound();
});
