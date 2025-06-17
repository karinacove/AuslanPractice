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

  // Get 9 letters for slots
  const slotLetters = getRandomLetters(Math.min(9, allLetters.length - usedLetters.length));

  // Get 3 decoy letters not in slots
  const remainingLetters = allLetters.filter(l => !slotLetters.includes(l) && !usedLetters.includes(l));
  let decoys = [];
  while (decoys.length < 3 && remainingLetters.length > 0) {
    const idx = Math.floor(Math.random() * remainingLetters.length);
    decoys.push(remainingLetters.splice(idx,1)[0]);
  }

  const draggableLetters = [...slotLetters, ...decoys];
  // Shuffle draggableLetters
  draggableLetters.sort(() => Math.random() - 0.5);

  gameBoard.innerHTML = "";
  leftSigns.innerHTML = "";
  rightSigns.innerHTML = "";

  levelTitle.innerText = `Level ${currentLevel + 1}: ` +
    (mode === "signToImage" ? "Match the Sign to the Picture" :
      mode === "imageToSign" ? "Match the Picture to the Sign" :
        "Match Signs and Pictures (Mixed)");

  // Create 9 slots for slotLetters
  slotLetters.forEach((letter) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.letter = letter;
    slot.style.backgroundImage = mode === "signToImage" || (mode === "mixed" && Math.random() < 0.5)
      ? `url('assets/alphabet/clipart/${letter}.png')`
      : `url('assets/alphabet/signs/sign-${letter}.png')`;
    gameBoard.appendChild(slot);
  });

  // Create 12 draggables: first 6 left, next 6 right
  draggableLetters.forEach((letter, i) => {
    const draggable = document.createElement("img");
    draggable.src = (mode === "signToImage" || (mode === "mixed" && Math.random() < 0.5))
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

    if (i < 6) {
      leftSigns.appendChild(container);
    } else {
      rightSigns.appendChild(container);
    }
  });

  // Add event listeners to slots
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
        currentPage++;
        correctMatches = 0;
        if (usedLetters.length < allLetters.length) {
          setTimeout(loadPage, 1000);
        } else {
          if (nextLevelBtn) nextLevelBtn.style.display = "block";
        }
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

    const accuracy =
      totalCorrect + totalIncorrect > 0
        ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) + "%"
        : "N/A";

    const correctLetters = allLetters
      .map((letter) => {
        const count = letterCorrectMap[letter] || 0;
        return count ? letter.repeat(count) : "";
      })
      .filter(Boolean)
      .join(", ");

    const incorrectLetters = [...new Set(letterIncorrectList)].sort().join(", ");

    // Prepare form to submit results to Google Forms
    const form = document.createElement("form");
    form.action =
      "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "_blank";
    form.style.display = "none";

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Alphabet",
      "entry.1897227570": incorrectLetters,
      "entry.1249394203": correctLetters,
      "entry.1996137354": accuracy,
      "entry.1374858042": timeFormatted,
    };

    for (const key in entries) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    window.location.href = "hub.html";
  }, 1000);
}

  // Start game with first page
  loadPage();
});
