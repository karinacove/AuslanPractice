const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";
if (!studentName || !studentClass) {
  window.location.href = "index.html";
} else {
  document.getElementById("studentInfo").textContent = `Signed in as: ${studentName} (${studentClass})`;
}

let level = 1;
let topic = localStorage.getItem("selectedTopic") || "alphabet"; // default to alphabet
let correctCount = 0;
let incorrectCount = 0;
let matched = 0;

document.getElementById("nextLevel").addEventListener("click", () => {
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
  const tray = document.getElementById("signTray");
  board.innerHTML = "";
  tray.innerHTML = "";
  matched = 0;

  document.getElementById("levelTitle").textContent =
    currentLevel === 1 ? "Level 1: Match the Sign to the Picture"
    : currentLevel === 2 ? "Level 2: Match the Picture to the Sign"
    : "Level 3: Mixed Matching";
  document.getElementById("nextLevel").style.display = "none";

  if (topic === "alphabet") {
    const letters = shuffle("abcdefghijklmnopqrstuvwxyz".split(""));
    const selected = letters.slice(0, 9);
    const distractors = letters.slice(9, 12);
    const allSigns = shuffle([...selected, ...distractors]);

    selected.forEach(letter => {
      const gridItem = document.createElement("div");
      gridItem.className = "grid-item";
      gridItem.dataset.letter = letter;

      const img = document.createElement("img");
      img.src = `assets/alphabet/clipart/${letter}.png`;
      img.alt = letter;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";

      gridItem.appendChild(img);
      board.appendChild(gridItem);
    });

    allSigns.forEach(sign => {
      const signImg = document.createElement("img");
      signImg.className = "sign-img";
      signImg.src = `assets/alphabet/signs/sign-${sign}.png`;
      signImg.alt = sign;
      signImg.draggable = true;

      signImg.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", sign);
      });

      tray.appendChild(signImg);
    });

    document.querySelectorAll(".grid-item").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        e.preventDefault();
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

function submitResults() {
  const form = document.createElement("form");
  form.action = "https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_ID/formResponse";
  form.method = "POST";
  form.target = "_self";

  const nameField = document.createElement("input");
  nameField.name = "entry.YOUR_NAME_ENTRY_ID";
  nameField.value = studentName;

  const classField = document.createElement("input");
  classField.name = "entry.YOUR_CLASS_ENTRY_ID";
  classField.value = studentClass;

  const correctField = document.createElement("input");
  correctField.name = "entry.YOUR_CORRECT_ENTRY_ID";
  correctField.value = correctCount;

  const incorrectField = document.createElement("input");
  incorrectField.name = "entry.YOUR_INCORRECT_ENTRY_ID";
  incorrectField.value = incorrectCount;

  [nameField, classField, correctField, incorrectField].forEach(field => form.appendChild(field));
  document.body.appendChild(form);
  form.submit();
}

loadLevel(level);
