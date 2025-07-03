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
    { type: "incorrectReview", decoys: 6, wideMode: true }
  ];

  // Google Form entry IDs updated for 7 levels now
  const formEntryIDs = {
    correct: [
      "entry.1897227570", // Level 1
      "entry.1116300030", // Level 2
      "entry.187975538",  // Level 3
      "entry.1880514176", // Level 4
      "entry.497882042",  // Level 5
      "entry.1591755601",  // Level 6
    ],
    incorrect: [
      "entry.1249394203", // Level 1
      "entry.1551220511", // Level 2
      "entry.903633326",  // Level 3
      "entry.856597282",  // Level 4
      "entry.552536101",  // Level 5
      "entry.922308538",  // Level 6
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

  function updateScore() {
    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;
    document.getElementById("score-display").innerText = `Score: ${percent}%`;
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
      updateScore()

      // FIXED: Level 7 only has 1 page, others 3 pages
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
