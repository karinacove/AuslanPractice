// Full Complete Numbers Matching Game Script
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

  // Google Form Entry IDs
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

  function sortNumbers(a, b) {
    return parseInt(a) - parseInt(b);
  }

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

  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = [];
  let currentPageItems = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  const levelAttempts = Array(20).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  // Save progress to localStorage after Level 1 Page 0 complete or after every page
  function saveProgress() {
    const saveData = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      levelAttempts: levelAttempts.map(lvl => ({
        correct: Array.from(lvl.correct),
        incorrect: lvl.incorrect.slice()
      })),
      startTime
    };
    localStorage.setItem("numbersGameSave", JSON.stringify(saveData));
  }

  // Load saved progress, returns true if progress loaded
  function loadProgress() {
    const saved = localStorage.getItem("numbersGameSave");
    if (!saved) return false;

    try {
      const data = JSON.parse(saved);
      if (data.studentName !== studentName || data.studentClass !== studentClass) return false;

      currentLevel = data.currentLevel || 0;
      currentPage = data.currentPage || 0;
      for (let i = 0; i < data.levelAttempts.length; i++) {
        levelAttempts[i].correct = new Set(data.levelAttempts[i].correct || []);
        levelAttempts[i].incorrect = data.levelAttempts[i].incorrect || [];
      }
      startTime = data.startTime || Date.now();
      return true;
    } catch (e) {
      return false;
    }
  }

  // On logout, send saved data to Google Forms then clear and redirect
  function sendSavedDataToForm(saved, callback) {
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
      "entry.1387461004": saved.studentName,
      "entry.1309291707": saved.studentClass,
      "entry.477642881": "Numbers",
      "entry.1374858042": (() => {
        const now = Date.now();
        const timeTaken = Math.round((now - saved.startTime) / 1000);
        return `${Math.floor(timeTaken / 60)} mins ${timeTaken % 60} sec`;
      })()
    };

    for (let i = 0; i < formEntryIDs.correct.length; i++) {
      const correctSorted = (saved.levelAttempts[i]?.correct || []).slice().sort(sortNumbers);
      const incorrectSorted = (saved.levelAttempts[i]?.incorrect || []).slice().sort(sortNumbers);
      entries[formEntryIDs.correct[i]] = correctSorted.join(",");
      entries[formEntryIDs.incorrect[i]] = incorrectSorted.join(",");
    }

    const totalCorrect = saved.levelAttempts.reduce((sum, lvl) => sum + (lvl.correct ? lvl.correct.length : 0), 0);
    const totalIncorrect = saved.levelAttempts.reduce((sum, lvl) => sum + (lvl.incorrect ? lvl.incorrect.length : 0), 0);
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

    // Wait briefly to allow form submit before callback
    setTimeout(() => {
      callback();
    }, 500);
  }

  // Called when game ends or finish clicked
  function endGame() {
    gameEnded = true;
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const formattedTime = `${Math.floor(timeTaken / 60)} mins ${timeTaken % 60} sec`;

    modal.style.display = "flex";

    // Display score and time
    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    document.getElementById("score-display").innerText = `Score: ${percent}%`;

    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    const modalContent = document.getElementById("end-modal-content");
    // Remove old time display if exists
    const oldTimeDisplay = modalContent.querySelector("p");
    if (oldTimeDisplay) modalContent.removeChild(oldTimeDisplay);
    modalContent.appendChild(timeDisplay);

    saveProgress();
  }

function updateScore() {
  const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
  const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
  const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;
  document.getElementById("score-display").innerText = `Score: ${percent}%`;
}

