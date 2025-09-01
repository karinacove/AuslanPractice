// ==================================================
// Food Matching Game — Levels 1–6 (with optional review)
// ==================================================

document.addEventListener("DOMContentLoaded", function () {
  // ----------------------------
  // Student gating
  // ----------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  // ----------------------------
  // DOM Handles
  // ----------------------------
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
  const finishBtn = document.getElementById("finish-btn");

  studentInfoEl.innerText = `${studentName} (${studentClass})`;

  // ----------------------------
  // Game configuration
  // ----------------------------
  const SAVE_KEY = "foodGameSave_v1";

  const wordBanks = {
    1: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    2: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    3: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","pasta"],
    4: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    5: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    6: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","biscuit"]
  };

  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Fruit" },
    { words: wordBanks[2], pages: 3, name: "Vegetables" },
    { words: wordBanks[3], pages: 3, name: "More Food" },
    { words: wordBanks[4], pages: 3, name: "Fruit (Review)" },
    { words: wordBanks[5], pages: 3, name: "Vegetables (Review)" },
    { words: wordBanks[6], pages: 3, name: "More Food (Review)" }
  ];

  let currentLevel = 0;
  let currentPage = 0;
  let currentPageWords = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  const levelAttempts = Array(levelDefinitions.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // Feedback image
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "200px",
    display: "none",
    zIndex: "9999"
  });
  document.body.appendChild(feedbackImage);

  // ----------------------------
  // Google Form mapping
  // ----------------------------
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

  // ----------------------------
  // Utilities
  // ----------------------------
  function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => { feedbackImage.style.display = "none"; }, 900);
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function calculatePercent() {
    const totalCorrect = levelAttempts.reduce((s, lvl) => s + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((s, lvl) => s + lvl.incorrect.length, 0);
    if (totalCorrect + totalIncorrect === 0) return 0;
    return Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100);
  }

  function updateScoreDisplay() {
    const percent = calculatePercent();
    if (scoreDisplayEl) scoreDisplayEl.innerText = `Score: ${percent}%`;
  }

  // ----------------------------
  // Save / Restore
  // ----------------------------
  function saveProgress() {
    const hasProgress =
      currentLevel > 0 || currentPage > 0 ||
      levelAttempts.some(l => l.correct.size > 0 || l.incorrect.length > 0) ||
      gameEnded;
    if (!hasProgress) return;

    const data = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      startTime,
      gameEnded,
      levelAttempts: levelAttempts.map(l => ({ correct: Array.from(l.correct), incorrect: l.incorrect }))
    };

    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); }
    catch (err) { console.warn("Save failed:", err); }
  }

  function restoreProgressFromData(data) {
    if (!data) return false;
    try {
      if (data.studentName && data.studentName !== studentName) return false;
      if (data.studentClass && data.studentClass !== studentClass) return false;

      currentLevel = typeof data.currentLevel === "number" ? data.currentLevel : 0;
      currentPage = typeof data.currentPage === "number" ? data.currentPage : 0;
      startTime = data.startTime || Date.now();
      gameEnded = !!data.gameEnded;

      (data.levelAttempts || []).forEach((l, i) => {
        if (!levelAttempts[i]) levelAttempts[i] = { correct: new Set(), incorrect: [] };
        levelAttempts[i].correct = new Set(l.correct || []);
        levelAttempts[i].incorrect = l.incorrect || [];
      });

      currentLevel = clamp(currentLevel, 0, levelDefinitions.length - 1);
      currentPage = clamp(currentPage, 0, levelDefinitions[currentLevel].pages - 1);

      updateScoreDisplay();
      return true;
    } catch (err) { console.warn("Restore parse failed:", err); return false; }
  }

  // ----------------------------
  // Drag & Drop & Touch handlers
  // ----------------------------
  function dropHandler(e) {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const slot = e.currentTarget;
    const targetWord = slot && slot.dataset ? slot.dataset.word : null;

    if (!targetWord) return;

    if (word === targetWord) {
      // correct
      if (!levelAttempts[currentLevel].correct.has(word)) {
        levelAttempts[currentLevel].correct.add(word);
      }

      // display overlay image on slot
      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = src;
      slot.appendChild(overlay);

      // remove draggable icons of that word
      document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);
      updateScoreDisplay();
      saveProgress();

      // check if page complete (use DOM slot count)
      const slotsOnPage = document.querySelectorAll(".slot").length;
      if (correctMatches >= slotsOnPage) {
        // small delay for feedback then advance
        correctMatches = 0;
        (async () => {
          try {
            await submitCurrentProgressToForm(currentLevel); // send LxPy for this page
          } catch (err) {
            console.warn("Submit failed, continuing:", err);
          } finally {
            // advance page or level
            currentPage++;
            const info = levelDefinitions[currentLevel];
            if (currentPage < info.pages) {
              saveProgress();
              setTimeout(loadPage, 700);
            } else {
              // finished level
              currentLevel++;
              currentPage = 0;
              saveProgress();
              if (currentLevel >= levelDefinitions.length) {
                // finished all levels -> finish game automatically
                gameEnded = true;
                saveProgress();
                try {
                  await submitFinalResultsToForm();
                } catch (err) {
                  console.warn("Final submit failed:", err);
                }
                // show final modal (menu/again/logout), not continue
                if (modal) modal.style.display = "flex";
                showEndMenu();
              } else {
                setTimeout(loadPage, 700);
              }
            }
          }
        })();
      }
    } else {
      // incorrect
      levelAttempts[currentLevel].incorrect.push(word);
      showFeedback(false);
      updateScoreDisplay();
      saveProgress();
      // small shake animation on wrong draggable if present
      const wrong = document.querySelector(`img.draggable[data-word='${word}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 400);
      }
    }
  }

  function touchStartHandler(e) {
    // touch drag emulation
    if (!e.target || !e.target.classList.contains("draggable")) return;
    e.preventDefault();
    const target = e.target;
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
        // emulate drop
        dropHandler({
          preventDefault: () => {},
          dataTransfer: {
            getData: k => k === "text/plain" ? word : src
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

  // ----------------------------
  // Get unique set of words for a page (no duplicates on the same page)
  // ----------------------------
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

  // ----------------------------
  // Build grid slots
  // ----------------------------
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
      // minimal style (if your CSS handles background-size etc, fine)
      gameBoard.appendChild(slot);
    });

    // attach dragover/drop listeners
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", dropHandler);
    });

    return gridType;
  }

  // ----------------------------
  // Build draggables for a page
  // ----------------------------
  function buildDraggablesForPage(info, pageWords, gridType) {
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    const pairsPerSide = (currentLevel <= 2) ? 6 : 9;
    const TARGET_TOTAL = pairsPerSide * 2;

    const uniqueWords = Array.from(new Set(info.words));

    // gather priority incorrects (only for review levels)
    let priority = [];
    if (currentLevel >= 3) {
      for (let li = 0; li < currentLevel; li++) {
        if (levelAttempts[li] && Array.isArray(levelAttempts[li].incorrect)) {
          priority = priority.concat(levelAttempts[li].incorrect);
        }
      }
      priority = Array.from(new Set(priority)).filter(w => uniqueWords.includes(w));
    }

    // initial pool: priority -> page words -> all unique words
    const pool = [];
    priority.forEach(w => { if (!pool.includes(w)) pool.push(w); });
    pageWords.forEach(w => { if (!pool.includes(w) && uniqueWords.includes(w)) pool.push(w); });
    uniqueWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });

    // prefer decoys not on page
    const notOnPage = uniqueWords.filter(w => !pageWords.includes(w));

    // fill up pool until target total reached
    let safe = 0;
    while (pool.length < TARGET_TOTAL && safe < 5000) {
      if (notOnPage.length > 0) {
        const pick = notOnPage.shift();
        if (!pool.includes(pick)) pool.push(pick);
      } else {
        const pick = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
        pool.push(pick);
      }
      safe++;
    }

    // final shuffle & trim
    const finalList = shuffle(pool).slice(0, TARGET_TOTAL);

    // create draggables and append alternately
    finalList.forEach((word, idx) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.word = word;

      // determine draggable image type: opposite of the slot if exists for that word
      let gridTypeForWord = gridType;
      if (gridType === "mixed") {
        const slotEl = document.querySelector(`.slot[data-word='${word}']`);
        gridTypeForWord = slotEl ? (slotEl.dataset.gridType || "clipart") : (Math.random() < 0.5 ? "clipart" : "sign");
      }

      const draggableIsSign = (gridTypeForWord === "clipart"); // show sign if grid shows clipart
      img.src = `assets/food/${draggableIsSign ? "signs" : "clipart"}/${word}${draggableIsSign ? "-sign" : ""}.png`;

      // drag and touch handlers
      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", word);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStartHandler);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      if (idx % 2 === 0) leftSigns.appendChild(wrap);
      else rightSigns.appendChild(wrap);
    });
  }

  // ----------------------------
  // Page loading logic
  // ----------------------------
  function loadPage() {
    if (currentLevel >= levelDefinitions.length) {
      endGame();
      return;
    }

    const info = levelDefinitions[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel + 1}: ${info.name} (Page ${currentPage + 1})`;

    // get 9 words for the grid (no duplicates on page)
    currentPageWords = getUniquePageWords(info.words, 9);
    correctMatches = 0;

    // build grid and draggables
    const gridType = buildGridForPage(currentPageWords, currentPage);
    buildDraggablesForPage(info, currentPageWords, gridType);

    updateScoreDisplay();
  }

  // ----------------------------
  // Google Form submission helpers
  // - per-page submission upon finishing a page (or finishing level)
  // - final submission at end of all levels (with "Finished")
  // ----------------------------
  async function submitCurrentProgressToForm(levelIdx) {
    if (typeof levelIdx !== "number" || levelIdx < 0 || levelIdx >= levelAttempts.length) return;
    const lvlAttempt = levelAttempts[levelIdx];
    const totalCorrect = lvlAttempt.correct.size;
    const totalIncorrect = lvlAttempt.incorrect.length;
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    const levelNum = levelIdx + 1;
    const pageNum = currentPage + 1; // currentPage still points to the page just completed
    const levelPageString = `L${levelNum}P${pageNum}`;

    const formData = new FormData();
    formData.append(formEntries.studentName, studentName);
    formData.append(formEntries.studentClass, studentClass);
    formData.append(formEntries.subject, "Food");
    formData.append(formEntries.currentLevel, levelPageString);
    // dynamic field keys exist in mapping
    const correctKey = formEntries[`level${levelIdx + 1}Correct`];
    const incorrectKey = formEntries[`level${levelIdx + 1}Incorrect`];
    if (correctKey) formData.append(correctKey, Array.from(lvlAttempt.correct).join(","));
    if (incorrectKey) formData.append(incorrectKey, lvlAttempt.incorrect.join(","));
    formData.append(formEntries.timeTaken, Math.floor((Date.now() - startTime) / 1000));
    formData.append(formEntries.percentage, percent);

    // fire and forget; catch errors but don't throw
    try {
      await fetch(formURL, { method: "POST", body: formData, mode: "no-cors" });
    } catch (err) {
      // no-cors may throw in dev — ignore
      console.warn("Form submit (level) error:", err);
    }
  }

  async function submitFinalResultsToForm() {
    const totalCorrect = levelAttempts.reduce((s, l) => s + l.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    const formData = new FormData();
    formData.append(formEntries.studentName, studentName);
    formData.append(formEntries.studentClass, studentClass);
    formData.append(formEntries.subject, "Food");

    // put "Finished" into the same currentLevel field
    formData.append(formEntries.currentLevel, "Finished");

    formData.append(formEntries.totalCorrect, totalCorrect);
    formData.append(formEntries.totalIncorrect, totalIncorrect);
    formData.append(formEntries.percentage, percent);
    formData.append(formEntries.timeTaken, Math.floor((Date.now() - startTime) / 1000));

    for (let i = 0; i < levelAttempts.length; i++) {
      const lvl = levelAttempts[i];
      const keyC = formEntries[`level${i + 1}Correct`];
      const keyI = formEntries[`level${i + 1}Incorrect`];
      if (keyC) formData.append(keyC, Array.from(lvl.correct).join(","));
      if (keyI) formData.append(keyI, lvl.incorrect.join(","));
    }

    // for now 'Errors Reviewed' keeps N/A or aggregated from review flow if you implement it
    formData.append(formEntries.errorsReviewed, "N/A");

    try {
      await fetch(formURL, { method: "POST", body: formData, mode: "no-cors" });
    } catch (err) {
      console.warn("Final form submit failed:", err);
    }
  }

// ----------------------------
// End game / Finish button
// ----------------------------

  if (finishBtn) {
    finishBtn.addEventListener("click", async () => {
      gameEnded = true;
      saveProgress();
      await submitFinalResultsToForm();
      showEndMenu();
    });
  }

  function showEndMenu() {
    const hubUrl = "../hub.html";
    document.body.classList.add("game-finished");

    const endOverlay = document.createElement("div");
    Object.assign(endOverlay.style, {
      position: "fixed",
      left: 0, right: 0, top: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000
    });

    const container = document.createElement("div");
    Object.assign(container.style, {
      background: "#fff",
      padding: "20px",
      borderRadius: "10px",
      textAlign: "center",
      width: "min(520px, 92%)"
    });

    // Auslan clap GIF
    const clapImg = document.createElement("img");
    clapImg.src = "assets/auslan-clap.gif";
    clapImg.alt = "Well done!";
    clapImg.className = "end-clap";
    container.appendChild(clapImg);

    // Title
    const title = document.createElement("h2");
    title.innerText = "Well done!";
    container.appendChild(title);

    // Score & Time
    const scoreP = document.createElement("p");
    scoreP.innerText = `Score: ${getTotalCorrect()} correct, ${getTotalIncorrect()} incorrect`;
    scoreP.className = "end-score";
    container.appendChild(scoreP);

    const timeP = document.createElement("p");
    timeP.innerText = `Time: ${Math.floor((Date.now() - startTime) / 1000)}s`;
    timeP.className = "end-time";
    container.appendChild(timeP);

    // Clone images (grid + draggables) at 120px
    const cloneContainer = document.createElement("div");
    cloneContainer.className = "end-clone-container";
    const allImages = document.querySelectorAll(".slot, .draggable img");
    allImages.forEach(img => {
      const clone = img.cloneNode(true);
      clone.style.width = "120px";
      clone.style.height = "120px";
      clone.style.objectFit = "contain";
      cloneContainer.appendChild(clone);
    });
    container.appendChild(cloneContainer);

    // Buttons
    const buttons = document.createElement("div");
    buttons.className = "end-buttons";

    // Continue
    const contImg = document.createElement("img");
    contImg.src = "assets/continue.png";
    contImg.className = "modal-button";
    contImg.addEventListener("click", () => {
      document.body.removeChild(endOverlay);
      loadPage();
    });

    // Again (reset all)
    const againImg = document.createElement("img");
    againImg.src = "assets/again.png";
    againImg.className = "modal-button";
    againImg.addEventListener("click", () => {
      localStorage.removeItem(SAVE_KEY);
      for (let i = 0; i < levelAttempts.length; i++) {
        levelAttempts[i] = { correct: new Set(), incorrect: [] };
      }
      currentLevel = 0;
      currentPage = 0;
      startTime = Date.now();
      gameEnded = false;
      document.body.removeChild(endOverlay);
      loadPage();
    });

    // Menu
    const menuImg = document.createElement("img");
    menuImg.src = "assets/menu.png";
    menuImg.className = "modal-button";
    menuImg.addEventListener("click", () => window.location.href = hubUrl);

    // Logout
    const logoutImg = document.createElement("img");
    logoutImg.src = "assets/logout.png";
    logoutImg.className = "modal-button";
    logoutImg.addEventListener("click", async () => {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentClass");
      await submitFinalResultsToForm();
      window.location.href = "../index.html";
    });

    buttons.appendChild(contImg);
    buttons.appendChild(againImg);
    buttons.appendChild(menuImg);
    buttons.appendChild(logoutImg);
    container.appendChild(buttons);

    endOverlay.appendChild(container);
    document.body.appendChild(endOverlay);
  }

  function getTotalCorrect() {
    return levelAttempts.reduce((sum, l) => sum + l.correct.size, 0);
  }

  function getTotalIncorrect() {
    return levelAttempts.reduce((sum, l) => sum + l.incorrect.length, 0);
  }

  // ----------------------------
  // Start
  // ----------------------------
  const saved = restoreProgressFromData(JSON.parse(localStorage.getItem(SAVE_KEY)));
  loadPage();
});
