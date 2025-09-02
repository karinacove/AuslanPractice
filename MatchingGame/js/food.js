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
  const stopBtn = document.getElementById("stop-btn"); // <-- updated button

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

// ============================
// Drag & Drop + Touch Handlers
// ============================

function dropHandler(e) {
  e.preventDefault();
  const word = e.dataTransfer.getData("text/plain");
  const src = e.dataTransfer.getData("src");
  const slot = e.currentTarget;
  const targetWord = slot?.dataset?.word;
  if (!targetWord) return;

  if (word === targetWord) {
    // Add correct attempt
    if (!levelAttempts[currentLevel].correct.has(word)) {
      levelAttempts[currentLevel].correct.add(word);
    }

    // Overlay image
    slot.innerHTML = "";
    const overlay = document.createElement("img");
    overlay.className = "overlay";
    overlay.src = src;
    slot.appendChild(overlay);

    // Remove draggable images
    document.querySelectorAll(`img.draggable[data-word='${word}']`)?.forEach(el => el.remove());

    correctMatches++;
    showFeedback(true);
    updateScoreDisplay();
    saveProgress();

    // Check if page complete
    const slotsOnPage = document.querySelectorAll(".slot").length;
    if (correctMatches >= slotsOnPage) {
      correctMatches = 0;
      nextPageOrLevel();
    }

  } else {
    // Incorrect attempt
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

// ============================
// Touch Support
// ============================
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
    if (el?.classList.contains("slot")) {
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

// ============================
// Page Grid & Draggables
// ============================

function getUniquePageWords(words, n = 9) {
  const picked = [];
  const pool = shuffle(words);
  let i = 0;
  while (picked.length < n && i < 10000) {
    const candidate = pool[i % pool.length];
    if (!picked.includes(candidate)) picked.push(candidate);
    i++;
  }
  return shuffle(picked);
}

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

    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", dropHandler);
  });

  return gridType;
}

function buildDraggablesForPage(info, pageWords, gridType) {
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  const pairsPerSide = (currentLevel <= 2) ? 6 : 9;
  const TARGET_TOTAL = pairsPerSide * 2;

  const uniqueWords = Array.from(new Set(info.words));
  let pool = [];

  // Priority: incorrect words from previous levels
  if (currentLevel >= 3) {
    let priority = [];
    for (let li = 0; li < currentLevel; li++) {
      if (levelAttempts[li]?.incorrect?.length) priority = priority.concat(levelAttempts[li].incorrect);
    }
    priority = Array.from(new Set(priority)).filter(w => uniqueWords.includes(w));
    pool.push(...priority);
  }

  pageWords.forEach(w => { if (!pool.includes(w) && uniqueWords.includes(w)) pool.push(w); });
  uniqueWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });

  const notOnPage = uniqueWords.filter(w => !pageWords.includes(w));
  let safe = 0;
  while (pool.length < TARGET_TOTAL && safe < 5000) {
    if (notOnPage.length > 0) pool.push(notOnPage.shift());
    else pool.push(uniqueWords[Math.floor(Math.random() * uniqueWords.length)]);
    safe++;
  }

  const finalList = shuffle(pool).slice(0, TARGET_TOTAL);

  finalList.forEach((word, idx) => {
    const img = document.createElement("img");
    img.className = "draggable";
    img.draggable = true;
    img.dataset.word = word;

    let gridTypeForWord = gridType;
    if (gridType === "mixed") {
      const slotEl = document.querySelector(`.slot[data-word='${word}']`);
      gridTypeForWord = slotEl?.dataset?.gridType || "clipart";
    }

    const isSign = gridTypeForWord === "sign";
    img.src = `assets/food/${isSign ? "signs" : "clipart"}/${word}${isSign ? "-sign" : ""}.png`;

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

// ============================
// Page Loading & Progression
// ============================

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

async function nextPageOrLevel() {
  try { await submitCurrentProgressToForm(currentLevel); }
  catch (err) { console.warn("Submit failed, continuing:", err); }

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
      gameEnded = true;
      saveProgress();
      try { await submitFinalResultsToForm(); } catch (err) { console.warn("Final submit failed:", err); }
      if (modal) modal.style.display = "flex";
      showEndMenu();
    } else {
      setTimeout(loadPage, 700);
    }
  }
}

// ============================
// Google Form Submission
// ============================

