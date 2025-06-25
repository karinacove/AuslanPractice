// 🚀 JavaScript is running!

let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const finishButton = document.getElementById("finish-btn");
const endModal = document.getElementById("end-modal");
const endModalContent = document.getElementById("end-modal-content");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const logoutImg = document.getElementById("logout-btn");
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
  if (finishButton) {
    finishButton.addEventListener("click", () => {
      finishButton.style.display = "none";
      finishButtonHandler(true);
    });
  }

  if (againBtn) {
    againBtn.addEventListener("click", () => {
      endModal.style.display = "none";
      location.reload();
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }

  if (logoutImg) {
    logoutImg.addEventListener("click", () => {
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentClass");
      window.location.href = "../index.html";
    });
  }
});

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
  if (endModal.style.display === "flex") return;

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

  guessArray.forEach((letter, index) => {
    if (letter === correctArray[index]) {
      cells[index].style.backgroundColor = "green";
      cells[index].style.color = "black";
      remainingLetters[index] = null;
    }
  });

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

  guessArray.forEach((letter, index) => {
    if (
      !cells[index].style.backgroundColor ||
      cells[index].style.backgroundColor === ""
    ) {
      cells[index].style.backgroundColor = "red";
    }
  });

  if (currentGuess === correctWord || attempts + 1 >= maxAttempts) {
    currentGuess = "";
    submitWordleResult(correctWord, guessesList);
    document.removeEventListener("keydown", keydownHandler);
    showEndModal(currentGuess === correctWord);
  } else {
    attempts++;
    setTimeout(() => {
      currentGuess = "";
      currentRow++;
      updateGrid();
    }, 1000);
  }
}

function showEndModal(success) {
  let message = "";
  let image = "";

  if (success) {
    showAuslanClap();
    message = `<h2 style="font-family: sans-serif">Congratulations!</h2><p style="font-family: sans-serif">You guessed the word in ${guessesList.length} attempts.</p>`;
    image = `<img src="assets/auslan-clap.gif" style="max-width: 60%; height: auto; margin: 10px auto;" alt="Clap">`;
  } else {
    message = `<h2 style="font-family: sans-serif">Unlucky!</h2><p style="font-family: sans-serif">The correct word was:</p>`;
    image = `<img src="assets/unlucky.png" style="max-width: 40%; height: auto; margin: 10px auto;" alt="Unlucky">`;
  }

  endModalContent.innerHTML = `
    ${message}
    <div style="font-family: 'AuslanFingerSpelling', sans-serif; font-size: 60px; margin-bottom: 10px;">${correctWord}</div>
    ${image}
    <img id="again-btn" src="assets/Again.png" alt="Play Again" />
    <img id="menu-btn" src="assets/menu.png" alt="Main Menu" />
    <img id="logout-btn" src="assets/logout.png" alt="Logout" />
  `;

  endModal.style.display = "flex";

  setTimeout(() => {
    document.getElementById("again-btn").onclick = () => location.reload();
    document.getElementById("menu-btn").onclick = () => window.location.href = "../index.html";
    document.getElementById("logout-btn").onclick = () => {
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentClass");
      window.location.href = "../index.html";
    };
  }, 0);
}

function showInvalidWordMessage(word) {
  const message = document.createElement("div");
  message.innerHTML = `<span style="font-family: 'AuslanFingerSpelling', sans-serif;">${word}</span> <span style="font-family: sans-serif;">is not a valid word!</span>`;
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

function finishButtonHandler(early = false) {
  if (endModal) {
    endModal.style.display = "flex";
  }
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
