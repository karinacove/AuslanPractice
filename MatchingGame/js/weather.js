document.addEventListener("DOMContentLoaded", function () {

  // ----------------------------
  // Student gating
  // ----------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  // ----------------------------
  // DOM Elements
  // ----------------------------
  const studentInfoEl = document.getElementById("student-info");
  const scoreDisplayEl = document.getElementById("score-display");
  const levelTitleEl = document.getElementById("levelTitle");
  const leftSigns = document.getElementById("leftSigns");
  const middleSlots = document.getElementById("middleSlots"); // New container for blank answer slots
  const rightSigns = document.getElementById("rightSigns");
  const gameBoard = document.getElementById("gameBoard");
  const modal = document.getElementById("end-modal");
  const scoreModalText = document.getElementById("score-display-modal");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const againBtn = document.getElementById("again-btn");
  const stopBtn = document.getElementById("stop-btn");

  studentInfoEl.innerText = `${studentName} (${studentClass})`;

  // ----------------------------
  // State
  // ----------------------------
  let currentLevel = 0;
  let correctMatches = 0;
  let gameEnded = false;
  const startTime = Date.now();
  const saveKey = "weatherClothingSave";

  const levelAttempts = Array(6).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // ----------------------------
  // Data
  // ----------------------------
  const weatherItems = [
    { key:"sunny", obviousClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart:"assets/weather/clipart/sunny.png", sign:"assets/weather/signs/sunny.png" },
    { key:"cloudy", obviousClothing:["shirt","jumper","shorts","pants","shoes","socks","skirt","dress"], clipart:"assets/weather/clipart/cloudy.png", sign:"assets/weather/signs/cloudy.png" },
    { key:"rainy", obviousClothing:["jacket","pants","umbrella"], clipart:"assets/weather/clipart/rainy.png", sign:"assets/weather/signs/rainy.png" },
    { key:"stormy", obviousClothing:["jacket","socks","shoes","pants"], clipart:"assets/weather/clipart/stormy.png", sign:"assets/weather/signs/stormy.png" },
    { key:"windy", obviousClothing:["jumper","socks","shoes","pants","jacket"], clipart:"assets/weather/clipart/windy.png", sign:"assets/weather/signs/windy.png" },
    { key:"snowy", obviousClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart:"assets/weather/clipart/snowy.png", sign:"assets/weather/signs/snowy.png" },
    { key:"cold", obviousClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart:"assets/weather/clipart/snowy.png", sign:"assets/weather/signs/cold.png" },
    { key:"hot", obviousClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart:"assets/weather/clipart/sunny.png", sign:"assets/weather/signs/hot.png" }
    { key:"earthquake", obviousClothing:["clothes"], clipart:"assets/weather/clipart/earthquake.png", sign:"assets/weather/signs/earthquake.png" },
    { key:"weather", obviousClothing:["clothes"], clipart:"assets/weather/clipart/weather.png", sign:"assets/weather/signs/weather.png" },
    { key:"cyclone", obviousClothing:["clothes"], clipart:"assets/weather/clipart/cyclone.png", sign:"assets/weather/signs/cyclone.png" },
    { key:"rainbow", obviousClothing:["clothes"], clipart:"assets/weather/clipart/rainbow.png", sign:"assets/weather/signs/rainbow.png" }
  ];

  const clothingItems = [
    { key:"hat", clipart:"assets/clothing/clipart/hat.png", sign:"assets/clothing/signs/hat.png", primaryWeather:"sunny" },
    { key:"shirt", clipart:"assets/clothing/clipart/shirt.png", sign:"assets/clothing/signs/shirt.png", primaryWeather:"cloudy" },
    { key:"shorts", clipart:"assets/clothing/clipart/shorts.png", sign:"assets/clothing/signs/shorts.png", primaryWeather:"sunny" },
    { key:"thongs", clipart:"assets/clothing/clipart/thongs.png", sign:"assets/clothing/signs/thongs.png", primaryWeather:"sunny" },
    { key:"bathers", clipart:"assets/clothing/clipart/bathers.png", sign:"assets/clothing/signs/bathers.png", primaryWeather:"sunny" },
    { key:"skirt", clipart:"assets/clothing/clipart/skirt.png", sign:"assets/clothing/signs/skirt.png", primaryWeather:"sunny" },
    { key:"dress", clipart:"assets/clothing/clipart/dress.png", sign:"assets/clothing/signs/dress.png", primaryWeather:"sunny" },
    { key:"jumper", clipart:"assets/clothing/clipart/jumper.png", sign:"assets/clothing/signs/jumper.png", primaryWeather:"cloudy" },
    { key:"pants", clipart:"assets/clothing/clipart/pants.png", sign:"assets/clothing/signs/pants.png", primaryWeather:"cloudy" },
    { key:"shoes", clipart:"assets/clothing/clipart/shoes.png", sign:"assets/clothing/signs/shoes.png", primaryWeather:"cloudy" },
    { key:"socks", clipart:"assets/clothing/clipart/socks.png", sign:"assets/clothing/signs/socks.png", primaryWeather:"cloudy" },
    { key:"jacket", clipart:"assets/clothing/clipart/jacket.png", sign:"assets/clothing/signs/jacket.png", primaryWeather:"windy" },
    { key:"umbrella", clipart:"assets/clothing/clipart/umbrella.png", sign:"assets/clothing/signs/umbrella.png", primaryWeather:"rainy" },
    { key:"gloves", clipart:"assets/clothing/clipart/gloves.png", sign:"assets/clothing/signs/gloves.png", primaryWeather:"snowy" },
    { key:"scarf", clipart:"assets/clothing/clipart/scarf.png", sign:"assets/clothing/signs/scarf.png", primaryWeather:"snowy" },
    { key:"beanie", clipart:"assets/clothing/clipart/beanie.png", sign:"assets/clothing/signs/beanie.png", primaryWeather:"snowy" }
    { key:"clothes", clipart:"assets/clothing/clipart/clothes.png", signs:"assets/clothing/signs/clothes.png", primaryWeather: "rainbow","cyclone","weather", "earthquake" }
  ];

  // Quick lookups
  const W = Object.fromEntries(weatherItems.map(w => [w.key, w]));
  const C = Object.fromEntries(clothingItems.map(c => [c.key, c]));
  const allWeather = weatherItems.map(w => w.key);
  const allClothing = clothingItems.map(c => c.key);

  // Level definitions
  const levels = [
    { name: "Weather Signs → Weather Images", leftPool: allWeather, rightPool: allWeather, leftMode: "sign", rightMode: "clipart" },
    { name: "Weather Images → Weather Signs", leftPool: allWeather, rightPool: allWeather, leftMode: "clipart", rightMode: "sign" },
    { name: "Clothing Signs → Clothing Images", leftPool: allClothing, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Images → Clothing Signs", leftPool: allClothing, rightPool: allClothing, leftMode: "clipart", rightMode: "sign" },
    { name: "Weather Signs → Clothing Images", leftPool: allWeather.filter(w=>W[w].obviousClothing), rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Weather Images → Clothing Signs", leftPool: allWeather.filter(w=>W[w].obviousClothing), rightPool: allClothing, leftMode: "clipart", rightMode: "sign" }
  ];

  // ----------------------------
  // Utilities
  // ----------------------------
  function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }

  function showFeedback(correct) {
    const feedbackImage = document.getElementById("feedbackImage") || document.createElement("img");
    if(!feedbackImage.id) {
      feedbackImage.id = "feedbackImage";
      Object.assign(feedbackImage.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "200px",
        display: "none",
        zIndex: "2000",
        pointerEvents: "none"
      });
      document.body.appendChild(feedbackImage);
    }
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(() => feedbackImage.style.display = "none", 700);
  }

  function updateScore() {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = (totalCorrect+totalIncorrect>0) ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100) : 0;
    scoreDisplayEl.innerText = `Score: ${percent}%`;
    return percent;
  }

  // ----------------------------
  // Save / Restore
  // ----------------------------
  function saveProgress(){
    try{
      localStorage.setItem(saveKey, JSON.stringify({
        studentName, studentClass, currentLevel,
        levelAttempts: levelAttempts.map(l=>({ correct:Array.from(l.correct), incorrect:l.incorrect })),
        timestamp: Date.now()
      }));
    }catch(e){ console.warn("Save failed", e); }
  }

  function restoreProgress(){
    try{
      const raw = localStorage.getItem(saveKey);
      if(!raw) return false;
      const data = JSON.parse(raw);
      if(!data || data.studentName !== studentName || data.studentClass !== studentClass) return false;
      currentLevel = data.currentLevel || 0;
      if(Array.isArray(data.levelAttempts)){
        data.levelAttempts.forEach((lvl,i)=>{
          levelAttempts[i].correct = new Set(lvl.correct || []);
          levelAttempts[i].incorrect = lvl.incorrect || [];
        });
      }
      return true;
    }catch(e){ return false; }
  }

  // ----------------------------
  // Match checking
  // ----------------------------
  function checkMatch(slotKey, draggedKey){
    const lvl = currentLevel;

    if(lvl <= 3) return slotKey === draggedKey;

    if(lvl === 4 || lvl === 5) {
      // check if slotKey accepts draggedKey
      const slot = W[slotKey] || C[slotKey];
      if(!slot || !slot.allowedClothing) return false;
      return slot.allowedClothing.includes(draggedKey);
    }

    return false;
  }

  // ----------------------------
  // Drag & Drop
  // ----------------------------
  function makeDraggable(img, key) {
    img.classList.add("draggable");
    img.draggable = true;
    img.dataset.key = key;
    img.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", key));
  }

  function handleDrop(e){
    e.preventDefault?.();
    const slot = e.currentTarget;
    const slotKey = slot.dataset.key;
    const draggedKey = e.dataTransfer.getData("text/plain");
    if(!draggedKey) return;

    const isCorrect = checkMatch(slotKey, draggedKey);
    if(isCorrect){
      slot.innerHTML = "";
      const img = document.createElement("img");
      img.src = C[draggedKey].clipart;
      img.style.width = "100%";
      img.style.height = "100%";
      slot.appendChild(img);
      slot.dataset.filled = "true";

      correctMatches++;
      showFeedback(true);
      updateScore();

      document.querySelectorAll(`img.draggable[data-key='${draggedKey}']`).forEach(el => el.remove());

      if(correctMatches >= document.querySelectorAll(".slot").length){
        correctMatches = 0;
        currentLevel++;
        if(currentLevel >= levels.length){
          modal.style.display = "flex";
          endGame();
        } else setTimeout(loadPage, 600);
      }
    } else {
      showFeedback(false);
      slot.classList.add("shake");
      setTimeout(() => slot.classList.remove("shake"), 450);
      levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${slotKey}`);
    }
    saveProgress();
  }

  function makeSlotDroppable(slot){
    slot.classList.add("slot");
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", handleDrop);
  }

  // ----------------------------
  // Load page / level
  // ----------------------------
  function loadPage(){
    const info = levels[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel+1}: ${info.name}`;
    leftSigns.innerHTML = "";
    middleSlots.innerHTML = "";
    rightSigns.innerHTML = "";
    gameBoard.innerHTML = "";

    if(currentLevel <= 3){
      // normal level: left and right draggables
      const leftPool = shuffle(info.leftPool).slice(0, Math.min(9, info.leftPool.length));
      leftPool.forEach((key, idx) => {
        const img = document.createElement("img");
        img.src = (info.leftMode === "clipart" ? (W[key]?.clipart || C[key]?.clipart) : (W[key]?.sign || C[key]?.sign));
        img.style.width="100%"; img.style.height="100%";
        makeDraggable(img, key);
        const wrapper = document.createElement("div");
        wrapper.className = "drag-wrapper"; wrapper.style.width="120px"; wrapper.style.height="120px"; wrapper.style.margin="8px";
        wrapper.appendChild(img);
        (idx<Math.ceil(leftPool.length/2)?leftSigns:rightSigns).appendChild(wrapper);
      });
    } else {
      // Level 5 & 6: weather -> clothing
      const weatherPool = shuffle(info.leftPool);
      weatherPool.forEach(wKey => {
        const w = W[wKey];
        const wImg = document.createElement("img");
        wImg.src = info.leftMode==="clipart"? w.clipart : w.sign;
        wImg.style.width="100%"; wImg.style.height="100%";
        const wWrapper = document.createElement("div"); wWrapper.style.width="120px"; wWrapper.style.height="120px"; wWrapper.style.margin="8px";
        wWrapper.appendChild(wImg);
        leftSigns.appendChild(wWrapper);

        // Create blank middle slots for each obvious clothing
        w.obviousClothing.forEach(cKey=>{
          const slot = document.createElement("div");
          slot.className="slot"; slot.dataset.key=wKey; slot.style.width="120px"; slot.style.height="120px"; slot.style.margin="8px";
          makeSlotDroppable(slot);
          middleSlots.appendChild(slot);
        });
      });

      // Draggables: all clothing
      clothingItems.forEach(c=>{
        const img = document.createElement("img");
        img.src = info.rightMode==="clipart"? c.clipart : c.sign;
        img.style.width="100%"; img.style.height="100%";
        makeDraggable(img, c.key);
        const wrapper = document.createElement("div");
        wrapper.className="drag-wrapper"; wrapper.style.width="120px"; wrapper.style.height="120px"; wrapper.style.margin="8px";
        wrapper.appendChild(img);
        rightSigns.appendChild(wrapper);
      });
    }
    correctMatches = 0;
    updateScore();
    saveProgress();
  }

  // ----------------------------
  // Modal / Buttons
  // ----------------------------
  stopBtn.addEventListener("click", ()=> { modal.style.display="flex"; });
  continueBtn.addEventListener("click", ()=> { modal.style.display="none"; loadPage(); });
  againBtn.addEventListener("click", ()=> { localStorage.removeItem(saveKey); location.reload(); });
  finishBtn.addEventListener("click", ()=> { if(!gameEnded) endGame(); setTimeout(()=>window.location.href="../MatchingGame/hub.html",1400); });

  // ----------------------------
  // End Game / Google Form submission
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

  function endGame(){
    if(gameEnded) return;
    gameEnded = true;
    const elapsedSec = Math.round((Date.now()-startTime)/1000);
    const percent = updateScore();
    const timeString = `${Math.floor(elapsedSec/60)} mins ${elapsedSec%60} sec`;
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);

    const entries = {};
    entries[formEntries.studentName]=studentName;
    entries[formEntries.studentClass]=studentClass;
    entries[formEntries.subject]="Weather";
    entries[formEntries.timeTaken]=timeString;
    entries[formEntries.percentage]=`${percent}%`;
    entries[formEntries.currentLevel]=`${Math.min(currentLevel+1,levels.length)}`;
    for(let i=0;i<6;i++){
      entries[formEntries[`level${i+1}Correct`]]=Array.from(levelAttempts[i].correct).join(",");
      entries[formEntries[`level${i+1}Incorrect`]]=levelAttempts[i].incorrect.join(",");
    }
    entries[formEntries.totalCorrect]=`${totalCorrect}`;
    entries[formEntries.totalIncorrect]=`${totalIncorrect}`;
    entries[formEntries.errorsReviewed]="";

    const form = document.createElement("form");
    form.action=formURL; form.method="POST"; form.target="hidden_iframe"; form.style.display="none";
    if(!document.querySelector("iframe[name='hidden_iframe']")){
      const iframe=document.createElement("iframe"); iframe.name="hidden_iframe"; iframe.style.display="none"; document.body.appendChild(iframe);
    }
    for(const key in entries){
      const input=document.createElement("input"); input.type="hidden"; input.name=key; input.value=entries[key]; form.appendChild(input);
    }
    document.body.appendChild(form); form.submit();

    scoreModalText.innerHTML=`Score: ${percent}%<br>Time: ${timeString}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display="flex";
  }

  // ----------------------------
  // Init
  // ----------------------------
  restoreProgress();
  loadPage();
});
