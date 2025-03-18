console.log("🚀 JavaScript is running!");

// Global Variables
let words = [];
let correctWord = "";
let currentGuess = "";
let attempts = 0;
const maxAttempts = 6;
const rows = document.querySelectorAll(".row");
let currentRow = 0;

// Load Words
fetch('wordle_words.json')
    .then(response => response.json())
    .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Word list is empty or invalid.");
        }
        words = data;
        correctWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
        console.log("Correct Word:", correctWord);
    })
    .catch(error => console.error("Error loading words:", error));

// Handle Key Press
document.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);

    if (event.key.length === 1 && event.key.match(/[a-zA-Z]/i) && currentGuess.length < 5) {
        currentGuess += event.key.toUpperCase();
        console.log("Updated Guess:", currentGuess);
        updateGrid();
    } else if (event.key === "Backspace" && currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        console.log("Updated Guess after backspace:", currentGuess);
        updateGrid();
    } else if (event.key === "Enter" && currentGuess.length === 5) {
        checkGuess();
    }
});

// Update Grid Display
function updateGrid() {
    console.log("Updating grid... Current Guess:", currentGuess);
    const cells = rows[currentRow].querySelectorAll(".cell");
    cells.forEach((cell, index) => {
        cell.textContent = currentGuess[index] || "";
        cell.style.fontFamily = "'AuslanFingerSpelling', sans-serif";
    });
}

// Check Guess Logic
function checkGuess() {
    if (!correctWord) return;
    
    const guessArray = currentGuess.split("");
    const correctArray = correctWord.split("");
    const cells = rows[currentRow].querySelectorAll(".cell");
    let remainingLetters = [...correctArray];

    // ✅ Green: Correct letter in the correct position
    guessArray.forEach((letter, index) => {
        if (letter === correctArray[index]) {
            cells[index].style.backgroundColor = "green";
            cells[index].style.color = "white";
            remainingLetters[index] = null;
        }
    });

    // ✅ Orange: Correct letter in the wrong position
    guessArray.forEach((letter, index) => {
        if (remainingLetters.includes(letter) && cells[index].style.backgroundColor !== "green") {
            cells[index].style.backgroundColor = "orange";
            cells[index].style.color = "white";
            remainingLetters[remainingLetters.indexOf(letter)] = null;
        }
    });

    // ✅ Red: Incorrect letter
    guessArray.forEach((letter, index) => {
        if (!correctArray.includes(letter)) {
            cells[index].style.backgroundColor = "red";
            cells[index].style.color = "white";
        }
    });

    attempts++;

    if (currentGuess === correctWord) {
        showAuslanClap();
    } else if (attempts >= maxAttempts) {
        alert(`The correct word was: ${correctWord}`);
    } else {
        currentGuess = "";
        currentRow++;
    }
}

// Show Auslan Clap Animation
function showAuslanClap() {
    const clapGif = document.getElementById("Auslan Clap");
    clapGif.style.display = "block";
    setTimeout(() => {
        clapGif.style.display = "none";
    }, 3000);
}
