// 🚀 JavaScript is running!

let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const finishButton = document.getElementById("finish-btn");
const stopButton = document.getElementById("stop-btn");
const endModal = document.getElementById("end-modal");
const endModalContent = document.getElementById("end-modal-content");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const logoutImg = document.getElementById("logout-btn");
const keyboardBtn = document.getElementById("keyboard-btn");

let paused = false; // pause flag

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  if (studentInfoDiv) {
    studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  }
  if (gameContainer) {
    gameContainer.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (finishButton) {
    finishButton.addEventListener("click", () => finishButtonHandler(true));
  }

  if (stopButton) {
    stopButton.addEventListener("click", () => {
      paused = true;
      showPauseModal();
    });
  }

  if (againBtn) {
    againBtn.addEventListener("click", () => location.reload());
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => window.location.href = "../index.html");
  }

  if (logoutImg) {
    logoutImg.addEventListener("click", () => {
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentClass");
      window.location.href = "../index.html";
    });
  }

  if (keyboardBtn) {
    keyboardBtn.addEventListener("click", () => {
      const keyboard = document.getElementById("onScreenKeyboard");
      if (keyboard) keyboard.style.display = keyboard.style.display === "none" ? "block" : "none";
    });
  }

  setupKeyboard();
});

// ========================= Wordle Logic =========================

let words = [];
let validWords = [];
let correctWord = "";
let currentGuess = "";
let attempts = 0;
const maxAttempts = 6;
const rows = document.querySelectorAll(".row");
let currentRow = 0;
let guessesList = [];

fetch("wordle_words.json")
  .then(res => res.json())
  .then(data => {
    words = data.words.map(w => w.toUpperCase());
    correctWord = words[Math.floor(Math.random() * words.length)];
    console.log("Correct Word:", correctWord);
  });

fetch("valid_words.json")
  .then(res => res.json())
  .then(data => {
    validWords = data.validWords.map(w => w.toUpperCase());
  });

document.addEventListener("keydown", keydownHandler);

function keydownHandler(event) {
  if (paused || endModal.style.display === "flex") return;

  if (event.key.length === 1 && /[a-zA-Z]/i.test(event.key) && currentGuess.length < 5) {
    currentGuess += event.key.toUpperCase();
    updateGrid();
  } else if (event.key === "Backspace") {
    currentGuess = currentGuess.slice(0, -1);
    updateGrid();
  } else if (event.key === "Enter" && currentGuess.length === 5) {
    if (!validWords.includes(currentGuess)) {
      showInvalidWordMessage(currentGuess);
      return;
    }
    checkGuess();
  }
}

function updateGrid() {
  const cells = rows[currentRow].querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    cell.textContent = currentGuess[index] || "";
    cell.style.fontFamily = "'AuslanFingerSpelling', sans-serif";
  });
}

function checkGuess() {
  guessesList.push(currentGuess);
  const guessArray = currentGuess.split("");
  const correctArray = correctWord.split("");
  const cells = rows[currentRow].querySelectorAll(".cell");
  let remaining = [...correctArray];

  guessArray.forEach((letter, i) => {
    if (letter === correctArray[i]) {
      cells[i].className = "cell correct";
      remaining[i] = null;
    }
  });

  guessArray.forEach((letter, i) => {
    if (remaining.includes(letter) && !cells[i].classList.contains("correct")) {
      cells[i].className = "cell present";
      remaining[remaining.indexOf(letter)] = null;
    }
  });

  guessArray.forEach((letter, i) => {
    if (!cells[i].classList.contains("correct") && !cells[i].classList.contains("present")) {
      cells[i].className = "cell absent";
    }
  });

  const guessedCorrectly = currentGuess === correctWord;
  attempts++;

  if (guessedCorrectly || attempts >= maxAttempts) {
    currentGuess = "";
    document.removeEventListener("keydown", keydownHandler);
    submitWordleResult(correctWord, guessesList);
    showEndModal(guessedCorrectly);
  } else {
    setTimeout(() => {
      currentGuess = "";
      currentRow++;
      updateGrid();
    }, 500);
  }
}

// ========================= Pause & End Modals =========================

function showPauseModal() {
  endModal.style.display = "flex";
  endModalContent.innerHTML = `
    <h2 style="font-family: sans-serif">Game Paused</h2>
    <img id="again-btn" src="assets/Again.png" alt="Restart">
    <img id="finish-btn" src="assets/finish.png" alt="Finish">
    <img id="menu-btn" src="assets/menu.png" alt="Main Menu">
  `;

  // attach events
  document.getElementById("again-btn").onclick = () => location.reload();
  document.getElementById("finish-btn").onclick = () => {
    paused = false;
    endModal.style.display = "none";
    finishButtonHandler(true);
  };
  document.getElementById("menu-btn").onclick = () => window.location.href = "../index.html";
}

function showEndModal(success) {
  paused = true;
  let message = "";
  let image = "";

  if (success) {
    showAuslanClap();
    message = `<h2 style="font-family: sans-serif">Congratulations!</h2>
               <p style="font-family: sans-serif">You guessed the word in ${guessesList.length} attempts.</p>`;
    image = `<img src="assets/Correct.png" style="max-width: 40%; margin: 10px auto;">`;
  } else {
    message = `<h2 style="font-family: sans-serif">Unlucky!</h2>
               <p style="font-family: sans-serif">The correct word was:</p>`;
    image = `<img src="assets/Wrong.png" style="max-width: 40%; margin: 10px auto;">`;
  }

  endModalContent.innerHTML = `
    ${message}
    <div style="font-family: 'AuslanFingerSpelling', sans-serif; font-size: 60px; margin: 10px;">${correctWord}</div>
    ${image}
    <img id="again-btn" src="assets/Again.png" alt="Play Again">
    <img id="menu-btn" src="assets/menu.png" alt="Main Menu">
  `;

  endModal.style.display = "flex";

  document.getElementById("again-btn").onclick = () => location.reload();
  document.getElementById("menu-btn").onclick = () => window.location.href = "../index.html";
}

