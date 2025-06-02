document.addEventListener('DOMContentLoaded', () => {
  const startForm = document.getElementById('start-form');
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const balloonArea = document.getElementById('balloon-area');
  const scoreDisplay = document.getElementById('score');
  const levelDisplay = document.getElementById('level');
  const thoughtBubble = document.getElementById('thought-bubble');
  const background = document.getElementById('background');
  const endButton = document.createElement('button');
  endButton.textContent = 'End Game';
  endButton.style.position = 'absolute';
  endButton.style.top = '10px';
  endButton.style.right = '10px';
  endButton.style.zIndex = '6';
  endButton.style.padding = '10px 20px';
  endButton.style.fontSize = '16px';
  endButton.style.cursor = 'pointer';

  gameContainer.appendChild(endButton);

  let playerName = '';
  let playerClass = '';
  let score = 0;
  let totalQuestions = 0;
  let correctAnswers = 0;
  let correctAnswersList = [];
  let incorrectAnswersList = [];
  let level = 1;
  let targetColour = '';
  let targetNumber = '';
  let collectedCount = 0;
  let floatSpeed = 30;
  let balloonInterval, correctBalloonInterval;

  const colours = ['green', 'red', 'orange', 'yellow', 'purple', 'pink', 'blue', 'brown', 'black', 'white'];
  const numbers = Array.from({ length: 21 }, (_, i) => i);

  startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = startForm.querySelectorAll('input');
    playerName = inputs[0].value.trim();
    playerClass = inputs[1].value.trim();
    if (playerName && playerClass) {
      startScreen.style.display = 'none';
      gameContainer.style.display = 'block';
      updateBackground();
      startGame();
    }
  });

  endButton.addEventListener('click', () => {
    endGame(true);
  });

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
    targetNumber = numbers[Math.floor(Math.random() * numbers.length)];
    thoughtBubble.innerHTML = `
      <img src="assets/colour/${targetColour}.png" class="sign-img" />
      <img src="assets/number/${targetNumber}.png" class="sign-img" />
    `;
  }

  function spawnBalloon() {
    const colour = colours[Math.floor(Math.random() * colours.length)];
    const number = numbers[Math.floor(Math.random() * numbers.length)];
    totalQuestions++;
    createBalloon(colour, number, false);
  }

  function spawnCorrectBalloon() {
    totalQuestions++;
    createBalloon(targetColour, targetNumber, true);
  }

  function createBalloon(colour, number, isCorrect) {
    const balloon = document.createElement('img');
    balloon.src = `assets/balloon/${colour}_${number}.png`;
    balloon.classList.add('balloon');
    balloon.dataset.colour = colour;
    balloon.dataset.number = number;
    balloon.dataset.correct = isCorrect;

    const gameWidth = window.innerWidth;
    const minX = gameWidth * 0.1;
    const maxX = gameWidth * 0.7 - 120;
    const x = Math.random() * (maxX - minX) + minX;

    balloon.style.left = `${x}px`;
    balloon.style.bottom = `-150px`;

    balloon.addEventListener('click', (e) => {
      e.stopPropagation();
      const colourClicked = balloon.dataset.colour;
      const numberClicked = parseInt(balloon.dataset.number);
      if (colourClicked === targetColour && numberClicked === targetNumber) {
        score++;
        correctAnswers++;
        correctAnswersList.push(`${colourClicked} ${numberClicked}`);
        scoreDisplay.textContent = `Score: ${score}`;
        moveToCollected(balloon);
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
        }
      } else {
        incorrectAnswersList.push(`${colourClicked} ${numberClicked}`);
        createPopEffect(balloon);
        balloon.remove();
      }
    });

    balloonArea.appendChild(balloon);
    floatBalloon(balloon);
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
    const x = rect.left + rect.width * 0.3;
    const y = rect.top;

    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;

    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 400);
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
    const message = early ? 'Game ended early.' : 'Congratulations! You completed the game!';
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    alert(`${message}\n\n${playerName} from ${playerClass},\nScore: ${score}\nQuestions Answered: ${totalQuestions}\nCorrect Answers: ${correctAnswers}\nPercentage: ${percentage}%`);

    const incorrectList = [...incorrectAnswersList].sort().join(', ');
    const correctList = [...correctAnswersList].sort().join(', ');

    const form = document.createElement('form');
    form.action = 'https://docs.google.com/forms/d/e/1FAIpQLSeHCxQ4czHbx1Gdv649vlr5-Dz9-4DQu5M5OcIfC46WlL-6Qw/formResponse';
    form.method = 'POST';
    form.style.display = 'none';

    const entries = {
      'entry.1609572894': playerName,
      'entry.1168342531': playerClass,
      'entry.91913727': score,
      'entry.63569940': totalQuestions,
      'entry.1746910343': correctAnswers,
      'entry.1748975026': `Correct: ${correctList} | Incorrect: ${incorrectList}`
    };

    for (let key in entries) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }
});
