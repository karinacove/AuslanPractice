(() => {
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  let studentInfoDiv;
  let gameContainer;
  let stopButton;
  let endModal;
  let endModalContent;
  let keyboardBtn;
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

  // ==== DOMContentLoaded: wire up UI ====
  document.addEventListener("DOMContentLoaded", () => {
    studentInfoDiv = document.getElementById("student-info");
    gameContainer = document.getElementById("game-container");
    stopButton = document.getElementById("stop-btn");
    endModal = document.getElementById("end-modal");
    endModalContent = document.getElementById("end-modal-content");
    keyboardBtn = document.getElementById("keyboard-btn");
    onScreenKeyboard = document.getElementById("onScreenKeyboard");
    AuslanClap = document.getElementById("AuslanClap");
    rows = document.querySelectorAll(".row");

    if (!studentName || !studentClass) {
      alert("Please log in first.");
      window.location.href = "../index.html";
      return; // stop further setup
    } else {
      if (studentInfoDiv) studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
      if (gameContainer) gameContainer.style.display = "block";
    }

    // Stop button opens the PAUSE modal
    if (stopButton) {
      stopButton.addEventListener("click", () => {
        showEndModal({ paused: true });
      });
    }

    // On-screen keyboard toggle
    if (keyboardBtn) {
      keyboardBtn.addEventListener("click", () => {
        if (!onScreenKeyboard) return;
        onScreenKeyboard.style.display = onScreenKeyboard.style.display === "none" ? "block" : "none";
      });
    }

    // Attach keyboard listener (it will be blocked while modal is open)
    document.addEventListener("keydown", keydownHandler);

    // Build on-screen keyboard
    setupKeyboard();
  });

  // ==== Load word lists ====
  fetch("wordle_words.json")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data.words)) {
        words = data.words.map((w) => w.toUpperCase());
        correctWord = words[Math.floor(Math.random() * words.length)] || "";
        console.log("Correct Word:", correctWord);
      }
    })
    .catch((err) => console.error("Error loading word list:", err));

  fetch("valid_words.json")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data.validWords)) {
        validWords = data.validWords.map((w) => w.toUpperCase());
        console.log("✅ Valid words loaded:", validWords.length);
      }
    })
    .catch((err) => console.error("Error loading valid words:", err));

  // ==== Keyboard handling ====
  function keydownHandler(event) {
    // If modal is open (pause or end) block typing
    if (endModal && endModal.style.display === "flex") return;

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

  // ==== Grid updates / checks ====
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

    // mark greens
    guessArray.forEach((letter, index) => {
      if (letter === correctArray[index]) {
        cells[index].style.backgroundColor = "green";
        cells[index].style.color = "black";
        remainingLetters[index] = null;
      }
    });

    // mark oranges
    guessArray.forEach((letter, index) => {
      if (remainingLetters.includes(letter) && cells[index].style.backgroundColor !== "green") {
        cells[index].style.backgroundColor = "orange";
        cells[index].style.color = "black";
        remainingLetters[remainingLetters.indexOf(letter)] = null;
      }
    });

    // mark reds
    guessArray.forEach((letter, index) => {
      if (!cells[index].style.backgroundColor) {
        cells[index].style.backgroundColor = "red";
      }
    });

    const guessedCorrectly = currentGuess === correctWord;
    attempts++;

    if (guessedCorrectly || attempts >= maxAttempts) {
      currentGuess = "";
      // submit result then show end-of-game modal (not a pause)
      submitWordleResult(correctWord, guessesList);
      showEndModal({ paused: false, success: guessedCorrectly });
    } else {
      // move to next row after a short pause so user sees colours
      setTimeout(() => {
        currentGuess = "";
        currentRow++;
        updateGrid();
      }, 1000);
    }
  }

  // ==== Modal (used for both PAUSE and END-OF-GAME) ====
  // showEndModal({ paused: true }) --> pause
  // showEndModal({ paused: false, success: true/false }) --> end-of-game
  function showEndModal({ paused = false, success = false } = {}) {
    if (!endModal || !endModalContent) return;

    const showContinue = !!paused;
    let html = "";

    if (paused) {
      html += `<h2 style="font-family: sans-serif; text-align:center;">Game Paused</h2>`;
    } else if (success) {
      // success end-of-game
      showAuslanClap();
      html += `<h2 style="font-family: sans-serif; text-align:center;">Congratulations!</h2>`;
      html += `<p style="font-family: sans-serif; text-align:center;">You guessed the word in ${guessesList.length} attempts.</p>`;
      html += `<div style="font-family: 'AuslanFingerSpelling', sans-serif; font-size:60px; text-align:center; margin-bottom:10px;">${correctWord}</div>`;
      html += `<div style="text-align:center;"><img src="assets/auslan-clap.gif" style="max-width:160px; height:auto;" alt="Clap"></div>`;
    } else {
      // unsuccessful end-of-game
      html += `<h2 style="font-family: sans-serif; text-align:center;">Unlucky!</h2>`;
      html += `<p style="font-family: sans-serif; text-align:center;">The correct word was:</p>`;
      html += `<div style="font-family: 'AuslanFingerSpelling', sans-serif; font-size:60px; text-align:center; margin-bottom:10px;">${correctWord}</div>`;
      html += `<div style="text-align:center;"><img src="assets/unlucky.png" style="max-width:120px; height:auto;" alt="Unlucky"></div>`;
    }

    // buttons: Continue only for paused; Again + Finish always present
    html += `<div style="display:flex; gap:16px; justify-content:center; align-items:center; margin-top:18px;">`;
    if (showContinue) {
      html += `<img id="continue-btn" src="assets/continue.png" alt="Continue" />`;
    }
    html += `<img id="again-btn" src="assets/again.png" alt="Play Again" />`;
    html += `<img id="finish-btn" src="assets/finish.png" alt="Finish" />`;
    html += `</div>`;

    endModalContent.innerHTML = html;
    endModal.style.display = "flex";

    // If end-of-game, disable keyboard input by removing listener. If paused, keep listener attached
    if (!paused) {
      document.removeEventListener("keydown", keydownHandler);
    }

    // Attach listeners to newly-created buttons
    const continueBtn = document.getElementById("continue-btn");
    const againBtn = document.getElementById("again-btn");
    const finishBtn = document.getElementById("finish-btn");

    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        // just close modal and resume (no state changes)
        endModal.style.display = "none";
        // ensure keyboard works
        document.addEventListener("keydown", keydownHandler);
      });
    }

    if (againBtn) {
      againBtn.addEventListener("click", () => {
        // restart fresh
        location.reload();
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        // submit (already submitted at game end too) and return to index
        submitWordleResult(correctWord, guessesList);
        window.location.href = "../index.html";
      });
    }
  }

  // ==== Small helpers ====
  function showAuslanClap() {
    if (!AuslanClap) return;
    AuslanClap.src = "assets/auslan-clap.gif";
    AuslanClap.style.display = "block";
    setTimeout(() => {
      AuslanClap.style.display = "none";
    }, 3000);
  }

  function showInvalidWordMessage(word) {
    const message = document.createElement("div");
    message.innerHTML = `<span style="font-family: 'AuslanFingerSpelling', sans-serif;">${word}</span> <span style="font-family: sans-serif;">is not a valid word!</span>`;
    Object.assign(message.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "48px",
      fontWeight: "bold",
      color: "red",
      backgroundColor: "black",
      padding: "14px 20px",
      borderRadius: "10px",
      zIndex: "10000",
      textAlign: "center"
    });
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 1600);
  }

  // ==== Submit results to Google Form ====
  function submitWordleResult(targetWord, guessesArray) {
    const guessList = Array.isArray(guessesArray) ? guessesArray.join(", ") : "";
    const numGuesses = Array.isArray(guessesArray) ? guessesArray.length : 0;
    const timestamp = new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });

    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdrm9k5H4JSyqI8COPHubPXeHLTKMrsQTMeV_uCmSZwn3o_kA/formResponse";
    const formData = new FormData();
    formData.append("entry.1997091015", studentName);
    formData.append("entry.1671097169", studentClass);
    formData.append("entry.884909677", targetWord);
    formData.append("entry.1040569311", guessList);
    formData.append("entry.1916112455", numGuesses);
    formData.append("entry.1856222712", timestamp);

    // no-cors to avoid CORS blocking in client send
    fetch(formURL, { method: "POST", mode: "no-cors", body: formData })
      .then(() => console.log("✅ Form submitted"))
      .catch((err) => console.error("❌ Form error:", err));
  }

  // ==== On-screen keyboard builder & drag support ====
  function setupKeyboard() {
    if (!onScreenKeyboard) return;

    onScreenKeyboard.innerHTML = `<div id="keyboard-header" style="cursor:grab;padding:6px;text-align:right;"><button id="closeKeyboardBtn" style="font-size:16px">✖</button></div>`;

    const layout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    layout.forEach(row => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "keyboard-row";
      row.split("").forEach(letter => {
        const key = document.createElement("button");
        key.className = "key";
        key.textContent = letter;
        key.addEventListener("click", () => {
          if (currentGuess.length < 5) {
            currentGuess += letter;
            updateGrid();
          }
        });
        rowDiv.appendChild(key);
      });
      onScreenKeyboard.appendChild(rowDiv);
    });

    const controlRow = document.createElement("div");
    controlRow.className = "keyboard-row";
    controlRow.style.marginTop = "6px";

    const backspace = document.createElement("button");
    backspace.textContent = "←";
    backspace.className = "key wide";
    backspace.onclick = () => {
      currentGuess = currentGuess.slice(0, -1);
      updateGrid();
    };

    const enter = document.createElement("button");
    enter.textContent = "↵";
    enter.className = "key wide";
    enter.onclick = () => {
      if (currentGuess.length === 5) {
        if (!validWords.includes(currentGuess.toUpperCase())) {
          showInvalidWordMessage(currentGuess);
          return;
        }
        checkGuess();
      }
    };

    controlRow.append(backspace, enter);
    onScreenKeyboard.appendChild(controlRow);

    const closeBtn = document.getElementById("closeKeyboardBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => onScreenKeyboard.style.display = "none");
      closeBtn.addEventListener("touchstart", () => onScreenKeyboard.style.display = "none", { passive: true });
    }

    dragElement(onScreenKeyboard);
  }

  function dragElement(elmnt) {
    if (!elmnt) return;
    const header = elmnt.querySelector("#keyboard-header");
    if (!header) return;

    let startX = 0, startY = 0, initialX = 0, initialY = 0, dragging = false;

    header.addEventListener("mousedown", (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = elmnt.offsetLeft;
      initialY = elmnt.offsetTop;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", stopDrag);
    });

    header.addEventListener("touchstart", (e) => {
      e.preventDefault();
      dragging = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      initialX = elmnt.offsetLeft;
      initialY = elmnt.offsetTop;
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", stopDrag);
    });

    function onMouseMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      elmnt.style.left = `${initialX + dx}px`;
      elmnt.style.top = `${initialY + dy}px`;
      elmnt.style.transform = "none";
    }

    function onTouchMove(e) {
      if (!dragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      elmnt.style.left = `${initialX + dx}px`;
      elmnt.style.top = `${initialY + dy}px`;
      elmnt.style.transform = "none";
      e.preventDefault();
    }

    function stopDrag() {
      dragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", stopDrag);
    }
  }

})(); 
