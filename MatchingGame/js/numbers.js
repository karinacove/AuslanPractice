
document.addEventListener("DOMContentLoaded", function () {
  // ====== STUDENT INFO ======
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }
  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // ====== DOM ELEMENTS ======
  const stopBtn = document.getElementById("stop-btn");
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const modal = document.getElementById("end-modal");
  const stopScoreEl = document.getElementById("stop-score");

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // ====== STATE ======
  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = [];
  let correctMatches = 0;
  let gameEnded = false;
  let finished = false;
  let startTime = Date.now();
  const levelAttempts = Array(20).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  let paused = false;
  let savedTimeElapsed = 0;
  let timerInterval = null;

  const formEntryIDs = {
    correct: [
      "entry.1897227570","entry.1116300030","entry.187975538","entry.1880514176",
      "entry.497882042","entry.1591755601","entry.1374012635","entry.1932466289",
      "entry.554179696","entry.738514372","entry.1591067770","entry.798325880",
      "entry.985210217","entry.173771989","entry.518336131","entry.1826031881",
      "entry.1363193324","entry.1713469842","entry.2122202486","entry.1745996786"
    ],
    incorrect: [
      "entry.1249394203","entry.1551220511","entry.903633326","entry.856597282",
      "entry.552536101","entry.922308538","entry.969924717","entry.1575128943",
      "entry.2030465979","entry.1357122496","entry.1355599626","entry.1979110089",
      "entry.1120330311","entry.1445957806","entry.817472684","entry.975184703",
      "entry.1628651239","entry.1505983868","entry.1744154495","entry.592196245"
    ]
  };

  const levelDefinitions = [
    { start: 0, end: 12, pages: 2, type: "clipart-grid" },
    { start: 0, end: 12, pages: 2, type: "sign-grid" },
    { start: 0, end: 12, pages: 2, type: "mixed" },
    { start: 13, end: 20, pages: 1, type: "clipart-grid" },
    { start: 13, end: 20, pages: 1, type: "sign-grid" },
    { start: 13, end: 20, pages: 1, type: "mixed" },
    { start: 21, end: 48, pages: 3, type: "clipart-grid" },
    { start: 21, end: 48, pages: 3, type: "sign-grid" },
    { start: 21, end: 48, pages: 3, type: "mixed" },
    { start: 49, end: 76, pages: 3, type: "clipart-grid" },
    { start: 49, end: 76, pages: 3, type: "sign-grid" },
    { start: 49, end: 76, pages: 3, type: "mixed" },
    { start: 77, end: 100, pages: 3, type: "clipart-grid" },
    { start: 77, end: 100, pages: 3, type: "sign-grid" },
    { start: 77, end: 100, pages: 3, type: "mixed" },
    { start: 0, end: 100, pages: 3, type: "clipart-grid" },
    { start: 0, end: 100, pages: 3, type: "sign-grid" },
    { start: 0, end: 100, pages: 3, type: "mixed" },
    { random: true, pages: 3, type: "mixed" },
    { review: true, pages: 1, type: "mixed" }
  ];

  // ====== FEEDBACK IMAGE ======
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "200px",
    display: "none",
    zIndex: "1000"
  });
  document.body.appendChild(feedbackImage);

  // ====== UTILITY FUNCTIONS ======
  const shuffle = arr => arr.sort(() => Math.random() - 0.5);
  const showFeedback = correct => {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 800);
  };
  const formatTime = ms => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} mins ${seconds} sec`;
  };
  const updateScore = () => {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect+totalIncorrect>0 ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100) : 0;
    document.getElementById("score-display").innerText=`Score: ${percent}%`;
    return percent;
  };

  // ====== PROGRESS SAVE/RESTORE ======
  const saveProgress = () => {
    localStorage.setItem("numbersGameSave", JSON.stringify({
      studentName, studentClass, currentLevel, currentPage,
      levelAttempts: levelAttempts.map(l=>({correct:Array.from(l.correct),incorrect:l.incorrect})),
      timestamp: Date.now()
    }));
  };
  const restoreProgress = () => {
    const data = JSON.parse(localStorage.getItem("numbersGameSave"));
    if(!data || data.studentName!==studentName || data.studentClass!==studentClass) return false;
    currentLevel = data.currentLevel;
    currentPage = data.currentPage;
    data.levelAttempts.forEach((lvl,i)=>{ levelAttempts[i].correct = new Set(lvl.correct); levelAttempts[i].incorrect = lvl.incorrect; });
    return true;
  };

  // ====== END GAME ======
  const endGame = () => {
    if(gameEnded) return;
    gameEnded = true;
    const endTime = Date.now();
    const formattedTime = `${Math.floor((endTime - startTime)/60000)} mins ${Math.floor((endTime - startTime)/1000)%60} sec`;
    const percent = updateScore();

    // Create hidden iframe for Google Forms
    if(!document.querySelector("iframe[name='hidden_iframe']")){
      const iframe = document.createElement("iframe");
      iframe.name = "hidden_iframe"; iframe.style.display="none";
      document.body.appendChild(iframe);
    }

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Numbers",
      "entry.1374858042": formattedTime,
      "entry.1996137354": `${percent}%`,
      "entry.750436458": finished ? "Finish" : `Level ${currentLevel+1} Page ${currentPage+1}`
    };

    for(let i=0;i<20;i++){
      entries[formEntryIDs.correct[i]] = Array.from(levelAttempts[i].correct).join(",");
      entries[formEntryIDs.incorrect[i]] = levelAttempts[i].incorrect.join(",");
    }

    for(const key in entries){
      const input=document.createElement("input");
      input.type="hidden"; input.name=key; input.value=entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  };

  // ====== DRAG & DROP ======
  const drop = e => {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const slot = e.currentTarget;

    if(letter == slot.dataset.letter){
      if(!levelAttempts[currentLevel].correct.has(letter)) levelAttempts[currentLevel].correct.add(letter);
      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = src; overlay.className="overlay"; slot.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el=>el.remove());
      correctMatches++; showFeedback(true); updateScore();

      if(correctMatches >= currentLetters[currentPage].length){
        correctMatches = 0; currentPage++;
        if(currentPage < currentLetters.length) setTimeout(loadPage, 800);
        else {
          currentLevel++; currentPage=0;
          if(currentLevel >= 20){
            modal.style.display = "flex";
            finished = true;
            endGame();
          } else setTimeout(loadPage,800);
        }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedback(false);
    }
  };

  const touchStart = e => {
    const target = e.target, letter = target.dataset.letter, src = target.src;
    const clone = target.cloneNode(true);
    clone.style.position = "absolute"; clone.style.pointerEvents = "none";
    clone.style.opacity = "0.7"; clone.style.zIndex = "10000";
    document.body.appendChild(clone);

    const moveClone = t => {
      clone.style.left = `${t.clientX-clone.width/2}px`;
      clone.style.top = `${t.clientY-clone.height/2}px`;
    };
    moveClone(e.touches[0]);

    const handleTouchMove = ev => moveClone(ev.touches[0]);
    const handleTouchEnd = ev => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX,touch.clientY);
      if(el && el.classList.contains("slot"))
        drop({ preventDefault:()=>{}, dataTransfer:{ getData:k=>k==="text/plain"?letter:src }, currentTarget: el });
      document.removeEventListener("touchmove",handleTouchMove);
      document.removeEventListener("touchend",handleTouchEnd);
      clone.remove();
    };

    document.addEventListener("touchmove",handleTouchMove,{passive:false});
    document.addEventListener("touchend",handleTouchEnd,{passive:false});
  };

  // ====== LOAD PAGE ======
  const loadPage = () => {
    const info = levelDefinitions[currentLevel];
    const pool = info.random ? Array.from({length:101},(_,i)=>i) : Array.from({length:info.end-info.start+1},(_,i)=>i+info.start);
    const chosen = shuffle(pool).slice(0, info.pages*9);
    const pageItems = [];
    for(let i=0;i<info.pages;i++) pageItems.push(chosen.slice(i*9,(i+1)*9));
    currentLetters = pageItems;
    const pageLetters = currentLetters[currentPage];

    gameBoard.innerHTML=""; leftSigns.innerHTML=""; rightSigns.innerHTML=""; levelTitle.innerText=`Level ${currentLevel+1}`;
    const slotType=info.type;
    const slotMode = slotType.includes("clipart")?"clipart":slotType.includes("sign")?"sign":null;
    const getOppositeMode = m => m==="clipart"?"sign":"clipart";

    pageLetters.forEach(letter=>{
      const slot=document.createElement("div");
      slot.className="slot"; slot.dataset.letter=`${letter}`;
      let imageMode = slotType==="mixed" ? (Math.random()<0.5?"clipart":"sign") : slotMode;
      slot.dataset.imageMode=imageMode;
      slot.style.backgroundImage=`url('assets/numbers/${imageMode==="clipart"?`clipart/${letter}.png`:`signs/sign-${letter}.png`}')`;
      gameBoard.appendChild(slot);
    });

    let usedLetters = currentLetters.flat().filter(n => !pageLetters.includes(n));
    let decoyPool = pool.filter(n => !pageLetters.includes(n));
    let decoys = shuffle(decoyPool).slice(0, 3);

    const draggableLetters = shuffle([...pageLetters,...decoys]);

    draggableLetters.forEach((letter,i)=>{
      const img=document.createElement("img"); img.className="draggable"; img.draggable=true; img.dataset.letter=letter;
      let sourceMode;
      if(slotType==="mixed"){
        const matchSlot=document.querySelector(`.slot[data-letter='${letter}']`);
        sourceMode = matchSlot ? getOppositeMode(matchSlot.dataset.imageMode) : (Math.random()<0.5?"clipart":"sign");
      } else sourceMode = getOppositeMode(slotMode);
      img.src=`assets/numbers/${sourceMode==="clipart"?`clipart/${letter}.png`:`signs/sign-${letter}.png`}`;
      img.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", letter); e.dataTransfer.setData("src", img.src); });
      img.addEventListener("touchstart", touchStart);

      const wrap=document.createElement("div"); wrap.className="drag-wrapper"; wrap.appendChild(img);
      (i<draggableLetters.length/2?leftSigns:rightSigns).appendChild(wrap);
    });

    correctMatches = 0;
    document.querySelectorAll(".slot").forEach(slot=>{ slot.addEventListener("dragover", e=>e.preventDefault()); slot.addEventListener("drop", drop); });
    updateScore(); saveProgress();
  };

  // ====== BUTTONS ======
  stopBtn.addEventListener("click", () => {
    if(!paused){
      paused=true; clearInterval(timerInterval);
      savedTimeElapsed = Date.now()-startTime;
      const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
      const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
      modal.style.display="flex";
      stopScoreEl.innerHTML = `Game paused<br>Score: ${totalCorrect} correct, ${totalIncorrect} incorrect<br>Time: ${formatTime(savedTimeElapsed)}`;
    }
  });

  continueBtn.onclick = () => { modal.style.display="none"; paused=false; startTime=Date.now()-savedTimeElapsed; timerInterval=setInterval(()=>updateScore(),1000); };
  againBtn.onclick = () => { localStorage.removeItem("numbersGameSave"); location.reload(); };
  finishBtn.onclick = () => {
    finished = true;
    endGame();
    localStorage.removeItem("numbersGameSave");
    setTimeout(() => {
      window.location.href = "../MatchingGame/hub.html";
    }, 1500);
  };

  // ====== INIT ======
  const resumed = restoreProgress();
  if(resumed) loadPage(); else loadPage();
  timerInterval = setInterval(()=>updateScore(),1000);
});
