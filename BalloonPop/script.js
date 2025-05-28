let playerName = '';
let playerClass = '';
let currentRequest = { colour: "", number: 0 };
let correctCount = 0;
let level = 1;

document.getElementById("player-form").addEventListener("submit", function (e) {
  e.preventDefault();
  playerName = document.getElementById("player-name").value;
  playerClass = document.getElementById("player-class").value;

  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");

  startGame();
});

function startGame() {
  setNewRequest();
  spawnBalloons(5);
}

function setNewRequest() {
  const colour = getRandomColor();
  const number = Math.floor(Math.random() * 20) + 1;

  const colourImg = document.getElementById("colour-sign");
  const numberImg = document.getElementById("number-sign");

  colourImg.src = `assets/colour/${colour}.png`;
  numberImg.src = `assets/number/${number}.png`;

  currentRequest = { colour, number };
}

function spawnBalloons(count) {
  for (let i = 0; i < count; i++) {
    const num = Math.floor(Math.random() * 20) + 1;
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

  // click handler
  balloon.addEventListener("click", () => handleBalloonClick(balloon));

  document.getElementById("balloon-area").appendChild(balloon);
}

function handleBalloonClick(balloon) {
  const balloonNumber = parseInt(balloon.dataset.number);
  const balloonColor = balloon.dataset.color;

  if (
    balloonNumber === currentRequest.number &&
    balloonColor === currentRequest.colour
  ) {
    correctCount++;
    updateScore();
    moveBalloonBehindMrsC(balloon);

    if (correctCount % 10 === 0) {
      level++;
      document.getElementById("level").textContent = `Level: ${level}`;
    }

    setNewRequest();
    spawnBalloons(3);
  } else {
    popBalloon(balloon);
  }
}

function moveBalloonBehindMrsC(balloon) {
  balloon.style.animation = "none";
  balloon.style.transition = "all 1s ease-in-out";
  balloon.style.left = "92%";
  balloon.style.bottom = "150px";
  balloon.style.opacity = "0.8";
  balloon.style.transform = "scale(0.8)";
  balloon.style.zIndex = "0";
  balloon.removeEventListener("click", handleBalloonClick);
}

function popBalloon(balloon) {
  balloon.textContent = "💥";
  balloon.style.backgroundColor = "black";
  balloon.style.color = "white";
  balloon.style.animation = "none";
  setTimeout(() => balloon.remove(), 300);
}

function updateScore() {
  document.getElementById("score").textContent = `Score: ${correctCount}`;
}

function getRandomColor() {
  const colors = ["red", "blue", "green", "yellow", "purple"];
  return colors[Math.floor(Math.random() * colors.length)];
}
