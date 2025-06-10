(() => {
  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  let level = parseInt(urlParams.get("level")) || 1;
  if (![1,2,3].includes(level)) level = 1;

  // Get student info and topic from localStorage (or redirect if missing)
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  const topic = localStorage.getItem("selectedTopic") || "alphabet";

  if (!studentName || !studentClass) {
    alert("Please sign in first.");
    window.location.href = "index.html";
  }

  // HTML Elements
  const levelTitle = document.getElementById("levelTitle");
  const studentInfo = document.getElementById("studentInfo");
  const gameBoard = document.getElementById("gameBoard");
  const draggablesLeft = document.getElementById("draggablesLeft");
  const draggablesRight = document.getElementById("draggablesRight");
  const finishButton = document.getElementById("finishButton");

  // Constants
  const MAX_MATCHES = 9;

  // Letters a-i for simplicity; adjust as needed
  // For example for alphabet 26 letters, slice by levels or randomly select
  const alphabetLetters = "abcdefghijklmnopqrstuvwxyz".split("");

  // Prepare vocabulary for alphabet — clipart and signs are named by letter (e.g. a.png)
  // For testing: pick first 9 letters for each level (you can randomize later)
  // Level 3 will mix them

  // Helper to shuffle array
  function shuffle(arr) {
    return arr.sort(() => 0.5 - Math.random());
  }

  // Current matches tracking
  let correctMatches = 0;
  let matchedWords = new Set();

  // Set info text
  studentInfo.textContent = `Signed in as: ${studentName} (${studentClass})`;

  // Set level title
  const levelTitles = {
    1: "Level 1: Match the Sign to the Picture",
    2: "Level 2: Match the Picture to the Sign",
    3: "Level 3: Mixed Challenge",
  };
  levelTitle.textContent = levelTitles[level];

  // For level 1 & 2, fixed first 9 letters; level 3 mix of signs & clipart
  let levelVocab = alphabetLetters.slice(0, MAX_MATCHES);

  // Build game data based on level
  // Each item: { word: letter, gridType: 'clipart' | 'sign', draggableType: 'sign' | 'clipart' }
  // level 1: grid=clipart, draggable=sign
  // level 2: grid=sign, draggable=clipart
  // level 3: mix half grid clipart & half grid signs; draggable is opposite
  let gameItems = [];

  if (level === 1) {
    // grid: clipart, draggable: sign
    gameItems = levelVocab.map(letter => ({
      word: letter,
      gridType: "clipart",
      draggableType: "sign",
    }));
  } else if (level === 2) {
    // grid: sign, draggable: clipart
    gameItems = levelVocab.map(letter => ({
      word: letter,
      gridType: "sign",
      draggableType: "clipart",
    }));
  } else if (level === 3) {
    // mix half & half in grid (4 clipart, 5 signs or vice versa)
    const half = Math.floor(MAX_MATCHES / 2);
    const shuffled = shuffle(levelVocab);

    // first half clipart in grid, rest signs
    const firstHalf = shuffled.slice(0, half).map(letter => ({
      word: letter,
      gridType: "clipart",
      draggableType: "sign",
    }));
    const secondHalf = shuffled.slice(half).map(letter => ({
      word: letter,
      gridType: "sign",
      draggableType: "clipart",
    }));

    gameItems = [...firstHalf, ...secondHalf];
    gameItems = shuffle(gameItems);
  }

  // Prepare draggable items collection (words)
  // Draggables are the opposite type of the grid
  // Gather all draggable words
  let draggableWords = gameItems.map(i => i.word);

  // Shuffle draggable words for random order
  draggableWords = shuffle(draggableWords);

  // Clear containers
  gameBoard.innerHTML = "";
  draggablesLeft.innerHTML = "";
  draggablesRight.innerHTML = "";

  // Build grid items
  gameItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "grid-item";
    div.dataset.word = item.word;
    div.dataset.gridType = item.gridType;
    div.style.position = "relative";

    // Create image for grid item based on gridType
    const img = document.createElement("img");
    if (item.gridType === "clipart") {
      img.src = `assets/${topic}/clipart/${item.word}.png`;
      img.alt = item.word;
    } else if (item.gridType === "sign") {
      img.src = `assets/${topic}/signs/sign-${item.word}.png`;
      img.alt = item.word;
    }
    img.draggable = false;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    div.appendChild(img);

    // Allow drop on grid item
    div.addEventListener("dragover", e => e.preventDefault());
    div.addEventListener("drop", handleDrop);

    gameBoard.appendChild(div);
  });

  // Split draggable words roughly half left, half right
  const half = Math.ceil(draggableWords.length / 2);
  const leftDraggables = draggableWords.slice(0, half);
  const rightDraggables = draggableWords.slice(half);

  // Create draggable images on left and right columns
  function createDraggable(word) {
    const img = document.createElement("img");
    img.className = "draggable";
    img.dataset.word = word;
    img.draggable = true;

    // Draggable image depends on level & word type in gameItems
    // Find item to get draggableType for this word
    const item = gameItems.find(i => i.word === word);
    if (!item) return null;

    if (item.draggableType === "sign") {
      img.src = `assets/${topic}/signs/sign-${word}.png`;
      img.alt = word;
    } else if (item.draggableType === "clipart") {
      img.src = `assets/${topic}/clipart/${word}.png`;
      img.alt = word;
    }

    img.style.width = "80px";
    img.style.height = "80px";
    img.style.margin = "10px";
    img.style.cursor = "grab";
    img.style.userSelect = "none";

    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", word);
    });

    return img;
  }

  leftDraggables.forEach(word => {
    const d = createDraggable(word);
    if (d) draggablesLeft.appendChild(d);
  });
  rightDraggables.forEach(word => {
    const d = createDraggable(word);
    if (d) draggablesRight.appendChild(d);
  });

  // Track matched words
  matchedWords = new Set();

  // Handle drop event
  function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.currentTarget;
    const targetWord = dropTarget.dataset.word;
    const draggedWord = e.dataTransfer.getData("text/plain");

    // Only accept if target not matched yet
    if (matchedWords.has(targetWord)) {
      return;
    }

    if (draggedWord === targetWord) {
      // Correct match!
      matchedWords.add(targetWord);
      correctMatches++;

      // Mark grid item with overlay "correct.png"
      showOverlay(dropTarget, "assets/correct.png");

      // Hide draggable image that matched
      const draggedImg = [...draggablesLeft.children, ...draggablesRight.children]
        .find(img => img.dataset.word === draggedWord);
      if (draggedImg) draggedImg.style.display = "none";

      // Check if all matched
      if (correctMatches === MAX_MATCHES) {
        setTimeout(() => {
          if (level === 3) {
            // End of cycle, submit results or restart level 1
            alert("Game complete! Restarting Level 1.");
            goToLevel(1);
          } else {
            goToLevel(level + 1);
          }
        }, 1000);
      }
    } else {
      // Wrong match - show wrong.png overlay, bounce draggable back
      const draggedImg = [...draggablesLeft.children, ...draggablesRight.children]
        .find(img => img.dataset.word === draggedWord);

      if (draggedImg) {
        showOverlay(draggedImg.parentElement || draggedImg, "assets/wrong.png", true);
        // Add bounce animation
        draggedImg.classList.add("bounce");
        setTimeout(() => {
          draggedImg.classList.remove("bounce");
        }, 600);
      }
    }
  }

  // Show overlay image on target for 1s (or bounce on dragged img if bounce true)
  function showOverlay(target, imageUrl, bounce = false) {
    if (bounce) {
      // For bounce effect on draggable, target is draggable img element
      // Already handled class toggle in handleDrop
      return;
    }
    const overlay = document.createElement("img");
    overlay.src = imageUrl;
    overlay.style.position = "absolute";
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.width = "80px";
    overlay.style.height = "80px";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "10";
    target.style.position = "relative";
    target.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
    }, 1000);
  }

  // Navigate to next level with persisted localStorage and query string
  function goToLevel(nextLevel) {
    localStorage.setItem("selectedTopic", topic);
    // Keep student info too
    window.location.href = `game.html?level=${nextLevel}`;
  }

  // Submit results to Google Form (adjust URL & entry IDs to your form)
  function submitResults() {
    const correctCount = correctMatches;
    const incorrectCount = MAX_MATCHES - correctCount;
    const percentCorrect = Math.round((correctCount / MAX_MATCHES) * 100);

    const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";

    const formData = new FormData();
    formData.append("entry.1387461004", studentName); // Name
    formData.append("entry.1309291707", studentClass); // Class
    formData.append("entry.477642881", topic.charAt(0).toUpperCase() + topic.slice(1)); // Topic
    formData.append("entry.1897227570", [...matchedWords].join(", ")); // Correct matches
    formData.append("entry.1249394203", [...gameItems.filter(i => !matchedWords.has(i.word)).map(i => i.word)].join(", ")); // Incorrect matches
    formData.append("entry.1996137354", `${percentCorrect}%`); // Percentage correct

    fetch(formUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    }).catch(e => console.warn("Google Form submit error", e));
  }

  // Finish button click handler
  finishButton.addEventListener("click", () => {
    submitResults();
    alert("Your results have been submitted. Returning to home.");
    window.location.href = "index.html";
  });
})();
