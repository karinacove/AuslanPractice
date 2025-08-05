// -------------------------
// Student Sign-in Handling
// -------------------------
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  window.location.href = "../index.html";
}

document.getElementById("studentName").textContent = studentName;
document.getElementById("studentClass").textContent = studentClass;

// -------------------------
// Globals
// -------------------------
let currentLevel = 1;
let usedImages = new Set();
let correctItems = [];
let remainingItems = {};
let foundItems = {};
let levelStartTime;
let gameData = [];

const imageContainer = document.getElementById("imageContainer");
const sidebar = document.getElementById("sidebar");
const levelTitle = document.getElementById("levelTitle");
const clap = document.getElementById("clap");

// -------------------------
// Load Level Data
// -------------------------
async function loadLevel(levelNumber) {
  const response = await fetch("data.json");
  const data = await response.json();
  const levelItems = data[levelNumber];
  if (!levelItems) return;

  currentLevel = levelNumber;
  levelTitle.textContent = `Level ${currentLevel}`;

  correctItems = getRandomItems(levelItems, 10);
  remainingItems = {};
  foundItems = {};

  correctItems.forEach(item => {
    remainingItems[item] = getRandomInt(3, 20);
    foundItems[item] = 0;
  });

  imageContainer.innerHTML = "";
  sidebar.innerHTML = "";
  usedImages.clear();
  levelStartTime = Date.now();

  const allImages = await getAllImages();
  const imageElements = generateImages(correctItems, allImages);
  shuffleArray(imageElements);
  imageElements.forEach(img => imageContainer.appendChild(img));

  correctItems.forEach(item => {
    const count = remainingItems[item];
    const section = document.createElement("div");
    section.className = "item-counter";
    section.id = `counter-${item}`;

    const sign = document.createElement("img");
    sign.src = `matches/signs/${item}.png`;
    sign.className = "sign-icon";

    const counter = document.createElement("div");
    counter.className = "count";
    counter.textContent = `0 of ${count}`;

    section.appendChild(sign);
    section.appendChild(counter);
    sidebar.appendChild(section);
  });
}

// -------------------------
// Image Handling
// -------------------------
function generateImages(correctItems, allImages) {
  const imageElements = [];

  correctItems.forEach(item => {
    const count = remainingItems[item];
    for (let i = 0; i < count; i++) {
      const img = createImage(item, true);
      imageElements.push(img);
    }
  });

  const decoys = allImages.filter(img => !correctItems.includes(img));
  shuffleArray(decoys);
  while (imageElements.length < 100 && decoys.length) {
    const img = createImage(decoys.pop(), false);
    imageElements.push(img);
  }

  return imageElements;
}

function createImage(item, isCorrect) {
  const img = document.createElement("img");
  img.src = `matches/images/${item}.png`;
  img.className = "scene-image";
  img.dataset.item = item;
  img.dataset.correct = isCorrect;

  img.addEventListener("click", () => {
    if (img.classList.contains("found")) return;
    if (img.dataset.correct === "true") {
      foundItems[item]++;
      const total = remainingItems[item];
      const counterDiv = document.querySelector(`#counter-${item} .count`);
      counterDiv.textContent = `${foundItems[item]} of ${total}`;

      img.classList.add("found");
      if (foundItems[item] === total) {
        const section = document.getElementById(`counter-${item}`);
        const clapImg = document.createElement("img");
        clapImg.src = "matches/clap.gif";
        clapImg.className = "clap-icon";
        section.appendChild(clapImg);
      }
      checkLevelComplete();
    } else {
      img.classList.add("wrong");
      setTimeout(() => img.classList.remove("wrong"), 500);
    }
  });

  return img;
}

// -------------------------
// Utility Functions
// -------------------------
function getRandomItems(array, count) {
  const shuffled = [...array];
  shuffleArray(shuffled);
  return shuffled.slice(0, count);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getAllImages() {
  const response = await fetch("data.json");
  const data = await response.json();
  const all = new Set();
  Object.values(data).forEach(arr => arr.forEach(item => all.add(item)));
  return [...all];
}

function checkLevelComplete() {
  const complete = correctItems.every(item => foundItems[item] === remainingItems[item]);
  if (complete) {
    const timeTaken = Math.round((Date.now() - levelStartTime) / 1000);
    const percent = "100%";
    const result = {
      name: studentName,
      class: studentClass,
      level: currentLevel,
      time: timeTaken,
      percent,
    };
    gameData.push(result);
    alert(`Well done! Level ${currentLevel} complete.`);
    if (currentLevel < 2) {
      loadLevel(currentLevel + 1);
    } else {
      showFinishButton();
    }
  }
}

function showFinishButton() {
  const btn = document.getElementById("finishBtn");
  btn.style.display = "block";
}

document.getElementById("finishBtn").addEventListener("click", () => {
  console.log("Game Data:", gameData);
  // TODO: Google Form submission
  window.location.href = "../MatchingGame/hub.html";
});

// -------------------------
// Start Game
// -------------------------
loadLevel(currentLevel);
