// ✅ food.js - Full Food Matching Game with per-level Google Form submission & resume support

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
  let currentLevel = 0;     // 0..3
  let currentPage = 0;      // 0..2
  let currentPageWords = []; // the 9 words currently on the grid
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();

  // attempts: for 4 levels -> track correct set and incorrect array
  const levelAttempts = Array(4).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // ----------------------
  // Word banks
  // ----------------------
  const wordBanks = {
    1: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    2: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    3: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","pasta"]
  };
  wordBanks[4] = [...wordBanks[1], ...wordBanks[2], ...wordBanks[3]];

  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Fruit", wideMode: false },
    { words: wordBanks[2], pages: 3, name: "Vegetables", wideMode: false },
    { words: wordBanks[3], pages: 3, name: "More Food", wideMode: false },
    { words: wordBanks[4], pages: 3, name: "Mixture", wideMode: true } // Level 4 many draggables
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

  function saveProgress() {
    // Avoid saving at absolute start with no progress
    if (currentLevel === 0 && currentPage === 0 && correctMatches === 0 && levelAttempts.every(l => l.correct.size === 0 && l.incorrect.length === 0)) {
      return;
    }
    const data = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      levelAttempts: levelAttempts.map(l => ({ correct: Array.from(l.correct), incorrect: l.incorrect })),
      startTime,
      gameEnded
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function restoreProgressPrompt() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (!data || data.studentName !== studentName || data.studentClass !== studentClass) return false;
      // Ask to resume only if there is progress recorded
      if (!data.gameEnded && (data.currentLevel > 0 || data.currentPage > 0 || data.levelAttempts.some(l => l.correct.length > 0 || l.incorrect.length > 0))) {
        if (confirm("Resume your unfinished Food game?")) {
          restoreProgress(data);
          return true;
        } else {
          localStorage.removeItem(SAVE_KEY);
          return false;
        }
      }
    } catch (e) {
      console.warn("Failed to parse save:", e);
    }
    return false;
  }

  function restoreProgress(data) {
    if (!data) return false;
    currentLevel = data.currentLevel || 0;
    currentPage = data.currentPage || 0;
    startTime = data.startTime || Date.now();
    gameEnded = data.gameEnded || false;
    (data.levelAttempts || []).forEach((l, i) => {
      levelAttempts[i].correct = new Set(l.correct || []);
      levelAttempts[i].incorrect = l.incorrect || [];
    });
    return true;
  }

  // ----------------------
  // Drag & Drop / Touch
  // ----------------------
  function dropHandler(e) {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetWord = target.dataset.word;

    if (!targetWord) return;

    if (word === targetWord) {
      // correct
      if (!levelAttempts[currentLevel].correct.has(word)) {
        levelAttempts[currentLevel].correct.add(word);
      }
      // overlay
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = src;
      target.appendChild(overlay);

      // remove any draggables of that word
      document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);
      updateScoreDisplay();
      saveProgress();

      if (correctMatches >= currentPageWords.length) {
        // level page finished
        correctMatches = 0;
        // submit level results now (per requirement)
        submitCurrentProgressToForm(currentLevel).finally(() => {
          // proceed to next page/level
          currentPage++;
          const info = levelDefinitions[currentLevel];
          if (currentPage < info.pages) {
            setTimeout(loadPage, 700);
          } else {
            // finished level
            currentLevel++;
            currentPage = 0;
            saveProgress();
            if (currentLevel >= levelDefinitions.length) {
              // all levels done
              endGame();
              // final submit (already submitted per level, but include errorsReviewed)
              submitFinalResultsToForm().finally(() => {
                modal.style.display = "flex";
              });
            } else {
              setTimeout(loadPage, 700);
            }
          }
        });
      }
    } else {
      // incorrect
      levelAttempts[currentLevel].incorrect.push(word);
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
    // touch drag for mobile
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
  // Return an array of `n` unique words for a page (no duplicate on the page).
  // If words array has less than n, words will repeat across pages (but not within this page).
  function getUniquePageWords(words, n = 9) {
    const picked = [];
    const pool = shuffle(words);
    let i = 0;
    while (picked.length < n) {
      const candidate = pool[i % pool.length];
      if (!picked.includes(candidate)) picked.push(candidate);
      i++;
      if (i > 9999) break; // safety
    }
    return shuffle(picked);
  }

  // For Level 4: prioritize incorrects (from levels 0..2), then fill rest with unique words.
  function getLevel4PageWords(allWords, incorrects, n = 9) {
    const uniqueIncorrect = [...new Set(incorrects.filter(w => allWords.includes(w)))];
    const page = [];
    // take incorrects first (unique)
    for (const w of uniqueIncorrect) {
      if (page.length >= n) break;
      if (!page.includes(w)) page.push(w);
    }
    // fill with random unique words
    const pool = shuffle(allWords);
    for (const w of pool) {
      if (page.length >= n) break;
      if (!page.includes(w)) page.push(w);
    }
    // If still short (shouldn't happen), repeat unique picks
    if (page.length < n) {
      const more = getUniquePageWords(allWords, n - page.length);
      for (const m of more) if (!page.includes(m)) page.push(m);
    }
    return shuffle(page);
  }

  // Build draggables for a page.
  // L1-L3 => show all words as draggables (12). L4 => pageWords plus up to `decoyCap` decoys (cap small to prevent overflow).
  function buildDraggablesForPage(info, pageWords, gridType, incorrectPoolForL4) {
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    let draggableList = [];

    if (currentLevel < 3) {
      // show all words (12)
      draggableList = shuffle(info.words);
    } else {
      // Level 4: pageWords + decoys (prioritise incorrects not already on page)
      const maxTotal = 18; // cap to prevent overflow (you can adjust)
      const needed = Math.max(0, maxTotal - pageWords.length);

      const incorrectDecoys = shuffle([...new Set(incorrectPoolForL4.filter(w => !pageWords.includes(w)))]);
      const remainingPool = shuffle(info.words.filter(w => !pageWords.includes(w) && !incorrectDecoys.includes(w)));
      const decoys = incorrectDecoys.concat(remainingPool).slice(0, needed);
      draggableList = shuffle(pageWords.concat(decoys));
    }

    // Create DOM draggables and place them into left/right columns
    draggableList.forEach((word, idx) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.word = word;

      // Determine opposite type for draggable image:
      // if gridType is clipart => draggable should be sign
      // if gridType is sign => draggable should be clipart
      // if mixed => check slot's assigned type for that word (slot.dataset.gridType)
      let gridTypeForWord = gridType;
      if (gridType === "mixed") {
        const slotEl = document.querySelector(`.slot[data-word='${word}']`);
        if (slotEl) {
          gridTypeForWord = slotEl.dataset.gridType || "clipart";
        } else {
          // decoy not in grid: random opposite
          gridTypeForWord = Math.random() < 0.5 ? "clipart" : "sign";
        }
      }

      const draggableIsSign = gridTypeForWord === "clipart"; // opposite
      img.src = `assets/food/${draggableIsSign ? "signs" : "clipart"}/${word}${draggableIsSign ? "-sign" : ""}.png`;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", word);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStartHandler);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      // split evenly
      if (idx < Math.ceil(draggableList.length / 2)) leftSigns.appendChild(wrap);
      else rightSigns.appendChild(wrap);
    });
  }

  // Build the grid (slots) for the current page. Returns gridType string ("clipart"/"sign"/"mixed")
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

    // bind droppers
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", dropHandler);
    });

    return gridType;
  }

  // ----------------------
  // Google Form submit helpers
  // ----------------------
  function buildPerLevelStrings() {
    // constructs strings of correct and incorrect for each level to send to form
    const levelsObj = {};
    for (let i = 0; i < levelDefinitions.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct);
      const incorrectArr = levelAttempts[i].incorrect.slice(); // list in order attempted
      // For readability, join with commas
      levelsObj[`level${i+1}`] = {
        correct: correctArr.join(","),
        incorrect: incorrectArr.join(",")
      };
    }
    return levelsObj;
  }

  function computeTotals() {
    let totalCorrect = 0;
    let totalIncorrect = 0;
    for (let i = 0; i < levelDefinitions.length; i++) {
      totalCorrect += levelAttempts[i].correct.size;
      totalIncorrect += levelAttempts[i].incorrect.length;
    }
    return { totalCorrect, totalIncorrect };
  }

  // Submit after each level completes (silent)
  function submitCurrentProgressToForm(levelIndex) {
    return new Promise(resolve => {
      try {
        const levelsObj = buildPerLevelStrings();
        const totals = computeTotals();
        const endTime = Date.now();
        const timeTakenSecs = Math.round((endTime - startTime) / 1000);
        const formattedTime = `${Math.floor(timeTakenSecs / 60)} mins ${timeTakenSecs % 60} sec`;
        const percent = totals.totalCorrect + totals.totalIncorrect > 0 ? Math.round((totals.totalCorrect / (totals.totalCorrect + totals.totalIncorrect)) * 100) : 0;
        const currentLevelString = `L${Math.min(levelIndex + 1, levelDefinitions.length)}P${currentPage + 1}`;

        const fd = new FormData();
        fd.append(formEntries.studentName, studentName);
        fd.append(formEntries.studentClass, studentClass);
        fd.append(formEntries.subject, "Food");
        fd.append(formEntries.timeTaken, formattedTime);
        fd.append(formEntries.percentage, `${percent}%`);
        fd.append(formEntries.currentLevel, currentLevelString);

        // map levels (form expects many entries; we'll fill those that exist)
        // Level 1 entries
        fd.append(formEntries.level1Correct, levelsObj.level1.correct || "");
        fd.append(formEntries.level1Incorrect, levelsObj.level1.incorrect || "");
        // Level 2
        fd.append(formEntries.level2Correct, levelsObj.level2.correct || "");
        fd.append(formEntries.level2Incorrect, levelsObj.level2.incorrect || "");
        // Level 3
        fd.append(formEntries.level3Correct, levelsObj.level3.correct || "");
        fd.append(formEntries.level3Incorrect, levelsObj.level3.incorrect || "");
        // Level 4
        fd.append(formEntries.level4Correct, levelsObj.level4.correct || "");
        fd.append(formEntries.level4Incorrect, levelsObj.level4.incorrect || "");
        // Level 5 & 6 (empty for 4-level game, but keep fields present)
        fd.append(formEntries.level5Correct, levelsObj.level5 ? levelsObj.level5.correct : "");
        fd.append(formEntries.level5Incorrect, levelsObj.level5 ? levelsObj.level5.incorrect : "");
        fd.append(formEntries.level6Correct, levelsObj.level6 ? levelsObj.level6.correct : "");
        fd.append(formEntries.level6Incorrect, levelsObj.level6 ? levelsObj.level6.incorrect : "");

        // Totals
        fd.append(formEntries.totalCorrect, `${totals.totalCorrect}`);
        fd.append(formEntries.totalIncorrect, `${totals.totalIncorrect}`);

        // Errors reviewed (Level 7) left empty here for intermediate submissions
        fd.append(formEntries.errorsReviewed, "");

        // send
        fetch(formURL, { method: "POST", mode: "no-cors", body: fd })
          .catch(err => console.warn("Form submit (no-cors) may fail silently:", err))
          .finally(() => resolve());
      } catch (err) {
        console.error("submitCurrentProgressToForm error:", err);
        resolve();
      }
    });
  }

  // Final submission that includes Errors Reviewed (Level 7) assembled from incorrects
  function submitFinalResultsToForm() {
    return new Promise(resolve => {
      try {
        const levelsObj = buildPerLevelStrings();
        const totals = computeTotals();
        const endTime = Date.now();
        const timeTakenSecs = Math.round((endTime - startTime) / 1000);
        const formattedTime = `${Math.floor(timeTakenSecs / 60)} mins ${timeTakenSecs % 60} sec`;
        const percent = totals.totalCorrect + totals.totalIncorrect > 0 ? Math.round((totals.totalCorrect / (totals.totalCorrect + totals.totalIncorrect)) * 100) : 0;

        // Errors reviewed: build a unique list of incorrects across levels 1..3
        const errorsReviewedSet = new Set(levelAttempts.slice(0,3).flatMap(l => l.incorrect));
        const errorsReviewedStr = Array.from(errorsReviewedSet).join(",");

        const fd = new FormData();
        fd.append(formEntries.studentName, studentName);
        fd.append(formEntries.studentClass, studentClass);
        fd.append(formEntries.subject, "Food");
        fd.append(formEntries.timeTaken, formattedTime);
        fd.append(formEntries.percentage, `${percent}%`);
        fd.append(formEntries.currentLevel, `Finished`);

        fd.append(formEntries.level1Correct, levelsObj.level1.correct || "");
        fd.append(formEntries.level1Incorrect, levelsObj.level1.incorrect || "");
        fd.append(formEntries.level2Correct, levelsObj.level2.correct || "");
        fd.append(formEntries.level2Incorrect, levelsObj.level2.incorrect || "");
        fd.append(formEntries.level3Correct, levelsObj.level3.correct || "");
        fd.append(formEntries.level3Incorrect, levelsObj.level3.incorrect || "");
        fd.append(formEntries.level4Correct, levelsObj.level4.correct || "");
        fd.append(formEntries.level4Incorrect, levelsObj.level4.incorrect || "");
        fd.append(formEntries.level5Correct, levelsObj.level5 ? levelsObj.level5.correct : "");
        fd.append(formEntries.level5Incorrect, levelsObj.level5 ? levelsObj.level5.incorrect : "");
        fd.append(formEntries.level6Correct, levelsObj.level6 ? levelsObj.level6.correct : "");
        fd.append(formEntries.level6Incorrect, levelsObj.level6 ? levelsObj.level6.incorrect : "");

        fd.append(formEntries.totalCorrect, `${totals.totalCorrect}`);
        fd.append(formEntries.totalIncorrect, `${totals.totalIncorrect}`);
        fd.append(formEntries.errorsReviewed, errorsReviewedStr);

        fetch(formURL, { method: "POST", mode: "no-cors", body: fd })
          .catch(err => console.warn("Final form submit may fail silently:", err))
          .finally(() => resolve());
      } catch (err) {
        console.error("submitFinalResultsToForm error:", err);
        resolve();
      }
    });
  }

  // ----------------------
  // Load page main
  // ----------------------
  function loadPage() {
    if (gameEnded) {
      modal.style.display = "flex";
      return;
    }

    if (currentLevel >= levelDefinitions.length) {
      // All done
      endGame();
      submitFinalResultsToForm();
      modal.style.display = "flex";
      return;
    }

    const info = levelDefinitions[currentLevel];
    // toggle wide-mode class (your CSS should handle .wide-mode)
    if (info.wideMode) document.body.classList.add("wide-mode");
    else document.body.classList.remove("wide-mode");

    levelTitleEl.innerText = `Level ${currentLevel + 1}: ${info.name}`;

    // Choose pageWords (9 unique on-page)
    if (currentLevel < 3) {
      currentPageWords = getUniquePageWords(info.words, 9);
    } else {
      const incorrectPool = levelAttempts.slice(0,3).flatMap(l => l.incorrect);
      currentPageWords = getLevel4PageWords(info.words, incorrectPool, 9);
    }

    // Build grid first (so mixed slots have their types available for draggables)
    const gridType = buildGridForPage(currentPageWords, currentPage);

    // Build draggables (uses slot.dataset.gridType when mixed)
    const incorrectPoolForL4 = levelAttempts.slice(0,3).flatMap(l => l.incorrect);
    buildDraggablesForPage(info, currentPageWords, gridType, incorrectPoolForL4);

    correctMatches = 0;
    updateScoreDisplay();
    saveProgress();
  }

  // ----------------------
  // End game function
  // ----------------------
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const timeTakenSecs = Math.round((endTime - startTime) / 1000);
    const formattedTime = `${Math.floor(timeTakenSecs / 60)} mins ${timeTakenSecs % 60} sec`;
    const totals = computeTotals();
    const percent = totals.totalCorrect + totals.totalIncorrect > 0 ? Math.round((totals.totalCorrect / (totals.totalCorrect + totals.totalIncorrect)) * 100) : 0;

    if (scoreDisplayEl) scoreDisplayEl.innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    if (endModalContent) endModalContent.appendChild(timeDisplay);

    // clear save on complete
    localStorage.removeItem(SAVE_KEY);
  }

  // ----------------------
  // Attach button handlers (resume logic)
  // ----------------------
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      modal.style.display = "flex";
      endGame();
      submitFinalResultsToForm();
    });
  }

  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    loadPage();
  });

  againBtn.addEventListener("click", () => {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });

  menuBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
  });

  logoutBtn.addEventListener("click", () => {
    // on logout, submit progress if present then navigate home
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved && saved.studentName === studentName && saved.studentClass === studentClass) {
      submitCurrentProgressToForm(currentLevel).finally(() => {
        localStorage.removeItem(SAVE_KEY);
        window.location.href = "../index.html";
      });
    } else {
      localStorage.removeItem(SAVE_KEY);
      window.location.href = "../index.html";
    }
  });

  // ----------------------
  // Start/resume logic
  // ----------------------
  // If save exists and has progress, prompt resume (restoreProgressPrompt does the prompt)
  const resumed = restoreProgressPrompt();
  if (!resumed) {
    // start fresh
    loadPage();
  } else {
    // if resumed true, loadPage after restoreProgress was applied
    loadPage();
  }

  // ---------- Helper functions used earlier (declared below for readability) ----------
  // Re-declare here as named function references used above

  // getUniquePageWords: unique words for a page (no duplicates within page)
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

  // Level 4 page words prioritizing incorrects
  function getLevel4PageWords(allWords, incorrects, n = 9) {
    const uniqueIncorrect = [...new Set(incorrects.filter(w => allWords.includes(w)))];
    const page = [];
    for (const w of uniqueIncorrect) {
      if (page.length >= n) break;
      if (!page.includes(w)) page.push(w);
    }
    const pool = shuffle(allWords);
    for (const w of pool) {
      if (page.length >= n) break;
      if (!page.includes(w)) page.push(w);
    }
    if (page.length < n) {
      const more = getUniquePageWords(allWords, n - page.length);
      for (const m of more) if (!page.includes(m)) page.push(m);
    }
    return shuffle(page);
  }

  // grid builder (slots)
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

  // build draggables for page (declared earlier, but reattached here for clarity)
  function buildDraggablesForPage(info, pageWords, gridType, incorrectPoolForL4) {
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    let draggableList = [];

    if (currentLevel < 3) {
      draggableList = shuffle(info.words);
    } else {
      const maxTotal = 18;
      const needed = Math.max(0, maxTotal - pageWords.length);
      const incorrectDecoys = shuffle([...new Set(incorrectPoolForL4.filter(w => !pageWords.includes(w)))]);
      const remainingPool = shuffle(info.words.filter(w => !pageWords.includes(w) && !incorrectDecoys.includes(w)));
      const decoys = incorrectDecoys.concat(remainingPool).slice(0, needed);
      draggableList = shuffle(pageWords.concat(decoys));
    }

    draggableList.forEach((word, idx) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.word = word;

      let gridTypeForWord = gridType;
      if (gridType === "mixed") {
        const slotEl = document.querySelector(`.slot[data-word='${word}']`);
        if (slotEl) gridTypeForWord = slotEl.dataset.gridType || "clipart";
        else gridTypeForWord = Math.random() < 0.5 ? "clipart" : "sign";
      }

      const draggableIsSign = gridTypeForWord === "clipart"; // opposite
      img.src = `assets/food/${draggableIsSign ? "signs" : "clipart"}/${word}${draggableIsSign ? "-sign" : ""}.png`;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", word);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStartHandler);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      if (idx < Math.ceil(draggableList.length / 2)) leftSigns.appendChild(wrap);
      else rightSigns.appendChild(wrap);
    });
  }

});
