// Numbers Matching Game JavaScript

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

  // Define levels with ranges, pages, and repeat flag
  const levelNumberMap = [
    { range: [0, 12], pages: 2, repeat: true },       // Levels 1-3
    { range: [13, 20], pages: 1, repeat: false },     // Levels 4-6
    { range: [21, 48], pages: 3, repeat: false },     // Levels 7-9
    { range: [49, 76], pages: 3, repeat: false },     // Levels 10-12
    { range: [77, 100], pages: 3, repeat: true },     // Levels 13-16
    { range: [0, 100], pages: 3, repeat: false },     // Levels 17-19
    { review: true, pages: 1 }                         // Level 20 (review incorrect)
  ];

  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // Feedback image setup
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

  // Shuffle helper
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  // Show correct or wrong feedback
  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  // Drop handler for drag and drop
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
          if (currentLevel >= levelNumberMap.length) {
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

  // Google Form submission and end game modal
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
      "entry.477642881": "Numbers",
      "entry.1374858042": formattedTime
    };

    for (let i = 0; i < formEntryIDs.correct.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct);
      const incorrectArr = [...levelAttempts[i].incorrect];
      entries[formEntryIDs.correct[i]] = correctArr.join(",");
      entries[formEntryIDs.incorrect[i]] = incorrectArr.join(",");
    }

    let totalCorrect = 0;
    let totalAttempts = 0;
    for (let i = 0; i < formEntryIDs.correct.length; i++) {
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
    iframe.onload = () => console.log("Google Form submitted successfully");
    form.submit();

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
    modal.style.display = "flex";
  }

  // Load current page for current level
  function loadPage() {
    // Use wide mode for levels 4-6 (indices 1-2)
    const wideMode = currentLevel >= 1 && currentLevel <= 2;
    if (wideMode) {
      document.body.classList.add("wide-mode");
    } else {
      document.body.classList.remove("wide-mode");
    }

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}`;

    if (currentPage === 0) {
      const info = levelNumberMap[currentLevel];
      currentLetters = [];

      if (info.review) {
        // Review mode: gather highest incorrect frequencies
        const freq = {};
        for (let i = 0; i < levelAttempts.length - 1; i++) {
          for (let val of levelAttempts[i].incorrect) {
            freq[val] = (freq[val] || 0) + 1;
          }
        }
        const sorted = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .map(([n]) => parseInt(n))
          .slice(0, 9);
        currentLetters.push(sorted);
      } else {
        const [start, end] = info.range;
        let pool = Array.from({ length: end - start + 1 }, (_, i) => i + start);
        shuffle(pool);
        let total = info.pages * 9;
        let result = [];
        if (info.repeat) {
          while (result.length < total) {
            result.push(...shuffle(pool).slice(0, Math.min(9, total - result.length)));
          }
        } else {
          result = pool.slice(0, total);
        }
        for (let i = 0; i < info.pages; i++) {
          currentLetters.push(result.slice(i * 9, (i + 1) * 9));
        }
      }
    }

    const pageLetters = currentLetters[currentPage];
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
    const decoys = 3;
    const decoyLetters = shuffle(allNumbers.filter(l => !pageLetters.includes(l))).slice(0, decoys);
    const draggableLetters = shuffle([...pageLetters, ...decoyLetters]);

    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

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

      if (i < draggableLetters.length / 2) {
        leftSigns.appendChild(wrap);
      } else {
        rightSigns.appendChild(wrap);
      }
    });

    correctMatches = 0;

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
  }

  // Touch drag support
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

  // Initialize level attempts tracking
  const levelAttempts = Array(levelNumberMap.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // Start the game
  loadPage();
});
