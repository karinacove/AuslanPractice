// ==================
// Sentence Game Script
// ==================

let currentLevel = 1;
let score = 0;
let startTime;
let selectedItems = [];
let correctAnswer = [];
let gameEnded = false;

// ---------- Vocabulary Pools ----------

// Limited vocab (Levels 1–5)
const level1to5Animals = ["dog", "cat", "mouse", "bird", "fish", "rabbit"];
const level1to5Numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const level1to5Foods = ["apple","banana","pear","grape","orange","strawberry","watermelon"];
const level1to5Colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];

// Full vocab (Levels 6–10) – expand as needed
const animals = ["dog","cat","mouse","bird","fish","rabbit","horse","cow","sheep","chicken","duck","goat","pig"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
const foods = ["apple","banana","pear","grape","orange","strawberry","watermelon","carrot","cake","cheese","chips","egg","mushroom","tomato"];
const colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];
const verbs = ["want","eat","like","see","have"];

// ---------- Sentence Generator ----------
function generateSentence() {
  let animalPool, numberPool, foodPool, colourPool, verbPool;

  if (currentLevel <= 5) {
    animalPool = level1to5Animals;
    numberPool = level1to5Numbers;
    foodPool = level1to5Foods;
    colourPool = level1to5Colours;
    verbPool = ["want"]; // only want
  } else {
    animalPool = animals;
    numberPool = numbers;
    foodPool = foods;
    colourPool = colours;
    verbPool = verbs; // full set
  }

  const animal = randomItem(animalPool);
  const number = randomItem(numberPool);
  const verb = randomItem(verbPool);
  const food = randomItem(foodPool);
  const colour = randomItem(colourPool);

  // Sentence structure: animal, number, verb, food, colour
  correctAnswer = [animal, number, verb, food, colour];
  return `${animal} ${number} ${verb} ${food} ${colour}`;
}

// ---------- Draggables (answer + decoys) ----------
function buildDraggables() {
  const container = document.getElementById("draggables");
  container.innerHTML = "";

  let pool = [...correctAnswer];

  if (currentLevel <= 5) {
    pool.push(...getRandomDecoys(level1to5Animals, correctAnswer, 3));
    pool.push(...getRandomDecoys(level1to5Numbers, correctAnswer, 3));
    pool.push(...getRandomDecoys(level1to5Foods, correctAnswer, 3));
    pool.push(...getRandomDecoys(level1to5Colours, correctAnswer, 3));
  } else {
    pool.push(...getRandomDecoys(animals, correctAnswer, 3));
    pool.push(...getRandomDecoys(numbers, correctAnswer, 3));
    pool.push(...getRandomDecoys(foods, correctAnswer, 3));
    pool.push(...getRandomDecoys(colours, correctAnswer, 3));
    pool.push(...getRandomDecoys(verbs, correctAnswer, 1));
  }

  // Trim to 16 items
  pool = shuffleArray(pool).slice(0, 16);

  pool.forEach(word => {
    const div = document.createElement("div");
    div.className = "draggable";
    div.textContent = word;
    div.draggable = true;
    div.addEventListener("dragstart", dragStart);
    container.appendChild(div);
  });
}

// ---------- Utility ----------
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDecoys(pool, exclude, count) {
  const candidates = pool.filter(item => !exclude.includes(item));
  return shuffleArray(candidates).slice(0, count);
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ---------- Drag & Drop ----------
function dragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.textContent);
}

function allowDrop(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const word = e.dataTransfer.getData("text/plain");
  const target = e.target;

  if (target.classList.contains("dropzone") && target.childElementCount === 0) {
    const div = document.createElement("div");
    div.textContent = word;
    div.className = "dropped";
    target.appendChild(div);
    selectedItems.push(word);
    checkCompletion();
  }
}

function checkCompletion() {
  const zones = document.querySelectorAll(".dropzone");
  if (Array.from(zones).every(z => z.childElementCount > 0)) {
    checkAnswer();
  }
}

function checkAnswer() {
  if (selectedItems.join(" ") === correctAnswer.join(" ")) {
    score++;
    alert("✅ Correct!");
  } else {
    alert("❌ Try again!");
  }

  selectedItems = [];
  document.querySelectorAll(".dropzone").forEach(z => z.innerHTML = "");
  currentLevel++;
  if (currentLevel <= 10) {
    startLevel();
  } else {
    endGame();
  }
}

// ---------- Game Flow ----------
function startLevel() {
  const sentence = generateSentence();
  document.getElementById("sentence").textContent = sentence;
  buildDraggables();
}

function startGame() {
  score = 0;
  currentLevel = 1;
  startTime = Date.now();
  gameEnded = false;
  startLevel();
}

function endGame() {
  gameEnded = true;
  const timeTaken = Math.floor((Date.now() - startTime) / 1000);
  const percentage = Math.round((score / 10) * 100);

  alert(`Game Over!\nScore: ${score}/10\nTime: ${timeTaken}s\nAccuracy: ${percentage}%`);

// ===== Save Level Results to Google Form Hidden Inputs =====
function saveLevelResults() {
  if (level === 1) {
    document.querySelector("[name='entry.1150173566']").value = correctCount;
    document.querySelector("[name='entry.28043347']").value = incorrectCount;
  }
  if (level === 2) {
    document.querySelector("[name='entry.1424808967']").value = correctCount;
    document.querySelector("[name='entry.352093752']").value = incorrectCount;
  }
  if (level === 3) {
    document.querySelector("[name='entry.475324608']").value = correctCount;
    document.querySelector("[name='entry.1767451434']").value = incorrectCount;
  }
  if (level === 4) {
    document.querySelector("[name='entry.1405337882']").value = correctCount;
    document.querySelector("[name='entry.1513946929']").value = incorrectCount;
  }
  // ✅ Add similar mappings for levels 5–10 if needed
}

// ===== Finish Game =====
function finishGame() {
  document.getElementById("googleForm").submit();
  alert("All levels complete! Results submitted.");
  window.location.href = "../hub.html";
}

// ===== Buttons =====
document.getElementById("submitBtn").addEventListener("click", () => {
  checkAnswers();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  saveLevelResults();
  finishGame();
});
