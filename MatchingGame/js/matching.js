// matching.js
document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // Modal and buttons
  const modal = document.getElementById("end-modal");
  const scoreDisplay = document.getElementById("score-display");
  const continueBtn = document.getElementById("continue-btn");
  const againBtn = document.getElementById("again-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const finishBtn = document.getElementById("finish-btn");

  // Game elements
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // Feedback image
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "200px",
    display: "none",
    zIndex: "2000",
    pointerEvents: "none",
  });
  document.body.appendChild(feedbackImage);

  // Constants
  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  // Levels config: type and number of decoys
  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 9 },
    { type: "imageToSign", decoys: 9 },
    { type: "mixed", decoys: 9 },
  ];

  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 3;
  let currentLetters = [];
  let correctMatches = 0;
  let gameEnded = false;
  const startTime = Date.now();

  // Track answers for Google Forms submission
  const levelAttempts = levels.map(() => ({
    correct: new Set(),
    incorrect: [],
  }));

  // Utility: Shuffle array
  function shuffle(arr) {
    const array = arr.slice();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Show feedback (correct or wrong)
  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => {
      feedbackImage.style.display = "none";
    }, 1000);
  }

  // Handle drop on slot
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
      // Show overlay on target slot
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);

      // Remove draggable from left/right signs
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach((el) => el.remove());

      correctMatches++;
      showFeedback(true);

      if (correctMatches >= currentLetters.length) {
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

      // Shake the wrong draggable
      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
      if (wrong) {
        wrong.classList.add("shake");
        setTimeout(() => wrong.classList.remove("shake"), 500);
      }
    }
  }

  // End game and submit results to Google Forms
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const timeTakenSeconds = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTakenSeconds / 60);
    const seconds = timeTakenSeconds % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;

    // Prepare form for submission
    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    // Google Form field mapping
    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Alphabet",
      "entry.1374858042": formattedTime,
    };

    // For each level, add correct and incorrect (use correct IDs)
    // IDs for incorrect start at 1897227570, correct at 1249394203, increment by 2 per level
    let totalCorrect = 0;
    let totalAttempts = 0;

    for (let i = 0; i < levels.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct).sort();
      const incorrectArr = levelAttempts[i].incorrect.slice().sort();

      const correctStr = correctArr.join("");
      const incorrectStr = incorrectArr.join("");

      entries[`entry.1897227570`] = i === 0 ? incorrectStr : entries[`entry.1897227570`] + "," + incorrectStr;
      entries[`entry.1249394203`] = i === 0 ? correctStr : entries[`entry.1249394203`] + "," + correctStr;

      totalCorrect += correctArr.length;
      totalAttempts += correctArr.length + incorrectArr.length;
    }

    const percentScore = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    entries["entry.1996137354"] = `${percentScore}%`;

    // Append inputs to form
    for (const [key, value] of Object.entries(entries)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    // Show modal with score & time
    scoreDisplay.innerText = `Score: ${percentScore}%\nTime: ${formattedTime}`;
    modal.style.display = "flex";
  }

  // Load a page (grid + draggable signs/images) for the current level and page
  function loadPage() {
    const level = levels[currentLevel];
    const mode = level.type;
    const decoys = level.decoys;

    levelTitle.innerText = `Level ${currentLevel + 1}: ${
      mode === "signToImage"
        ? "Match the Sign to the Picture"
        : mode === "imageToSign"
        ? "Match the Picture to the Sign"
        : "Match Signs and Pictures (Mixed)"
    }`;

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Pick 9 random letters for this page
    let shuffledLetters = shuffle(allLetters);
    currentLetters = shuffledLetters.slice(0, 9);

    // On 3rd page (index 2), add a vowel not already included replacing a random letter
    if (currentPage === 2) {
      const used = new Set(currentLetters);
      const unusedVowels = vowels.filter((v) => !used.has(v));
      if (unusedVowels.length > 0) {
        const vowel = unusedVowels[Math.floor(Math.random() * unusedVowels.length)];
        const replaceIndex = Math.floor(Math.random() * currentLetters.length);
        currentLetters[replaceIndex] = vowel;
      }
    }

    // Assign slot types (true = sign, false = clipart) based on mode:
    // signToImage: slots show clipart (false)
    // imageToSign: slots show sign (true)
    // mixed: random for slots
    const slotTypes = {}; // letter -> isSign(boolean)
    currentLetters.forEach((letter) => {
      let isSign;
      if (mode === "signToImage") {
        isSign = false; // slots show clipart images
      } else if (mode === "imageToSign") {
        isSign = true; // slots show signs
      } else {
        isSign = Math.random() < 0.5;
      }
      slotTypes[letter] = isSign;
      // Create slot div
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;
      slot.style.backgroundImage = `url('assets/alphabet/${isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}')`;
      gameBoard.appendChild(slot);

      // Enable drop events
      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    // Select decoy letters not in currentLetters
    const decoyLetters = shuffle(allLetters.filter((l) => !currentLetters.includes(l))).slice(0, decoys);

    // Prepare draggables array: correct letters + decoys
    const draggablesLetters = shuffle([...currentLetters, ...decoyLetters]);

    // Clear draggable areas
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    draggablesLetters.forEach((letter, idx) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = letter;

      // Drag events for desktop
      img.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", letter);
        e.dataTransfer.setData("src", img.src);
      });

      // Touch events for mobile
      img.addEventListener("touchstart", touchStart, { passive: false });

      // For draggables, show opposite type to the slot type for that letter
      // signToImage mode: slots are clipart, draggables are signs
      // imageToSign mode: slots are signs, draggables are clipart
      // mixed mode: opposite of slotTypes[letter]
      const slotIsSign = slotTypes[letter];
      const draggableIsSign = mode === "mixed" ? !slotIsSign : mode === "signToImage" ? true : false;
      img.src = `assets/alphabet/${draggableIsSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      // Wrap draggable img for spacing
      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      // Split draggables evenly between left and right containers
      if (idx < draggablesLetters.length / 2) {
        leftSigns.appendChild(wrap);
      } else {
        rightSigns.appendChild(wrap);
      }
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

    function moveClone(touch) {
      clone.style.left = `${touch.clientX - clone.width / 2}px`;
      clone.style.top = `${touch.clientY - clone.height / 2}px`;
    }
    moveClone(e.touches[0]);

    function onTouchMove(ev) {
      moveClone(ev.touches[0]);
    }

    function onTouchEnd(ev) {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.classList.contains("slot")) {
        drop({
          preventDefault: () => {},
          dataTransfer: {
            getData: (type) => (type === "text/plain" ? letter : src),
          },
          currentTarget: el,
        });
      }
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      clone.remove();
    }

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: false });
  }

  // Modal button handlers
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
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

  // Initial load
  loadPage();
});
