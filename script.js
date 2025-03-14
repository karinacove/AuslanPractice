const words = URL('wordle_words.json');
let correctWord = words[Math.floor(Math.random() * words.length)];
let currentGuess = "";
let attempts = 0;
const maxAttempts = 6;

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
    const cells = document.querySelectorAll(".letter-box");
    cells.forEach((cell, index) => {
        cell.textContent = currentGuess[index] || "";
    });
}

function checkGuess() {
    const guessArray = currentGuess.split("");
    const correctArray = correctWord.split("");
    const cells = document.querySelectorAll(".letter-box");
    
    guessArray.forEach((letter, index) => {
        if (letter === correctArray[index]) {
            cells[index].classList.add("correct");
        } else if (correctWord.includes(letter)) {
            cells[index].classList.add("present");
        } else {
            cells[index].classList.add("absent");
        }
    });
    
    attempts++;
    if (currentGuess === correctWord) {
        showAuslanClap();
    } else if (attempts >= maxAttempts) {
        alert(`The correct word was: ${correctWord}`);
    }
    
    currentGuess = "";
}

function showAuslanClap() {
    const clapGif = document.createElement("img");
    clapGif.src = "Auslan Clap.gif";
    clapGif.alt = "Auslan Clap";
    clapGif.style.width = "200px";
    clapGif.style.position = "absolute";
    clapGif.style.top = "50%";
    clapGif.style.left = "50%";
    clapGif.style.transform = "translate(-50%, -50%)";
    document.body.appendChild(clapGif);
    
    setTimeout(() => {
        clapGif.remove();
    }, 3000);
}
