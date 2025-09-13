// 🚀 JavaScript is running!

let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const finishButton = document.getElementById("finish-btn");
const stopButton = document.getElementById("stop-btn");
const endModal = document.getElementById("end-modal");
const endModalContent = document.getElementById("end-modal-content");
const keyboardBtn = document.getElementById("keyboard-btn");

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
  if (stopButton) {
    stopButton.addEventListener("click", () => {
      showEndModal(false, true); // open modal (stop)
    });
  }

  if (finishButton) {
    finishButton.addEventListener("click", () => {
      submitWordleResult(correctWord, guessesList);
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

// =================== WORDLE GAME ===================

let words = [];
let validWords = [];
let correctWord = "";
let currentGuess = "";
let attempts = 0;
const maxAttempts = 6;
const rows = document.querySelectorAll(".row");
let currentRow = 0;
let guessesList = [];

// Load word lists
fetch("wordle_words.json")
  .then((response) => response.json())
  .then((data) => {
    words = data.words.map((word) => word.toUpperCase());
    correctWord = words[Math.floor(Math.random() * words.length)];
    console.log("Correct Word:", correctWord);
  })
  .catch((error) => console.error("Error loading word list:", error));

fetch("valid_words.json")
  .then((response) => response.json())
  .then((data) => {
    validWords = data.validWords.map((word) => word.toUpperCase());
    console.log("✅ Valid words loaded:", validWords.length);
  })
  .catch((error) => console.error("Error loading valid words:", error));

document.addEventListener("keydown", keydownHandler);

function keydownHandler(event) {
  if (endModal.style.display === "flex") return; // block typing if modal open

  if (
    event.key.length === 1 &&
    event.key.match(/[a-zA-Z]/i) &&
    currentGuess.length < 5
  ) {
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
  let remainingLetters = [...correctArray];

  // Mark greens
  guessArray.forEach((letter, index) => {
    if (letter === correctArray[index]) {
      cells[index].style.backgroundColor = "green";
      cells[index].style.color = "black";
      remainingLetters[index] = null;
    }
  });

  // Mark oranges
  guessArray.forEach((letter, index) => {
    if (
      remainingLetters.includes(letter) &&
      cells[index].style.backgroundColor !== "green"
    ) {
      cells[index].style.backgroundColor = "orange";
      cells[index].style.color = "black";
      remainingLetters[remainingLetters.indexOf(letter)] = null;
    }
  });

  // Mark reds
  guessArray.forEach((letter, index) => {
    if (!cells[index].style.backgroundColor) {
      cells[index].style.backgroundColor = "red";
    }
  });

  const guessedCorrectly = currentGuess === correctWord;
  attempts++;

  if (guessedCorrectly || attempts >= maxAttempts) {
    currentGuess = "";
    submitWordleResult(correctWord, guessesList);
    document.removeEventListener("keydown", keydownHandler);
    showEndModal(guessedCorrectly);
  } else {
    setTimeout(() => {
      currentGuess = "";
      currentRow++;
      updateGrid();
    }, 1000);
  }
}

function showEndModal(success, stopped = false) {
  let message = "";
  let image = "";

  if (stopped) {
    message = `<h2 style="font-family: sans-serif">Game Paused</h2>`;
  } else if (success) {
    showAuslanClap();
    message = `<h2 style="font-family: sans-serif">Congratulations!</h2>
               <p style="font-family: sans-serif">You guessed the word in ${guessesList.length} attempts.</p>`;
    image = `<img src="assets/auslan-clap.gif" style="max-width: 60%; height: auto; margin: 10px auto;" alt="Clap">`;
  } else {
    message = `<h2 style="font-family: sans-serif">Unlucky!</h2>
               <p style="font-family: sans-serif">The correct word was:</p>`;
    image = `<img src="assets/unlucky.png" style="max-width: 40%; height: auto; margin: 10px auto;" alt="Unlucky">`;
  }

  endModalContent.innerHTML = `
    ${message}
    ${!stopped ? `<div style="font-family: 'AuslanFingerSpelling', sans-serif; font-size: 60px; margin-bottom: 10px;">${correctWord}</div>` : ""}
    ${image}
    <img id="continue-btn" src="assets/continue.png" alt="Continue" />
    <img id="finish-btn" src="assets/finish.png" alt="Finish" />
    <img id="again-btn" src="assets/again.png" alt="Play Again" />
  `;

  endModal.style.display = "flex";

  setTimeout(() => {
    const continueBtn = document.getElementById("continue-btn");
    const againBtn = document.getElementById("again-btn");
    const finishBtn = document.getElementById("finish-btn");

    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        endModal.style.display = "none"; // resume
        document.addEventListener("keydown", keydownHandler);
      });
    }

    if (againBtn) {
      againBtn.addEventListener("click", () => {
        location.reload(); // restart
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        submitWordleResult(correctWord, guessesList);
        window.location.href = "../index.html";
      });
    }
  }, 0);
}

function showAuslanClap() {
  const clapGif = document.getElementById("AuslanClap");
  if (clapGif) {
    clapGif.src = "assets/auslan-clap.gif";
    clapGif.style.display = "block";
    setTimeout(() => {
      clapGif.style.display = "none";
    }, 3000);
  }
}

function showInvalidWordMessage(word) {
  const message = document.createElement("div");
  message.innerHTML = `<span style="font-family: 'AuslanFingerSpelling', sans-serif;">${word}</span> 
                       <span style="font-family: sans-serif;">is not a valid word!</span>`;
  message.style.position = "fixed";
  message.style.top = "50%";
  message.style.left = "50%";
  message.style.transform = "translate(-50%, -50%)";
  message.style.fontSize = "80px";
  message.style.fontWeight = "bold";
  message.style.color = "red";
  message.style.backgroundColor = "black";
  message.style.padding = "20px";
  message.style.borderRadius = "10px";
  message.style.zIndex = "1000";
  document.body.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 2000);
}

function submitWordleResult(targetWord, guessesArray) {
  const guessList = guessesArray.join(", ");
  const numGuesses = guessesArray.length;
  const timestamp = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
  });

  const formURL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdrm9k5H4JSyqI8COPHubPXeHLTKMrsQTMeV_uCmSZwn3o_kA/formResponse";

  const formData = new FormData();
  formData.append("entry.1997091015", studentName);
  formData.append("entry.1671097169", studentClass);
  formData.append("entry.884909677", targetWord);
  formData.append("entry.1040569311", guessList);
  formData.append("entry.1916112455", numGuesses);
  formData.append("entry.1856222712", timestamp);

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  })
    .then(() => {
      console.log("✅ Form submitted");
    })
    .catch((err) => {
      console.error("❌ Form error:", err);
    });
}

// =================== ON-SCREEN KEYBOARD ===================

function setupKeyboard() {
  const keyboard = document.getElementById("onScreenKeyboard");
  if (!keyboard) return;

  keyboard.innerHTML = `
    <div id="keyboard-header">
      <button id="closeKeyboardBtn">✖</button>
    </div>
  `;

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
    keyboard.appendChild(rowDiv);
  });

  const controlRow = document.createElement("div");
  controlRow.className = "keyboard-row";

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
  keyboard.appendChild(controlRow);

  const closeBtn = document.getElementById("closeKeyboardBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => keyboard.style.display = "none");
    closeBtn.addEventListener("touchstart", () => keyboard.style.display = "none", { passive: true });
  }

  dragElement(keyboard);
}

function dragElement(elmnt) {
  const header = elmnt.querySelector("#keyboard-header");
  let startX = 0, startY = 0, initialX = 0, initialY = 0, dragging = false;

  if (!header) return;

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
