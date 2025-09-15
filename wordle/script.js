// 🚀 JavaScript is running!

let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const finishButton = document.getElementById("finish-btn");
const stopBtn = document.getElementById("stop-btn");
const endModal = document.getElementById("end-modal");
const endModalContent = document.getElementById("end-modal-content");
const keyboardBtn = document.getElementById("keyboard-btn");

let paused = false;

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  if (studentInfoDiv) studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  if (gameContainer) gameContainer.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  // Stop button opens the pause modal
  if (stopBtn) stopBtn.addEventListener("click", () => {
    paused = true;
    showPauseModal();
  });

 // 🔹 Keyboard button toggles the modal
if (keyboardBtn) {
  keyboardBtn.addEventListener("click", () => {
    const modal = document.querySelector(".keyboard-modal");
    if (modal) modal.style.display = "flex"; // show backdrop + keyboard
  });
}

// 🔹 Close button and backdrop click both close modal
document.addEventListener("click", (e) => {
  const modal = document.querySelector(".keyboard-modal");
  if (!modal) return;

  if (
    e.target.id === "closeKeyboardBtn" || // ❌ button
    e.target.classList.contains("keyboard-modal") // backdrop
  ) {
    modal.style.display = "none";
  }
});

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
  .then(data => validWords = data.validWords.map(w => w.toUpperCase()));

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
    if (!validWords.includes(currentGuess.toUpperCase())) {
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

  // Mark correct letters
  guessArray.forEach((letter, i) => {
    if (letter === correctArray[i]) {
      cells[i].className = "cell correct";
      remaining[i] = null;
    }
  });

  // Mark present letters
  guessArray.forEach((letter, i) => {
    if (remaining.includes(letter) && !cells[i].classList.contains("correct")) {
      cells[i].className = "cell present";
      remaining[remaining.indexOf(letter)] = null;
    }
  });

  // Mark absent letters
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

// ========================= Finish Button =========================

function finishButtonHandler() {
  paused = true;

  if (guessesList.length > 0) {
    submitWordleResult(correctWord, guessesList);
  }

  window.location.href = "../index.html";
}

// ========================= Pause Modal =========================

function showPauseModal() {
  endModal.style.display = "flex";
  endModalContent.innerHTML = `
    <h2 style="font-family: sans-serif; text-align:center;">Game Paused</h2>
    <div style="display:flex; justify-content:center; gap:15px; margin-top:20px;">
      <img id="continue-btn" src="assets/continue.png" alt="Continue" style="cursor:pointer; width:120px;">
      <img id="again-btn" src="assets/again.png" alt="Restart" style="cursor:pointer; width:120px;">
      <img id="finish-btn" src="assets/finish.png" alt="Finish" style="cursor:pointer; width:120px;">
    </div>
  `;

  document.getElementById("continue-btn").onclick = () => {
    paused = false;
    endModal.style.display = "none";
  };

  document.getElementById("again-btn").onclick = () => location.reload();
  document.getElementById("finish-btn").onclick = () => {
    endModal.style.display = "none";
    finishButtonHandler();
  };
}

// ========================= End Modal =========================

function showEndModal(success) {
  paused = true;
  let content = "";

  if (success) {
    content = `
      <div style="text-align:center;">
        <img src="assets/auslan-clap.gif" alt="Auslan Clap" style="width:50%; margin:10px auto; display:block;">
        <img src="assets/correct.png" alt="Correct" style="max-width:30%; margin:10px auto; display:block;">
        <p style="font-family: sans-serif; font-size: 22px; margin-top: 10px;">
          You guessed the word in ${guessesList.length} attempts.
        </p>
      </div>
    `;
  } else {
    content = `
      <div style="text-align:center;">
        <img src="assets/wrong.png" alt="Wrong" style="max-width:30%; margin:10px auto; display:block;">
        <p style="font-family: sans-serif; font-size: 22px; margin-top: 10px;">
          The correct word was:
        </p>
        <div style="font-family:'AuslanFingerSpelling'; font-size:60px; margin:10px;">
          ${correctWord}
        </div>
      </div>
    `;
  }

  endModalContent.innerHTML = `
    ${content}
    <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
      <img id="again-btn" src="assets/again.png" alt="Play Again" style="cursor:pointer; width:120px;">
      <img id="menu-btn" src="assets/finish.png" alt="Main Menu" style="cursor:pointer; width:120px;">
    </div>
  `;

  document.getElementById("again-btn").onclick = () => location.reload();
  document.getElementById("menu-btn").onclick = () => window.location.href = "../index.html";

  endModal.style.display = "flex";
}

// ========================= Keyboard ============================
function setupKeyboard() {
  const grid = document.getElementById("keyboard-grid");
  if (!grid) return;

  grid.innerHTML = ""; // reset

  const layout = [
    "QWERTYUIOP", // row 1
    "ASDFGHJKL",  // row 2
    "ZXCVBNM"     // row 3
  ];

  layout.forEach((row, rowIndex) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "keyboard-row";
    rowDiv.style.display = "flex";
    rowDiv.style.justifyContent = rowIndex === 2 ? "center" : "flex-start"; // bottom row centered
    rowDiv.style.marginBottom = "5px";

    row.split("").forEach((l) => {
      const key = document.createElement("button");
      key.className = "key";
      key.textContent = l;
      key.onclick = () => {
        if (currentGuess.length < 5) {
          currentGuess += l;
          updateGrid();
        }
      };
      rowDiv.appendChild(key);
    });

    // Add Backspace to first row
    if (rowIndex === 0) {
      const backspace = document.createElement("button");
      backspace.textContent = "←";
      backspace.className = "key backspace";
      backspace.onclick = () => {
        currentGuess = currentGuess.slice(0, -1);
        updateGrid();
      };
      rowDiv.appendChild(backspace);
    }

    // Add Enter to bottom row
    if (rowIndex === 2) {
      const enter = document.createElement("button");
      enter.textContent = "↵";
      enter.className = "key enter-key";
      enter.onclick = () => {
        if (currentGuess.length === 5) {
          if (!validWords.includes(currentGuess.toUpperCase())) {
            showInvalidWordMessage(currentGuess);
            return;
          }
          checkGuess();
        }
      };
      rowDiv.appendChild(enter);
    }

    grid.appendChild(rowDiv);
  });

  dragElement(document.getElementById("keyboard-container"));
}