async function submitCurrentProgressToForm(levelIdx) {
  if (typeof levelIdx !== "number" || levelIdx < 0 || levelIdx >= levelAttempts.length) return;

  const lvlAttempt = levelAttempts[levelIdx];
  const totalCorrect = lvlAttempt.correct.size;
  const totalIncorrect = lvlAttempt.incorrect.length;
  const percent = totalCorrect + totalIncorrect > 0
    ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
    : 0;

  const levelNum = levelIdx + 1;
  const pageNum = currentPage + 1;
  const levelPageString = `L${levelNum}P${pageNum}`;

  const formData = new FormData();
  formData.append(formEntries.studentName, studentName);
  formData.append(formEntries.studentClass, studentClass);
  formData.append(formEntries.subject, "Food");
  formData.append(formEntries.currentLevel, levelPageString);

  const correctKey = formEntries[`level${levelNum}Correct`];
  const incorrectKey = formEntries[`level${levelNum}Incorrect`];
  formData.append(correctKey, Array.from(lvlAttempt.correct).join(","));
  formData.append(incorrectKey, lvlAttempt.incorrect.join(","));
  formData.append(formEntries.percentage, percent);
  formData.append(formEntries.timeTaken, Math.round((Date.now() - startTime) / 1000));

  await fetch(formURL, { method: "POST", body: formData, mode: "no-cors" });
}

async function submitFinalResultsToForm() {
  const totalCorrect = levelAttempts.reduce((s, l) => s + l.correct.size, 0);
  const totalIncorrect = levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
  const percent = totalCorrect + totalIncorrect === 0 ? 0 : Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100);
  const timeTaken = Math.round((Date.now() - startTime) / 1000);

  const formData = new FormData();
  formData.append(formEntries.studentName, studentName);
  formData.append(formEntries.studentClass, studentClass);
  formData.append(formEntries.subject, "Food");
  formData.append(formEntries.totalCorrect, totalCorrect);
  formData.append(formEntries.totalIncorrect, totalIncorrect);
  formData.append(formEntries.percentage, percent);
  formData.append(formEntries.timeTaken, timeTaken);

  levelAttempts.forEach((lvl, idx) => {
    const n = idx + 1;
    formData.append(formEntries[`level${n}Correct`], Array.from(lvl.correct).join(","));
    formData.append(formEntries[`level${n}Incorrect`], lvl.incorrect.join(","));
  });

  await fetch(formURL, { method: "POST", body: formData, mode: "no-cors" });
}

// ----------------------------
// End Game / Pause Modal Logic
// ----------------------------
function endGame() {
  gameEnded = true;
  pauseGame(); // stop timer
  saveProgress();
  submitFinalResultsToForm().catch(err => console.warn("Final submit failed:", err));

  if (modal) modal.style.display = "flex";

  // Show all modal buttons
  continueBtn.style.display = "inline-block"; // Resume game
  finishBtn.style.display = "inline-block";   // Submit and go to menu
  againBtn.style.display = "inline-block";    // Restart game
  logoutBtn.style.display = "inline-block";   // Logout
}

// ----------------------------
// Stop Button — pauses game
// ----------------------------
if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    endGame();
  });
}

// ----------------------------
// Continue Button — resumes game
// ----------------------------
if (continueBtn) {
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    resumeGame();
  });
}

// ----------------------------
// Finish Button — submit, show clap GIF, go to menu
// ----------------------------
if (finishBtn) {
  finishBtn.addEventListener("click", async () => {
    modal.style.display = "none";
    showClapGIF(); // function displays auslan-clap.gif

    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 sec delay
    window.location.href = "../hub.html";
  });
}

// ----------------------------
// Again Button — submit results, restart game
// ----------------------------
if (againBtn) {
  againBtn.addEventListener("click", async () => {
    saveProgress();
    await submitFinalResultsToForm();
    restartGame(); // resets game state and UI
    modal.style.display = "none";
    startTimer();   // start timer fresh
  });
}

// ----------------------------
// Logout Button — submit results and log out
// ----------------------------
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    saveProgress();
    await submitFinalResultsToForm();
    window.location.href = "../index.html";
  });
}

// ----------------------------
// Timer handling
// ----------------------------
let timerInterval = null;
let elapsedTime = 0; // in seconds

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const start = Date.now() - elapsedTime * 1000;

  timerInterval = setInterval(() => {
    elapsedTime = Math.floor((Date.now() - start) / 1000);
    // Update any timer display if needed
    // Example: scoreDisplayEl.innerText = `Score: ${calculatePercent()}% | Time: ${elapsedTime}s`;
  }, 1000);
}

function pauseGame() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resumeGame() {
  gameEnded = false;

  // Re-enable draggables
  document.querySelectorAll(".draggable").forEach(el => {
    el.draggable = true;
    el.style.pointerEvents = "auto";
  });

  // Re-enable drop zones
  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", dropHandler);
  });

  // Resume timer
  startTimer();

  // Refresh score display if needed
  updateScoreDisplay();
}

// ----------------------------
// Initialize game
// ----------------------------
const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
if (!restoreProgressFromData(saved)) {
  currentLevel = 0;
  currentPage = 0;
  startTime = Date.now();
}

loadPage();
startTimer(); // start timer at game start
