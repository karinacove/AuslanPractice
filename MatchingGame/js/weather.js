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
  const GAME_TOPIC = "Weather";

  const wordBanks = {
    1: ["sunny","windy","weather","cyclone","earthquake","hot","cold","snowy","rain","lightning","rainbow","cloudy"],
    2: ["hat","shirt","short","thong","bathers","skirt","jumper","pants","shoes","socks","jacket","umbrella","scarf","beanie","gloves","clothes","dress"],
    3: ["sunny","windy","weather","cyclone","earthquake","hot","cold","snowy","rain","lightning","rainbow","cloudy","hat","shirt","short","thong","bathers","dress","skirt","jumper","pants","shoes","socks","jacket","umbrella","scarf","beanie","gloves","clothes"]
  };

  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Weather" },
    { words: wordBanks[2], pages: 3, name: "Clothing" },
    { words: wordBanks[3], pages: 3, name: "Mixed" }
  ];

  let currentLevel = 0;
  let currentPage = 0;
  let currentPageWords = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  let elapsedTime = 0;
  let timerInterval = null;

  const levelAttempts = Array(levelDefinitions.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // =======================
  // GOOGLE FORM FIELD MAP
  // =======================
  const FORM_FIELDS = {
    name: "entry.1387461004",
    class: "entry.1309291707",
    topic: "entry.477642881",
    percentage: "entry.1996137354",
    time: "entry.1374858042",
    highestLevel: "entry.750436458",
    level1Correct: "entry.1897227570",
    level1Incorrect: "entry.1249394203",
    level2Correct: "entry.1116300030",
    level2Incorrect: "entry.1551220511",
    level3Correct: "entry.187975538",
    level3Incorrect: "entry.903633326",
    level4Correct: "entry.1880514176",
    level4Incorrect: "entry.856597282",
    level5Correct: "entry.497882042",
    level5Incorrect: "entry.552536101",
    level6Correct: "entry.1591755601",
    level6Incorrect: "entry.922308538"
  };

  // ----------------------------
  // Feedback image
  // ----------------------------
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
    } catch (err) { console.warn("Save failed:", err); }
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

  // ----------------------------
  // Drag & Drop / Touch handlers
  // ----------------------------
  function dropHandler(e) {
    e.preventDefault && e.preventDefault();
    const dt = e.dataTransfer || (e.data && e.dataTransfer) || (e.dataTransfer === undefined ? e : null);
    const getData = dt && typeof dt.getData === "function" ? k => dt.getData(k) : k => "";
    const word = getData("text/plain");
    const src = getData("src") || "";
    const slot = e.currentTarget;
    const targetWord = slot && (slot.dataset.word || slot.dataset.expected || slot.dataset.weather);
    if (!targetWord) return;

    if (word === targetWord) {
      if (!levelAttempts[currentLevel].correct.has(word)) levelAttempts[currentLevel].correct.add(word);
      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = src || (slot.dataset.gridType === "sign" ? `assets/weather/signs/${word}.png` : `assets/weather/clipart/${word}.png`);
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.objectFit = "contain";
      slot.appendChild(overlay);
      slot.dataset.filled = "true";

      document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);
      updateScoreDisplay();
      saveProgress();

      const slotsOnPage = document.querySelectorAll(".slot").length;
      const filledCount = Array.from(document.querySelectorAll(".slot")).filter(s => s.dataset.filled === "true").length;
      if (filledCount >= slotsOnPage) {
        correctMatches = 0;
        (async () => {
          try { await submitGoogleForm(); } catch (err) { console.warn("Submit failed:", err); }
          currentPage++;
          const info = levelDefinitions[currentLevel];
          if (currentPage < (info && info.pages ? info.pages : 1)) {
            saveProgress();
            setTimeout(loadPage, 700);
          } else {
            currentLevel++;
            currentPage = 0;
            saveProgress();
            if (currentLevel >= levelDefinitions.length) {
              gameEnded = true;
              saveProgress();
              try { await submitGoogleForm(); } catch (err) { console.warn("Final submit failed:", err); }
              showEndMenuModal();
            } else {
              setTimeout(loadPage, 700);
            }
          }
        })();
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(word);
      showFeedback(false);
      updateScoreDisplay();
      saveProgress();
      const wrong = document.querySelector(`img.draggable[data-word='${word}']`);
      if (wrong) { wrong.classList.add("shake"); setTimeout(() => wrong.classList.remove("shake"), 400); }
    }
  }

  // ----------------------------
  // Touch-drag simulation
  // ----------------------------
  let _touchState = null;
  function touchStartHandler(ev) {
    if (!ev || !ev.touches || ev.touches.length === 0) return;
    const target = ev.currentTarget || ev.target;
    if (!target || !target.classList.contains("draggable")) return;
    ev.preventDefault();

    const word = target.dataset.word;
    const src = target.src || "";
    const clone = target.cloneNode(true);
    Object.assign(clone.style, {
      position: "fixed",
      left: "0px",
      top: "0px",
      pointerEvents: "none",
      opacity: "0.95",
      zIndex: 10000,
      transform: "translate(-50%,-50%)"
    });
    const rect = target.getBoundingClientRect();
    const cw = Math.min(rect.width || 100, 140);
    clone.style.width = cw + "px";
    clone.style.height = "auto";
    document.body.appendChild(clone);

    function moveClone(touch) { if (!touch) return; clone.style.left = `${touch.clientX}px`; clone.style.top = `${touch.clientY}px`; }
    moveClone(ev.touches[0]);

    _touchState = { word, src, clone, origin: target };

    const onMove = (mEv) => { mEv.preventDefault && mEv.preventDefault(); moveClone(mEv.touches[0]); };
    const onEnd = (endEv) => {
      endEv.preventDefault && endEv.preventDefault();
      const t = endEv.changedTouches && endEv.changedTouches[0];
      if (t) {
        let el = document.elementFromPoint(t.clientX, t.clientY);
        while (el && !el.classList.contains("slot")) el = el.parentElement;
        if (el && el.classList.contains("slot")) {
          dropHandler({ preventDefault: () => {}, currentTarget: el, dataTransfer: { getData: (k) => k === "text/plain" ? word : k === "src" ? src : "" } });
        } else {
          const original = document.querySelector(`img.draggable[data-word='${word}']`);
          if (original) { original.classList.add("shake"); setTimeout(() => original.classList.remove("shake"), 400); }
        }
      }
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      if (_touchState && _touchState.clone) _touchState.clone.remove();
      _touchState = null;
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
      const url = `assets/weather/${slotType === "sign" ? "signs" : "clipart"}/${word}.png`;
      slot.style.backgroundImage = `url('${url}')`;
      slot.style.backgroundSize = "contain";
      slot.style.backgroundPosition = "center";
      slot.style.backgroundRepeat = "no-repeat";
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", dropHandler);
      gameBoard.appendChild(slot);
    });
    return gridType;
  }

  // ----------------------------
  // Build draggables
  // ----------------------------
  function buildDraggablesForPage(info, pageWords, gridType) {
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    const pairsPerSide = (currentLevel <= 2) ? 6 : 9;
    const TARGET_TOTAL = pairsPerSide * 2;
    const uniqueWords = Array.from(new Set(info.words));

    let priority = [];
    if (currentLevel >= 3) {
      for (let li = 0; li < currentLevel; li++) {
        if (levelAttempts[li] && Array.isArray(levelAttempts[li].incorrect)) {
          priority = priority.concat(levelAttempts[li].incorrect);
        }
      }
      priority = Array.from(new Set(priority)).filter(w => uniqueWords.includes(w));
    }

    let pool = [];
    priority.forEach(w => { if (!pool.includes(w)) pool.push(w); });
    pageWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });
    uniqueWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });

    const notOnPage = uniqueWords.filter(w => !pool.includes(w));
    let safe = 0;
    while (pool.length < TARGET_TOTAL && safe < 5000) {
      if (notOnPage.length > 0) pool.push(notOnPage.shift());
      else { const pick = uniqueWords[Math.floor(Math.random() * uniqueWords.length)]; if (!pool.includes(pick)) pool.push(pick); }
      safe++;
    }

    pageWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });
    const shuffled = shuffle(pool);
    const mustHave = new Set(pageWords);
    const keep = [];
    shuffled.forEach(w => { if (mustHave.has(w) && keep.length < TARGET_TOTAL) keep.push(w); });
    shuffled.forEach(w => { if (!mustHave.has(w) && keep.length < TARGET_TOTAL) keep.push(w); });
    const draggablesToUse = keep.slice(0, TARGET_TOTAL);

    draggablesToUse.forEach((word, idx) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.word = word;
      let gridTypeForWord = gridType;
      if (gridType === "mixed") {
        const slotEl = document.querySelector(`.slot[data-word='${word}']`);
        gridTypeForWord = slotEl ? (slotEl.dataset.gridType || "clipart") : (Math.random() < 0.5 ? "clipart" : "sign");
      }
      const draggableIsSign = (gridTypeForWord === "clipart");
      const folder = draggableIsSign ? "signs" : "clipart";
      img.src = `assets/weather/${folder}/${word}.png`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", word);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStartHandler);
      if (idx % 2 === 0) leftSigns.appendChild(img);
      else rightSigns.appendChild(img);
    });
  }

  // ----------------------------
  // Load page
  // ----------------------------
  function loadPage() {
    if (gameEnded) return;
    const info = levelDefinitions[currentLevel];
    if (!info) { gameEnded = true; showEndMenuModal(); return; }
    currentPageWords = getUniquePageWords(info.words, 9);
    const gridType = buildGridForPage(currentPageWords, currentPage);
    buildDraggablesForPage(info, currentPageWords, gridType);
    updateScoreDisplay();
    levelTitleEl.innerText = info.name + ` - Page ${currentPage + 1} of ${info.pages}`;
  }

