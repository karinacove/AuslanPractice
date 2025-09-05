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
const animals = ["bird", "cat", "chicken", "cockatoo", "cow", "crocodile", "dog", "duck", "echidna", "emu", "fish", "goat", "horse", "koala", "lizard", "mouse", "pig", "platypus", "possum", "rabbit", "sheep", "wombat"];
const foods = ["apple", "bacon", "banana", "bean", "blueberry", "bread", "burger", "cake", "carrot", "cereal", "cheese", "cherry", "chips", "corn", "cucumber", "egg", "grape", "lettuce", "meat", "mushroom", "onion", "orange", "pasta", "pear", "peas", "pineapple", "pizza", "potato", "pumpkin", "raspberry", "strawberry", "tomato", "watermelon"];
const colours = ["red", "blue", "pink", "orange", "green", "black", "brown", "white", "purple", "yellow"];
const numbers = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const verbs = ["want", "dontwant", "have", "donthave", "eat"];

let currentSentence = {};
let level = 1;
let correctCount = 0;
let incorrectCount = 0;

// ===== Generate a Sentence =====
function generateSentence() {
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = numbers[Math.floor(Math.random() * numbers.length)];
  const food = foods[Math.floor(Math.random() * foods.length)];
  const colour = colours[Math.floor(Math.random() * colours.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];

  currentSentence = { animal, num, verb, food, colour };

  const promptDiv = document.getElementById("sentencePrompt");
  promptDiv.innerHTML = "";

  // New order: animal, number, verb, food, colour
  const parts = [animal, num, verb, food, colour];

  parts.forEach(part => {
    const span = document.createElement("div");
    span.dataset.answer = part;
    span.classList.add("dropzone");
    span.innerHTML = ""; // empty initially
    promptDiv.appendChild(span);
  });

  buildDraggables(parts);
}

// ===== Build Draggables (with decoys) =====
function buildDraggables(correctParts) {
  const optionDiv = document.getElementById("draggableOptions");
  optionDiv.innerHTML = "";

  let decoyPool = [];

  // Determine decoy categories based on current sentence
  correctParts.forEach(part => {
    if (numbers.includes(part)) decoyPool.push(...numbers);
    else if (animals.includes(part)) decoyPool.push(...animals);
    else if (foods.includes(part)) decoyPool.push(...foods);
    else if (colours.includes(part)) decoyPool.push(...colours);
    else if (part === "want") decoyPool.push("want"); // verbs
  });

  // Remove correctParts from decoys to avoid duplicates
  decoyPool = decoyPool.filter(item => !correctParts.includes(item));

  // Shuffle decoys
  decoyPool.sort(() => Math.random() - 0.5);

  // Calculate how many decoys we need to reach 16 draggables
  let numDecoysNeeded = 16 - correctParts.length;
  const selectedDecoys = decoyPool.slice(0, numDecoysNeeded);

  const allOptions = [...correctParts, ...selectedDecoys];
  allOptions.sort(() => Math.random() - 0.5); // shuffle all options

  allOptions.forEach(opt => {
    const div = document.createElement("div");
    div.classList.add("draggable");
    div.draggable = true;

    // Determine image source
    let src = "";
    if (numbers.includes(opt)) src = `assets/signs/numbers/${opt}-sign.png`;
    else if (animals.includes(opt)) src = `assets/signs/animals/${opt}-sign.png`;
    else if (foods.includes(opt)) src = `assets/signs/food/${opt}-sign.png`;
    else if (colours.includes(opt)) src = `assets/signs/colours/${opt}-sign.png`;
    else if (verbs.include(opt)) src = `assets/signs/verbs/${opt}-sign.png`;

    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = opt;
      img.dataset.value = opt;
      img.style.maxWidth = "70px";
      img.style.maxHeight = "70px";
      div.appendChild(img);
    } else {
      div.textContent = opt;
    }

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
      zone.innerHTML = ""; // clear previous
      zone.dataset.filled = data;

      // clone draggable image
      const img = document.querySelector(`[data-value='${data}']`)?.cloneNode(true);
      if (img) zone.appendChild(img);
      else zone.textContent = data;
    });
  });
}

// ===== Check Answers =====
function checkAnswers() {
  let roundCorrect = 0;
  let roundIncorrect = 0;

  const zones = document.querySelectorAll(".dropzone");
  zones.forEach(zone => {
    if (zone.dataset.filled === zone.dataset.answer) {
      zone.style.background = "#c8e6c9"; // green
      roundCorrect++;
    } else {
      zone.style.background = "#ffcdd2"; // red
      zone.classList.add("shake");
      setTimeout(() => {
        zone.classList.remove("shake");
        zone.innerHTML = "";
        zone.style.background = "";
        delete zone.dataset.filled;
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

// ===== Submit Button =====
document.getElementById("submitBtn").addEventListener("click", () => {
  checkAnswers();
});

// ===== Stop Button (submit to Google Form) =====
document.getElementById("stopBtn").addEventListener("click", () => {
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