function loadPage() {
  if (gameEnded) {
    modal.style.display = "flex";
    return;
  }

  if (currentLevel >= levels.length) {
    endGame();
    return;
  }

  const { type: mode, decoys, wideMode } = levels[currentLevel];

  if (wideMode) {
    document.body.classList.add("wide-mode");
  } else {
    document.body.classList.remove("wide-mode");
  }

  gameBoard.innerHTML = "";
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  levelTitle.innerText = `Level ${currentLevel + 1}: ` +
    (mode === "signToImage" ? "Match the Sign to the Picture" :
      mode === "imageToSign" ? "Match the Picture to the Sign" :
        mode === "mixed" ? "Match Signs and Pictures (Mixed)" :
          mode === "incorrectReview" ? "Review Incorrect Answers" : "Level");

  // FIXED: For Level 20 (incorrectReview), build currentLetters from previously incorrect answers or random letters if none
  if (mode === "incorrectReview") {
    // Collect incorrect letters from all previous levels
    let incorrectLetters = [];
    for (let i = 0; i < levels.length - 1; i++) {
      incorrectLetters = incorrectLetters.concat(levelAttempts[i].incorrect);
    }
    incorrectLetters = [...new Set(incorrectLetters)]; // unique letters

    // If not enough incorrect letters, add random letters to fill page
    const neededCount = 9;
    if (incorrectLetters.length < neededCount) {
      const remainingLetters = allLetters.filter(l => !incorrectLetters.includes(l));
      incorrectLetters = incorrectLetters.concat(shuffle(remainingLetters).slice(0, neededCount - incorrectLetters.length));
    }

    currentLetters = [incorrectLetters.slice(0, neededCount)];
    currentPage = 0;
  }

  // For other levels, build currentLetters if first page or empty
  if (mode !== "incorrectReview") {
    if (currentPage === 0 && (!currentLetters.length || currentLetters.length < pagesPerLevel)) {
      const lettersNeeded = 9;
      const totalLettersNeeded = pagesPerLevel * lettersNeeded; // 27 per level

      // Make a copy of all letters and shuffle
      const shuffledLetters = shuffle([...allLetters]);

      currentLetters = [];

      for (let page = 0; page < pagesPerLevel; page++) {
        let pageLetters = shuffledLetters.slice(page * lettersNeeded, (page + 1) * lettersNeeded);

        // For page 3 (index 2), replace one letter with a vowel not already in the page
        if (page === 2) {
          const usedSet = new Set(pageLetters);
          const unusedVowels = shuffle(vowels.filter(v => !usedSet.has(v)));
          if (unusedVowels.length > 0) {
            // Replace a random letter with this vowel
            const replaceIdx = Math.floor(Math.random() * pageLetters.length);
            pageLetters[replaceIdx] = unusedVowels[0];
          }
        }
        currentLetters.push(pageLetters);
      }
    }
  }

  const pageLetters = currentLetters[currentPage];

  // Build slots on gameBoard, slot types stored for opposites
  const slotTypes = {};
  gameBoard.innerHTML = "";
  pageLetters.forEach(letter => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.letter = letter;

    let isSign;
    if (mode === "signToImage") {
      isSign = false; // show images on slots
    } else if (mode === "imageToSign") {
      isSign = true; // show signs on slots
    } else if (mode === "mixed") {
      isSign = Math.random() < 0.5;
    } else if (mode === "incorrectReview") {
      // For review, show signs on slots
      isSign = true;
    } else {
      isSign = false;
    }

    slot.style.backgroundImage = `url('assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}')`;
    slotTypes[letter] = isSign;
    gameBoard.appendChild(slot);
  });

  // Prefill correct matches overlays
  const matchedLetters = new Set(levelAttempts[currentLevel].correct);
  matchedLetters.forEach(letter => {
    const slot = [...document.querySelectorAll(".slot")].find(s => s.dataset.letter === letter);
    if (slot) {
      const overlay = document.createElement("img");
      const isSign = slot.style.backgroundImage.includes("sign-");
      overlay.src = `assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;
      overlay.className = "overlay";
      slot.innerHTML = "";
      slot.appendChild(overlay);
    }
  });

  // Prepare draggables = correct opposites + decoys
  const allDecoys = allLetters.filter(l => !pageLetters.includes(l));
  const decoyLetters = shuffle(allDecoys).slice(0, decoys);

  const draggableLetters = shuffle([...pageLetters, ...decoyLetters]);

  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  draggableLetters.forEach((letter, i) => {
    const img = document.createElement("img");
    img.className = "draggable";
    img.draggable = true;
    img.dataset.letter = letter;

    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", letter);
      e.dataTransfer.setData("src", img.src);
    });
    img.addEventListener("touchstart", touchStart);

    // Determine opposite type for draggable
    let oppositeType;
    if (mode === "mixed") {
      if (pageLetters.includes(letter)) {
        oppositeType = !slotTypes[letter];
      } else {
        oppositeType = Math.random() < 0.5;
      }
    } else if (mode === "signToImage") {
      oppositeType = true;
    } else if (mode === "imageToSign") {
      oppositeType = false;
    } else if (mode === "incorrectReview") {
      oppositeType = false; // show images for draggable in review (opposite of signs)
    } else {
      oppositeType = false;
    }

    img.src = `assets/alphabet/${oppositeType ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

    const wrap = document.createElement("div");
    wrap.className = "drag-wrapper";
    wrap.appendChild(img);

    if (i < draggableLetters.length / 2) {
      leftSigns.appendChild(wrap);
    } else {
      rightSigns.appendChild(wrap);
    }
  });

  correctMatches = 0;

  // Add event listeners for slots
  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", drop);
  });

  saveProgress();

  updateScore(); 
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

      if (correctMatches >= currentPageItems.length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < currentLetters.length) {
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
        preventDefault: () => { },
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

  // Event listeners for buttons
  finishBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    gameEnded = true;
    endGame();
  });

  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    loadPage();
  });

  againBtn.addEventListener("click", () => {
    localStorage.removeItem("numbersGameSave");
    location.reload();
  });

  menuBtn.addEventListener("click", () => {
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

  // Initialize game
  if (!loadProgress()) {
    currentLevel = 0;
    currentPage = 0;
  }
  loadPage();
});
