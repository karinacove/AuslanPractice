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
    gameEnded = false;
    endGame();
  });

  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    startGame();
  });

  againBtn.addEventListener("click", () => {
    location.reload();
  });

  menuBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  finishBtn.addEventListener("click", () => {
    endGame();
  });

  // Levels structure: same as alphabet but adapted for numbers
  // levelPagesCount for each level (some have 2 pages, some 3, some 1)
  const levelPagesCount = [
    2, 2, 2,    // Levels 1-3 (numbers 0-12, 2 pages each)
    1, 1, 1,    // Levels 4-6 (12-20, 1 page each)
    3, 3, 3,    // Levels 7-9 (21-48, 3 pages)
    3, 3, 3,    // Levels 10-12 (49-76, 3 pages)
    3, 3, 3, 3, // Levels 13-16 (77-100, 3 pages)
    3, 3, 3,    // Levels 17-19 (random 0-100, 3 pages)
    1           // Level 20 (incorrect matches from previous)
  ];

  // Define the ranges for levels:
  const levelNumberRanges = [
    [0, 12],   // Levels 1-3
    [12, 20],  // Levels 4-6
    [21, 48],  // Levels 7-9
    [49, 76],  // Levels 10-12
    [77, 100], // Levels 13-16
    [0, 100],  // Levels 17-19 (random)
    []         // Level 20 (special: incorrect numbers)
  ];

  // Google Forms entry IDs (adjust if you have number-specific form IDs)
  const formEntryIDs = {
    correct: [
      "entry.1249394203", "entry.1551220511", "entry.903633326",
      "entry.497882042", "entry.1591755601", "entry.1996137354",
      "entry.1897227570", "entry.1116300030", "entry.187975538",
      "entry.1880514176", "entry.552536101", "entry.922308538",
      "entry.7777777777", "entry.8888888888", "entry.9999999999", "entry.0000000000",
      "entry.1234567890", "entry.0987654321", "entry.1122334455",
      "entry.2233445566"
    ],
    incorrect: [
      "entry.1897227570", "entry.1116300030", "entry.187975538",
      "entry.1880514176", "entry.552536101", "entry.922308538",
      "entry.7777777778", "entry.8888888889", "entry.9999999990",
      "entry.0000000001", "entry.1234567891", "entry.0987654322",
      "entry.1122334456", "entry.2233445567", "entry.3344556677", "entry.4455667788",
      "entry.5566778899", "entry.6677889900", "entry.7788990011",
      "entry.8899001122"
    ]
  };

  let currentLevel = 0;
  let currentPage = 0;
  let pagesPerLevel = levelPagesCount[currentLevel];
  const levelAttempts = Array(levelPagesCount.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  let currentNumbers = []; // array of arrays: numbers for each page
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
    setTimeout(() => (feedbackImage.style.display = "none"), 1000);
  }

  // Utility to get array of numbers in range inclusive
  function range(start, end) {
    let arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  // For levels 13-16 (numbers 77-100), we must allow 4 repeats per level but not on the same page
  function getNumbersForLevel(level) {
    // Levels 1-3: 0-12, 2 pages each, 13 numbers total, 5 repeats across pages
    if (level >= 0 && level <= 2) {
      // 13 numbers: 0-12
      // We have 2 pages per level, each page has 9 numbers, so total 18 slots.
      // 13 unique numbers must appear at least once,
      // so 5 numbers will be repeated across pages.

      const numbersSet = range(0, 12);
      // Strategy: split 13 numbers into 2 pages with 9 numbers each, so total 18 spots.
      // First page: pick 9 numbers
      // Second page: remaining 4 + 5 repeated from first page.

      // For page 0, compute both pages and store in currentNumbers.
      // We'll do this in loadPage() to store currentNumbers as array of arrays

      return numbersSet; // full 0-12 numbers, but pages decided later

    } else if (level >= 3 && level <= 5) {
      // Levels 4-6: 12-20, 1 page each, 9 numbers no repeats
      return range(12, 20);

    } else if (level >= 6 && level <= 8) {
      // Levels 7-9: 21-48, 3 pages, 27 numbers no repeats
      return range(21, 48);

    } else if (level >= 9 && level <= 11) {
      // Levels 10-12: 49-76, 3 pages, 27 numbers no repeats
      return range(49, 76);

    } else if (level >= 12 && level <= 15) {
      // Levels 13-16: 77-100, 3 pages, 23 numbers, 4 repeats per level, no repeats on same page
      return range(77, 100);

    } else if (level >= 16 && level <= 18) {
      // Levels 17-19: 3 pages, 27 random numbers from 0-100 no repeats
      return range(0, 100);

    } else if (level === 19) {
      // Level 20: special, numbers matched incorrectly previously (handled separately)
      return [];
    } else {
      return [];
    }
  }

  // Build pages for levels 1-19 according to your specs
  function buildPagesForLevel(level) {
    let pagesCount = levelPagesCount[level];
    let numsInRange = getNumbersForLevel(level);

    // Special handling per level:

    if (level >= 0 && level <= 2) {
      // Levels 1-3 (0-12), 2 pages, 13 numbers total, 5 repeated
      // Build 2 pages with 9 numbers each:
      // page 0: 9 unique numbers
      // page 1: 4 remaining + 5 repeated from page 0

      // Shuffle full numbers 0-12
      let shuffled = shuffle([...numsInRange]);

      // Split 9 for first page
      let page0 = shuffled.slice(0, 9);

      // Remaining 4 numbers
      let remaining4 = shuffled.slice(9, 13);

      // For repeated 5 numbers, pick randomly from page0
      let repeats = shuffle(page0).slice(0, 5);

      let page1 = [...remaining4, ...repeats];

      // Shuffle page1 so repeats not obvious
      page1 = shuffle(page1);

      return [page0, page1];

    } else if (level >= 3 && level <= 5) {
      // Levels 4-6: 12-20, 1 page, 9 numbers no repeats
      // Just pick 9 numbers from range (12-20) for that level

      // For level n in 3-5, pick slice of numbers:
      // 12-20 range = 9 numbers total, perfect for one page

      // Just shuffle and return one page
      return [shuffle(numsInRange)];

    } else if (level >= 6 && level <= 8) {
      // Levels 7-9: 21-48, 3 pages, 27 numbers no repeats
      // Split 21-48 into 3 pages of 9 numbers each

      let shuffled = shuffle([...numsInRange]);
      return [
        shuffled.slice(0, 9),
        shuffled.slice(9, 18),
        shuffled.slice(18, 27)
      ];

    } else if (level >= 9 && level <= 11) {
      // Levels 10-12: 49-76, 3 pages, 27 numbers no repeats
      let shuffled = shuffle([...numsInRange]);
      return [
        shuffled.slice(0, 9),
        shuffled.slice(9, 18),
        shuffled.slice(18, 27)
      ];

    } else if (level >= 12 && level <= 15) {
      // Levels 13-16: 77-100, 3 pages, 23 numbers total,
      // 4 repeats per level but no repeats on same page

      let allNums = [...numsInRange];
      let shuffled = shuffle(allNums);

      // We want 3 pages, total 23 numbers + 4 repeats = 27 slots (3 * 9)

      // First pick 23 unique numbers to spread across pages
      let unique23 = shuffled.slice(0, 23);

      // Pick 4 numbers for repeats, none should be on same page twice
      let repeat4 = shuffled.slice(23, 27);

      // Distribute 23 unique numbers into 3 pages:
      // page0: 9 numbers
      // page1: 9 numbers
      // page2: 5 unique + 4 repeats to fill 9 slots

      // For pages 0 and 1: pick first 18 unique numbers (9 each)
      let page0 = unique23.slice(0, 9);
      let page1 = unique23.slice(9, 18);

      // page2: last 5 unique + 4 repeats
      let page2 = [...unique23.slice(18, 23), ...repeat4];

      // Shuffle page2 to distribute repeats randomly
      page2 = shuffle(page2);

      return [page0, page1, page2];

    } else if (level >= 16 && level <= 18) {
      // Levels 17-19: 3 pages, 27 random numbers 0-100 no repeats

      let allNums = [...numsInRange];
      let shuffled = shuffle(allNums);

      return [
        shuffled.slice(0, 9),
        shuffled.slice(9, 18),
        shuffled.slice(18, 27)
      ];

    } else if (level === 19) {
      // Level 20: one page with numbers matched incorrectly before, highest errors prioritized
      // We'll handle this separately in loadPage()
      return [[]]; // placeholder, empty for now
    }

    return [];
  }

  // To store numbers matched incorrectly with counts for Level 20
  let incorrectNumbersCount = {};

  function loadPage() {
    pagesPerLevel = levelPagesCount[currentLevel];

    // If Level 20, build page from incorrectNumbersCount
    if (currentLevel === 19) {
      // Extract numbers sorted by error count desc
      const sortedIncorrect = Object.entries(incorrectNumbersCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => Number(entry[0]));

      // Use top 9 for the one page (or all if less)
      currentNumbers = [sortedIncorrect.slice(0, 9)];

      if (currentNumbers[0].length === 0) {
        // If no incorrect numbers, fallback to random 9 numbers 0-12
        currentNumbers = [shuffle(range(0, 12)).slice(0, 9)];
      }
    } else {
      if (currentPage === 0 || !currentNumbers.length) {
        currentNumbers = buildPagesForLevel(currentLevel);
      }
    }

    let pageNumbers = currentNumbers[currentPage];

    // Clear board containers
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Update level title
    levelTitle.innerText = `Level ${currentLevel + 1}: Match the Number`;

    // Create slots for each number
    pageNumbers.forEach((num) => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.number = num;

      // For simplicity, slots show number images or text
      // Assume assets/numbers/num.png exists
      slot.style.backgroundImage = `url('assets/numbers/${num}.png')`;
      gameBoard.appendChild(slot);
    });

    // Prepare draggables (correct numbers + decoys)
    // Decoys: numbers not on page
    let allNumbersPossible = [];
    if (currentLevel === 19) {
      allNumbersPossible = range(0, 12);
    } else if (currentLevel >= 0 && currentLevel <= 18) {
      allNumbersPossible = getNumbersForLevel(currentLevel);
    }
    const decoysPool = allNumbersPossible.filter(n => !pageNumbers.includes(n));
    const decoysCount = 3; // same decoys as original

    const decoys = shuffle(decoysPool).slice(0, decoysCount);

    // Draggables = correct numbers + decoys, shuffled
    const draggableNumbers = shuffle([...pageNumbers, ...decoys]);

    // Clear containers
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Create draggable images
    draggableNumbers.forEach((num, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.number = num;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", num);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      // Use number images for draggable
      img.src = `assets/numbers/${num}.png`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      if (i < draggableNumbers.length / 2) {
        leftSigns.appendChild(wrap);
      } else {
        rightSigns.appendChild(wrap);
      }
    });

    correctMatches = 0;

    // Add drop listeners to slots
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
  }

  function drop(e) {
    e.preventDefault();
    const draggedNumber = Number(e.dataTransfer.getData("text/plain"));
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetNumber = Number(target.dataset.number);

    if (draggedNumber === targetNumber) {
      // Correct match
      if (!levelAttempts[currentLevel].correct.has(draggedNumber)) {
        levelAttempts[currentLevel].correct.add(draggedNumber);
      }

      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);

      document.querySelectorAll(`img.draggable[data-number='${draggedNumber}']`).forEach(el => el.remove());
      correctMatches++;

      showFeedback(true);

      // If Level 20, also update incorrectNumbersCount to reduce counts?
      // We'll not decrement here to keep original priority.

      if (correctMatches >= currentNumbers[currentPage].length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < pagesPerLevel) {
          setTimeout(loadPage, 800);
        } else {
          currentLevel++;
          if (currentLevel >= levelPagesCount.length) {
            setTimeout(endGame, 800);
          } else {
            currentPage = 0;
            pagesPerLevel = levelPagesCount[currentLevel];
            setTimeout(loadPage, 800);
          }
        }
      }
    } else {
      // Incorrect match
      levelAttempts[currentLevel].incorrect.push(draggedNumber);
      showFeedback(false);

      // Record incorrect count for Level 20 use
      if (!incorrectNumbersCount[draggedNumber]) {
        incorrectNumbersCount[draggedNumber] = 1;
      } else {
        incorrectNumbersCount[draggedNumber]++;
      }

      const wrong = document.querySelector(`img.draggable[data-number='${draggedNumber}']`);
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
      "entry.477642881": "Numbers",
      "entry.1374858042": formattedTime
    };

    for (let i = 0; i < levelPagesCount.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct);
      correctArr.sort((a,b) => a-b);
      const incorrectArr = [...levelAttempts[i].incorrect];
      incorrectArr.sort((a,b) => a-b);

      entries[formEntryIDs.correct[i]] = correctArr.join(",");
      entries[formEntryIDs.incorrect[i]] = incorrectArr.join(",");
    }

    // Calculate final percentage
    let totalCorrect = 0;
    let totalAttempts = 0;
    for (let i = 0; i < levelPagesCount.length; i++) {
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

  // Start the game:
  loadPage();

  // Optional startGame stub if you want a start button flow
  function startGame() {
    currentLevel = 0;
    currentPage = 0;
    correctMatches = 0;
    gameEnded = false;
    startTime = Date.now();
    loadPage();
  }

  // Touch drag support
  function touchStart(e) {
    e.preventDefault();
    const target = e.target;
    const num = target.dataset.number;
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
        preventDefault: () => { },
        dataTransfer: {
          getData: (k) => k === "text/plain" ? num : src
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
});
