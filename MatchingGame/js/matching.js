// ✅ Full Alphabet Matching Game Script with All Logic + Level 20 Incorrect Revisit + Touch Drag Fix

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
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");
  const endModalContent = document.getElementById("end-modal-content");
  const scoreDisplay = document.getElementById("score-display");

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
    { type: "incorrectReview", decoys: 6, wideMode: true } // Level 20
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

  const levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)", width: "200px",
    display: "none", zIndex: "1000"
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
      if (!levelAttempts[currentLevel].correct.has(letter)) levelAttempts[currentLevel].correct.add(letter);
      saveProgress();
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());
      correctMatches++;
      showFeedback(true);
      const levelLimit = levels[currentLevel].type === "incorrectReview" ? 1 : pagesPerLevel;
      if (correctMatches >= currentLetters[currentPage].length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < levelLimit) setTimeout(loadPage, 800);
        else {
          currentLevel++;
          currentPage = 0;
          saveProgress();
          if (currentLevel >= levels.length) setTimeout(endGame, 800);
          else setTimeout(loadPage, 800);
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
      totalAttempts += totalCorrect + (data.levelAttempts[i]?.incorrect.length || 0);
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

    // Handle Level 20 incorrectReview separately
    if (mode === "incorrectReview") {
      // Collect all incorrect answers from previous levels
      let incorrectLetters = [];
      for (let i = 0; i < levels.length - 1; i++) { // exclude last level (incorrectReview itself)
        incorrectLetters = incorrectLetters.concat(levelAttempts[i].incorrect);
      }
      // Remove duplicates
      incorrectLetters = [...new Set(incorrectLetters)];
      // If not enough incorrects, fill with random letters to decoys count
      if (incorrectLetters.length < decoys + 3) {
        const needed = decoys + 3 - incorrectLetters.length;
        const remainingLetters = allLetters.filter(l => !incorrectLetters.includes(l));
        incorrectLetters = incorrectLetters.concat(shuffle(remainingLetters).slice(0, needed));
      }
      currentLetters = [incorrectLetters.slice(0, decoys + 3)];
    } else {
      // Pick letters for the page: 9 letters per page, no repeats per level page
      const lettersNeeded = 9;
      // On first page of a level, precompute letters for all pages if not restored
      if (currentPage === 0 && currentLetters.length === 0) {
        const shuffledLetters = shuffle([...allLetters]);
        currentLetters = [];
        for (let page = 0; page < pagesPerLevel; page++) {
          let pageLetters = shuffledLetters.slice(page * lettersNeeded, (page + 1) * lettersNeeded);
          // For page 3 (index 2), replace one letter with a vowel not already in the page
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
    }

    const pageLetters = currentLetters[currentPage] || [];

    // Create slots in the gameBoard for page letters, randomly mix signs/cliparts based on mode
    const slotTypes = {};
    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;

      let isSign;
      if (mode === "signToImage") {
        isSign = false; // gameBoard shows images
      } else if (mode === "imageToSign") {
        isSign = true; // gameBoard shows signs
      } else if (mode === "mixed") {
        isSign = Math.random() < 0.5;
      } else if (mode === "incorrectReview") {
        // For level 20, show signs only on left, images on right (like signToImage)
        isSign = false;
      } else {
        isSign = false;
      }

      slotTypes[letter] = isSign;

      const img = document.createElement("img");
      img.dataset.letter = letter;
      img.className = "slot-image";

      if (isSign) {
        img.src = `assets/signs/${letter}.png`;
        img.alt = `Sign for ${letter}`;
      } else {
        img.src = `assets/clipart/${letter}.png`;
        img.alt = `Image for ${letter}`;
      }
      slot.appendChild(img);
      gameBoard.appendChild(slot);
    });

    // Create draggable items on left and right containers
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Draggables for left or right side depend on mode
    let draggableSide = [];
    if (mode === "signToImage" || mode === "incorrectReview") {
      // left = signs, right = images
      draggableSide = ["signs", "images"];
    } else if (mode === "imageToSign") {
      draggableSide = ["images", "signs"];
    } else if (mode === "mixed") {
      draggableSide = ["mixed", "mixed"];
    }

    // Compose lists for left and right draggable sets
    const leftLetters = [];
    const rightLetters = [];

    pageLetters.forEach(letter => {
      if (draggableSide[0] === "signs") leftLetters.push(letter);
      else if (draggableSide[0] === "images") leftLetters.push(letter);
      else if (draggableSide[0] === "mixed") {
        if (Math.random() < 0.5) leftLetters.push(letter);
        else rightLetters.push(letter);
      }

      if (draggableSide[1] === "signs") rightLetters.push(letter);
      else if (draggableSide[1] === "images") rightLetters.push(letter);
      else if (draggableSide[1] === "mixed") {
        if (Math.random() < 0.5) rightLetters.push(letter);
        else leftLetters.push(letter);
      }
    });

    // Remove duplicates in case both sides got the same letter
    const uniqueLeft = [...new Set(leftLetters)];
    const uniqueRight = [...new Set(rightLetters)];

    // Add decoys randomly from other letters (not in pageLetters)
    let decoyLetters = shuffle(allLetters.filter(l => !pageLetters.includes(l)));
    decoyLetters = decoyLetters.slice(0, decoys);

    // Add decoys to both sides, split half-half roughly
    const decoysLeft = decoyLetters.slice(0, Math.ceil(decoys / 2));
    const decoysRight = decoyLetters.slice(Math.ceil(decoys / 2));

    decoysLeft.forEach(l => uniqueLeft.push(l));
    decoysRight.forEach(l => uniqueRight.push(l));

    // Shuffle again so they don't appear sorted
    const finalLeft = shuffle(uniqueLeft);
    const finalRight = shuffle(uniqueRight);

    // Helper to create draggable img element
    function createDraggable(letter, isSignSide) {
      const img = document.createElement("img");
      img.src = isSignSide ? `assets/signs/${letter}.png` : `assets/clipart/${letter}.png`;
      img.alt = letter;
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = letter;

      img.addEventListener("dragstart", (ev) => {
        ev.dataTransfer.setData("text/plain", letter);
        ev.dataTransfer.setData("src", img.src);
      });

      // Touch drag fix: clone with correct size
      img.addEventListener("touchstart", function touchStart(e) {
        e.preventDefault();
        const target = e.target;
        const letter = target.dataset.letter;
        const src = target.src;

        const clone = target.cloneNode(true);
        clone.style.position = "absolute";
        clone.style.pointerEvents = "none";
        clone.style.opacity = "0.7";
        clone.style.zIndex = "10000";

        const style = window.getComputedStyle(target);
        clone.style.width = style.width;
        clone.style.height = style.height;

        document.body.appendChild(clone);

        const cloneWidth = parseFloat(clone.style.width);
        const cloneHeight = parseFloat(clone.style.height);

        const moveClone = (touch) => {
          clone.style.left = `${touch.clientX - cloneWidth / 2}px`;
          clone.style.top = `${touch.clientY - cloneHeight / 2}px`;
        };

        moveClone(e.touches[0]);

        const handleTouchMove = (ev) => {
          moveClone(ev.touches[0]);
        };

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
      });

      return img;
    }

    finalLeft.forEach(letter => {
      const isSignSide = (draggableSide[0] === "signs" || (draggableSide[0] === "mixed" && Math.random() < 0.5));
      const img = createDraggable(letter, isSignSide);
      leftSigns.appendChild(img);
    });

    finalRight.forEach(letter => {
      const isSignSide = (draggableSide[1] === "signs" || (draggableSide[1] === "mixed" && Math.random() < 0.5));
      const img = createDraggable(letter, isSignSide);
      rightSigns.appendChild(img);
    });

    // Add drop event listeners to slots
    document.querySelectorAll(".slot").forEach(slot => {
      slot.ondragover = (ev) => ev.preventDefault();
      slot.ondrop = drop;
    });

    correctMatches = 0;
  }

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
