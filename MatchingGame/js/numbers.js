// ✅ NUMBERS MATCHING GAME JS

// == DOMContentLoaded ==
document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");

  if (finishBtn) finishBtn.addEventListener("click", () => {
    gameEnded = false;
    endGame();
  });

  continueBtn.addEventListener("click", () => {
    endModal.style.display = "none";
    gameEnded = false;
    startGame();
  });

  againBtn.addEventListener("click", () => location.reload());
  menuBtn.addEventListener("click", () => window.location.href = "../index.html");
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  const allNumbers = Array.from({ length: 101 }, (_, i) => i);

  const levels = [
    ...Array.from({ length: 3 }, (_, i) => ({
      type: i % 3 === 0 ? "signToImage" : i % 3 === 1 ? "imageToSign" : "mixed",
      pages: 2,
      numbers: Array.from({ length: 13 }, (_, n) => n),
      totalNeeded: 18,
      allowRepeats: true,
      repeatCount: 5,
      decoys: 3
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      type: i % 3 === 0 ? "signToImage" : i % 3 === 1 ? "imageToSign" : "mixed",
      pages: 1,
      numbers: Array.from({ length: 9 }, (_, n) => n + 12),
      totalNeeded: 9,
      allowRepeats: false,
      decoys: 9,
      wideMode: true
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      type: i % 3 === 0 ? "signToImage" : i % 3 === 1 ? "imageToSign" : "mixed",
      pages: 3,
      numbers: Array.from({ length: 28 }, (_, n) => n + 21),
      totalNeeded: 27,
      allowRepeats: false,
      decoys: 3
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      type: i % 3 === 0 ? "signToImage" : i % 3 === 1 ? "imageToSign" : "mixed",
      pages: 3,
      numbers: Array.from({ length: 28 }, (_, n) => n + 49),
      totalNeeded: 27,
      allowRepeats: false,
      decoys: 3
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      type: i % 3 === 0 ? "signToImage" : i % 3 === 1 ? "imageToSign" : "mixed",
      pages: 3,
      numbers: Array.from({ length: 24 }, (_, n) => n + 77),
      totalNeeded: 27,
      allowRepeats: true,
      repeatCount: 4,
      decoys: 3
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      type: i % 3 === 0 ? "signToImage" : i % 3 === 1 ? "imageToSign" : "mixed",
      pages: 3,
      numbers: shuffle([...allNumbers]),
      totalNeeded: 27,
      allowRepeats: false,
      decoys: 3
    })),
    {
      type: "mixed",
      pages: 1,
      numbers: [],
      isReviewLevel: true,
      decoys: 3
    }
  ];

  const levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

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

  let currentLevel = 0;
  let currentPage = 0;
  let currentNumbers = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  function drop(e) {
    e.preventDefault();
    const number = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetNumber = target.dataset.letter;

    if (number === targetNumber) {
      if (!levelAttempts[currentLevel].correct.has(number)) {
        levelAttempts[currentLevel].correct.add(number);
      }
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter='${number}']`).forEach(el => el.remove());
      correctMatches++;
      showFeedback(true);

      if (correctMatches >= currentNumbers[currentPage].length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < levels[currentLevel].pages) {
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
      levelAttempts[currentLevel].incorrect.push(number);
      showFeedback(false);
      const wrong = document.querySelector(`img.draggable[data-letter='${number}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 500);
      }
    }
  }

  function loadPage() {
   // Define per-level number ranges
const levelNumberMap = [
  { range: [0, 12], pages: 2, repeat: true },     // Levels 1–3
  { range: [13, 20], pages: 1, repeat: false },   // Levels 4–6
  { range: [21, 48], pages: 3, repeat: false },   // Levels 7–9
  { range: [49, 76], pages: 3, repeat: false },   // Levels 10–12
  { range: [77, 100], pages: 3, repeat: true },   // Levels 13–16
  { range: [0, 100], pages: 3, repeat: false },   // Levels 17–19
  { range: [], pages: 1, review: true }           // Level 20
];

// Rebuild currentLetters if first page of level
if (currentPage === 0) {
  const levelInfo = levelNumberMap[currentLevel];

  currentLetters = [];

  if (levelInfo.review) {
    // Level 20: Use most frequent incorrects
    let incorrectFreq = {};
    for (let i = 0; i < levelAttempts.length - 1; i++) {
      for (let val of levelAttempts[i].incorrect) {
        incorrectFreq[val] = (incorrectFreq[val] || 0) + 1;
      }
    }

    const sorted = Object.entries(incorrectFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => parseInt(num))
      .slice(0, 9); // Use top 9 incorrects

    currentLetters.push(sorted);
  } else {
    const [start, end] = levelInfo.range;
    let pool = Array.from({ length: end - start + 1 }, (_, i) => i + start);
    shuffle(pool);

    let totalNeeded = levelInfo.pages * 9;
    let result = [];

    if (levelInfo.repeat) {
      while (result.length < totalNeeded) {
        result.push(...shuffle(pool).slice(0, Math.min(9, totalNeeded - result.length)));
      }
    } else {
      result = pool.slice(0, totalNeeded);
    }

    for (let i = 0; i < levelInfo.pages; i++) {
      currentLetters.push(result.slice(i * 9, (i + 1) * 9));
    }
  }
}


    const pageNumbers = currentNumbers[currentPage];
    const slotTypes = {};

    pageNumbers.forEach(number => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = number;

      let isSign = mode === "signToImage" ? false : mode === "imageToSign" ? true : Math.random() < 0.5;
      slot.style.backgroundImage = `url('assets/numbers/${isSign ? `signs/sign-${number}.png` : `clipart/${number}.png`}')`;
      slotTypes[number] = isSign;
      gameBoard.appendChild(slot);
    });

    const allDecoys = allNumbers.filter(n => !pageNumbers.includes(n));
    const decoyNumbers = shuffle(allDecoys).slice(0, decoys);
    const draggableNumbers = shuffle([...pageNumbers, ...decoyNumbers]);

    draggableNumbers.forEach((number, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = number;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", number);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      let oppositeType = mode === "mixed" ?
        (pageNumbers.includes(number) ? !slotTypes[number] : Math.random() < 0.5) :
        mode === "signToImage" ? true : false;

      img.src = `assets/numbers/${oppositeType ? `signs/sign-${number}.png` : `clipart/${number}.png`}`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      (i < draggableNumbers.length / 2 ? leftSigns : rightSigns).appendChild(wrap);
    });

    correctMatches = 0;

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
  }

  function touchStart(e) {
    e.preventDefault();
    const target = e.target;
    const number = target.dataset.letter;
    const src = target.src;

    const clone = target.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.7";
    clone.style.zIndex = "10000";
    document.body.appendChild(clone);

    const moveClone = (touch) => {
      clone.style.left = `${touch.clientX - clone.width / 2}px`;
      clone.style.top = `${touch.clientY - clone.height / 2}px`;
    };

    moveClone(e.touches[0]);

    const handleTouchMove = (ev) => moveClone(ev.touches[0]);
    const handleTouchEnd = (ev) => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.classList.contains("slot")) drop({
        preventDefault: () => { },
        dataTransfer: {
          getData: (k) => k === "text/plain" ? number : src
        },
        currentTarget: el
      });
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  loadPage();
});
