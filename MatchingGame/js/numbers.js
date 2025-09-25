// numbers.js - Full Functional Numbers Matching Game
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
  const stopBtn = document.getElementById("stop-btn");
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
  let startTime = Date.now();

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
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: "200px", display: "none", zIndex: "1000"
  });
  document.body.appendChild(feedbackImage);

  function showFeedbackCorrect(isCorrect){
    feedbackImage.src = isCorrect ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 800);
  }

  // ====== UTIL ======
  function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }
  function formatSecs(s){ return `${Math.floor(s/60)} mins ${s%60} sec`; }
  function getElapsedSeconds(){ return Math.floor((Date.now()-startTime)/1000); }

  // ====== SAVE/RESTORE ======
  function saveProgress(){
    localStorage.setItem("numbersGameSave", JSON.stringify({
      studentName, studentClass, currentLevel, currentPage,
      levelAttempts: levelAttempts.map(l=>({correct:Array.from(l.correct),incorrect:l.incorrect})),
      overlaysPerLevel, elapsedSeconds: getElapsedSeconds()
    }));
  }

  function restoreProgress(){
    const raw = localStorage.getItem("numbersGameSave");
    if(!raw) return false;
    try{
      const data = JSON.parse(raw);
      if(data.studentName!==studentName || data.studentClass!==studentClass) return false;
      currentLevel = data.currentLevel||0;
      currentPage = data.currentPage||0;
      if(Array.isArray(data.levelAttempts)){
        data.levelAttempts.forEach((l,i)=>{
          levelAttempts[i].correct = new Set(Array.isArray(l.correct)?l.correct:[]);
          levelAttempts[i].incorrect = Array.isArray(l.incorrect)?l.incorrect:[];
        });
      }
      if(Array.isArray(data.overlaysPerLevel)){
        data.overlaysPerLevel.forEach((o,i)=>overlaysPerLevel[i]=o||{});
      }
      startTime = Date.now() - (data.elapsedSeconds||0)*1000;
      return true;
    }catch{return false;}
  }

  function clearProgress(){ localStorage.removeItem("numbersGameSave"); }

  // ====== RESTORE OVERLAYS ======
  function restoreOverlays(){
    const mapping = overlaysPerLevel[currentLevel]||{};
    correctMatches=0;
    document.querySelectorAll(".slot").forEach(slot=>{
      const letter=slot.dataset.letter;
      const imageMode = mapping[letter];
      if(imageMode){
        slot.innerHTML="";
        const overlay=document.createElement("img");
        overlay.className="overlay";
        overlay.src=imageMode==="clipart"?`assets/numbers/clipart/${letter}.png`:`assets/numbers/signs/sign-${letter}.png`;
        slot.appendChild(overlay);
        document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el=>el.remove());
        correctMatches++;
      }
    });
  }

  // ====== SCORE ======
  function updateScore(){
    const totalCorrect=levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect=levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect+totalIncorrect>0 ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100) : 0;
    document.getElementById("score-display").innerText=`Score: ${percent}%`;
    return percent;
  }

  function calculateScore(){ return updateScore(); }

  // ====== GOOGLE FORM SUBMISSION ======
  function submitToGoogleForms(){
    const formData = new FormData();
    formData.append("entry.1387461004", studentName);
    formData.append("entry.1309291707", studentClass);
    formData.append("entry.477642881", "Numbers");
    formData.append("entry.1996137354", calculateScore());
    formData.append("entry.1374858042", formatSecs(getElapsedSeconds()));
    levelAttempts.forEach((l,i)=>{
      formData.append(formEntryIDs.correct[i], Array.from(l.correct).join(","));
      formData.append(formEntryIDs.incorrect[i], l.incorrect.join(","));
    });
    fetch(formURL, {method:"POST", body:formData}).catch(err=>console.warn("Form submission failed",err));
  }

  // ====== GENERATE PAGE ======
  function generatePage(){
    gameBoard.innerHTML="";
    leftSigns.innerHTML="";
    rightSigns.innerHTML="";
    const levelDef=levelDefinitions[currentLevel];
    const letters = [];
    if(levelDef.start!==undefined){
      for(let i=levelDef.start;i<=levelDef.end;i++) letters.push(i);
    } else if(levelDef.random){
      for(let i=0;i<100;i++) letters.push(i);
    } else if(levelDef.review){
      levelAttempts.forEach(l=>l.incorrect.forEach(n=>letters.push(n)));
    }
    currentLetters = shuffle(letters).slice(0, levelDef.pages*6);
    levelTitle.innerText=`Level ${currentLevel+1} Page ${currentPage+1}`;

    currentLetters.forEach(letter=>{
      const slot=document.createElement("div");
      slot.className="slot";
      slot.dataset.letter=letter;
      slot.addEventListener("dragover", e=>e.preventDefault());
      slot.addEventListener("drop", e=>handleDrop(e,slot));
      leftSigns.appendChild(slot);

      const draggable=document.createElement("img");
      draggable.className="draggable";
      draggable.dataset.letter=letter;
      draggable.src=`assets/numbers/clipart/${letter}.png`;
      draggable.draggable=true;
      draggable.addEventListener("dragstart", e=>e.dataTransfer.setData("text",letter));
      rightSigns.appendChild(draggable);
    });
    restoreOverlays();
  }

  function handleDrop(e,slot){
    const letter=e.dataTransfer.getData("text");
    if(slot.dataset.letter==letter){
      overlaysPerLevel[currentLevel][letter]="clipart";
      slot.innerHTML="";
      const overlay=document.createElement("img");
      overlay.className="overlay";
      overlay.src=`assets/numbers/clipart/${letter}.png`;
      slot.appendChild(overlay);
      document.querySelectorAll(`img.draggable[data-letter='${letter}']`).forEach(el=>el.remove());
      levelAttempts[currentLevel].correct.add(letter);
      correctMatches++;
      showFeedbackCorrect(true);
    } else {
      levelAttempts[currentLevel].incorrect.push(letter);
      showFeedbackCorrect(false);
    }
    updateScore();
  }

  // ====== BUTTONS ======
  continueBtn.onclick=()=>{
    modal.style.display="none";
    currentPage++;
    if(currentPage>=levelDefinitions[currentLevel].pages){
      currentLevel++;
      currentPage=0;
      if(currentLevel>=levelDefinitions.length){
        endGame();
        return;
      }
    }
    generatePage();
    saveProgress();
  };

  againBtn.onclick=()=>{
    modal.style.display="none";
    generatePage();
  };

  finishBtn.onclick=()=>{
    modal.style.display="none";
    endGame();
  };

  stopBtn.onclick=()=>{
    stopScoreEl.innerHTML=`Score: ${calculateScore()}%<br>Time: ${formatSecs(getElapsedSeconds())}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display="block";
  };

  // ====== END GAME ======
  function endGame(){
    modal.style.display="block";
    stopScoreEl.innerHTML=`Final Score: ${calculateScore()}%<br>Time: ${formatSecs(getElapsedSeconds())}<br><img src="assets/auslan-clap.gif" width="150">`;
    submitToGoogleForms();
    clearProgress();
  }

  // ====== INIT ======
  restoreProgress();
  generatePage();
  updateScore();
});
