// -------------------------
// Student Sign-in Handling
// -------------------------
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  if (studentInfoDiv) {
    studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  }
  if (gameContainer) {
    gameContainer.style.display = "block";
  }
}

// -------------------------
// Globals
// -------------------------
let currentLevel = 1;
let correctItems = [];
let remainingItems = {};
let foundItems = {};
let levelStartTime;
let gameData = [];

const sidebar = document.getElementById("sidebar");
const levelTitle = document.getElementById("levelTitle");
const imageContainer = document.getElementById("background");

// -------------------------
// Load Level Data
// -------------------------
async function loadLevel(levelNumber) {
  try {
    const response = await fetch("wordlist.json");
    if (!response.ok) throw new Error("Failed to load word list.");
    const data = await response.json();

    const levelItems = data[levelNumber];
    if (!levelItems) return;

    currentLevel = levelNumber;
    levelTitle.textContent = `Level ${currentLevel}`;
    updateBackground();

    // Select 10 target items
    correctItems = getRandomItems(levelItems, 10);

    // Allocate counts so total = 100 (1–20 each)
    remainingItems = {};
    let totalToAllocate = 100;
    for (let i = 0; i < correctItems.length; i++) {
      const maxForThis = Math.min(20, totalToAllocate - (correctItems.length - i - 1));
      const count = (i === correctItems.length - 1)
        ? totalToAllocate
        : getRandomInt(1, maxForThis);
      remainingItems[correctItems[i]] = count;
      totalToAllocate -= count;
    }

    // Reset found counts
    foundItems = {};
    correctItems.forEach(item => foundItems[item] = 0);

    // Clear board + sidebar
    imageContainer.innerHTML = "";
    sidebar.innerHTML = "";
    levelStartTime = Date.now();

    // Get all available items
    const allImages = await getAllImages();

    // Build correct images
    let correctImages = [];
    correctItems.forEach(item => {
      for (let i = 0; i < remainingItems[item]; i++) {
        correctImages.push(item);
      }
    });

    // Build 400 decoys
    const decoyPool = allImages.filter(item => !correctItems.includes(item));
    let decoyImages = [];
    for (let i = 0; i < 400; i++) {
      const randomDecoy = decoyPool[Math.floor(Math.random() * decoyPool.length)];
      decoyImages.push(randomDecoy);
    }

    // Merge, shuffle, and render all images
    let allImagesOnBoard = correctImages.concat(decoyImages);
    shuffleArray(allImagesOnBoard);

    allImagesOnBoard.forEach(item => {
      const img = createImage(item, correctItems.includes(item));
      imageContainer.appendChild(img);
    });

    // Build sidebar
    correctItems.forEach(item => {
      const section = document.createElement("div");
      section.className = "item-counter";
      section.id = `counter-${item}`;

      const sign = document.createElement("img");
      sign.src = `matches/signs/${item}-sign.png`;
      sign.className = "sign-icon";

      const foundImg = document.createElement("img");
      foundImg.id = `found-${item}`;
      foundImg.src = `numbers/0.png`;
      foundImg.className = "number-img";

      const slash = document.createElement("span");
      slash.textContent = "of ";
      slash.className = "slash-text";

      const targetImg = document.createElement("img");
      targetImg.id = `target-${item}`;
      targetImg.src = `numbers/${remainingItems[item]}.png`;
      targetImg.className = "number-img";

      section.appendChild(sign);
      section.appendChild(foundImg);
      section.appendChild(slash);
      section.appendChild(targetImg);
      sidebar.appendChild(section);
    });

  } catch (error) {
    alert("Error loading level data.");
    console.error(error);
  }
}

// -------------------------
// Image Handling
// -------------------------
function createImage(item, isCorrect) {
  const img = document.createElement("img");
  img.src = `matches/images/${item}.png`;
  img.className = "scene-image";
  img.dataset.item = item;
  img.dataset.correct = isCorrect;

  img.style.position = "absolute";
  img.style.width = "40px";
  img.style.height = "auto";

  const containerWidth = imageContainer.offsetWidth;
  const containerHeight = imageContainer.offsetHeight;
  img.style.left = `${Math.random() * (containerWidth - 20)}px`;
  img.style.top = `${Math.random() * (containerHeight - 20)}px`;

  const handleClick = () => {
    if (img.classList.contains("found")) return;

    // Overlay feedback
    const overlay = document.createElement("img");
    overlay.src = isCorrect ? "assets/correct.png" : "assets/wrong.png";
    overlay.className = "overlay-icon";
    overlay.style.position = "absolute";
    overlay.style.left = img.style.left;
    overlay.style.top = img.style.top;
    overlay.style.width = "20px";
    overlay.style.zIndex = "10";
    imageContainer.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2000);

    if (isCorrect) {
      foundItems[item]++;
      document.getElementById(`found-${item}`).src = `numbers/${foundItems[item]}.png`;
      img.classList.add("found");
      img.style.filter = "drop-shadow(0 0 10px lime) drop-shadow(0 0 20px lime)";

      if (foundItems[item] === remainingItems[item]) {
        const section = document.getElementById(`counter-${item}`);
        const clapImg = document.createElement("img");
        clapImg.src = "matches/clap.gif";
        clapImg.className = "clap-icon";
        section.appendChild(clapImg);
      }
      checkLevelComplete();
    }
  };

  img.addEventListener("click", handleClick);
  img.addEventListener("touchstart", handleClick);

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
  return array;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getAllImages() {
  const response = await fetch("wordlist.json");
  const data = await response.json();
  const all = new Set();
  Object.values(data).forEach(arr => arr.forEach(item => all.add(item)));
  return [...all];
}

// -------------------------
// Level Completion Check
// -------------------------
function checkLevelComplete() {
  const complete = correctItems.every(item => foundItems[item] === remainingItems[item]);
  if (complete) {
    const timeTaken = Math.round((Date.now() - levelStartTime) / 1000);
    const result = {
      name: studentName,
      class: studentClass,
      level: currentLevel,
      time: timeTaken,
      percent: "100%"
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

// -------------------------
function updateBackground() {
  const bgIndex = Math.min(currentLevel, 10);
  imageContainer.style.backgroundImage = `url('scene/level${bgIndex}.png')`;
}

function showFinishButton() {
  document.getElementById("finish-btn").style.display = "block";
}

function sendResultToGoogleForm(result) {
  const formUrl = "https://docs.google.com/forms/d/e/FORM_ID/formResponse";
  const formData = new FormData();
  formData.append("entry.123456", result.name);
  formData.append("entry.234567", result.class);
  formData.append("entry.345678", result.level);
  formData.append("entry.456789", result.time);
  formData.append("entry.567890", result.percent);
  return fetch(formUrl, { method: "POST", mode: "no-cors", body: formData });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById("finish-btn").addEventListener("click", async () => {
  for (const result of gameData) {
    await sendResultToGoogleForm(result);
    await delay(500);
  }
  alert("All results submitted!");
  window.location.href = "../MatchingGame/hub.html";
});

// -------------------------
// Start Game
// -------------------------
loadLevel(currentLevel);