function showAuslanClap() {
  const clapGif = document.getElementById("AuslanClap");
  if (clapGif) {
    clapGif.src = "assets/auslan-clap.gif";
    clapGif.style.display = "block";
    setTimeout(() => clapGif.style.display = "none", 3000);
  }
}

function showInvalidWordMessage(word) {
  const message = document.createElement("div");
  message.innerHTML = `<span style="font-family: 'AuslanFingerSpelling';">${word}</span> <span style="font-family: sans-serif;">is not valid!</span>`;
  message.style.cssText = `
    position: fixed; top:50%; left:50%;
    transform: translate(-50%, -50%);
    font-size: 80px; font-weight:bold; color:red;
    background:black; padding:20px; border-radius:10px; z-index:1000;
  `;
  document.body.appendChild(message);
  setTimeout(() => message.remove(), 2000);
}

function finishButtonHandler(early=false) {
  paused = true;
  endModal.style.display = "flex";
}

// ========================= Form Submission =========================

function submitWordleResult(targetWord, guessesArray) {
  const formData = new FormData();
  formData.append("entry.1997091015", studentName);
  formData.append("entry.1671097169", studentClass);
  formData.append("entry.884909677", targetWord);
  formData.append("entry.1040569311", guessesArray.join(", "));
  formData.append("entry.1916112455", guessesArray.length);
  formData.append("entry.1856222712", new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" }));

  fetch("https://docs.google.com/forms/d/e/1FAIpQLSdrm9k5H4JSyqI8COPHubPXeHLTKMrsQTMeV_uCmSZwn3o_kA/formResponse", {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).then(() => console.log("✅ Form submitted")).catch(err => console.error(err));
}

// ========================= Keyboard Setup =========================

function setupKeyboard() {
  const keyboard = document.getElementById("onScreenKeyboard");
  if (!keyboard) return;

  keyboard.innerHTML = `<div id="keyboard-header"><button id="closeKeyboardBtn">✖</button></div>`;
  const layout = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];
  layout.forEach(r=>{
    const rowDiv = document.createElement("div");
    rowDiv.className="keyboard-row";
    r.split("").forEach(l=>{
      const key = document.createElement("button");
      key.className="key"; key.textContent=l;
      key.onclick = ()=>{ if(currentGuess.length<5){ currentGuess+=l; updateGrid(); } };
      rowDiv.appendChild(key);
    });
    keyboard.appendChild(rowDiv);
  });

  const controlRow=document.createElement("div"); controlRow.className="keyboard-row";
  const backspace=document.createElement("button"); backspace.textContent="←"; backspace.className="key wide";
  backspace.onclick = ()=>{ currentGuess=currentGuess.slice(0,-1); updateGrid(); };
  const enter=document.createElement("button"); enter.textContent="↵"; enter.className="key wide";
  enter.onclick = ()=>{ if(currentGuess.length===5){ if(!validWords.includes(currentGuess.toUpperCase())){ showInvalidWordMessage(currentGuess); return;} checkGuess(); } };
  controlRow.append(backspace, enter);
  keyboard.appendChild(controlRow);

  const closeBtn=document.getElementById("closeKeyboardBtn");
  if(closeBtn) closeBtn.onclick = ()=> keyboard.style.display="none";

  dragElement(keyboard);
}

// ========================= Drag Keyboard =========================

function dragElement(elmnt){
  const header=elmnt.querySelector("#keyboard-header");
  if(!header) return;
  let startX=0,startY=0,initialX=0,initialY=0,dragging=false;

  header.addEventListener("mousedown", e=>{
    e.preventDefault(); dragging=true;
    startX=e.clientX; startY=e.clientY;
    initialX=elmnt.offsetLeft; initialY=elmnt.offsetTop;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopDrag);
  });

  header.addEventListener("touchstart", e=>{
    e.preventDefault(); dragging=true;
    const touch=e.touches[0]; startX=touch.clientX; startY=touch.clientY;
    initialX=elmnt.offsetLeft; initialY=elmnt.offsetTop;
    document.addEventListener("touchmove", onTouchMove, {passive:false});
    document.addEventListener("touchend", stopDrag);
  });

  function onMouseMove(e){ if(!dragging) return; elmnt.style.left=initialX+(e.clientX-startX)+"px"; elmnt.style.top=initialY+(e.clientY-startY)+"px"; elmnt.style.transform="none"; }
  function onTouchMove(e){ if(!dragging) return; const t=e.touches[0]; elmnt.style.left=initialX+(t.clientX-startX)+"px"; elmnt.style.top=initialY+(t.clientY-startY)+"px"; elmnt.style.transform="none"; e.preventDefault();}
  function stopDrag(){ dragging=false; document.removeEventListener("mousemove",onMouseMove); document.removeEventListener("mouseup",stopDrag); document.removeEventListener("touchmove",onTouchMove); document.removeEventListener("touchend",stopDrag);}
}
