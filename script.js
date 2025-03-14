<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auslan Wordle</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Auslan Wordle</h1>
    
    <div id="game-board" class="grid-container">
        <!-- 6 rows for attempts -->
        <div class="row"><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div></div>
        <div class="row"><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div></div>
        <div class="row"><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div></div>
        <div class="row"><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div></div>
        <div class="row"><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div></div>
        <div class="row"><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div></div>
    </div>
    
    <div id="keyboard">
        <!-- Clickable Auslan fingerspelling keyboard -->
        <div class="keyboard-row">
            <button class="key" data-key="Q">Q</button>
            <button class="key" data-key="W">W</button>
            <button class="key" data-key="E">E</button>
            <button class="key" data-key="R">R</button>
            <button class="key" data-key="T">T</button>
            <button class="key" data-key="Y">Y</button>
            <button class="key" data-key="U">U</button>
            <button class="key" data-key="I">I</button>
            <button class="key" data-key="O">O</button>
            <button class="key" data-key="P">P</button>
        </div>
        <div class="keyboard-row">
            <button class="key" data-key="A">A</button>
            <button class="key" data-key="S">S</button>
            <button class="key" data-key="D">D</button>
            <button class="key" data-key="F">F</button>
            <button class="key" data-key="G">G</button>
            <button class="key" data-key="H">H</button>
            <button class="key" data-key="J">J</button>
            <button class="key" data-key="K">K</button>
            <button class="key" data-key="L">L</button>
        </div>
        <div class="keyboard-row">
            <button class="key" id="backspace">⌫</button>
            <button class="key" data-key="Z">Z</button>
            <button class="key" data-key="X">X</button>
            <button class="key" data-key="C">C</button>
            <button class="key" data-key="V">V</button>
            <button class="key" data-key="B">B</button>
            <button class="key" data-key="N">N</button>
            <button class="key" data-key="M">M</button>
            <button class="key" id="enter">ENTER</button>
        </div>
    </div>
    
    <img id="auslan-clap" src="clap.gif" style="display: none;" alt="Auslan Clap">
    
    <script src="script.js"></script>
</body>
</html>
