// Get student info
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  window.location.href = "../index.html";
}

document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../index.html";
});

const finishButton = document.getElementById("finishButton");
finishButton.addEventListener("click", () => {
  endGame();
});

const levels = [
  { type: "signToImage" },
  { type: "imageToSign" },
  { type: "mixed" },
];
let currentLevel = 0;
let currentPage = 0;

const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
let usedLetters = [];
let correctMatches = 0;
let incorrectMatches = 0;
let totalCorrect = 0;
let totalIncorrect = 0;
let startTime = Date.now();

const gameBoard = document.getElementById("gameBoard");
const leftSigns = document.getElementById("leftSigns");
const rightSigns = document.getElementById("rightSigns");
const nextLevelBtn = document.getElementById("nextLevel");
const levelTitle = document.getElementById("levelTitle");

const feedbackImage = document.createElement("img");
feedbackImage.id = "feedbackImage";
feedbackImage.style.position = "fixed";
feedbackImage.style.top = "50%";
feedbackImage.style.left = "50%";
feedbackImage.style.transform = "translate(-50%, -50%)";
feedbackImage.style.width = "200px";
feedbackImage.style.display = "none";
document.body.appendChild(feedbackImage);

nextLevelBtn.addEventListener("click", () => {
  currentLevel++;
  currentPage = 0;
  usedLetters = [];
  if (currentLevel < levels.length) {
    loadPage();
  } else {
    endGame();
  }
});

function getRandomLetters(count) {
  let available = allLetters.filter((l) => !usedLetters.includes(l));
  let selected = [];
  while (selected.length < count && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    selected.push(available.splice(index, 1)[0]);
  }
  usedLetters.push(...selected);
  return selected;
}

function loadPage() {
  const mode = levels[currentLevel].type;
  const currentLetters = getRandomLetters(Math.min(9, allLetters.length - usedLetters.length));
  gameBoard.innerHTML = "";
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  levelTitle.innerText = `Level ${currentLevel + 1}: ` +
    (mode === "signToImage" ? "Match the Sign to the Picture" :
     mode === "imageToSign" ? "Match the Picture to the Sign" :
     "Match Signs and Pictures (Mixed)");

  currentLetters.forEach((letter) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.letter = letter;
    slot.style.backgroundImage = mode === "signToImage" || (mode === "mixed" && Math.random() < 0.5)
      ? `url('assets/alphabet/clipart/${letter}.png')`
      : `url('assets/alphabet/signs/sign-${letter}.png')`;
    gameBoard.appendChild(slot);
  });

  let options = [...currentLetters];
  options.sort(() => Math.random() - 0.5);
  options.forEach((letter, i) => {
    const draggable = document.createElement("img");
    draggable.src = (mode === "signToImage" || (mode === "mixed" && Math.random() < 0.5))
      ? `assets/alphabet/signs/sign-${letter}.png`
      : `assets/alphabet/clipart/${letter}.png`;
    draggable.className = "draggable";
    draggable.draggable = true;
    draggable.dataset.letter = letter;
    draggable.addEventListener("dragstart", dragStart);
    draggable.addEventListener("touchstart", touchStart);
    const container = document.createElement("div");
    container.className = "drag-wrapper";
    container.appendChild(draggable);
    (i % 2 === 0 ? leftSigns : rightSigns).appendChild(container);
  });

  document.querySelectorAll(".slot").forEach((slot) => {
    slot.addEventListener("dragover", dragOver);
    slot.addEventListener("drop", drop);
  });
}

function dragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.dataset.letter);
  e.dataTransfer.setData("src", e.target.src);
  e.target.classList.add("dragging");
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const draggedLetter = e.dataTransfer.getData("text/plain");
  const draggedSrc = e.dataTransfer.getData("src");
  const targetSlot = e.currentTarget;

  handleDrop(targetSlot, draggedLetter, draggedSrc);
}

function handleDrop(targetSlot, draggedLetter, draggedSrc) {
  if (targetSlot.dataset.letter === draggedLetter) {
    correctMatches++;
    totalCorrect++;
    showFeedback(true);
    targetSlot.innerHTML = "";
    const overlay = document.createElement("img");
    overlay.src = draggedSrc;
    overlay.className = "overlay";
    targetSlot.appendChild(overlay);

    document.querySelectorAll(`[data-letter='${draggedLetter}']`).forEach((el) => {
      if (el.classList.contains("draggable")) el.remove();
    });

    if (correctMatches >= 9) {
      currentPage++;
      correctMatches = 0;
      if (usedLetters.length < allLetters.length) {
        setTimeout(loadPage, 1000);
      } else {
        nextLevelBtn.style.display = "block";
      }
    }
  } else {
    incorrectMatches++;
    totalIncorrect++;
    showFeedback(false);
    const dragged = document.querySelector(`img[data-letter='${draggedLetter}']`);
    dragged.classList.add("shake");
    setTimeout(() => dragged.classList.remove("shake"), 500);
  }
}

function showFeedback(correct) {
  feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
  feedbackImage.style.display = "block";
  setTimeout(() => {
    feedbackImage.style.display = "none";
  }, 2000);
}

function touchStart(e) {
  const touch = e.touches[0];
  const target = e.target;
  const letter = target.dataset.letter;
  const src = target.src;

  const touchMove = (ev) => {
    const touchLocation = ev.touches[0];
    const element = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
    if (element && element.classList.contains("slot")) {
      handleDrop(element, letter, src);
      document.removeEventListener("touchmove", touchMove);
    }
  };
  document.addEventListener("touchmove", touchMove);
}

function endGame() {
  const endTime = Date.now();
  const timeTaken = Math.round((endTime - startTime) / 1000);

  const form = document.createElement("form");
  form.action = "https://docs.google.com/forms/d/e/1FAIpQLSeLhBoMRLoCK2wyyh2o9Ue0HiOus--yR6XqRvmz9SRbRPyGNg/formResponse";
  form.method = "POST";
  form.target = "_blank";
  form.style.display = "none";

  const entries = {
    "entry.1234567890": studentName,
    "entry.0987654321": studentClass,
    "entry.1111111111": totalCorrect,
    "entry.2222222222": totalIncorrect,
    "entry.3333333333": timeTaken,
  };

  for (const key in entries) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = entries[key];
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    window.location.href = "hub.html";
  }, 1000);
}

loadPage();
