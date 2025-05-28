let playerName = '';
let playerClass = '';

document.getElementById("player-form").addEventListener("submit", function (e) {
  e.preventDefault();
  playerName = document.getElementById("player-name").value;
  playerClass = document.getElementById("player-class").value;

  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");

  startGame();
});

function startGame() {
  // Load a random Auslan video
  const video = document.getElementById("auslan-video");
  video.src = "assets/videos/example.mp4"; // Replace with your video logic

  // Placeholder: generate some balloons
  for (let i = 0; i < 5; i++) {
    createBalloon(Math.floor(Math.random() * 20), getRandomColor());
  }
}

function createBalloon(number, color) {
  const balloon = document.createElement("div");
  balloon.className = "balloon";
  balloon.textContent = number;
  balloon.style.backgroundColor = color;
  balloon.style.left = `${Math.random() * 90}%`;
  balloon.style.bottom = `-100px`;

  // Animate upward
  let position = -100;
  const interval = setInterval(() => {
    if (position > window.innerHeight) {
      balloon.remove();
      clearInterval(interval);
    } else {
      position += 2;
      balloon.style.bottom = `${position}px`;
    }
  }, 30);

  document.getElementById("balloon-area").appendChild(balloon);
}

function getRandomColor() {
  const colors = ["red", "blue", "green", "yellow", "purple"];
  return colors[Math.floor(Math.random() * colors.length)];
}