// Drag functionality
function dragElement(elmnt){
  const header = elmnt.querySelector("#keyboard-header");
  if(!header) return;

  let startX=0, startY=0, initialX=0, initialY=0, dragging=false;

  header.addEventListener("mousedown", e=>{
    e.preventDefault(); dragging=true;
    startX=e.clientX; startY=e.clientY;
    initialX=elmnt.offsetLeft; initialY=elmnt.offsetTop;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopDrag);
  });

  header.addEventListener("touchstart", e=>{
    e.preventDefault(); dragging=true;
    const touch = e.touches[0]; startX = touch.clientX; startY = touch.clientY;
    initialX = elmnt.offsetLeft; initialY = elmnt.offsetTop;
    document.addEventListener("touchmove", onTouchMove, {passive:false});
    document.addEventListener("touchend", stopDrag);
  });

  function onMouseMove(e){ 
    if(!dragging) return; 
    elmnt.style.left = initialX + (e.clientX - startX) + "px"; 
    elmnt.style.top = initialY + (e.clientY - startY) + "px"; 
    elmnt.style.transform = "none"; 
  }

  function onTouchMove(e){ 
    if(!dragging) return; 
    const t = e.touches[0]; 
    elmnt.style.left = initialX + (t.clientX - startX) + "px"; 
    elmnt.style.top = initialY + (t.clientY - startY) + "px"; 
    elmnt.style.transform = "none"; 
    e.preventDefault(); 
  }

  function stopDrag(){ 
    dragging = false; 
    document.removeEventListener("mousemove", onMouseMove); 
    document.removeEventListener("mouseup", stopDrag); 
    document.removeEventListener("touchmove", onTouchMove); 
    document.removeEventListener("touchend", stopDrag);
  }
}

// ========================= Invalid Word Message =========================

function showInvalidWordMessage(word) {
  const message = document.createElement("div");
  message.innerHTML = `<span style="font-family:'AuslanFingerSpelling';">${word}</span> <span style="font-family:sans-serif;">is not valid!</span>`;
  message.style.cssText = `
    position: fixed; top:50%; left:50%;
    transform: translate(-50%,-50%);
    font-size:80px; font-weight:bold; color:red;
    background:black; padding:20px; border-radius:10px; z-index:1000;
  `;
  document.body.appendChild(message);
  setTimeout(() => message.remove(), 2000);
}

// ========================= Form Submission =========================

function submitWordleResult(targetWord, guessesArray) {
  const formData = new FormData();
  formData.append("entry.1997091015", studentName);
  formData.append("entry.1671097169", studentClass);
  formData.append("entry.884909677", targetWord);
  formData.append("entry.1040569311", guessesArray.join(", "));
  formData.append("entry.1916112455", guessesArray.length);
  formData.append("entry.1856222712", new Date().toLocaleString("en-AU",{timeZone:"Australia/Melbourne"}));

  fetch("https://docs.google.com/forms/d/e/1FAIpQLSdrm9k5H4JSyqI8COPHubPXeHLTKMrsQTMeV_uCmSZwn3o_kA/formResponse",{
    method:"POST",mode:"no-cors",body:formData
  }).then(()=>console.log("✅ Form submitted")).catch(err=>console.error(err));
}
