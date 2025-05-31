document.addEventListener('DOMContentLoaded', () => {
  const startForm = document.getElementById('start-form');
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const balloonArea = document.getElementById('balloon-area');
  const scoreDisplay = document.getElementById('score');
  const levelDisplay = document.getElementById('level');
  const thoughtBubble = document.getElementById('thought-bubble');

  let playerName = '';
  let playerClass = '';
  let score = 0;
  let level = 1;
  let targetColour = '';
  let targetNumber = '';
  let collectedCount = 0;

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
      startGame();
    }
  });

  function startGame() {
    updateThoughtBubble();
    spawnBalloon();
    setInterval(spawnBalloon, 1000);
    setInterval(spawnCorrectBalloon, 5000);
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
    createBalloon(colour, number);
  }

  function spawnCorrectBalloon() {
    createBalloon(targetColour, targetNumber);
  }

  function createBalloon(colour, number) {
    const balloon = document.createElement('img');
    balloon.src = `assets/balloon/${colour}_${number}.png`;
    balloon.classList.add('balloon');
    balloon.dataset.colour = colour;
    balloon.dataset.number = number;

    const gameWidth = window.innerWidth;
    const minX = gameWidth * 0.2;
    const maxX = gameWidth * 0.8 - 120;
    const x = Math.random() * (maxX - minX) + minX;

    balloon.style.left = `${x}px`;
    balloon.style.bottom = `-150px`;

    balloon.addEventListener('click', (e) => {
      e.stopPropagation();
      const clickX = e.clientX;
      const clickY = e.clientY;
      const clickedColour = balloon.dataset.colour;
      const clickedNumber = parseInt(balloon.dataset.number);

      if (clickedColour === targetColour && clickedNumber === targetNumber) {
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
        moveToCollected(balloon);
        updateThoughtBubble();
      } else {
        createPopEffect(clickX, clickY);
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
    }, 30);
    balloon.dataset.floatInterval = interval;
  }

  function createPopEffect(x, y) {
    const pop = document.createElement('img');
    pop.src = 'assets/pop.gif';
    pop.classList.add('pop-effect');
    pop.style.left = `${x - 50}px`;
    pop.style.top = `${y - 50}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 400);
  }

  function moveToCollected(balloon) {
    const intervalId = balloon.dataset.floatInterval;
    clearInterval(intervalId);

    balloon.style.transition = 'all 1s ease';
    const offsetX = 100 + (collectedCount % 10) * 30;
    const offsetY = 400 + Math.floor(collectedCount / 10) * 50;
    balloon.style.left = `calc(100% - ${offsetX}px)`;
    balloon.style.bottom = `${offsetY}px`;
    balloon.style.zIndex = 3;
    balloon.removeEventListener('click', () => {});
    collectedCount++;
  }
});
