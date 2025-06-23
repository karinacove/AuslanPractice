document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const againBtn = document.getElementById("again-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");

  if (finishBtn) finishBtn.addEventListener("click", () => {
    gameEnded = false;
    endGame();
  });
  if (againBtn) againBtn.addEventListener("click", () => location.reload());
  if (menuBtn) menuBtn.addEventListener("click", () => window.location.href = "../index.html");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 9, wideMode: true },
    { type: "imageToSign", decoys: 9, wideMode: true },
    { type: "mixed", decoys: 9, wideMode: true }
  ];

  // Explicit mapping for Google Form entries (correct & incorrect)
  const formEntryIDs = {
    correct: [
      "entry.1249394203", // Level 1
      "entry.1551220511", // Level 2
      "entry.903633326",  // Level 3
      "entry.497882042",  // Level 4
      "entry.1591755601",  // Level 5
      "entry.1996137354"   // Level 6
    ],
    incorrect: [
      "entry.1897227570", // Level 1
      "entry.1116300030", // Level 2
      "entry.187975538",  // Level 3
      "entry.1880514176", // Level 4
      "entry.552536101",  // Level 5
      "entry.922308538"   // Level 6
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
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());
      correctMatches++;
      showFeedback(true);

     if (correctMatches >= currentLetters[currentPage].length) {
      correctMatches = 0;
      currentPage++;
      if (currentPage < pagesPerLevel) {
        setTimeout(loadPage, 800);
      } else {
        currentLevel++;
        currentPage = 0;
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

    // Add each level's correct and incorrect answers explicitly by mapping
    for (let i = 0; i < levels.length; i++) {
      const correct = Array.from(levelAttempts[i].correct).sort().join("");
      const incorrect = levelAttempts[i].incorrect.sort().join("");
      entries[formEntryIDs.correct[i]] = correct;
      entries[formEntryIDs.incorrect[i]] = incorrect;
    }

    // Calculate final percentage
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

  function loadPage() {
    const { type: mode, decoys, wideMode } = levels[currentLevel];

    // Toggle wide-mode class on container for levels 4-6
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
       "Match Signs and Pictures (Mixed)");

    // Pick letters for the page: 9 letters per page, no repeats per level page
    // We must ensure all letters appear once per level (3 pages), and page 3 adds a vowel not already shown on that page
    const lettersNeeded = 9;
    const totalLettersNeeded = pagesPerLevel * lettersNeeded; // 27 per level

    // On the first page of a level, precompute letters for all 3 pages
    if (currentPage === 0) {
      // Make a copy of all letters and shuffle
      const shuffledLetters = shuffle([...allLetters]);

      // Pick lettersNeeded * pagesPerLevel letters for this level
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

    const pageLetters = currentLetters[currentPage];

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
      } else {
        isSign = Math.random() < 0.5; // mixed: random sign or image
      }
      slot.style.backgroundImage = `url('assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}')`;
      slotTypes[letter] = isSign;
      gameBoard.appendChild(slot);
    });

    // Prepare draggables: correct answers are opposite of slot type, decoys random of both types
    const allDecoys = allLetters.filter(l => !pageLetters.includes(l));
    const decoyLetters = shuffle(allDecoys).slice(0, decoys);

    // Draggables = correct letters + decoys
    const draggableLetters = shuffle([...pageLetters, ...decoyLetters]);

    // Clear left and right container before appending
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

      // Determine opposite type for draggable (opposite of slot type if letter is correct)
      let oppositeType;
      if (mode === "mixed") {
        if (pageLetters.includes(letter)) {
          oppositeType = !slotTypes[letter];
        } else {
          oppositeType = Math.random() < 0.5; // decoys random
        }
      } else if (mode === "signToImage") {
        oppositeType = true; // draggables are signs
      } else if (mode === "imageToSign") {
        oppositeType = false; // draggables are images
      }

      img.src = `assets/alphabet/${oppositeType ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      // Distribute roughly half in left, half in right container
      if (i < draggableLetters.length / 2) {
        leftSigns.appendChild(wrap);
      } else {
        rightSigns.appendChild(wrap);
      }
    });

    correctMatches = 0;

    // Add event listeners to slots
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
  }

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
      if (el && el.classList.contains("slot")) drop({
        preventDefault: () => {},
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

  loadPage();

});
