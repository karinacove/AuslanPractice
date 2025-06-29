document.addEventListener("DOMContentLoaded", function () {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  const urlParams = new URLSearchParams(window.location.search);
  const topic = urlParams.get("topic") || "alphabet";

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

  const allItems = topic === "alphabet"
    ? "abcdefghijklmnopqrstuvwxyz".split("")
    : ["red", "green", "blue", "black", "brown", "purple", "pink", "orange", "white", "yellow"];

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
      "entry.1249394203",
      "entry.1551220511",
      "entry.903633326",
      "entry.497882042",
      "entry.1591755601",
      "entry.1996137354"
    ],
    incorrect: [
      "entry.1897227570",
      "entry.1116300030",
      "entry.187975538",
      "entry.1880514176",
      "entry.552536101",
      "entry.922308538"
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
    setTimeout(() => feedbackImage.style.display = "none", 1000);
  }

  function loadPage() {
    const { type, decoys, wideMode } = levels[currentLevel];

    if (wideMode) {
      document.body.classList.add("wide-mode");
    } else {
      document.body.classList.remove("wide-mode");
    }

    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    levelTitle.innerText = `Level ${currentLevel + 1}`;

    if (currentPage === 0) {
      const baseItems = shuffle([...allItems]);
      currentLetters = [];

      for (let page = 0; page < pagesPerLevel; page++) {
        let items = baseItems.slice(page * 9, (page + 1) * 9);

        if (topic === "alphabet" && page === 2) {
          const used = new Set(items);
          const missingVowels = vowels.filter(v => !used.has(v));
          if (missingVowels.length > 0) {
            items.push(missingVowels[Math.floor(Math.random() * missingVowels.length)]);
          }
        }

        currentLetters.push(items);
      }
    }

    const lettersThisPage = currentLetters[currentPage];
    const usedLetters = new Set(lettersThisPage);

    lettersThisPage.forEach(letter => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.letter = letter;
      slot.style.backgroundImage = `url('assets/${topic}/clipart/${letter}.png')`;
      gameBoard.appendChild(slot);
    });

    const decoyLetters = shuffle(allItems.filter(l => !usedLetters.has(l))).slice(0, decoys);
    const draggables = shuffle([...lettersThisPage, ...decoyLetters]);

    draggables.forEach((letter, index) => {
      const img = document.createElement("img");
      img.src = `assets/${topic}/signs/sign-${letter}.png`;
      img.className = "draggable";
      img.dataset.letter = letter;
      img.draggable = true;
      img.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", letter);
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      if (index % 2 === 0) {
        leftSigns.appendChild(img);
      } else {
        rightSigns.appendChild(img);
      }
    });

    correctMatches = 0;

    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", drop);
    });
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
    }
  }

  loadPage();
});
