// ✅ Full Alphabet Matching Game Script - Complete with All Logic

document.addEventListener("DOMContentLoaded", function () {
  // --- User Info ---
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // --- DOM Elements ---
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // --- Game State ---
  let gameEnded = false;
  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 3;
  let currentLetters = [];
  let correctMatches = 0;
  let startTime = Date.now();

  // --- Constants ---
  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  // Levels configuration
  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 9, wideMode: true },
    { type: "imageToSign", decoys: 9, wideMode: true },
    { type: "mixed", decoys: 9, wideMode: true }
  ];

  // Google Form entry IDs for correct and incorrect answers per level
  const formEntryIDs = {
    correct: [
      "entry.1249394203", "entry.1551220511", "entry.903633326",
      "entry.497882042", "entry.1591755601", "entry.1996137354"
    ],
    incorrect: [
      "entry.1897227570", "entry.1116300030", "entry.187975538",
      "entry.1880514176", "entry.552536101", "entry.922308538"
    ]
  };

  // Store correct/incorrect attempts per level
  const levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // --- UI Feedback Image Setup ---
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

  // --- Utility Functions ---

  // Shuffle array in-place
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Show feedback correct/wrong
  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  // --- Drag & Drop Handler ---
  function drop(e) {
    e.preventDefault();

    const letter = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetLetter = target.dataset.letter;

    if (letter === targetLetter) {
      // First time correct match for letter at current level
      if (!levelAttempts[currentLevel].correct.has(letter)) {
        levelAttempts[currentLevel].correct.add(letter);
      }
      saveProgress();

      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);

      // Remove draggable items for matched letter
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);

      // Check if page complete
      if (correctMatches >= currentLetters[currentPage].length) {
        correctMatches = 0;
        currentPage++;

        if (currentPage < pagesPerLevel) {
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
      // Wrong match
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedback(false);

      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 500);
      }
    }
  }

  // --- Load Page Logic ---
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

    // Clear containers
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
        mode === "imageToSign" ? "Match the Picture to the Sign" :
          "Match Signs and Pictures (Mixed)");

    const lettersPerPage = 9;

    // On first page, generate all letters for all pages of this level
    if (currentPage === 0 && currentLetters.length === 0) {
      let shuffledLetters = shuffle([...allLetters]);

      currentLetters = [];

      for (let page = 0; page < pagesPerLevel; page++) {
        let pageLetters = shuffledLetters.slice(page * lettersPerPage, (page + 1) * lettersPerPage);

        // On page 3 (index 2), replace one letter with a vowel not already present
        if (page === 2) {
          const usedSet = new Set(pageLetters);
          const unusedVowels = shuffle(vowels.filter(v => !usedSet.has(v)));
          if (unusedVowels.length > 0) {
            const replaceIdx = Math.floor(Math.random() * pageLetters.length);
            pageLetters[replaceIdx] = unusedVowels[0];
          }
        }

        currentLetters.push(pageLetters);
      }
    }

    const pageLetters = currentLetters[currentPage];

    // Create slots on gameBoard
    const slotTypes = {};
    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;

      // Determine if slot is sign or image depending on mode
      let isSign;
      if (mode === "signToImage") isSign = false; // slot shows images, draggable signs
      else if (mode === "imageToSign") isSign = true; // slot shows signs, draggable images
      else isSign = Math.random() < 0.5; // mixed mode random

      slot.style.backgroundImage = `url('assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}')`;
      slotTypes[letter] = isSign;

      gameBoard.appendChild(slot);
    });

    // Prefill correct matched letters on page
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

    // Draggable letters = correct + decoys
    const allDecoys = allLetters.filter(l => !pageLetters.includes(l));
    const decoyLetters = shuffle(allDecoys).slice(0, decoys);

    const draggableLetters = shuffle([...pageLetters, ...decoyLetters]);

    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    draggableLetters.forEach((letter, i) => {
      if (matchedLetters.has(letter)) return;

      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = letter;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", letter);
        e.dataTransfer.setData("src", img.src);
      });

      img.addEventListener("touchstart", touchStart);

      // Opposite of slot type for draggable
      let oppositeType;
      if (mode === "mixed") {
        if (pageLetters.includes(letter)) oppositeType = !slotTypes[letter];
        else oppositeType = Math.random() < 0.5;
      } else if (mode === "signToImage") oppositeType = true;
      else if (mode === "imageToSign") oppositeType = false;

      img.src = `assets/alphabet/${oppositeType ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      // Split draggables into left and right columns evenly
      if (i < draggableLetters.length / 2) leftSigns.appendChild(wrap);
      else rightSigns.appendChild(wrap);
    });

    correctMatches = 0;

    // Add drag/drop listeners to slots
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    saveProgress();
  }

  // --- Touch drag support ---
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

      if (el && el.classList.contains("slot")) {
        drop({
          preventDefault: () => { },
          dataTransfer: {
            getData: (k) => k === "text/plain" ? letter : src
          },
          currentTarget: el
        });
      }

      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  // --- Save Progress ---
  function saveProgress() {
    if (currentLevel === 0 && currentPage === 0 && correctMatches === 0) return; // avoid empty saves

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

  // --- Restore Progress ---
  function restoreProgress(data) {
    if (data.studentName !== studentName || data.studentClass !== studentClass) return;
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

  // --- Send saved data on logout ---
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

  // --- End Game Logic ---
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    localStorage.removeItem("alphabetGameSave");

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;

    // Create and submit Google Form with results
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
    for (let i = 0; i
