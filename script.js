const wordList = ["apple", "grape", "peach", "melon", "berry"];
let targetWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
let currentGuess = "";
let row = 0;

function showSign(letter) {
    if (currentGuess.length < 5) {
        currentGuess += letter;
        updateGrid();
    }
}

function updateGrid() {
    const grid = document.getElementById("word-grid");
    grid.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        let box = document.createElement("div");
        box.className = "letter-box";
        box.textContent = currentGuess[i] || "";
        grid.appendChild(box);
    }
}

function submitWord() {
    if (currentGuess.length < 5) return;
    let result = checkWord(currentGuess);
    colorBoxes(result);
    currentGuess = "";
}

function checkWord(guess) {
    let result = [];
    for (let i = 0; i < 5; i++) {
        if (guess[i] === targetWord[i]) {
            result.push("correct");
        } else if (targetWord.includes(guess[i])) {
            result.push("present");
        } else {
            result.push("absent");
        }
    }
    return result;
}

function colorBoxes(result) {
    const boxes = document.getElementsByClassName("letter-box");
    for (let i = 0; i < 5; i++) {
        boxes[i].classList.add(result[i]);
    }
}

function deleteLetter() {
    currentGuess = currentGuess.slice(0, -1);
    updateGrid();
}
const wordList = [
    "hands", "thumb", "smile", "quiet", "teach", "learn", "watch", "point", "touch", "space",
    "group", "flash", "glove", "shape", "hello", "right", "mimic", "blink", "mouth", "words",
    "greet", "world", "flick", "plane", "round", "holme", "story", "sight", "happy", "tiger",
    "koala", "green", "black", "seven", "three", "angry", "shock", "proud", "aunty", "uncle",
    "sheep", "horse"
];

let chosenWord = wordList[Math.floor(Math.random() * wordList.length)];
let attempts = 0;
const maxAttempts = 6;
const guesses = [];

function checkGuess(guess) {
    if (attempts >= maxAttempts) {
        alert(`Game Over! The word was: ${chosenWord}`);
        return;
    }
    
    guess = guess.toLowerCase();
    guesses.push(guess);
    attempts++;
    
    displayGuesses();
    
    if (guess === chosenWord) {
        showClapGif();
        alert("Congratulations! You got it right!");
    } else if (attempts === maxAttempts) {
        alert(`Out of attempts! The correct word was: ${chosenWord}`);
    }
}

function displayGuesses() {
    let guessList = document.getElementById("guess-list");
    guessList.innerHTML = "";
    guesses.forEach(g => {
        let listItem = document.createElement("li");
        listItem.textContent = g;
        guessList.appendChild(listItem);
    });
}

function showClapGif() {
    let gif = document.getElementById("clap-gif");
    gif.style.display = "block";
}

document.getElementById("submit-btn").addEventListener("click", function() {
    let guessInput = document.getElementById("guess-input").value;
    checkGuess(guessInput);
});
