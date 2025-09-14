(() => {
  // ==== GAME VARIABLES ====
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";
  
  let gameContainer, stopButton, endModal, endModalContent;
  let AuslanClap;
  let rows;
  let currentGuess = "";
  let currentRow = 0;
  let attempts = 0;
  const maxAttempts = 6;
  let correctWord = "";
  let guessesList = [];
  let words = [];
  let validWords = [];
  let isPaused = false;

  document.addEventListener("DOMContentLoaded", () => {
    // ==== DOM ELEMENTS ====
    gameContainer = document.getElementById("game-container");
    stopButton = document.getElementById("stop-btn");
    endModal = document.getElementById("end-modal");
    endModalContent = document.getElementById("end-modal-content");
    AuslanClap = document.getElementById("AuslanClap");
    rows = document.querySelectorAll(".row");

    // ==== STUDENT INFO CHECK ====
    if (!studentName || !studentClass) {
      alert("Please log in first.");
      window.location.href = "../index.html";
      return;
    } else {
      const studentInfoDiv = document.getElementById("student-info");
      if (studentInfoDiv) {
        studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
      }
      if (gameContainer) gameContainer.style.display = "block";
    }

    // ==== STOP / PAUSE BUTTON ====
    if (stopButton) {
      stopButton.addEventListener("click", () => {
        pauseGame();
      });
    }

    // ==== LOAD WORD LISTS ====
    fetch("wordle_words.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.words)) {
          words = data.words.map(w => w.toUpperCase());
          correctWord = words[Math.floor(Math.random() * words.length)] || "";
        }
      });

    fetch("valid_words.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.validWords)) {
          validWords = data.validWords.map(w => w.toUpperCase());
        }
      });

    // ==== KEYBOARD INPUT ====
    document.addEventListener("keydown", handleKeydown);
  });

  // ==== KEYBOARD HANDLER ====
  function handleKeydown(e) {
    if (isPaused) return; // block input when paused
    if (!rows[currentRow]) return;

    if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
      currentGuess += e.key.toUpperCase();
      updateGrid();
    } else if (e.key === "Backspace") {
      currentGuess = currentGuess.slice(0, -1);
      updateGrid();
    } else if (e.key === "Enter" && currentGuess.length === 5) {
      if (!validWords.includes(currentGuess.toUpperCase())) {
        showInvalidWordMessage(currentGuess);
        return;
      }
      checkGuess();
    }
  }

  // ==== GRID UPDATE ====
  function updateGrid() {
    const cells = rows[currentRow].querySelectorAll(".cell");
    cells.forEach((cell, i) => {
      cell.textContent = currentGuess[i] || "";
      cell.style.fontFamily = "'AuslanFingerSpelling', sans-serif";
    });
  }

  // ==== CHECK GUESS ====
  function checkGuess() {
    const guessedCorrectly = currentGuess === correctWord;
    attempts++;
    guessesList.push(currentGuess);

    const cells = rows[currentRow].querySelectorAll(".cell");
    const correctArray = correctWord.split("");
    const guessArray = currentGuess.split("");
    let remaining = [...correctArray];

    // Mark correct letters (green)
    guessArray.forEach((l, i) => {
      if (l === correctArray[i]) {
        cells[i].style.backgroundColor = "green";
        cells[i].style.color = "black";
        remaining[i] = null;
      }
    });
    // Present letters (orange)
    guessArray.forEach((l, i) => {
      if (remaining.includes(l) && cells[i].style.backgroundColor !== "green") {
        cells[i].style.backgroundColor = "orange";
        cells[i].style.color = "black";
        remaining[remaining.indexOf(l)] = null;
      }
    });
    // Absent letters (red)
    guessArray.forEach((l, i) => {
      if (!cells[i].style.backgroundColor) {
        cells[i].style.backgroundColor = "red";
        cells[i].style.color = "white";
      }
    });

    if (guessedCorrectly || attempts >= maxAttempts) {
      endGame(guessedCorrectly);
    } else {
      currentRow++;
      currentGuess = "";
      setTimeout(updateGrid, 500);
    }
  }

  // ==== PAUSE GAME ====
  function pauseGame() {
    isPaused = true;
    showModal({ paused: true });
  }

  // ==== END GAME ====
  function endGame(success) {
    isPaused = true;
    showModal({ paused: false, success });
  }

  // ==== SHOW MODAL ====
  function showModal({ paused = false, success = false }) {
    if (!endModal || !endModalContent) return;

    let html = "";
    if (paused) {
      html += `<h2 style="font-family:sans-serif;text-align:center;">Game Paused</h2>`;
    } else if (success) {
      html += `<img src="assets/correct.png" style="max-width:120px; display:block; margin:0 auto;" alt="Correct" />`;
      html += `<img src="assets/auslan-clap.gif" style="max-width:160px; display:block; margin:10px auto;" alt="Clap" />`;
      html += `<p style="font-family:sans-serif; text-align:center;">You guessed the word in ${guessesList.length} guesses!</p>`;
      html += `<div style="font-family:'AuslanFingerSpelling'; font-size:60px; text-align:center;">${correctWord}</div>`;
    } else {
      html += `<img src="assets/wrong.png" style="max-width:120px; display:block; margin:0 auto;" alt="Wrong" />`;
      html += `<p style="font-family:sans-serif; text-align:center;">The correct word was:</p>`;
      html += `<div style="font-family:'AuslanFingerSpelling'; font-size:60px; text-align:center;">${correctWord}</div>`;
    }

    // Buttons row
    html += `<div style="display:flex; justify-content:center; gap:16px; margin-top:20px;">`;
    if (paused) html += `<img id="continue-btn" src="assets/continue.png" alt="Continue" style="width:120px;cursor:pointer;">`;
    html += `<img id="again-btn" src="assets/again.png" alt="Play Again" style="width:120px;cursor:pointer;">`;
    html += `<img id="finish-btn" src="assets/finish.png" alt="Finish" style="width:120px;cursor:pointer;">`;
    html += `</div>`;

    endModalContent.innerHTML = html;
    endModal.style.display = "flex";

    // ==== BUTTON HANDLERS ====
    const continueBtn = document.getElementById("continue-btn");
    const againBtn = document.getElementById("again-btn");
    const finishBtn = document.getElementById("finish-btn");

    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        isPaused = false;
        endModal.style.display = "none";
      });
    }

    if (againBtn) {
      againBtn.addEventListener("click", () => location.reload());
    }

    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        submitWordleResult(correctWord, guessesList);
        window.location.href = "../index.html";
      });
    }
  }

  // ==== INVALID WORD MESSAGE ====
  function showInvalidWordMessage(word) {
    const msg = document.createElement("div");
    msg.innerHTML = `<span style="font-family:'AuslanFingerSpelling';">${word}</span> <span style="font-family:sans-serif;">is not valid!</span>`;
    Object.assign(msg.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "black",
      color: "red",
      padding: "14px 20px",
      borderRadius: "10px",
      zIndex: "10000",
      fontSize: "48px",
      textAlign: "center"
    });
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1600);
  }

  // ==== SUBMIT FORM ====
  function submitWordleResult(targetWord, guessesArray) {
    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdrm9k5H4JSyqI8COPHubPXeHLTKMrsQTMeV_uCmSZwn3o_kA/formResponse";
    const formData = new FormData();
    formData.append("entry.1997091015", studentName);
    formData.append("entry.1671097169", studentClass);
    formData.append("entry.884909677", targetWord);
    formData.append("entry.1040569311", guessesArray.join(", "));
    formData.append("entry.1916112455", guessesArray.length);
    formData.append("entry.1856222712", new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" }));

    fetch(formURL, { method: "POST", mode: "no-cors", body: formData });
  }

})();
