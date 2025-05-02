// 🚀 JavaScript is running!

function adjustZoom() {
    let scale = window.innerWidth / document.documentElement.clientWidth;
    document.body.style.transformOrigin = "top center";
    document.documentElement.style.overflow = "hidden";
}

let words = [];
let validWords = [];
let correctWord = "";
let currentGuess = "";
let attempts = 0;
const maxAttempts = 6;
const rows = document.querySelectorAll(".row");
let currentRow = 0;

// Load playable words
fetch('wordle_words.json')
    .then(response => response.json())
    .then(data => {
        words = data.words.map(word => word.toUpperCase());
        correctWord = words[Math.floor(Math.random() * words.length)];
        console.log("Correct Word:", correctWord);
    })
    .catch(error => console.error("Error loading word list:", error));

// Load valid words for checking
fetch("valid_words.json")
    .then(response => response.json())
    .then(data => {
       validWords = data.validWords.map(word => word.toUpperCase());
  });
    .catch(error => console.error("Error loading valid words:", error));

document.addEventListener("keydown", (event) => {
    if (event.key.length === 1 && event.key.match(/[a-zA-Z]/i) && currentGuess.length < 5) {
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
});

function updateGrid() {
    const cells = rows[currentRow].querySelectorAll(".cell");
    cells.forEach((cell, index) => {
        cell.textContent = currentGuess[index] || "";
        cell.style.fontFamily = "'AuslanFingerSpelling', sans-serif";
        cell.style.fontSize = "200px";
    });
}

function checkGuess() {
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
        if (remainingLetters.includes(letter) && cells[index].style.backgroundColor !== "green") {
            cells[index].style.backgroundColor = "orange";
            cells[index].style.color = "black";
            remainingLetters[remainingLetters.indexOf(letter)] = null;
        }
    });

    guessArray.forEach((letter, index) => {
        if (!cells[index].style.backgroundColor || cells[index].style.backgroundColor === "") {
            cells[index].style.backgroundColor = "red";
        }
    });

    if (currentGuess === correctWord) {
        showAuslanClap();
        setTimeout(showPlayAgainButton, 3000);
    } else {
        attempts++;
        if (attempts >= maxAttempts) {
            alert(`The correct word was: ${correctWord}`);
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
    message.textContent = `\"${word}\" is not a valid word!`;
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