// ----------------------------
// End modal
// ----------------------------
function showEndMenuModal(showContinue = false) {
    if (!endModalContent) return;

    endModalContent.innerHTML = "";

    // Auslan clap GIF
    const clapImg = document.createElement("img");
    clapImg.src = "assets/auslan-clap.gif";
    clapImg.style.width = "120px";
    clapImg.style.height = "120px";
    clapImg.style.display = "block";
    clapImg.style.margin = "0 auto 16px";

    // Score display
    const scoreP = document.createElement("p");
    scoreP.style.fontSize = "18px";
    scoreP.style.fontWeight = "bold";
    scoreP.style.marginBottom = "16px";
    scoreP.innerText = `Score: ${getTotalCorrect()} correct, ${getTotalIncorrect()} incorrect`;

    // Buttons row
    const buttons = document.createElement("div");
    Object.assign(buttons.style, {
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap"
    });

    // Continue button (only if game not ended)
    if (showContinue) {
        const contImg = document.createElement("img");
        contImg.src = "assets/continue.png";
        contImg.alt = "Continue";
        contImg.style.width = "120px";
        contImg.style.height = "120px";
        contImg.style.cursor = "pointer";
        contImg.addEventListener("click", () => {
            modal.style.display = "none";
            resumeTimer();
        });
        buttons.appendChild(contImg);
    }

    // Again button
    const againImg = document.createElement("img");
    againImg.src = "assets/again.png";
    againImg.alt = "Again";
    againImg.style.width = "120px";
    againImg.style.height = "120px";
    againImg.style.cursor = "pointer";
    againImg.addEventListener("click", async () => {
        try { await submitGoogleForm(); } catch (err) { console.warn("Submit failed:", err); }
        clearProgress(false);
        for (let i = 0; i < levelAttempts.length; i++) levelAttempts[i] = { correct: new Set(), incorrect: [] };
        currentLevel = 0; currentPage = 0; correctMatches = 0; gameEnded = false; startTime = Date.now(); elapsedTime = 0;
        saveProgress();
        modal.style.display = "none";
        loadPage();
        startTimer();
    });

    // Finish button
    const finishImg = document.createElement("img");
    finishImg.src = "assets/finish.png";
    finishImg.alt = "Finish";
    finishImg.style.width = "120px";
    finishImg.style.height = "120px";
    finishImg.style.cursor = "pointer";
    finishImg.addEventListener("click", async () => {
        try { await submitGoogleForm(); } catch (err) { console.warn("Submit failed:", err); }
        clearProgress(false);
        modal.style.display = "none";
        showEndMenuModal(false); // show final clap modal
    });

    buttons.appendChild(againImg);
    buttons.appendChild(finishImg);

    endModalContent.appendChild(clapImg);
    endModalContent.appendChild(scoreP);
    endModalContent.appendChild(buttons);

    modal.style.display = "flex";
}

