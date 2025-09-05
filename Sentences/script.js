// ===== Student Info =====
window.addEventListener("DOMContentLoaded", () => {
  const studentName = localStorage.getItem("studentName") || "Guest";
  const studentClass = localStorage.getItem("studentClass") || "Class";

  document.getElementById("studentName").textContent = studentName;
  document.getElementById("studentClass").textContent = studentClass;

  document.getElementById("formName").value = studentName;
  document.getElementById("formClass").value = studentClass;

  startLevel(1);
});

// ===== Word Banks =====
const animals = ["lion", "dog", "cat"];
const foods = ["apple", "banana", "pineapple"];
const colours = ["red", "blue", "pink"];
const numbers = [1, 2, 3, 4];

let currentSentence = {};
let level = 1;
let correctCount = 0;
let incorrectCount = 0;

// ===== Generate a Sentence =====
function generateSentence() {
  const num = numbers[Math.floor(Math.random() * numbers.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const colour = colours[Math.floor(Math.random() * colours.length)];
  const food = foods[Math.floor(Math.random() * foods.length)];

  currentSentence = { num, animal, colour, food };

  const promptDiv = document.getElementById("sentencePrompt");
  promptDiv.innerHTML = "";

  const parts = [`${num}`, animal, "want", colour, food];
  parts.forEach(part => {
    const span = document.createElement("div");
    span.dataset.answer = part;
    span.textContent = "?";
    span.classList.add("dropzone");
    promptDiv.appendChild(span);
  });

  buildDraggables(parts);
}

// ===== Build Draggables (with decoys) =====
function buildDraggables(correctParts) {
  const optionDiv = document.getElementById("draggableOptions");
  optionDiv.innerHTML = "";

  // Mix in some decoys
  const decoys = ["2", "fish", "yellow", "pear", "run"];
  const allOptions = [...new Set([...correctParts, ...decoys])];

  allOptions.forEach(opt => {
    const div = document.createElement("div");
    div.textContent = opt;
    div.classList.add("draggable");
    div.draggable = true;

    div.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", opt);
    });

    optionDiv.appendChild(div);
  });

  setupDropzones();
}

// ===== Dropzone Logic =====
function setupDropzones() {
  const zones = document.querySelectorAll(".dropzone");

  zones.forEach(zone => {
    zone.addEventListener("dragover", e => e.preventDefault());
    zone.addEventListener("drop", e => {
      e.preventDefault();
      const data = e.dataTransfer.getData("text/plain");
      zone.textContent = data;
    });
  });
}

// ===== Check Answers =====
function checkAnswers() {
  let roundCorrect = 0;
  let roundIncorrect = 0;

  const zones = document.querySelectorAll(".dropzone");
  zones.forEach(zone => {
    if (zone.textContent === zone.dataset.answer) {
      zone.style.background = "#c8e6c9"; // green
      roundCorrect++;
    } else {
      zone.style.background = "#ffcdd2"; // red
      zone.classList.add("shake");
      setTimeout(() => {
        zone.classList.remove("shake");
        zone.textContent = "?"; // reset
        zone.style.background = "";
      }, 600);
      roundIncorrect++;
    }
  });

  correctCount += roundCorrect;
  incorrectCount += roundIncorrect;
}

// ===== Level Control =====
function startLevel(lvl) {
  level = lvl;
  correctCount = 0;
  incorrectCount = 0;
  generateSentence();
}

// ===== Stop Button (submit to Google Form) =====
document.getElementById("stopBtn").addEventListener("click", () => {
  // Map counts into Google Form fields
  document.getElementById("formResults").value = `Level ${level}`;
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

  document.getElementById("googleForm").submit();
  alert("Results submitted! Redirecting...");
  window.location.href = "../hub.html";
});
