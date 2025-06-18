document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }

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
  let levelLetters = [];
  let letterCorrectMap = {};
  let letterIncorrectList = [];
  let totalCorrect = 0;
  let totalIncorrect = 0;
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

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function generateLevelLetters() {
    levelLetters = shuffleArray([...allLetters, ...allLetters, ...allLetters]);
  }

  function loadPage() {
    if (currentPage >= 3) {
      currentLevel++;
      currentPage = 0;
      if (currentLevel >= levels.length) {
        endGame();
        return;
      }
      generateLevelLetters();
    }

    const mode = levels[currentLevel].type;
    const pageLetters = levelLetters.slice(currentPage * 9, (currentPage + 1) * 9);
    const remainingLetters = allLetters.filter((l) => !pageLetters.includes(l));
    let decoys = [];
    const remainingPool = [...remainingLetters];
    while (decoys.length < 3 && remainingPool.length > 0) {
      const idx = Math.floor(Math.random() * remainingPool.length);
      decoys.push(remainingPool.splice(idx, 1)[0]);
    }

    const draggableLetters = shuffleArray([...pageLetters, ...decoys]);

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}: ` +
      (mode === "signToImage" ? "Match the Sign to the Picture" :
       mode === "imageToSign" ? "Match the Picture to the Sign" :
       "Match Signs and Pictures (Mixed)");

    pageLetters.forEach((letter) => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;

      if (mode === "signToImage") {
        slot.style.backgroundImage = `url('assets/alphabet/clipart/${letter}.png')`;
      } else if (mode === "imageToSign") {
        slot.style.backgroundImage = `url('assets/alphabet/signs/sign-${letter}.png')`;
      } else {
        const isSign = Math.random() < 0.5;
        slot.style.backgroundImage = isSign
          ? `url('assets/alphabet/signs/sign-${letter}.png')`
          : `url('assets/alphabet/clipart/${letter}.png')`;
        slot.dataset.isSign = isSign ? "true" : "false";
      }

      gameBoard.appendChild(slot);
    });

    draggableLetters.forEach((letter, i) => {
      const draggable = document.createElement("img");
      draggable.dataset.letter = letter;
      draggable.className = "draggable";
      draggable.draggable = true;
      draggable.addEventListener("dragstart", dragStart);
      draggable.addEventListener("touchstart", touchStart);

      if (mode === "signToImage") {
        draggable.src = `assets/alphabet/signs/sign-${letter}.png`;
      } else if (mode === "imageToSign") {
        draggable.src = `assets/alphabet/clipart/${letter}.png`;
      } else {
        const matchingSlot = [...gameBoard.children].find(s => s.dataset.letter === letter);
        const isSignInSlot = matchingSlot?.style.backgroundImage.includes("sign");
        draggable.src = isSignInSlot
          ? `assets/alphabet/clipart/${letter}.png`
          : `assets/alphabet/signs/sign-${letter}.png`;
      }

      const container = document.createElement("div");
      container.className = "drag-wrapper";
      container.appendChild(draggable);

      if (i < 6) {
        leftSigns.appendChild(container);
      } else {
        rightSigns.appendChild(container);
      }
    });

    document.querySelectorAll(".slot").forEach((slot) => {
      slot.addEventListener("dragover", dragOver);
      slot.addEventListener("drop", drop);
    });

    currentPage++;
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
    handleDrop(e.currentTarget, draggedLetter, draggedSrc);
  }

  function handleDrop(targetSlot, draggedLetter, draggedSrc) {
    if (targetSlot.dataset.letter === draggedLetter) {
      totalCorrect++;
      letterCorrectMap[draggedLetter] = (letterCorrectMap[draggedLetter] || 0) + 1;
      showFeedback(true);

      targetSlot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = draggedSrc;
      overlay.className = "overlay";
      targetSlot.appendChild(overlay);

      document.querySelectorAll(`img.draggable[data-letter='${draggedLetter}']`).forEach((el) => el.remove());

      if ([...document.querySelectorAll(".slot")].every(s => s.querySelector(".overlay"))) {
        setTimeout(loadPage, 1000);
      }
    } else {
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
    }, 1000);
  }

  function touchStart(e) {
    const target = e.target;
    const letter = target.dataset.letter;
    const src = target.src;

    const handleTouchEnd = (ev) => {
      const touch = ev.changedTouches[0];
      const endElement = document.elementFromPoint(touch.clientX, touch.clientY);
      if (endElement && endElement.classList.contains("slot")) {
        handleDrop(endElement, letter, src);
      }
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchend", handleTouchEnd, { passive: false });
  }

  function endGame() {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    const timeFormatted = `${minutes} mins ${seconds} sec`;
    const accuracy = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) + "%" : "N/A";

    const correctLetters = allLetters.map((letter) => {
      const count = letterCorrectMap[letter] || 0;
      if (!count) return "";
      if (count === 3) return letter.repeat(3);
      if (count === 2) return `*${letter}`;
      if (count === 1) return `*${letter}*`;
      return "";
    }).filter(Boolean).join(", ");

    const incorrectLetters = [...new Set(letterIncorrectList)].sort().join(", ");

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

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

    const modal = document.createElement("div");
    modal.id = "congratsModal";
    modal.innerHTML = `
      <div class="modal-content">
        <h2>🎉 Congratulations, ${studentName}!</h2>
        <p>You’ve finished the Alphabet Matching Game.</p>
        <p><strong>✅ Accuracy:</strong> ${accuracy}</p>
        <p><strong>⏱️ Time:</strong> ${timeFormatted}</p>
        <button id="backToHub">Back to Hub</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("backToHub").addEventListener("click", () => {
      window.location.href = "hub.html";
    });

    setTimeout(() => {
      window.location.href = "hub.html";
    }, 5000);
  }

  generateLevelLetters();
  loadPage();
});
