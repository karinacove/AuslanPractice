// ✅ Matching Alphabet Game - Complete Logic with Resume, Finish Handling, and No-Zero Submission

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
  const endModal = document.getElementById("end-modal");

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 9, wideMode: true },
    { type: "imageToSign", decoys: 9, wideMode: true },
    { type: "mixed", decoys: 9, wideMode: true }
  ];

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

  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 3;
  const levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  let currentLetters = [];
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

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      if (!gameEnded) {
        endGame();
      }
    });
  }

  continueBtn.addEventListener("click", () => {
    endModal.style.display = "none";
    gameEnded = false;
    loadPage();
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

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
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
        saveProgress();
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
      if (el && el.classList.contains("slot")) drop({
        preventDefault: () => {},
        dataTransfer: {
          getData: (k) => k === "text/plain" ? letter : src
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

  function saveProgress() {
    const data = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      levelAttempts: levelAttempts.map(l => ({ correct: [...l.correct], incorrect: [...l.incorrect] })),
      startTime,
      timestamp: Date.now()
    };
    localStorage.setItem("alphabetGameSave", JSON.stringify(data));
  }

  function restoreProgress(data) {
    studentName = data.studentName;
    studentClass = data.studentClass;
    currentLevel = data.currentLevel;
    currentPage = data.currentPage;
    startTime = data.startTime;
    data.levelAttempts.forEach((l, i) => {
      levelAttempts[i].correct = new Set(l.correct);
      levelAttempts[i].incorrect = [...l.incorrect];
    });
    loadPage();
  }

  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;

    let totalCorrect = 0;
    let totalAttempts = 0;
    for (let i = 0; i < levels.length; i++) {
      totalCorrect += levelAttempts[i].correct.size;
      totalAttempts += levelAttempts[i].correct.size + levelAttempts[i].incorrect.length;
    }
    const percent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    if (percent === 0) {
      document.getElementById("score-display").innerText = `Score: 0% (Not submitted)`;
      modal.style.display = "flex";
      return;
    }

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
      "entry.477642881": "Alphabet",
      "entry.1374858042": formattedTime,
      "entry.1996137354": `${percent}%`
    };

    for (let i = 0; i < levels.length; i++) {
      entries[formEntryIDs.correct[i]] = [...levelAttempts[i].correct].sort().join("");
      entries[formEntryIDs.incorrect[i]] = [...levelAttempts[i].incorrect].sort().join("");
    }

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

  const saved = JSON.parse(localStorage.getItem("alphabetGameSave"));
  if (saved && saved.studentName === studentName && saved.studentClass === studentClass) {
    const resume = confirm("Resume your unfinished game?");
    if (resume) {
      restoreProgress(saved);
      return;
    } else {
      localStorage.removeItem("alphabetGameSave");
    }
  }

  loadPage();
});
