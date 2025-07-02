document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");
  const endModal = modal;

  if (finishBtn) finishBtn.addEventListener("click", () => {
    if (!gameEnded) {
      endGame();
    }
  });

  continueBtn.addEventListener("click", () => {
    endModal.style.display = "none";
    gameEnded = false;
    loadPage();
  });

  againBtn.addEventListener("click", () => {
    localStorage.removeItem("alphabetGameSave");
    location.reload();
  });

  menuBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
  });

  logoutBtn.addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem("alphabetGameSave"));
    if (saved && saved.studentName === studentName && saved.studentClass === studentClass) {
      sendSavedDataToForm(saved, () => {
        localStorage.clear();
        window.location.href = "../index.html";
      });
    } else {
      localStorage.clear();
      window.location.href = "../index.html";
    }
  });

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  // ADDED Level 20 revisit incorrect answers - one page with 6 decoys and wideMode
  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 9, wideMode: true },
    { type: "imageToSign", decoys: 9, wideMode: true },
    { type: "mixed", decoys: 9, wideMode: true },
    { type: "incorrectReview", decoys: 6, wideMode: true } // Level 20 added here
  ];

  // Google Form entry IDs updated for 7 levels now
  const formEntryIDs = {
    correct: [
      "entry.1249394203", // Level 1
      "entry.1551220511", // Level 2
      "entry.903633326",  // Level 3
      "entry.497882042",  // Level 4
      "entry.1591755601",  // Level 5
      "entry.1996137354",  // Level 6
      "entry.1234567890"   // Level 20 placeholder (update to your actual ID)
    ],
    incorrect: [
      "entry.1897227570", // Level 1
      "entry.1116300030", // Level 2
      "entry.187975538",  // Level 3
      "entry.1880514176", // Level 4
      "entry.552536101",  // Level 5
      "entry.922308538",  // Level 6
      "entry.0987654321"  // Level 20 placeholder (update to your actual ID)
    ]
  };

  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 3;
  const levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  let currentLetters = [];
  let correctMatches = 0;
  let startTime = Date.now();
  let gameEnded = false;

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

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

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  function drop(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetLetter = target.dataset.letter;

    if (letter === targetLetter) {
      if (!levelAttempts[currentLevel].correct.has(letter)) {
        levelAttempts[currentLevel].correct.add(letter);
      }
      saveProgress();
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());
      correctMatches++;
      showFeedback(true);

      // FIXED: Level 20 only has 1 page, others 3 pages
      const levelPageLimit = (levels[currentLevel].type === "incorrectReview") ? 1 : pagesPerLevel;

      if (correctMatches >= currentLetters[currentPage].length) {
        correctMatches = 0;
        currentPage++;

        if (currentPage < levelPageLimit) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          saveProgress();

          if (currentLevel >= levels.length) {
            setTimeout(endGame, 800);
          } else {
            setTimeout(loadPage, 800);
          }
        }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedback(false);
      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 500);
      }
    }
  }

  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    localStorage.removeItem("alphabetGameSave");

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    let iframe = document.querySelector("iframe[name='hidden_iframe']");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = "hidden_iframe";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Alphabet",
      "entry.1374858042": formattedTime
    };

    for (let i = 0; i < levels.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct);
      correctArr.sort();
      const incorrectArr = [...levelAttempts[i].incorrect];
      incorrectArr.sort();

      entries[formEntryIDs.correct[i]] = correctArr.join("");
      entries[formEntryIDs.incorrect[i]] = incorrectArr.join("");
    }

    let totalCorrect = 0;
    let totalAttempts = 0;
    for (let i = 0; i < levels.length; i++) {
      totalCorrect += levelAttempts[i].correct.size;
      totalAttempts += levelAttempts[i].correct.size + levelAttempts[i].incorrect.length;
    }
    const percent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    entries["entry.1996137354"] = `${percent}%`;

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);

    // Debug log
    console.log("Submitting Google Form with data:", entries);

    iframe.onload = () => {
      console.log("Google Form submitted successfully");
    };

    form.submit();

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
    modal.style.display = "flex";
  }

  function sendSavedDataToForm(data, callback) {
    const timeTaken = Math.round((Date.now() - (data.startTime || Date.now())) / 1000);
    const formattedTime = `${Math.floor(timeTaken / 60)} mins ${timeTaken % 60} sec`;

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    const entries = {
      "entry.1387461004": data.studentName,
      "entry.1309291707": data.studentClass,
      "entry.477642881": "Alphabet",
      "entry.1374858042": formattedTime
    };

    for (let i = 0; i < levels.length; i++) {
      const correctArr = data.levelAttempts[i]?.correct || [];
      const incorrectArr = data.levelAttempts[i]?.incorrect || [];

      entries[formEntryIDs.correct[i]] = correctArr.sort().join("");
      entries[formEntryIDs.incorrect[i]] = incorrectArr.sort().join("");
    }

    let totalCorrect = 0;
    let totalAttempts = 0;
    for (let i = 0; i < levels.length; i++) {
      totalCorrect += data.levelAttempts[i]?.correct.length || 0;
      totalAttempts += (data.levelAttempts[i]?.correct.length || 0) + (data.levelAttempts[i]?.incorrect.length || 0);
    }

    const percent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    entries["entry.1996137354"] = `${percent}%`;

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    let iframe = document.querySelector("iframe[name='hidden_iframe']");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = "hidden_iframe";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    iframe.onload = () => {
      console.log("✅ Saved progress submitted on logout");
      if (callback) callback();
    };

    document.body.appendChild(form);
    form.submit();
  }

  function saveProgress() {
    // Don't save at the very start before any progress
    if (currentLevel === 0 && currentPage === 0 && correctMatches === 0) return;

    const data = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      levelAttempts: levelAttempts.map(l => ({
        correct: [...l.correct],
        incorrect: [...l.incorrect]
      })),
      currentLetters,
      startTime,
      gameEnded
    };
    localStorage.setItem("alphabetGameSave", JSON.stringify(data));
  }

  function restoreProgress(data) {
    if (data.studentName === studentName && data.studentClass === studentClass) {
      currentLevel = data.currentLevel;
      currentPage = data.currentPage;
      startTime = data.startTime || Date.now();
      gameEnded = data.gameEnded || false;
      currentLetters = data.currentLetters || [];
      data.levelAttempts.forEach((l, i) => {
        levelAttempts[i].correct = new Set(l.correct);
        levelAttempts[i].incorrect = [...l.incorrect];
      });
      loadPage();
    }
  }

