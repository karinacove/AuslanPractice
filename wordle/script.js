(() => {
  // ==== STUDENT INFO ====
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  // ==== DOM ELEMENTS ====
  let studentInfoDiv;
  let gameContainer;
  let stopBtn;
  let endModal;
  let endModalContent;
  let onScreenKeyboard;
  let AuslanClap;
  let rows;

  // ==== GAME STATE ====
  let words = [];
  let validWords = [];
  let correctWord = "";
  let currentGuess = "";
  let attempts = 0;
  const maxAttempts = 6;
  let currentRow = 0;
  let guessesList = [];

  // ==== DOMContentLoaded ====
  document.addEventListener("DOMContentLoaded", () => {
    studentInfoDiv = document.getElementById("student-info");
    gameContainer = document.getElementById("game-container");
    stopBtn = document.getElementById("stop-btn");
    endModal = document.getElementById("end-modal");
    endModalContent = document.getElementById("end-modal-content");
    onScreenKeyboard = document.getElementById("onScreenKeyboard");
    AuslanClap = document.getElementById("AuslanClap");
    rows = document.querySelectorAll(".row");

    // Check student login
    if (!studentName || !studentClass) {
      alert("Please log in first.");
      window.location.href = "../index.html";
      return;
    } else if (studentInfoDiv) {
      studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
      if (gameContainer) gameContainer.style.display = "block";
    }

    // STOP button = PAUSE modal
    if (stopBtn) stopBtn.addEventListener("click", () => showEndModal({ paused: true }));

    // On-screen keyboard toggle
    const keyboardBtn = document.getElementById("keyboard-btn");
    if (keyboardBtn) {
      keyboardBtn.addEventListener("click", () => {
        if (!onScreenKeyboard) return;
        onScreenKeyboard.style.display = onScreenKeyboard.style.display === "none" ? "block" : "none";
      });
    }

    // Keyboard listener
    document.addEventListener("keydown", keydownHandler);

    // Build on-screen keyboard
    setupKeyboard();
  });

  // ==== LOAD WORD LISTS ====
  fetch("wordle_words.json")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data.words)) {
        words = data.words.map(w => w.toUpperCase());
        correctWord = words[Math.floor(Math.random() * words.length)] || "";
        console.log("Correct Word:", correctWord);
      }
    }).catch(err => console.error("Error loading word list:", err));

  fetch("valid_words.json")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data.validWords)) validWords = data.validWords.map(w => w.toUpperCase());
    }).catch(err => console.error("Error loading valid words:", err));

  // ==== KEYBOARD HANDLER ====
  function keydownHandler(event) {
    if (endModal && endModal.style.display === "flex") return;

    if (event.key.length === 1 && /[a-zA-Z]/i.test(event.key) && currentGuess.length < 5) {
      currentGuess += event.key.toUpperCase();
      updateGrid();
    } else if (event.key === "Backspace") {
      currentGuess = currentGuess.slice(0, -1);
      updateGrid();
    } else if (event.key === "Enter" && currentGuess.length === 5) {
      if (!validWords.includes(currentGuess)) return showInvalidWordMessage(currentGuess);
      checkGuess();
    }
  }

  // ==== GRID UPDATES ====
  function updateGrid() {
    if (!rows || !rows[currentRow]) return;
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
    let remainingLetters = [...correctArray];

    // Mark green
    guessArray.forEach((letter, i) => {
      if (letter === correctArray[i]) {
        cells[i].style.backgroundColor = "green";
        cells[i].style.color = "black";
        remainingLetters[i] = null;
      }
    });

    // Mark orange
    guessArray.forEach((letter, i) => {
      if (remainingLetters.includes(letter) && cells[i].style.backgroundColor !== "green") {
        cells[i].style.backgroundColor = "orange";
        cells[i].style.color = "black";
        remainingLetters[remainingLetters.indexOf(letter)] = null;
      }
    });

    // Mark red
    guessArray.forEach((letter, i) => {
      if (!cells[i].style.backgroundColor) cells[i].style.backgroundColor = "red";
    });

    const guessedCorrectly = currentGuess === correctWord;
    attempts++;

    if (guessedCorrectly || attempts >= maxAttempts) {
      currentGuess = "";
      submitWordleResult(correctWord, guessesList);
      showEndModal({ paused: false, success: guessedCorrectly });
    } else {
      setTimeout(() => {
        currentGuess = "";
        currentRow++;
        updateGrid();
      }, 1000);
    }
  }

  // ==== MODAL ====
  function showEndModal({ paused = false, success = false } = {}) {
    if (!endModal || !endModalContent) return;

    let html = "";
    if (paused) html += `<h2>Game Paused</h2>`;
    else if (success) html += `<h2>Congratulations!</h2><p>You guessed the word in ${guessesList.length} attempts.</p>`;
    else html += `<h2>Unlucky!</h2><p>The correct word was:</p><div style="font-family:'AuslanFingerSpelling'; font-size:60px;">${correctWord}</div>`;

    // Buttons row
    html += `<div style="display:flex; justify-content:center; gap:12px; margin-top:16px;">`;
    if (paused) html += `<img id="continue-btn" src="assets/continue.png" alt="Continue" />`;
    html += `<img id="again-btn" src="assets/again.png" alt="Play Again" />`;
    html += `<img id="finish-btn" src="assets/finish.png" alt="Finish" />`;
    html += `</div>`;

    endModalContent.innerHTML = html;
    endModal.style.display = "flex";

    const continueBtn = document.getElementById("continue-btn");
    const againBtn = document.getElementById("again-btn");
    const finishBtn = document.getElementById("finish-btn");

    if (continueBtn) continueBtn.addEventListener("click", () => {
      endModal.style.display = "none";
      document.addEventListener("keydown", keydownHandler);
    });
    if (againBtn) againBtn.addEventListener("click", () => location.reload());
    if (finishBtn) finishBtn.addEventListener("click", () => {
      submitWordleResult(correctWord, guessesList);
      window.location.href = "../index.html";
    });

    if (!paused) document.removeEventListener("keydown", keydownHandler);
  }

  // ==== INVALID WORD MESSAGE ====
  function showInvalidWordMessage(word) {
    const message = document.createElement("div");
    message.innerHTML = `<span style="font-family:'AuslanFingerSpelling';">${word}</span> is not valid!`;
    Object.assign(message.style, {
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "48px", fontWeight: "bold", color: "red",
      backgroundColor: "black", padding: "14px 20px",
      borderRadius: "10px", zIndex: "10000", textAlign: "center"
    });
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 1600);
  }

  // ==== GOOGLE FORM SUBMISSION ====
  function submitWordleResult(targetWord, guessesArray) {
    const guessList = Array.isArray(guessesArray) ? guessesArray.join(", ") : "";
    const numGuesses = guessesArray.length || 0;
    const timestamp = new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });

    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdrm9k5H4JSyqI8COPHubPXeHLTKMrsQTMeV_uCmSZwn3o_kA/formResponse";
    const formData = new FormData();
    formData.append("entry.1997091015", studentName);
    formData.append("entry.1671097169", studentClass);
    formData.append("entry.884909677", targetWord);
    formData.append("entry.1040569311", guessList);
    formData.append("entry.1916112455", numGuesses);
    formData.append("entry.1856222712", timestamp);

    fetch(formURL, { method: "POST", mode: "no-cors", body: formData })
      .then(() => console.log("✅ Form submitted"))
      .catch(err => console.error("❌ Form error:", err));
  }

  // ==== ON-SCREEN KEYBOARD ====
  function setupKeyboard() {
    if (!onScreenKeyboard) return;

    onScreenKeyboard.innerHTML = `<div id="keyboard-header" style="cursor:grab;padding:6px;text-align:right;"><button id="closeKeyboardBtn" style="font-size:16px">✖</button></div>`;

    ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"].forEach(row => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "keyboard-row";
      row.split("").forEach(letter => {
        const key = document.createElement("button");
        key.className = "key";
        key.textContent = letter;
        key.onclick = () => {
          if (currentGuess.length < 5) { currentGuess += letter; updateGrid(); }
        };
        rowDiv.appendChild(key);
      });
      onScreenKeyboard.appendChild(rowDiv);
    });

    const controlRow = document.createElement("div");
    controlRow.className = "keyboard-row";
    const backspace = document.createElement("button");
    backspace.textContent = "←"; backspace.className = "key wide";
    backspace.onclick = () => { currentGuess = currentGuess.slice(0, -1); updateGrid(); };
    const enter = document.createElement("button");
    enter.textContent = "↵"; enter.className = "key wide";
    enter.onclick = () => { if (currentGuess.length === 5 && validWords.includes(currentGuess)) checkGuess(); };
    controlRow.append(backspace, enter);
    onScreenKeyboard.appendChild(controlRow);

    const closeBtn = document.getElementById("closeKeyboardBtn");
    if (closeBtn) closeBtn.addEventListener("click", () => onScreenKeyboard.style.display = "none");

    dragElement(onScreenKeyboard);
  }

  function dragElement(elmnt) {
    if (!elmnt) return;
    const header = elmnt.querySelector("#keyboard-header");
    if (!header) return;

    let startX = 0, startY = 0, initialX = 0, initialY = 0, dragging = false;

    const startDrag = (clientX, clientY) => {
      dragging = true; startX = clientX; startY = clientY;
      initialX = elmnt.offsetLeft; initialY = elmnt.offsetTop;
    };

    const onMove = (clientX, clientY) => {
      if (!dragging) return;
      elmnt.style.left = `${initialX + clientX - startX}px`;
      elmnt.style.top = `${initialY + clientY - startY}px`;
      elmnt.style.transform = "none";
    };

    const stopDrag = () => dragging = false;

    header.addEventListener("mousedown", e => { e.preventDefault(); startDrag(e.clientX, e.clientY); document.addEventListener("mousemove", moveHandler); document.addEventListener("mouseup", stopHandler); });
    header.addEventListener("touchstart", e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); document.addEventListener("touchmove", touchMoveHandler, {passive:false}); document.addEventListener("touchend", stopHandler); });

    const moveHandler = e => onMove(e.clientX, e.clientY);
    const touchMoveHandler = e => { const t = e.touches[0]; onMove(t.clientX, t.clientY); e.preventDefault(); };
    const stopHandler = () => { stopDrag(); document.removeEventListener("mousemove", moveHandler); document.removeEventListener("mouseup", stopHandler); document.removeEventListener("touchmove", touchMoveHandler); document.removeEventListener("touchend", stopHandler); };
  }

})();
