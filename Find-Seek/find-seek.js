// -------------------------
// Student Sign-in Handling
// -------------------------
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");

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
const clap = document.getElementById("clap");
const imageContainer = document.getElementById("background");

// -------------------------
// Load Level Data
// -------------------------
async function loadLevel(levelNumber) {
  let data;
  try {
    const response = await fetch("wordlist.json");
    if (!response.ok) throw new Error("Failed to load word list.");
    data = await response.json();
  } catch (error) {
    alert("Error loading level data.");
    console.error(error);
    return;
  }

  const levelItems = data[levelNumber];
  if (!levelItems) return;

  currentLevel = levelNumber;
  levelTitle.textContent = `Level ${currentLevel}`;
  updateBackground();

  // Select 10 correct items
  correctItems = getRandomItems(levelItems, 10);
  
  // Allocate counts so total is exactly 100, each between 1 and 20
  remainingItems = {};
  let totalToAllocate = 100;
  for (let i = 0; i < correctItems.length; i++) {
    const item = correctItems[i];
    const maxForThis = Math.min(20, totalToAllocate - (correctItems.length - i - 1)); // leave at least 1 for remaining items
    let count;
    if (i === correctItems.length - 1) {
      count = totalToAllocate; // assign all remaining to last item
    } else {
      count = getRandomInt(1, maxForThis);
    }
    remainingItems[item] = count;
    totalToAllocate -= count;
  }

  // Initialize found counts
  foundItems = {};
  correctItems.forEach(item => foundItems[item] = 0);

  imageContainer.innerHTML = "";
  sidebar.innerHTML = "";
  levelStartTime = Date.now();

  // Get all images from wordlist.json
  const allImages = await getAllImages();

  // Generate array of correct images repeated by allocated count
  let correctImages = [];
  correctItems.forEach(item => {
    for (let i = 0; i < remainingItems[item]; i++) {
      correctImages.push(item);
    }
  });

  // Get decoy items (not in correctItems)
  const decoyItems = allImages.filter(item => !correctItems.includes(item));

  // Generate 400 decoy images randomly chosen
  let decoyImages = [];
  for (let i = 0; i < 400; i++) {
    const randomDecoy = decoyItems[Math.floor(Math.random() * decoyItems.length)];
    decoyImages.push(randomDecoy);
  }

  // Combine and shuffle all images (correct + decoys)
  let allImagesOnBoard = correctImages.concat(decoyImages);
  shuffleArray(allImagesOnBoard);

  // Create image elements and append
  allImagesOnBoard.forEach(item => {
    const img = createImage(item, correctItems.includes(item));
    imageContainer.appendChild(img);
  });

  // Create sidebar counters for correct items
  correctItems.forEach(item => {
    const count = remainingItems[item];
    const section = document.createElement("div");
    section.className = "item-counter";
    section.id = `counter-${item}`;

    const sign = document.createElement("img");
    sign.src = `matches/signs/${item}.png`;
    sign.className = "sign-icon";

    const counterImg = document.createElement("img");
    counterImg.src = `numbers/0.png`; 
    counterImg.alt = `0`;
    counterImg.className = "count-img";
    counterImg.id = `count-img-${item}`;

    section.appendChild(sign);
    section.appendChild(counterImg);
    sidebar.appendChild(section);
  });
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

  // Style image position & size
  img.style.position = "absolute";
  img.style.width = "20px";
  img.style.height = "auto";

  // Random placement inside container
  const container = document.getElementById("background");
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  const maxX = containerWidth - 20;
  const maxY = containerHeight - 20;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  img.style.left = `${x}px`;
  img.style.top = `${y}px`;

  img.addEventListener("click", () => {
    if (img.classList.contains("found")) return;

    if (img.dataset.correct === "true") {
      foundItems[item]++;
      const total = remainingItems[item];

      const counterImg = document.getElementById(`count-img-${item}`);
      if (counterImg) {
        counterImg.src = `numbers/${foundItems[item]}.png`;
        counterImg.alt = `${foundItems[item]}`;
      }

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
// Check if Level Complete
// -------------------------
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

// -------------------------
// Update Background Image
// -------------------------
function updateBackground() {
  const background = document.getElementById("background");
  const bgIndex = Math.min(currentLevel, 10);
  background.style.backgroundImage = `url('scene/level${bgIndex}.png')`;
}

// -------------------------
// Show Finish Button
// -------------------------
function showFinishButton() {
  const btn = document.getElementById("finish-btn");
  btn.style.display = "block";
}

// -------------------------
// Send Results to Google Form
// -------------------------
function sendResultToGoogleForm(result) {
  const formUrl = "https://docs.google.com/forms/d/e/FORM_ID/formResponse"; // Replace FORM_ID
  const formData = new FormData();

  // Replace entry IDs with real ones
  formData.append("entry.123456", result.name);
  formData.append("entry.234567", result.class);
  formData.append("entry.345678", result.level);
  formData.append("entry.456789", result.time);
  formData.append("entry.567890", result.percent);

  return fetch(formUrl, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------------
// Submit Results
// -------------------------
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