function loadPage() {
  if (gameEnded) return;

  if (currentLevel >= 20) {
    endGame();
    return;
  }

  const info = levelDefinitions[currentLevel];
  let pool = [];
  if (info.random) {
    pool = Array.from({ length: 101 }, (_, i) => i);
  } else if (info.review) {
    pool = [];
    for (let lvl = 0; lvl < levelAttempts.length; lvl++) {
      pool.push(...levelAttempts[lvl].incorrect);
    }
    pool = [...new Set(pool)].sort(sortNumbers);
  } else {
    pool = Array.from({ length: info.end - info.start + 1 }, (_, i) => i + info.start);
  }

  const totalItems = info.pages * 9;
  let chosen = shuffle(pool).slice(0, totalItems);

  const pageItems = [];
  for (let i = 0; i < info.pages; i++) {
    pageItems.push(chosen.slice(i * 9, (i + 1) * 9));
  }

  currentLetters = pageItems;
  currentPageItems = currentLetters[currentPage] || [];

  gameBoard.innerHTML = "";
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";
  levelTitle.innerText = `Level ${currentLevel + 1}`;

  const slotType = info.type;
  const slotMode = slotType.includes("clipart") ? "clipart" : slotType.includes("sign") ? "sign" : null;
  const getOppositeMode = m => m === "clipart" ? "sign" : "clipart";

  correctMatches = 0;

  // Create slots for current page
  currentPageItems.forEach(letter => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.letter = `${letter}`;
    const imageMode = slotType === "mixed" ? (Math.random() < 0.5 ? "clipart" : "sign") : slotMode;
    slot.dataset.imageMode = imageMode;
    slot.style.backgroundImage = `url('assets/numbers/${imageMode === "clipart" ? `clipart/${letter}.png` : `signs/sign-${letter}.png`}')`;
    gameBoard.appendChild(slot);

    // Restore matched overlays for this level & page:
    if (levelAttempts[currentLevel].correct.has(String(letter))) {
      const overlay = document.createElement("img");
      overlay.src = `assets/numbers/${getOppositeMode(imageMode) === "clipart" ? `clipart/${letter}.png` : `signs/sign-${letter}.png`}`;
      overlay.className = "overlay";
      slot.innerHTML = ""; // clear bg image
      slot.appendChild(overlay);
      correctMatches++;
    }
  });

  // Prepare draggable items (only those NOT matched already)
  let unmatchedLetters = currentPageItems.filter(l => !levelAttempts[currentLevel].correct.has(String(l)));

  let decoyPool = pool.filter(n => !currentPageItems.includes(n));
  let decoys = decoyPool.length >= 3 ? shuffle(decoyPool).slice(0, 3) : decoyPool;
  const draggableLetters = shuffle([...unmatchedLetters, ...decoys]);

  draggableLetters.forEach((letter, i) => {
    const img = document.createElement("img");
    img.className = "draggable";
    img.draggable = true;
    img.dataset.letter = `${letter}`;

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
    (i < draggableLetters.length / 2 ? leftSigns : rightSigns).appendChild(wrap);
  });

  // Update score display
  updateScore();

  // Add drag/drop listeners on slots
  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", drop);
  });

  saveProgress();
}

