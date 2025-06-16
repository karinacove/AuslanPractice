// --- Student Info & Session Control ---
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

const logoutBtn = document.getElementById("logoutBtn");
const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.querySelector(".container");

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentInfoDiv.textContent = `Logged in as: ${studentName} (${studentClass})`;
  gameContainer.style.display = "block";
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  window.location.href = "../index.html";
});

// --- Game State Variables ---
let level = 1;
const topic = localStorage.getItem("selectedTopic") || "alphabet";
let correctCount = 0;
let incorrectCount = 0;
let matched = 0;

// --- Event Listeners ---
document.getElementById("nextLevel").addEventListener("click", () => {
  level++;
  if (level <= 3) {
    loadLevel(level);
  } else {
    submitResults();
  }
});

document.getElementById("finishButton").addEventListener("click", () => {
  submitResults();
});

// --- Helper Functions ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Load Level Logic ---
function loadLevel(currentLevel) {
  const board = document.getElementById("gameBoard");
  const tray = document.getElementById("draggables");
  board.innerHTML = "";
  tray.innerHTML = "";
  matched = 0;

  const levelTitle = document.getElementById("levelTitle");
  levelTitle.textContent =
    currentLevel === 1 ? "Level 1: Match the Sign to the Picture"
    : currentLevel === 2 ? "Level 2: Match the Picture to the Sign"
    : "Level 3: Mixed Matching";

  document.getElementById("nextLevel").style.display = "none";

  if (topic === "alphabet") {
    const letters = shuffle("abcdefghijklmnopqrstuvwxyz".split(""));
    const selected = letters.slice(0, 9);
    const distractors = letters.slice(9, 12);
    const allSigns = shuffle([...selected, ...distractors]);

    // Create grid slots
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

    // Create draggable signs
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

    // Add drop logic
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
          const label = document.createElement("div");
          label.className = "label";
          label.textContent = dragged.toUpperCase();
          slot.appendChild(label);

          matched++;
          correctCount++;

          const draggedImg = document.querySelector(`img[alt='${dragged}']`);
          if (draggedImg) draggedImg.remove();

          if (matched === 9) {
            document.getElementById("nextLevel").style.display = "inline-block";
          }
        } else {
          incorrectCount++;
        }
      });
    });
  }
}

// --- Google Form Submission ---
function submitResults() {
  const total = correctCount + incorrectCount;
  const percent = total === 0 ? "0%" : `${Math.round((correctCount / total) * 100)}%`;

  const form = document.createElement("form");
  form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
  form.method = "POST";
  form.target = "_self";

  const fields = [
    { name: "entry.1387461004", value: studentName },
    { name: "entry.1309291707", value: studentClass },
    { name: "entry.477642881", value: topic.charAt(0).toUpperCase() + topic.slice(1) },
    { name: "entry.1897227570", value: correctCount },
    { name: "entry.1249394203", value: incorrectCount },
    { name: "entry.1996137354", value: percent }
  ];

  fields.forEach(({ name, value }) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

// --- Start the Game ---
loadLevel(level);
