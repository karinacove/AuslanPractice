(() => {
  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  let level = parseInt(urlParams.get("level")) || 1;
  if (![1, 2, 3].includes(level)) level = 1;

  // Get student info and topic from localStorage (or redirect if missing)
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  const topic = localStorage.getItem("selectedTopic") || "alphabet";

  if (!studentName || !studentClass) {
    alert("Please sign in first.");
    window.location.href = "index.html";
    return; // Stop further execution
  }

  // HTML Elements
  const levelTitle = document.getElementById("levelTitle");
  const studentInfo = document.getElementById("studentInfo");
  const gameBoard = document.getElementById("gameBoard");
  const draggablesLeft = document.getElementById("draggablesLeft");
  const draggablesRight = document.getElementById("draggablesRight");
  const finishButton = document.getElementById("finishButton");

  const MAX_MATCHES = 9;

  // Alphabet letters for the game
  const alphabetLetters = "abcdefghijklmnopqrstuvwxyz".split("");

  // Helper to shuffle array
  function shuffle(arr) {
    return arr.sort(() => 0.5 - Math.random());
  }

  let correctMatches = 0;
  let matchedWords = new Set();

  studentInfo.textContent = `Signed in as: ${studentName} (${studentClass})`;

  const levelTitles = {
    1: "Level 1: Match the Sign to the Picture",
    2: "Level 2: Match the Picture to the Sign",
    3: "Level 3: Mixed Challenge",
  };
  levelTitle.textContent = levelTitles[level];

  let levelVocab = alphabetLetters.slice(0, MAX_MATCHES);

  let gameItems = [];

  if (level === 1) {
    gameItems = levelVocab.map((letter) => ({
      word: letter,
      gridType: "clipart",
      draggableType: "sign",
    }));
  } else if (level === 2) {
    gameItems = levelVocab.map((letter) => ({
      word: letter,
      gridType: "sign",
      draggableType: "clipart",
    }));
  } else if (level === 3) {
    const half = Math.floor(MAX_MATCHES / 2);
    const shuffled = shuffle(levelVocab);

    const firstHalf = shuffled.slice(0, half).map((letter) => ({
      word: letter,
      gridType: "clipart",
      draggableType: "sign",
    }));
    const secondHalf = shuffled.slice(half).map((letter) => ({
      word: letter,
      gridType: "sign",
      draggableType: "clipart",
    }));

    gameItems = [...firstHalf, ...secondHalf];
    gameItems = shuffle(gameItems);
  }

  // Prepare draggable words and shuffle
  let draggableWords = gameItems.map((i) => i.word);
  draggableWords = shuffle(draggableWords);

  gameBoard.innerHTML = "";
  draggablesLeft.innerHTML = "";
  draggablesRight.innerHTML = "";

  // Build grid items with drop handlers
  gameItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "grid-item";
    div.dataset.word = item.word;
    div.dataset.gridType = item.gridType;
    div.style.position = "relative";

    const img = document.createElement("img");
    img.draggable = false;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    if (item.gridType === "clipart") {
      img.src = `assets/${topic}/clipart/${item.word}.png`;
      img.alt = item.word;
    } else {
      img.src = `assets/${topic}/signs/sign-${item.word}.png`;
      img.alt = item.word;
    }

    div.appendChild(img);

    div.addEventListener("dragover", (e) => e.preventDefault());
    div.addEventListener("drop", handleDrop);

    gameBoard.appendChild(div);
  });

  // Split draggables roughly half on left and right
  const half = Math.ceil(draggableWords.length / 2);
  const leftDraggables = draggableWords.slice(0, half);
  const rightDraggables = draggableWords.slice(half);

  function createDraggable(word) {
    const img = document.createElement("img");
    img.className = "draggable";
    img.dataset.word = word;
    img.draggable = true;

    const item = gameItems.find((i) => i.word === word);
    if (!item) return null;

    if (item.draggableType === "sign") {
      img.src = `assets/${topic}/signs/sign-${word}.png`;
      img.alt = word;
    } else {
      img.src = `assets/${topic}/clipart/${word}.png`;
      img.alt = word;
    }

    img.style.width = "80px";
    img.style.height = "80px";
    img.style.margin = "10px";
    img.style.cursor = "grab";
    img.style.userSelect = "none";

    img.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", word);
    });

    return img;
  }

  leftDraggables.forEach((word) => {
    const d = createDraggable(word);
    if (d) draggablesLeft.appendChild(d);
  });
  rightDraggables.forEach((word) => {
    const d = createDraggable(word);
    if (d) draggablesRight.appendChild(d);
  });

  matchedWords = new Set();

  function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.currentTarget;
    const targetWord = dropTarget.dataset.word;
    const draggedWord = e.dataTransfer.getData("text/plain");

    if (matchedWords.has(targetWord)) return;

    if (draggedWord === targetWord) {
      matchedWords.add(targetWord);
      correctMatches++;

      showOverlay(dropTarget, "assets/correct.png");

      const draggedImg = [...draggablesLeft.children, ...draggablesRight.children].find(
        (img) => img.dataset.word === draggedWord
      );
      if (draggedImg) draggedImg.style.display = "none";

      if (correctMatches === MAX_MATCHES) {
        setTimeout(() => {
          if (level === 3) {
            alert("Game complete! Restarting Level 1.");
            goToLevel(1);
          } else {
            goToLevel(level + 1);
          }
        }, 1000);
      }
    } else {
      const draggedImg = [...draggablesLeft.children, ...draggablesRight.children].find(
        (img) => img.dataset.word === draggedWord
      );

      if (draggedImg) {
        showOverlay(draggedImg, "assets/wrong.png", true);
        draggedImg.classList.add("bounce");
        setTimeout(() => {
          draggedImg.classList.remove("bounce");
        }, 600);
      }
    }
  }

  function showOverlay(target, imageUrl, bounce = false) {
    if (bounce) {
      // Bounce is handled via class toggle
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

  function goToLevel(nextLevel) {
    localStorage.setItem("selectedTopic", topic);
    window.location.href = `game.html?level=${nextLevel}`;
  }

  function submitResults() {
    const correctCount = correctMatches;
    const incorrectCount = MAX_MATCHES - correctCount;
    const percentCorrect = Math.round((correctCount / MAX_MATCHES) * 100);

    const formUrl =
      "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";

    const formData = new FormData();
    formData.append("entry.1387461004", studentName); // Name
    formData.append("entry.1309291707", studentClass); // Class
    formData.append("entry.477642881", topic.charAt(0).toUpperCase() + topic.slice(1)); // Topic
    formData.append("entry.1897227570", [...matchedWords].join(", ")); // Correct matches
    formData.append(
      "entry.1249394203",
      [...gameItems.filter((i) => !matchedWords.has(i.word)).map((i) => i.word)].join(", ")
    ); // Incorrect matches
    formData.append("entry.1649540718", correctCount.toString());
    formData.append("entry.367398283", incorrectCount.toString());
    formData.append("entry.927044195", percentCorrect.toString());
    formData.append("entry.1672589573", level.toString()); // Level

    fetch(formUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    })
      .then(() => {
        alert("Results submitted! Thank you.");
      })
      .catch(() => {
        alert("Failed to submit results.");
      });
  }

  finishButton.addEventListener("click", submitResults);

  // Optionally disable finish button until at least one match is made
  finishButton.disabled = true;
  const observer = new MutationObserver(() => {
    finishButton.disabled = matchedWords.size === 0;
  });
  observer.observe(gameBoard, { childList: true, subtree: true });
})();
