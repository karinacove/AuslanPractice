let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const finishBtn = document.getElementById("finish-btn");

const endModal = document.getElementById("end-modal");
const scoreDisplayModal = document.getElementById("score-display");
const continueBtn = document.getElementById("continue-btn");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const logoutBtn = document.getElementById("logout-btn");

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html"; // Adjust path if needed
} else {
  if (studentInfoDiv) {
    studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  }
  if (gameContainer) {
    gameContainer.style.display = "block";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const balloonArea = document.getElementById('balloon-area');
  const scoreDisplay = document.getElementById('score');
  const levelDisplay = document.getElementById('level');
  const thoughtBubble = document.getElementById('thought-bubble');
  const background = document.getElementById('background');
  const mrsC = document.getElementById('mrs-c');

   if (finishBtn) finishBtn.addEventListener("click", () => {
    gameEnded = false;
    endGame();
  });
  
  continueBtn.addEventListener("click", () => {
    endModal.style.display = "none";
    gameEnded = false;
    startGame();
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

  finishBtn.addEventListener("click", () => {
    endGame();
  });


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

  function showCarefulWarning() {
    const warning = document.createElement('img');
    warning.src = 'assets/careful.png';
    warning.classList.add('careful-warning'); // Define this in CSS
    warning.style.position = 'fixed';
    warning.style.left = '50%';
    warning.style.top = '50%';
    warning.style.transform = 'translate(-50%, -50%)';
    warning.style.zIndex = 1000;

    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 1500);
  }
  
  const colours = ['green', 'red', 'orange', 'yellow', 'purple', 'pink', 'blue', 'brown', 'black', 'white'];

  function getNumberRangeForLevel(level) {
    if (level >= 1 && level <= 3) {
      return Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
    } else if (level >= 4 && level <= 6) {
      return Array.from({ length: 8 }, (_, i) => i + 13); // 13–20
    } else if (level >= 7 && level <= 9) {
      return Array.from({ length: 21 }, (_, i) => i + 20); // 21–41 (20–40)
    } else if (level >= 10 && level <= 12) {
      return Array.from({ length: 60 }, (_, i) => i + 41); // 41–100
    } else if (level >=13 && level <=15) {
      return Array.from({ length: 100 }, (_, i) => i + 1); // 1–100
    }
  }

  function getValidNumbersForColour(colour) {
    const baseNumbers = Array.from({ length: 41 }, (_, i) => i); // 0–40
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
      white: 43
    };

    let extendedNumbers = [];
    const start = colourOffsets[colour];
    if (start !== undefined) {
      for (let i = start; i <= 100; i += 4) {
        extendedNumbers.push(i);
      }
    }

    return baseNumbers.concat(extendedNumbers);
  }

  function startGame() {
    updateFloatSpeed();
    updateThoughtBubble();
    spawnBalloon();
    balloonInterval = setInterval(spawnBalloon, 1000);
    correctBalloonInterval = setInterval(spawnCorrectBalloon, 5000);
  }

  function updateFloatSpeed() {
    if ([1, 4, 7, 10].includes(level)) floatSpeed = 30;
    else if ([2, 5, 8, 11].includes(level)) floatSpeed = 20;
    else if ([3, 6, 9, 12].includes(level)) floatSpeed = 10;
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
       clearBalloons();
       updateBackground();
       updateFloatSpeed();
       clearInterval(balloonInterval);
       clearInterval(correctBalloonInterval);
       startGame();
     } else if (score === 120) {
        endGame();
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
  };

    balloonArea.appendChild(balloon);
    floatBalloon(balloon);
  }

  function animateMrsC() {
    if (mrsC) {
      mrsC.style.transition = 'transform 0.3s ease';
      mrsC.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        mrsC.style.transform = 'translateY(0)';
      }, 300);
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

  function moveToCollected(balloon) {
    const intervalId = balloon.dataset.floatInterval;
    clearInterval(intervalId);

    balloon.style.transition = 'all 1s ease';
    const offsetX = 100 + (collectedCount % 10) * 30;
    const offsetY = 400;
    balloon.style.left = `calc(100% - ${offsetX}px)`;
    balloon.style.bottom = `${offsetY}px`;
    balloon.style.zIndex = 3;
    balloon.removeEventListener('click', () => {});
    collectedCount++;
  }

  function clearBalloons() {
    document.querySelectorAll('.balloon').forEach(b => b.remove());
  }

  function updateBackground() {
    const bgIndex = Math.min(level, 12);
    background.style.backgroundImage = `url('assets/background/background_${bgIndex}.png')`;
  }
  
  function endGame(early = false) {
    clearInterval(balloonInterval);
    clearInterval(correctBalloonInterval);
    clearBalloons();

    const percentage = totalClicks > 0 ? Math.round((correctAnswers / totalClicks) * 100) : 0;
    const correctList = [...correctAnswersList].sort().join(', ');
    const incorrectList = [...incorrectAnswersList].sort().join(', ');

    // Update modal score display
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
      'entry.1746910343': correctList,
      'entry.1748975026': incorrectList
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
    endModal.style.display = 'flex';
  }

  function resetGame() {
    finishBtn.style.display = 'block';

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

  // Initial setup
  levelDisplay.textContent = `Level: ${level}`;
  scoreDisplay.textContent = `Score: ${score}`;
  updateBackground();
  startGame();
});
