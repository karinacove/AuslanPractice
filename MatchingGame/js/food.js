// ✅ food.js - Full Food Matching Game with Levels 1–6, per-level Google Form submission & resume support

document.addEventListener("DOMContentLoaded", function () {
  // ----------------------
  // Student gating
  // ----------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  // ----------------------
  // DOM handles
  // ----------------------
  const studentInfoEl = document.getElementById("student-info");
  const scoreDisplayEl = document.getElementById("score-display");
  const levelTitleEl = document.getElementById("levelTitle");
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const endModalContent = document.getElementById("end-modal-content");
  const finishBtn = document.getElementById("finish-btn");

  studentInfoEl.innerText = `${studentName} (${studentClass})`;

  // ----------------------
  // Game state
  // ----------------------
  let currentLevel = 0;     // 0..5
  let currentPage = 0;      // 0..2
  let currentPageWords = []; // the 9 words currently on the grid
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();

  // attempts: for 6 levels -> track correct set and incorrect array
  const levelAttempts = Array(6).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // ----------------------
  // Word banks
  // ----------------------
  const wordBanks = {
    1: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    2: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    3: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","pasta"],
    4: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    5: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    6: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","biscuit"]
  };

  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Fruit", wideMode: false },
    { words: wordBanks[2], pages: 3, name: "Vegetables", wideMode: false },
    { words: wordBanks[3], pages: 3, name: "More Food", wideMode: false },
    { words: wordBanks[4], pages: 3, name: "Fruit", wideMode: false },
    { words: wordBanks[5], pages: 3, name: "Vegetables", wideMode: false },
    { words: wordBanks[6], pages: 3, name: "More Food", wideMode: false }
  ];

  // ----------------------
  // Feedback image
  // ----------------------
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

  // ----------------------
  // Google Form mapping (from your form link)
  // ----------------------
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfP71M2M1SmaIzHVnsOSx4390iYgSxQy7Yo3NAPpbsR_Q7JaA/formResponse";
  const formEntries = {
    studentName: "entry.649726739",
    studentClass: "entry.2105926443",
    subject: "entry.1916287201",
    timeTaken: "entry.1743763592",
    percentage: "entry.393464832",
    currentLevel: "entry.1202549392",
    level1Correct: "entry.1933213595",
    level1Incorrect: "entry.2087978837",
    level2Correct: "entry.1160438650",
    level2Incorrect: "entry.2081595072",
    level3Correct: "entry.883075031",
    level3Incorrect: "entry.2093517837",
    level4Correct: "entry.498801806",
    level4Incorrect: "entry.754032840",
    level5Correct: "entry.1065703343",
    level5Incorrect: "entry.880100066",
    level6Correct: "entry.1360743630",
    level6Incorrect: "entry.112387671",
    totalCorrect: "entry.395384696",
    totalIncorrect: "entry.1357567724",
    errorsReviewed: "entry.11799771"
  };

  // ----------------------
  // Utilities
  // ----------------------
  function shuffle(arr) {
    return arr.slice().sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => (feedbackImage.style.display = "none"), 900);
  }

  function updateScoreDisplay() {
    const totalCorrect = levelAttempts.reduce((s, l) => s + l.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;
    if (scoreDisplayEl) scoreDisplayEl.innerText = `Score: ${percent}%`;
  }

 // ----------------------
// Save / Restore progress
// ----------------------
const SAVE_KEY = "foodGameSave";

// ----------------------
// Save / Restore progress
// ----------------------
const SAVE_KEY = "foodGameSave"; // Use ONE consistent key

function saveProgress() {
  // Avoid saving at absolute start with no progress
  if (
    currentLevel === 0 &&
    currentPage === 0 &&
    score === 0 &&
    levelAttempts.every(l => l.correct.size === 0 && l.incorrect.length === 0)
  ) {
    return;
  }

  const data = {
    studentName,
    studentClass,
    currentLevel,
    currentPage,
    startTime,
    gameEnded,
    score,
    levelAttempts: levelAttempts.map(l => ({
      correct: [...l.correct],
      incorrect: l.incorrect
    }))
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function restoreProgress() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    if (!data) return false;

    currentLevel = data.currentLevel ?? 0;
    currentPage = data.currentPage ?? 0;
    startTime = data.startTime ?? Date.now();
    gameEnded = data.gameEnded ?? false;
    score = data.score ?? 0;

    (data.levelAttempts || []).forEach((l, i) => {
      levelAttempts[i].correct = new Set(l.correct || []);
      levelAttempts[i].incorrect = l.incorrect || [];
    });

    return true;
  } catch (e) {
    console.warn("Failed to parse save:", e);
    return false;
  }
}

// Resume game entry point
function resumeGame() {
  if (restoreProgress()) {
    buildLevel(currentLevel, currentPage); // Resume exactly where left off
  } else {
    startNewGame();
  }
}

// Resume game entry point
function resumeGame() {
  if (restoreProgressPrompt()) {
    buildLevel(currentLevel, currentPage); // ✅ Resume at correct screen
    updateScoreDisplay(score);             // ✅ Refresh score display
  } else {
    startNewGame();
  }
}

  // ----------------------
  // Drag & Drop / Touch
  // ----------------------
 function dropHandler(e) {
  e.preventDefault();
  const word = e.dataTransfer.getData("text/plain");
  const src = e.dataTransfer.getData("src");
  const target = e.currentTarget;
  const targetWord = target && target.dataset ? target.dataset.word : null;

  if (!targetWord) return;

  if (word === targetWord) {
    if (!levelAttempts[currentLevel].correct.has(word)) {
      levelAttempts[currentLevel].correct.add(word);
    }

    // place overlay and remove draggable icons
    target.innerHTML = "";
    const overlay = document.createElement("img");
    overlay.className = "overlay";
    overlay.src = src;
    target.appendChild(overlay);

    // remove all draggable instances of that word (keeps UI tidy)
    document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el => el.remove());

    correctMatches++;
    showFeedback(true);
    updateScoreDisplay();
    saveProgress();

    // use the real DOM slot count so the check can't be stale
    const slotsOnPage = document.querySelectorAll(".slot").length;

    if (correctMatches >= slotsOnPage) {
      // finished the page
      correctMatches = 0;

      // submit progress, but don't let submission errors block navigation
      (async () => {
        try {
          await submitCurrentProgressToForm(currentLevel);
        } catch (err) {
          console.warn("Form submit failed (continuing):", err);
        } finally {
          // advance page/level synchronously
          currentPage++;
          const info = levelDefinitions[currentLevel];
          if (currentPage < info.pages) {
            saveProgress();
            setTimeout(loadPage, 700);
          } else {
            currentLevel++;
            currentPage = 0;
            saveProgress();
            if (currentLevel >= levelDefinitions.length) {
              // finished all levels
              endGame();
              try { await submitFinalResultsToForm(); } catch (err) { console.warn("Final submit failed:", err); }
              modal.style.display = "flex";
            } else {
              setTimeout(loadPage, 700);
            }
          }
        }
      })();
    }
  } else {
    // incorrect drop
    if (Array.isArray(levelAttempts[currentLevel].incorrect)) {
      levelAttempts[currentLevel].incorrect.push(word);
    } else {
      levelAttempts[currentLevel].incorrect = [word];
    }
    showFeedback(false);
    updateScoreDisplay();
    saveProgress();

    const wrong = document.querySelector(`img.draggable[data-word='${word}']`);
    if (wrong) {
      wrong.classList.add("shake");
      setTimeout(() => wrong.classList.remove("shake"), 400);
    }
  }
}

  function touchStartHandler(e) {
    e.preventDefault();
    const target = e.target;
    if (!target || !target.classList.contains("draggable")) return;
    const word = target.dataset.word;
    const src = target.src;

    const clone = target.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.85";
    clone.style.zIndex = "10000";
    const maxWidth = 110;
    clone.style.width = `${Math.min(target.naturalWidth || maxWidth, maxWidth)}px`;
    clone.style.height = "auto";
    document.body.appendChild(clone);

    const moveClone = touch => {
      clone.style.left = `${touch.clientX - clone.width / 2}px`;
      clone.style.top = `${touch.clientY - clone.height / 2}px`;
    };
    moveClone(e.touches[0]);

    const onMove = ev => moveClone(ev.touches[0]);
    const onEnd = ev => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.classList.contains("slot")) {
        dropHandler({
          preventDefault: () => {},
          dataTransfer: {
            getData: k => (k === "text/plain" ? word : src)
          },
          currentTarget: el
        });
      }
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: false });
  }

  // ----------------------
  // Page word selection helpers
  // ----------------------
  function getUniquePageWords(words, n = 9) {
    const picked = [];
    const pool = shuffle(words);
    let i = 0;
    while (picked.length < n) {
      const candidate = pool[i % pool.length];
      if (!picked.includes(candidate)) picked.push(candidate);
      i++;
      if (i > 9999) break;
    }
    return shuffle(picked);
  }

  // ----------------------
  // Build grid and draggables
  // ----------------------
  function buildGridForPage(pageWords, pageIdx) {
    gameBoard.innerHTML = "";
    const gridType = pageIdx === 0 ? "clipart" : pageIdx === 1 ? "sign" : "mixed";

    pageWords.forEach(word => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.word = word;
      let slotType = gridType;
      if (gridType === "mixed") slotType = Math.random() < 0.5 ? "clipart" : "sign";
      slot.dataset.gridType = slotType;
      const url = `assets/food/${slotType === "sign" ? "signs" : "clipart"}/${word}${slotType === "sign" ? "-sign" : ""}.png`;
      slot.style.backgroundImage = `url('${url}')`;
      gameBoard.appendChild(slot);
    });

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", dropHandler);
    });

    return gridType;
  }

 function buildDraggablesForPage(info, pageWords, gridType) {
  // clear
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  // decide target counts based on currentLevel (global)
  // levels 0..2 => 6 per side, levels 3..5 => 9 per side
  const pairsPerSide = (typeof currentLevel === "number" && currentLevel <= 2) ? 6 : 9;
  const TARGET_TOTAL = pairsPerSide * 2;

  // gather unique words for the level
  const uniqueWords = Array.from(new Set(info.words));

  // If this is a review level (level index >= 3) prioritise incorrects from earlier levels
  let priority = [];
  if (typeof currentLevel === "number" && currentLevel >= 3) {
    for (let li = 0; li < currentLevel; li++) {
      if (levelAttempts[li] && Array.isArray(levelAttempts[li].incorrect)) {
        priority = priority.concat(levelAttempts[li].incorrect);
      }
    }
    // keep only unique and valid words (present in uniqueWords)
    priority = Array.from(new Set(priority)).filter(w => uniqueWords.includes(w));
  }

  // build initial list: priority -> pageWords -> remaining uniqueWords
  const pool = [];
  priority.forEach(w => { if (!pool.includes(w)) pool.push(w); });
  pageWords.forEach(w => { if (!pool.includes(w) && uniqueWords.includes(w)) pool.push(w); });
  uniqueWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });

  // prefer filling with words NOT on the current grid (so decoys are useful)
  const notOnPage = uniqueWords.filter(w => !pageWords.includes(w));

  // fill up to target total
  let pIdx = 0;
  while (pool.length < TARGET_TOTAL) {
    // prefer words not on page
    if (notOnPage.length > 0) {
      const next = notOnPage.shift();
      if (!pool.includes(next)) pool.push(next);
      continue;
    }
    // otherwise add random picks (duplicates allowed now to reach target)
    const pick = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
    pool.push(pick);
    // safety guard
    if (pIdx++ > 1000) break;
  }

  // final shuffle and trim to exact target
  const finalList = shuffle(pool).slice(0, TARGET_TOTAL);

  // debug (remove if you don't want console noise)
  console.log("buildDraggablesForPage:", {
    currentLevel,
    pairsPerSide,
    TARGET_TOTAL,
    finalCount: finalList.length,
    finalList
  });

  // create DOM draggables and split evenly (alternating) into left/right
  finalList.forEach((word, idx) => {
    const img = document.createElement("img");
    img.className = "draggable";
    img.draggable = true;
    img.dataset.word = word;

    // For mixed grids, pick the opposite of the slot's type if slot exists.
    let gridTypeForWord = gridType;
    if (gridType === "mixed") {
      const slotEl = document.querySelector(`.slot[data-word='${word}']`);
      gridTypeForWord = slotEl ? (slotEl.dataset.gridType || "clipart") : (Math.random() < 0.5 ? "clipart" : "sign");
    }

    const draggableIsSign = (gridTypeForWord === "clipart"); // if grid shows clipart, draggable shows sign
    img.src = `assets/food/${draggableIsSign ? "signs" : "clipart"}/${word}${draggableIsSign ? "-sign" : ""}.png`;

    // drag + touch handlers
    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", word);
      e.dataTransfer.setData("src", img.src);
    });
    img.addEventListener("touchstart", touchStartHandler);

    const wrap = document.createElement("div");
    wrap.className = "drag-wrapper";
    wrap.appendChild(img);

    // alternate so each side gets the same count (TARGET_TOTAL is even)
    if (idx % 2 === 0) leftSigns.appendChild(wrap);
    else rightSigns.appendChild(wrap);
  });

  // final sanity check (optional)
  // console.log('left count', leftSigns.children.length, 'right count', rightSigns.children.length);
}

  // ----------------------
  // Load Page / Level
  // ----------------------
  function loadPage() {
    if (currentLevel >= levelDefinitions.length) return endGame();

    const info = levelDefinitions[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel + 1}: ${info.name} (Page ${currentPage + 1})`;

    currentPageWords = getUniquePageWords(info.words, 9);
    correctMatches = 0;

    const gridType = buildGridForPage(currentPageWords, currentPage);
    buildDraggablesForPage(info, currentPageWords, gridType);

    updateScoreDisplay();
  }

  // ----------------------
  // Form submission
  // ----------------------
  async function submitCurrentProgressToForm(levelIdx) {
    const lvlAttempt = levelAttempts[levelIdx];
    const totalCorrect = lvlAttempt.correct.size;
    const totalIncorrect = lvlAttempt.incorrect.length;

    const formData = new FormData();
    formData.append(formEntries.studentName, studentName);
    formData.append(formEntries.studentClass, studentClass);
    formData.append(formEntries.subject, "Food");
    formData.append(formEntries.currentLevel, levelIdx + 1);
    formData.append(formEntries[`level${levelIdx + 1}Correct`], Array.from(lvlAttempt.correct).join(","));
    formData.append(formEntries[`level${levelIdx + 1}Incorrect`], lvlAttempt.incorrect.join(","));
    formData.append(formEntries.timeTaken, Math.floor((Date.now() - startTime) / 1000));
    formData.append(formEntries.percentage, Math.round((totalCorrect / (totalCorrect + totalIncorrect || 1)) * 100));

    await fetch(formURL, { method: "POST", body: formData, mode: "no-cors" });
  }

  async function submitFinalResultsToForm() {
    const totalCorrect = levelAttempts.reduce((s, l) => s + l.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    const formData = new FormData();
    formData.append(formEntries.studentName, studentName);
    formData.append(formEntries.studentClass, studentClass);
    formData.append(formEntries.subject, "Food");
    formData.append(formEntries.totalCorrect, totalCorrect);
    formData.append(formEntries.totalIncorrect, totalIncorrect);
    formData.append(formEntries.percentage, percent);
    formData.append(formEntries.timeTaken, Math.floor((Date.now() - startTime) / 1000));
    formData.append(formEntries.errorsReviewed, "N/A");

    for (let i = 0; i < 6; i++) {
      const lvl = levelAttempts[i];
      formData.append(formEntries[`level${i + 1}Correct`], Array.from(lvl.correct).join(","));
      formData.append(formEntries[`level${i + 1}Incorrect`], lvl.incorrect.join(","));
    }

    await fetch(formURL, { method: "POST", body: formData, mode: "no-cors" });
  }

  function endGame() {
    gameEnded = true;
    saveProgress();
    modal.style.display = "flex";
  }

  // ----------------------
  // Buttons
  // ----------------------
  againBtn?.addEventListener("click", loadPage);
  continueBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    loadPage();
  });
  menuBtn?.addEventListener("click", () => (window.location.href = "../index.html"));
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem(SAVE_KEY);
    window.location.href = "../index.html";
  });
  finishBtn?.addEventListener("click", async () => {
    await submitFinalResultsToForm();
    modal.style.display = "flex";
  });

  // ----------------------
  // Init
  // ----------------------
  if (!restoreProgressPrompt()) {
    loadPage();
  }
});
