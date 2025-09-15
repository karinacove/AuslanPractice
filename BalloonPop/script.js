// script.js - corrected startup + pause/resume + submission

(() => {
  // --- Login / UI references (outside DOMContentLoaded for immediate check) ---
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
    // DOM refs
    const balloonArea = document.getElementById("balloon-area");
    const scoreDisplay = document.getElementById("score");
    const levelDisplay = document.getElementById("level");
    const thoughtBubble = document.getElementById("thought-bubble");
    const background = document.getElementById("background");
    const mrsC = document.getElementById("mrs-c");

    // Game state
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

    // Persistence
    const SAVE_KEY = "bp_game_state_v1";
    function saveState() {
      const state = {
        score, totalClicks, correctAnswers, correctAnswersList, incorrectAnswersList,
        level, targetColour, targetNumber, collectedCount, floatSpeed, gameCompleted
      };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e){}
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
    function clearSavedState() { localStorage.removeItem(SAVE_KEY); }

    // Valid number generation
    function getNumberRangeForLevel(lvl) {
      if (lvl >= 1 && lvl <= 3) return Array.from({length:12}, (_,i)=>i+1);   // 1-12
      if (lvl >= 4 && lvl <= 6) return Array.from({length:8}, (_,i)=>i+13);   // 13-20
      if (lvl >= 7 && lvl <= 9) return Array.from({length:21}, (_,i)=>i+20);  // 21-40
      if (lvl >= 10 && lvl <= 12) return Array.from({length:60}, (_,i)=>i+41);// 41-100
      return Array.from({length:100}, (_,i)=>i+1);
    }

    function getValidNumbersForColour(colour) {
      const base = Array.from({length:41}, (_,i)=>i); // 0..40
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

    function updateBackground() {
      const bgIndex = Math.min(level, 12);
      if (background) background.style.backgroundImage = `url('assets/background/background_${bgIndex}.png')`;
    }

    function updateThoughtBubble(forceNew=false) {
      if (!targetColour || forceNew) targetColour = colours[Math.floor(Math.random()*colours.length)];
      const valid = getValidNumbersForColour(targetColour).filter(n => getNumberRangeForLevel(level).includes(n));
      if (!valid.length) {
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
      document.querySelectorAll(".balloon").forEach(b => {
        try { clearInterval(Number(b.dataset.floatInterval)); } catch(e){}
        b.remove();
      });
      document.querySelectorAll(".pop-effect").forEach(p => p.remove());
    }

    // Pop visual helper
    function createPopEffectAtRect(rect) {
      const pop = document.createElement("img");
      pop.src = "assets/pop.gif";
      pop.className = "pop-effect";
      const size = 200; // px
      pop.style.width = `${size}px`;
      pop.style.position = "absolute";
      pop.style.left = `${rect.left + rect.width/2 - size/2}px`;
      pop.style.top = `${rect.top + rect.height*0.25 - size/2}px`;
      pop.style.zIndex = 9999;
      document.body.appendChild(pop);
      setTimeout(()=>pop.remove(), 600);
    }

    function floatBalloon(balloon) {
      // start float interval for a balloon
      let pos = parseInt(balloon.style.bottom, 10) || -150;
      try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
      const interval = setInterval(()=> {
        pos += 2;
        balloon.style.bottom = `${pos}px`;
        if (pos > window.innerHeight + 100) {
          clearInterval(interval);
          if (balloon.parentElement) balloon.remove();
        }
      }, floatSpeed);
      balloon.dataset.floatInterval = interval;
    }

    function createBalloon(colour, number, isCorrect) {
      // defence: only create if that asset is expected to exist for that colour
      const validForColour = getValidNumbersForColour(colour);
      if (!validForColour.includes(Number(number))) return;

      const balloon = document.createElement("img");
      balloon.src = `assets/balloon/${colour}_${number}.png`;
      balloon.className = "balloon";
      balloon.dataset.colour = colour;
      balloon.dataset.number = String(number);
      balloon.dataset.correct = isCorrect ? "true" : "false";
      balloon.dataset.clicked = "false";

      const gameWidth = window.innerWidth;
      const minX = gameWidth * 0.15;
      const maxX = gameWidth * 0.75 - 120;
      const x = Math.random() * (maxX - minX) + minX;
      balloon.style.left = `${x}px`;
      balloon.style.bottom = `-150px`;

      balloon.addEventListener("click", (e) => {
        e.stopPropagation();
        if (gamePaused || gameCompleted) return;
        if (balloon.dataset.clicked === "true") return;
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
          if (!correctAnswersList.includes(answerKey)) correctAnswersList.push(answerKey);
          scoreDisplay.textContent = `Score: ${score}`;
          try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
          moveToCollected(balloon);
          animateMrsC();
          if (score % 10 === 0 && level < 12) {
            level++;
            levelDisplay.textContent = `Level: ${level}`;
            collectedCount = 0;
            clearBalloons();
            updateBackground();
            updateFloatSpeed();
            restartIntervals();
            updateThoughtBubble(true);
          } else if (score === 120) {
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
          const rect = balloon.getBoundingClientRect();
          createPopEffectAtRect(rect);
          try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
          balloon.remove();
          saveState();
        }
        saveState();
      });

      balloonArea.appendChild(balloon);
      floatBalloon(balloon);
    }

    function moveToCollected(balloon) {
      try { clearInterval(Number(balloon.dataset.floatInterval)); } catch(e){}
      balloon.style.transition = "all 700ms ease";
      const offsetX = 100 + (collectedCount % 10) * 30;
      const offsetY = 400;
      balloon.style.left = `calc(100% - ${offsetX}px)`;
      balloon.style.bottom = `${offsetY}px`;
      balloon.style.zIndex = 50;
      collectedCount++;
      saveState();
    }

    function animateMrsC() {
      if (!mrsC) return;
      mrsC.style.transition = "transform 0.25s ease";
      mrsC.style.transform = "translateY(-10px)";
      setTimeout(()=> mrsC.style.transform = "translateY(0)", 250);
    }

    function restartIntervals() {
      clearInterval(balloonInterval); clearInterval(correctBalloonInterval);
      balloonInterval = setInterval(spawnBalloon, 1000);
      correctBalloonInterval = setInterval(spawnCorrectBalloon, 5000);
    }

    function spawnBalloon() {
      if (gamePaused || gameCompleted) return;
      const colour = colours[Math.floor(Math.random()*colours.length)];
      const validNumbers = getValidNumbersForColour(colour).filter(n => getNumberRangeForLevel(level).includes(n));
      if (!validNumbers.length) return;
      const number = validNumbers[Math.floor(Math.random()*validNumbers.length)];
      createBalloon(colour, number, false);
    }

    function spawnCorrectBalloon() {
      if (gamePaused || gameCompleted) return;
      const valid = getValidNumbersForColour(targetColour).filter(n => getNumberRangeForLevel(level).includes(n));
      if (!valid.length) { updateThoughtBubble(true); return; }
      createBalloon(targetColour, targetNumber, true);
    }

    function pauseGame() {
      gamePaused = true;
      clearInterval(balloonInterval); clearInterval(correctBalloonInterval);
      balloonInterval = null; correctBalloonInterval = null;
      // stop floats
      document.querySelectorAll(".balloon").forEach(b => {
        try { clearInterval(Number(b.dataset.floatInterval)); } catch(e){}
      });
    }

    function resumeGame() {
      if (!gamePaused) {
        // if intervals not running, start them
        if (!balloonInterval && !correctBalloonInterval && !gameCompleted) restartIntervals();
        // restart floating for existing balloons
        document.querySelectorAll(".balloon").forEach(b => {
          // if no float currently, restart
          floatBalloon(b);
        });
        return;
      }
      gamePaused = false;
      // restart floating for existing balloons
      document.querySelectorAll(".balloon").forEach(b => floatBalloon(b));
      restartIntervals();
    }

    // --- Careful warning ---
    function showCarefulWarning() {
      const warning = document.createElement('img');
      warning.src = "assets/careful.png";
      warning.className = "careful-warning";
      warning.style.position = "fixed";
      warning.style.left = "50%";
      warning.style.top = "50%";
      warning.style.transform = "translate(-50%, -50%)";
      warning.style.zIndex = 1000;
      document.body.appendChild(warning);
      setTimeout(()=>warning.remove(), 1400);
    }

    // --- End game & submit (options)
// --- End game & submit (options)
function endGame({ completed=false, showModal=true, redirectAfter=false } = {}) {
  pauseGame();
  clearBalloons(); // only clears at *end* of game

  const percentage = totalClicks > 0 ? Math.round((correctAnswers/totalClicks)*100) : 0;
  const correctList = [...correctAnswersList].sort().join(", ");
  const incorrectList = [...incorrectAnswersList].sort().join(", ");

  if (scoreDisplayModal) scoreDisplayModal.textContent = `Score: ${score} (${percentage}%)`;

  if (completed) {
    // add clap gif in modal (remove previous)
    const old = document.getElementById("clap-gif");
    if (old) old.remove();
    if (endModal) {
      const gif = document.createElement("img");
      gif.id = "clap-gif";
      gif.src = clapGifSrc;
      gif.alt = "Congratulations!";
      gif.style.width = "220px";
      gif.style.display = "block";
      gif.style.margin = "8px auto";
      endModal.prepend(gif);
    }
  }

  // silent Google Form submit
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

  // show modal
  if (endModal) {
    if (completed && continueBtn) continueBtn.style.display = "none";
    else if (continueBtn) continueBtn.style.display = "inline-block";
    if (showModal) endModal.style.display = "flex";
  }

  if (redirectAfter) {
    setTimeout(()=> {
      clearSavedState();
      window.location.href = "../index.html";
    }, 600);
  } else {
    saveState();
  }
}

// --- UI button handlers ---
if (stopBtn) stopBtn.addEventListener("click", () => {
  pauseGame();
  const pct = totalClicks > 0 ? Math.round((correctAnswers/totalClicks)*100) : 0;
  if (scoreDisplayModal) scoreDisplayModal.textContent = `Score: ${score} (${pct}%)`;
  if (continueBtn) continueBtn.style.display = gameCompleted ? "none" : "inline-block";
  if (endModal) endModal.style.display = "flex";
});

if (continueBtn) continueBtn.addEventListener("click", () => {
  if (endModal) endModal.style.display = "none";
  resumeGame(); // balloons keep floating
});

if (finishBtn) finishBtn.addEventListener("click", () => {
  endGame({ completed: false, showModal: false, redirectAfter: true });
});

if (againBtn) againBtn.addEventListener("click", () => {
  if (endModal) endModal.style.display = "none";
  pauseGame();
  clearBalloons();
  // reset game state (keep login)
  score = 0; totalClicks = 0; correctAnswers = 0;
  correctAnswersList = []; incorrectAnswersList = [];
  level = 1; targetColour = ""; targetNumber = "";
  collectedCount = 0; consecutiveIncorrect = 0; gameCompleted = false;
  scoreDisplay.textContent = `Score: ${score}`;
  levelDisplay.textContent = `Level: ${level}`;
  updateBackground();
  updateThoughtBubble(true);
  saveState();
  startGame();
});

    // --- Start/resume helpers ---
    function startGame() {
      gamePaused = false;
      updateFloatSpeed();
      updateThoughtBubble(!targetColour || !targetNumber);
      // spawn one immediately then intervals
      spawnBalloon();
      restartIntervals();
      // update displays
      scoreDisplay.textContent = `Score: ${score}`;
      levelDisplay.textContent = `Level: ${level}`;
    }

    // --- Initialization ---
    const restored = loadState();
    scoreDisplay.textContent = `Score: ${score}`;
    levelDisplay.textContent = `Level: ${level}`;
    updateBackground();
    if (!targetColour || !targetNumber) updateThoughtBubble(true);
    // Start the game properly
    startGame();
  }); // DOMContentLoaded
})(); // IIFE
