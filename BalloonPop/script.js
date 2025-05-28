document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.getElementById("game-container");
  const form = document.getElementById("player-form");

  const colourSign = document.getElementById("colour-sign");
  const numberSign = document.getElementById("number-sign");
  const thoughtBubble = document.getElementById("thought-bubble");

  const scoreDisplay = document.getElementById("score");
  const levelDisplay = document.getElementById("level");

  const balloonArea = document.getElementById("balloon-area");

  let score = 0;
  let level = 1;
  let currentRequest = { colour: "", number: 0 };

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
    const colours = [
      "green", "red", "orange", "yellow", "purple",
      "pink", "blue", "brown", "black", "white", "grey"
    ];
    const colour = colours[Math.floor(Math.random() * colours.length)];
    const number = Math.floor(Math.random() * 21); // 0–20

    colourSign.src = `assets/colour/${colour}.png`;
    numberSign.src = `assets/number/${number}.png`;

    currentRequest = { colour, number };
  }

  function spawnBalloons(count) {
    for (let i = 0; i < count; i++) {
      const number = Math.floor(Math.random() * 21);
      const colour = getRandomColour();

      const balloon = document.createElement("div");
      balloon.classList.add("balloon");
      balloon.textContent = number;
      balloon.style.backgroundColor = colour;
      balloon.style.left = `${Math.random() * 90}%`;
      balloon.dataset.number = number;
      balloon.dataset.colour = colour;

      balloon.addEventListener("click", () => {
        if (
          parseInt(balloon.dataset.number) === currentRequest.number &&
          balloon.dataset.colour === currentRequest.colour
        ) {
          score++;
          scoreDisplay.textContent = `Score: ${score}`;
          balloon.remove();
          setNewRequest();
          spawnBalloons(2);
        } else {
          balloon.textContent = "💥";
          balloon.style.backgroundColor = "black";
          setTimeout(() => balloon.remove(), 300);
        }
      });

      balloonArea.appendChild(balloon);

      // Auto-remove balloon after it floats away
      setTimeout(() => balloon.remove(), 10000);
    }
  }

  function getRandomColour() {
    const colours = [
      "green", "red", "orange", "yellow", "purple",
      "pink", "blue", "brown", "black", "white"
    ];
    return colours[Math.floor(Math.random() * colours.length)];
  }
});
