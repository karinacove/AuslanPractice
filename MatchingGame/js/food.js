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
  // Feedback
  // ----------------------------
  const feedbackImage=document.createElement("img");
  feedbackImage.id="feedbackImage";
  feedbackImage.style.cssText="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;display:none;z-index:9999";
  document.body.appendChild(feedbackImage);
  function showFeedback(correct){ feedbackImage.src=correct?"assets/correct.png":"assets/wrong.png"; feedbackImage.style.display="block"; setTimeout(()=>{feedbackImage.style.display="none"},900); }

  // ----------------------------
  // Drag & Drop
  // ----------------------------
  function dropHandler(e){
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    const slot = e.currentTarget;
    if(!slot?.dataset?.word) return;
    if(word===slot.dataset.word){
      levelAttempts[currentLevel].correct.add(word);
      slot.innerHTML = `<img src="assets/food/clipart/${word}.png" class="overlay">`;
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
      const t=ev.changedTouches[0]; const el=document.elementFromPoint(t.clientX,t.clientY);
      if(el?.classList.contains("slot")) dropHandler({preventDefault:()=>{}, dataTransfer:{getData:k=>k==="text/plain"?word:src}, currentTarget:el});
      document.removeEventListener("touchmove",onMove); document.removeEventListener("touchend",onEnd); clone.remove();
    };
    document.addEventListener("touchmove",onMove,{passive:false});
    document.addEventListener("touchend",onEnd,{passive:false});
  }

  // ----------------------------
  // Page & Draggables
  // ----------------------------
  function getUniquePageWords(words,n=9){
    const picked=[]; const pool=shuffle(words); let i=0;
    while(picked.length<n && i<10000){ const candidate=pool[i%pool.length]; if(!picked.includes(candidate)) picked.push(candidate); i++; }
    return shuffle(picked);
  }

  function buildGridForPage(pageWords,pageIdx){
    gameBoard.innerHTML="";
    const gridType = pageIdx===0?"clipart":pageIdx===1?"sign":"mixed";
    pageWords.forEach(word=>{
      const slot=document.createElement("div");
      slot.className="slot"; slot.dataset.word=word;
      let type=gridType; if(gridType==="mixed") type=Math.random()<0.5?"clipart":"sign"; slot.dataset.gridType=type;
      const url=`assets/food/${type==="sign"?"signs":"clipart"}/${word}${type==="sign"?'-sign':''}.png`;
      slot.style.backgroundImage=`url('${url}')`;
      gameBoard.appendChild(slot);
      slot.addEventListener("dragover",e=>e.preventDefault());
      slot.addEventListener("drop",dropHandler);
    });
    return gridType;
  }

  function buildDraggablesForPage(info,pageWords,gridType){
    leftSigns.innerHTML=""; rightSigns.innerHTML="";
    const TARGET_TOTAL=9*2;
    const uniqueWords=Array.from(new Set(info.words));
    let pool=[];
    pageWords.forEach(w=>{ if(!pool.includes(w)&&uniqueWords.includes(w)) pool.push(w); });
    uniqueWords.forEach(w=>{ if(!pool.includes(w)) pool.push(w); });
    const notOnPage=uniqueWords.filter(w=>!pageWords.includes(w));
    let safe=0; while(pool.length<TARGET_TOTAL && safe<5000){ if(notOnPage.length>0) pool.push(notOnPage.shift()); else pool.push(uniqueWords[Math.floor(Math.random()*uniqueWords.length)]); safe++; }
    const finalList=shuffle(pool).slice(0,TARGET_TOTAL);
    finalList.forEach((word,idx)=>{
      const img=document.createElement("img"); img.className="draggable"; img.draggable=true; img.dataset.word=word;
      let type=gridType; if(gridType==="mixed"){ const slotEl=document.querySelector(`.slot[data-word='${word}']`); type=slotEl?.dataset?.gridType||"clipart"; }
      const isSign=type==="sign"; img.src=`assets/food/${isSign?"signs":"clipart"}/${word}${isSign?"-sign":""}.png`;
      img.addEventListener("dragstart",e=>{ e.dataTransfer.setData("text/plain",word); e.dataTransfer.setData("src",img.src); });
      img.addEventListener("touchstart",touchStartHandler);
      const wrap=document.createElement("div"); wrap.className="drag-wrapper"; wrap.appendChild(img);
      if(idx%2===0) leftSigns.appendChild(wrap); else rightSigns.appendChild(wrap);
    });
  }

  // ----------------------------
  // Page Loading
  // ----------------------------
  function loadPage(){
    if(currentLevel>=levelDefinitions.length){ endGame(); return; }
    const info=levelDefinitions[currentLevel];
    levelTitleEl.innerText=`Level ${currentLevel+1}: ${info.name} (Page ${currentPage+1})`;
    currentPageWords=getUniquePageWords(info.words,9); correctMatches=0;
    const gridType=buildGridForPage(currentPageWords,currentPage);
    buildDraggablesForPage(info,currentPageWords,gridType);
    updateScoreDisplay();
  }

  async function nextPageOrLevel(){
    currentPage++;
    const info=levelDefinitions[currentLevel];
    if(currentPage<info.pages){ saveProgress(); setTimeout(loadPage,700); }
    else{ currentLevel++; currentPage=0; saveProgress(); if(currentLevel>=levelDefinitions.length){ gameEnded=true; saveProgress(); if(modal) modal.style.display="flex"; } else setTimeout(loadPage,700); }
  }

  function saveProgress(){
    const data={studentName,studentClass,currentLevel,currentPage,startTime,gameEnded,levelAttempts:levelAttempts.map(l=>({correct:Array.from(l.correct),incorrect:l.incorrect}))};
    try{ localStorage.setItem(SAVE_KEY,JSON.stringify(data)); } catch(err){ console.warn("Save failed:",err); }
  }

  // ----------------------------
  // End Game / Modal Buttons
  // ----------------------------
  function endGame(){
    gameEnded=true; pauseGame(); saveProgress();
    if(modal) modal.style.display="flex";
    if(continueBtn) continueBtn.style.display="inline-block";
    if(againBtn) againBtn.style.display="inline-block";
    if(finishBtn) finishBtn.style.display="inline-block";
    if(menuBtn) menuBtn.style.display="inline-block";
    if(logoutBtn) logoutBtn.style.display="inline-block";
  }

  if(continueBtn) continueBtn.addEventListener("click",()=>{ modal.style.display="none"; resumeGame(); });
  if(againBtn) againBtn.addEventListener("click",()=>{ restartGame(); modal.style.display="none"; startTimer(); });
  if(finishBtn) finishBtn.addEventListener("click",()=>{ modal.style.display="none"; showClapGIF(); setTimeout(()=>window.location.href="../hub.html",5000); });
  if(menuBtn) menuBtn.addEventListener("click",()=>{ window.location.href="../hub.html"; });
  if(logoutBtn) logoutBtn.addEventListener("click",()=>{ window.location.href="../index.html"; });

  function restartGame(){ currentLevel=0; currentPage=0; elapsedTime=0; startTime=Date.now(); loadPage(); updateScoreDisplay(); }
  function showClapGIF(){ alert("🎉 Clap GIF would show here"); }

  // ----------------------------
  // Initialize
  // ----------------------------
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
  if(saved){ currentLevel=saved.currentLevel||0; currentPage=saved.currentPage||0; startTime=saved.startTime||Date.now(); }
  loadPage();
  startTimer();
});
