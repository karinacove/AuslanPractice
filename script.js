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
