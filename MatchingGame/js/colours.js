// COLOURS VERSION

// --- DOMContentLoaded Event ---
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
    // Do NOT reset currentLevel or currentPage; just resume from where left off
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

  const allColours = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white"];

  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 5 },
    { type: "imageToSign", decoys: 5 },
    { type: "mixed", decoys: 5 }
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
  const pagesPerLevel = 2;
  const levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  let currentColours = [];
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
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)", width: "200px",
    display: "none", zIndex: "1000"
  });
  document.body.appendChild(feedbackImage);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => { feedbackImage.style.display = "none"; }, 1000);
  }

  function drop(e) {
    e.preventDefault();
    const colour = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const target = e.currentTarget;
    const targetColour = target.dataset.letter;

    if (colour === targetColour) {
      if (!levelAttempts[currentLevel].correct.has(colour)) {
        levelAttempts[currentLevel].correct.add(colour);
      }
      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src;
      overlay.className = "overlay";
      target.appendChild(overlay);

      document.querySelectorAll(`img.draggable[data-letter='${colour}']`).forEach(el => el.remove());

      correctMatches++;
      showFeedback(true);

      if (correctMatches >= currentColours[currentPage].length) {
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
      levelAttempts[currentLevel].incorrect.push(colour);
      showFeedback(false);
      const wrong = document.querySelector(`img.draggable[data-letter='${colour}']`);
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
      "entry.477642881": "Colours",
      "entry.1374858042": formattedTime
    };

    for (let i = 0; i < levels.length; i++) {
      const correctArr = Array.from(levelAttempts[i].correct).sort();
      const incorrectArr = levelAttempts[i].incorrect.sort();
      entries[formEntryIDs.correct[i]] = correctArr.join(", ");
      entries[formEntryIDs.incorrect[i]] = incorrectArr.map(c => `*${c}*`).join(", ");
    }

    let totalCorrect = 0;
    let totalAttempts = 0;
    for (let i = 0; i < levels.length; i++) {
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

  function touchStart(e) {
    e.preventDefault();
    const target = e.target;
    const colour = target.dataset.letter;
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
      if (el && el.classList.contains("slot")) {
        drop({ preventDefault: () => {}, dataTransfer: { getData: (k) => (k === "text/plain" ? colour : src) }, currentTarget: el });
      }
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  function loadPage() {
    const { type: mode, decoys, wideMode } = levels[currentLevel];

    if (wideMode) {
      document.body.classList.add("wide-mode");
    } else {
      document.body.classList.remove("wide-mode");
    }

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       "Match Signs and Pictures (Mixed)");

    if (currentPage === 0) {
      const shuffled = shuffle([...allColours]);
      currentColours = [];
      for (let i = 0; i < pagesPerLevel; i++) {
        currentColours.push(shuffle(shuffled.slice(i * 5, (i + 1) * 5)));
      }
    }

    const pageColours = currentColours[currentPage];
    const usedSet = new Set(pageColours);

    pageColours.forEach(colour => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = colour;
      let showSign = mode === "imageToSign" || (mode === "mixed" && Math.random() < 0.5);
      slot.style.backgroundImage = `url('assets/colours/${showSign ? `signs/sign-${colour}.png` : `clipart/${colour}.png`}')`;
      gameBoard.appendChild(slot);
    });

    const allDecoys = allColours.filter(c => !usedSet.has(c));
    const decoyColours = shuffle(allDecoys).slice(0, decoys);
    const draggableColours = shuffle([...pageColours, ...decoyColours]);

    draggableColours.forEach((colour, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.letter = colour;

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", colour);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      let opposite = mode === "signToImage" || (mode === "mixed" && !gameBoard.querySelector(`.slot[data-letter='${colour}']`)?.style.backgroundImage.includes("sign-"));
      img.src = `assets/colours/${opposite ? `signs/sign-${colour}.png` : `clipart/${colour}.png`}`;

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);

      if (i < draggableColours.length / 2) {
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

  loadPage();
});
