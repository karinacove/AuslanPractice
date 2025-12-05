// weather.js
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
  const finalScoreText = document.getElementById("final-score");

  if (studentInfoEl) studentInfoEl.innerText = `${studentName} (${studentClass})`;

  // ----------------------------
  // Game configuration and state
  // ----------------------------
  const SAVE_KEY = "emotionGameSave_v1";
  const GAME_TOPIC = "Emotion";

  const wordBanks = {
    1: ["happy","calm","relaxed","focused","confident","loved","supported","thankful","proud"],
    2: ["sad","disappointed","withdrawn","bored","sick","tired","exhausted","lonely","shy"],
    3: ["silly","excited","shock","embarassed","annoyed","nervous","stressed","worried","confused"],
    4: ["angry","furious","ashamed","teased","jealous","unsafe","scared","pain","frustrated"],
    5: ["happy","calm","relaxed","focused","confident","loved","supported","thankful","proud","sad","disappointed","withdrawn","bored","sick","tired","exhausted","lonely","shy","silly","excited","shock","embarassed","annoyed","nervous","stressed","worried","confused","angry","furious","ashamed","teased","jealous","unsafe","scared","pain","frustrated"]
  };

const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Green Zone" },
    { words: wordBanks[2], pages: 3, name: "Blue Zone" },
    { words: wordBanks[3], pages: 3, name: "Yellow Zone" },
    { words: wordBanks[4], pages: 3, name: "Red Zone" },
    { words: wordBanks [5], pages: 3, name: "Emotions" }
  ];

  // Game state:
  let currentLevel = 0;          // 0..n-1
  let currentPage = 0;           // 0..pages-1
  let currentPageWords = [];     // 9 words on grid
  let correctMatches = 0;        // correct slots this page
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

// ===============================================
// Helper: create sign element (VIDEO with PNG fallback)
// ===============================================
async function createSignElement(word) {
  const mp4 = `assets/emotions/signs/${word}.mp4`;
  const png = `assets/emotions/signs/${word}.png`;

  try {
    const res = await fetch(mp4, { method: "HEAD" });
    if (res.ok) {
      const vid = document.createElement("video");
      vid.src = mp4;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.className = "overlay";
      vid.style.width = "100%";
      vid.style.height = "100%";
      vid.style.objectFit = "contain";
      return vid;
    }
  } catch (err) {}

  // Fallback PNG
  const img = document.createElement("img");
  img.src = png;
  img.className = "overlay";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  return img;
}



// ======================================================
// Drag & Drop / Touch handlers
// ======================================================
function dropHandler(e) {
  e.preventDefault && e.preventDefault();

  const dt = e.dataTransfer || (e.data && e.dataTransfer) || (e.dataTransfer === undefined ? e : null);
  const getData = dt && typeof dt.getData === "function" ? k => dt.getData(k) : k => "";

  const word = getData("text/plain");
  const slot = e.currentTarget;

  const targetWord = slot && (slot.dataset.word || slot.dataset.expected || slot.dataset.weather);
  if (!targetWord) return;

  if (word === targetWord) {
    if (!levelAttempts[currentLevel].correct.has(word))
      levelAttempts[currentLevel].correct.add(word);

    slot.innerHTML = "";
    slot.dataset.filled = "true";

    // ===== SIGN SLOT (VIDEO + PNG FALLBACK) =====
    if (slot.dataset.gridType === "sign") {
      createSignElement(word).then(el => {
        slot.appendChild(el);
      });
    }

    // ===== CLIPART SLOT (PNG ONLY) =====
    else {
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = `assets/emotions/clipart/${word}.png`;
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.objectFit = "contain";
      slot.appendChild(overlay);
    }

    // remove all draggable copies of this word
    document.querySelectorAll(`.drag-wrapper[data-word='${word}']`).forEach(el => el.remove());

    correctMatches++;
    showFeedback(true);
    updateScoreDisplay();
    saveProgress();

    // completion check
    const slotsOnPage = document.querySelectorAll(".slot").length;
    const filledCount = Array.from(document.querySelectorAll(".slot"))
      .filter(s => s.dataset.filled === "true").length;

    if (filledCount >= slotsOnPage) {
      correctMatches = 0;
      (async () => {
        try { await submitGoogleForm(); } catch {}
        currentPage++;
        const info = levelDefinitions[currentLevel];

        if (currentPage < (info?.pages ?? 1)) {
          saveProgress();
          setTimeout(loadPage, 700);
        } else {
          currentLevel++;
          currentPage = 0;
          saveProgress();

          if (currentLevel >= levelDefinitions.length) {
            gameEnded = true;
            saveProgress();
            try { await submitGoogleForm(); } catch {}
            showEndMenuModal(false);
          } else {
            setTimeout(loadPage, 700);
          }
        }
      })();
    }
  }

  // WRONG MATCH
  else {
    levelAttempts[currentLevel].incorrect.push(word);
    showFeedback(false);
    updateScoreDisplay();
    saveProgress();

    const wrong = document.querySelector(`.drag-wrapper[data-word='${word}']`);
    if (wrong) {
      wrong.classList.add("shake");
      setTimeout(() => wrong.classList.remove("shake"), 400);
    }
  }
}



