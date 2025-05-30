// script.js

document.addEventListener('DOMContentLoaded', () => {
  const startForm = document.getElementById('start-form');
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const balloonArea = document.getElementById('balloon-area');
  const targetDisplay = document.getElementById('thought-bubble');
  const scoreDisplay = document.getElementById('score');
  const levelDisplay = document.getElementById('level');

  const colours = ["green", "red", "orange", "yellow", "purple", "pink", "blue", "brown", "black", "white"];
  const numbers = Array.from({ length: 21 }, (_, i) => i); // 0-20

  let targetColour = "";
  let targetNumber = -1;
  let score = 0;
  let level = 1;
  let interval = 2000;
  let gameInterval;
  let answerBalloonTimer;
  let currentTargetKey = "";
  const collectedArea = document.createElement('div');
  collectedArea.id = 'collected-area';
  collectedArea.style.position = 'absolute';
  collectedArea.style.right = '160px';
  collectedArea.style.bottom = '120px';
  collectedArea.style.width = '150px';
  collectedArea.style.height = '400px';
  collectedArea.style.display = 'flex';
  collectedArea.style.flexDirection = 'column';
  collectedArea.style.alignItems = 'center';
  gameContainer.appendChild(collectedArea);

  function updateTarget() {
    targetColour = colours[Math.floor(Math.random() * colours.length)];
    targetNumber = numbers[Math.floor(Math.random() * numbers.length)];
    currentTargetKey = `${targetColour}_${targetNumber}`;

    targetDisplay.innerHTML = "";

    const colourSign = document.createElement("img");
    colourSign.src = `assets/colour/${targetColour}.png`;
    colourSign.classList.add("sign-img");

    const numberSign = document.createElement("img");
    numberSign.src = `assets/number/${targetNumber}.png`;
    numberSign.classList.add("sign-img");

    targetDisplay.appendChild(colourSign);
    targetDisplay.appendChild(numberSign);
  }

  function createBalloon(forceAnswer = false) {
    let colour, number;
    if (forceAnswer) {
      colour = targetColour;
      number = targetNumber;
    } else {
      colour = colours[Math.floor(Math.random() * colours.length)];
      number = numbers[Math.floor(Math.random() * numbers.length)];
    }

    const balloon = document.createElement('img');
    balloon.classList.add('balloon');
    balloon.src = `assets/balloon/${colour}_${number}.png`;
    balloon.dataset.colour = colour;
    balloon.dataset.number = number;

    const margin = 150;
    balloon.style.left = `${margin + Math.random() * (window.innerWidth - 2 * margin - 110)}px`;
    balloon.style.bottom = '-150px';
    balloon.style.width = '120px';

    balloonArea.appendChild(balloon);

    let position = 0;
    const float = setInterval(() => {
      position += 2;
      balloon.style.bottom = `${position}px`;
      if (position > window.innerHeight) {
        balloon.remove();
        clearInterval(float);
      }
    }, 30);

    balloon.addEventListener('click', () => {
      if (balloon.dataset.colour === targetColour && parseInt(balloon.dataset.number) === targetNumber) {
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
        clearInterval(float);

        const clone = balloon.cloneNode(true);
        clone.style.transition = 'all 1s ease-in-out';
        clone.style.position = 'absolute';
        clone.style.left = `${window.innerWidth - 200}px`;
        clone.style.bottom = `${120 + collectedArea.children.length * 30}px`;
        collectedArea.appendChild(clone);
        balloon.remove();

        updateTarget();
        ensureAnswerBalloon();
      } else {
        const pop = document.createElement('img');
        pop.src = 'assets/pop.gif';
        pop.style.position = 'absolute';
        pop.style.left = balloon.style.left;
        pop.style.bottom = balloon.style.bottom;
        pop.style.width = '600px'; // 10x larger
        balloonArea.appendChild(pop);
        setTimeout(() => pop.remove(), 500);
        balloon.remove();
      }
      checkLevelUp();
    });
  }

  function checkLevelUp() {
    if (score > 0 && score % 10 === 0) {
      level++;
      interval = Math.max(500, interval - 300);
      levelDisplay.textContent = `Level: ${level}`;
      clearInterval(gameInterval);
      gameInterval = setInterval(() => createBalloon(false), interval);
    }
  }

  function ensureAnswerBalloon() {
    clearInterval(answerBalloonTimer);
    answerBalloonTimer = setInterval(() => {
      const exists = [...document.querySelectorAll('.balloon')].some(b =>
        b.dataset.colour === targetColour && parseInt(b.dataset.number) === targetNumber);
      if (!exists) {
        createBalloon(true);
      }
    }, 3000); // shorter interval to reduce waiting
  }

  startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    updateTarget();
    gameInterval = setInterval(() => createBalloon(false), interval);
    ensureAnswerBalloon();
  });
});
