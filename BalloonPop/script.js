document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("player-form");
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const thoughtBubble = document.getElementById("thought-bubble");
  const colourSign = document.getElementById("colour-sign");
  const numberSign = document.getElementById("number-sign");

  let currentRequest = {};
  let correctCount = 0;
  let level = 1;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    startScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    thoughtBubble.classList.remove("hidden");
    startGame();
  });

  function startGame() {
    setNewRequest();
    spawnBalloons(5);
  }

  function setNewRequest() {
    const colour = getRandomColor();
    const number = Math.floor(Math.random() * 21);

    colourSign.src = `assets/colour/${colour}.png`;
    numberSign.src = `assets/number/${number}.png`;

    currentRequest = { colour, number };
  }

  function spawnBalloons(count) {
    for (let i = 0; i < count; i++) {
      const num = Math.floor(Math.random() * 21);
      const col = getRandomColor();
      createBalloon(num, col);
    }
  }

  function createBalloon(number, color) {
    const balloon = document.createElement("div");
    balloon.className = "balloon";
    balloon.textContent = number;
    balloon.style.backgroundColor = color;
    balloon.style.left = `${Math.random() * 90}%`;
    balloon.dataset.color = color;
    balloon.dataset.number = number;

    balloon.addEventListener("click", () => handleBalloonClick(balloon));
    document.getElementById("balloon-area").appendChild(balloon);

    setTimeout(() => {
      if (balloon.parentElement) balloon.remove();
    }, 10000);
  }

  function handleBalloonClick(balloon) {
    const number = parseInt(balloon.dataset.number);
    const color = balloon.dataset.color;

    if (number === currentRequest.number && color === currentRequest.colour) {
      correctCount++;
      document.getElementById("score").textContent = `Score: ${correctCount}`;
      balloon.style.display = "none";
      setNewRequest();
      spawnBalloons(3);
    } else {
      balloon.textContent = "💥";
      balloon.style.backgroundColor = "black";
      setTimeout(() => balloon.remove(), 300);
    }
  }

  function getRandomColor() {
    const colors = [
      "green", "red", "orange", "yellow", "purple",
      "pink", "blue", "brown", "black", "white"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
});
