// 🚀 JavaScript is running!

let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const finishButton = document.getElementById("finish-btn");
const endModal = document.getElementById("end-modal");
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

  setupKeyboard();
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

document.addEventListener("keydown", (event) => {
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
});

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

  if (currentGuess === correctWord) {
    currentGuess = "";
    submitWordleResult(correctWord, guessesList);
    showAuslanClap();
    setTimeout(showPlayAgainButton, 3000);
  } else {
    attempts++;
    if (attempts >= maxAttempts) {
      alert(`The correct word was: ${correctWord}`);
      submitWordleResult(correctWord, guessesList);
      showPlayAgainButton();
    } else {
      setTimeout(() => {
        currentGuess = "";
        currentRow++;
        updateGrid();
      }, 2000);
    }
  }
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

function showPlayAgainButton() {
  let button = document.getElementById("playAgain");
  if (!button) {
    button = document.createElement("img");
    button.id = "playAgain";
    button.src = "assets/Again.png";
    button.alt = "Play Again";
    button.style.position = "fixed";
    button.style.bottom = "5vh";
    button.style.left = "50%";
    button.style.transform = "translateX(-50%)";
    button.style.cursor = "pointer";
    button.style.width = "200px";
    button.style.zIndex = "1000";
    document.body.appendChild(button);
  }
  button.style.display = "block";
  button.addEventListener("click", () => location.reload());
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

function setupKeyboard() {
  const keyboard = document.getElementById("onScreenKeyboard");
  const toggleBtn = document.getElementById("KeyboardBtn");
  if (!keyboard || !Btn) return;

  keyboard.innerHTML = `
    <button id="closeKeyboardBtn" style="font-size: 20px; font-weight: bold; background: none; border: none; cursor: pointer;">✖</button>
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
  enter.textContent = "ENTER";
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

  KeyboardBtn.onclick = () => keyboard.style.display = keyboard.style.display === "none" ? "block" : "none";

  setTimeout(() => {
    const closeBtn = document.getElementById("closeKeyboardBtn");
    if (closeBtn) closeBtn.onclick = () => keyboard.style.display = "none";
  }, 0);

  dragElement(keyboard);
}

function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = elmnt.querySelector("#keyboard-header");

  if (header) {
    header.onmousedown = dragMouseDown;
    header.ontouchstart = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    if (e.type === "touchstart") {
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;
      document.ontouchmove = elementDrag;
      document.ontouchend = closeDragElement;
    } else {
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    let clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    let clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    pos1 = pos3 - clientX;
    pos2 = pos4 - clientY;
    pos3 = clientX;
    pos4 = clientY;

    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.transform = "none";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
}
