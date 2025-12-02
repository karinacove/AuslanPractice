document.addEventListener("DOMContentLoaded", () => {
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
  // DOM references
  // ----------------------------
  const ensureEl = (id, tag = "div", cls = "") => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      if (cls) el.className = cls;
      el.id = id;
      (document.querySelector(".layout") || document.body).appendChild(el);
    }
    return el;
  };

  const studentInfoEl = ensureEl("student-info");
  const scoreDisplayEl = ensureEl("score-display");
  const levelTitleEl = ensureEl("levelTitle", "h1");
  const leftSigns = ensureEl("leftSigns", "div", "left-signs");
  const middleSlots = ensureEl("middleSlots", "div", "middle-slots");
  const rightSigns = ensureEl("rightSigns", "div", "right-signs");
  const gameBoard = document.getElementById("gameBoard") || null;
  const modal = ensureEl("end-modal");
  const scoreModalText = ensureEl("score-display-modal", "p");
  const continueBtn = ensureEl("continue-btn", "button");
  const finishBtn = ensureEl("finish-btn", "button");
  const againBtn = ensureEl("again-btn", "button");
  const stopBtn = ensureEl("stop-btn", "button");

  studentInfoEl.innerText = `${studentName} (${studentClass})`;

  // ----------------------------
  // State
  // ----------------------------
  let currentLevel = 0;
  let pageIndex = 0;
  let correctMatches = 0;
  let gameEnded = false;
  const startTime = Date.now();
  const saveKey = "weatherClothingSave_v3";

  const levelAttempts = Array(6).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  const pagesPerLevel = 2;
  const itemsPerPage = 3;

  // ----------------------------
  // Data
  // ----------------------------
  const weatherItems = [
    { key:"sunny", obviousClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart:"assets/weather/clipart/sunny.png", sign:"assets/weather/signs/sunny.png" },
    { key:"cloudy", obviousClothing:["shirt","jumper","shorts","pants","shoes","socks","skirt","dress"], clipart:"assets/weather/clipart/cloudy.png", sign:"assets/weather/signs/cloudy.png" },
    { key:"rainy", obviousClothing:["umbrella","jacket","pants"], clipart:"assets/weather/clipart/rainy.png", sign:"assets/weather/signs/rainy.png" },
    { key:"stormy", obviousClothing:["boots","jacket","socks","shoes","pants"], clipart:"assets/weather/clipart/stormy.png", sign:"assets/weather/signs/stormy.png" },
    { key:"windy", obviousClothing:["jacket","jumper","socks","shoes","pants"], clipart:"assets/weather/clipart/windy.png", sign:"assets/weather/signs/windy.png" },
    { key:"snowy", obviousClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart:"assets/weather/clipart/snowy.png", sign:"assets/weather/signs/snowy.png" },
    { key:"cold", obviousClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart:"assets/weather/clipart/cold.png", sign:"assets/weather/signs/cold.png" },
    { key:"hot", obviousClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart:"assets/weather/clipart/hot.png", sign:"assets/weather/signs/hot.png" },
    { key:"earthquake", clipart:"assets/weather/clipart/earthquake.png", sign:"assets/weather/signs/earthquake.png" },
    { key:"weather", clipart:"assets/weather/clipart/weather.png", sign:"assets/weather/signs/weather.png" },
    { key:"cyclone", clipart:"assets/weather/clipart/cyclone.png", sign:"assets/weather/signs/cyclone.png" },
    { key:"rainbow", clipart:"assets/weather/clipart/rainbow.png", sign:"assets/weather/signs/rainbow.png" }
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
    { key:"beanie", clipart:"assets/clothing/clipart/beanie.png", sign:"assets/clothing/signs/beanie.png", primaryWeather:"snowy" },
    { key:"clothes", clipart:"assets/clothing/clipart/clothes.png", sign:"assets/clothing/signs/clothes.png", primaryWeather: "weather" }
  ];

  const W = Object.fromEntries(weatherItems.map(w => [w.key, w]));
  const C = Object.fromEntries(clothingItems.map(c => [c.key, c]));
  const allWeather = weatherItems.map(w => w.key);
  const matchableWeather = weatherItems.filter(w => Array.isArray(w.obviousClothing) && w.obviousClothing.length>0).map(w=>w.key);
  const allClothing = clothingItems.map(c=>c.key);

  // ----------------------------
  // Levels
  // ----------------------------
  const levels = [
    { name: "Weather Signs → Clothing Images (paged)", leftPool: matchableWeather, rightPool: allClothing, leftMode:"sign", rightMode:"clipart", paged:true },
    { name: "Weather Images → Clothing Signs (paged)", leftPool: matchableWeather, rightPool: allClothing, leftMode:"clipart", rightMode:"sign", paged:true }
  ];

  // ----------------------------
  // Utilities
  // ----------------------------
  function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
  function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

  const feedbackImage = document.createElement("img");
  feedbackImage.style.position = "fixed"; feedbackImage.style.top = "50%"; feedbackImage.style.left="50%";
  feedbackImage.style.transform="translate(-50%,-50%)"; feedbackImage.style.width="200px"; feedbackImage.style.zIndex="3000"; feedbackImage.style.display="none";
  document.body.appendChild(feedbackImage);

  function showFeedback(correct){
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(()=>feedbackImage.style.display="none",700);
  }

  function updateScore(){
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect+totalIncorrect>0 ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100) : 0;
    scoreDisplayEl.innerText = `Score: ${percent}%`;
    return percent;
  }

  function saveProgress(){
    localStorage.setItem(saveKey, JSON.stringify({studentName, studentClass, currentLevel, pageIndex, levelAttempts: levelAttempts.map(l=>({correct:Array.from(l.correct),incorrect:l.incorrect})), timestamp: Date.now()}));
  }

  function restoreProgress(){
    const data = JSON.parse(localStorage.getItem(saveKey));
    if(!data || data.studentName!==studentName || data.studentClass!==studentClass) return false;
    currentLevel = data.currentLevel||0; pageIndex = data.pageIndex||0;
    if(Array.isArray(data.levelAttempts)) data.levelAttempts.forEach((lvl,i)=>{ levelAttempts[i].correct=new Set(lvl.correct||[]); levelAttempts[i].incorrect=lvl.incorrect||[]; });
    return true;
  }

  // ----------------------------
  // Drag & drop helpers
  // ----------------------------
  function createDraggableImage(src, key){
    const img = document.createElement("img");
    img.src = src; img.draggable=true; img.dataset.key=key; img.style.width="100%"; img.style.height="100%";
    img.addEventListener("dragstart", e=>{ e.dataTransfer.setData("text/plain", key); });
    return img;
  }

  function makeSlotDroppable(slot){
    slot.classList.add("slot");
    slot.addEventListener("dragover", e=> e.preventDefault());
    slot.addEventListener("drop", handleDrop);
  }

  // ----------------------------
  // Paged level state
  // ----------------------------
  let pageWeatherKeys = [];
  let requiredMap = {};

  function handleDrop(e){
    e.preventDefault();
    const slot = e.currentTarget;
    const draggedKey = e.dataTransfer.getData("text/plain");
    if(!draggedKey) return;
    const info = levels[currentLevel];
    const weatherKey = slot.dataset.weather;
    const mapEntry = requiredMap[weatherKey];
    if(!mapEntry || slot.dataset.filled==="true"){
      showFeedback(false); return;
    }

    if(mapEntry.required.includes(draggedKey) && !mapEntry.filled.has(draggedKey)){
      slot.innerHTML = ""; 
      const img = document.createElement("img");
      img.src = C[draggedKey].clipart;
      img.style.width="100%"; img.style.height="100%"; slot.appendChild(img);
      slot.dataset.filled = "true";
      mapEntry.filled.add(draggedKey);
      const pair = `${draggedKey}->${weatherKey}`;
      levelAttempts[currentLevel].correct.add(pair);
      correctMatches++; showFeedback(true); updateScore();

      // Check if page complete
      const allSlots = Array.from(document.querySelectorAll(`.paged-slot[data-page='${pageIndex}']`));
      if(allSlots.every(s=>s.dataset.filled==="true")){
        pageIndex++; 
        if(pageIndex>=pagesPerLevel){ currentLevel++; pageIndex=0; if(currentLevel>=levels.length){ endGame(); return; } }
        loadPage();
      }

    } else {
      showFeedback(false); levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${weatherKey}`);
    }

    saveProgress();
  }

  // ----------------------------
  // Build paged UI
  // ----------------------------
  function buildPagedUI(info){
    const pool = info.leftPool.slice();
    const shuffled = shuffle(pool);
    let start = pageIndex*itemsPerPage;
    let pageKeys = shuffled.slice(start, start+itemsPerPage);
    if(pageKeys.length<itemsPerPage) pageKeys = pageKeys.concat(shuffled.slice(0, itemsPerPage-pageKeys.length));

    pageWeatherKeys = pageKeys; requiredMap = {};
    leftSigns.innerHTML=""; middleSlots.innerHTML=""; rightSigns.innerHTML="";
    pageWeatherKeys.forEach(wKey=>{
      const wObj = W[wKey];
      const nSlots = Math.min(wObj.obviousClothing.length,3);
      const required = shuffle(wObj.obviousClothing).slice(0,nSlots);
      requiredMap[wKey] = {required:required.slice(), filled:new Set()};

      // LEFT
      const wEl = document.createElement("div");
      wEl.style.width="120px"; wEl.style.height="120px"; wEl.style.margin="8px";
      const img = document.createElement("img");
      img.src = info.leftMode==="clipart"?wObj.clipart:wObj.sign; img.style.width="100%"; img.style.height="100%";
      wEl.appendChild(img); leftSigns.appendChild(wEl);

      // MIDDLE slots
      const midRow = document.createElement("div"); midRow.style.display="flex"; midRow.style.gap="8px"; midRow.style.margin="8px";
      required.forEach(()=>{ 
        const slot = document.createElement("div"); slot.className="paged-slot slot"; slot.dataset.weather=wKey; slot.dataset.page=pageIndex;
        slot.style.width="100px"; slot.style.height="100px"; slot.style.border="2px dashed #ccc"; slot.style.display="inline-flex"; slot.style.alignItems="center"; slot.style.justifyContent="center";
        makeSlotDroppable(slot); midRow.appendChild(slot);
      });
      middleSlots.appendChild(midRow);
    });

    // RIGHT draggable 12 items
    let candidates = []; Object.values(requiredMap).forEach(r=>candidates=candidates.concat(r.required));
    candidates = Array.from(new Set(candidates));
    const decoyPool = shuffle(allClothing.filter(c=>!candidates.includes(c))).slice(0,12-candidates.length);
    candidates = shuffle(candidates.concat(decoyPool));

    const grid = document.createElement("div"); grid.style.display="grid"; grid.style.gridTemplateColumns="repeat(4,1fr)"; grid.style.gap="8px";
    candidates.forEach(cKey=>grid.appendChild(createDraggableImage(C[cKey].clipart,cKey)));
    rightSigns.appendChild(grid);
  }

  // ----------------------------
  // Load page
  // ----------------------------
  function loadPage(){ 
    if(currentLevel>=levels.length){ endGame(); return; }
    levelTitleEl.innerText=`Level ${currentLevel+1}: ${levels[currentLevel].name}`;
    buildPagedUI(levels[currentLevel]);
    updateScore();
    saveProgress();
  }

  // ----------------------------
  // Modal/buttons
  // ----------------------------
  stopBtn.addEventListener("click",()=>{ modal.style.display="flex"; });
  continueBtn.addEventListener("click",()=>{ modal.style.display="none"; loadPage(); });
  againBtn.addEventListener("click",()=>{ localStorage.removeItem(saveKey); location.reload(); });
  finishBtn.addEventListener("click",()=>{ if(!gameEnded) endGame(); });

  // ----------------------------
  // End game
  // ----------------------------
  function endGame(){
    if(gameEnded) return;
    gameEnded = true;
    const elapsedSec = Math.round((Date.now()-startTime)/1000);
    const timeString = `${Math.floor(elapsedSec/60)} mins ${elapsedSec%60} sec`;
    const percent = updateScore();

    scoreModalText.innerHTML = `Score: ${percent}%<br>Time: ${timeString}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display="flex";
    localStorage.removeItem(saveKey);
  }

  // ----------------------------
  // Init
  // ----------------------------
  restoreProgress();
  loadPage();
});
