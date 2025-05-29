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

  function updateTarget() {
    targetColour = colours[Math.floor(Math.random() * colours.length)];
    targetNumber = numbers[Math.floor(Math.random() * numbers.length)];

    // Clear previous
    targetDisplay.innerHTML = "";

    const targetImg = document.createElement("img");
    targetImg.src = `assets/colour/${targetColour}.png`;
    targetImg.classList.add("balloon", "target-balloon");
    targetImg.style.position = "relative";

    const numberOverlay = document.createElement("div");
    numberOverlay.style.position = 'absolute';
    numberOverlay.style.top = '50%';
    numberOverlay.style.left = '50%';
    numberOverlay.style.transform = 'translate(-50%, -50%)';
    numberOverlay.style.fontSize = '20px';
    numberOverlay.style.color = 'white';
    numberOverlay.style.textShadow = '1px 1px 2px black';
    numberOverlay.innerText = targetNumber;

    targetDisplay.appendChild(targetImg);
    targetImg.appendChild(numberOverlay);
  }

  function createBalloon() {
    const colour = colours[Math.floor(Math.random() * colours.length)];
    const number = numbers[Math.floor(Math.random() * numbers.length)];

    const balloon = document.createElement('img');
    balloon.classList.add('balloon');
    balloon.src = `assets/colour/${colour}.png`;
    balloon.dataset.colour = colour;
    balloon.dataset.number = number;

    balloon.style.left = `${Math.random() * 90}%`;
    balloon.style.bottom = '-100px';

    const numberOverlay = document.createElement('div');
    numberOverlay.style.position = 'absolute';
    numberOverlay.style.top = '50%';
    numberOverlay.style.left = '50%';
    numberOverlay.style.transform = 'translate(-50%, -50%)';
    numberOverlay.style.fontSize = '20px';
    numberOverlay.style.color = 'white';
    numberOverlay.style.textShadow = '1px 1px 2px black';
    numberOverlay.innerText = number;
    balloon.appendChild(numberOverlay);

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
      if (colour === targetColour && number === targetNumber) {
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
        balloon.style.zIndex = 0;
        balloon.style.bottom = '10px';
      } else {
        balloon.remove();
      }
      updateTarget();
      checkLevelUp();
    });
  }

  function checkLevelUp() {
    if (score > 0 && score % 10 === 0) {
      level++;
      interval = Math.max(500, interval - 300);
      levelDisplay.textContent = `Level: ${level}`;
      clearInterval(gameInterval);
      gameInterval = setInterval(createBalloon, interval);
    }
  }

  startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    updateTarget();
    gameInterval = setInterval(createBalloon, interval);
  });
});
