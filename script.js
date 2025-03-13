document.addEventListener("DOMContentLoaded", () => {
    const wordList = ["hands", "thumb", "smile", "quiet", "teach", "learn", "watch", "point", "touch", "space", "group", "flash", "glove", "shape", "hello", "right", "mimic", "blink", "mouth", "words", "greet", "world", "flick", "plane", "round", "holme", "story", "sight", "happy", "tiger", "koala", "green", "black", "seven", "three", "angry", "shock", "proud", "aunty", "uncle", "sheep", "horse"];
    
    let secretWord = wordList[Math.floor(Math.random() * wordList.length)];
    let currentGuess = "";
    let attempt = 0;
    const maxAttempts = 6;
    
    const grid = document.getElementById("word-grid");
    const keyboard = document.getElementById("keyboard");
    const messageBox = document.getElementById("message");
    const clapGif = document.getElementById("clap-gif");
    
    function updateGrid() {
        let cells = document.querySelectorAll(".word-row[data-attempt='" + attempt + "'] .cell");
        for (let i = 0; i < cells.length; i++) {
            cells[i].textContent = currentGuess[i] || "";
        }
    }
    
    function checkGuess() {
        if (currentGuess.length < 5) return;
        
        let result = [];
        let secretArray = secretWord.split("");
        
        for (let i = 0; i < 5; i++) {
            if (currentGuess[i] === secretWord[i]) {
                result.push("correct");
                secretArray[i] = null; 
            }
        }
        for (let i = 0; i < 5; i++) {
            if (result[i] !== "correct" && secretArray.includes(currentGuess[i])) {
                result[i] = "present";
                secretArray[secretArray.indexOf(currentGuess[i])] = null;
            } else if (result[i] !== "correct") {
                result[i] = "absent";
            }
        }
        
        let cells = document.querySelectorAll(".word-row[data-attempt='" + attempt + "'] .cell");
        for (let i = 0; i < 5; i++) {
            cells[i].classList.add(result[i]);
        }
        
        if (currentGuess === secretWord) {
            messageBox.textContent = "Well done!";
            clapGif.style.display = "block";
        } else {
            attempt++;
            if (attempt === maxAttempts) {
                messageBox.textContent = "Game Over! The word was: " + secretWord;
            }
            currentGuess = "";
        }
    }
    
    function handleInput(letter) {
        if (currentGuess.length < 5) {
            currentGuess += letter;
            updateGrid();
        }
    }
    
    function handleBackspace() {
        currentGuess = currentGuess.slice(0, -1);
        updateGrid();
    }
    
    function handleEnter() {
        if (currentGuess.length === 5) {
            checkGuess();
        }
    }
    
    keyboard.addEventListener("click", (event) => {
        if (event.target.classList.contains("key")) {
            let letter = event.target.textContent.toLowerCase();
            handleInput(letter);
        }
        if (event.target.id === "backspace") {
            handleBackspace();
        }
        if (event.target.id === "enter") {
            handleEnter();
        }
    });
    
    document.addEventListener("keydown", (event) => {
        let key = event.key.toLowerCase();
        if (/^[a-z]$/.test(key)) {
            handleInput(key);
        } else if (key === "backspace") {
            handleBackspace();
        } else if (key === "enter") {
            handleEnter();
        }
    });
});
