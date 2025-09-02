// ==================================================
// Food Matching Game — Levels 1–6 (with optional review)
// ==================================================
document.addEventListener("DOMContentLoaded", function () {

  // ----------------------------
  // Student gating
  // ----------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) { window.location.href = "../index.html"; return; }

  // ----------------------------
  // DOM Handles
  // ----------------------------
  const studentInfoEl = document.getElementById("student-info");
  const scoreDisplayEl = document.getElementById("score-display");
  const levelTitleEl = document.getElementById("levelTitle");
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const stopBtn = document.getElementById("stop-btn");
  const continueBtn = document.getElementById("continue-btn");
  const againBtn = document.getElementById("again-btn");
  const finishBtn = document.getElementById("finish-btn");
  const menuBtn = document.getElementById("menu-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const modal = document.getElementById("end-modal");

  studentInfoEl.innerText = `${studentName} (${studentClass})`;

  // ----------------------------
  // Game state
  // ----------------------------
  let currentLevel = 0;
  let currentPage = 0;
  let currentPageWords = [];
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();
  let elapsedTime = 0;
  let timerInterval = null;

  const SAVE_KEY = "foodGameSave_v1";

  // Word Banks & Levels
  const wordBanks = {
    1: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    2: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    3: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","pasta"],
    4: ["apple","banana","blueberry","cherry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon","fruit"],
    5: ["carrot","corn","cucumber","lettuce","mushroom","onion","peas","beans","potato","pumpkin","tomato","vegetables"],
    6: ["bacon","bread","burger","cake","cereal","cheese","egg","meat","pizza","salami","chips","biscuit"]
  };

  const levelDefinitions = [
    { words: wordBanks[1], pages: 3, name: "Fruit" },
    { words: wordBanks[2], pages: 3, name: "Vegetables" },
    { words: wordBanks[3], pages: 3, name: "More Food" },
    { words: wordBanks[4], pages: 3, name: "Fruit (Review)" },
    { words: wordBanks[5], pages: 3, name: "Vegetables (Review)" },
    { words: wordBanks[6], pages: 3, name: "More Food (Review)" }
  ];

  const levelAttempts = Array(levelDefinitions.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // ----------------------------
  // Google Form mapping
  // ----------------------------
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfP71M2M1SmaIzHVnsOSx4390iYgSxQy7Yo3NAPpbsR_Q7JaA/formResponse";
  const formEntries = {
    studentName: "entry.649726739",
    studentClass: "entry.2105926443",
    subject: "entry.1916287201",
    timeTaken: "entry.1743763592",
    percentage: "entry.393464832",
    currentLevel: "entry.1202549392",
    level1Correct: "entry.1933213595",
    level1Incorrect: "entry.2087978837",
    level2Correct: "entry.1160438650",
    level2Incorrect: "entry.2081595072",
    level3Correct: "entry.883075031",
    level3Incorrect: "entry.2093517837",
    level4Correct: "entry.498801806",
    level4Incorrect: "entry.754032840",
    level5Correct: "entry.1065703343",
    level5Incorrect: "entry.880100066",
    level6Correct: "entry.1360743630",
    level6Incorrect: "entry.112387671",
    totalCorrect: "entry.395384696",
    totalIncorrect: "entry.1357567724",
    errorsReviewed: "entry.11799771"
  };

  // ----------------------------
  // Utilities
  // ----------------------------
  function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function calculatePercent() {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    return totalCorrect + totalIncorrect === 0 ? 0 : Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100);
  }
  function updateScoreDisplay() { if(scoreDisplayEl) scoreDisplayEl.innerText=`Score: ${calculatePercent()}%`; }

  // ----------------------------
  // Timer
  // ----------------------------
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const start = Date.now() - elapsedTime*1000;
    timerInterval = setInterval(()=>{
      elapsedTime = Math.floor((Date.now()-start)/1000);
    },1000);
  }
  function pauseGame(){ clearInterval(timerInterval); timerInterval=null; }
  function resumeGame(){ gameEnded=false; startTimer(); }

  // ----------------------------
  // Feedback image
  // ----------------------------
  const feedbackImage=document.createElement("img");
  feedbackImage.id="feedbackImage";
  feedbackImage.style.cssText="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;display:none;z-index:9999";
  document.body.appendChild(feedbackImage);
  function showFeedback(correct){ feedbackImage.src=correct?"assets/correct.png":"assets/wrong.png"; feedbackImage.style.display="block"; setTimeout(()=>{feedbackImage.style.display="none"},900); }

  // ----------------------------
  // Save/Restore
  // ----------------------------
  function saveProgress(){
    const data={studentName,studentClass,currentLevel,currentPage,startTime,gameEnded,levelAttempts:levelAttempts.map(l=>({correct:Array.from(l.correct),incorrect:l.incorrect}))};
    try{ localStorage.setItem(SAVE_KEY,JSON.stringify(data)); } catch(err){ console.warn("Save failed:",err); }
  }
  function restoreProgressFromData(data){
    if(!data) return false;
    try{
      if(data.studentName && data.studentName!==studentName) return false;
      if(data.studentClass && data.studentClass!==studentClass) return false;
      currentLevel=clamp(data.currentLevel||0,0,levelDefinitions.length-1);
      currentPage=clamp(data.currentPage||0,0,levelDefinitions[currentLevel].pages-1);
      startTime=data.startTime||Date.now();
      gameEnded=!!data.gameEnded;
      (data.levelAttempts||[]).forEach((l,i)=>{
        if(!levelAttempts[i]) levelAttempts[i]={correct:new Set(),incorrect:[]};
        levelAttempts[i].correct=new Set(l.correct||[]);
        levelAttempts[i].incorrect=l.incorrect||[];
      });
      updateScoreDisplay();
      return true;
    } catch(err){ console.warn("Restore parse failed:",err); return false; }
  }

  // ----------------------------
  // Drag & Drop
  // ----------------------------
  function dropHandler(e){
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");
    const slot = e.currentTarget;
    if(!slot?.dataset?.word) return;
    const targetWord = slot.dataset.word;
    if(word===targetWord){
      if(!levelAttempts[currentLevel].correct.has(word)) levelAttempts[currentLevel].correct.add(word);
      slot.innerHTML = `<img class="overlay" src="${src}">`;
      document.querySelectorAll(`img.draggable[data-word='${word}']`).forEach(el=>el.remove());
      correctMatches++;
      showFeedback(true);
      updateScoreDisplay();
      saveProgress();
      if(correctMatches>=document.querySelectorAll(".slot").length){
        correctMatches=0;
        nextPageOrLevel();
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(word);
      showFeedback(false);
      updateScoreDisplay();
      saveProgress();
      const wrong = document.querySelector(`img.draggable[data-word='${word}']`);
      if(wrong){ wrong.classList.add("shake"); setTimeout(()=>wrong.classList.remove("shake"),400); }
    }
  }

  // ----------------------------
  // Touch support
  // ----------------------------
  function touchStartHandler(e){
    if(!e.target?.classList.contains("draggable")) return;
    e.preventDefault();
    const target=e.target;
    const word=target.dataset.word;
    const src=target.src;
    const clone=target.cloneNode(true);
    clone.style.position="absolute"; clone.style.pointerEvents="none"; clone.style.opacity="0.85"; clone.style.zIndex="10000";
    clone.style.width=`${Math.min(target.naturalWidth||110,110)}px`; clone.style.height="auto";
    document.body.appendChild(clone);
    const moveClone = t=>{ clone.style.left=`${t.clientX-clone.width/2}px`; clone.style.top=`${t.clientY-clone.height/2}px`; };
    moveClone(e.touches[0]);
    const onMove=ev=>moveClone(ev.touches[0]);
        const onEnd=ev=>{
      const touch=ev.changedTouches[0];
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      if(el?.classList.contains("slot")){
        dropHandler({
          preventDefault:()=>{},
          dataTransfer:{
            getData:k=>k==="text/plain"?word:src
          },
          currentTarget:el
        });
      }
      document.removeEventListener("touchmove",onMove);
      document.removeEventListener("touchend",onEnd);
      clone.remove();
    };
    document.addEventListener("touchmove",onMove,{passive:false});
    document.addEventListener("touchend",onEnd,{passive:false});
  }

  // ----------------------------
  // Page grid & draggables
  // ----------------------------
  function getUniquePageWords(words,n=9){
    const picked=[]; const pool=shuffle(words); let i=0;
    while(picked.length<n && i<10000){ const candidate=pool[i%pool.length]; if(!picked.includes(candidate)) picked.push(candidate); i++; }
    return shuffle(picked);
  }

function buildGridForPage(pageWords, pageIdx){
    gameBoard.innerHTML = "";

    // Page 0: clipart, Page 1: sign, Page 2: mixed
    let gridType;
    if(pageIdx === 0) gridType = "clipart";
    else if(pageIdx === 1) gridType = "sign";
    else gridType = "mixed";

    pageWords.forEach(word => {
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.dataset.word = word;
        let slotType = gridType;
        if(gridType === "mixed") slotType = Math.random() < 0.5 ? "clipart" : "sign";
        slot.dataset.gridType = slotType;
        const url = `assets/food/${slotType === "sign" ? "signs" : "clipart"}/${word}${slotType === "sign" ? "-sign" : ""}.png`;
        slot.style.backgroundImage = `url('${url}')`;
        slot.addEventListener("dragover", e => e.preventDefault());
        slot.addEventListener("drop", dropHandler);
        gameBoard.appendChild(slot);
    });

    return gridType;
}


function buildDraggablesForPage(info, pageWords, gridType){
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    const pairsPerSide = (currentLevel <= 2) ? 6 : 9;
    const TARGET_TOTAL = pairsPerSide * 2;
    const uniqueWords = Array.from(new Set(info.words));
    let pool = [];

    // Include previous incorrect words for levels 4+
    if(currentLevel >= 3){
        let priority = [];
        for(let li = 0; li < currentLevel; li++){
            if(levelAttempts[li]?.incorrect?.length) priority = priority.concat(levelAttempts[li].incorrect);
        }
        priority = Array.from(new Set(priority)).filter(w => uniqueWords.includes(w));
        pool.push(...priority);
    }

    // Add current page words and all other words to the pool
    pageWords.forEach(w => { if(!pool.includes(w) && uniqueWords.includes(w)) pool.push(w); });
    uniqueWords.forEach(w => { if(!pool.includes(w)) pool.push(w); });

    // Fill pool to TARGET_TOTAL
    const notOnPage = uniqueWords.filter(w => !pageWords.includes(w));
    let safe = 0;
    while(pool.length < TARGET_TOTAL && safe < 5000){
        if(notOnPage.length > 0) pool.push(notOnPage.shift());
        else pool.push(uniqueWords[Math.floor(Math.random() * uniqueWords.length)]);
        safe++;
    }

    const finalList = shuffle(pool).slice(0, TARGET_TOTAL);

    finalList.forEach((word, idx) => {
        const img = document.createElement("img");
        img.className = "draggable";
        img.draggable = true;
        img.dataset.word = word;

        // Determine slot type and assign opposite for draggable
        const slotEl = document.querySelector(`.slot[data-word='${word}']`);
        const slotType = slotEl?.dataset?.gridType || "clipart";
        const draggableType = slotType === "sign" ? "clipart" : "sign";

        img.src = `assets/food/${draggableType === "sign" ? "signs" : "clipart"}/${word}${draggableType === "sign" ? '-sign' : ''}.png`;

        img.addEventListener("dragstart", e => { 
            e.dataTransfer.setData("text/plain", word); 
            e.dataTransfer.setData("src", img.src); 
        });
        img.addEventListener("touchstart", touchStartHandler);

        const wrap = document.createElement("div");
        wrap.className = "drag-wrapper";
        wrap.appendChild(img);

        if(idx % 2 === 0) leftSigns.appendChild(wrap);
        else rightSigns.appendChild(wrap);
    });
}

  // ----------------------------
  // Page loading & progression
  // ----------------------------
  function loadPage(){
    if(currentLevel>=levelDefinitions.length){ endGame(); return; }
    const info=levelDefinitions[currentLevel];
    levelTitleEl.innerText=`Level ${currentLevel+1}: ${info.name} (Page ${currentPage+1})`;
    currentPageWords=getUniquePageWords(info.words,9);
    correctMatches=0;
    const gridType=buildGridForPage(currentPageWords,currentPage);
    buildDraggablesForPage(info,currentPageWords,gridType);
    updateScoreDisplay();
  }

  async function nextPageOrLevel(){
    try{ await submitCurrentProgressToForm(currentLevel); } catch(err){ console.warn("Submit failed:",err); }
    currentPage++;
    const info=levelDefinitions[currentLevel];
    if(currentPage<info.pages){ saveProgress(); setTimeout(loadPage,700); }
    else{
      currentLevel++; currentPage=0; saveProgress();
      if(currentLevel>=levelDefinitions.length){ gameEnded=true; saveProgress(); try{ await submitFinalResultsToForm(); }catch(err){ console.warn("Final submit failed:",err); } modal.style.display="flex"; showEndMenu(); }
      else setTimeout(loadPage,700);
    }
  }

  // ----------------------------
  // Google Form Submission
  // ----------------------------
  async function submitCurrentProgressToForm(levelIdx){
    if(typeof levelIdx!=="number" || levelIdx<0 || levelIdx>=levelAttempts.length) return;
    const lvlAttempt=levelAttempts[levelIdx];
    const totalCorrect=lvlAttempt.correct.size; const totalIncorrect=lvlAttempt.incorrect.length;
    const percent=totalCorrect+totalIncorrect>0?Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100):0;
    const levelNum=levelIdx+1; const pageNum=currentPage+1; const levelPageString=`L${levelNum}P${pageNum}`;
    const formData=new FormData();
    formData.append(formEntries.studentName,studentName);
    formData.append(formEntries.studentClass,studentClass);
    formData.append(formEntries.subject,"Food");
    formData.append(formEntries.currentLevel,levelPageString);
    const correctKey=formEntries[`level${levelNum}Correct`]; const incorrectKey=formEntries[`level${levelNum}Incorrect`];
    formData.append(correctKey,Array.from(lvlAttempt.correct).join(","));
    formData.append(incorrectKey,lvlAttempt.incorrect.join(","));
    formData.append(formEntries.percentage,percent);
    formData.append(formEntries.timeTaken,Math.round((Date.now()-startTime)/1000));
    await fetch(formURL,{method:"POST",body:formData,mode:"no-cors"});
  }

  async function submitFinalResultsToForm(){
    const totalCorrect=levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect=levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent=totalCorrect+totalIncorrect===0?0:Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100);
    const timeTaken=Math.round((Date.now()-startTime)/1000);
    const formData=new FormData();
    formData.append(formEntries.studentName,studentName);
    formData.append(formEntries.studentClass,studentClass);
    formData.append(formEntries.subject,"Food");
    formData.append(formEntries.totalCorrect,totalCorrect);
    formData.append(formEntries.totalIncorrect,totalIncorrect);
    formData.append(formEntries.percentage,percent);
    formData.append(formEntries.timeTaken,timeTaken);
    levelAttempts.forEach((lvl,idx)=>{
      const n=idx+1;
      formData.append(formEntries[`level${n}Correct`],Array.from(lvl.correct).join(","));
      formData.append(formEntries[`level${n}Incorrect`],lvl.incorrect.join(","));
    });
    await fetch(formURL,{method:"POST",body:formData,mode:"no-cors"});
  }

  // ----------------------------
  // End game / modal
  // ----------------------------
async function endGame() {
  gameEnded = true;
  pauseGame(); // stops timer/gameplay
  saveProgress();

  try {
    await submitFinalResultsToForm();
  } catch (err) {
    console.warn("Final submit failed:", err);
  }

  if (modal) modal.style.display = "flex";
  showEndMenu(); // handles showing clap, score/time, and buttons
}

// Hook up stop button
const stopBtn = document.getElementById("stop-btn");
if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    endGame();
  });
}

  function showEndMenu(){
    continueBtn.style.display="inline-block";
    againBtn.style.display="inline-block";
    finishBtn.style.display="inline-block";
    menuBtn.style.display="inline-block";
    logoutBtn.style.display="inline-block";
  }

  // ----------------------------
  // Button logic
  // ----------------------------
