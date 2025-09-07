// BalloonPop — full updated script with persistent game state and Stop/Finish modal behavior

(() => {
  // --- LOGIN (keep these persistent) ---
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  // Keys for persistent game state
  const STATE_KEY = "balloonGameState_v1";

  // --- DOM nodes (we'll query inside DOMContentLoaded) ---
  // --- Helper: safe query ---
  const $ = (id) => document.getElementById(id);

  // --- Default game state ---
  const defaultState = {
    score: 0,
    totalClicks: 0,
    correctAnswers: 0,
    correctAnswersList: [],
    incorrectAnswersList: [],
    level: 1,
    collectedCount: 0,
    targetColour: null,
    targetNumber: null,
  };

  // --- Save / Load state helpers ---
  function saveState(state) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save game state:", e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return Object.assign({}, defaultState, parsed);
    } catch (e) {
      console.warn("Could not load game state:", e);
      return { ...defaultState };
    }
  }

  function clearGameState() {
    localStorage.removeItem(STATE_KEY);
  }

  // --- Game variables (will be populated from state) ---
  let state = loadState();

  // In-memory variables
  let balloonInterval = null;
  let correctBalloonInterval = null;
  let floatSpeed = 30;
  let consecutiveIncorrect = 0;

  // Assets / config
  const colours = ["green", "red", "orange", "yellow", "purple", "pink", "blue", "brown", "black", "white"];

  // Map offsets for extended numbers (only used to build valid file list)
  const colourOffsets = {
    green: 41,
    red: 41,
    orange: 43,
    yellow: 42,
    purple: 43,
    pink: 44,
    blue: 44,
    brown: 42,
    black: 44,
    white: 43,
  };

  // Helper: number ranges per level rules you asked for
  function getNumberRangeForLevel(lv) {
    if (lv >= 1 && lv <= 3) return Array.from({ length: 12 }, (_, i) => i + 1);      // 1–12
    if (lv >= 4 && lv <= 6) return Array.from({ length: 8 }, (_, i) => i + 13);       // 13–20
    if (lv >= 7 && lv <= 9) return Array.from({ length: 21 }, (_, i) => i + 20);      // 21–40 (20–40)
    if (lv >= 10 && lv <= 12) return Array.from({ length: 60 }, (_, i) => i + 41);     // 41–100
    return Array.from({ length: 100 }, (_, i) => i + 1);                              // fallback 1–100
  }

  // Build valid numbers for a colour (handles missing images by design)
  function getValidNumbersForColour(colour) {
    // base 0-40
    const base = Array.from({ length: 41 }, (_, i) => i); // 0..40
    const start = colourOffsets[colour];
    const extended = [];
    if (typeof start === "number") {
      for (let n = start; n <= 100; n += 4) extended.push(n);
    }
    return base.concat(extended);
  }

  // --- DOMContentLoaded: wire up UI and start/resume ---
  document.addEventListener("DOMContentLoaded", () => {
    // Query DOM safely
    const studentInfoDiv = $("student-info");
    const gameContainer = $("game-container");
    const stopBtn = $("stop-btn");

    const endModal = $("end-modal");
    const scoreDisplayModal = $("score-display");
    const continueBtn = $("continue-btn");
    const finishBtn = $("finish-btn");
    const againBtn = $("again-btn");
    const logoutBtn = $("logout-btn");

    const balloonArea = $("balloon-area");
    const scoreDisplay = $("score");
    const levelDisplay = $("level");
    const thoughtBubble = $("thought-bubble");
    const background = $("background");
    const mrsC = $("mrs-c");

    // if login missing, redirect to root
    if (!studentName || !studentClass) {
      alert("Please log in first.");
      window.location.href = "../index.html";
      return;
    }

    if (studentInfoDiv) studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
    if (gameContainer) gameContainer.style.display = "block";

    // Wire control buttons (defensive)
    if (stopBtn) {
      stopBtn.addEventListener("click", () => {
        pauseGame();
        showStopModal();
        // hide stop button while modal is up
        stopBtn.style.display = "none";
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        if (endModal) endModal.style.display = "none";
        // show stop button again
        if (stopBtn) stopBtn.style.display = "block";
        startGame();
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        endGame(false, true);
      });
    }

    if (againBtn) {
      againBtn.addEventListener("click", () => {
        // Reset game progress and restart fresh
        clearGameState();
        state = loadState(); // fresh defaults
        updateUIFromState();
        if (endModal) endModal.style.display = "none";
        if (stopBtn) stopBtn.style.display = "block";
        startGame();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // clear only login keys then go to menu
        localStorage.removeItem("studentName");
        localStorage.removeItem("studentClass");
        clearGameState();
        window.location.href = "../index.html";
      });
    }

    // --- Game logic functions ---

    function updateUIFromState() {
      if (scoreDisplay) scoreDisplay.textContent = `Score: ${state.score}`;
      if (levelDisplay) levelDisplay.textContent = `Level: ${state.level}`;
      updateBackground();
    }

    function updateBackground() {
      if (!background) return;
      const bgIndex = Math.min(state.level, 12);
      background.style.backgroundImage = `url('assets/background/background_${bgIndex}.png')`;
    }

    function updateFloatSpeed() {
      const lv = state.level;
      if ([1, 4, 7, 10].includes(lv)) floatSpeed = 30;
      else if ([2, 5, 8, 11].includes(lv)) floatSpeed = 20;
      else if ([3, 6, 9, 12].includes(lv)) floatSpeed = 10;
    }

    function updateThoughtBubble() {
      // pick a target that exists for chosen level
      state.targetColour = colours[Math.floor(Math.random() * colours.length)];
      const validNumbers = getValidNumbersForColour(state.targetColour)
        .filter((n) => getNumberRangeForLevel(state.level).includes(n));
      // fallback if none
      if (validNumbers.length === 0) {
        const fallback = getNumberRangeForLevel(state.level);
        state.targetNumber = fallback[Math.floor(Math.random() * fallback.length)];
      } else {
        state.targetNumber = validNumbers[Math.floor(Math.random() * validNumbers.length)];
      }

      // render bubble
      if (!thoughtBubble) return;
      thoughtBubble.innerHTML = "";
      const colourImg = document.createElement("img");
      colourImg.src = `assets/colour/${state.targetColour}.png`;
      colourImg.className = "sign-img";
      colourImg.alt = state.targetColour;
      colourImg.addEventListener("click", () => playSignVideo(state.targetColour, "colour"));

      const numberImg = document.createElement("img");
      numberImg.src = `assets/number/${state.targetNumber}.png`;
      numberImg.className = "sign-img";
      numberImg.alt = String(state.targetNumber);
      numberImg.addEventListener("click", () => playSignVideo(state.targetNumber, "number"));

      thoughtBubble.appendChild(colourImg);
      thoughtBubble.appendChild(numberImg);

      saveState(state);
    }

    function playSignVideo(value, type) {
      // Attempt to play a small inline MP4 if present (non-blocking)
      const path = `assets/${type}/${value}.mp4`;
      const video = document.createElement("video");
      video.src = path;
      video.autoplay = true;
      video.controls = false;
      video.style.position = "fixed";
      video.style.left = "50%";
      video.style.top = "50%";
      video.style.transform = "translate(-50%, -50%)";
      video.style.zIndex = 2000;
      video.muted = false;

      video.addEventListener("ended", () => video.remove());
      video.addEventListener("error", () => video.remove());

      document.body.appendChild(video);
    }

    function spawnBalloon() {
      // choose colour then a valid number for that colour at the current level
      const colour = colours[Math.floor(Math.random() * colours.length)];
      const validNumbers = getValidNumbersForColour(colour)
        .filter((n) => getNumberRangeForLevel(state.level).includes(n));
      if (validNumbers.length === 0) return; // nothing to spawn for this colour
      const number = validNumbers[Math.floor(Math.random() * validNumbers.length)];
      createBalloon(colour, number, false);
    }

    function spawnCorrectBalloon() {
      // ensure target exists
      if (state.targetColour == null || state.targetNumber == null) updateThoughtBubble();
      // If that balloon file might not exist (rare), attempt to verify: we'll still create it — browser will show broken image if missing.
      createBalloon(state.targetColour, state.targetNumber, true);
    }

    // floatBalloon increments bottom and removes when off-screen
    function floatBalloon(balloon) {
      let pos = -150;
      const interval = setInterval(() => {
        pos += 2;
        balloon.style.bottom = `${pos}px`;
        // remove after it goes well above the viewport
        if (pos > window.innerHeight + 100) {
          balloon.remove();
          clearInterval(interval);
        }
      }, floatSpeed);
      balloon.dataset.floatInterval = interval;
    }

    function createPopEffectAtRect(rect) {
      const pop = document.createElement("img");
      pop.src = "assets/pop.gif";
      pop.className = "pop-effect";
      // center the pop on the balloon
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height * 0.25; // top-ish
      pop.style.left = `${x}px`;
      pop.style.top = `${y}px`;
      pop.style.position = "absolute";
      pop.style.transform = "translate(-50%, -50%)";
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 550);
    }

    function createBalloon(colour, number, isCorrect) {
      const img = document.createElement("img");
      img.src = `assets/balloon/${colour}_${number}.png`;
      img.className = "balloon";
      img.dataset.colour = colour;
      img.dataset.number = number;
      img.dataset.correct = isCorrect ? "true" : "false";
      img.dataset.clicked = "false";

      // place horizontally inside the central 60% area (minX..maxX)
      const gameWidth = window.innerWidth;
      const minX = gameWidth * 0.15;
      const maxX = gameWidth * 0.75 - 120;
      const x = Math.random() * (maxX - minX) + minX;
      img.style.left = `${x}px`;
      img.style.bottom = `-150px`;

      // allow clicks
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        // prevent duplicate clicks
        if (img.dataset.clicked === "true") return;
        img.dataset.clicked = "true";

        state.totalClicks = (state.totalClicks || 0) + 1;

        const colourClicked = img.dataset.colour;
        const numberClicked = parseInt(img.dataset.number, 10);
        const answerKey = `${colourClicked}_${numberClicked}`;

        const isAnswer = colourClicked === state.targetColour && numberClicked === Number(state.targetNumber);

        if (isAnswer) {
          state.score = (state.score || 0) + 1;
          state.correctAnswers = (state.correctAnswers || 0) + 1;
          state.correctAnswersList = state.correctAnswersList || [];
          state.correctAnswersList.push(answerKey);
          state.collectedCount = (state.collectedCount || 0) + 1;

          if (scoreDisplay) scoreDisplay.textContent = `Score: ${state.score}`;
          if (levelDisplay) levelDisplay.textContent = `Level: ${state.level}`;

          // stop this balloon floating
          const intId = img.dataset.floatInterval;
          if (intId) clearInterval(intId);

          // move to collected area (right side)
          img.style.transition = "all 800ms ease";
          const offsetX = 100 + ((state.collectedCount - 1) % 10) * 30;
          const offsetY = 400 + Math.floor((state.collectedCount - 1) / 10) * 20;
          img.style.left = `calc(100% - ${offsetX}px)`;
          img.style.bottom = `${offsetY}px`;
          img.style.zIndex = 50;

          // gentle Mrs C animation
          if (mrsC) {
            mrsC.style.transition = "transform 250ms ease";
            mrsC.style.transform = "translateY(-8px)";
            setTimeout(() => (mrsC.style.transform = "translateY(0)"), 300);
          }

          // next target
          updateThoughtBubble();

          // level up conditions
          if (state.score % 10 === 0 && state.level < 12) {
            state.level++;
            state.collectedCount = 0;
            // clear existing floating balloons and restart with updated speed/background
            clearAllFloating();
            updateBackground();
            updateFloatSpeed();
            // small timeout so clear happens visibly then spawn restarts
            setTimeout(() => {
              saveState(state);
              startGame();
            }, 300);
          } else if (state.score >= 120) {
            // final completion
            saveState(state);
            endGame(true).then(() => {
              // after submit redirect to menu (keep login)
              clearGameState(); // wipe saved progress
              setTimeout(() => (window.location.href = "../index.html"), 700);
            });
          } else {
            saveState(state);
          }
        } else {
          // incorrect
          state.incorrectAnswersList = state.incorrectAnswersList || [];
          state.incorrectAnswersList.push(answerKey);
          consecutiveIncorrect++;
          if (consecutiveIncorrect >= 5) {
            showCarefulWarning();
            consecutiveIncorrect = 0;
          }
          // pop effect centered on the balloon rect
          const rect = img.getBoundingClientRect();
          createPopEffectAtRect(rect);
          img.remove();
          saveState(state);
        }
      });

      balloonArea.appendChild(img);
      floatBalloon(img);
    }

    function clearAllFloating() {
      // remove all balloon elements
      document.querySelectorAll(".balloon").forEach((b) => {
        try {
          const iid = b.dataset.floatInterval;
          if (iid) clearInterval(iid);
        } catch (e) {}
        b.remove();
      });
    }

    function pauseGame() {
      clearInterval(balloonInterval);
      clearInterval(correctBalloonInterval);
      balloonInterval = null;
      correctBalloonInterval = null;
    }

    function startGame() {
      // ensure no duplicate intervals
      pauseGame();
      updateFloatSpeed();
      // ensure we have a target
      if (!state.targetColour || !state.targetNumber) updateThoughtBubble();
      // spawn one immediately and then set intervals
      spawnBalloon();
      balloonInterval = setInterval(spawnBalloon, 1000);
      correctBalloonInterval = setInterval(spawnCorrectBalloon, 5000);
    }

    // Submit results to Google Form; returns Promise (resolves after small delay)
    function submitResultsToForm() {
      return new Promise((resolve) => {
        const percentage = state.totalClicks > 0 ? Math.round((state.correctAnswers / state.totalClicks) * 100) : 0;
        const correctList = (state.correctAnswersList || []).slice().sort().join(", ");
        const incorrectList = (state.incorrectAnswersList || []).slice().sort().join(", ");

        // Build and submit form
        const form = document.createElement("form");
        form.action = "https://docs.google.com/forms/d/e/1FAIpQLSeHCxQ4czHbx1Gdv649vlr5-Dz9-4DQu5M5OcIfC46WlL-6Qw/formResponse";
        form.method = "POST";
        form.target = "hidden_iframe";
        form.style.display = "none";

        const entries = {
          "entry.1609572894": studentName,
          "entry.1168342531": studentClass,
          "entry.91913727": state.score || 0,
          "entry.63569940": state.totalClicks || 0,
          "entry.1746910343": correctList,
          "entry.1748975026": incorrectList,
        };

        for (let key in entries) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = entries[key];
          form.appendChild(input);
        }

        const iframe = document.createElement("iframe");
        iframe.name = "hidden_iframe";
        iframe.style.display = "none";

        document.body.appendChild(iframe);
        document.body.appendChild(form);

        // submit and wait a short while
        form.submit();
        setTimeout(() => {
          resolve();
        }, 500);
      });
    }

   function endGame(showModal = true, redirectToMenu = false) {
  pauseGame();
  clearBalloons();

  // Submit to Google Form
  const form = document.createElement("form");
  form.action =
    "https://docs.google.com/forms/d/e/1FAIpQLSeHCxQ4czHbx1Gdv649vlr5-Dz9-4DQu5M5OcIfC46WlL-6Qw/formResponse";
  form.method = "POST";
  form.target = "hidden_iframe";
  form.style.display = "none";

  const entries = {
    "entry.1609572894": studentName,
    "entry.1168342531": studentClass,
    "entry.91913727": score,
    "entry.63569940": totalClicks,
    "entry.1746910343": correctAnswersList.sort().join(", "),
    "entry.1748975026": incorrectAnswersList.sort().join(", "),
  };

  for (let key in entries) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = entries[key];
    form.appendChild(input);
  }

  const iframe = document.createElement("iframe");
  iframe.name = "hidden_iframe";
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  document.body.appendChild(form);
  form.submit();

  if (showModal) {
    const percentage = totalClicks > 0 ? Math.round((correctAnswers / totalClicks) * 100) : 0;
    scoreDisplayModal.textContent = `Score: ${score} (${percentage}%)`;
    endModal.style.display = "flex";
  }

  if (redirectToMenu) {
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 500); // allow form submission time
  }
}


    function showStopModal() {
      // update modal score and show appropriate buttons (not final)
      const percentage = state.totalClicks > 0 ? Math.round((state.correctAnswers / state.totalClicks) * 100) : 0;
      if (scoreDisplayModal) scoreDisplayModal.textContent = `Score: ${state.score || 0} (${percentage}%)`;

      // Continue + Finish + Again + Logout visible for paused state
      if (continueBtn) continueBtn.style.display = "inline-block";
      if (finishBtn) finishBtn.style.display = "inline-block";
      if (againBtn) againBtn.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "inline-block";

      if (endModal) endModal.style.display = "flex";
    }

    // --- Restore saved state and start ---
    // Ensure required fields exist
    if (!scoreDisplay || !levelDisplay || !balloonArea) {
      console.error("Required DOM elements missing (score/level/balloonArea). Aborting game start.");
      return;
    }

    // Apply loaded state to UI
    updateUIFromState();

    // If there's saved progress, resume; otherwise first time
    // We resume regardless; startGame() will re-create flow.
    startGame();
  }); // DOMContentLoaded end
})(); // IIFE end
