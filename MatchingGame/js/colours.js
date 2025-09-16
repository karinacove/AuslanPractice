// COLOURS VERSION WITH PER-PAGE MATCH TRACKING, SAVE, RESUME

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
  const stopBtn = document.getElementById("stop-btn");

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
      "entry.1897227570", // Level 1 Correct
      "entry.1116300030", // Level 2 Correct
      "entry.187975538",  // Level 3 Correct
      "entry.1880514176", // Level 4 Correct
      "entry.497882042",  // Level 5 Correct
      "entry.1591755601"  // Level 6 Correct  
    ],
    incorrect: [
      "entry.1249394203", // Level 1 Incorrect
      "entry.1551220511", // Level 2 Incorrect
      "entry.903633326",  // Level 3 Incorrect
      "entry.856597282",  // Level 4 Incorrect
      "entry.552536101",  // Level 5 Incorrect
      "entry.922308538"   // Level 6 Incorrect 
    ]
  };

  let currentLevel = 0;
  let currentPage = 0;
  const pagesPerLevel = 2;
  let levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  let currentColours = [];
  let correctMatches = 0;
  let correctThisPage = 0;
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

  function updateScore() {
    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;
    document.getElementById("score-display").innerText = `Score: ${percent}%`;
  }

  // --- SAVE / LOAD ---
  function saveProgress() {
    const savedData = {
      currentLevel, currentPage,
      levelAttempts: levelAttempts.map(lvl => ({
        correct: Array.from(lvl.correct),
        incorrect: lvl.incorrect
      })),
      currentColours,
      startTime
    };
    localStorage.setItem("coloursSavedProgress", JSON.stringify(savedData));
  }

  function loadProgress() {
    const data = localStorage.getItem("coloursSavedProgress");
    if (data) {
      const parsed = JSON.parse(data);
      currentLevel = parsed.currentLevel;
      currentPage = parsed.currentPage;
      levelAttempts = parsed.levelAttempts.map(lvl => ({
        correct: new Set(lvl.correct),
        incorrect: lvl.incorrect
      }));
      currentColours = parsed.currentColours;
      startTime = parsed.startTime;
    }
  }

  function clearProgress() {
    localStorage.removeItem("coloursSavedProgress");
  }

  // --- END GAME + SUBMIT ---
  function submitResults() {
    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    const formData = new FormData();
    formData.append("entry.2005823232", studentName);  // name
    formData.append("entry.1496682818", studentClass); // class
    formData.append("entry.1045781291", "Colours");    // subject
    formData.append("entry.839337160", timeTaken);     // time
    formData.append("entry.1166974658", percent);      // percent score

    // Per-level results
    levels.forEach((_, idx) => {
      formData.append(formEntryIDs.correct[idx], levelAttempts[idx].correct.size);
      formData.append(formEntryIDs.incorrect[idx], levelAttempts[idx].incorrect.length);
    });

    fetch("https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse", {
      method: "POST",
      mode: "no-cors",
      body: formData
    });
  }

  function endGame() {
    if (gameEnded) return;
    gameEnded = true;
    clearProgress();
    submitResults();
    modal.style.display = "flex";
  }

  // --- BUTTONS ---
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      endGame();
      window.location.href = "../index.html";
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      modal.style.display = "none";
      gameEnded = false;
      loadPage();
    });
  }

  if (againBtn) {
    againBtn.addEventListener("click", () => location.reload());
  }

  // --- INITIAL LOAD ---
  if (localStorage.getItem("coloursSavedProgress")) {
    loadProgress();
  }
  loadPage();
});
