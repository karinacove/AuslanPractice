// [FULL JS with corrected vowel logic and draggable limit]
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
    { type: "imageToSign", decoys: 3, dragType: "clipart" },
    { type: "signToImage", decoys: 3, dragType: "sign" },
    { type: "mixed", decoys: 3, dragType: "mixed" },
    { type: "imageToSign", decoys: 9, dragType: "clipart" },
    { type: "signToImage", decoys: 9, dragType: "sign" },
    { type: "mixed", decoys: 9, dragType: "mixed", isReview: true }
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
      const neededMatches = currentPage === 2 && currentLetters.length === 10 ? 10 : 9;
      if (correctMatches >= neededMatches) {
        correctMatches = 0;
        saveCurrentPageAttempts();

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

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function loadPage() {
    if (currentLevel >= levels.length) return endGame();

    const container = document.getElementById("game-container") || document.body;
    container.classList.toggle("wide-mode", currentLevel >= 3);

    const { type: mode, decoys, dragType, isReview } = levels[currentLevel];
    currentLetters = [];
    allLetters.forEach(l => {
      letterStats[l].firstCorrectOnPage = false;
      letterStats[l].currentPageAttempt = "";
    });

    const incorrectSorted = allLetters
      .filter(l => letterStats[l].incorrectAttempts.length > 0)
      .sort((a, b) => letterStats[b].incorrectAttempts.length - letterStats[a].incorrectAttempts.length);

    if (isReview && incorrectSorted.length > 0) {
      currentLetters = incorrectSorted.slice(0, 9);
    } else {
      currentLetters = shuffle(allLetters).slice(0, 9);
    }

    if (currentPage === 2) {
      const includedLetters = new Set(currentLetters);
      const unusedVowels = vowels.filter(v => !includedLetters.has(v));
      let extra = null;
      if (unusedVowels.length > 0) {
        extra = unusedVowels[Math.floor(Math.random() * unusedVowels.length)];
      } else {
        const allowedVowels = vowels.filter(v => !currentLetters.includes(v));
        if (allowedVowels.length > 0) {
          extra = allowedVowels[Math.floor(Math.random() * allowedVowels.length)];
        }
      }
      if (extra) currentLetters.push(extra);
    }

    const includedLetters = new Set(currentLetters);
    const decoyLetters = shuffle(allLetters.filter(l => !includedLetters.has(l))).slice(0, decoys);

    const draggables = shuffle([...currentLetters, ...decoyLetters]);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       "Match Signs and Pictures (Mixed)");

    const slotTypeMap = {};
    currentLetters.forEach(letter => {
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

    draggables.forEach((letter, i) => {
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
        const isSign = slotTypeMap[letter] === false ? true : false;
        draggable.src = isSign
          ? `assets/alphabet/signs/sign-${letter}.png`
          : `assets/alphabet/clipart/${letter}.png`;
      }

      const container = document.createElement("div");
      container.className = "drag-wrapper";
      container.appendChild(draggable);
      (i < draggables.length / 2 ? leftSigns : rightSigns).appendChild(container);
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