if (continueBtn) continueBtn.addEventListener("click", () => {
  modal.style.display = "none";
  resumeGame();
});
if (againBtn) againBtn.addEventListener("click", async () => {
  await submitFinalResultsToForm();   
  clearProgress();                  
  restartGame();                      
  modal.style.display = "none";
  startTimer();
});
if (finishBtn) finishBtn.addEventListener("click", async () => {
  await submitFinalResultsToForm();  
  clearProgress();                    
  modal.style.display = "none";
  showClapGIF();
  await new Promise(r => setTimeout(r, 5000));
  window.location.href = "../hub.html";
});
if (logoutBtn) logoutBtn.addEventListener("click", async () => {
  await submitFinalResultsToForm();  
  clearProgress();                   
  window.location.href = "../index.html";
});

  // ----------------------------
  // Game init
  // ----------------------------
  const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
  if(!restoreProgressFromData(saved)){ currentLevel=0; currentPage=0; startTime=Date.now(); }
  loadPage(); startTimer();

  // ----------------------------
  // Restart game
  // ----------------------------
  function restartGame(){
    currentLevel=0; currentPage=0; correctMatches=0; gameEnded=false; startTime=Date.now(); elapsedTime=0;
    levelAttempts.forEach(l=>{ l.correct.clear(); l.incorrect=[]; });
    saveProgress(); loadPage(); updateScoreDisplay();
  }

  // ----------------------------
  // Clap GIF function
  // ----------------------------
  function showClapGIF(){
    const gif=document.createElement("img");
    gif.src="assets/auslan-clap.gif"; gif.style.cssText="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;z-index:9999;";
    document.body.appendChild(gif);
    setTimeout(()=>gif.remove(),5000);
  }

});
