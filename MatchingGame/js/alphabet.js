document.addEventListener("DOMContentLoaded", function () {
  // ==== INITIAL SETTINGS ====
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const modal = document.getElementById("end-modal");
  const endModal = modal;
  const finishBtn = document.getElementById("finish-btn");
  const continueBtn = document.getElementById("continue-btn");
  const againBtn = document.getElementById("again-btn");
  const stopBtn = document.getElementById("stop-btn");

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  // Levels config
  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 9, wideMode: true },
    { type: "imageToSign", decoys: 9, wideMode: true },
    { type: "mixed", decoys: 9, wideMode: true },
    { type: "incorrectReview", decoys: 6, wideMode: true }
  ];

  // Google Form IDs
  const formEntryIDs = {
    correct: [
      "entry.1897227570", "entry.1116300030", "entry.187975538",
      "entry.1880514176", "entry.497882042", "entry.1591755601",
      "entry.1374012635"
    ],
    incorrect: [
      "entry.1249394203", "entry.1551220511", "entry.903633326",
      "entry.856597282", "entry.552536101", "entry.922308538",
      "entry.969924717"
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

  // ==== HELPER FUNCTIONS ====
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function updateScore() {
    let totalCorrect = 0, totalIncorrect = 0;
    levelAttempts.forEach(lvl => {
      totalCorrect += lvl.correct.size;
      totalIncorrect += lvl.incorrect.length;
    });
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;
    document.getElementById("score-display").innerText = `Score: ${percent}%`;
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
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
      loadPage();
    }
  }

  // ==== DRAG & DROP ====
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
      updateScore();

      const levelPageLimit = levels[currentLevel].type === "incorrectReview" ? 1 : pagesPerLevel;

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
        dataTransfer: { getData: (k) => k === "text/plain" ? letter : src },
        currentTarget: el
      });
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  // ==== LOAD PAGE ====
  function loadPage() {
    if (gameEnded) { modal.style.display = "flex"; return; }
    if (currentLevel >= levels.length) { endGame(); return; }

    const { type: mode, decoys, wideMode } = levels[currentLevel];
    document.body.classList.toggle("wide-mode", !!wideMode);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
        mode === "imageToSign" ? "Match the Picture to the Sign" :
          mode === "mixed" ? "Match Signs and Pictures (Mixed)" :
            mode === "incorrectReview" ? "Review Incorrect Answers" : "Level");

    // Prepare currentLetters
    if (mode === "incorrectReview") {
      let incorrectLetters = [];
      for (let i = 0; i < levels.length - 1; i++) incorrectLetters = incorrectLetters.concat(levelAttempts[i].incorrect);
      incorrectLetters = [...new Set(incorrectLetters)];
      const neededCount = 9;
      if (incorrectLetters.length < neededCount) {
        const remaining = allLetters.filter(l => !incorrectLetters.includes(l));
        incorrectLetters = incorrectLetters.concat(shuffle(remaining).slice(0, neededCount - incorrectLetters.length));
      }
      currentLetters = [incorrectLetters.slice(0, neededCount)];
      currentPage = 0;
    } else {
      if (currentPage === 0 && (!currentLetters.length || currentLetters.length < pagesPerLevel)) {
        const lettersNeeded = 9;
        const shuffled = shuffle([...allLetters]);
        currentLetters = [];
        for (let page = 0; page < pagesPerLevel; page++) {
          let pageLetters = shuffled.slice(page * lettersNeeded, (page + 1) * lettersNeeded);
          if (page === 2) {
            const used = new Set(pageLetters);
            const unusedVowels = shuffle(vowels.filter(v => !used.has(v)));
            if (unusedVowels.length) pageLetters[Math.floor(Math.random() * pageLetters.length)] = unusedVowels[0];
          }
          currentLetters.push(pageLetters);
        }
      }
    }

    const pageLetters = currentLetters[currentPage];
    const slotTypes = {};

    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;
      let isSign = mode === "imageToSign" || (mode === "mixed" && Math.random() < 0.5) || mode === "incorrectReview";
      slot.style.backgroundImage = `url('assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}')`;
      slotTypes[letter] = isSign;
      gameBoard.appendChild(slot);
    });

    // Overlay correct matches
    levelAttempts[currentLevel].correct.forEach(letter => {
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

    // Prepare draggable letters
    const allDecoys = allLetters.filter(l => !pageLetters.includes(l));
    const decoyLetters = shuffle(allDecoys).slice(0, decoys);
    const draggableLetters = shuffle([...pageLetters, ...decoyLetters]);

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

      let oppositeType = mode === "signToImage" ? true :
        mode === "imageToSign" ? false :
          mode === "mixed" ? !pageLetters.includes(letter) || Math.random() < 0.5 :
            mode === "incorrectReview" ? false : false;

      img.src = `assets/alphabet/${oppositeType ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      if (i < draggableLetters.length / 2) leftSigns.appendChild(wrap);
      else rightSigns.appendChild(wrap);
    });

    correctMatches = 0;

    // Add slot listeners
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    saveProgress();
    updateScore();
  }

  // ==== END GAME ====
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;
    localStorage.removeItem("alphabetGameSave");

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;
    const currentPosition = `L${currentLevel + 1}P${currentPage + 1}`;

    let totalCorrect = 0, totalAttempts = 0;
    levelAttempts.forEach(lvl => {
      totalCorrect += lvl.correct.size;
      totalAttempts += lvl.correct.size + lvl.incorrect.length;
    });
    const percent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

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
      "entry.1996137354": `${percent}%`,
      "entry.1374858042": formattedTime,
      "entry.750436458": currentPosition
    };

    for (let i = 0; i < levels.length; i++) {
      entries[formEntryIDs.correct[i]] = Array.from(levelAttempts[i].correct).sort().join("");
      entries[formEntryIDs.incorrect[i]] = [...levelAttempts[i].incorrect].sort().join("");
    }

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    iframe.onload = () => console.log("✅ Alphabet Google Form submitted");
    form.submit();

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
    modal.style.display = "flex";
  }

  // ==== BUTTONS ====
  finishBtn.onclick = () => {
    endGame();
    setTimeout(() => window.location.href = "../index.html", 1200);
  };
  continueBtn.onclick = () => { endModal.style.display = "none"; gameEnded = false; loadPage(); };
  againBtn.onclick = () => { localStorage.removeItem("alphabetGameSave"); location.reload(); };
  stopBtn.onclick = () => {
    saveProgress();
    updateScore();
    modal.style.display = "flex";
  };

  // ==== RESUME SAVED GAME ====
  const saved = JSON.parse(localStorage.getItem("alphabetGameSave") || "null");
  if (saved) restoreProgress(saved);
  else loadPage();
});
