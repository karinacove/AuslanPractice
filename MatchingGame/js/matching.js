// [FULL JS with corrected slot image logic and updated Google Form logic and modal actions]
document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const againBtn = document.getElementById("again-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");
  const finishBtn = document.getElementById("finish-btn");
  const continueBtn = document.getElementById("continue-btn");

  if (finishBtn) finishBtn.addEventListener("click", () => endGame());
  if (againBtn) againBtn.addEventListener("click", () => location.reload());
  if (menuBtn) menuBtn.addEventListener("click", () => window.location.href = "../index.html");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  const vowels = ["a", "e", "i", "o", "u"];

  const levels = [
    { type: "signToImage", decoys: 3, dragType: "clipart" },
    { type: "imageToSign", decoys: 3, dragType: "sign" },
    { type: "mixed", decoys: 3, dragType: "mixed" },
    { type: "signToImage", decoys: 9, dragType: "clipart" },
    { type: "imageToSign", decoys: 9, dragType: "sign" },
    { type: "mixed", decoys: 9, dragType: "mixed", isReview: true }
  ];

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

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function loadPage() {
    const { type, decoys, dragType, isReview } = levels[currentLevel];
    let availableLetters = [...allLetters];
    let selectedLetters = [];

    if (isReview) {
      selectedLetters = availableLetters
        .filter(l => levelAttempts[currentLevel].incorrect.includes(l))
        .sort()
        .slice(0, 9);
    } else {
      selectedLetters = shuffle(availableLetters);
      const startIndex = currentPage * 9;
      selectedLetters = selectedLetters.slice(startIndex, startIndex + 9);
      if (currentPage === 2 && selectedLetters.length < 9) {
        const extraVowel = vowels.find(v => !selectedLetters.includes(v));
        if (extraVowel) selectedLetters.push(extraVowel);
      }
    }

    const gridItems = [...selectedLetters];
    const decoyLetters = shuffle(allLetters.filter(l => !gridItems.includes(l))).slice(0, decoys);
    const draggableLetters = shuffle([...gridItems, ...decoyLetters]);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    currentLetters = gridItems;

    levelTitle.innerText = `Level ${currentLevel + 1} — Page ${currentPage + 1}`;

    gridItems.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;

      if (type === "signToImage") {
        slot.style.backgroundImage = `url('assets/alphabet/signs/sign-${letter}.png')`;
      } else if (type === "imageToSign") {
        slot.style.backgroundImage = `url('assets/alphabet/clipart/${letter}.png')`;
      } else {
        slot.style.backgroundImage = Math.random() < 0.5
          ? `url('assets/alphabet/signs/sign-${letter}.png')`
          : `url('assets/alphabet/clipart/${letter}.png')`;
      }

      gameBoard.appendChild(slot);
    });

    draggableLetters.forEach((letter, i) => {
      const img = document.createElement("img");
      img.className = "draggable";
      img.dataset.letter = letter;
      img.draggable = true;

      img.src = dragType === "clipart"
        ? `assets/alphabet/clipart/${letter}.png`
        : dragType === "sign"
        ? `assets/alphabet/signs/sign-${letter}.png`
        : (i % 2 === 0
          ? `assets/alphabet/signs/sign-${letter}.png`
          : `assets/alphabet/clipart/${letter}.png`
        );

      img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", letter);
        e.dataTransfer.setData("src", img.src);
      });

      img.addEventListener("touchstart", touchStart);

      const wrapper = document.createElement("div");
      wrapper.className = "drag-wrapper";
      wrapper.appendChild(img);

      (i < draggableLetters.length / 2 ? leftSigns : rightSigns).appendChild(wrapper);
    });

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
  }

  function drop(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const slot = e.target.closest(".slot");
    if (!slot) return;

    const correct = slot.dataset.letter === letter;
    const attemptData = levelAttempts[currentLevel];

    if (correct && !attemptData.correct.has(letter)) {
      attemptData.correct.add(letter);
    } else if (!correct) {
      attemptData.incorrect.push(letter);
    }

    showFeedback(correct);

    if (correct) {
      slot.innerHTML = "";
      const img = document.createElement("img");
      img.src = e.dataTransfer.getData("src");
      img.className = "overlay";
      slot.appendChild(img);

      document.querySelectorAll(`.draggable[data-letter='${letter}']`).forEach(el => el.remove());

      correctMatches++;
      if (correctMatches >= currentLetters.length) {
        correctMatches = 0;
        currentPage++;
        if (currentPage >= pagesPerLevel) {
          currentLevel++;
          currentPage = 0;
        }
        if (currentLevel < levels.length) {
          setTimeout(loadPage, 800);
        } else {
          setTimeout(endGame, 800);
        }
      }
    }
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  function endGame() {
    if (gameEnded) return;
    gameEnded = true;

    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalAttempts = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size + lvl.incorrect.length, 0);
    const percent = totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100);
    const time = Math.round((Date.now() - startTime) / 1000);
    const formattedTime = `${Math.floor(time / 60)} mins ${time % 60} sec`;

    if (totalAttempts === 0) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.target = "hidden_iframe";
    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const addField = (name, value) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };

    addField("entry.1387461004", studentName);
    addField("entry.1309291707", studentClass);
    addField("entry.477642881", "Alphabet");

    const correctIDs = [
      "entry.1249394203",
      "entry.1551220511",
      "entry.903633326",
      "entry.497882042",
      "entry.1591755601",
      "entry.1996137354"
    ];
    const incorrectIDs = [
      "entry.1897227570",
      "entry.1116300030",
      "entry.187975538",
      "entry.1880514176",
      "entry.552536101",
      "entry.922308538"
    ];

    levelAttempts.forEach((lvl, idx) => {
      addField(correctIDs[idx], Array.from(lvl.correct).sort().join(", "));
      addField(incorrectIDs[idx], lvl.incorrect.sort().join(", "));
    });

    addField("entry.1996137354", `${percent}%`);
    addField("entry.1374858042", formattedTime);
    document.body.appendChild(form);
    form.submit();

    document.getElementById("score-display").innerText = `Score: ${percent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);
    modal.style.display = "flex";

    if (currentLevel < levels.length) {
      continueBtn.style.display = "inline-block";
      continueBtn.onclick = () => {
        modal.style.display = "none";
        gameEnded = false;
        loadPage();
      };
    } else {
      continueBtn.style.display = "none";
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
      if (el && el.classList.contains("slot")) drop({ preventDefault: () => {}, dataTransfer: { getData: () => letter }, target: el });
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  loadPage();
});
