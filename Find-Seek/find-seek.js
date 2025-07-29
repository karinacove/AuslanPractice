const items = [
  { word: 'apple', sign: 'APPLE-SIGN', x: 120, y: 80 },
  { word: 'ball', sign: 'BALL-SIGN', x: 300, y: 200 },
  { word: 'cat', sign: 'CAT-SIGN', x: 450, y: 150 },
];

let foundCount = 0;
let accurateClicks = 0;
let startTime;

const vocabList = document.getElementById('vocabList');
const image = document.getElementById('sceneImage');
const result = document.getElementById('result');
const score = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const clapGif = document.getElementById('clapGif');
const finishBtn = document.getElementById('finishBtn');
const modal = document.getElementById('modal');
const correctIcon = document.getElementById('correctIcon');
const wrongIcon = document.getElementById('wrongIcon');

function startGame() {
  foundCount = 0;
  accurateClicks = 0;
  vocabList.innerHTML = '';
  result.textContent = '';
  score.textContent = '';
  clapGif.hidden = true;
  finishBtn.hidden = true;
  modal.classList.add('hidden');
  correctIcon.hidden = true;
  wrongIcon.hidden = true;
  startTime = new Date();

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.word} (${item.sign})`;
    li.dataset.index = index;
    li.classList.remove('found');
    vocabList.appendChild(li);
  });
}

function checkWin() {
  if (foundCount === items.length) {
    const timeTaken = Math.floor((new Date() - startTime) / 1000);
    result.textContent = '🎉 You found them all!';
    score.textContent = `⏱️ Time: ${timeTaken}s | ✅ Accurate Clicks: ${accurateClicks}`;
    clapGif.hidden = false;
    finishBtn.hidden = false;
  }
}

function showIcon(icon) {
  icon.hidden = false;
  setTimeout(() => {
    icon.hidden = true;
  }, 800);
}

image.addEventListener('click', function (e) {
  const rect = image.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  let foundOne = false;

  items.forEach((item, index) => {
    const dx = clickX - item.x;
    const dy = clickY - item.y;
    if (Math.hypot(dx, dy) < 40) {
      const li = vocabList.querySelector(`li[data-index="${index}"]`);
      if (!li.classList.contains('found')) {
        li.classList.add('found');
        foundCount++;
        accurateClicks++;
        showIcon(correctIcon);
        foundOne = true;
        checkWin();
      }
    }
  });

  if (!foundOne) {
    result.textContent = '❌ Try again!';
    showIcon(wrongIcon);
  }
});

finishBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

startBtn.addEventListener('click', startGame);
