
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
  const ensureEl = (id, tag="div", cls="") => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      if (cls) el.className = cls;
      el.id = id;
      const layout = document.querySelector(".layout") || document.body;
      layout.appendChild(el);
    }
    return el;
  };

  const studentInfoEl = ensureEl("student-info");
  const scoreDisplayEl = ensureEl("score-display");
  const levelTitleEl = ensureEl("levelTitle", "h1");
  const leftSigns = ensureEl("leftSigns", "div", "left-signs");
  const rightSigns = ensureEl("rightSigns", "div", "right-signs");
  const modal = ensureEl("end-modal");
  const scoreModalText = ensureEl("score-display-modal", "p");
  const continueBtn = ensureEl("continue-btn", "button");
  const finishBtn = ensureEl("finish-btn", "button");
  const stopBtn = ensureEl("stop-btn", "button");
  const againBtn = ensureEl("again-btn", "button");

  studentInfoEl.innerText = `${studentName} (${studentClass})`;

  // ----------------------------
  // Game state
  // ----------------------------
  let currentLevel = 0;
  let correctMatches = 0;
  let gameEnded = false;
  const startTime = Date.now();
  const saveKey = "weatherClothingSave_v3";
  const levelAttempts = Array(6).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

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
  const allClothing = clothingItems.map(c => c.key);

  // ----------------------------
  // Levels
  // ----------------------------
  const levels = [
    { name: "Weather Signs → Weather Images", leftPool: allWeather, rightPool: allWeather, leftMode: "sign", rightMode: "clipart" },
    { name: "Weather Images → Weather Signs", leftPool: allWeather, rightPool: allWeather, leftMode: "clipart", rightMode: "sign" },
    { name: "Clothing Signs → Clothing Images", leftPool: allClothing, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Images → Clothing Signs", leftPool: allClothing, rightPool: allClothing, leftMode: "clipart", rightMode: "sign" },
    { name: "Mixed Weather → Mixed Clothing", leftPool: shuffle(allWeather.concat(allClothing)), rightPool: shuffle(allClothing.concat(allWeather)), leftMode: "sign", rightMode: "clipart" },
    { name: "Mixed Clothing → Mixed Weather", leftPool: shuffle(allClothing.concat(allWeather)), rightPool: shuffle(allWeather.concat(allClothing)), leftMode: "clipart", rightMode: "sign" }
  ];

  // ----------------------------
  // Utilities
  // ----------------------------
  const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);

  function createDraggableImage(src, key) {
    const img = document.createElement("img");
    img.src = src;
    img.draggable = true;
    img.className = "draggable";
    img.dataset.key = key;
    img.style.width = "100%";
    img.style.height = "100%";
    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", key);
    });
    return img;
  }

  function makeSlotDroppable(slot){
    slot.classList.add("slot");
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", handleDrop);
  }

  function updateScore(){
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = (totalCorrect + totalIncorrect > 0) ? Math.round(totalCorrect / (totalCorrect + totalIncorrect) * 100) : 0;
    scoreDisplayEl.innerText = `Score: ${percent}%`;
    return percent;
  }

  function saveProgress(){
    try{
      const payload = { studentName, studentClass, currentLevel, levelAttempts: levelAttempts.map(l=>({ correct:Array.from(l.correct), incorrect:l.incorrect })), timestamp: Date.now() };
      localStorage.setItem(saveKey, JSON.stringify(payload));
    }catch(e){ console.warn(e); }
  }

  function restoreProgress(){
    try{
      const raw = localStorage.getItem(saveKey);
      if(!raw) return false;
      const data = JSON.parse(raw);
      if(!data || data.studentName!==studentName || data.studentClass!==studentClass) return false;
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
  // Drag & Drop handling
  // ----------------------------
  function handleDrop(e){
    e.preventDefault();
    const slot = e.currentTarget;
    const draggedKey = e.dataTransfer.getData("text/plain");
    if(!draggedKey) return;

    const expected = slot.dataset.key;
    if(!expected) return;

    const ok = draggedKey === expected;
    if(ok){
      slot.innerHTML = "";
      const src = W[draggedKey]?.clipart || W[draggedKey]?.sign || C[draggedKey]?.clipart || C[draggedKey]?.sign;
      const img = document.createElement("img");
      img.src = src;
      img.style.width="100%"; img.style.height="100%";
      slot.appendChild(img);
      slot.dataset.filled = "true";
      levelAttempts[currentLevel].correct.add(`${draggedKey}->${expected}`);
      correctMatches++;
      updateScore();
      document.querySelectorAll(`img.draggable[data-key='${draggedKey}']`).forEach(el=>el.remove());

      if(Array.from(document.querySelectorAll(".slot")).every(s=>s.dataset.filled==="true")){
        currentLevel++;
        if(currentLevel>=levels.length){ endGame(); return; }
        saveProgress();
        setTimeout(loadPage, 600);
      }
    } else {
      slot.classList.add("shake");
      setTimeout(()=>slot.classList.remove("shake"),450);
      levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${expected}`);
      updateScore();
    }
    saveProgress();
  }

  // ----------------------------
  // Build game UI
  // ----------------------------
  function buildGameBoardUI(info){
    leftSigns.innerHTML=""; rightSigns.innerHTML="";

    // Left: slots
    const chosen = shuffle(info.leftPool).slice(0,12);
    chosen.forEach(key=>{
      const slot = document.createElement("div");
      slot.className="slot";
      slot.dataset.key = key;
      slot.style.width="100px"; slot.style.height="100px"; slot.style.border="2px dashed #ccc"; slot.style.margin="4px"; slot.style.borderRadius="8px";
      makeSlotDroppable(slot);
      leftSigns.appendChild(slot);
    });

    // Right: draggables (mix of correct + decoys)
    let draggables = shuffle(info.rightPool).slice(0,12);
    draggables.forEach(k=>{
      const obj = W[k] || C[k];
      const src = (info.rightMode==="clipart") ? obj.clipart : obj.sign;
      const img = createDraggableImage(src, k);
      const wrapper = document.createElement("div");
      wrapper.className = "drag-wrapper";
      wrapper.style.width="100px"; wrapper.style.height="100px"; wrapper.style.margin="4px"; wrapper.appendChild(img);
      rightSigns.appendChild(wrapper);
    });

    correctMatches=0;
  }

  function loadPage(){
    const info = levels[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel+1}: ${info.name}`;
    buildGameBoardUI(info);
    updateScore();
    saveProgress();
  }

  // ----------------------------
  // Buttons
  // ----------------------------
  stopBtn.addEventListener("click", ()=>{
    const percent = updateScore();
    const elapsed = Math.round((Date.now()-startTime)/1000);
    const mins = Math.floor(elapsed/60), secs = elapsed%60;
    scoreModalText.innerHTML=`Score: ${percent}%<br>Time: ${mins} mins ${secs} sec`;
    modal.style.display="flex";
  });

  finishBtn.addEventListener("click", ()=>{ if(!gameEnded) endGame(); });

  againBtn.addEventListener("click", ()=>{ localStorage.removeItem(saveKey); location.reload(); });

  // ----------------------------
  // Google Form submission
  // ----------------------------
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfP71M2M1SmaIzHVnsOSx4390iYgSxQy7Yo3NAPpbsR_Q7JaA/formResponse";
  const formEntries = { studentName:"entry.649726739", studentClass:"entry.2105926443", percentage:"entry.393464832", totalCorrect:"entry.395384696", totalIncorrect:"entry.1357567724" };

  function endGame(){
    if(gameEnded) return; gameEnded=true;
    const elapsedSec = Math.round((Date.now()-startTime)/1000);
    const percent = updateScore();
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);

    const entries = {};
    entries[formEntries.studentName] = studentName;
    entries[formEntries.studentClass] = studentClass;
    entries[formEntries.percentage] = `${percent}%`;
    entries[formEntries.totalCorrect] = totalCorrect;
    entries[formEntries.totalIncorrect] = totalIncorrect;

    const iframe = document.querySelector("iframe[name='hidden_iframe']") || (()=>{ const f=document.createElement("iframe"); f.name="hidden_iframe"; f.style.display="none"; document.body.appendChild(f); return f; })();

    const form = document.createElement("form");
    form.action = formURL;
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display="none";
    for(const k in entries){ const input = document.createElement("input"); input.type="hidden"; input.name=k; input.value=entries[k]; form.appendChild(input); }
    document.body.appendChild(form);
    form.submit();

    scoreModalText.innerHTML = `Score: ${percent}%<br>Time: ${Math.floor(elapsedSec/60)} mins ${elapsedSec%60} sec`;
    modal.style.display="flex";
  }

  // ----------------------------
  // Start game
  // ----------------------------
  restoreProgress();
  loadPage();
});
