document.addEventListener("DOMContentLoaded", function () {
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

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

  const levels = [
    { type: "signToImage", decoys: 3, numbers: [...Array(13).keys()], pages: 2 },              // 0–12 (13 nums), reuse 5
    { type: "imageToSign", decoys: 3, numbers: [...Array(13).keys()], pages: 2 },
    { type: "mixed",       decoys: 3, numbers: [...Array(13).keys()], pages: 2 },
    { type: "signToImage", decoys: 3, numbers: [...Array(9).keys()].map(n => n + 12), pages: 1 }, // 12–20
    { type: "imageToSign", decoys: 3, numbers: [...Array(9).keys()].map(n => n + 12), pages: 1 },
    { type: "mixed",       decoys: 3, numbers: [...Array(9).keys()].map(n => n + 12), pages: 1 },
    { type: "signToImage", decoys: 3, numbers: [...Array(27).keys()].map(n => n + 21), pages: 3 }, // 21–48
    { type: "imageToSign", decoys: 3, numbers: [...Array(27).keys()].map(n => n + 21), pages: 3 },
    { type: "mixed",       decoys: 3, numbers: [...Array(27).keys()].map(n => n + 21), pages: 3 },
    { type: "signToImage", decoys: 3, numbers: [...Array(27).keys()].map(n => n + 49), pages: 3 }, // 49–76
    { type: "imageToSign", decoys: 3, numbers: [...Array(27).keys()].map(n => n + 49), pages: 3 },
    { type: "mixed",       decoys: 3, numbers: [...Array(27).keys()].map(n => n + 49), pages: 3 },
    { type: "signToImage", decoys: 3, numbers: [...Array(23).keys()].map(n => n + 77), pages: 3 }, // 77–99, reuse 4
    { type: "imageToSign", decoys: 3, numbers: [...Array(23).keys()].map(n => n + 77), pages: 3 },
    { type: "mixed",       decoys: 3, numbers: [...Array(23).keys()].map(n => n + 77), pages: 3 },
    { type: "signToImage", decoys: 3, numbers: [...Array(23).keys()].map(n => n + 77), pages: 3 },
    { type: "imageToSign", decoys: 3, numbers: shuffle([...Array(101).keys()]).slice(0, 27), pages: 3 },
    { type: "signToImage", decoys: 3, numbers: shuffle([...Array(101).keys()]).slice(0, 27), pages: 3 },
    { type: "mixed",       decoys: 3, numbers: shuffle([...Array(101).keys()]).slice(0, 27), pages: 3 },
    { type: "mixed",       decoys: 3, numbers: [], pages: 1, isErrorReview: true }
  ];

  const formEntryIDs = {
    correct: [...Array(6)].map((_, i) => `entry.correct.${i}`),
    incorrect: [...Array(6)].map((_, i) => `entry.incorrect.${i}`)
  };

  let currentLevel = 0;
  let currentPage = 0;
  let currentNumbers = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  const levelAttempts = levels.map(() => ({ correct: new Set(), incorrect: [] }));

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

  if (finishBtn) finishBtn.addEventListener("click", () => {
    endGame();
  });

  againBtn.addEventListener("click", () => location.reload());
  menuBtn.addEventListener("click", () => (window.location.href = "../index.html"));
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    startGame();
  });

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => (feedbackImage.style.display = "none"), 1000);
  }

  function drop(e) {
    e.preventDefault();
    const number = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetNumber = target.dataset.number;

    if (number === targetNumber) {
      if (!levelAttempts[currentLevel].correct.has(number)) {
        levelAttempts[currentLevel].correct.add(number);
      }
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-number='${number}']`).forEach(el => el.remove());
      correctMatches++;

      showFeedback(true);
      if (correctMatches >= currentNumbers[currentPage].length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage < levels[currentLevel].pages) {
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
      levelAttempts[currentLevel].incorrect.push(number);
      showFeedback(false);
    }
  }

  function endGame() {
    if (gameEnded) return;
    gameEnded = true;
    const endTime = Date.now();
    const seconds = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const timeTaken = `${minutes} mins ${seconds % 60} sec`;

    const totalCorrect = levelAttempts.reduce((sum, l) => sum + l.correct.size, 0);
    const totalAttempts = levelAttempts.reduce((sum, l) => sum + l.correct.size + l.incorrect.length, 0);
    const percent = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${timeTaken}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
    modal.style.display = "flex";
  }

  function loadPage() {
    const level = levels[currentLevel];
    const { type: mode, decoys, numbers, isErrorReview } = level;

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    document.body.classList.toggle("wide-mode", level.pages === 1);

    levelTitle.innerText = `Level ${currentLevel + 1}: ${
      mode === "signToImage" ? "Match the Sign to the Picture" :
      mode === "imageToSign" ? "Match the Picture to the Sign" :
      "Mixed Matching"
    }`;

    if (currentPage === 0) {
      currentNumbers = [];
      if (isErrorReview) {
        const errorMap = {};
        levelAttempts.forEach((l, i) => {
          l.incorrect.forEach(n => {
            errorMap[n] = (errorMap[n] || 0) + 1;
          });
        });
        const sorted = Object.entries(errorMap).sort((a, b) => b[1] - a[1]);
        const topNumbers = sorted.slice(0, 9).map(e => e[0]);
        currentNumbers.push(topNumbers);
      } else {
        const pages = level.pages;
        const pool = [...numbers];
        for (let p = 0; p < pages; p++) {
          const slice = shuffle(pool).slice(0, 9);
          currentNumbers.push(slice);
        }
      }
    }

    const pageNumbers = currentNumbers[currentPage];
    const slotTypes = {};

    pageNumbers.forEach(num => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.number = num;

      const isSign = mode === "imageToSign" || (mode === "mixed" && Math.random() < 0.5);
      const imgPath = `assets/numbers/signs/sign-${num}.png`;
      slot.style.backgroundImage = `url('${imgPath}')`;
      slotTypes[num] = isSign;

      gameBoard.appendChild(slot);
    });

    const decoyPool = [...Array(101).keys()].filter(n => !pageNumbers.includes(n));
    const decoyNumbers = shuffle(decoyPool).slice(0, decoys);
    const draggableNumbers = shuffle([...pageNumbers, ...decoyNumbers]);

    draggableNumbers.forEach((num, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.number = num;

      const isCorrect = pageNumbers.includes(num);
      let type;
      if (mode === "signToImage") type = true;
      else if (mode === "imageToSign") type = false;
      else type = isCorrect ? !slotTypes[num] : Math.random() < 0.5;

      const imgPath = `assets/numbers/signs/sign-${num}.png`;
      img.src = imgPath;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", num);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      (i < draggableNumbers.length / 2 ? leftSigns : rightSigns).appendChild(wrap);
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
    const number = target.dataset.number;
    const src = target.src;

    const clone = target.cloneNode(true);
    Object.assign(clone.style, {
      position: "absolute",
      pointerEvents: "none",
      opacity: "0.7",
      zIndex: "10000"
    });
    document.body.appendChild(clone);

    const moveClone = touch => {
      clone.style.left = `${touch.clientX - clone.width / 2}px`;
      clone.style.top = `${touch.clientY - clone.height / 2}px`;
    };

    moveClone(e.touches[0]);

    const handleMove = ev => moveClone(ev.touches[0]);
    const handleEnd = ev => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && el.classList.contains("slot")) {
        drop({
          preventDefault: () => {},
          dataTransfer: {
            getData: key => key === "text/plain" ? number : src
          },
          currentTarget: el
        });
      }
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd, { passive: false });
  }

  loadPage();
});
