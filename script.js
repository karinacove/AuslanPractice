console.log("🚀 JavaScript is running!");

function adjustZoom() {
    let scale = window.innerWidth / document.documentElement.clientWidth;
    document.body.style.transformOrigin = "top center";
    document.documentElement.style.overflow = "hidden";
    document.body.style.transform = "scale(0.25)";
}

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
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (!data.words || !Array.isArray(data.words) || data.words.length === 0) {
            throw new Error("Word list is empty or invalid.");
        }
        words = data.words;  // ✅ Extracts the "words" array correctly
        correctWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
        console.log("Correct Word:", correctWord);
    })
    .catch(error => {
        console.error("Error loading words:", error);
    });


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

function updateGrid() {
    console.log("Updating grid... Current Guess:", currentGuess);
    const cells = rows[currentRow].querySelectorAll(".cell");
    cells.forEach((cell, index) => {
        cell.textContent = currentGuess[index] || "";
        cell.style.fontFamily = "'AuslanFingerSpelling', sans-serif";
        cell.style.fontSize = "200px";
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
        if (cells[index].style.backgroundColor !== "green" && cells[index].style.backgroundColor !== "orange") {
            cells[index].style.backgroundColor = "red";
        }
    });

   if (currentGuess === correctWord) {
    console.log("🎉 Correct word guessed! Showing Auslan Clap...");
    showAuslanClap();
} else {
    showIncorrectWordMessage(currentGuess);
    attempts++;
    
    if (attempts >= maxAttempts) {
        alert(`The correct word was: ${correctWord}`);
    } else {
        setTimeout(() => {
            currentGuess = "";
            currentRow++;
            updateGrid();
        }, 2000); // 2-second delay
    }
}
function showIncorrectWordMessage(word) {
    const message = document.createElement("div");
    message.textContent = word;
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
    message.style.textAlign = "center";

    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 2000); // Display for 2 seconds
}

}  // ✅ Function `checkGuess` now properly ends here

// ✅ Move `showAuslanClap` OUTSIDE `checkGuess`
function showAuslanClap() {
    const clapGif = document.getElementById("AuslanClap");  

    if (clapGif) {  // Check if the element exists
        clapGif.src = "assets/auslan-clap.gif";  
        clapGif.style.display = "block";
        
        setTimeout(() => {
            clapGif.style.display = "none";
        }, 3000);
    } else {
        console.error("❌ Auslan Clap GIF not found! Check file name and path.");
    }
}
