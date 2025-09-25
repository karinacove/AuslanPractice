// numbers.js
// Complete Numbers Matching Game - full logic (drag/drop, touch, save/restore, pause/resume, forms)

document.addEventListener("DOMContentLoaded", function () {

  // ====== STUDENT INFO ======
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) { window.location.href = "../index.html"; return; }
  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // ====== DOM ======
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const modal = document.getElementById("end-modal");
  const stopScoreEl = document.getElementById("stop-score");
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");
  const scoreDisplay = document.getElementById("score-display");
  const stopBtn = document.getElementById("stop-btn");

  // ====== STATE ======
  let currentLevel = 0;
  let currentPage = 0;
  let currentLetters = [];
  let correctMatches = 0;
  let startTime = Date.now();
  let gameEnded = false;

  const levelAttempts = Array(20).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  const overlaysPerLevel = Array(20).fill(null).map(() => ({}));

  // ====== GOOGLE FORM ======
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHjst2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
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

  // ====== LEVEL DEFINITIONS ======
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
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
    width: "200px", display: "none", zIndex: 1000
  });
  document.body.appendChild(feedbackImage);

  function showFeedbackCorrect(isCorrect){
    feedbackImage.src = isCorrect ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 800);
  }

  // ====== UTIL ======
  function shuffle(arr){ return arr.sort(() => Math.random() - 0.5); }
  function formatSecs(s){ const m = Math.floor(s/60); const sec = s%60; return `${m} mins ${sec} sec`; }
  function getElapsedSeconds(){ return Math.floor((Date.now() - startTime)/1000); }

  // ====== SAVE / RESTORE ======
  function saveProgress() {
    const data = {
      studentName,
      studentClass,
      currentLevel,
      currentPage,
      elapsedSeconds: getElapsedSeconds(),
      levelAttempts: levelAttempts.map(l => ({ correct: Array.from(l.correct), incorrect: l.incorrect })),
      overlaysPerLevel
    };
    localStorage.setItem("numbersGameSave", JSON.stringify(data));
  }

  function restoreProgress() {
    const raw = localStorage.getItem("numbersGameSave");
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (data.studentName !== studentName || data.studentClass !== studentClass) return false;

      currentLevel = typeof data.currentLevel === "number" ? data.currentLevel : 0;
      currentPage = typeof data.currentPage === "number" ? data.currentPage : 0;

      if (Array.isArray(data.levelAttempts)) {
        data.levelAttempts.forEach((lvl,i)=>{
          levelAttempts[i].correct = new Set(Array.isArray(lvl.correct)?lvl.correct:[]);
          levelAttempts[i].incorrect = Array.isArray(lvl.incorrect)?lvl.incorrect:[];
        });
      }

      if (data.overlaysPerLevel && Array.isArray(data.overlaysPerLevel)) {
        data.overlaysPerLevel.forEach((obj,i)=>{ overlaysPerLevel[i] = obj || {}; });
      }

      startTime = typeof data.elapsedSeconds === "number" ? Date.now() - data.elapsedSeconds*1000 : Date.now();
      return true;
    } catch { return false; }
  }

  function clearProgress(){ localStorage.removeItem("numbersGameSave"); }

  // ====== RESTORE OVERLAYS ======
  function restoreOverlays() {
    const mapping = overlaysPerLevel[currentLevel] || {};
    correctMatches = 0;

    document.querySelectorAll(".slot").forEach(slot => {
      const letter = slot.dataset.letter;
      const imageMode = mapping[letter];
      if (imageMode) {
        slot.innerHTML = "";
        const overlay = document.createElement("img");
        overlay.className = "overlay";
        overlay.src = imageMode === "clipart" ? `assets/numbers/clipart/${letter}.png` : `assets/numbers/signs/sign-${letter}.png`;
        slot.appendChild(overlay);
        document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el=>el.remove());
        correctMatches++;
      }
    });
  }

  // ====== SCORE ======
  function updateScore() {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100) : 0;
    scoreDisplay.innerText = `Score: ${percent}%`;
  }

  function calculateScore() {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100) : 0;
    return { totalCorrect, totalIncorrect, percent };
  }

  // ====== MODAL CONTROL ======
  function showEndModal(isFinished=false) {
    const { percent } = calculateScore();
    const elapsed = getElapsedSeconds();
    const timeText = formatSecs(elapsed);
    scoreDisplay.innerText = `Score: ${percent}% | Time: ${timeText}`;
    if (stopScoreEl) stopScoreEl.innerText = `Score: ${percent}% | Time: ${timeText}`;

    modal.style.display = "flex";
    if (againBtn) againBtn.style.display = "inline-block";
    if (finishBtn) finishBtn.style.display = "inline-block";
    if (continueBtn) continueBtn.style.display = isFinished ? "none" : "inline-block";

    if (isFinished && !gameEnded) endGame();
  }

  // ====== BUTTONS ======
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    restoreProgress();
    gameEnded = false;
    loadPage();
  });

  againBtn.addEventListener("click", () => {
    clearProgress();
    location.reload();
  });

  finishBtn.addEventListener("click", () => {
    if (!gameEnded) endGame();
    setTimeout(()=>window.location.href="../index.html",1200);
  });

  if (stopBtn) {
    stopBtn.addEventListener("click", () => { saveProgress(); showEndModal(false); });
  }

  // ====== DRAG & TOUCH ======
  function drop(e) {
    if (e.preventDefault) e.preventDefault();
    const letter = e.dataTransfer ? e.dataTransfer.getData("text/plain") : e.letter;
    const target = e.currentTarget;
    if (!letter || !target) return;

    const expected = target.dataset.letter;
    if (letter === expected) {
      levelAttempts[currentLevel].correct.add(letter);
      const usedImageMode = target.dataset.imageMode || "clipart";
      overlaysPerLevel[currentLevel] = overlaysPerLevel[currentLevel] || {};
      overlaysPerLevel[currentLevel][letter] = usedImageMode;

      target.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = usedImageMode==="clipart"?`assets/numbers/clipart/${letter}.png`:`assets/numbers/signs/sign-${letter}.png`;
      target.appendChild(overlay);

      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el=>el.remove());
      restoreOverlays();
      showFeedbackCorrect(true);
      updateScore();
      saveProgress();

      // Page progression
      const pageSlots = Array.from(document.querySelectorAll(".slot"));
      correctMatches = pageSlots.filter(s=>overlaysPerLevel[currentLevel] && overlaysPerLevel[currentLevel][s.dataset.letter]).length;
      if (correctMatches >= pageSlots.length) {
        currentPage++;
        if (currentPage < currentLetters.length) { saveProgress(); setTimeout(loadPage,800); }
        else { currentLevel++; currentPage=0; currentLevel >= levelDefinitions.length ? showEndModal(true) : setTimeout(loadPage,800); saveProgress(); }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedbackCorrect(false);
      const wrong = document.querySelector(`img.draggable[data-letter='${letter}']`);
      if (wrong) { wrong.classList.add("shake"); setTimeout(()=>wrong.classList.remove("shake"),500); }
      updateScore();
      saveProgress();
    }
  }

  function touchStart(e){
    if(!e.touches||!e.touches.length) return;
    const target = e.target;
    if(!target||!target.dataset||!target.dataset.letter) return;
    const letter = target.dataset.letter;
    const clone = target.cloneNode(true);
    Object.assign(clone.style,{position:"absolute",pointerEvents:"none",opacity:0.8,zIndex:10000});
    document.body.appendChild(clone);

    const moveClone=t=>{clone.style.left=`${t.clientX-clone.width/2}px`; clone.style.top=`${t.clientY-clone.height/2}px`};
    moveClone(e.touches[0]);

    const handleMove=ev=>{ev.preventDefault(); moveClone(ev.touches[0]);};
    const handleEnd=ev=>{
      const t=ev.changedTouches[0];
      const el=document.elementFromPoint(t.clientX,t.clientY);
      if(el&&el.classList.contains("slot")) drop({preventDefault:()=>{},dataTransfer:{getData:k=>k==="text/plain"?letter:null},currentTarget:el});
      document.removeEventListener("touchmove",handleMove);
      document.removeEventListener("touchend",handleEnd);
      clone.remove();
    };
    document.addEventListener("touchmove",handleMove,{passive:false});
    document.addEventListener("touchend",handleEnd,{passive:false});
  }

  // ====== LOAD PAGE ======
  function loadPage() {
    const info = levelDefinitions[currentLevel];
    if(!info){ showEndModal(true); return; }

    let pool;
    if(info.review){
      const wrong = new Set(); levelAttempts.forEach(l=>l.incorrect.forEach(n=>wrong.add(n))); pool=Array.from(wrong);
    } else if(info.random){ pool=Array.from({length:101},(_,i)=>i); }
    else pool=Array.from({length:info.end-info.start+1},(_,i)=>i+info.start);

    const chosen = shuffle(pool).slice(0, info.pages*9);
    const pages=[]; for(let p=0;p<info.pages;p++) pages.push(chosen.slice(p*9,(p+1)*9));
    currentLetters=pages;
    const pageLetters = currentLetters[currentPage] || [];

    gameBoard.innerHTML=""; leftSigns.innerHTML=""; rightSigns.innerHTML="";
    levelTitle.innerText = `Level ${currentLevel+1}`;

    const slotType = info.type;
    const slotMode = slotType.includes("clipart")?"clipart":(slotType.includes("sign")?"sign":null);
    const getOppositeMode=m=>m==="clipart"?"sign":"clipart";

    // create slots
    pageLetters.forEach(letter=>{
      const slot=document.createElement("div");
      slot.className="slot";
      slot.dataset.letter=`${letter}`;
      const imageMode = slotType==="mixed"? (Math.random()<0.5?"clipart":"sign") : slotMode;
      slot.dataset.imageMode = imageMode;
      slot.style.backgroundImage=`url('assets/numbers/${imageMode==="clipart"?`clipart/${letter}.png`:`signs/sign-${letter}.png`}')`;
      slot.style.backgroundSize="contain"; slot.style.backgroundRepeat="no-repeat"; slot.style.backgroundPosition="center";
      gameBoard.appendChild(slot);
    });

    document.querySelectorAll(".slot").forEach(slot=>{ slot.addEventListener("dragover", e=>e.preventDefault()); slot.addEventListener("drop", drop); });
    correctMatches=0;
    restoreOverlays();

    // create draggables
    let decoyPool = pool.filter(n=>!pageLetters.includes(n)&&!levelAttempts[currentLevel].correct.has(n));
    let decoys = decoyPool.length>=3 ? shuffle(decoyPool).slice(0,3) : decoyPool.slice();
    const draggableLetters = shuffle([...pageLetters.filter(l=>!levelAttempts[currentLevel].correct.has(l)), ...decoys]);

    draggableLetters.forEach((letter,i)=>{
      const img=document.createElement("img");
      img.className="draggable"; img.draggable=true; img.dataset.letter=`${letter}`;

      let sourceMode;
      if(slotType==="mixed"){
        const matchSlot=document.querySelector(`.slot[data-letter='${letter}']`);
        sourceMode = matchSlot ? getOppositeMode(matchSlot.dataset.imageMode) : (Math.random()<0.5?"clipart":"sign");
      } else sourceMode = getOppositeMode(slotMode);

      img.src = `assets/numbers/${sourceMode==="clipart"?`clipart/${letter}.png`:`signs/sign-${letter}.png`}`;
      img.addEventListener("dragstart", e=>{ e.dataTransfer.setData("text/plain",`${letter}`); e.dataTransfer.setData("src",img.src); });
      img.addEventListener("touchstart", touchStart);

      const wrap=document.createElement("div"); wrap.className="drag-wrapper"; wrap.appendChild(img);
      i<draggableLetters.length/2 ? leftSigns.appendChild(wrap) : rightSigns.appendChild(wrap);
    });

    updateScore();
    saveProgress();
  }

  // ====== END GAME ======
  function endGame(){
    if(gameEnded) return;
    gameEnded=true;

    const elapsedSec = getElapsedSeconds();
    const formattedTime = formatSecs(elapsedSec);
    const currentPosition = `L${currentLevel+1}P${currentPage+1}`;
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100) : 0;

    // build hidden form
    const form=document.createElement("form"); form.method="POST"; form.action=formURL; form.target="hidden_iframe"; form.style.display="none";
    if(!document.querySelector("iframe[name='hidden_iframe']")){ const f=document.createElement("iframe"); f.name="hidden_iframe"; f.style.display="none"; document.body.appendChild(f); }

    const entries={
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Numbers",
      "entry.1374858042": formattedTime,
      "entry.750436458": currentPosition,
      "entry.1996137354": `${percent}%`
    };
    for(let i=0;i<20;i++){
      entries[formEntryIDs.correct[i]] = Array.from(levelAttempts[i].correct).sort((a,b)=>a-b).join(", ");
      entries[formEntryIDs.incorrect[i]] = (levelAttempts[i].incorrect||[]).slice().sort((a,b)=>a-b).join(", ");
    }
    for(const key in entries){ const input=document.createElement("input"); input.type="hidden"; input.name=key; input.value=entries[key]; form.appendChild(input); }
    document.body.appendChild(form); form.submit();

    if(stopScoreEl) stopScoreEl.innerText = `Final Score: ${percent}% | Time: ${formattedTime}`;
    if(scoreDisplay) scoreDisplay.innerText = `Score: ${percent}%`;
    clearProgress();
  }

  // ====== INIT ======
  restoreProgress();
  loadPage();

  // optional debug API
  window.__numbersGame={ loadPage, saveProgress, restoreProgress, levelAttempts, overlaysPerLevel };

});
