// numbers.js
// Complete Numbers Matching Game - full logic (drag/drop, touch, save/restore, pause/resume, forms)

document.addEventListener("DOMContentLoaded", function () {
  // ====== STUDENT INFO ======
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) { window.location.href = "../index.html"; return; }
  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // ====== DOM ======
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const modal = document.getElementById("end-modal");
  const modalContent = document.getElementById("end-modal-content");
  const stopScoreEl = document.getElementById("stop-score"); // must exist in HTML
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");
  const scoreDisplay = document.getElementById("score-display");
  const stopBtn = document.getElementById("stop-btn");

  // ====== STATE ======
  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = []; // array of pages for current level
  let correctMatches = 0;  // count matched on current page
  let startTime = Date.now(); // used to compute elapsed
  let savedElapsedSeconds = 0; // if resumed from pause
  let gameEnded = false;

  // per-level attempts (20 levels). correct = Set of matched letters, incorrect = array of wrong drops
  const levelAttempts = Array(20).fill(null).map(()=>({ correct: new Set(), incorrect: [] }));

  // overlays per-level: overlaysPerLevel[level] = { letter: imageMode } to persist which image used (clipart/sign)
  const overlaysPerLevel = Array(20).fill(null).map(()=>({}));

  // ====== GOOGLE FORM ======
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
  const formEntryIDs = {
    correct: [
      "entry.1897227570","entry.1116300030","entry.187975538","entry.1880514176",
      "entry.497882042","entry.1591755601","entry.1374012635","entry.1932466289",
      "entry.554179696","entry.738514372","entry.1591067770","entry.798325880",
      "entry.985210217","entry.173771989","entry.518336131","entry.1826031881",
      "entry.1363193324","entry.1713469842","entry.2122202486","entry.1745996786"
    ],
    incorrect: [
      "entry.1249394203","entry.1551220511","entry.903633326","entry.856597282",
      "entry.552536101","entry.922308538","entry.969924717","entry.1575128943",
      "entry.2030465979","entry.1357122496","entry.1355599626","entry.1979110089",
      "entry.1120330311","entry.1445957806","entry.817472684","entry.975184703",
      "entry.1628651239","entry.1505983868","entry.1744154495","entry.592196245"
    ]
  };

  // ====== LEVEL DEFINITIONS (same as your earlier config) ======
  const levelDefinitions = [
    { start: 0, end: 12, pages: 2, type: "clipart-grid" },
    { start: 0, end: 12, pages: 2, type: "sign-grid" },
    { start: 0, end: 12, pages: 2, type: "mixed" },
    { start: 13, end: 20, pages: 1, type: "clipart-grid" },
    { start: 13, end: 20, pages: 1, type: "sign-grid" },
    { start: 13, end: 20, pages: 1, type: "mixed" },
    { start: 21, end: 48, pages: 3, type: "clipart-grid" },
    { start: 21, end: 48, pages: 3, type: "sign-grid" },
    { start: 21, end: 48, pages: 3, type: "mixed" },
    { start: 49, end: 76, pages: 3, type: "clipart-grid" },
    { start: 49, end: 76, pages: 3, type: "sign-grid" },
    { start: 49, end: 76, pages: 3, type: "mixed" },
    { start: 77, end: 100, pages: 3, type: "clipart-grid" },
    { start: 77, end: 100, pages: 3, type: "sign-grid" },
    { start: 77, end: 100, pages: 3, type: "mixed" },
    { start: 0, end: 100, pages: 3, type: "clipart-grid" },
    { start: 0, end: 100, pages: 3, type: "sign-grid" },
    { start: 0, end: 100, pages: 3, type: "mixed" },
    { random: true, pages: 3, type: "mixed" },
    { review: true, pages: 1, type: "mixed" }
  ];

  // ====== FEEDBACK IMAGE ======
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
    width: "200px", display: "none", zIndex: 1000
  });
  document.body.appendChild(feedbackImage);

  function showFeedbackCorrect(isCorrect){
    feedbackImage.src = isCorrect ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(()=>feedbackImage.style.display = "none", 800);
  }

  // ====== UTIL ======
  function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }
  function formatSecs(s){ const m = Math.floor(s/60); const sec = s%60; return `${m} mins ${sec} sec`; }
  function getElapsedSeconds(){ return Math.floor((Date.now() - startTime)/1000); }

  // ====== SAVE / RESTORE PROGRESS (with elapsed & overlays) ======
  function saveProgress() {
    const data = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      // store elapsed seconds so we can pause/resume precisely
      elapsedSeconds: getElapsedSeconds(),
      levelAttempts: levelAttempts.map(l=>({ correct: Array.from(l.correct), incorrect: l.incorrect })),
      overlaysPerLevel // contains which imageMode used for each matched letter
    };
    localStorage.setItem("numbersGameSave", JSON.stringify(data));
  }

  function restoreProgress() {
    const raw = localStorage.getItem("numbersGameSave");
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (data.studentName !== studentName || data.studentClass !== studentClass) return false;
      currentLevel = typeof data.currentLevel === "number" ? data.currentLevel : 0;
      currentPage = typeof data.currentPage === "number" ? data.currentPage : 0;
      // restore attempts
      if (Array.isArray(data.levelAttempts)) {
        data.levelAttempts.forEach((lvl, i) => {
          levelAttempts[i].correct = new Set(Array.isArray(lvl.correct) ? lvl.correct : []);
          levelAttempts[i].incorrect = Array.isArray(lvl.incorrect) ? lvl.incorrect : [];
        });
      }
      // overlays per level
      if (data.overlaysPerLevel && Array.isArray(data.overlaysPerLevel)) {
        data.overlaysPerLevel.forEach((obj, i) => {
          overlaysPerLevel[i] = obj || {};
        });
      }
      // elapsedSeconds -> set startTime so elapsed preserved
      if (typeof data.elapsedSeconds === "number") {
        startTime = Date.now() - data.elapsedSeconds * 1000;
      } else {
        startTime = Date.now();
      }
      return true;
    } catch (err) {
      console.error("restoreProgress parse error", err);
      return false;
    }
  }

  function clearProgress() { localStorage.removeItem("numbersGameSave"); }

  // ====== RESTORE OVERLAYS for current level/page ======
  function restoreOverlays() {
    document.querySelectorAll(".slot").forEach(slot => {
      const letter = slot.dataset.letter;
      // overlaysPerLevel stores mapping of letter -> imageMode (e.g. "clipart" or "sign")
      const mapping = overlaysPerLevel[currentLevel] || {};
      const imageMode = mapping[letter];
      if (imageMode) {
        // remove background display and replace with overlay img
        slot.innerHTML = "";
        const overlay = document.createElement("img");
        overlay.className = "overlay";
        overlay.src = imageMode === "clipart" ? `assets/numbers/clipart/${letter}.png` : `assets/numbers/signs/sign-${letter}.png`;
        slot.appendChild(overlay);
        // remove any draggable images for that letter
        document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el=>el.remove());
      }
    });
  }

  // ====== SCORE ======
  function updateScore() {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100) : 0;
    scoreDisplay.innerText = `Score: ${percent}%`;
  }

  function calculateScore() {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100) : 0;
    return { totalCorrect, totalIncorrect, percent };
  }

  // ====== MODAL CONTROL ======
  function showEndModal(isFinished=false) {
    const { percent } = calculateScore();
    const elapsed = Math.floor((Date.now()-startTime)/1000);
    const timeText = formatSecs(elapsed);
    scoreDisplay.innerText = `Score: ${percent}% | Time: ${timeText}`;
    if (stopScoreEl) stopScoreEl.innerText = `Score: ${percent}% | Time: ${timeText}`;

    modal.style.display = "flex";
    if (againBtn) againBtn.style.display = "inline-block";
    if (finishBtn) finishBtn.style.display = "inline-block";
    if (continueBtn) continueBtn.style.display = isFinished ? "none" : "inline-block";

    if (isFinished && !gameEnded) {
      gameEnded = true;
      endGame(); // will handle form submit
    }
  }

  // Continue button -> resume
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    // restore startTime using saved elapsed from storage (so we don't double count)
    const raw = localStorage.getItem("numbersGameSave");
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (typeof data.elapsedSeconds === "number") {
          startTime = Date.now() - data.elapsedSeconds * 1000;
        } else {
          startTime = Date.now();
        }
      } catch {}
    } else {
      startTime = Date.now();
    }
    gameEnded = false;
    loadPage();
    // overlays restored inside loadPage
  });

  // Again -> clear and reload
  againBtn.addEventListener("click", () => {
    clearProgress();
    location.reload();
  });

  // Finish -> show modal & submit
  finishBtn.addEventListener("click", () => {
    if (!gameEnded) {
      gameEnded = true;
      endGame();
    }
    setTimeout(()=>{ window.location.href = "../index.html"; }, 1200);
  });

  // Stop button -> show modal, save elapsed
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      // save progress including elapsed seconds
      saveProgress();
      showEndModal(false);
    });
  }

  // ====== DRAG & TOUCH HANDLERS ======
  function drop(e) {
    if (e.preventDefault) e.preventDefault();
    const letter = e.dataTransfer ? e.dataTransfer.getData("text/plain") : (e.letter || null);
    const src = e.dataTransfer ? e.dataTransfer.getData("src") : (e.src || null);
    const target = e.currentTarget;
    if (!letter || !target) return;

    const expected = target.dataset.letter;

    if (letter === expected) {
      // mark correct for this level
      if (!levelAttempts[currentLevel].correct.has(letter)) {
        levelAttempts[currentLevel].correct.add(letter);
      }
      // persist which image mode was used for overlay (slot.dataset.imageMode was set during load)
      const usedImageMode = target.dataset.imageMode || "clipart";
      overlaysPerLevel[currentLevel] = overlaysPerLevel[currentLevel] || {};
      overlaysPerLevel[currentLevel][letter] = usedImageMode;

      // show overlay image
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = usedImageMode === "clipart" ? `assets/numbers/clipart/${letter}.png` : `assets/numbers/signs/sign-${letter}.png`;
      target.appendChild(overlay);

      // remove draggable sources
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedbackCorrect(true);
      updateScore();
      saveProgress();

      // page complete?
      const totalSlots = document.querySelectorAll(".slot").length;
      if (correctMatches >= totalSlots) {
        // move to next page/level
        correctMatches = 0;
        currentPage++;
        if (currentPage < currentLetters.length) {
          saveProgress();
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= levelDefinitions.length) {
            saveProgress();
            showEndModal(true);
          } else {
            saveProgress();
            setTimeout(loadPage, 800);
          }
        }
      }
    } else {
      // incorrect
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedbackCorrect(false);
      // visual shake if draggable exists
      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
      if (wrong) { wrong.classList.add("shake"); setTimeout(()=>wrong.classList.remove("shake"),500); }
      updateScore();
      saveProgress();
    }
  }

  function touchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    const target = e.target;
    if (!target || !target.dataset || !target.dataset.letter) return;

    const letter = target.dataset.letter;
    const src = target.src;

    const clone = target.cloneNode(true);
    Object.assign(clone.style, { position:"absolute", pointerEvents:"none", opacity:0.8, zIndex:10000 });
    document.body.appendChild(clone);

    const moveClone = touch => {
      clone.style.left = `${touch.clientX - clone.width/2}px`;
      clone.style.top = `${touch.clientY - clone.height/2}px`;
    };
    moveClone(e.touches[0]);

    const handleMove = ev => { ev.preventDefault(); moveClone(ev.touches[0]); };
    const handleEnd = ev => {
      const t = ev.changedTouches[0];
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && el.classList.contains("slot")) {
        // emulate drop event object
        drop({ preventDefault: ()=>{}, dataTransfer: { getData: k => k === "text/plain" ? letter : src }, currentTarget: el });
      }
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleMove, { passive:false });
    document.addEventListener("touchend", handleEnd, { passive:false });
  }

  // ====== LOAD PAGE (build slots/draggables) ======
  function loadPage() {
    const info = levelDefinitions[currentLevel];
    if (!info) {
      // if no definition, finish
      showEndModal(true);
      return;
    }

    // build the pool for this level
    let pool;
    if (info.review) {
      const wrong = new Set();
      for (let i=0;i<levelAttempts.length;i++) levelAttempts[i].incorrect.forEach(n=>wrong.add(n));
      pool = Array.from(wrong);
    } else if (info.random) {
      pool = Array.from({length:101}, (_,i) => i);
    } else {
      pool = Array.from({length: info.end - info.start + 1}, (_,i) => i + info.start);
    }

    // pick items for pages (pages * 9)
    const chosen = shuffle(pool).slice(0, info.pages * 9);
    const pages = [];
    for (let p=0;p<info.pages;p++) pages.push(chosen.slice(p*9, (p+1)*9));
    currentLetters = pages;
    const pageLetters = currentLetters[currentPage] || [];

    // clear DOM areas
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    levelTitle.innerText = `Level ${currentLevel+1}`;

    const slotType = info.type;
    const slotMode = slotType.includes("clipart") ? "clipart" : (slotType.includes("sign") ? "sign" : null);
    const getOppositeMode = m => m==="clipart" ? "sign" : "clipart";

    // create slots (targets)
    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = `${letter}`;
      const imageMode = (slotType === "mixed") ? (Math.random() < 0.5 ? "clipart" : "sign") : slotMode;
      slot.dataset.imageMode = imageMode;
      // show background image on slot
      slot.style.backgroundImage = `url('assets/numbers/${imageMode === "clipart" ? `clipart/${letter}.png` : `signs/sign-${letter}.png`}')`;
      slot.style.backgroundSize = "contain";
      slot.style.backgroundRepeat = "no-repeat";
      slot.style.backgroundPosition = "center";
      gameBoard.appendChild(slot);
    });

    // create decoys
    let decoyPool = pool.filter(n => !pageLetters.includes(n));
    let decoys = decoyPool.length >= 3 ? shuffle(decoyPool).slice(0,3) : decoyPool.slice();

    const draggableLetters = shuffle([...pageLetters, ...decoys]);

    draggableLetters.forEach((letter, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = `${letter}`;

      // choose source mode (opposite to target slot if possible)
      let sourceMode;
      if (slotType === "mixed") {
        const matchSlot = document.querySelector(`.slot[data-letter='${letter}']`);
        sourceMode = matchSlot ? getOppositeMode(matchSlot.dataset.imageMode) : (Math.random() < 0.5 ? "clipart" : "sign");
      } else {
        sourceMode = getOppositeMode(slotMode);
      }

      img.src = `assets/numbers/${sourceMode === "clipart" ? `clipart/${letter}.png` : `signs/sign-${letter}.png`}`;
      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", `${letter}`);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      if (i < draggableLetters.length/2) leftSigns.appendChild(wrap); else rightSigns.appendChild(wrap);
    });

    // restore matched overlays if previously matched
    correctMatches = pageLetters.filter(c => levelAttempts[currentLevel].correct.has(c)).length;

    // attach listeners to slots
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e=>e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    updateScore();
    saveProgress();
    // show overlays for matches (reapply correct images and remove draggables)
    restoreOverlays();
  }

  // ====== END GAME & FORM SUBMISSION ======
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const elapsedSec = Math.round((endTime - startTime)/1000);
    const formattedTime = formatSecs(elapsedSec);
    const currentPosition = `L${currentLevel+1}P${currentPage+1}`;

    // compute totals
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100) : 0;

    // build and submit a hidden form (so it works without CORS)
    const form = document.createElement("form");
    form.method = "POST";
    form.action = formURL;
    form.target = "hidden_iframe";
    form.style.display = "none";

    if (!document.querySelector("iframe[name='hidden_iframe']")) {
      const f = document.createElement("iframe");
      f.name = "hidden_iframe";
      f.style.display = "none";
      document.body.appendChild(f);
    }

    // core entries
    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Numbers",
      "entry.1374858042": formattedTime,
      "entry.750436458": currentPosition,
      "entry.1996137354": `${percent}%`
    };

    // per-level details (correct / incorrect)
    for (let i=0;i<20;i++) {
      entries[ formEntryIDs.correct[i] ] = Array.from(levelAttempts[i].correct).sort((a,b)=>a-b).join(", ");
      entries[ formEntryIDs.incorrect[i] ] = (levelAttempts[i].incorrect || []).slice().sort((a,b)=>a-b).join(", ");
    }

    // append hidden inputs to form
    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    // Update modal display (use existing stop-score element)
    if (stopScoreEl) stopScoreEl.innerText = `Final Score: ${percent}% | Time: ${formattedTime}`;
    if (scoreDisplay) scoreDisplay.innerText = `Score: ${percent}%`;

    // Finalize: clear saved progress after sending
    clearProgress();
  }

  // ====== INIT ======
  // Restore progress if present otherwise start fresh
  restoreProgress();
  loadPage();

  // Expose small debug API (optional)
  window.__numbersGame = { loadPage, saveProgress, restoreProgress, levelAttempts, overlaysPerLevel };

}); // end DOMContentLoaded
