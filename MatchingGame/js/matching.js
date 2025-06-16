// --- Student Info & Session Control ---
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const logoutBtn = document.getElementById("logoutBtn");
const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.querySelector(".container");

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html"; // Adjust as needed
} else {
  studentInfoDiv.textContent = `Logged in as: ${studentName} (${studentClass})`;
  gameContainer.style.display = "block";
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  window.location.href = "../index.html";
});

const finishButton = document.getElementById("finishButton");
finishButton.addEventListener("click", () => {
  submitResults();
});

// --- Game Logic ---
let level = 1;
let topic = localStorage.getItem("selectedTopic") || "alphabet";
let correctCount = 0;
let incorrectCount = 0;
let matched = 0;

const nextLevelBtn = document.getElementById("nextLevel");
nextLevelBtn.addEventListener("click", () => {
  level++;
  if (level <= 3) {
    loadLevel(level);
  } else {
    submitResults();
  }
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadLevel(currentLevel) {
  const board = document.getElementById("gameBoard");
  const tray = document.getElementById("draggables");
  board.innerHTML = "";
  tray.innerHTML = "";
  matched = 0;

  document.getElementById("levelTitle").textContent =
    currentLevel === 1 ? "Level 1: Match the Sign to the Picture"
    : currentLevel === 2 ? "Level 2: Match the Picture to the Sign"
    : "Level 3: Mixed Matching";

  nextLevelBtn.style.display = "none";

  if (topic === "alphabet") {
    const letters = shuffle("abcdefghijklmnopqrstuvwxyz".split(""));
    const selected = letters.slice(0, 9);  // 9 pairs
    const distractors = letters.slice(9, 12); // 3 distractors

    if (currentLevel === 1) {
      // Level 1: Grid = pictures, Tray = signs
      const allSigns = shuffle([...selected, ...distractors]);

      selected.forEach(letter => {
        const gridItem = document.createElement("div");
        gridItem.className = "grid-item";
        gridItem.dataset.letter = letter;

        const img = document.createElement("img");
        img.src = `assets/alphabet/clipart/${letter}.png`;
        img.alt = letter;
        gridItem.appendChild(img);

        board.appendChild(gridItem);
      });

      allSigns.forEach(sign => {
        const signImg = document.createElement("img");
        signImg.className = "draggable";
        signImg.src = `assets/alphabet/signs/sign-${sign}.png`;
        signImg.alt = sign;
        signImg.draggable = true;

        signImg.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", sign);
        });

        tray.appendChild(signImg);
      });

      setupDropTargets();

    } else if (currentLevel === 2) {
      // Level 2: Grid = signs, Tray = pictures
      const allPictures = shuffle([...selected, ...distractors]);

      selected.forEach(letter => {
        const gridItem = document.createElement("div");
        gridItem.className = "grid-item";
        gridItem.dataset.letter = letter;

        const img = document.createElement("img");
        img.src = `assets/alphabet/signs/sign-${letter}.png`;
        img.alt = letter;
        gridItem.appendChild(img);

        board.appendChild(gridItem);
      });

      allPictures.forEach(letter => {
        const picImg = document.createElement("img");
        picImg.className = "draggable";
        picImg.src = `assets/alphabet/clipart/${letter}.png`;
        picImg.alt = letter;
        picImg.draggable = true;

        picImg.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", letter);
        });

        tray.appendChild(picImg);
      });

      setupDropTargets();

    } else if (currentLevel === 3) {
      // Level 3: Mixed matching

      // split selected letters into two groups for grid and tray
      const mixedGridSigns = selected.slice(0, 5);
      const mixedGridPics = selected.slice(5, 9);

      // tray has the opposite type + distractors
      const mixedTrayPics = mixedGridSigns;
      const mixedTraySigns = mixedGridPics;
      const mixedDistractors = distractors;

      // Create grid items (mixed signs and pictures)
      mixedGridSigns.forEach(letter => {
        const gridItem = document.createElement("div");
        gridItem.className = "grid-item";
        gridItem.dataset.letter = letter;

        const img = document.createElement("img");
        img.src = `assets/alphabet/signs/sign-${letter}.png`;
        img.alt = letter;
        gridItem.appendChild(img);

        board.appendChild(gridItem);
      });

      mixedGridPics.forEach(letter => {
        const gridItem = document.createElement("div");
        gridItem.className = "grid-item";
        gridItem.dataset.letter = letter;

        const img = document.createElement("img");
        img.src = `assets/alphabet/clipart/${letter}.png`;
        img.alt = letter;
        gridItem.appendChild(img);

        board.appendChild(gridItem);
      });

      // Prepare tray letters and shuffle
      const trayLetters = shuffle([...mixedTrayPics, ...mixedTraySigns, ...mixedDistractors]);

      trayLetters.forEach(letter => {
        const isSign = mixedTraySigns.includes(letter) || mixedDistractors.includes(letter);
        const img = document.createElement("img");
        img.className = "draggable";
        if (isSign) {
          img.src = `assets/alphabet/signs/sign-${letter}.png`;
        } else {
          img.src = `assets/alphabet/clipart/${letter}.png`;
        }
        img.alt = letter;
        img.draggable = true;

        img.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", letter);
        });

        tray.appendChild(img);
      });

      setupDropTargets();
    }
  }
}

// Helper to add drag/drop event listeners to grid items
function setupDropTargets() {
  document.querySelectorAll(".grid-item").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("dragenter", () => slot.classList.add("drag-over"));
    slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));

    slot.addEventListener("drop", e => {
      e.preventDefault();
      slot.classList.remove("drag-over");

      const dragged = e.dataTransfer.getData("text/plain");
      const correct = slot.dataset.letter;

      if (dragged === correct) {
        if (!slot.classList.contains("matched")) {
          slot.classList.add("matched");

          let label = slot.querySelector(".label");
          if (!label) {
            label = document.createElement("div");
            label.className = "label";
            label.textContent = dragged.toUpperCase();
            slot.appendChild(label);
          }

          matched++;
          correctCount++;

          // Remove dragged item from tray
          const draggedImg = document.querySelector(`.draggable[alt='${dragged}']`);
          if (draggedImg) draggedImg.remove();

          if (matched === 9) {
            nextLevelBtn.style.display = "inline-block";
          }
        }
      } else {
        incorrectCount++;
      }
    });
  });
}

function submitResults() {
  const form = document.createElement("form");
  form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
  form.method = "POST";
  form.target = "_self";

  const nameField = document.createElement("input");
  nameField.name = "entry.1387461004";
  nameField.value = studentName;
  nameField.type = "hidden";

  const classField = document.createElement("input");
  classField.name = "entry.1309291707";
  classField.value = studentClass;
  classField.type = "hidden";

  const topicField = document.createElement("input");
  topicField.name = "entry.477642881";
  topicField.value = topic.charAt(0).toUpperCase() + topic.slice(1);
  topicField.type = "hidden";

  const correctField = document.createElement("input");
  correctField.name = "entry.1897227570";
  correctField.value = correctCount;
  correctField.type = "hidden";

  const incorrectField = document.createElement("input");
  incorrectField.name = "entry.1249394203";
  incorrectField.value = incorrectCount;
  incorrectField.type = "hidden";

  const percentField = document.createElement("input");
  percentField.name = "entry.1996137354";
  percentField.value = `${Math.round((correctCount / (correctCount + incorrectCount || 1)) * 100)}%`;
  percentField.type = "hidden";

  [nameField, classField, topicField, correctField, incorrectField, percentField].forEach(field => form.appendChild(field));
  document.body.appendChild(form);
  form.submit();
}

loadLevel(level);
