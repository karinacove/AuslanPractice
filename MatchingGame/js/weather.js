document.addEventListener("DOMContentLoaded", function () {
  // ----------------------------
  // Student gating (must be set earlier)
  // ----------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    // redirect to entry page if missing
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

  // Buttons in your HTML (stop image / continue / again / finish / logout)
  const stopBtn = document.getElementById("stop-btn");
  const continueBtn = document.getElementById("continue-btn");
  const againBtn = document.getElementById("again-btn");
  const finishBtn = document.getElementById("finish-btn");

  const modal = document.getElementById("end-modal");
  const endModalContent = document.getElementById("end-modal-content");

  studentInfoEl && (studentInfoEl.innerText = `${studentName} (${studentClass})`);

  // ----------------------------
  // Game configuration and state
  // ----------------------------
  const SAVE_KEY = "weatherGameSave_v1";

  const wordBanks = {
    1: ["sunny","windy","weather","cyclone","earthquake","hot","cold","snowy","rainy","stormy","rainbow","cloudy"],
    2: ["sunny","windy","weather","cyclone","earthquake","hot","cold","snowy","rainy","stormy","rainbow","cloudy"],
    3: ["hat","shirt","shorts","thongs","bathers","skirt","jumper","thongs","pants","shoes","socks","jacket","umbrella","scarf","beanie","gloves","clothes"],
    4: ["hat","shirt","shorts","thongs","bathers","skirt","jumper","thongs","pants","shoes","socks","jacket","umbrella","scarf","beanie","gloves","clothes"],
    5: ["sunny","windy","weather","cyclone","earthquake","hot","cold","snowy","rainy","stormy","rainbow","cloudy","hat","shirt","shorts","thongs","bathers","skirt","jumper","thongs","pants","shoes","socks","jacket","umbrella","scarf","beanie","gloves","clothes"],
    6: ["sunny","windy","weather","cyclone","earthquake","hot","cold","snowy","rainy","stormy","rainbow","cloudy","hat","shirt","shorts","thongs","bathers","skirt","jumper","thongs","pants","shoes","socks","jacket","umbrella","scarf","beanie","gloves","clothes"]
  };

  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Weather" },
    { words: wordBanks[2], pages: 3, name: "Weather" },
    { words: wordBanks[3], pages: 3, name: "Clothing" },
    { words: wordBanks[4], pages: 3, name: "Clothing" },
    { words: wordBanks[5], pages: 3, name: "Mixed" },
    { words: wordBanks[6], pages: 3, name: "Mixed" }
  ];

  // Game state:
  let currentLevel = 0;          // 0..5
  let currentPage = 0;           // 0..2
  let currentPageWords = [];     // 9 words on grid
  let correctMatches = 0;        // correct slots this page
  let gameEnded = false;
  let startTime = Date.now();
  let elapsedTime = 0;
  let timerInterval = null;

  const levelAttempts = Array(levelDefinitions.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // Feedback image element (correct/wrong)
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "200px",
    display: "none",
    zIndex: "9999",
    pointerEvents: "none"
  });
  document.body.appendChild(feedbackImage);

  // ----------------------------
  // Google Form mapping (your values)
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
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function calculatePercent() {
    const totalCorrect = levelAttempts.reduce((s, l) => s + l.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
    if (totalCorrect + totalIncorrect === 0) return 0;
    return Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100);
  }

  function updateScoreDisplay() {
    const percent = calculatePercent();
    if (scoreDisplayEl) scoreDisplayEl.innerText = `Score: ${percent}%`;
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => { feedbackImage.style.display = "none"; }, 900);
  }

  // ----------------------------
  // Timer
  // ----------------------------
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const start = Date.now() - (elapsedTime * 1000);
    timerInterval = setInterval(() => {
      elapsedTime = Math.floor((Date.now() - start) / 1000);
    }, 1000);
  }

  function pauseTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function resumeTimer() {
    startTimer();
  }

  // ----------------------------
  // Save / Restore progress
  // ----------------------------
  function saveProgress() {
    // only save if there is meaningful progress
    const hasProgress = currentLevel > 0 || currentPage > 0 ||
      levelAttempts.some(l => l.correct.size > 0 || l.incorrect.length > 0) || gameEnded;
    if (!hasProgress) return;

    const data = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      startTime,
      elapsedTime,
      gameEnded,
      levelAttempts: levelAttempts.map(l => ({ correct: Array.from(l.correct), incorrect: l.incorrect }))
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("Save failed:", err);
    }
  }

  function restoreProgressFromData(data) {
    if (!data) return false;
    try {
      if (data.studentName && data.studentName !== studentName) return false;
      if (data.studentClass && data.studentClass !== studentClass) return false;

      currentLevel = typeof data.currentLevel === "number" ? data.currentLevel : 0;
      currentPage = typeof data.currentPage === "number" ? data.currentPage : 0;
      startTime = data.startTime || Date.now();
      elapsedTime = data.elapsedTime || 0;
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
    } catch (err) {
      console.warn("Restore parse failed:", err);
      return false;
    }
  }

  function restoreProgressPrompt() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (!data || data.studentName !== studentName || data.studentClass !== studentClass) return false;
      const hasMeaningful = !data.gameEnded &&
        ((data.currentLevel && data.currentLevel > 0) || (data.currentPage && data.currentPage > 0) || (Array.isArray(data.levelAttempts) && data.levelAttempts.some(l => (l.correct && l.correct.length > 0) || (l.incorrect && l.incorrect.length > 0))));
      if (!hasMeaningful) return false;

      // show friendly resume modal (image buttons)
      showResumeModal(data);
      return true;
    } catch (err) {
      console.warn("Failed to parse save:", err);
      return false;
    }
  }

  // friendly resume modal (when page loads and save exists)
  function showResumeModal(data) {
    // create overlay if no #end-modal present
    const overlay = document.createElement("div");
    overlay.id = "resume-overlay";
    Object.assign(overlay.style, {
      position: "fixed", left: 0, right: 0, top: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
      background: "#fff", padding: "20px", borderRadius: "10px", width: "min(520px,92%)", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
    });

    const title = document.createElement("h2");
    title.innerText = "Resume your game?";

    const message = document.createElement("p");
    message.innerText = "We found a saved game. Continue where you left off, or start over.";
    message.style.fontSize = "16px";

    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, { marginTop: "16px", display: "flex", gap: "16px", justifyContent: "center" });

    // continue image button
    const contImg = document.createElement("img");
    contImg.src = "assets/continue.png";
    contImg.alt = "Continue";
    contImg.style.width = "120px";
    contImg.style.height = "120px";
    contImg.style.cursor = "pointer";

    // start over image button (again)
    const startImg = document.createElement("img");
    startImg.src = "assets/again.png";
    startImg.alt = "Start Over";
    startImg.style.width = "120px";
    startImg.style.height = "120px";
    startImg.style.cursor = "pointer";

    contImg.addEventListener("click", () => {
      document.body.removeChild(overlay);
      restoreProgressFromData(data);
      // resume timer
      resumeTimer();
      loadPage();
    });

    startImg.addEventListener("click", () => {
      document.body.removeChild(overlay);
      localStorage.removeItem(SAVE_KEY);
      // reset attempts & state
      for (let i = 0; i < levelAttempts.length; i++) levelAttempts[i] = { correct: new Set(), incorrect: [] };
      currentLevel = 0; currentPage = 0; startTime = Date.now(); elapsedTime = 0; gameEnded = false;
      saveProgress();
      loadPage();
      startTimer();
    });

    btnRow.appendChild(contImg);
    btnRow.appendChild(startImg);

    box.appendChild(title);
    box.appendChild(message);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ----------------------------
  // Drag & Drop / Touch handlers
  // ----------------------------
  function dropHandler(e) {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const slot = e.currentTarget;
    const targetWord = slot?.dataset?.word;
    if (!targetWord) return;

    if (word === targetWord) {
      // correct
      if (!levelAttempts[currentLevel].correct.has(word)) levelAttempts[currentLevel].correct.add(word);

      // overlay image
      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = src;
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.objectFit = "contain";
      slot.appendChild(overlay);

      // remove draggable icons
      document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);
      updateScoreDisplay();
      saveProgress();

      const slotsOnPage = document.querySelectorAll(".slot").length;
      if (correctMatches >= slotsOnPage) {
        correctMatches = 0;
        (async () => {
          try { await submitCurrentProgressToForm(currentLevel); } catch (err) { console.warn("Submit failed:", err); }
          // advance
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
              // done all levels
              gameEnded = true;
              saveProgress();
              try { await submitFinalResultsToForm(); } catch (err) { console.warn("Final submit failed:", err); }
              showEndMenuModal(); // show modal with clap and buttons
            } else {
              setTimeout(loadPage, 700);
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
      const wrong = document.querySelector(`img.draggable[data-word='${word}']`);
      if (wrong) { wrong.classList.add("shake"); setTimeout(() => wrong.classList.remove("shake"), 400); }
    }
  }

  function touchStartHandler(e) {
    if (!e.target?.classList.contains("draggable")) return;
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
          preventDefault: () => { },
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

  // ----------------------------
  // Page helper: unique words
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

      const url = `assets/weather/${slotType === "sign" ? "signs" : "clipart"}/${word}${slotType === "sign" ? "" : ""}.png`;
      slot.style.backgroundImage = `url('${url}')`;
      slot.style.backgroundSize = "contain";
      slot.style.backgroundPosition = "center";
      slot.style.backgroundRepeat = "no-repeat";

      // attach drag/drop
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", dropHandler);

      gameBoard.appendChild(slot);
    });

    return gridType;
  }

  // ----------------------------
  // Build draggables for page
  // ----------------------------
 function buildDraggablesForPage(info, pageWords, gridType) {
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  const pairsPerSide = (currentLevel <= 2) ? 6 : 9;
  const TARGET_TOTAL = pairsPerSide * 2;

  const uniqueWords = Array.from(new Set(info.words));

  // gather priority incorrects (levels 4+)
  let priority = [];
  if (currentLevel >= 3) {
    for (let li = 0; li < currentLevel; li++) {
      if (levelAttempts[li] && Array.isArray(levelAttempts[li].incorrect)) {
        priority = priority.concat(levelAttempts[li].incorrect);
      }
    }
    priority = Array.from(new Set(priority)).filter(w => uniqueWords.includes(w));
  }

  // Build pool in order of priority → current page → rest
  let pool = [];
  priority.forEach(w => { if (!pool.includes(w)) pool.push(w); });
  pageWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });
  uniqueWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });

  // Fill with extra words if needed
  const notOnPage = uniqueWords.filter(w => !pool.includes(w));
  let safe = 0;
  while (pool.length < TARGET_TOTAL && safe < 5000) {
    if (notOnPage.length > 0) {
      const pick = notOnPage.shift();
      if (!pool.includes(pick)) pool.push(pick);
    } else {
      const pick = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
      if (!pool.includes(pick)) pool.push(pick);  // ✅ enforce uniqueness here
    }
    safe++;
  }

  // Shuffle and take only the number needed
  const finalList = shuffle(pool).slice(0, TARGET_TOTAL);

  finalList.forEach((word, idx) => {
    const img = document.createElement("img");
    img.className = "draggable";
    img.draggable = true;
    img.dataset.word = word;

    // choose draggable type opposite of slot's display type where possible
    let gridTypeForWord = gridType;
    if (gridType === "mixed") {
      const slotEl = document.querySelector(`.slot[data-word='${word}']`);
      gridTypeForWord = slotEl ? slotEl.dataset.gridType || "clipart" : (Math.random() < 0.5 ? "clipart" : "sign");
    }

    const draggableIsSign = gridTypeForWord === "clipart";
    img.src = `assets/weather/${draggableIsSign ? "signs" : "clipart"}/${word}${draggableIsSign ? "" : ""}.png`;

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

    currentPageWords = getUniquePageWords(info.words, 9);
    correctMatches = 0;

    const gridType = buildGridForPage(currentPageWords, currentPage);
    buildDraggablesForPage(info, currentPageWords, gridType);

    updateScoreDisplay();
  }

  // ----------------------------
  // Google Form submit helpers
  // ----------------------------
  async function submitCurrentProgressToForm(levelIdx) {
    if (typeof levelIdx !== "number" || levelIdx < 0 || levelIdx >= levelAttempts.length) return;
    const lvlAttempt = levelAttempts[levelIdx];
    const totalCorrect = lvlAttempt.correct.size;
    const totalIncorrect = lvlAttempt.incorrect.length;
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    const levelNum = levelIdx + 1;
    const pageNum = currentPage + 1;
    const levelPageString = `L${levelNum}P${pageNum}`;

    const fd = new FormData();
    fd.append(formEntries.studentName, studentName);
    fd.append(formEntries.studentClass, studentClass);
    fd.append(formEntries.subject, "Food");
    fd.append(formEntries.currentLevel, levelPageString);

    const correctKey = formEntries[`level${levelNum}Correct`];
    const incorrectKey = formEntries[`level${levelNum}Incorrect`];
    if (correctKey) fd.append(correctKey, Array.from(lvlAttempt.correct).join(","));
    if (incorrectKey) fd.append(incorrectKey, lvlAttempt.incorrect.join(","));

    fd.append(formEntries.timeTaken, Math.round((Date.now() - startTime) / 1000));
    fd.append(formEntries.percentage, percent);

    try {
      await fetch(formURL, { method: "POST", body: fd, mode: "no-cors" });
    } catch (err) {
      console.warn("Form submit (level) error:", err);
    }
  }

  async function submitFinalResultsToForm() {
    const totalCorrect = levelAttempts.reduce((s, l) => s + l.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    const fd = new FormData();
    fd.append(formEntries.studentName, studentName);
    fd.append(formEntries.studentClass, studentClass);
    fd.append(formEntries.subject, "Weather");
    fd.append(formEntries.currentLevel, "Finished");
    fd.append(formEntries.totalCorrect, totalCorrect);
    fd.append(formEntries.totalIncorrect, totalIncorrect);
    fd.append(formEntries.percentage, percent);
    fd.append(formEntries.timeTaken, Math.round((Date.now() - startTime) / 1000));

    for (let i = 0; i < levelAttempts.length; i++) {
      const lvl = levelAttempts[i];
      const keyC = formEntries[`level${i + 1}Correct`];
      const keyI = formEntries[`level${i + 1}Incorrect`];
      if (keyC) fd.append(keyC, Array.from(lvl.correct).join(","));
      if (keyI) fd.append(keyI, lvl.incorrect.join(","));
    }

    fd.append(formEntries.errorsReviewed, "N/A");

    try {
      await fetch(formURL, { method: "POST", body: fd, mode: "no-cors" });
    } catch (err) {
      console.warn("Final form submit failed:", err);
    }
  }

  // ----------------------------
  // End game / show modal with clap and buttons
  // ----------------------------
  function clearProgress(alsoClearStudent = false) {
    // remove save key and optionally student info
    try {
      localStorage.removeItem(SAVE_KEY);
      if (alsoClearStudent) {
        localStorage.removeItem("studentName");
        localStorage.removeItem("studentClass");
      }
    } catch (err) { /* ignore */ }
  }

  async function endGame() {
    if (gameEnded) return;
    gameEnded = true;
    pauseTimer();
    saveProgress();
    try {
      await submitFinalResultsToForm();
    } catch (err) {
      console.warn("Final submit failed:", err);
    }
    showEndMenuModal();
  }

  // show the end modal/overlay with clap gif, score/time and action buttons
  function showEndMenuModal() {
    // prefer existing modal container if present
    let overlay;
    if (modal) {
      modal.style.display = "flex";
      // clear previous content inside #end-modal-content
      if (endModalContent) endModalContent.innerHTML = "";
      overlay = endModalContent || modal;
    } else {
      overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed", left: 0, right: 0, top: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000
      });
    }

    // create container (if using endModalContent, we append inside that)
    const container = document.createElement("div");
    Object.assign(container.style, {
      background: "#fff", padding: "20px", borderRadius: "12px", textAlign: "center", width: "min(520px, 92%)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
    });

    // clap gif
    const clapImg = document.createElement("img");
    clapImg.src = "assets/auslan-clap.gif";
    clapImg.alt = "Well done!";
    clapImg.style.width = "120px"; // keep at 120px as requested
    clapImg.style.height = "120px";
    clapImg.style.objectFit = "contain";
    clapImg.style.display = "block";
    clapImg.style.margin = "0 auto 8px";

    const title = document.createElement("h2");
    title.innerText = "Well done!";

    const scoreP = document.createElement("p");
    scoreP.innerText = `Score: ${getTotalCorrect()} correct, ${getTotalIncorrect()} incorrect`;

    const timeP = document.createElement("p");
    timeP.innerText = `Time: ${Math.floor(elapsedTime)}s`;

    // buttons row
    const buttons = document.createElement("div");
    Object.assign(buttons.style, { display: "flex", justifyContent: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" });

    // Continue (resume) — should not submit
    const contImg = document.createElement("img");
    contImg.src = "assets/continue.png";
    contImg.alt = "Continue";
    contImg.style.width = "120px";
    contImg.style.height = "120px";
    contImg.style.cursor = "pointer";
    contImg.addEventListener("click", () => {
      // hide modal/overlay
      if (modal) modal.style.display = "none";
      else overlay.remove();
      // resume timer and game
      resumeTimer();
    });

    // Again — submit results, clear progress (but keep student info), restart
    const againImg = document.createElement("img");
    againImg.src = "assets/again.png";
    againImg.alt = "Again";
    againImg.style.width = "120px";
    againImg.style.height = "120px";
    againImg.style.cursor = "pointer";
    againImg.addEventListener("click", async () => {
      // submit current results, then clear save and restart
      try { await submitFinalResultsToForm(); } catch (err) { console.warn("Submit failed:", err); }
      clearProgress(false); // remove save, keep student info
      // reset attempts
      for (let i = 0; i < levelAttempts.length; i++) levelAttempts[i] = { correct: new Set(), incorrect: [] };
      currentLevel = 0; currentPage = 0; correctMatches = 0; gameEnded = false; startTime = Date.now(); elapsedTime = 0;
      if (modal) modal.style.display = "none";
      else overlay.remove();
      saveProgress();
      loadPage();
      startTimer();
    });

    // Finish — submit results, clear save (but keep student info), show clap then go to hub
const finishImg = document.createElement("img");
finishImg.src = "assets/finish.png";
finishImg.alt = "Finish";
finishImg.style.width = "120px";
finishImg.style.height = "120px";
finishImg.style.cursor = "pointer";
finishImg.addEventListener("click", async () => {
  try {
    await submitFinalResultsToForm();
  } catch (err) {
    console.warn("Submit failed:", err);
  }
  clearProgress(); // keep student name/class
  window.location.href = "../index.html";
});

// add finish button to modal
buttons.appendChild(finishImg);

    // append buttons — per your request include continue & again and exclude the separate menu button
    buttons.appendChild(contImg);
    buttons.appendChild(againImg);
    buttons.appendChild(finishImg);

    container.appendChild(clapImg);
    container.appendChild(title);
    container.appendChild(scoreP);
    container.appendChild(timeP);
    container.appendChild(buttons);

    if (modal && endModalContent) {
      endModalContent.appendChild(container);
    } else {
      overlay.appendChild(container);
      document.body.appendChild(overlay);
    }
  }

  // helpers for totals
  function getTotalCorrect() {
    return levelAttempts.reduce((s, l) => s + l.correct.size, 0);
  }
  function getTotalIncorrect() {
    return levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
  }

  // ----------------------------
  // Buttons logic (main UI)
  // ----------------------------
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      // Pause & show modal
      pauseTimer();
      // set elapsedTime (already being updated by timer)
      showEndMenuModal();
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
      resumeTimer();
    });
  }

  if (againBtn) {
    againBtn.addEventListener("click", async () => {
      // Submit results, clear save (but keep student info), restart game
      try { await submitFinalResultsToForm(); } catch (err) { console.warn("Submit failed:", err); }
      clearProgress(false);
      // reset attempts
      for (let i = 0; i < levelAttempts.length; i++) levelAttempts[i] = { correct: new Set(), incorrect: [] };
      currentLevel = 0; currentPage = 0; correctMatches = 0; gameEnded = false; startTime = Date.now(); elapsedTime = 0;
      saveProgress();
      loadPage();
      startTimer();
      if (modal) modal.style.display = "none";
    });
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", async () => {
      // Submit final, clear save (keeping student info), show clap and go to hub
      try { await submitFinalResultsToForm(); } catch (err) { console.warn("Submit failed:", err); }
      clearProgress(false);
      // show clap GIF briefly
      const big = document.createElement("img");
      big.src = "assets/auslan-clap.gif";
      big.style.width = "180px";
      big.style.height = "180px";
      big.style.objectFit = "contain";
      big.style.position = "fixed";
      big.style.left = "50%";
      big.style.top = "50%";
      big.style.transform = "translate(-50%,-50%)";
      big.style.zIndex = 20000;
      document.body.appendChild(big);
      setTimeout(() => { big.remove(); window.location.href = "../MatchingGame/hub.html"; }, 2000);
    });
  }

  // ----------------------------
  // Init: restore or fresh start
  // ----------------------------
  (function init() {
    const raw = localStorage.getItem(SAVE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const resumed = restoreProgressFromData(saved);
    if (!resumed) {
      // fresh start
      currentLevel = 0; currentPage = 0; startTime = Date.now(); elapsedTime = 0;
      for (let i = 0; i < levelAttempts.length; i++) levelAttempts[i] = { correct: new Set(), incorrect: [] };
    }
    loadPage();
    startTimer();
    // autosave periodically & on unload
    setInterval(saveProgress, 15000);
    window.addEventListener("beforeunload", saveProgress);
  })();

  // ----------------------------
  // Restart helper
  // ----------------------------
  function restartGame() {
    currentLevel = 0; currentPage = 0; correctMatches = 0; gameEnded = false;
    startTime = Date.now(); elapsedTime = 0;
    levelAttempts.forEach(l => { l.correct.clear(); l.incorrect = []; });
    saveProgress();
    loadPage();
    updateScoreDisplay();
  }

  // ----------------------------
  // Minimal clap helper (if you use it elsewhere)
  // ----------------------------
  function showClapGIF(duration = 2000) {
    const gif = document.createElement("img");
    gif.src = "assets/auslan-clap.gif";
    gif.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:180px;height:180px;z-index:9999;object-fit:contain;";
    document.body.appendChild(gif);
    setTimeout(() => gif.remove(), duration);
  }

  // ----------------------------
  // Expose internals for debugging (optional)
  // ----------------------------
  window._foodGame = {
    saveProgress,
    restoreProgressFromData,
    getState: () => ({ currentLevel, currentPage, levelAttempts, elapsedTime }),
    loadPage,
    restartGame,
    endGame
  };
  
  // Zoom -------
  let lastTap = 0;
  let zoomedIn = false;

document.addEventListener("touchend", function (event) {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;

  if (tapLength < 300 && tapLength > 0) { // double tap within 300ms
    event.preventDefault();

    if (!zoomedIn) {
      document.body.style.transform = "scale(1.5)";
      document.body.style.transformOrigin = "center center";
      document.body.style.transition = "transform 0.3s ease";
      zoomedIn = true;
    } else {
      document.body.style.transform = "scale(1)";
      zoomedIn = false;
    }
  }

  lastTap = currentTime;
});

});
