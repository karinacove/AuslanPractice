// Numbers Matching Game - Full Complete Script with Save/Resume and Form Submission

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

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  // Form field IDs for Google Forms submission for correct and incorrect answers for 20 levels
  const formEntryIDs = {
    correct: [
      "entry.1249394203", "entry.1551220511", "entry.903633326", "entry.497882042", "entry.1591755601", "entry.1996137354",
      "entry.856597282", "entry.552536101", "entry.922308538", "entry.1374012635", "entry.969924717", "entry.1932466289",
      "entry.1575128943", "entry.554179696", "entry.2030465979", "entry.738514372", "entry.1357122496", "entry.1591067770",
      "entry.1355599626", "entry.798325880"
    ],
    incorrect: [
      "entry.1897227570", "entry.1116300030", "entry.187975538", "entry.1880514176", "entry.552536101", "entry.922308538",
      "entry.1184246193", "entry.985210217", "entry.1120330311", "entry.173771989", "entry.1445957806", "entry.518336131",
      "entry.817472684", "entry.1826031881", "entry.975184703", "entry.1363193324", "entry.1628651239", "entry.1713469842",
      "entry.1505983868", "entry.2122202486"
    ]
  };

  // Level definitions - number ranges and pages, with types ("clipart-grid", "sign-grid", "mixed")
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

  // State variables
  let currentLevel = 0;
  let currentPage = 0;
  let currentItems = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();

  // Attempts data - store per level correct (Set) and incorrect (Array)
  const levelAttempts = Array(20).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // DOM references
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // Utility shuffle function
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  // Save progress after completing Level 1 Page 0 (i.e. after finishing first page of Level 1)
  function saveProgress() {
    const saveObj = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      levelAttempts: levelAttempts.map(lvl => ({
        correct: Array.from(lvl.correct),
        incorrect: lvl.incorrect
      })),
      startTime
    };
    localStorage.setItem("numbersGameSave", JSON.stringify(saveObj));
  }

  // Load saved progress from localStorage
  function loadSavedProgress() {
    const saved = localStorage.getItem("numbersGameSave");
    if (!saved) return false;
    try {
      const data = JSON.parse(saved);
      if (data.studentName !== studentName || data.studentClass !== studentClass) return false;
      if (data.currentLevel >= 20) return false; // Completed all levels, no resume
      currentLevel = data.currentLevel;
      currentPage = data.currentPage;
      // Restore attempts Sets and arrays
      data.levelAttempts.forEach((lvl, i) => {
        levelAttempts[i].correct = new Set(lvl.correct);
        levelAttempts[i].incorrect = lvl.incorrect;
      });
      startTime = data.startTime || Date.now();
      return true;
    } catch {
      return false;
    }
  }

  // Send saved data to Google Form
  function sendSavedDataToForm(savedData, callback) {
    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const entries = {
      "entry.1387461004": savedData.studentName,
      "entry.1309291707": savedData.studentClass,
      "entry.477642881": "Numbers",
      "entry.1374858042": formatTime((Date.now() - savedData.startTime) / 1000)
    };

    for (let i = 0; i < formEntryIDs.correct.length; i++) {
      const correctSorted = (savedData.levelAttempts[i]?.correct || []).map(Number).sort((a,b)=>a-b);
      const incorrectSorted = (savedData.levelAttempts[i]?.incorrect || []).map(Number).sort((a,b)=>a-b);
      entries[formEntryIDs.correct[i]] = correctSorted.join(",");
      entries[formEntryIDs.incorrect[i]] = incorrectSorted.join(",");
    }

    const totalCorrect = savedData.levelAttempts.reduce((sum, lvl) => sum + (lvl.correct?.length || 0), 0);
    const totalIncorrect = savedData.levelAttempts.reduce((sum, lvl) => sum + (lvl.incorrect?.length || 0), 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;
    entries["entry.1996137354"] = `${percent}%`;

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    // Remove iframe after submission (optional cleanup)
    setTimeout(() => {
      iframe.remove();
      form.remove();
      if (callback) callback();
    }, 1000);
  }

  // Format seconds to mm mins ss sec string
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins} mins ${secs} sec`;
  }

  // Show the current page of the current level
  function loadPage() {
    if (gameEnded) return;

    // If saved progress exists and we are on first load, we load saved progress
    if (currentLevel === 0 && currentPage === 0 && loadSavedProgress()) {
      // Continue from saved state without reload
    }

    const info = levelDefinitions[currentLevel];
    let pool;
    if (info.random) {
      pool = Array.from({ length: 101 }, (_, i) => i);
    } else if (info.review) {
      // Review: collect incorrect answers from all previous levels to show on one page
      pool = [];
      levelAttempts.forEach(lvl => {
        pool = pool.concat(lvl.incorrect);
      });
      pool = [...new Set(pool)]; // Unique numbers
    } else {
      pool = Array.from({ length: info.end - info.start + 1 }, (_, i) => i + info.start);
    }

    // Determine the items on this page
    if (info.review) {
      currentItems = pool; // All incorrect items combined
    } else {
      const chosen = shuffle(pool).slice(0, info.pages * 9);
      currentItems = [];
      for (let i = 0; i < info.pages; i++) {
        currentItems.push(chosen.slice(i * 9, (i + 1) * 9));
      }
    }

    if (currentPage >= (info.pages || 1)) {
      currentPage = 0;
      currentLevel++;
      if (currentLevel >= 20) {
        gameEnded = true;
        modal.style.display = "flex";
        endGame();
        return;
      }
      loadPage();
      return;
    }

    const pageItems = info.review ? currentItems : currentItems[currentPage];

    // Clear previous page
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    levelTitle.innerText = `Level ${currentLevel + 1}`;

    const slotType = info.type;
    const slotMode = slotType.includes("clipart") ? "clipart" : slotType.includes("sign") ? "sign" : null;
    const getOppositeMode = m => m === "clipart" ? "sign" : "clipart";

    // Add slots for pageItems
    pageItems.forEach(num => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = `${num}`;
      const imageMode = slotType === "mixed" ? (Math.random() < 0.5 ? "clipart" : "sign") : slotMode;
      slot.dataset.imageMode = imageMode;
      slot.style.backgroundImage = `url('assets/numbers/${imageMode === "clipart" ? `clipart/${num}.png` : `signs/sign-${num}.png`}')`;
      gameBoard.appendChild(slot);
    });

    // Prepare draggable images with decoys
    let decoyPool = pool.filter(n => !pageItems.includes(n));
    let decoys = decoyPool.length >= 3 ? shuffle(decoyPool).slice(0, 3) : decoyPool;
    const draggableLetters = shuffle([...pageItems, ...decoys]);

    draggableLetters.forEach((num, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = `${num}`;

      let sourceMode;
      if (slotType === "mixed") {
        const matchSlot = document.querySelector(`.slot[data-letter='${num}']`);
        sourceMode = matchSlot ? getOppositeMode(matchSlot.dataset.imageMode) : (Math.random() < 0.5 ? "clipart" : "sign");
      } else {
        sourceMode = getOppositeMode(slotMode);
      }

      img.src = `assets/numbers/${sourceMode === "clipart" ? `clipart/${num}.png` : `signs/sign-${num}.png`}`;
      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", `${num}`);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      (i < draggableLetters.length / 2 ? leftSigns : rightSigns).appendChild(wrap);
    });

    correctMatches = 0;
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    // Save progress after completing Level 1 Page 0 (i.e. page 0 on level 1 means currentLevel=1, currentPage=0)
    // So we check if previous page just completed was Level 1 Page 0
    // Save progress when loading next page after Level 1 Page 0
    if (currentLevel > 1 || (currentLevel === 1 && currentPage > 0)) {
      saveProgress();
    }
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
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());
      correctMatches++;
      showFeedback(true);

      if (correctMatches >= (levelDefinitions[currentLevel].pages * 9 || 9)) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < currentItems.length) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= 20) {
            modal.style.display = "flex";
            gameEnded = true;
            endGame();
          } else {
            setTimeout(loadPage, 800);
          }
        }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedback(false);
    }
  }

  // Touch support for drag/drop
  function touchStart(e) {
    const target = e.target;
    const letter = target.dataset.letter;
    const src = target.src;

    const clone = target.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.7";
    clone.style.zIndex = "10000";
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
      if (el && el.classList.contains("slot")) drop({
        preventDefault: () => {},
        dataTransfer: {
          getData: k => k === "text/plain" ? letter : src
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

  // End game and submit data to Google Form
  function endGame() {
    gameEnded = true;
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    // Basic info
    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Numbers",
      "entry.1374858042": formatTime(timeTaken),
      "entry.1996137354": `${percent}%`
    };

    // Per-level correct/incorrect answers
    for (let i = 0; i < formEntryIDs.correct.length; i++) {
      entries[formEntryIDs.correct[i]] = Array.from(levelAttempts[i].correct).sort((a,b)=>a-b).join(",");
      entries[formEntryIDs.incorrect[i]] = levelAttempts[i].incorrect.sort((a,b)=>a-b).join(",");
    }

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    // Cleanup
    setTimeout(() => {
      iframe.remove();
      form.remove();
      localStorage.removeItem("numbersGameSave");
    }, 1000);
  }

  // Initial load
  if (!loadSavedProgress()) {
    currentLevel = 0;
    currentPage = 0;
  }
  loadPage();

  // Button listeners
  finishBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    endGame();
  });

  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    if (!gameEnded) loadPage();
  });

  againBtn.addEventListener("click", () => {
    localStorage.removeItem("numbersGameSave");
    location.reload();
  });

  menuBtn.addEventListener("click", () => {
    localStorage.removeItem("numbersGameSave");
    window.location.href = "../index.html";
  });

  logoutBtn.addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem("numbersGameSave"));
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
});
