document.addEventListener("DOMContentLoaded", function () {
  // Get student info from localStorage
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }

  // Finish button
  const finishButton = document.getElementById("finishButton");
  if (finishButton) {
    finishButton.addEventListener("click", () => {
      endGame();
    });
  }

  const levels = [
    { type: "signToImage" },
    { type: "imageToSign" },
    { type: "mixed" },
  ];
  let currentLevel = 0;
  let currentPage = 0;

  const allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
  let usedLetters = [];
  let correctMatches = 0;
  let incorrectMatches = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;

  let startTime = Date.now();

  const letterCorrectMap = {};
  const letterIncorrectList = [];

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const nextLevelBtn = document.getElementById("nextLevel");
  const levelTitle = document.getElementById("levelTitle");

  // Create feedback image element
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

  // Next level button click
  if (nextLevelBtn) {
    nextLevelBtn.addEventListener("click", () => {
      currentLevel++;
      currentPage = 0;
      usedLetters = [];
      nextLevelBtn.style.display = "none";

      if (currentLevel < levels.length) {
        loadPage();
      } else {
        endGame();
      }
    });
  }

  // Get random letters for current page, avoid repeats
  function getRandomLetters(count) {
    const available = allLetters.filter((l) => !usedLetters.includes(l));
    const selected = [];
    while (selected.length < count && available.length > 0) {
      const index = Math.floor(Math.random() * available.length);
      selected.push(available.splice(index, 1)[0]);
    }
    usedLetters.push(...selected);
    return selected;
  }

function loadPage() {
  const mode = levels[currentLevel].type;

  correctMatches = 0;
  usedLetters = [];

  // Pick 9 correct letters
  const slotLetters = getRandomLetters(9);

  // Add 3 decoys not in slotLetters
  const remaining = allLetters.filter((l) => !slotLetters.includes(l));
  const decoys = [];
  while (decoys.length < 3 && remaining.length > 0) {
    const index = Math.floor(Math.random() * remaining.length);
    decoys.push(remaining.splice(index, 1)[0]);
  }

  const draggableLetters = [...slotLetters, ...decoys].sort(() => Math.random() - 0.5);

  gameBoard.innerHTML = "";
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  levelTitle.innerText = `Level ${currentLevel + 1}: ` +
    (mode === "signToImage" ? "Match the Sign to the Picture" :
     mode === "imageToSign" ? "Match the Picture to the Sign" :
     "Mixed: Match Signs and Pictures");

  // Create slots with background images
  slotLetters.forEach((letter) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.letter = letter;

    let showSignInside;
    if (mode === "signToImage") {
      showSignInside = false;
    } else if (mode === "imageToSign") {
      showSignInside = true;
    } else {
      showSignInside = Math.random() < 0.5; // Mixed mode
    }

    slot.style.backgroundImage = showSignInside
      ? `url('assets/alphabet/signs/sign-${letter}.png')`
      : `url('assets/alphabet/clipart/${letter}.png')`;

    // Store how the match was rendered
    slot.dataset.showsSignInside = showSignInside;
    gameBoard.appendChild(slot);
  });

  // Create 12 draggable items
  draggableLetters.forEach((letter, i) => {
    const draggable = document.createElement("img");

    // Decide what image type to show for this letter
    let isSign;
    const slot = document.querySelector(`.slot[data-letter='${letter}']`);
    if (slot) {
      isSign = slot.dataset.showsSignInside === "false";
    } else {
      isSign = Math.random() < 0.5;
    }

    draggable.src = isSign
      ? `assets/alphabet/signs/sign-${letter}.png`
      : `assets/alphabet/clipart/${letter}.png`;

    draggable.className = "draggable";
    draggable.draggable = true;
    draggable.dataset.letter = letter;
    draggable.addEventListener("dragstart", dragStart);
    draggable.addEventListener("touchstart", touchStart);

    const container = document.createElement("div");
    container.className = "drag-wrapper";
    container.appendChild(draggable);

    (i < 6 ? leftSigns : rightSigns).appendChild(container);
  });

  document.querySelectorAll(".slot").forEach((slot) => {
    slot.addEventListener("dragover", dragOver);
    slot.addEventListener("drop", drop);
  });
}

  function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.letter);
    e.dataTransfer.setData("src", e.target.src);
    e.target.classList.add("dragging");
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function drop(e) {
    e.preventDefault();
    const draggedLetter = e.dataTransfer.getData("text/plain");
    const draggedSrc = e.dataTransfer.getData("src");
    const targetSlot = e.currentTarget;

    handleDrop(targetSlot, draggedLetter, draggedSrc);
  }

  function handleDrop(targetSlot, draggedLetter, draggedSrc) {
    if (targetSlot.dataset.letter === draggedLetter) {
      correctMatches++;
      totalCorrect++;
      letterCorrectMap[draggedLetter] = (letterCorrectMap[draggedLetter] || 0) + 1;
      showFeedback(true);

      // Clear slot and add overlay image
      targetSlot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = draggedSrc;
      overlay.className = "overlay";
      targetSlot.appendChild(overlay);

      // Remove all draggable images with this letter
      document.querySelectorAll(`img.draggable[data-letter='${draggedLetter}']`).forEach((el) => el.remove());

      if (correctMatches >= 9) {
        setTimeout(() => {
          currentLevel++;
          if (currentLevel < levels.length) {
            loadPage();
          } else {
            endGame();
          }
        }, 1000);
      }
    } else {
      incorrectMatches++;
      totalIncorrect++;
      letterIncorrectList.push(draggedLetter);
      showFeedback(false);
      const dragged = document.querySelector(`img.draggable[data-letter='${draggedLetter}']`);
      if (dragged) {
        dragged.classList.add("shake");
        setTimeout(() => dragged.classList.remove("shake"), 500);
      }
    }
  }

  function showFeedback(correct) {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => {
      feedbackImage.style.display = "none";
    }, 2000);
  }

  function touchStart(e) {
    const target = e.target;
    const letter = target.dataset.letter;
    const src = target.src;

    const touchMove = (ev) => {
      const touchLocation = ev.touches[0];
      const element = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
      if (element && element.classList.contains("slot")) {
        handleDrop(element, letter, src);
        document.removeEventListener("touchmove", touchMove);
      }
    };

    document.addEventListener("touchmove", touchMove, { passive: false });

    e.target.addEventListener(
      "touchend",
      () => {
        document.removeEventListener("touchmove", touchMove);
      },
      { once: true }
    );
  }

 function endGame() {
  const endTime = Date.now();
  const totalTime = Math.round((endTime - startTime) / 1000);
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeFormatted = `${minutes} mins ${seconds} sec`;

  const accuracy = Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) + "%";

  const correctLetters = allLetters.map(letter => {
    const count = letterCorrectMap[letter] || 0;
    return count ? letter.repeat(count) : "";
  }).filter(Boolean).join(", ");

  const incorrectLetters = letterIncorrectList.sort().join(", ");

  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";

  const formData = new FormData();
  formData.append("entry.1387461004", studentName);
  formData.append("entry.1309291707", studentClass);
  formData.append("entry.477642881", "Alphabet");
  formData.append("entry.1897227570", incorrectLetters);
  formData.append("entry.1249394203", correctLetters);
  formData.append("entry.1996137354", accuracy);
  formData.append("entry.1374858042", timeFormatted);

  fetch(formUrl, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  }).finally(() => {
    window.location.href = "hub.html";
  });
