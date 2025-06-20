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
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      endGame();
    });
  }

  if (againBtn) {
    againBtn.addEventListener("click", () => {
      location.reload();
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }

  const levels = [
    { type: "signToImage" },
    { type: "imageToSign" },
    { type: "mixed" },
  ];
  let currentLevel = 0;
  let currentPage = 0;
  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const letterStats = {};

  allLetters.forEach((letter) => {
    letterStats[letter] = { attempts: 0, correct: 0, firstCorrect: false };
  });

  let currentLetters = [];
  let correctMatches = 0;
  const pagesPerLevel = 3;
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
    zIndex: "1000",
  });
  document.body.appendChild(feedbackImage);

  function loadPage() {
    if (currentLevel >= levels.length) return endGame();
    const mode = levels[currentLevel].type;
    currentLetters = [];
    const usedThisPage = new Set();

    while (currentLetters.length < 9) {
      const candidates = allLetters.filter(l => !usedThisPage.has(l));
      const letter = candidates[Math.floor(Math.random() * candidates.length)];
      if (!letter) break;
      currentLetters.push(letter);
      usedThisPage.add(letter);
    }

    const remaining = allLetters.filter(l => !currentLetters.includes(l));
    const decoys = [];
    while (decoys.length < 3 && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      decoys.push(remaining.splice(idx, 1)[0]);
    }

    const draggables = [...currentLetters, ...decoys].sort(() => Math.random() - 0.5);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       "Match Signs and Pictures (Mixed)");

    const slotTypeMap = {};

    currentLetters.forEach((letter) => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;

      let isSign = false;
      if (mode === "signToImage") {
        slot.style.backgroundImage = `url('assets/alphabet/clipart/${letter}.png')`;
      } else if (mode === "imageToSign") {
        isSign = true;
        slot.style.backgroundImage = `url('assets/alphabet/signs/sign-${letter}.png')`;
      } else {
        const isSign = Math.random() < 0.5;
        slot.style.backgroundImage = isSign
          ? `url('assets/alphabet/signs/sign-${letter}.png')`
          : `url('assets/alphabet/clipart/${letter}.png')`;
        slot.dataset.isSign = isSign ? "true" : "false";
      }

      gameBoard.appendChild(slot);
    });

    draggables.forEach((letter, i) => {
      const draggable = document.createElement("img");
      draggable.dataset.letter = letter;
      draggable.className = "draggable";
      draggable.draggable = true;
      draggable.addEventListener("dragstart", dragStart);
      draggable.addEventListener("touchstart", touchStart);

      const isSignInSlot = slotTypeMap[letter] ?? (mode === "signToImage");
      draggable.src = isSignInSlot
        ? `assets/alphabet/clipart/${letter}.png`
        : `assets/alphabet/signs/sign-${letter}.png`;

      const container = document.createElement("div");
      container.className = "drag-wrapper";
      container.appendChild(draggable);

      if (i < 6) {
        leftSigns.appendChild(container);
      } else {
        rightSigns.appendChild(container);
      }
    });

    document.querySelectorAll(".slot").forEach((slot) => {
      slot.addEventListener("dragover", dragOver);
      slot.addEventListener("drop", drop);
    });
  }

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
    letterStats[letter].attempts++;

    if (slot.dataset.letter === letter) {
      correctMatches++;
      if (letterStats[letter].attempts === 1) {
        letterStats[letter].firstCorrect = true;
      }
      letterStats[letter].correct++;
      showFeedback(true);

      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      slot.appendChild(overlay);

      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el => el.remove());

      if (correctMatches >= 9) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < pagesPerLevel) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          setTimeout(loadPage, 800);
        }
      }
    } else {
      showFeedback(false);
      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 500);
      }
    }
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => {
      feedbackImage.style.display = "none";
    }, 1000);
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

    const handleTouchMove = (ev) => {
      moveClone(ev.touches[0]);
    };

    const handleTouchEnd = (ev) => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.classList.contains("slot")) {
        handleDrop(el, letter, src);
      }
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  function endGame() {
    const endTime = Date.now();
    const time = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const formatted = `${minutes} mins ${seconds} sec`;

    const correctLetters = [];
    const incorrectLetters = [];

    let totalAttempts = 0;
    let firstTryCorrect = 0;

    allLetters.forEach((letter) => {
      const stats = letterStats[letter];
      if (stats.attempts > 0) {
        totalAttempts += stats.attempts;
        if (stats.firstCorrect) firstTryCorrect++;

        let mark = "";
        if (stats.correct === 3) mark = letter + letter + letter;
        else if (stats.correct === 2) mark = "*" + letter + letter;
        else if (stats.correct === 1) mark = "**" + letter;
        if (mark) correctLetters.push(mark);

        if (stats.correct < stats.attempts) {
          incorrectLetters.push(letter.repeat(stats.attempts - stats.correct));
        }
      }
    });

    const scorePercent = totalAttempts > 0 ? Math.round((firstTryCorrect / totalAttempts) * 100) : 0;

    document.getElementById("score-display").innerText = `Score: ${scorePercent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formatted}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Alphabet",
      "entry.1897227570": incorrectLetters.sort().join(", "),
      "entry.1249394203": correctLetters.sort((a,b) => a.replace(/\*/g, "").localeCompare(b.replace(/\*/g, ""))).join(", "),
      "entry.1996137354": `${scorePercent}%`,
      "entry.1374858042": formatted,
    };

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

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

  loadPage(); 
});
