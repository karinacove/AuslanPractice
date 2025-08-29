// ✅ Complete Food Matching Game Script
document.addEventListener("DOMContentLoaded", function () {
  // -----------------------------
  // Student Info & Redirection
  // -----------------------------
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // -----------------------------
  // Buttons & Modal
  // -----------------------------
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");

  if (finishBtn)
    finishBtn.addEventListener("click", () => {
      if (!gameEnded) {
        modal.style.display = "flex";
        endGame();
      }
    });

  continueBtn.addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem("foodGameSave"));
    if (saved && saved.studentName === studentName && saved.studentClass === studentClass) {
      currentLevel = saved.currentLevel;
      currentPage = saved.currentPage;
      saved.levelAttempts.forEach((lvl, i) => {
        levelAttempts[i].correct = new Set(lvl.correct);
        levelAttempts[i].incorrect = lvl.incorrect;
      });
    }

    modal.style.display = "none";
    gameEnded = false;
    loadPage();
  });

  againBtn.addEventListener("click", () => {
    localStorage.removeItem("foodGameSave");
    location.reload();
  });

  menuBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const saved = JSON.parse(localStorage.getItem("foodGameSave"));
      if (saved && saved.studentName === studentName && saved.studentClass === studentClass) {
        gameEnded = true;
        endGame();
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "../index.html";
        }, 1000);
      } else {
        localStorage.clear();
        window.location.href = "../index.html";
      }
    });
  }

  // -----------------------------
  // Game Elements
  // -----------------------------
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // -----------------------------
  // Game State Variables
  // -----------------------------
  let currentLevel = 0;
  let currentPage = 0;
  let currentWords = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  const levelAttempts = Array(4).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // -----------------------------
  // Word Banks
  // -----------------------------
  const wordBanks = {
    1: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    2: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    3: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","pasta"],
    4: [] // all combined below
  };
  wordBanks[4] = [...wordBanks[1], ...wordBanks[2], ...wordBanks[3]];

  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Fruit" },
    { words: wordBanks[2], pages: 3, name: "Vegetables" },
    { words: wordBanks[3], pages: 3, name: "More Food" },
    { words: wordBanks[4], pages: 3, name: "Mixture" }
  ];

  // -----------------------------
  // Feedback Image
  // -----------------------------
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

  // -----------------------------
  // Utility Functions
  // -----------------------------
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => (feedbackImage.style.display = "none"), 1000);
  }

  function updateScore() {
    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;
    document.getElementById("score-display").innerText = `Score: ${percent}%`;
  }

  function saveProgress() {
    const saveData = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      levelAttempts: levelAttempts.map(lvl => ({
        correct: Array.from(lvl.correct),
        incorrect: lvl.incorrect
      })),
      timestamp: Date.now()
    };
    localStorage.setItem("foodGameSave", JSON.stringify(saveData));
  }

  function restoreProgress() {
    const saveData = JSON.parse(localStorage.getItem("foodGameSave"));
    if (!saveData || saveData.studentName !== studentName || saveData.studentClass !== studentClass) return false;

    currentLevel = saveData.currentLevel;
    currentPage = saveData.currentPage;
    saveData.levelAttempts.forEach((lvl, i) => {
      levelAttempts[i].correct = new Set(lvl.correct);
      levelAttempts[i].incorrect = lvl.incorrect;
    });
    return true;
  }

  // -----------------------------
  // Drag & Drop Handlers
  // -----------------------------
  function drop(e) {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetWord = target.dataset.word;

    if (word === targetWord) {
      if (!levelAttempts[currentLevel].correct.has(word)) {
        levelAttempts[currentLevel].correct.add(word);
      }
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el => el.remove());
      correctMatches++;
      showFeedback(true);
      updateScore();

      if (correctMatches >= pageWords.length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < levelDefinitions[currentLevel].pages) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= levelDefinitions.length) {
            modal.style.display = "flex";
            endGame();
          } else {
            setTimeout(loadPage, 800);
          }
        }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(word);
      showFeedback(false);
    }
  }

  function touchStart(e) {
    const target = e.target;
    const word = target.dataset.word;
    const src = target.src;

    const clone = target.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.7";
    clone.style.zIndex = "10000";
    document.body.appendChild(clone);

    const moveClone = touch => {
      clone.style.left = `${touch.clientX - clone.width / 2}px`;
      clone.style.top = `${touch.clientY - clone.height / 2}px`;
    };
    moveClone(e.touches[0]);

    const handleTouchMove = ev => moveClone(ev.touches[0]);
    const handleTouchEnd = ev => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.classList.contains("slot")) drop({
        preventDefault: () => {},
        dataTransfer: {
          getData: k => k === "text/plain" ? word : src
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

  // -----------------------------
  // End Game
  // -----------------------------
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const formattedTime = `${Math.floor(timeTaken / 60)} mins ${timeTaken % 60} sec`;

    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
  }

  // -----------------------------
  // Word Distribution Helpers
  // -----------------------------
  function distributeWords(words) {
    const shuffled = shuffle([...words]);
    return shuffled.slice(0, 9);
  }

  function distributeLevel4(words, incorrects, pages = 3) {
    const pageSets = [];
    const pool = shuffle([...words]);
    let i = 0;
    for (let p = 0; p < pages; p++) {
      const page = [];
      while (page.length < 9) {
        if (i >= pool.length) i = 0;
        const w = pool[i++];
        if (!page.includes(w)) page.push(w);
      }
      for (let inc of incorrects) {
        if (page.length < 9 && !page.includes(inc)) page.unshift(inc);
      }
      pageSets.push(page.slice(0, 9));
    }
    return pageSets;
  }

  // -----------------------------
  // Load Page
  // -----------------------------
  let pageWords = [];

  function loadPage() {
    const info = levelDefinitions[currentLevel];
    levelTitle.innerText = `Level ${currentLevel + 1}: ${info.name}`;

    if (currentLevel < 3) {
      const distributed = shuffle(info.words);
      pageWords = distributed.slice(currentPage * 9, currentPage * 9 + 9);
    } else {
      if (currentPage === 0 && currentLevel === 3) {
        currentWords = distributeLevel4(
          info.words,
          levelAttempts.slice(0, 3).flatMap(lvl => lvl.incorrect),
          info.pages
        );
      }
      pageWords = currentWords[currentPage];
    }

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    let gridType = "clipart";
    if (currentPage === 1) gridType = "sign";
    if (currentPage === 2) gridType = Math.random() > 0.5 ? "clipart" : "sign";

    pageWords.forEach(word => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.word = word;
      if (gridType === "clipart") slot.style.backgroundImage = `url('assets/food/clipart/${word}.png')`;
      else slot.style.backgroundImage = `url('assets/food/signs/${word}-sign.png')`;
      gameBoard.appendChild(slot);
    });

    const draggableWords = shuffle(info.words);
    draggableWords.forEach((word, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.word = word;
      img.src = gridType === "clipart" ? `assets/food/signs/${word}-sign.png` : `assets/food/clipart/${word}.png`;
      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", word);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      (i < draggableWords.length / 2 ? leftSigns : rightSigns).appendChild(wrap);
    });

    correctMatches = 0;
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    updateScore();
    saveProgress();
  }

  // -----------------------------
  // Initialize Game
  // -----------------------------
  const resumed = restoreProgress();
  if (resumed) loadPage(); else loadPage();
});
