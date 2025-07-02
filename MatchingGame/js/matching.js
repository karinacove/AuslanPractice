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
  const endModalContent = document.getElementById("end-modal-content");
  const scoreDisplay = document.getElementById("score-display");

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  let gameEnded = false;
  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 3;
  let currentLetters = [];
  let correctMatches = 0;
  let startTime = Date.now();

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 9, wideMode: true },
    { type: "imageToSign", decoys: 9, wideMode: true },
    { type: "mixed", decoys: 9, wideMode: true },
    { type: "incorrectReview", decoys: 6, wideMode: true }
  ];

  const formEntryIDs = {
    correct: [
      "entry.1249394203", "entry.1551220511", "entry.903633326",
      "entry.497882042", "entry.1591755601", "entry.1996137354",
      "entry.1234567890"
    ],
    incorrect: [
      "entry.1897227570", "entry.1116300030", "entry.187975538",
      "entry.1880514176", "entry.552536101", "entry.922308538",
      "entry.0987654321"
    ]
  };

  const levelAttempts = Array(levels.length).fill(null).map(() => ({
    correct: new Set(),
    incorrect: []
  }));

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

  if (finishBtn) finishBtn.addEventListener("click", () => {
    if (!gameEnded) endGame();
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
        levelAttempts[currentLevel].incorrect = levelAttempts[currentLevel].incorrect.filter(l => l !== letter);
      }
      saveProgress();

      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);

      // Remove draggable from both sides (left and right)
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);

      const levelLimit = levels[currentLevel].type === "incorrectReview" ? 1 : pagesPerLevel;
      if (correctMatches >= currentLetters[currentPage].length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < levelLimit) {
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

    let totalCorrect = 0;
    let totalAttempts = 0;
    for (let i = 0; i < levels.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct).sort();
      const incorrectArr = [...levelAttempts[i].incorrect].sort();
      totalCorrect += correctArr.length;
      totalAttempts += correctArr.length + incorrectArr.length;
      entries[formEntryIDs.correct[i]] = correctArr.join("");
      entries[formEntryIDs.incorrect[i]] = incorrectArr.join("");
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
    form.submit();

    scoreDisplay.innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    endModalContent.appendChild(timeDisplay);
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
      if (callback) callback();
    };

    document.body.appendChild(form);
    form.submit();
  }

  function saveProgress() {
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
    endModalContent.innerHTML = "";
    scoreDisplay.innerText = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       mode === "mixed" ? "Match Signs and Pictures (Mixed)" :
       mode === "incorrectReview" ? "Review Incorrect Answers" : "");

    // Prepare letters for this page
    if (mode === "incorrectReview") {
      const allIncorrect = [];
      for (let i = 0; i < levels.length - 1; i++) {
        allIncorrect.push(...levelAttempts[i].incorrect);
      }
      const uniqueIncorrect = [...new Set(allIncorrect)];
      let lettersForPage = [];
      if (uniqueIncorrect.length >= 9) {
        lettersForPage = uniqueIncorrect.slice(0, 9);
      } else {
        const alreadyCorrect = new Set();
        for (let i = 0; i < levels.length - 1; i++) {
          levelAttempts[i].correct.forEach(l => alreadyCorrect.add(l));
        }
        const availableLetters = allLetters.filter(l => !alreadyCorrect.has(l));
        const shuffledAvailable = shuffle(availableLetters);
        lettersForPage = [...uniqueIncorrect, ...shuffledAvailable].slice(0, 9);
      }
      currentLetters = [lettersForPage];
      currentPage = 0;
    } else {
      if (currentPage === 0 && currentLetters.length === 0) {
        const lettersNeeded = 9;
        const totalLettersNeeded = pagesPerLevel * lettersNeeded;

        const shuffledLetters = shuffle([...allLetters]);
        currentLetters = [];

        for (let p = 0; p < pagesPerLevel; p++) {
          let pageLetters = shuffledLetters.slice(p * lettersNeeded, (p + 1) * lettersNeeded);
          if (p === 2) {
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
    }

    const pageLetters = currentLetters[currentPage];

    // Create slots in gameBoard
    const slotTypes = {}; // letter => true if sign, false if image
    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;

      let isSign;
      if (mode === "signToImage") {
        isSign = false;
      } else if (mode === "imageToSign") {
        isSign = true;
      } else if (mode === "mixed") {
        isSign = Math.random() < 0.5;
      } else if (mode === "incorrectReview") {
        isSign = Math.random() < 0.5;
      }
      slotTypes[letter] = isSign;
      slot.style.backgroundImage = `url('assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}')`;
      gameBoard.appendChild(slot);
    });

    // Show overlays for previously matched letters
    const matchedLetters = new Set(levelAttempts[currentLevel].correct);
    const slots = gameBoard.querySelectorAll(".slot");
    slots.forEach(slot => {
      const letter = slot.dataset.letter;
      if (matchedLetters.has(letter)) {
        slot.innerHTML = "";
        const overlay = document.createElement("img");
        const isSign = slotTypes[letter];
        overlay.src = `assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;
        overlay.className = "overlay";
        slot.appendChild(overlay);
      }
    });

    // Prepare draggables for left and right sides
    // Depending on mode:
    // signToImage: left = signs, right = images
    // imageToSign: left = images, right = signs
    // mixed: random

    // Letters to use as draggables = pageLetters + decoys (random letters not in pageLetters)
    const decoyLetters = shuffle(allLetters.filter(l => !pageLetters.includes(l))).slice(0, decoys);
    const draggableLetters = shuffle([...pageLetters, ...decoyLetters]);

    // Clear left and right
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Create draggables for each letter and place on left or right depending on mode

    // Helper function to create draggable element
    function createDraggable(letter, isSign) {
      const draggable = document.createElement("img");
      draggable.className = "draggable";
      draggable.draggable = true;
      draggable.dataset.letter = letter;
      draggable.src = `assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      draggable.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", letter);
        e.dataTransfer.setData("src", draggable.src);
      });

      draggable.addEventListener("touchstart", touchStartHandler);
      draggable.addEventListener("touchmove", touchMoveHandler);
      draggable.addEventListener("touchend", touchEndHandler);

      return draggable;
    }

    // Split draggableLetters roughly half and half
    const half = Math.ceil(draggableLetters.length / 2);
    const leftLetters = draggableLetters.slice(0, half);
    const rightLetters = draggableLetters.slice(half);

    leftLetters.forEach(letter => {
      let isSignForDraggable;
      if (mode === "signToImage") {
        isSignForDraggable = true; // left signs
      } else if (mode === "imageToSign") {
        isSignForDraggable = false; // left images
      } else if (mode === "mixed") {
        isSignForDraggable = Math.random() < 0.5;
      } else if (mode === "incorrectReview") {
        isSignForDraggable = Math.random() < 0.5;
      }
      const d = createDraggable(letter, isSignForDraggable);
      leftSigns.appendChild(d);
    });

    rightLetters.forEach(letter => {
      let isSignForDraggable;
      if (mode === "signToImage") {
        isSignForDraggable = false; // right images
      } else if (mode === "imageToSign") {
        isSignForDraggable = true; // right signs
      } else if (mode === "mixed") {
        isSignForDraggable = Math.random() < 0.5;
      } else if (mode === "incorrectReview") {
        isSignForDraggable = Math.random() < 0.5;
      }
      const d = createDraggable(letter, isSignForDraggable);
      rightSigns.appendChild(d);
    });

    // Setup drop targets on slots
    slots.forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
      slot.addEventListener("touchstart", touchStartHandler);
      slot.addEventListener("touchmove", touchMoveHandler);
      slot.addEventListener("touchend", touchEndHandler);
    });

    levelTitle.innerText = `Level ${currentLevel + 1} / Page ${currentPage + 1}`;

    saveProgress();
  }

  // Touch drag/drop handlers (basic support)
  let draggedElement = null;
  let touchX = 0, touchY = 0;

  function touchStartHandler(e) {
    e.preventDefault();
    draggedElement = e.target;
    if (!draggedElement.classList.contains("draggable")) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }

  function touchMoveHandler(e) {
    e.preventDefault();
    if (!draggedElement) return;
    const moveX = e.touches[0].clientX - touchX;
    const moveY = e.touches[0].clientY - touchY;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    const style = draggedElement.style;
    style.position = "fixed";
    style.zIndex = 1000;
    style.left = (draggedElement.offsetLeft + moveX) + "px";
    style.top = (draggedElement.offsetTop + moveY) + "px";
  }

  function touchEndHandler(e) {
    e.preventDefault();
    if (!draggedElement) return;

    // Detect drop target by element under finger
    const touch = e.changedTouches[0];
    draggedElement.style.position = "";
    draggedElement.style.zIndex = "";
    draggedElement.style.left = "";
    draggedElement.style.top = "";

    draggedElement.hidden = true;
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    draggedElement.hidden = false;

    if (elem && elem.classList.contains("slot")) {
      // Manually trigger drop with DataTransfer
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/plain", draggedElement.dataset.letter);
      dataTransfer.setData("src", draggedElement.src);
      const event = new DragEvent("drop", {
        dataTransfer
      });
      elem.dispatchEvent(event);
    }

    draggedElement = null;
  }

  // On page load: restore or start fresh
  const saved = JSON.parse(localStorage.getItem("alphabetGameSave"));
  if (saved && saved.studentName === studentName && saved.studentClass === studentClass && !saved.gameEnded && saved.currentPage >= 0) {
    if (confirm("Resume your unfinished game?")) {
      restoreProgress(saved);
      loadPage();
    } else {
      localStorage.removeItem("alphabetGameSave");
      loadPage();
    }
  } else {
    loadPage();
  }
});
