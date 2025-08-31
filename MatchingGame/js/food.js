// ✅ Complete Food Matching Game Script (with wide-mode support for many draggables)
document.addEventListener("DOMContentLoaded", function () {
  // ---------- Identity / gating ----------
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }
  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // ---------- DOM ----------
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // ---------- State ----------
  let currentLevel = 0;     // 0..3
  let currentPage = 0;      // 0..2
  let gameEnded = false;
  let startTime = Date.now();
  let correctMatches = 0;

  // Holds page words for current page so drop() can read length safely
  let currentPageWords = [];

  // Track attempts per level
  const levelAttempts = Array(4).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // ---------- Word banks ----------
  const wordBanks = {
    1: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    2: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    3: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","pasta"],
    4: [] // filled below
  };
  wordBanks[4] = [...wordBanks[1], ...wordBanks[2], ...wordBanks[3]];

  // Level definitions (Level 4 uses wideMode)
  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Fruit", wideMode: false },
    { words: wordBanks[2], pages: 3, name: "Vegetables", wideMode: false },
    { words: wordBanks[3], pages: 3, name: "More Food", wideMode: false },
    { words: wordBanks[4], pages: 3, name: "Mixture", wideMode: true } // many draggables → wide mode
  ];

  // ---------- Feedback image ----------
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

  // ---------- Utilities ----------
  function shuffle(arr) {
    return arr.slice().sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 900);
  }

  function updateScore() {
    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;
    document.getElementById("score-display").innerText = `Score: ${percent}%`;
  }

  function saveProgress() {
    const saveData = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      levelAttempts: levelAttempts.map(l => ({
        correct: Array.from(l.correct),
        incorrect: [...l.incorrect]
      })),
      timestamp: Date.now()
    };
    localStorage.setItem("foodGameSave", JSON.stringify(saveData));
  }

  function restoreProgress() {
    const data = JSON.parse(localStorage.getItem("foodGameSave"));
    if (!data || data.studentName !== studentName || data.studentClass !== studentClass) return false;
    currentLevel = data.currentLevel || 0;
    currentPage = data.currentPage || 0;
    (data.levelAttempts || []).forEach((l, i) => {
      levelAttempts[i].correct = new Set(l.correct || []);
      levelAttempts[i].incorrect = [...(l.incorrect || [])];
    });
    return true;
  }

  // ---------- Drag & Drop ----------
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
      // overlay
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);

      // remove remaining draggables of that word
      document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);
      updateScore();
      saveProgress();

      const need = currentPageWords.length; // always 9 words placed
      if (correctMatches >= need) {
        correctMatches = 0;
        currentPage++;
        const levelInfo = levelDefinitions[currentLevel];
        if (currentPage < levelInfo.pages) {
          setTimeout(loadPage, 700);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= levelDefinitions.length) {
            modal.style.display = "flex";
            endGame();
          } else {
            setTimeout(loadPage, 700);
          }
        }
      }
    } else {
      // track incorrect for Level 4 priority
      levelAttempts[currentLevel].incorrect.push(word);
      showFeedback(false);
      const wrong = document.querySelector(`img.draggable[data-word='${word}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 400);
      }
      updateScore();
      saveProgress();
    }
  }

  function touchStart(e) {
    const target = e.target;
    if (!target || !target.classList.contains("draggable")) return;

    const word = target.dataset.word;
    const src = target.src;

    const clone = target.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.8";
    clone.style.zIndex = "10000";
    // keep touch clone small enough
    const maxW = 110;
    clone.style.width = `${Math.min(target.width || maxW, maxW)}px`;
    clone.style.height = "auto";
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
      if (el && el.classList.contains("slot")) {
        drop({
          preventDefault: () => {},
          dataTransfer: {
            getData: (k) => (k === "text/plain" ? word : src)
          },
          currentTarget: el
        });
      }
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  // ---------- Page word logic ----------
  // For L1–L3: ensure 9 unique words per page. Repeat across pages is allowed,
  // but never on the same page.
  function getPageWords_NoDuplicates(words, pageSize = 9) {
    const shuffled = shuffle(words);
    const picked = [];
    let i = 0;
    while (picked.length < pageSize) {
      const w = shuffled[i % shuffled.length];
      if (!picked.includes(w)) picked.push(w);
      i++;
      if (i > 9999) break; // safety
    }
    return picked;
  }

  // For L4: prioritize previously incorrect (from Levels 1–3) then fill randomly,
  // still 9 unique words per page.
  function getLevel4PageWords(allWords, incorrectPool, pageSize = 9) {
    const uniqueIncorrect = [...new Set(incorrectPool.filter(w => allWords.includes(w)))];
    const page = [];

    // Take as many unique incorrects as we can
    for (const w of uniqueIncorrect) {
      if (page.length >= pageSize) break;
      if (!page.includes(w)) page.push(w);
    }

    // Fill with random unique words from the total pool
    const pool = shuffle(allWords);
    for (const w of pool) {
      if (page.length >= pageSize) break;
      if (!page.includes(w)) page.push(w);
    }
    return page;
  }

  // Build draggable list:
  // L1–L3 → all 12 words (requirement).
  // L4 → page words + up to 9 decoys (18 max total), prioritizing incorrects as decoys too.
  function buildDraggables(info, pageWords, pageGridType, incorrectPool) {
    let draggableList = [];
    if (currentLevel < 3) {
      draggableList = shuffle(info.words); // show all 12
    } else {
      // Level 4: pageWords + decoys prioritized by incorrect, total cap 18
      const maxTotal = 18;
      const neededDecoys = Math.max(0, maxTotal - pageWords.length);

      const incorrectDecoys = shuffle(
        [...new Set(incorrectPool.filter(w => !pageWords.includes(w)))]
      );

      const remainingPool = shuffle(
        info.words.filter(w => !pageWords.includes(w) && !incorrectDecoys.includes(w))
      );

      const decoys = incorrectDecoys.concat(remainingPool).slice(0, neededDecoys);
      draggableList = shuffle(pageWords.concat(decoys));
    }

    // Create DOM
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    draggableList.forEach((word, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.word = word;

      // Draggables are the *opposite* of what's shown in the grid
      // For mixed grid, we decide per-slot — so we calculate the opposite per word:
      let showSignAsGridForWord = null;
      if (pageGridType === "clipart") {
        showSignAsGridForWord = false; // grid shows clipart → draggable should be sign
      } else if (pageGridType === "sign") {
        showSignAsGridForWord = true;  // grid shows sign → draggable should be clipart
      } else {
        // mixed: determine the slot type for this word in the grid
        const slotEl = document.querySelector(`.slot[data-word='${word}']`);
        if (slotEl) {
          const slotType = slotEl.dataset.gridType; // "sign" or "clipart"
          showSignAsGridForWord = (slotType === "sign");
        } else {
          // if the word is just a decoy (not in grid), pick random opposite for variety
          showSignAsGridForWord = Math.random() < 0.5;
        }
      }

      const draggableOppositeIsSign = !showSignAsGridForWord;
      img.src = `assets/food/${draggableOppositeIsSign ? "signs" : "clipart"}/${word}${draggableOppositeIsSign ? "-sign" : ""}.png`;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", word);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      // split into two columns
      if (i < Math.ceil(draggableList.length / 2)) {
        leftSigns.appendChild(wrap);
      } else {
        rightSigns.appendChild(wrap);
      }
    });
  }

  // ---------- Grid builder ----------
  function buildGrid(pageWords, pageIndex) {
    gameBoard.innerHTML = "";

    // Page 0: clipart grid; Page 1: sign grid; Page 2: mixed
    let gridType = "clipart";
    if (pageIndex === 1) gridType = "sign";
    if (pageIndex === 2) gridType = "mixed";

    pageWords.forEach(word => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.word = word;

      let typeForThisSlot = gridType;
      if (gridType === "mixed") {
        typeForThisSlot = Math.random() < 0.5 ? "clipart" : "sign";
      }

      // Save per-slot type so we can generate correct opposite draggables
      slot.dataset.gridType = typeForThisSlot;

      const url = `assets/food/${typeForThisSlot === "sign" ? "signs" : "clipart"}/${word}${typeForThisSlot === "sign" ? "-sign" : ""}.png`;
      slot.style.backgroundImage = `url('${url}')`;

      gameBoard.appendChild(slot);
    });

    // Make slots droppable
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    return gridType;
  }

  // ---------- End game ----------
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const formattedTime = `${Math.floor(timeTaken / 60)} mins ${timeTaken % 60} sec`;

    const totalCorrect = levelAttempts.reduce((sum, l) => sum + l.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, l) => sum + l.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
  }

  // ---------- Loader ----------
  function loadPage() {
    if (gameEnded) {
      modal.style.display = "flex";
      return;
    }
    if (currentLevel >= levelDefinitions.length) {
      modal.style.display = "flex";
      endGame();
      return;
    }

    // Wide-mode for many draggables (Level 4)
    const info = levelDefinitions[currentLevel];
    if (info.wideMode) {
      document.body.classList.add("wide-mode");
    } else {
      document.body.classList.remove("wide-mode");
    }

    levelTitle.innerText = `Level ${currentLevel + 1}: ${info.name}`;
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Prepare page words (9 items, no duplicates on the same page)
    if (currentLevel < 3) {
      // Levels 1–3: simple unique 9 words per page (repetition allowed across pages)
      currentPageWords = getPageWords_NoDuplicates(info.words, 9);
    } else {
      // Level 4: prioritize previously incorrect from L1–L3
      const incorrectPool = levelAttempts
        .slice(0, 3)
        .flatMap(l => l.incorrect);

      currentPageWords = getLevel4PageWords(info.words, incorrectPool, 9);
    }

    // Build the grid first (so draggable “opposite” can read slot types)
    const gridType = buildGrid(currentPageWords, currentPage);

    // Build draggables
    const incorrectPoolForL4 = levelAttempts.slice(0, 3).flatMap(l => l.incorrect);
    buildDraggables(info, currentPageWords, gridType, incorrectPoolForL4);

    correctMatches = 0;
    updateScore();
    saveProgress();
  }

  // ---------- Buttons ----------
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      if (!gameEnded) {
        modal.style.display = "flex";
        endGame();
      }
    });
  }

  continueBtn.addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem("foodGameSave"));
    if (saved && saved.studentName === studentName && saved.studentClass === studentClass) {
      currentLevel = saved.currentLevel || 0;
      currentPage = saved.currentPage || 0;
      (saved.levelAttempts || []).forEach((lvl, i) => {
        levelAttempts[i].correct = new Set(lvl.correct || []);
        levelAttempts[i].incorrect = lvl.incorrect || [];
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
        }, 800);
      } else {
        localStorage.clear();
        window.location.href = "../index.html";
      }
    });
  }

  // ---------- Start ----------
  const resumed = restoreProgress();
  loadPage();
});