// ======================================================
// Touch Drag Simulation — supports video OR img
// ======================================================
let _touchState = null;

function touchStartHandler(ev) {
  if (!ev || !ev.touches || ev.touches.length === 0) return;

  const wrapper = ev.currentTarget;      // drag-wrapper
  const media = wrapper.querySelector("video, img");  // actual element
  if (!media) return;

  ev.preventDefault();

  const word = wrapper.dataset.word;

  // clone media
  const clone = media.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = "0px";
  clone.style.top = "0px";
  clone.style.pointerEvents = "none";
  clone.style.opacity = "0.95";
  clone.style.zIndex = 10000;
  clone.style.transform = "translate(-50%,-50%)";

  if (clone.tagName === "VIDEO") {
    clone.muted = true;
    clone.loop = true;
    clone.autoplay = true;
    clone.play();
  }

  const rect = wrapper.getBoundingClientRect();
  const cw = Math.min(rect.width || 100, 140);
  clone.style.width = cw + "px";

  document.body.appendChild(clone);

  function moveClone(touch) {
    if (!touch) return;
    clone.style.left = `${touch.clientX}px`;
    clone.style.top = `${touch.clientY}px`;
  }

  moveClone(ev.touches[0]);
  _touchState = { word, clone };

  const onMove = mEv => {
    mEv.preventDefault();
    const t = mEv.touches && mEv.touches[0];
    moveClone(t);
  };

  const onEnd = endEv => {
    endEv.preventDefault();

    const t = endEv.changedTouches && endEv.changedTouches[0];
    if (t) {
      let el = document.elementFromPoint(t.clientX, t.clientY);
      while (el && !el.classList.contains("slot")) el = el.parentElement;
      if (el && el.classList.contains("slot")) {
        const fake = {
          preventDefault: () => {},
          currentTarget: el,
          dataTransfer: {
            getData: k => (k === "text/plain" ? word : "")
          }
        };
        dropHandler(fake);
      } else {
        const orig = document.querySelector(`.drag-wrapper[data-word='${word}']`);
        if (orig) {
          orig.classList.add("shake");
          setTimeout(() => orig.classList.remove("shake"), 400);
        }
      }
    }

    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onEnd);
    if (_touchState?.clone) _touchState.clone.remove();
    _touchState = null;
  };

  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd, { passive: false });
}



