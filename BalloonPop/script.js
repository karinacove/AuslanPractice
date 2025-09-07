let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const stopBtn = document.getElementById("finish-btn"); // Top-right button now Stop

const endModal = document.getElementById("end-modal");
const scoreDisplayModal = document.getElementById("score-display");
const continueBtn = document.getElementById("continue-btn");
const againBtn = document.getElementById("again-btn");
const finishBtnModal = document.getElementById("finish-btn-modal"); // Finish inside modal
const logoutBtn = document.getElementById("logout-btn");

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  if (studentInfoDiv) studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  if (gameContainer) gameContainer.style.display = "block";
}

document.addEventListener('DOMContentLoaded', () => {
  const balloonArea = document.getElementById('balloon-area');
  const scoreDisplay = document.getElementById('score');
  const levelDisplay = document.getElementById('level');
  const thoughtBubble = document.getElementById('thought-bubble');
  const background = document.getElementById('background');
  const mrsC = document.getElementById('mrs-c');

  let score = 0;
  let totalClicks = 0;
  let correctAnswers = 0;
  let correctAnswersList = [];
  let incorrectAnswersList = [];
  let level = 1;
  let targetColour = '';
  let targetNumber = '';
  let collectedCount = 0;
  let floatSpeed = 30;
  let balloonInterval, correctBalloonInterval;
  let consecutiveIncorrect = 0;
  let gameEnded = false;

  const colours = ['green', 'red', 'orange', 'yellow', 'purple', 'pink', 'blue', 'brown', 'black', 'white'];

  // ================= Utility Functions =================
  function showCarefulWarning() {
    const warning = document.createElement('img');
    warning.src = 'assets/careful.png';
    warning.classList.add('careful-warning');
    warning.style.position = 'fixed';
    warning.style.left = '50%';
    warning.style.top = '50%';
    warning.style.transform = 'translate(-50%, -50%)';
    warning.style.zIndex = 1000;
    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 1500);
  }

  function getNumberRangeForLevel(level) {
    if (level >= 1 && level <= 3) return Array.from({ length: 12 }, (_, i) => i + 1);
    if (level >= 4 && level <= 6) return Array.from({ length: 8 }, (_, i) => i + 13);
    if (level >= 7 && level <= 9) return Array.from({ length: 21 }, (_, i) => i + 20);
    if (level >= 10 && level <= 12) return Array.from({ length: 60 }, (_, i) => i + 41);
    if (level >= 13 && level <= 15) return Array.from({ length: 100 }, (_, i) => i + 1);
    return [];
  }

  function getValidNumbersForColour(colour) {
    const baseNumbers = Array.from({ length: 41 }, (_, i) => i);
    const colourOffsets = { green: 41, red: 41, orange: 43, yellow: 42, purple: 43, pink: 44, blue: 44, brown: 42, black: 44, white: 43 };
    let extendedNumbers = [];
    const start = colourOffsets[colour];
    if (start !== undefined) for (let i = start; i <= 100; i += 4) extendedNumbers.push(i);
    return baseNumbers.concat(extendedNumbers);
  }

  function updateFloatSpeed() {
    if ([1, 4, 7, 10].includes(level)) floatSpeed = 30;
    else if ([2, 5, 8, 11].includes(level)) floatSpeed = 20;
    else if ([3, 6, 9, 12].includes(level)) floatSpeed = 10;
  }

  function updateBackground() {
    const bgIndex = Math.min(level, 12);
    background.style.backgroundImage = `url('assets/background/background_${bgIndex}.png')`;
  }

  function updateThoughtBubble() {
    targetColour = colours[Math.floor(Math.random() * colours.length)];
    const validNumbers = getValidNumbersForColour(targetColour)
      .filter(n => getNumberRangeForLevel(level).includes(n));
    targetNumber = validNumbers[Math.floor(Math.random() * validNumbers.length)];

    thoughtBubble.innerHTML = '';
    const colourImg = document.createElement('img');
    colourImg.src = `assets/colour/${targetColour}.png`;
    colourImg.classList.add('sign-img');
    colourImg.addEventListener('click', () => playSignVideo(targetColour, 'colour'));

    const numberImg = document.createElement('img');
    numberImg.src = `assets/number/${targetNumber}.png`;
    numberImg.classList.add('sign-img');
    numberImg.addEventListener('click', () => playSignVideo(targetNumber, 'number'));

    thoughtBubble.appendChild(colourImg);
    thoughtBubble.appendChild(numberImg);
  }

  function startGame() {
    updateFloatSpeed();
    updateThoughtBubble();
    spawnBalloon();
    balloonInterval = setInterval(spawnBalloon, 1000);
    correctBalloonInterval = setInterval(spawnCorrectBalloon, 5000);
  }

  function pauseGame() {
    clearInterval(balloonInterval);
    clearInterval(correctBalloonInterval);
  }

  function clearAllFloating() {
    document.querySelectorAll('.balloon').forEach(b => b.remove());
  }

  function spawnBalloon() {
    const colour = colours[Math.floor(Math.random() * colours.length)];
    const validNumbers = getValidNumbersForColour(colour)
      .filter(n => getNumberRangeForLevel(level).includes(n));
    const number = validNumbers[Math.floor(Math.random() * validNumbers.length)];
    createBalloon(colour, number, false);
  }

  function spawnCorrectBalloon() {
    createBalloon(targetColour, targetNumber, true);
  }

  function createBalloon(colour, number, isCorrect) {
    const balloon = document.createElement('img');
    balloon.src = `assets/balloon/${colour}_${number}.png`;
    balloon.classList.add('balloon');
    balloon.dataset.colour = colour;
    balloon.dataset.number = number;
    balloon.dataset.correct = isCorrect;
    balloon.dataset.clicked = 'false';

    const gameWidth = window.innerWidth;
    const minX = gameWidth * 0.15;
    const maxX = gameWidth * 0.75 - 120;
    const x = Math.random() * (maxX - minX) + minX;
    balloon.style.left = `${x}px`;
    balloon.style.bottom = `-150px`;

    balloon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (balloon.dataset.clicked === 'true') return;
      balloon.dataset.clicked = 'true';
      totalClicks++;

      const colourClicked = balloon.dataset.colour;
      const numberClicked = parseInt(balloon.dataset.number);
      const answerKey = `${colourClicked}_${numberClicked}`;

      if (colourClicked === targetColour && numberClicked === targetNumber) {
        score++;
        correctAnswers++;
        consecutiveIncorrect = 0;
        correctAnswersList.push(answerKey);
        scoreDisplay.textContent = `Score: ${score}`;
        moveToCollected(balloon);
        animateMrsC();
        updateThoughtBubble();

        if (score % 10 === 0 && level < 12) {
          level++;
          levelDisplay.textContent = `Level: ${level}`;
          collectedCount = 0;
          clearAllFloating();
          updateBackground();
          updateFloatSpeed();
          pauseGame();
          startGame();
        } else if (score === 120) {
          endGame(false); // all levels completed → no continue button
        }
      } else {
        incorrectAnswersList.push(answerKey);
        consecutiveIncorrect++;
        if (consecutiveIncorrect >= 5) {
          showCarefulWarning();
          consecutiveIncorrect = 0;
        }
        createPopEffect(balloon);
        balloon.remove();
      }
    });

    balloonArea.appendChild(balloon);
    floatBalloon(balloon);
  }

  function moveToCollected(balloon) {
    const intervalId = balloon.dataset.floatInterval;
    clearInterval(intervalId);

    balloon.style.transition = 'all 1s ease';
    const offsetX = 100 + (collectedCount % 10) * 30;
    const offsetY = 400 + Math.floor(collectedCount / 10) * 20;
    balloon.style.left = `calc(100% - ${offsetX}px)`;
    balloon.style.bottom = `${offsetY}px`;
    balloon.style.zIndex = 3;
    balloon.removeEventListener('click', () => {});
    collectedCount++;
  }

  function animateMrsC() {
    if (mrsC) {
      mrsC.style.transition = 'transform 0.3s ease';
      mrsC.style.transform = 'translateY(-10px)';
      setTimeout(() => mrsC.style.transform = 'translateY(0)', 300);
    }
  }

  function floatBalloon(balloon) {
    let pos = -150;
    const interval = setInterval(() => {
      pos += 2;
      balloon.style.bottom = `${pos}px`;
      if (pos > window.innerHeight + 100) {
        balloon.remove();
        clearInterval(interval);
      }
    }, floatSpeed);
    balloon.dataset.floatInterval = interval;
  }

  function createPopEffect(balloon) {
    const pop = document.createElement('img');
    pop.src = 'assets/pop.gif';
    pop.classList.add('pop-effect');
    const rect = balloon.getBoundingClientRect();
    pop.style.left = `${rect.left + rect.width / 2}px`;
    pop.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 500);
  }

  // ================= End Game =================
  function endGame(early = false) {
    if (gameEnded) return;
    gameEnded = true;
    pauseGame();
    clearAllFloating();

    const percentage = totalClicks > 0 ? Math.round((correctAnswers / totalClicks) * 100) : 0;
    scoreDisplayModal.textContent = `Score: ${score} (${percentage}%)`;

    // Submit results to Google Form silently
    const form = document.createElement('form');
    form.action = 'https://docs.google.com/forms/d/e/1FAIpQLSeHCxQ4czHbx1Gdv649vlr5-Dz9-4DQu5M5OcIfC46WlL-6Qw/formResponse';
    form.method = 'POST';
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    const entries = {
      'entry.1609572894': studentName,
      'entry.1168342531': studentClass,
      'entry.91913727': score,
      'entry.63569940': totalClicks,
      'entry.1746910343': correctAnswersList.join(','),
      'entry.1748975026': incorrectAnswersList.join(',')
    };

    for (let key in entries) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    const iframe = document.createElement('iframe');
    iframe.name = 'hidden_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();

    // Show modal
    setTimeout(() => {
      endModal.style.display = 'flex';
      againBtn.style.display = 'inline-block';
      finishBtnModal.style.display = 'inline-block';
      logoutBtn.style.display = 'inline-block';
      continueBtn.style.display = (score === 120) ? 'none' : 'inline-block';
    }, 400);
  }

  function resetGame() {
    score = 0;
    totalClicks = 0;
    correctAnswers = 0;
    correctAnswersList = [];
    incorrectAnswersList = [];
    level = 1;
    collectedCount = 0;
    scoreDisplay.textContent = `Score: 0`;
    levelDisplay.textContent = `Level: 1`;
    updateBackground();
    updateThoughtBubble();
    gameContainer.style.display = 'block';
    startGame();
  }

  // ================= Button Listeners =================
  stopBtn.addEventListener("click", () => endGame());

  continueBtn.addEventListener("click", () => {
    endModal.style.display = "none";
    gameEnded = false;
    startGame();
  });

  againBtn.addEventListener("click", () => resetGame());

  finishBtnModal.addEventListener("click", () => {
    clearAllFloating();
    window.location.href = "../index.html";
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  // ================= Init Game =================
  levelDisplay.textContent = `Level: ${level}`;
  scoreDisplay.textContent = `Score: ${score}`;
  updateBackground();
  startGame();
});
