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
    { type: "imageToSign", decoys: 3 },
    { type: "signToImage", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "imageToSign", decoys: 9 },
    { type: "signToImage", decoys: 9 },
    { type: "mixed", decoys: 9, isReview: true }
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
    const remainingVowels = vowels.filter(v => !selected.includes(v));
    let extraVowel = remainingVowels.length > 0 ? remainingVowels[Math.floor(Math.random() * remainingVowels.length)] : null;

    if (!extraVowel) {
      const notOnPage = allLetters.filter(l => !selected.includes(l));
      const fallbackVowel = vowels.find(v => !selected.includes(v));
      extraVowel = fallbackVowel || vowels[Math.floor(Math.random() * vowels.length)];
    }

    selected.push(extraVowel);
    return selected;
  }

  function endGame() {
    saveCurrentPageAttempts();
    const endTime = Date.now();
    const time = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const formatted = `${minutes} mins ${seconds} sec`;

    const correctEntries = allLetters.map(letter => letterStats[letter].pageAttempts.join(""));
    const incorrectEntries = allLetters.map(letter => letterStats[letter].incorrectAttempts || "").filter(str => str.length > 0);
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
    timeDisplay.innerText = `Time: ${formatted}`;
    document.getElementById("end-modal-content").appendChild(timeDisplay);

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Alphabet",
      "entry.1897227570": incorrectStr,
      "entry.1249394203": correctStr,
      "entry.1996137354": `${scorePercent}%`,
      "entry.1374858042": formatted,
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

  function loadPage() {
    if (currentLevel >= levels.length) return endGame();
    const { type: mode, decoys, isReview } = levels[currentLevel];
    let currentLetters = [];

    if (isReview) {
      currentLetters = getMostIncorrectLetters(9);
    } else {
      const set = getUnique27Letters();
      const sliceSize = 9;
      currentLetters = set.slice(currentPage * sliceSize, (currentPage + 1) * sliceSize);
    }

    const remaining = allLetters.filter(l => !currentLetters.includes(l));
    const usedDecoys = [];
    while (usedDecoys.length < decoys && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      usedDecoys.push(remaining.splice(idx, 1)[0]);
    }

    const draggables = [...currentLetters, ...usedDecoys].sort(() => Math.random() - 0.5);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       "Match Signs and Pictures (Mixed)");

    const slotTypeMap = {};

    currentLetters.forEach(letter => {
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
      draggable.addEventListener("dragstart", dragStart);
      draggable.addEventListener("touchstart", touchStart);

      const isSignInSlot = slotTypeMap[letter];

      if (mode === "imageToSign") {
        draggable.src = `assets/alphabet/clipart/${letter}.png`;
      } else if (mode === "signToImage") {
        draggable.src = `assets/alphabet/signs/sign-${letter}.png`;
      } else {
        draggable.src = isSignInSlot
          ? `assets/alphabet/clipart/${letter}.png`
          : `assets/alphabet/signs/sign-${letter}.png`;
      }

      const container = document.createElement("div");
      container.className = "drag-wrapper";
      container.appendChild(draggable);

      (i < draggables.length / 2 ? leftSigns : rightSigns).appendChild(container);
    });

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", dragOver);
      slot.addEventListener("drop", drop);
    });
  }

  loadPage();
});