// Update a visible score element with correct vs total
function updateScore() {
  const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
  const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
  const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

  const scoreDisplay = document.getElementById("score-display");
  if (scoreDisplay) {
    scoreDisplay.innerText = `Score: ${percent}% (${totalCorrect} correct, ${totalIncorrect} incorrect)`;
  }
}


  // FIXED: touch drag clone size to prevent huge image on touchstart
  function touchStart(e) {
    e.preventDefault();
    const target = e.target;
    const letter = target.dataset.letter;
    const src = target.src;

    const clone = target.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.7";
    clone.style.zIndex = "10000";

    // FIXED: limit clone size to original size or max 100px width for touch drag
    clone.style.width = Math.min(target.naturalWidth || 100, 100) + "px";
    clone.style.height = "auto";

    document.body.appendChild(clone);

    const moveClone = (touch) => {
      clone.style.left = `${touch.clientX - clone.width / 2}px`;
      clone.style.top = `${touch.clientY - clone.height / 2}px`;
    };

    moveClone(e.touches[0]);

    const handleTouchMove = (ev) => moveClone(ev.touches[0]);

    const handleTouchEnd = (ev) => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.classList.contains("slot")) drop({
        preventDefault: () => { },
        dataTransfer: {
          getData: (k) => k === "text/plain" ? letter : src
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

  // On load: check saved game and offer resume only if not ended and progress beyond page 0
  const saved = JSON.parse(localStorage.getItem("alphabetGameSave"));
  if (
    saved &&
    saved.studentName === studentName &&
    saved.studentClass === studentClass &&
    !saved.gameEnded &&
    (saved.currentPage > 0 || saved.currentLevel > 0) // FIXED: allow resume if any progress (page or level > 0)
  ) {
    if (confirm("Resume your unfinished game?")) {
      restoreProgress(saved);
    } else {
      localStorage.removeItem("alphabetGameSave");
      loadPage();
    }
  } else {
    loadPage();
  }
});
