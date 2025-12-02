document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------
  // Utilities
  // ----------------------------
  function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  // ----------------------------
  // Student info gating
  // ----------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) { window.location.href = "../index.html"; return; }

  // ----------------------------
  // DOM references
  // ----------------------------
  const ensureEl = (id, tag = "div", cls = "") => {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement(tag); if (cls) el.className = cls; el.id = id; document.body.appendChild(el); }
    return el;
  };

  const studentInfoEl = ensureEl("student-info");
  const scoreDisplayEl = ensureEl("score-display");
  const levelTitleEl = ensureEl("levelTitle", "h1");
  const leftSigns = ensureEl("leftSigns", "div", "left-signs");
  const middleSlots = ensureEl("middleSlots", "div", "middle-slots");
  const rightSigns = ensureEl("rightSigns", "div", "right-signs");
  const modal = ensureEl("end-modal");
  const scoreModalText = ensureEl("score-display-modal", "p");
  const continueBtn = ensureEl("continue-btn", "img");
  const finishBtn = ensureEl("finish-btn", "img");
  const againBtn = ensureEl("again-btn", "img");
  const stopBtn = ensureEl("stop-btn", "img");

  studentInfoEl.innerText = `${studentName} (${studentClass})`;

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
    { key:"clothes", clipart:"assets/clothing/clipart/clothes.png", sign:"assets/clothing/signs/clothes.png", primaryWeather:"weather" }
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
    { name: "Weather Signs → Weather Images", leftPool: allWeather, rightPool: allWeather, leftMode: "sign", rightMode: "clipart" },
    { name: "Weather Images → Weather Signs", leftPool: allWeather, rightPool: allWeather, leftMode: "clipart", rightMode: "sign" },
    { name: "Clothing Signs → Clothing Images", leftPool: allClothing, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Images → Clothing Signs", leftPool: allClothing, rightPool: allClothing, leftMode: "clipart", rightMode: "sign" },
    { name: "Mixed Weather → Mixed Clothing", leftPool: shuffle(allWeather.concat(allClothing)), rightPool: shuffle(allClothing.concat(allWeather)), leftMode: "sign", rightMode: "clipart", paged:true },
    { name: "Mixed Clothing → Mixed Weather", leftPool: shuffle(allClothing.concat(allWeather)), rightPool: shuffle(allWeather.concat(allClothing)), leftMode: "clipart", rightMode: "sign", paged:true }
  ];

  // ----------------------------
  // State
  // ----------------------------
  let currentLevel = 0;
  let pageIndex = 0;
  let gameEnded = false;
  const startTime = Date.now();
  const levelAttempts = Array(6).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  const saveKey = "weatherClothingSave_v3";

  // ----------------------------
  // Drag & Drop helpers
  // ----------------------------
  function createDraggableImage(src, key) {
    const img = document.createElement("img");
    img.src = src;
    img.draggable = true;
    img.dataset.key = key;
    img.className = "draggable";
    img.style.width = "100%";
    img.style.height = "100%";
    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", key);
      e.dataTransfer.effectAllowed = "copy";
    });
    return img;
  }

  function makeSlotDroppable(slot) {
    slot.classList.add("slot");
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", handleDrop);
  }

  // ----------------------------
  // Build page
  // ----------------------------
  function loadPage() {
    const info = levels[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel+1}: ${info.name}`;
    leftSigns.innerHTML=""; middleSlots.innerHTML=""; rightSigns.innerHTML="";
    pageIndex = clamp(pageIndex, 0, 1);

    if(info.paged){
      buildPagedUI(info);
    } else {
      buildGameBoardUI(info);
    }
    updateScore();
    saveProgress();
  }

  function buildGameBoardUI(info){
    // Left grid of draggables
    const pool = info.leftPool.slice();
    const chosen = shuffle(pool).slice(0,12);
    chosen.forEach((key, idx)=>{
      const obj = W[key] || C[key];
      const src = (info.leftMode==="clipart") ? obj.clipart : obj.sign;
      const img = createDraggableImage(src, key);
      const wrapper = document.createElement("div");
      wrapper.style.width="100px"; wrapper.style.height="100px"; wrapper.style.margin="4px"; wrapper.style.display="inline-flex"; wrapper.style.alignItems="center"; wrapper.style.justifyContent="center";
      wrapper.appendChild(img);
      leftSigns.appendChild(wrapper);
    });

    // Right targets
    chosen.forEach(key=>{
      const obj = W[key] || C[key];
      const src = (info.rightMode==="clipart") ? obj.clipart : obj.sign;
      const slot = document.createElement("div");
      slot.dataset.key = key;
      slot.style.width="100px"; slot.style.height="100px"; slot.style.border="2px dashed #ccc"; slot.style.borderRadius="8px"; slot.style.margin="4px"; slot.style.background="white";
      makeSlotDroppable(slot);
      rightSigns.appendChild(slot);
    });
  }

  // ----------------------------
  // Paged UI for mixed levels
  // ----------------------------
  let requiredMap = {};
  let pageWeatherKeys = [];

  function buildPagedUI(info){
    leftSigns.innerHTML=""; middleSlots.innerHTML=""; rightSigns.innerHTML="";
    const pool = info.leftPool.slice();
    pageWeatherKeys = shuffle(pool).slice(pageIndex*3, pageIndex*3+3);
    requiredMap = {};

    pageWeatherKeys.forEach(wKey=>{
      const wObj = W[wKey] || C[wKey];
      const required = shuffle((wObj.obviousClothing || []).slice()).slice(0,3);
      requiredMap[wKey]={ required: required.slice(), filled: new Set() };

      // left sign/clipart
      const leftDiv = document.createElement("div"); leftDiv.style.width="120px"; leftDiv.style.height="120px"; leftDiv.style.margin="4px";
      const img = document.createElement("img"); img.src = (info.leftMode==="clipart")? wObj.clipart : wObj.sign; img.style.width="100%"; img.style.height="100%";
      leftDiv.appendChild(img); leftSigns.appendChild(leftDiv);

      // middle slots
      const midRow = document.createElement("div"); midRow.style.display="flex"; midRow.style.gap="8px"; midRow.style.margin="4px";
      required.forEach(cKey=>{
        const slot = document.createElement("div"); slot.className="slot"; slot.dataset.weather=wKey; slot.dataset.expected=cKey;
        slot.style.width="100px"; slot.style.height="100px"; slot.style.border="2px dashed #ccc"; slot.style.borderRadius="8px"; slot.style.background="white";
        makeSlotDroppable(slot);
        midRow.appendChild(slot);
      });
      middleSlots.appendChild(midRow);
    });

    // right panel: candidates
    let candidates=[]; Object.values(requiredMap).forEach(r=>candidates=candidates.concat(r.required));
    let uniqueCandidates = Array.from(new Set(candidates));
    let decoys = shuffle(allClothing.concat(allWeather).filter(k=>!uniqueCandidates.includes(k))).slice(0,12-uniqueCandidates.length);
    let finalList = shuffle(uniqueCandidates.concat(decoys));

    finalList.forEach(cKey=>{
      const obj = W[cKey] || C[cKey];
      const wrapper = document.createElement("div"); wrapper.style.width="100px"; wrapper.style.height="100px"; wrapper.style.margin="4px"; wrapper.style.display="inline-flex"; wrapper.style.alignItems="center"; wrapper.style.justifyContent="center";
      const img = createDraggableImage((info.rightMode==="clipart")?obj.clipart:obj.sign, cKey);
      wrapper.appendChild(img);
      rightSigns.appendChild(wrapper);
    });
  }

  // ----------------------------
  // Drag & drop handler
  // ----------------------------
  function handleDrop(e){
    e.preventDefault();
    const slot = e.currentTarget;
    const key = e.dataTransfer.getData("text/plain");
    if(!key) return;

    const info = levels[currentLevel];

    if(slot.dataset.expected){ // paged
      const wKey = slot.dataset.weather;
      const map = requiredMap[wKey];
      if(map.required.includes(key) && !map.filled.has(key)){
        const img = document.createElement("img");
        const obj = W[key] || C[key];
        img.src = (info.rightMode==="clipart")? obj.clipart : obj.sign;
        img.style.width="100%"; img.style.height="100%";
        slot.appendChild(img);
        slot.dataset.filled="true"; map.filled.add(key);
        levelAttempts[currentLevel].correct.add(`${key}->${wKey}`);
      } else {
        levelAttempts[currentLevel].incorrect.push(`${key}->${slot.dataset.weather}`);
      }
    } else { // non-paged
      if(slot.dataset.key === key){
        const img = document.createElement("img");
        const obj = W[key] || C[key];
        img.src = (info.rightMode==="clipart")? obj.clipart : obj.sign;
        img.style.width="100%"; img.style.height="100%";
        slot.appendChild(img);
        slot.dataset.filled="true";
        levelAttempts[currentLevel].correct.add(`${key}->${key}`);
        document.querySelectorAll(`img.draggable[data-key='${key}']`).forEach(el=>el.remove());
      } else {
        levelAttempts[currentLevel].incorrect.push(`${key}->${slot.dataset.key}`);
      }
    }
    updateScore();

    // check level completion
    const allFilled = Array.from(document.querySelectorAll(".slot")).every(s=>s.dataset.filled==="true");
    if(allFilled){
      currentLevel++; pageIndex=0;
      if(currentLevel>=levels.length){ endGame(); return; }
      setTimeout(loadPage,500);
    }
  }

  // ----------------------------
  // Score & persistence
  // ----------------------------
  function updateScore(){
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = (totalCorrect+totalIncorrect>0) ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100) : 0;
    scoreDisplayEl.innerText=`Score: ${percent}%`;
    return percent;
  }

  function saveProgress(){
    const payload = { studentName, studentClass, currentLevel, pageIndex,
      levelAttempts: levelAttempts.map(l=>({correct:Array.from(l.correct), incorrect:l.incorrect})), timestamp:Date.now() };
    localStorage.setItem(saveKey, JSON.stringify(payload));
  }

  function restoreProgress(){
    const raw = localStorage.getItem(saveKey);
    if(!raw) return;
    const data = JSON.parse(raw);
    if(data.studentName !== studentName || data.studentClass !== studentClass) return;
    currentLevel = data.currentLevel || 0;
    pageIndex = data.pageIndex || 0;
    if(Array.isArray(data.levelAttempts)){
      data.levelAttempts.forEach((lvl,i)=>{ levelAttempts[i].correct = new Set(lvl.correct||[]); levelAttempts[i].incorrect=lvl.incorrect||[]; });
    }
  }

  // ----------------------------
  // Buttons
  // ----------------------------
  stopBtn.addEventListener("click", ()=>{
    const percent = updateScore();
    const elapsed = Math.round((Date.now()-startTime)/1000);
    scoreModalText.innerText=`Score: ${percent}%\nTime: ${elapsed}s`;
    modal.style.display="block";
  });

  continueBtn.addEventListener("click", ()=>{ modal.style.display="none"; });
  againBtn.addEventListener("click", ()=>{
    currentLevel=0; pageIndex=0; gameEnded=false; levelAttempts.forEach(l=>{l.correct.clear(); l.incorrect=[];});
    loadPage(); modal.style.display="none";
  });
  finishBtn.addEventListener("click", ()=>{
    endGame();
  });

  // ----------------------------
  // End Game & Google Form submission
  // ----------------------------
  function endGame(){
    if(gameEnded) return;
    gameEnded=true;
    const percent = updateScore();
    const elapsed = Math.round((Date.now()-startTime)/1000);
    scoreModalText.innerText=`Final Score: ${percent}%\nTime: ${elapsed}s`;
    modal.style.display="block";

    // Google Form submit (silent)
    const formData = new FormData();
    formData.append("entry.1234567890", studentName);
    formData.append("entry.2345678901", studentClass);
    formData.append("entry.3456789012", percent);
    formData.append("entry.4567890123", elapsed);
    fetch("https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse", { method:"POST", body:formData, mode:"no-cors" });
  }

  // ----------------------------
  // Start
  // ----------------------------
  restoreProgress();
  loadPage();

});