// ----------------------------
// GOOGLE FORM SUBMISSION
// ----------------------------
async function submitGoogleForm() {
    return new Promise((resolve, reject) => {
        try {
            let iframe = document.querySelector("iframe[name='hidden_iframe']");
            if (!iframe) {
                iframe = document.createElement("iframe");
                iframe.name = "hidden_iframe";
                iframe.style.display = "none";
                document.body.appendChild(iframe);
            }
            let oldForm = document.getElementById("hiddenForm");
            if (oldForm) oldForm.remove();

            const form = document.createElement("form");
            form.id = "hiddenForm";
            form.method = "POST";
            form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
            form.target = "hidden_iframe";
            form.style.display = "none";

            const percent = calculatePercent();
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;
            const formattedTime = `${minutes} mins ${seconds} sec`;

            let highestLevel = 0;
            for (let i = 0; i < levelAttempts.length; i++) {
                if (levelAttempts[i].correct.size > 0 || levelAttempts[i].incorrect.length > 0) highestLevel = i + 1;
            }

            const entries = {};
            entries[FORM_FIELDS.name] = studentName;
            entries[FORM_FIELDS.class] = studentClass;
            entries[FORM_FIELDS.topic] = GAME_TOPIC;
            entries[FORM_FIELDS.percentage] = percent + "%";
            entries[FORM_FIELDS.time] = formattedTime;
            entries[FORM_FIELDS.highestLevel] = highestLevel;

            for (let i = 0; i < 6; i++) {
                const lvl = levelAttempts[i] || { correct: new Set(), incorrect: [] };
                entries[FORM_FIELDS[`level${i + 1}Correct`]] = Array.from(lvl.correct).sort().join(", ");
                entries[FORM_FIELDS[`level${i + 1}Incorrect`]] = (lvl.incorrect || []).sort().join(", ");
            }

            for (const fieldID in entries) {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = fieldID;
                input.value = entries[fieldID];
                form.appendChild(input);
            }

            document.body.appendChild(form);
            iframe.onload = () => resolve();
            form.submit();
        } catch (err) { console.warn("Form submit error:", err); reject(err); }
    });
}

// ----------------------------
// Initial load
// ----------------------------
const savedData = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
restoreProgressFromData(savedData);
loadPage();
startTimer();
updateScoreDisplay();

// ----------------------------
// Save periodically
// ----------------------------
setInterval(saveProgress, 3000);

// ----------------------------
// Stop / Resume / Finish buttons
// ----------------------------
if (stopBtn) {
    stopBtn.addEventListener("click", () => {
        pauseTimer(); // pause the timer
        showEndMenuModal(!gameEnded);
    });
}

continueBtn && continueBtn.addEventListener("click", () => { resumeTimer(); });
finishBtn && finishBtn.addEventListener("click", async () => {
    gameEnded = true;
    saveProgress();
    try { await submitGoogleForm(); } catch (err) { console.warn("Submit failed:", err); }
    showEndMenuModal(false);
});
againBtn && againBtn.addEventListener("click", () => { localStorage.removeItem(SAVE_KEY); window.location.reload(); });
