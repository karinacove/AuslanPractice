// find-seek.js

let level = 1;
let totalTargets = 100;
let matchData = {}; // current level's items and their targets
let foundCounts = {}; // how many have been found
let totalClicks = 0;
let startTime = 0;
let timerInterval;

const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

document.addEventListener("DOMContentLoaded", async () => {
  if (!studentName || !studentClass) window.location.href = "../index.html";

  document.getElementById("student-name").textContent = studentName;
  document.getElementById("student-class").textContent = studentClass;
  document.getElementById("logout-btn").addEventListener("click", logout);

  const wordlist = await fetch("wordlist.json").then((r) => r.json());
  loadLevel(level, wordlist);
});

function logout() {
  localStorage.clear();
  window.location.href = "../index.html";
}

function loadLevel(lvl, wordlist) {
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);

  document.getElementById("scene-background").src = `scene/level${lvl}.png`;
  document.getElementById("level-number").textContent = `Level ${lvl}`;

  const allItems = wordlist[lvl];
  const selectedItems = shuffle(allItems).slice(0, 10);
  const amounts = generateTargetCounts(10, totalTargets);

  matchData = {};
  foundCounts = {};
  selectedItems.forEach((item, i) => {
    matchData[item] = amounts[i];
    foundCounts[item] = 0;
  });

  renderSidebar(matchData);
  renderScene(matchData, allItems);
}

function updateTimer() {
  const now = Date.now();
  const seconds = Math.floor((now - startTime) / 1000);
  document.getElementById("timer").textContent = `Time: ${seconds}s`;
}

function renderSidebar(data) {
  matchList.forEach((item) => {
    const amount = matchCounts[item]; // e.g., 7 chickens
    const container = document.createElement("div");
    container.classList.add("match-entry");
    container.dataset.match = item;

    const img = document.createElement("img");
    img.src = `numbers/${amount}.png`;
    img.alt = `Auslan sign for number ${amount}`;
    img.classList.add("sidebar-sign");

    const label = document.createElement("div");
    label.className = "count-label";
    label.textContent = `0 of ${amount}`;

    container.appendChild(img);
    container.appendChild(label);
    matchListContainer.appendChild(container);
  });

}

function renderScene(targets, allItems) {
  const overlay = document.getElementById("match-overlay");
  overlay.innerHTML = "";
  const decoys = shuffle(allItems.filter(i => !targets[i])).slice(0, 400);

  const items = [];
  Object.entries(targets).forEach(([item, count]) => {
    for (let i = 0; i < count; i++) items.push({ type: item, correct: true });
  });
  decoys.forEach((item) => items.push({ type: item, correct: false }));

  shuffle(items).forEach((entry) => {
    const img = document.createElement("img");
    img.src = `matches/images/${entry.type}.png`;
    img.className = "placed-item";
    img.style.top = `${Math.random() * 90}%`;
    img.style.left = `${Math.random() * 90}%`;
    img.addEventListener("click", () => handleClick(img, entry));
    overlay.appendChild(img);
  });
}

function handleClick(img, entry) {
  if (img.classList.contains("found")) return;
  totalClicks++;

if (isCorrect) {
  currentCounts[item] = (currentCounts[item] || 0) + 1;

  const entry = document.querySelector(`.match-entry[data-match="${item}"]`);
  const label = entry.querySelector(".count-label");
  const total = matchCounts[item];
  label.textContent = `${currentCounts[item]} of ${total}`;

  // Optional: update image to current count
  const img = entry.querySelector("img");
  const newCount = total - currentCounts[item];
  if (newCount >= 0 && newCount <= 100) {
    img.src = `numbers/${newCount}.png`;
  }

  // If complete, show clap.gif
  if (currentCounts[item] === total) {
    const clap = document.createElement("img");
    clap.src = "assets/clap.gif";
    clap.classList.add("clap-overlay");
    entry.appendChild(clap);
  }
}


function updateSidebarCount(item) {
  const div = document.getElementById(`match-${item}`);
  if (div) {
    const countSpan = div.querySelector("span");
    countSpan.textContent = matchData[item] - foundCounts[item];
  }
}

function checkIfDone() {
  const allDone = Object.entries(matchData).every(
    ([item, count]) => foundCounts[item] === count
  );
  if (allDone) endLevel();
}

function endLevel() {
  clearInterval(timerInterval);
  const timeTaken = Math.floor((Date.now() - startTime) / 1000);
  const score = Math.round((100 / totalClicks) * totalTargets);

  document.getElementById("modal-score").innerHTML = `
    <p>Score: ${score}%</p>
    <p>Time: ${timeTaken} seconds</p>
  `;

  document.getElementById("end-modal").classList.remove("hidden");

  document.getElementById("menu-button").onclick = () => window.location.href = "hub.html";
  document.getElementById("again-button").onclick = () => window.location.reload();
  document.getElementById("continue-button").onclick = () => {
    level++;
    document.getElementById("end-modal").classList.add("hidden");
    loadLevel(level, wordlist); // needs wordlist as global
  };

  sendToGoogleForm(score, timeTaken);
  saveProgress();
}

function sendToGoogleForm(score, time) {
  const formURL = "https://docs.google.com/forms/d/e/FORM_ID/formResponse";
  const data = new FormData();
  data.append("entry.1111111111", studentName);
  data.append("entry.2222222222", studentClass);
  data.append("entry.3333333333", `Level ${level}`);
  data.append("entry.4444444444", `${score}%`);
  data.append("entry.5555555555", `${time} seconds`);
  data.append("entry.6666666666", `${totalClicks} clicks`);
  fetch(formURL, { method: "POST", body: data });
}

function saveProgress() {
  const state = {
    level,
    matchData,
    foundCounts,
    totalClicks,
    time: Date.now() - startTime
  };
  localStorage.setItem("findSeekProgress", JSON.stringify(state));
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function generateTargetCounts(n, total) {
  let counts = Array(n).fill(1);
  let remaining = total - n;
  while (remaining > 0) {
    const i = Math.floor(Math.random() * n);
    counts[i]++;
    remaining--;
  }
  return counts;
}

function popupFeedback(text, success) {
  const popup = document.getElementById("feedback-popup");
  popup.textContent = text;
  popup.style.backgroundColor = success ? "green" : "red";
  popup.style.display = "block";
  setTimeout(() => (popup.style.display = "none"), 1000);
}
