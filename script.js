let words = [];
let correctWord = "";

fetch('wordle_words.json')
    .then(response => response.json())
    .then(data => {
        words = data;
        correctWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
        console.log("Correct Word:", correctWord);
    });

let currentGuess = "";
let attempts = 0;
const maxAttempts = 6;

const rows = document.querySelectorAll(".row");
let currentRow = 0;

document.addEventListener("keydown", (event) => {
    if (event.key.length === 1 && event.key.match(/[a-zA-Z]/i) && currentGuess.length < 5) {
        currentGuess += event.key.toUpperCase();
        updateGrid();
    } else if (event.key === "Backspace" && currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        updateGrid();
    } else if (event.key === "Enter" && currentGuess.length === 5) {
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
    if (!correctWord) return;
    const guessArray = currentGuess.split("");
    const correctArray = correctWord.split("");
    const cells = rows[currentRow].querySelectorAll(".cell");
    
    let remainingLetters = [...correctArray];

    guessArray.forEach((letter, index) => {
        if (letter === correctArray[index]) {
            cells[index].style.backgroundColor = "green";
            cells[index].style.color = "white";
            remainingLetters[index] = null;
        }
    guessArray.forEach((letter, index) => {
        if (remainingLetters.includes(letter) && cells[index].style.backgroundColor !== "green") {
            cells[index].style.backgroundColor = "orange";
            cells[index].style.color = "white";
        }
    remainingLetters.splice(remainingLetters.indexOf(letter) => {
        else if (cells[index].style.backgroundColor !== "green") && cells[index].style.backgroundColor !== "orange"){
            cells[index].style.backgroundColor = "red";
            cells[index].style.color = "white";
        }

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

function showAuslanClap() {
    const clapGif = document.getElementById("Auslan Clap");
    clapGif.style.display = "block";
    setTimeout(() => {
        clapGif.style.display = "none";
    }, 3000);
}
