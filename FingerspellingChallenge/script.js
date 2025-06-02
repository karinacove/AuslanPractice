window.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  const finishButton = document.getElementById('finish-button');
  const submitButton = document.getElementById('submit-word');
  const againButton = document.getElementById('again-button');

  const nameInput = document.getElementById('student-name');
  const classInput = document.getElementById('student-class');
  const modeSelect = document.getElementById('game-mode');
  const speedSlider = document.getElementById('speed-slider');

  const signinScreen = document.getElementById('signin-screen');
  const gameScreen = document.getElementById('game-screen');
  const letterDisplay = document.getElementById('letter-display');
  const wordInput = document.getElementById('word-input');
  const timerDisplay = document.getElementById('timer');
  const scoreDisplay = document.getElementById('score');

  const wordBank = {
    "3": ["And", "Are", "Ape", "Ace", "Act", "Ask", "Arm", "Age", "Ago", "Air", "Ate", "All", "But", "Bye", "Bad", "Big", "Bed", "Bat", "Boy", "Bus", "Bag", "Cat", "Car", "Cut", "Cow", "Cry"],
    "4": ["Come", "Bell", "Bear", "Play", "Sing", "Bird", "Bean", "Game", "Rice", "Four", "Five", "Tree", "Keep", "Dark", "Moon", "Cool", "Abide", "Abort", "About", "Abuse", "Aches", "Adult", "After", "Again"],
    "5": ["Aunty", "Uncle", "Babies", "Birds", "Fifty", "Thank", "Seven", "Shirt", "Again", "Ocean", "Green", "Brown"],
    "6": ["Abroad", "Casual", "Around", "Almost", "Coffee", "Beauty", "Always", "Column", "Became", "Amount", "Before", "Colour"],
    "7": ["Journey", "Picture", "Colours", "Arrange", "Deliver", "Circuit", "Arrival", "Density", "Classes", "Article", "Deposit", "Classic"],
    "8": ["Elephant", "Building", "Absolute", "Bachelor", "Computer", "Familiar", "Everyone", "Domestic", "Featured", "Evidence", "Dominant"],
    "9": ["Vegetable", "Skeleton", "Beginning", "Celebrate", "Following", "Necessary", "Orchestra", "Receiving", "Tailoring", "Umbrellas", "Yearnings", "Adventure", "Breakfast"],
    "10": ["Foundation", "Discovery", "Remarkable", "Perpetuate", "Absorptive", "Jackrabbit", "Ponderable", "Navigation", "Blissfully", "Lighthouse", "Quenchable", "Suggestion", "Technology", "Navigating", "Basketball", "Confidence", "Visibility"]
  };

  let currentWord = '';
  let score = 0;
  let timer;
  let timeLeft = 120;

  function getRandomWord(length) {
    const words = wordBank[length];
    return words[Math.floor(Math.random() * words.length)];
  }

  function displayWord(word) {
    letterDisplay.textContent = word.toUpperCase();
  }

  function startGame() {
    const name = nameInput.value.trim();
    const studentClass = classInput.value.trim();
    const mode = modeSelect.value;
    const wordLength = document.getElementById('word-length')?.value || "3";

    if (!name || !studentClass) {
      alert('Please enter name and class.');
      return;
    }

    signinScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    timeLeft = 120;
    timerDisplay.textContent = `Time: ${timeLeft}`;

    currentWord = getRandomWord(wordLength);
    displayWord(currentWord);

    timer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `Time: ${timeLeft}`;
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function checkWord() {
    const input = wordInput.value.trim();
    if (input.toLowerCase() === currentWord.toLowerCase()) {
      score++;
      scoreDisplay.textContent = `Score: ${score}`;
    }
    wordInput.value = '';
    const wordLength = document.getElementById('word-length')?.value || "3";
    currentWord = getRandomWord(wordLength);
    displayWord(currentWord);
  }

  function endGame() {
    clearInterval(timer);
    alert(`Time's up! Your score is ${score}.`);
    location.reload();
  }

  startButton.addEventListener('click', startGame);
  submitButton.addEventListener('click', checkWord);
  againButton.addEventListener('click', () => {
    wordInput.value = '';
    const wordLength = document.getElementById('word-length')?.value || "3";
    currentWord = getRandomWord(wordLength);
    displayWord(currentWord);
  });
  finishButton.addEventListener('click', endGame);
});
