// ===== Student Info =====
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const stopBtn = document.getElementById("stopBtn");
const promptDisplay = document.getElementById("promptDisplay");
const answerArea = document.getElementById("answerArea");
const draggableOptions = document.getElementById("draggableOptions");

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  if (studentInfoDiv) {
    studentInfoDiv.textContent = `${studentName} (${studentClass})`;
  }

  // Populate Google Form hidden inputs
  document.getElementById("formName").value = studentName;
  document.getElementById("formClass").value = studentClass;
}

// ==================
// Sentence Game Script
// ==================

let currentLevel = 1;
let currentQuestion = 1;
let score = 0;
let startTime;
let correctCount = 0;
let incorrectCount = 0;
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
function generateSentence(level, qType) {
  let animal = randomItem(level1to5Animals);
  let number = randomItem(level1to5Numbers);
  let food = randomItem(level1to5Foods);
  let colour = randomItem(level1to5Colours);

  if (level === 1) {
    if (qType === 1) {
      correctAnswer = [animal, number];
      return { prompt: "I see what?", focus: "animal+number", image: `assets/images/${animal}-${number}.png` };
    } else {
      correctAnswer = [`${animal}-${number}`];
      return { prompt: `I see what? ${animal} ${number}`, focus: "image", image: null };
    }
  }

  if (level === 2) {
    if (qType === 1) {
      correctAnswer = [food, colour];
      return { prompt: "I see what?", focus: "food+colour", image: `assets/images/${food}-${colour}.png` };
    } else {
      correctAnswer = [`${food}-${colour}`];
      return { prompt: `I see what? ${food} ${colour}`, focus: "image", image: null };
    }
  }

  if (level === 3) {
    if (qType === 1) {
      correctAnswer = [animal, number, "want", food, colour];
      return { prompt: "{animal-number} want what?", focus: "drag signs", image: `assets/images/${food}-${colour}.png` };
    } else {
      correctAnswer = [`${food}-${colour}`];
      return { prompt: `${animal} ${number} want what?`, focus: "image", image: null };
    }
  }

  if (level === 4) {
    correctAnswer = [animal, number, "have", food, colour];
    return { prompt: "have vs don't have", focus: "drag signs/images", image: null };
  }

  if (level === 5) {
    return { prompt: "Video task", focus: "video integration", image: null };
  }

  return { prompt: "placeholder", focus: "none", image: null };
}

// ---------- Build Question ----------
function buildQuestion() {
  const qData = generateSentence(currentLevel, currentQuestion);

  const sentenceDiv = document.getElementById("sentence");
  const imageDiv = document.getElementById("questionImage");

  sentenceDiv.textContent = qData.prompt;
  imageDiv.innerHTML = "";
  draggableOptions.innerHTML = "";

  if (qData.image) {
    const img = document.createElement("img");
    img.src = qData.image;
    img.className = "qImage";
    imageDiv.appendChild(img);
  }

  buildDraggables();
}

// ---------- Draggables ----------
function buildDraggables() {
  let pool = [...correctAnswer];

  pool.push(...getRandomDecoys(level1to5Animals, correctAnswer, 3));
  pool.push(...getRandomDecoys(level1to5Numbers, correctAnswer, 3));
  pool.push(...getRandomDecoys(level1to5Foods, correctAnswer, 3));
  pool.push(...getRandomDecoys(level1to5Colours, correctAnswer, 3));

  pool = shuffleArray(pool).slice(0, 15);

  pool.forEach(word => {
    const div = document.createElement("div");
    div.className = "draggable";
    div.textContent = word;
    div.draggable = true;
    div.addEventListener("dragstart", dragStart);
    draggableOptions.appendChild(div);
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
  }
}

// ---------- Check Answer ----------
function checkAnswers() {
  if (selectedItems.join(" ") === correctAnswer.join(" ")) {
    correctCount++;
    alert("✅ Correct!");
  } else {
    incorrectCount++;
    alert("❌ Incorrect!");
  }

  selectedItems = [];
  document.querySelectorAll(".dropzone").forEach(z => z.innerHTML = "");

  if (currentQuestion === 1) {
    currentQuestion = 2;
    buildQuestion();
  } else {
    currentLevel++;
    currentQuestion = 1;
    if (currentLevel <= 5) {
      buildQuestion();
    } else {
      endGame();
    }
  }
}

// ---------- Game Flow ----------
function startGame() {
  score = 0;
  currentLevel = 1;
  currentQuestion = 1;
  correctCount = 0;
  incorrectCount = 0;
  startTime = Date.now();
  gameEnded = false;
  buildQuestion();
}

function endGame() {
  gameEnded = true;
  const timeTaken = Math.floor((Date.now() - startTime) / 1000);
  const percentage = Math.round((correctCount / (correctCount + incorrectCount)) * 100);

  alert(`Game Over!\nCorrect: ${correctCount}\nIncorrect: ${incorrectCount}\nTime: ${timeTaken}s\nAccuracy: ${percentage}%`);
  saveLevelResults();
  finishGame();
}

// ---------- Google Form Saving ----------
function saveLevelResults() {
  if (currentLevel === 1) {
    document.querySelector("[name='entry.1150173566']").value = correctCount;
    document.querySelector("[name='entry.28043347']").value = incorrectCount;
  }
  if (currentLevel === 2) {
    document.querySelector("[name='entry.1424808967']").value = correctCount;
    document.querySelector("[name='entry.352093752']").value = incorrectCount;
  }
  if (currentLevel === 3) {
    document.querySelector("[name='entry.475324608']").value = correctCount;
    document.querySelector("[name='entry.1767451434']").value = incorrectCount;
  }
  if (currentLevel === 4) {
    document.querySelector("[name='entry.1405337882']").value = correctCount;
    document.querySelector("[name='entry.1513946929']").value = incorrectCount;
  }
}

function finishGame() {
  document.getElementById("googleForm").submit();
  alert("All levels complete! Results submitted.");
  window.location.href = "../hub.html";
}

// ---------- Buttons ----------
document.getElementById("submitBtn").addEventListener("click", () => {
  checkAnswers();
});
document.getElementById("stopBtn").addEventListener("click", () => {
  saveLevelResults();
  finishGame();
});
