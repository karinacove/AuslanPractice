// ✅ Fully Corrected Numbers Matching Game JavaScript

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

  if (finishBtn) finishBtn.addEventListener("click", () => endGame());
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    loadPage();
  });
  againBtn.addEventListener("click", () => location.reload());
  menuBtn.addEventListener("click", () => window.location.href = "../index.html");
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

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

  const levelDefinitions = [
    { start: 0, end: 12, pages: 2, repeat: true },   // Levels 1–3
    { start: 13, end: 20, pages: 1 },                // Levels 4–6
    { start: 21, end: 48, pages: 3 },                // Levels 7–9
    { start: 49, end: 76, pages: 3 },                // Levels 10–12
    { start: 77, end: 100, pages: 3, repeat: true }, // Levels 13–16
    { random: true, pages: 3 },                      // Levels 17–19
    { review: true, pages: 1 }                       // Level 20
  ];

  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  const levelAttempts = Array(20).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    const feedbackImage = document.createElement("img");
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.position = "fixed";
    feedbackImage.style.top = "50%";
    feedbackImage.style.left = "50%";
    feedbackImage.style.transform = "translate(-50%, -50%)";
    feedbackImage.style.width = "200px";
    feedbackImage.style.zIndex = "1000";
    document.body.appendChild(feedbackImage);
    setTimeout(() => feedbackImage.remove(), 1000);
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
        if (currentPage < currentLetters.length) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          currentPage = 0;
          if (currentLevel >= 20) {
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

  function loadPage() {
    const info = levelDefinitions[Math.floor(currentLevel / 3)] || {};
    const pageCount = info.pages || 1;

    if (currentPage === 0) {
      currentLetters = [];
      if (info.review) {
        const incorrectCounts = {};
        for (let lvl of levelAttempts) {
          for (let val of lvl.incorrect) {
            incorrectCounts[val] = (incorrectCounts[val] || 0) + 1;
          }
        }
        const sorted = Object.entries(incorrectCounts).sort((a, b) => b[1] - a[1]).map(([k]) => parseInt(k));
        currentLetters.push(sorted.slice(0, 9));
      } else {
        const pool = info.random ? Array.from({ length: 101 }, (_, i) => i) : Array.from({ length: info.end - info.start + 1 }, (_, i) => i + info.start);
        const chosen = info.repeat ? (() => {
          let output = [];
          while (output.length < pageCount * 9) {
            output.push(...shuffle(pool).slice(0, Math.min(9, pageCount * 9 - output.length)));
          }
          return shuffle(output);
        })() : shuffle(pool).slice(0, pageCount * 9);

        for (let i = 0; i < pageCount; i++) {
          currentLetters.push(chosen.slice(i * 9, (i + 1) * 9));
        }
      }
    }

    const pageLetters = currentLetters[currentPage];
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    levelTitle.innerText = `Level ${currentLevel + 1}`;

    const slotTypes = {};
    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = `${letter}`;
      const isSign = Math.random() < 0.5;
      slot.style.backgroundImage = `url('assets/numbers/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}')`;
      slotTypes[letter] = isSign;
      gameBoard.appendChild(slot);
    });

    const allNumbers = Array.from({ length: 101 }, (_, i) => i);
    const decoys = shuffle(allNumbers.filter(n => !pageLetters.includes(n))).slice(0, 3);
    const draggableLetters = shuffle([...pageLetters, ...decoys]);

    draggableLetters.forEach((letter, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = `${letter}`;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", `${letter}`);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const isOpposite = pageLetters.includes(letter) ? !slotTypes[letter] : Math.random() < 0.5;
      img.src = `assets/numbers/${isOpposite ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      if (i < draggableLetters.length / 2) leftSigns.appendChild(wrap);
      else rightSigns.appendChild(wrap);
    });

    correctMatches = 0;
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
    if (gameEnded) return;
    gameEnded = true;

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

    for (let i = 0; i < formEntryIDs.correct.length; i++) {
      entries[formEntryIDs.correct[i]] = Array.from(levelAttempts[i].correct).join(",");
      entries[formEntryIDs.incorrect[i]] = levelAttempts[i].incorrect.join(",");
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
    modal.style.display = "flex";
  }

  loadPage();
});