// ======================================================
// Build Draggables — Video First, PNG fallback
// ======================================================
function buildDraggablesForPage(info, pageWords, gridType) {
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  const pairsPerSide = (currentLevel <= 2) ? 6 : 9;
  const TARGET_TOTAL = pairsPerSide * 2;

  const uniqueWords = Array.from(new Set(info.words));

  // priority incorrects
  let priority = [];
  if (currentLevel >= 3) {
    for (let li = 0; li < currentLevel; li++) {
      if (levelAttempts[li]?.incorrect)
        priority.push(...levelAttempts[li].incorrect);
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
    else {
      const pick = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
      if (!pool.includes(pick)) pool.push(pick);
    }
    safe++;
  }

  pageWords.forEach(w => { if (!pool.includes(w)) pool.push(w); });

  const shuffled = shuffle(pool);
  const mustHave = new Set(pageWords);
  const keep = [];

  shuffled.forEach(w => {
    if (mustHave.has(w) && keep.length < TARGET_TOTAL) keep.push(w);
  });
  shuffled.forEach(w => {
    if (!mustHave.has(w) && keep.length < TARGET_TOTAL) keep.push(w);
  });

  const draggables = keep.slice(0, TARGET_TOTAL);

  draggables.forEach((word, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "drag-wrapper";
    wrap.dataset.word = word;
    wrap.style.width = "120px";
    wrap.style.height = "120px";
    wrap.style.display = "inline-flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.margin = "6px";

    // decide if this draggable is a SIGN (video/png) or CLIPART
    let gridTypeForWord = gridType;
    if (gridType === "mixed") {
      const slotEl = document.querySelector(`.slot[data-word='${word}']`);
      gridTypeForWord = slotEl ? (slotEl.dataset.gridType || "clipart") : (Math.random() < 0.5 ? "clipart" : "sign");
    }

    const draggableIsSign = (gridTypeForWord === "clipart");
    const folder = draggableIsSign ? "signs" : "clipart";

    // ==========================
    // Create media element
    // ==========================
    const mp4 = `assets/emotions/signs/${word}.mp4`;

    if (draggableIsSign) {
      // video with fallback
      fetch(mp4, { method: "HEAD" })
        .then(r => {
          if (r.ok) {
            const vid = document.createElement("video");
            vid.src = mp4;
            vid.autoplay = true;
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;
            vid.style.width = "100%";
            vid.style.height = "100%";
            vid.style.objectFit = "contain";
            wrap.appendChild(vid);
          } else {
            const img = document.createElement("img");
            img.src = `assets/emotions/signs/${word}.png`;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "contain";
            wrap.appendChild(img);
          }
        })
        .catch(() => {
          const img = document.createElement("img");
          img.src = `assets/emotions/signs/${word}.png`;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "contain";
          wrap.appendChild(img);
        });
    }

    else {
      const img = document.createElement("img");
      img.src = `assets/emotions/clipart/${word}.png`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      wrap.appendChild(img);
    }

    // ==========================
    // Events
    // ==========================
    wrap.draggable = true;

    wrap.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", word);
      e.dataTransfer.effectAllowed = "copy";
    });

    wrap.addEventListener("touchstart", touchStartHandler, { passive: false });

    // Add to left/right
    if (idx % 2 === 0) leftSigns.appendChild(wrap);
    else rightSigns.appendChild(wrap);
  });
}
  
