// ✅ Final Complete Numbers Matching Game Script

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

  if (finishBtn) finishBtn.addEventListener("click", () => {
    if (!gameEnded) {
      modal.style.display = "flex";
      endGame();
    }
  });


continueBtn.addEventListener("click", () => {
  const saved = JSON.parse(localStorage.getItem("numbersGameSave"));
  if (
    saved &&
    saved.studentName === studentName &&
    saved.studentClass === studentClass
  ) {
    currentLevel = saved.currentLevel;
    currentPage = saved.currentPage;
    saved.levelAttempts.forEach((lvl, i) => {
      levelAttempts[i].correct = new Set(lvl.correct);
      levelAttempts[i].incorrect = lvl.incorrect;
    });
  }

  modal.style.display = "none";
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

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const saved = JSON.parse(localStorage.getItem("numbersGameSave"));
      if (saved && saved.studentName === studentName && saved.studentClass === studentClass) {
        gameEnded = true;
        endGame();
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "../index.html";
        }, 1000);
      } else {
        localStorage.clear();
        window.location.href = "../index.html";
      }
    });
  }
  
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  const levelAttempts = Array(20).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

const formEntryIDs = {
  correct: [
    "entry.1249394203", // Level 1
    "entry.1551220511", // Level 2
    "entry.903633326",  // Level 3
    "entry.497882042",  // Level 4
    "entry.1591755601", // Level 5
    "entry.1996137354", // Level 6
    "entry.856597282",  // Level 7
    "entry.552536101",  // Level 8
    "entry.922308538",  // Level 9
    "entry.1374012635", // Level 10
    "entry.969924717",  // Level 11
    "entry.1932466289", // Level 12
    "entry.1575128943", // Level 13
    "entry.554179696",  // Level 14
    "entry.2030465979", // Level 15
    "entry.738514372",  // Level 16
    "entry.1357122496", // Level 17
    "entry.1591067770", // Level 18
    "entry.1355599626", // Level 19
    "entry.798325880"   // Level 20
  ],
  incorrect: [
    "entry.1897227570", // Level 1
    "entry.1116300030", // Level 2
    "entry.187975538",  // Level 3
    "entry.1880514176", // Level 4
    "entry.1184246193", // Level 5
    "entry.985210217",  // Level 6
    "entry.1120330311", // Level 7
    "entry.173771989",  // Level 8
    "entry.1445957806", // Level 9
    "entry.518336131",  // Level 10
    "entry.817472684",  // Level 11
    "entry.1826031881", // Level 12
    "entry.975184703",  // Level 13
    "entry.1363193324", // Level 14
    "entry.1628651239", // Level 15
    "entry.1713469842", // Level 16
    "entry.1505983868", // Level 17
    "entry.2122202486", // Level 18
    "entry.1744154495", // Level 19
    "entry.1745996786"  // Level 20
  ]
};

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

  function updateScore() {
    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;
    document.getElementById("score-display").innerText = `Score: ${percent}%`;
  }

function saveProgress() {
  const saveData = {
    studentName,
    studentClass,
    currentLevel,
    currentPage,
    levelAttempts: levelAttempts.map(lvl => ({
      correct: Array.from(lvl.correct),
      incorrect: lvl.incorrect
    })),
    timestamp: Date.now()
  };
  localStorage.setItem("numbersGameSave", JSON.stringify(saveData));
}


  function restoreProgress() {
    const saveData = JSON.parse(localStorage.getItem("numbersGameSave"));
    if (!saveData || saveData.studentName !== studentName || saveData.studentClass !== studentClass) return false;

    currentLevel = saveData.currentLevel;
    currentPage = saveData.currentPage;
    saveData.levelAttempts.forEach((lvl, i) => {
      levelAttempts[i].correct = new Set(lvl.correct);
      levelAttempts[i].incorrect = lvl.incorrect;
    });
    return true;
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
      updateScore();

      if (correctMatches >= currentLetters[currentPage].length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < currentLetters.length) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= 20) {
            modal.style.display = "flex";
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
        preventDefault: () => {},
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

  function endGame() {
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const formattedTime = `${Math.floor(timeTaken / 60)} mins ${timeTaken % 60} sec`;

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
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Numbers",
      "entry.1374858042": formattedTime
    };

    for (let i = 0; i < 20; i++) {
      const correct = Array.from(levelAttempts[i].correct).sort((a, b) => a - b);
      const incorrect = levelAttempts[i].incorrect.sort((a, b) => a - b);
      entries[formEntryIDs.correct[i]] = correct.join(",");
      entries[formEntryIDs.incorrect[i]] = incorrect.join(",");
    }

    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
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

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
  }

  function loadPage() {
    const info = levelDefinitions[currentLevel];
    const pool = info.random ? Array.from({ length: 101 }, (_, i) => i) : Array.from({ length: info.end - info.start + 1 }, (_, i) => i + info.start);
    const chosen = shuffle(pool).slice(0, info.pages * 9);
    const pageItems = [];
    for (let i = 0; i < info.pages; i++) {
      pageItems.push(chosen.slice(i * 9, (i + 1) * 9));
    }
    currentLetters = pageItems;

    const pageLetters = currentLetters[currentPage];
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    levelTitle.innerText = `Level ${currentLevel + 1}`;

    const slotType = info.type;
    const slotMode = slotType.includes("clipart") ? "clipart" : slotType.includes("sign") ? "sign" : null;
    const getOppositeMode = m => m === "clipart" ? "sign" : "clipart";

    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = `${letter}`;
      const imageMode = slotType === "mixed" ? (Math.random() < 0.5 ? "clipart" : "sign") : slotMode;
      slot.dataset.imageMode = imageMode;
      slot.style.backgroundImage = `url('assets/numbers/${imageMode === "clipart" ? `clipart/${letter}.png` : `signs/sign-${letter}.png`}')`;
      gameBoard.appendChild(slot);
    });

    let decoyPool = pool.filter(n => !pageLetters.includes(n));
    let decoys = decoyPool.length >= 3 ? shuffle(decoyPool).slice(0, 3) : decoyPool;
    const draggableLetters = shuffle([...pageLetters, ...decoys]);

    draggableLetters.forEach((letter, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = `${letter}`;

      let sourceMode;
      if (slotType === "mixed") {
        const matchSlot = document.querySelector(`.slot[data-letter='${letter}']`);
        sourceMode = matchSlot ? getOppositeMode(matchSlot.dataset.imageMode) : (Math.random() < 0.5 ? "clipart" : "sign");
      } else {
        sourceMode = getOppositeMode(slotMode);
      }

      img.src = `assets/numbers/${sourceMode === "clipart" ? `clipart/${letter}.png` : `signs/sign-${letter}.png`}`;
      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", `${letter}`);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      (i < draggableLetters.length / 2 ? leftSigns : rightSigns).appendChild(wrap);
    });

    correctMatches = 0;
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    updateScore();
    saveProgress();
  }

  const resumed = restoreProgress();
  if (resumed) {
    loadPage();
  } else {
    loadPage();
  }
});
