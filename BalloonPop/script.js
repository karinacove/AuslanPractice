// script.js - Balloon Pop (full updated)

(() => {
  // --- Login / UI references (outside DOMContent for immediate access)
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  const studentInfoDiv = document.getElementById("student-info");
  const gameContainer = document.getElementById("game-container");
  const stopBtn = document.getElementById("stop-btn");
  const endModal = document.getElementById("end-modal");
  const scoreDisplayModal = document.getElementById("score-display");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const againBtn = document.getElementById("again-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const clapGifSrc = "assets/auslan-clap.gif";

  if (!studentName || !studentClass) {
    alert("Please log in first.");
    window.location.href = "../index.html";
    return;
  } else {
    if (studentInfoDiv) studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
    if (gameContainer) gameContainer.style.display = "block";
  }

  document.addEventListener("DOMContentLoaded", () => {
    // --- DOM references ---
    const balloonArea = document.getElementById("balloon-area");
    const scoreDisplay = document.getElementById("score");
    const levelDisplay = document.getElementById("level");
    const thoughtBubble = document.getElementById("thought-bubble");
    const background = document.getElementById("background");
    const mrsC = document.getElementById("mrs-c");

    // --- Game state variables ---
    let score = 0;
    let totalClicks = 0;
    let correctAnswers = 0;
    let correctAnswersList = [];
    let incorrectAnswersList = [];
    let level = 1;
    let targetColour = "";
    let targetNumber = "";
    let collectedCount = 0;
    let floatSpeed = 30;
    let balloonInterval = null;
    let correctBalloonInterval = null;
    let consecutiveIncorrect = 0;
    let gamePaused = false;
    let gameCompleted = false;

    const colours = ["green","red","orange","yellow","purple","pink","blue","brown","black","white"];

    // --- Persist / Restore state ---
    const SAVE_KEY = "bp_game_state_v1";

    function saveState() {
      const state = {
        score, totalClicks, correctAnswers, correctAnswersList, incorrectAnswersList,
        level, targetColour, targetNumber, collectedCount, floatSpeed, gameCompleted
      };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e){ /* ignore */ }
    }
    function clearSavedState() {
      localStorage.removeItem(SAVE_KEY);
    }
    function loadState() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const s = JSON.parse(raw);
        score = s.score || 0;
        totalClicks = s.totalClicks || 0;
        correctAnswers = s.correctAnswers || 0;
        correctAnswersList = s.correctAnswersList || [];
        incorrectAnswersList = s.incorrectAnswersList || [];
        level = s.level || 1;
        targetColour = s.targetColour || "";
        targetNumber = s.targetNumber || "";
        collectedCount = s.collectedCount || 0;
        floatSpeed = s.floatSpeed || floatSpeed;
        gameCompleted = !!s.gameCompleted;
        return true;
      } catch(e) { return false; }
    }

    // --- Helper functions ---
    function getNumberRangeForLevel(lvl) {
      if (lvl >= 1 && lvl <= 3) return Array.from({length:12}, (_,i) => i+1);   // 1-12
      if (lvl >= 4 && lvl <= 6) return Array.from({length:8}, (_,i) => i+13);   // 13-20
      if (lvl >= 7 && lvl <= 9) return Array.from({length:21}, (_,i) => i+20);  // 21-40
      if (lvl >= 10 && lvl <= 12) return Array.from({length:60}, (_,i) => i+41); // 41-100
      return Array.from({length:100}, (_,i) => i+1);
    }

    function getValidNumbersForColour(colour) {
      // base 0-40 exist for all; beyond that some colours skip (we cover by offsets + step 4)
      const base = Array.from({length:41}, (_,i) => i); // 0..40
      const offsets = {
        green: 41, red: 41, orange: 43, yellow: 42, purple: 43,
        pink: 44, blue: 44, brown: 42, black: 44, white: 43
      };
      const start = offsets[colour];
      const extra = [];
      if (start !== undefined) {
        for (let n = start; n <= 100; n += 4) extra.push(n);
      }
      return base.concat(extra);
    }

    function updateFloatSpeed() {
      if ([1,4,7,10].includes(level)) floatSpeed = 30;
      else if ([2,5,8,11].includes(level)) floatSpeed = 20;
      else if ([3,6,9,12].includes(level)) floatSpeed = 10;
    }

    function updateThoughtBubble(forceNew=false) {
      // choose a valid targetColour/targetNumber for current level
      if (!targetColour || forceNew) targetColour = colours[Math.floor(Math.random()*colours.length)];
      const valid = getValidNumbersForColour(targetColour).filter(n => getNumberRangeForLevel(level).includes(n));
      if (!valid.length) {
        // fallback to level-wide numbers
        const fallback = getNumberRangeForLevel(level);
        targetNumber = fallback[Math.floor(Math.random()*fallback.length)];
      } else {
        targetNumber = valid[Math.floor(Math.random()*valid.length)];
      }

      thoughtBubble.innerHTML = "";
      const cImg = document.createElement("img");
      cImg.src = `assets/colour/${targetColour}.png`;
      cImg.className = "sign-img";
      const nImg = document.createElement("img");
      nImg.src = `assets/number/${targetNumber}.png`;
      nImg.className = "sign-img";
      thoughtBubble.appendChild(cImg);
      thoughtBubble.appendChild(nImg);

      saveState();
    }

    function clearBalloons() {
      // remove existing balloons and pop-effects
      document.querySelectorAll(".balloon").forEach(b => b.remove());
      document.querySelectorAll(".pop-effect").forEach(p => p.remove());
    }

    function spawnBalloon() {
      if (gamePaused || gameCompleted) return;
      const colour = colours[Math.floor(Math.random()*colours.length)];
      const validNumbers = getValidNumbersForColour(colour).filter(n => getNumberRangeForLevel(level).includes(n));
      if (!validNumbers.length) return; // defensive
      const number = validNumbers[Math.floor(Math.random()*validNumbers.length)];
      createBalloon(colour, number, false);
    }

    function spawnCorrectBalloon() {
      if (gamePaused || gameCompleted) return;
      // ensure target exists (defensive)
      const valid = getValidNumbersForColour(targetColour).filter(n => getNumberRangeForLevel(level).includes(n));
      if (!valid.length) {
        updateThoughtBubble(true);
      }
      createBalloon(targetColour, targetNumber, true);
    }

    function floatBalloon(balloon) {
      let pos = -150;
      // clear existing interval property if present
      if (balloon.dataset.floatInterval) {
        try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
      }
      const interval = setInterval(() => {
        pos += 2;
        balloon.style.bottom = `${pos}px`;
        // If the balloon floats past top of viewport remove it
        if (pos > window.innerHeight + 100) {
          clearInterval(interval);
          if (balloon.parentElement) balloon.remove();
        }
      }, floatSpeed);
      balloon.dataset.floatInterval = interval;
    }

    function createPopEffectAtRect(rect) {
      const pop = document.createElement("img");
      pop.src = "assets/pop.gif";
      pop.className = "pop-effect";
      // center horizontally, slightly towards top vertically
      const size = 200; // visible size
      pop.style.width = `${size}px`;
      pop.style.left = `${rect.left + rect.width/2 - size/2}px`;
      pop.style.top = `${rect.top + rect.height*0.25 - size/2}px`;
      pop.style.position = "absolute";
      pop.style.zIndex = 9999;
      document.body.appendChild(pop);
      setTimeout(() => { pop.remove(); }, 600);
    }

    function createBalloon(colour, number, isCorrect) {
      // Defensive: ensure file exists by checking the valid numbers for that colour/level
      const validForColour = getValidNumbersForColour(colour);
      if (!validForColour.includes(Number(number))) {
        // don't create non-existing image
        return;
      }

      const balloon = document.createElement("img");
      balloon.src = `assets/balloon/${colour}_${number}.png`;
      balloon.className = "balloon";
      balloon.dataset.colour = colour;
      balloon.dataset.number = String(number);
      balloon.dataset.correct = isCorrect ? "true" : "false";
      balloon.dataset.clicked = "false";

      // position inside safe central horizontal band (not on edges)
      const gameWidth = window.innerWidth;
      const minX = gameWidth * 0.15;
      const maxX = gameWidth * 0.75 - 120;
      const x = Math.random() * (maxX - minX) + minX;
      balloon.style.left = `${x}px`;
      balloon.style.bottom = `-150px`;

      balloon.addEventListener("click", (e) => {
        e.stopPropagation();
        if (gamePaused || gameCompleted) return;
        if (balloon.dataset.clicked === "true") return; // prevent duplicates
        balloon.dataset.clicked = "true";
        totalClicks++;

        const colourClicked = balloon.dataset.colour;
        const numberClicked = parseInt(balloon.dataset.number, 10);
        const answerKey = `${colourClicked}_${numberClicked}`;

        if (colourClicked === targetColour && numberClicked === Number(targetNumber)) {
          // correct
          score++;
          correctAnswers++;
          consecutiveIncorrect = 0;
          // avoid duplicates in correct list if by chance
          if (!correctAnswersList.includes(answerKey)) correctAnswersList.push(answerKey);
          scoreDisplay.textContent = `Score: ${score}`;
          // stop floating
          try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
          moveToCollected(balloon);
          animateMrsC();
          // level increment / next level handling
          if (score % 10 === 0 && level < 12) {
            level++;
            levelDisplay.textContent = `Level: ${level}`;
            collectedCount = 0;
            clearBalloons();
            updateBackground();
            updateFloatSpeed();
            // restart intervals to apply speeds
            restartIntervals();
            updateThoughtBubble(true);
          } else if (score === 120) {
            // completed game
            gameCompleted = true;
            endGame({ completed: true, showModal: true, redirectAfter: false });
          } else {
            updateThoughtBubble(true);
          }
        } else {
          // incorrect
          if (!incorrectAnswersList.includes(answerKey)) incorrectAnswersList.push(answerKey);
          consecutiveIncorrect++;
          if (consecutiveIncorrect >= 5) {
            showCarefulWarning();
            consecutiveIncorrect = 0;
          }
          // pop at balloon rect
          const rect = balloon.getBoundingClientRect();
          createPopEffectAtRect(rect);
          try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
          balloon.remove();
          saveState();
        }

        // save state after each click
        saveState();
      });

      balloonArea.appendChild(balloon);
      floatBalloon(balloon);
    }

    function moveToCollected(balloon) {
      // Make the balloon move to hold area near Mrs C and stop floating
      try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
      balloon.style.transition = "all 700ms ease";
      const offsetX = 100 + (collectedCount % 10) * 30;
      const offsetY = 400;
      balloon.style.left = `calc(100% - ${offsetX}px)`;
      balloon.style.bottom = `${offsetY}px`;
      balloon.style.zIndex = 50;
      balloon.removeEventListener("click", () => {});
      collectedCount++;
      saveState();
    }

    function animateMrsC() {
      if (!mrsC) return;
      mrsC.style.transition = "transform 0.25s ease";
      mrsC.style.transform = "translateY(-10px)";
      setTimeout(() => mrsC.style.transform = "translateY(0)", 250);
    }

    // --- Interval control ---
    function restartIntervals() {
      // clear previous then start fresh
      clearInterval(balloonInterval); clearInterval(correctBalloonInterval);
      balloonInterval = setInterval(spawnBalloon, 1000);
      correctBalloonInterval = setInterval(spawnCorrectBalloon, 5000);
    }

    function pauseGame() {
      gamePaused = true;
      clearInterval(balloonInterval);
      clearInterval(correctBalloonInterval);
      balloonInterval = null; correctBalloonInterval = null;
      // pause existing balloons by clearing their intervals (they will stop moving)
      document.querySelectorAll(".balloon").forEach(b => {
        try { clearInterval(Number(b.dataset.floatInterval)); } catch(e){}
      });
    }

    function resumeGame() {
      if (!gamePaused) return;
      gamePaused = false;
      // re-start floating - existing balloons need their float restarted
      document.querySelectorAll(".balloon").forEach(b => floatBalloon(b));
      restartIntervals();
    }

    // --- Endgame & submission ---
    // options: { completed:bool, showModal:bool, redirectAfter:bool }
    function endGame({ completed=false, showModal=true, redirectAfter=false } = {}) {
      pauseGame();
      clearBalloons();

      const percentage = totalClicks > 0 ? Math.round((correctAnswers/totalClicks)*100) : 0;
      const correctList = [...correctAnswersList].sort().join(", ");
      const incorrectList = [...incorrectAnswersList].sort().join(", ");

      // Update modal display
      if (scoreDisplayModal) scoreDisplayModal.textContent = `Score: ${score} (${percentage}%)`;

      // If completed show clap gif (insert into modal)
      if (completed) {
        const gif = document.createElement("img");
        gif.src = clapGifSrc;
        gif.alt = "Well done!";
        gif.style.width = "220px";
        gif.style.display = "block";
        gif.style.margin = "10px auto";
        // remove previous claps if any
        const old = document.getElementById("clap-gif");
        if (old) old.remove();
        gif.id = "clap-gif";
        if (endModal) endModal.prepend(gif);
      }

      // Submit results to Google Form (silently)
      const form = document.createElement("form");
      form.action = "https://docs.google.com/forms/d/e/1FAIpQLSeHCxQ4czHbx1Gdv649vlr5-Dz9-4DQu5M5OcIfC46WlL-6Qw/formResponse";
      form.method = "POST";
      form.target = "hidden_iframe";
      form.style.display = "none";

      const entries = {
        "entry.1609572894": studentName,
        "entry.1168342531": studentClass,
        "entry.91913727": score,
        "entry.63569940": totalClicks,
        "entry.1746910343": correctList,
        "entry.1748975026": incorrectList
      };

      for (let k in entries) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = entries[k];
        form.appendChild(input);
      }

      const iframe = document.createElement("iframe");
      iframe.name = "hidden_iframe";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();

      // show modal if requested
      if (showModal && endModal) {
        // hide continue if completed (no continue after completion)
        if (completed && continueBtn) continueBtn.style.display = "none";
        else if (continueBtn) continueBtn.style.display = "inline-block";

        // show modal
        endModal.style.display = "flex";
      }

      // clear saved game progress if redirectAfter true (we're leaving)
      if (redirectAfter) {
        // wait a little while to allow form submit
        setTimeout(() => {
          clearSavedState(); // preserve login info, remove only game state
          window.location.href = "../index.html";
        }, 600);
      } else {
        // save state (server submission done)
        saveState();
      }
    }

    // --- UI Control (stop/finish/again/continue/logout) ---
    if (stopBtn) {
      stopBtn.addEventListener("click", () => {
        pauseGame();
        // prepare modal data
        const pct = totalClicks > 0 ? Math.round((correctAnswers/totalClicks)*100) : 0;
        if (scoreDisplayModal) scoreDisplayModal.textContent = `Score: ${score} (${pct}%)`;
        // ensure continue visible (unless game complete)
        if (continueBtn) continueBtn.style.display = gameCompleted ? "none" : "inline-block";
        if (endModal) endModal.style.display = "flex";
      });
    }
    if (continueBtn) continueBtn.addEventListener("click", () => {
      // hide modal, resume
      if (endModal) endModal.style.display = "none";
      resumeGame();
    });

    // Finish button: submit and redirect back to menu; do NOT clear login info
    if (finishBtn) finishBtn.addEventListener("click", () => {
      // submit and redirect
      endGame({ completed: false, showModal: false, redirectAfter: true });
    });

    // Again: reset the game and hide modal (do NOT submit)
    if (againBtn) againBtn.addEventListener("click", () => {
      // hide modal
      if (endModal) endModal.style.display = "none";
      // clear any intervals and balloons
      pauseGame();
      clearBalloons();

      // reset game variables but keep login
      score = 0; totalClicks = 0; correctAnswers = 0;
      correctAnswersList = []; incorrectAnswersList = [];
      level = 1; targetColour = ""; targetNumber = "";
      collectedCount = 0; consecutiveIncorrect = 0; gameCompleted = false;
      scoreDisplay.textContent = `Score: ${score}`;
      levelDisplay.textContent = `Level: ${level}`;
      updateBackground();
      updateThoughtBubble(true);
      saveState();
      resumeGame();
    });

    // Logout: clear login and go to index
    if (logoutBtn) logoutBtn.addEventListener("click", () => {
      // clear only login keys and saved game
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentClass");
      clearSavedState();
      window.location.href = "../index.html";
    });

    // --- Background / UI helpers ---
    function updateBackground() {
      const bgIndex = Math.min(level, 12);
      if (background) background.style.backgroundImage = `url('assets/background/background_${bgIndex}.png')`;
    }

    // --- Initialization: restore saved state (if any) then start ---
    const restored = loadState();
    // update UI from state (if restored) or defaults
    scoreDisplay.textContent = `Score: ${score}`;
    levelDisplay.textContent = `Level: ${level}`;
    updateBackground();

    if (!targetColour || !targetNumber) updateThoughtBubble(true);

    // Start or resume intervals (avoid duplicate intervals)
    resumeGame();
  }); // end DOMContentLoaded
})(); // end IIFE
