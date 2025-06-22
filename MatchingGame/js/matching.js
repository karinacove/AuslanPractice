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

  if (finishBtn) finishBtn.addEventListener("click", () => endGame());
  if (againBtn) againBtn.addEventListener("click", () => location.reload());
  if (menuBtn) menuBtn.addEventListener("click", () => window.location.href = "../index.html");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  const levels = [
    { type: "imageToSign", decoys: 3, dragType: "clipart", lettersPerPage: 9, draggablesCount: 12 },
    { type: "signToImage", decoys: 3, dragType: "sign", lettersPerPage: 9, draggablesCount: 12 },
    { type: "mixed", decoys: 3, dragType: "mixed", lettersPerPage: 9, draggablesCount: 12 },
    { type: "imageToSign", decoys: 9, dragType: "clipart", lettersPerPage: 18, draggablesCount: 18 },
    { type: "signToImage", decoys: 9, dragType: "sign", lettersPerPage: 18, draggablesCount: 18 },
    { type: "mixed", decoys: 9, dragType: "mixed", lettersPerPage: 18, draggablesCount: 18, isReview: true }
  ];

  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 3;

  const letterStats = {};
  allLetters.forEach(letter => {
    letterStats[letter] = {
      attempts: 0,
      correctAttempts: 0,
      firstCorrectOnPage: false,
      pageAttempts: [],
      currentPageAttempt: "",
      incorrectAttempts: ""
    };
  });

  let correctMatches = 0;
  let startTime = Date.now();

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

  function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.letter);
    e.dataTransfer.setData("src", e.target.src);
    e.target.classList.add("dragging");
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function drop(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    handleDrop(e.currentTarget, letter, src);
  }

  function handleDrop(slot, letter, src) {
    const stats = letterStats[letter];
    stats.attempts++;
    const firstAttemptThisPage = stats.currentPageAttempt.length === 0;

    if (slot.dataset.letter === letter) {
      stats.correctAttempts++;
      if (!stats.firstCorrectOnPage) {
        stats.firstCorrectOnPage = true;
        stats.currentPageAttempt += letter;
      }

      showFeedback(true);

      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      slot.appendChild(overlay);

      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());

      correctMatches++;
      console.log(`Correct Matches: ${correctMatches} / ${getCurrentGridCount()} (Level ${currentLevel+1} Page ${currentPage+1})`);
      if (correctMatches >= getCurrentGridCount()) {
        correctMatches = 0;
        saveCurrentPageAttempts();

        currentPage++;
        if (currentPage < pagesPerLevel) {
          console.log(`Moving to Page ${currentPage+1} of Level ${currentLevel+1}`);
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= levels.length) {
            console.log("All levels complete, ending game.");
            setTimeout(endGame, 800);
          } else {
            console.log(`Starting Level ${currentLevel+1}`);
            setTimeout(loadPage, 800);
          }
        }
      }
    } else {
      showFeedback(false);
      if (!stats.firstCorrectOnPage && firstAttemptThisPage) {
        stats.currentPageAttempt += "*";
      }
      stats.incorrectAttempts += letter;

      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 500);
      }
    }
  }

  function saveCurrentPageAttempts() {
    allLetters.forEach(letter => {
      const stats = letterStats[letter];
      stats.pageAttempts.push(stats.currentPageAttempt || "");
      stats.currentPageAttempt = "";
      stats.firstCorrectOnPage = false;
    });
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  function endGame() {
    saveCurrentPageAttempts();
    const endTime = Date.now();
    const time = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const formatted = `${minutes} mins ${seconds} sec`;

    const correctEntries = allLetters.map(letter => letterStats[letter].pageAttempts.join(""));
    const incorrectEntries = allLetters.map(letter => letterStats[letter].incorrectAttempts || "").filter(Boolean);

    const scorePercent = correctEntries.filter(s => !s.includes("*")).length / 26 * 100;

    document.getElementById("score-display").innerText = `Score: ${Math.round(scorePercent)}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formatted}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Alphabet",
      "entry.1897227570": incorrectEntries.join(", "),
      "entry.1249394203": correctEntries.join(", "),
      "entry.1996137354": `${Math.round(scorePercent)}%`,
      "entry.1374858042": formatted
    };

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    modal.style.display = "flex";
  }

  function getCurrentGridCount() {
    if (currentLevel <= 2 && currentPage === 2) return 27;
    if (currentLevel <= 2) return 9;
    return 18;
  }

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function loadPage() {
    if (currentLevel >= levels.length) return endGame();

    console.log(`Loading Level ${currentLevel + 1}, Page ${currentPage + 1}`);

    const container = document.getElementById("game-container") || document.body;
    container.classList.toggle("wide-mode", currentLevel >= 3);

    const { type: mode, decoys, dragType, lettersPerPage, draggablesCount, isReview } = levels[currentLevel];

    allLetters.forEach(l => {
      letterStats[l].firstCorrectOnPage = false;
      letterStats[l].currentPageAttempt = "";
    });

    let slotLetters = [];
    let draggableLetters = [];

    if (currentLevel <= 2 && currentPage === 2) {
      // Level 1-3, page 3: all 26 letters + 1 extra vowel (27 letters)
      const extraVowel = vowels[Math.floor(Math.random() * vowels.length)];
      slotLetters = [...allLetters, extraVowel];
    } else if (isReview) {
      const incorrectSorted = allLetters
        .filter(l => letterStats[l].incorrectAttempts.length > 0)
        .sort((a, b) => letterStats[b].incorrectAttempts.length - letterStats[a].incorrectAttempts.length);
      slotLetters = incorrectSorted.length > 0 ? incorrectSorted.slice(0, lettersPerPage) : shuffle(allLetters).slice(0, lettersPerPage);
    } else {
      slotLetters = shuffle(allLetters).slice(0, lettersPerPage);
    }

    // Draggables
    if (currentLevel <= 2 && currentPage === 2) {
      // exclude extra vowel from draggables and keep total draggablesCount
      draggableLetters = slotLetters.slice(0, 26); // exclude extra vowel (last letter)
      const includedSet = new Set(draggableLetters);
      const decoyCount = draggablesCount - draggableLetters.length;
      const decoyPool = allLetters.filter(l => !includedSet.has(l));
      const decoysToAdd = shuffle(decoyPool).slice(0, decoyCount);
      draggableLetters = shuffle([...draggableLetters, ...decoysToAdd]);
    } else {
      const includedSet = new Set(slotLetters);
      const decoyCount = draggablesCount - slotLetters.length;
      const decoyPool = allLetters.filter(l => !includedSet.has(l));
      const decoysToAdd = shuffle(decoyPool).slice(0, decoyCount);
      draggableLetters = shuffle([...slotLetters, ...decoysToAdd]);
    }

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       "Match Signs and Pictures (Mixed)");

    const slotTypeMap = {};
    slotLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;
      let isSign = false;
      if (mode === "signToImage") {
        isSign = false;
        slot.style.backgroundImage = `url('assets/alphabet/clipart/${letter}.png')`;
      } else if (mode === "imageToSign") {
        isSign = true;
        slot.style.backgroundImage = `url('assets/alphabet/signs/sign-${letter}.png')`;
      } else {
        isSign = Math.random() < 0.5;
        slot.style.backgroundImage = isSign
          ? `url('assets/alphabet/signs/sign-${letter}.png')`
          : `url('assets/alphabet/clipart/${letter}.png')`;
      }
      slotTypeMap[letter] = isSign;
      gameBoard.appendChild(slot);
    });

    draggableLetters.forEach((letter, i) => {
      const draggable = document.createElement("img");
      draggable.dataset.letter = letter;
      draggable.className = "draggable";
      draggable.draggable = true;
      draggable.addEventListener("dragstart", dragStart);
      draggable.addEventListener("touchstart", touchStart);

      if (dragType === "clipart") {
        draggable.src = `assets/alphabet/clipart/${letter}.png`;
      } else if (dragType === "sign") {
        draggable.src = `assets/alphabet/signs/sign-${letter}.png`;
      } else {
        const isSign = slotTypeMap[letter] || Math.random() < 0.5;
        draggable.src = isSign
          ? `assets/alphabet/signs/sign-${letter}.png`
          : `assets/alphabet/clipart/${letter}.png`;
      }

      const container = document.createElement("div");
      container.className = "drag-wrapper";
      container.appendChild(draggable);

      if (i < draggableLetters.length / 2) {
        leftSigns.appendChild(container);
      } else {
        rightSigns.appendChild(container);
      }
    });

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", dragOver);
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
      if (el && el.classList.contains("slot")) handleDrop(el, letter, src);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  loadPage();
});
