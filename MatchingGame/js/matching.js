document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const modal = document.getElementById("end-modal");
  const scoreDisplay = document.getElementById("score-display");
  const continueBtn = document.getElementById("continue-btn");
  const againBtn = document.getElementById("again-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const finishBtn = document.getElementById("finish-btn");

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const layoutDiv = document.querySelector(".layout");  // <--- Add this to toggle wide-mode here
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
    zIndex: "2000",
    pointerEvents: "none",
  });
  document.body.appendChild(feedbackImage);

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

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

  const levelAttempts = levels.map(() => ({
    correct: new Set(),
    incorrect: [],
  }));

  function shuffle(arr) {
    const array = arr.slice();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => {
      feedbackImage.style.display = "none";
    }, 1000);
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

      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
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
    const timeTakenSeconds = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTakenSeconds / 60);
    const seconds = timeTakenSeconds % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;

    const form = document.createElement("form");
    form.action =
      "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
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
      "entry.477642881": "Alphabet",
      "entry.1374858042": formattedTime,
    };

    // These are base entry numbers for form fields for each level
    const incorrectBase = 1897227570; // incorrect answers fields
    const correctBase = 1249394203; // correct answers fields

    let totalCorrect = 0;
    let totalAttempts = 0;

    for (let i = 0; i < levels.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct).sort();
      const incorrectArr = levelAttempts[i].incorrect.slice().sort();

      const correctStr = correctArr.join("");
      const incorrectStr = incorrectArr.join("");

      entries[`entry.${incorrectBase + i * 2}`] = incorrectStr;
      entries[`entry.${correctBase + i * 2}`] = correctStr;

      totalCorrect += correctArr.length;
      totalAttempts += correctArr.length + incorrectArr.length;
    }

    const percentScore = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    entries["entry.1996137354"] = `${percentScore}%`;

    for (const [key, value] of Object.entries(entries)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    scoreDisplay.innerText = `Score: ${percentScore}%\nTime: ${formattedTime}`;
    modal.style.display = "flex";
  }

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

    // Toggle wide-mode class on the layout container for levels 4-6 (index 3,4,5)
    if (currentLevel >= 3 && currentLevel <= 5) {
      layoutDiv.classList.add("wide-mode");
    } else {
      layoutDiv.classList.remove("wide-mode");
    }

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    let shuffledLetters = shuffle(allLetters);
    currentLetters = shuffledLetters.slice(0, 9);

    if (currentPage === 2) {
      const used = new Set(currentLetters);
      const unusedVowels = vowels.filter((v) => !used.has(v));
      if (unusedVowels.length > 0) {
        const vowel = unusedVowels[Math.floor(Math.random() * unusedVowels.length)];
        const replaceIndex = Math.floor(Math.random() * currentLetters.length);
        currentLetters[replaceIndex] = vowel;
      }
    }

    const slotTypes = {};
    currentLetters.forEach((letter) => {
      let isSign;
      if (mode === "signToImage") {
        isSign = false;
      } else if (mode === "imageToSign") {
        isSign = true;
      } else {
        isSign = Math.random() < 0.5;
      }
      slotTypes[letter] = isSign;

      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;
      slot.style.backgroundImage = `url('assets/alphabet/${
        isSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`
      }')`;
      gameBoard.appendChild(slot);

      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", drop);
    });

    const decoyLetters = shuffle(allLetters.filter((l) => !currentLetters.includes(l))).slice(0, decoys);
    const draggablesLetters = shuffle([...currentLetters, ...decoyLetters]);

    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    draggablesLetters.forEach((letter, idx) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = letter;

      img.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", letter);
        e.dataTransfer.setData("src", img.src);
      });

      img.addEventListener("touchstart", touchStart, { passive: false });

      const slotIsSign = slotTypes[letter];
      const draggableIsSign = mode === "mixed" ? !slotIsSign : mode === "signToImage" ? true : false;
      img.src = `assets/alphabet/${draggableIsSign ? `signs/sign-${letter}.png` : `clipart/${letter}.png`}`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      if (idx < draggablesLetters.length / 2) {
        leftSigns.appendChild(wrap);
      } else {
        rightSigns.appendChild(wrap);
      }
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

  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false; // Allow finish button to be clicked again
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

  loadPage();
});
