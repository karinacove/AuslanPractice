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
    { type: "imageToSign", decoys: 3, dragType: "clipart" },
    { type: "signToImage", decoys: 3, dragType: "sign" },
    { type: "mixed", decoys: 3, dragType: "mixed" },
    { type: "imageToSign", decoys: 9, dragType: "clipart" },
    { type: "signToImage", decoys: 9, dragType: "sign" },
    { type: "mixed", decoys: 9, dragType: "mixed", isReview: true }
  ];
  
  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 3;

  const letterStats = {};
  allLetters.forEach(letter => {
    letterStats[letter] = {
      attempts: 0,
      correctAttempts: 0,
      firstCorrectOnPage: false,
      pageAttempts: [],
      currentPageAttempt: "",
      incorrectAttempts: "",
    };
  });

  let correctMatches = 0;
  let startTime = Date.now();

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
    zIndex: "1000",
  });
  document.body.appendChild(feedbackImage);

  function getUnique27Letters() {
    const shuffled = allLetters.slice().sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 26);
    const selectedSet = new Set(selected);
    const remainingVowels = vowels.filter(v => !selectedSet.has(v));
    let extraVowel = remainingVowels.length > 0 ? remainingVowels[Math.floor(Math.random() * remainingVowels.length)] : vowels[Math.floor(Math.random() * vowels.length)];
    return selected.concat(extraVowel);
  }

  function loadPage() {
    if (currentLevel >= levels.length) return endGame();

    const mode = levels[currentLevel].type;
    const decoyCount = levels[currentLevel].decoys;
    const isReview = levels[currentLevel].isReview;

    const usedThisPage = new Set();
    let currentLetters = [];

    if (isReview) {
      const sortedByWrong = [...allLetters].sort((a, b) => letterStats[b].incorrectAttempts.length - letterStats[a].incorrectAttempts.length);
      const maxSet = sortedByWrong.filter(l => letterStats[l].incorrectAttempts.length > 0).slice(0, 27);
      currentLetters = maxSet.length ? maxSet : getUnique27Letters();
    } else {
      currentLetters = getUnique27Letters();
    }

    const selected = currentLetters.slice(currentPage * 9, currentPage * 9 + 9);
    const decoyPool = allLetters.filter(l => !selected.includes(l));
    const decoys = [];
    while (decoys.length < decoyCount && decoyPool.length > 0) {
      const index = Math.floor(Math.random() * decoyPool.length);
      decoys.push(decoyPool.splice(index, 1)[0]);
    }

    const draggables = [...selected, ...decoys].sort(() => Math.random() - 0.5);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       "Match Signs and Pictures (Mixed)");

    const slotTypeMap = {};

    selected.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;

      let isSign = false;
      if (mode === "signToImage") {
        isSign = false;
        slot.style.backgroundImage = `url('assets/alphabet/clipart/${letter}.png')`;
      } else if (mode === "imageToSign") {
        isSign = true;
        slot.style.backgroundImage = `url('assets/alphabet/signs/sign-${letter}.png')`;
      } else {
        isSign = Math.random() < 0.5;
        slot.style.backgroundImage = isSign
          ? `url('assets/alphabet/signs/sign-${letter}.png')`
          : `url('assets/alphabet/clipart/${letter}.png')`;
      }

      slotTypeMap[letter] = isSign;
      gameBoard.appendChild(slot);
    });

    draggables.forEach((letter, i) => {
      const draggable = document.createElement("img");
      draggable.dataset.letter = letter;
      draggable.className = "draggable";
      draggable.draggable = true;
      const isSignInSlot = slotTypeMap[letter];
      if (mode === "imageToSign") {
        draggable.src = `assets/alphabet/${dragType === "sign" ? "signs/sign-" : "clipart/"}${letter}.png`;
      } else if (mode === "signToImage") {
        draggable.src = `assets/alphabet/${dragType === "clipart" ? "clipart/" : "signs/sign-"}${letter}.png`;
      } else {
        // mixed
        draggable.src = dragType === "mixed"
          ? (isSignInSlot ? `assets/alphabet/clipart/${letter}.png` : `assets/alphabet/signs/sign-${letter}.png`)
          : `assets/alphabet/${dragType === "clipart" ? "clipart/" : "signs/sign-"}${letter}.png`;
      }

      const container = document.createElement("div");
      container.className = "drag-wrapper";
      container.appendChild(draggable);
      (i < draggables.length / 2 ? leftSigns : rightSigns).appendChild(container);

      draggable.addEventListener("dragstart", dragStart);
      draggable.addEventListener("touchstart", touchStart);
    });

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", dragOver);
      slot.addEventListener("drop", drop);
    });
  }

  function saveCurrentPageAttempts() {
    allLetters.forEach(letter => {
      const stats = letterStats[letter];
      stats.pageAttempts.push(stats.currentPageAttempt || "");
      stats.currentPageAttempt = "";
      stats.firstCorrectOnPage = false;
    });
  }

  function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.letter);
    e.target.classList.add("dragging");
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function drop(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const slot = e.currentTarget;
    const stats = letterStats[letter];
    stats.attempts++;

    const firstAttemptThisPage = stats.currentPageAttempt.length === 0;

    if (slot.dataset.letter === letter) {
      stats.correctAttempts++;
      if (!stats.firstCorrectOnPage) {
        stats.firstCorrectOnPage = true;
        stats.currentPageAttempt += letter;
      }

      slot.innerHTML = "";
      const img = document.querySelector(`.draggable[data-letter='${letter}']`);
      if (img) img.remove();
      slot.appendChild(img);
      correctMatches++;

      showFeedback(true);

      if (correctMatches >= 9) {
        correctMatches = 0;
        saveCurrentPageAttempts();
        currentPage++;
        if (currentPage >= pagesPerLevel) {
          currentPage = 0;
          currentLevel++;
        }
        setTimeout(loadPage, 500);
      }
    } else {
      if (!stats.firstCorrectOnPage && firstAttemptThisPage) {
        stats.currentPageAttempt += "*";
      }
      stats.incorrectAttempts += letter;
      showFeedback(false);
    }
  }

  function touchStart(e) {
    e.preventDefault();
    const target = e.target;
    const letter = target.dataset.letter;
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
      if (el && el.classList.contains("slot")) drop({ preventDefault() {}, currentTarget: el, dataTransfer: { getData: () => letter } });
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  function endGame() {
    saveCurrentPageAttempts();
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;

    const correctEntries = allLetters.map(letter => letterStats[letter].pageAttempts.join(""));
    const incorrectEntries = allLetters
      .map(letter => letterStats[letter].incorrectAttempts || "")
      .filter(str => str.length > 0);

    const sortIgnoringAsterisks = (a, b) => a.replace(/\*/g, "").localeCompare(b.replace(/\*/g, ""));
    correctEntries.sort(sortIgnoringAsterisks);
    incorrectEntries.sort(sortIgnoringAsterisks);

    const correctStr = correctEntries.join(", ");
    const incorrectStr = incorrectEntries.join(", ");

    let totalAttempts = 0;
    let firstTryCorrectCount = 0;
    allLetters.forEach(letter => {
      const stats = letterStats[letter];
      totalAttempts += stats.attempts;
      const firstCorrectCount = stats.pageAttempts.reduce((acc, val) => val.includes(letter) ? acc + 1 : acc, 0);
      firstTryCorrectCount += firstCorrectCount;
    });
    const scorePercent = totalAttempts > 0 ? Math.round((firstTryCorrectCount / totalAttempts) * 100) : 0;

    document.getElementById("score-display").innerText = `Score: ${scorePercent}%`;
    const timeDisplay = document.createElement("p");
    timeDisplay.innerText = `Time: ${formattedTime}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Alphabet",
      "entry.1897227570": incorrectStr,
      "entry.1249394203": correctStr,
      "entry.1996137354": `${scorePercent}%`,
      "entry.1374858042": formattedTime,
    };

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";

    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    modal.style.display = "flex";
  }

  loadPage();
});
