document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const topic = "colours";
  const allItems = ["red", "green", "blue", "black", "brown", "purple", "pink", "orange", "white", "yellow"];

  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");

  if (finishBtn) finishBtn.addEventListener("click", () => {
    gameEnded = true;
    endGame();
  });

  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    loadPage();
  });

  againBtn.addEventListener("click", () => location.reload());
  menuBtn.addEventListener("click", () => (window.location.href = "../index.html"));
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 6, wideMode: true },
    { type: "imageToSign", decoys: 6, wideMode: true },
    { type: "mixed", decoys: 6, wideMode: true }
  ];

  const levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  const pagesPerLevel = 2;

  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "200px",
    display: "none",
    zIndex: "1000"
  });
  document.body.appendChild(feedbackImage);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

 function loadPage() {
    const { type, decoys, wideMode } = levels[currentLevel];
    document.body.classList.toggle("wide-mode", !!wideMode);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}`;

    if (currentPage === 0) {
      const baseItems = shuffle([...allItems]);
      currentLetters = [];
      for (let page = 0; page < pagesPerLevel; page++) {
        const items = baseItems.slice(page * 5, (page + 1) * 5);
        currentLetters.push(items);
      }
    }

    const lettersThisPage = currentLetters[currentPage];
    const usedSet = new Set(lettersThisPage);

    // Determine slot and draggable image folders based on type
    let slotFolder, draggableFolder;

    if (type === "signToImage") {
      slotFolder = "clipart";
      draggableFolder = "signs";
    } else if (type === "imageToSign") {
      slotFolder = "signs";
      draggableFolder = "clipart";
    } else if (type === "mixed") {
      // For mixed, slots are clipart, draggables are signs (answers)
      slotFolder = "clipart";
      draggableFolder = "signs";
    }

    // Render slots
    lettersThisPage.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;
      slot.style.backgroundImage = `url('assets/${topic}/${slotFolder}/${letter}.png')`;
      gameBoard.appendChild(slot);
    });

    // Create draggable items (correct answers + decoys)
    const decoyLetters = shuffle(allItems.filter(l => !usedSet.has(l))).slice(0, decoys);
    const draggables = shuffle([...lettersThisPage, ...decoyLetters]);

    draggables.forEach((letter, index) => {
      const img = document.createElement("img");
      img.src = `assets/${topic}/${draggableFolder}/${letter}.png`;
      img.className = "draggable";
      img.dataset.letter = letter;
      img.draggable = true;

      // Drag start for mouse
      img.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", letter);
        e.dataTransfer.setData("src", img.src);
      });

      // Touch fallback for drag on touch devices
      img.addEventListener("touchstart", touchStart, { passive: false });

      // Append to left or right side
      (index % 2 === 0 ? leftSigns : rightSigns).appendChild(img);
    });

    correctMatches = 0;

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
  }

  // Touch handlers for drag on touch devices
  let draggedElement = null;

  function touchStart(e) {
    e.preventDefault();
    draggedElement = e.target;
  }

  document.addEventListener("touchmove", (e) => {
    if (!draggedElement) return;
    e.preventDefault();
    // Optional: You could add dragging visual feedback here
  }, { passive: false });

  document.addEventListener("touchend", (e) => {
    if (!draggedElement) return;
    e.preventDefault();
    // Find element under touch
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    if (dropTarget && dropTarget.classList.contains("slot")) {
      // Manually call drop handler
      const fakeEvent = {
        preventDefault: () => {},
        currentTarget: dropTarget,
        dataTransfer: {
          getData: () => draggedElement.dataset.letter,
          src: draggedElement.src
        }
      };
      drop(fakeEvent);
    }
    draggedElement = null;
  }, { passive: false });

  function drop(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetLetter = target.dataset.letter;

    if (letter === targetLetter) {
      if (!levelAttempts[currentLevel].correct.has(letter)) {
        levelAttempts[currentLevel].correct.add(letter);
      }
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter="${letter}"]`).forEach(el => el.remove());
      correctMatches++;
      showFeedback(true);

      if (correctMatches >= currentLetters[currentPage].length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < pagesPerLevel) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= levels.length) {
            setTimeout(endGame, 800);
          } else {
            setTimeout(loadPage, 800);
          }
        }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedback(false);
    }
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      endGame();
      modal.style.display = "flex"; // Show modal explicitly on finish
    });
  }

  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSfFakeFormURL1234567890/formResponse";
    form.target = "_self";
    form.style.display = "none";

const entries = {
  name: "entry.1387461004",
  class: "entry.1309291707",
  topic: "entry.477642881",
  correct: "entry.1249394203",
  incorrect: "entry.1897227570",
  time: "entry.284718659"
};


    const totalCorrect = levelAttempts.reduce((sum, level) => sum + level.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, level) => sum + level.incorrect.length, 0);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    const data = {
      [entries.name]: studentName,
      [entries.class]: studentClass,
      [entries.topic]: topic,
      [entries.correct]: totalCorrect,
      [entries.incorrect]: totalIncorrect,
      [entries.time]: timeTaken
    };

    for (const [name, value] of Object.entries(data)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    document.getElementById("end-modal").style.display = "flex";
  }

  loadPage();
});
