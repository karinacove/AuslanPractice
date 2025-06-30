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
    { start: 77, end: 100, pages: 3, type: "mixed" },
    { random: true, pages: 3, type: "mixed" },
    { random: true, pages: 3, type: "mixed" },
    { random: true, pages: 3, type: "mixed" },
    { review: true, pages: 1, type: "mixed" }
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

      // Remove the draggable image
      const draggedImgs = document.querySelectorAll(`img.draggable[data-letter='${letter}']`);
      draggedImgs.forEach(img => img.remove());

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
          if (currentLevel >= levelDefinitions.length) {
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

  function loadPage() {
    const info = levelDefinitions[currentLevel] || {};
    const pageCount = info.pages || 1;
    const type = info.type || "mixed";

    currentLetters = [];
    let pool = [];
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
      if (info.random) {
        pool = Array.from({ length: 101 }, (_, i) => i);
      } else {
        pool = Array.from({ length: info.end - info.start + 1 }, (_, i) => i + info.start);
      }

      const chosen = shuffle(pool).slice(0, pageCount * 9);
      for (let i = 0; i < pageCount; i++) {
        currentLetters.push(chosen.slice(i * 9, (i + 1) * 9));
      }
    }

    const pageLetters = currentLetters[currentPage];
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    levelTitle.innerText = `Level ${currentLevel + 1}`;

    // Determine grid item and draggable types based on level type
    let gridIsSign = false;
    let draggableIsSign = false;

    if (type === "clipart-grid") {
      gridIsSign = false;
      draggableIsSign = true;
    } else if (type === "sign-grid") {
      gridIsSign = true;
      draggableIsSign = false;
    } else if (type === "mixed") {
      // Mix grid and draggable items randomly but matching
      gridIsSign = null; // means mix per item
      draggableIsSign = null;
    }

    const slotTypes = {}; // Map letter -> boolean if slot shows sign (true) or clipart (false)

    // Create grid slots
    pageLetters.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = `${letter}`;

      // Decide image for grid slot
      let imgType;
      if (gridIsSign === null) {
        // Mixed: randomly decide per item
        const showSign = Math.random() < 0.5;
        imgType = showSign ? "signs/sign-" : "clipart/";
        slotTypes[letter] = showSign;
      } else {
        imgType = gridIsSign ? "signs/sign-" : "clipart/";
        slotTypes[letter] = gridIsSign;
      }

      slot.style.backgroundImage = `url('assets/numbers/${imgType}${letter}.png')`;
      gameBoard.appendChild(slot);
    });

    // Prepare draggable letters array with decoys
    const allNumbers = Array.from({ length: 101 }, (_, i) => i);
    const decoys = shuffle(allNumbers.filter(n => !pageLetters.includes(n))).slice(0, 3);

    // Determine draggable image type per letter
    // For clipart-grid and sign-grid: draggable is opposite type of grid
    // For mixed: ensure draggable is opposite of grid image for that letter
    const draggableLetters = [...pageLetters, ...decoys];
    const draggableImages = [];

    draggableLetters.forEach(letter => {
      const isInGrid = pageLetters.includes(letter);
      let isSign;

      if (type === "clipart-grid") {
        // grid = clipart, draggable = sign
        isSign = true;
      } else if (type === "sign-grid") {
        // grid = sign, draggable = clipart
        isSign = false;
      } else if (type === "mixed") {
        // opposite of slotTypes for known letters, random for decoys
        if (isInGrid) {
          isSign = !slotTypes[letter];
        } else {
          isSign = Math.random() < 0.5;
        }
      }

      draggableImages.push({ letter, isSign });
    });

    // Shuffle draggableImages
    shuffle(draggableImages);

    // Clear draggable containers
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Create draggable image elements
    draggableImages.forEach(({ letter, isSign }, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = `${letter}`;
      img.src = `assets/numbers/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", `${letter}`);
        e.dataTransfer.setData("src", img.src);
      });

      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      // Split draggable images evenly between left and right columns
      if (i < draggableImages.length / 2) leftSigns.appendChild(wrap);
      else rightSigns.appendChild(wrap);
    });

    correctMatches = 0;

    // Add dragover and drop listeners to grid slots
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
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
      "entry.477642881": `Numbers Level ${currentLevel + 1}`,
      "entry.1759570036": formattedTime,
      // Add correct and incorrect attempts here as needed
    };

    Object.entries(entries).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    modal.style.display = "flex";
  }

  loadPage();
});
