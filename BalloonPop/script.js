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
    createBalloon(colour, number);
  }

  function spawnCorrectBalloon() {
    totalQuestions++;
    createBalloon(targetColour, targetNumber);
  }

  function createBalloon(colour, number) {
    const balloon = document.createElement('img');
    balloon.src = `assets/balloon/${colour}_${number}.png`;
    balloon.classList.add('balloon');
    balloon.dataset.colour = colour;
    balloon.dataset.number = number;

    const gameWidth = window.innerWidth;
    const minX = gameWidth * 0.1;
    const maxX = gameWidth * 0.7 - 120;
    const x = Math.random() * (maxX - minX) + minX;

    balloon.style.left = `${x}px`;
    balloon.style.bottom = `-150px`;

    balloon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (balloon.dataset.colour === targetColour && parseInt(balloon.dataset.number) === targetNumber) {
        score++;
        correctAnswers++;
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
    alert(`${message}\n\n${playerName} from ${playerClass},\nScore: ${score}\nQuestions Answered: ${totalQuestions}\nCorrect Answers: ${correctAnswers}`);
    // Optionally submit to Google Forms or redirect
    // Example:
    // window.location.href = `https://docs.google.com/forms/d/e/your-form-id/viewform?entry.12345=${playerName}&entry.67890=${playerClass}&entry.54321=${score}&entry.98765=${totalQuestions}&entry.111213=${correctAnswers}`;
  }
});