// ----------------------------
// Helper: Get unique page words
// ----------------------------
function getUniquePageWords(words, n = 9) {
  const picked = [];
  const pool = shuffle(words); // shuffle must exist first
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
  // Page loading logic
  // ----------------------------
  function loadPage() {
    if (gameEnded) return;
    if (currentLevel >= levelDefinitions.length) {
      gameEnded = true;
      showEndMenuModal(false);
      return;
    }
    const info = levelDefinitions[currentLevel];
    if (!info) { gameEnded = true; showEndMenuModal(false); return; }
    currentPageWords = getUniquePageWords(info.words, 9);
    const gridType = buildGridForPage(currentPageWords, currentPage);
    buildDraggablesForPage(info, currentPageWords, gridType);
    updateScoreDisplay();
    levelTitleEl.innerText = info.name + ` - Page ${currentPage + 1} of ${info.pages}`;
  }

  // ----------------------------
  // End modal
  // ----------------------------

  // showContinue - when true the Continue button is shown (Stop menu); when false (final modal) Continue is hidden
  function showEndMenuModal(showContinue = false) {
    if (!endModalContent || !modal) return;

    // Clear any existing content
    endModalContent.innerHTML = "";

    // Auslan clap GIF (big, centered)
    const clapImg = document.createElement("img");
    clapImg.src = "assets/auslan-clap.gif";
    clapImg.alt = "Well done";
    clapImg.style.width = "160px";
    clapImg.style.height = "160px";
    clapImg.style.display = "block";
    clapImg.style.margin = "0 auto 12px";

    // Score display (top row)
    const scoreP = document.createElement("p");
    scoreP.style.fontSize = "18px";
    scoreP.style.fontWeight = "bold";
    scoreP.style.marginBottom = "12px";
    scoreP.innerText = `Score: ${getTotalCorrect()} correct, ${getTotalIncorrect()} incorrect`;

    // Time display (optional)
    const timeP = document.createElement("p");
    timeP.style.marginBottom = "16px";
    const totalSec = Math.floor(elapsedTime);
    timeP.innerText = `Time: ${totalSec}s`;

    // Buttons container
    const buttons = document.createElement("div");
    Object.assign(buttons.style, {
      display: "flex",
      justifyContent: "center",
      gap: "12px",
      flexWrap: "wrap"
    });

    // Continue button (only when showContinue=true and the game has not ended)
    if (showContinue && !gameEnded) {
      const contImg = document.createElement("img");
      contImg.src = "assets/continue.png";
      contImg.alt = "Continue";
      contImg.style.width = "120px";
      contImg.style.height = "120px";
      contImg.style.cursor = "pointer";
      contImg.addEventListener("click", () => {
        // close modal and resume
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
      // Final "done" modal - show clap and no continue (already same content but ensure continue hidden)
      window.location.href = "../index.html";
    });

    // Append buttons (Again + Finish always present)
    buttons.appendChild(againImg);
    buttons.appendChild(finishImg);

    // Add elements into modal content
    endModalContent.appendChild(clapImg);
    endModalContent.appendChild(scoreP);
    endModalContent.appendChild(timeP);
    endModalContent.appendChild(buttons);

    // Ensure modal visible
    modal.style.display = "flex";
  }

  // ----------------------------
  // GOOGLE FORM SUBMISSION (Alphabet-style)
  // ----------------------------
  async function submitGoogleForm() {
    return new Promise((resolve) => {
      // Ensure hidden iframe exists
      let iframe = document.querySelector("iframe[name='hidden_iframe']");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.name = "hidden_iframe";
        iframe.style.display = "none";
        document.body.appendChild(iframe);
      }

      // Remove any old form we created previously (avoid duplicates)
      const oldForm = document.getElementById("hiddenForm");
      if (oldForm) oldForm.remove();

      // Create form
      const form = document.createElement("form");
      form.id = "hiddenForm";
      form.method = "POST";
      form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
      form.target = "hidden_iframe";
      form.style.display = "none";

      // ---- Collect values ----
      const studentNameVal = localStorage.getItem("studentName") || "";
      const studentClassVal = localStorage.getItem("studentClass") || "";
      const topic = GAME_TOPIC;

      // Score calculations
      let totalCorrect = 0, totalAttempts = 0;
      for (let i = 0; i < levelAttempts.length; i++) {
        totalCorrect += levelAttempts[i].correct.size;
        totalAttempts += levelAttempts[i].correct.size + levelAttempts[i].incorrect.length;
      }

      const percent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const minutes = Math.floor(timeTaken / 60);
      const seconds = timeTaken % 60;
      const formattedTime = `${minutes} mins ${seconds} sec`;

      let highestLevel = 0;
      for (let i = 0; i < levelAttempts.length; i++) {
        if (levelAttempts[i].correct.size > 0 || levelAttempts[i].incorrect.length > 0) {
          highestLevel = i + 1;
        }
      }

      // ---- Build form data with FIELD MAP ----
      const entries = {};

      entries[FORM_FIELDS.name] = studentNameVal;
      entries[FORM_FIELDS.class] = studentClassVal;
      entries[FORM_FIELDS.topic] = topic;
      entries[FORM_FIELDS.percentage] = percent + "%";
      entries[FORM_FIELDS.time] = formattedTime;
      entries[FORM_FIELDS.highestLevel] = highestLevel;

      // Per-level entries (6 levels in map)
      for (let i = 0; i < 6; i++) {
        const lvl = levelAttempts[i] || { correct: new Set(), incorrect: [] };
        entries[FORM_FIELDS[`level${i+1}Correct`]] = Array.from(lvl.correct).sort().join(", ");
        entries[FORM_FIELDS[`level${i+1}Incorrect`]] = (lvl.incorrect || []).sort().join(", ");
      }

      // ---- Append inputs ----
      for (const fieldID in entries) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = fieldID;
        input.value = entries[fieldID];
        form.appendChild(input);
      }

      document.body.appendChild(form);

      // give time for browser to insert nodes, then submit
      setTimeout(() => {
        try {
          form.submit();
        } catch (err) {
          console.warn("Form submission threw:", err);
        }
        // resolve after small delay; iframe onload could be unreliable across browsers so resolve anyway
        setTimeout(() => resolve(), 150);
      }, 50);
    });
  }

  // ----------------------------
  // Helpers for totals
  // ----------------------------
  function getTotalCorrect() {
    return levelAttempts.reduce((s, l) => s + l.correct.size, 0);
  }
  function getTotalIncorrect() {
    return levelAttempts.reduce((s, l) => s + l.incorrect.length, 0);
  }

  // ----------------------------
  // Clear progress
  // ----------------------------
  function clearProgress(alsoClearStudent = false) {
    try {
      localStorage.removeItem(SAVE_KEY);
      if (alsoClearStudent) {
        localStorage.removeItem("studentName");
        localStorage.removeItem("studentClass");
      }
    } catch (err) { /* ignore */ }
  }

  // ----------------------------
  // Initial load
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
    updateScoreDisplay();
    // autosave periodically & on unload
    setInterval(saveProgress, 15000);
    window.addEventListener("beforeunload", saveProgress);
  })();

  // ----------------------------
  // Stop / Resume / Finish button wiring
  // ----------------------------
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      // Pause timer and show stop modal (with Continue)
      pauseTimer();
      showEndMenuModal(!gameEnded);
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      // if you have a persistent continue button in the modal area (HTML), allow resume
      if (modal) modal.style.display = "none";
      resumeTimer();
    });
  }

  if (finishBtn) {
    document.getElementById("finish-btn").addEventListener("click", async () => {
      try { await submitGoogleForm(); } catch (err) { console.warn("Submit failed:", err); }
      clearProgress(false);

  // Close modal
  modal.style.display = "none";

  // ✅ Go back to index
  window.location.href = "../index.html";
});
  }

  if (againBtn) {
    againBtn.addEventListener("click", () => {
      // quick restart via HTML button (if present)
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    });
  }

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
  // Minimal clap helper (if needed)
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
  window._emotionGame = {
    saveProgress,
    restoreProgressFromData,
    getState: () => ({ currentLevel, currentPage, levelAttempts, elapsedTime }),
    loadPage,
    restartGame,
    endGame: async () => { gameEnded = true; await submitGoogleForm(); showEndMenuModal(false); }
  };

  // ----------------------------
  // Simple double-tap zoom prevention for mobiles (optional)
  // ----------------------------
  let lastTap = 0;
  let zoomedIn = false;
  document.addEventListener("touchend", function (event) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
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
