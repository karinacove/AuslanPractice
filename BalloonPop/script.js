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

    balloon.style.left = `${Math.random() * 90}%`;
    balloon.style.bottom = '-150px';
    balloon.style.width = '110px'; // increased size

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
        balloon.style.zIndex = 0;
        balloon.style.bottom = '10px';
        updateTarget();
      } else {
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
    }, 5000);
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
