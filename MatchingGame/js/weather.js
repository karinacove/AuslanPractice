document.addEventListener("DOMContentLoaded", function () {

  // ----------------------------
  // Student gating (must be set earlier)
  // ----------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  // ----------------------------
  // DOM refs
  // ----------------------------
  const studentInfoEl = document.getElementById("student-info");
  const scoreDisplayEl = document.getElementById("score-display");
  const levelTitleEl = document.getElementById("levelTitle");
  const leftSigns = document.getElementById("leftSigns");
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

  // track per-level attempts (6 levels: indices 0..5)
  const levelAttempts = Array(6).fill(null).map(()=>({ correct: new Set(), incorrect: [] }));

  // ----------------------------
  // Data - weather & clothing items
  // (Edit these assets/keys if you add/remove images)
  // ----------------------------
  const weatherItems = [
    { key:"sunny",  obviousClothing:"thongs", allowedClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart:"assets/weather/clipart/sunny.png", sign:"assets/weather/signs/sunny.png" },
    { key:"cloudy", obviousClothing:"jumper", allowedClothing:["shirt","jumper","shorts","pants","shoes","socks","skirt","dress"], clipart:"assets/weather/clipart/cloudy.png", sign:"assets/weather/signs/cloudy.png" },
    { key:"rainy",  obviousClothing:"umbrella", allowedClothing:["jacket","pants","umbrella"], clipart:"assets/weather/clipart/rainy.png", sign:"assets/weather/signs/rainy.png" },
    { key:"stormy", obviousClothing:"boots", allowedClothing:["jacket","socks","shoes","pants"], clipart:"assets/weather/clipart/stormy.png", sign:"assets/weather/signs/stormy.png" },
    { key:"windy",  obviousClothing:"jacket", allowedClothing:["jumper","socks","shoes","pants","jacket"], clipart:"assets/weather/clipart/windy.png", sign:"assets/weather/signs/windy.png" },
    { key:"snowy",  obviousClothing:"gloves", allowedClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart:"assets/weather/clipart/snowy.png", sign:"assets/weather/signs/snowy.png" },
    { key:"cold",  obviousClothing:"scarf", allowedClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart:"assets/weather/clipart/snowy.png", sign:"assets/weather/signs/cold.png" },
    { key:"hot",  obviousClothing:"hat", allowedClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart:"assets/weather/clipart/sunny.png", sign:"assets/weather/signs/hot.png" },
    // these do not have clothing matches and should not be used for cross-topic levels
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
    { key:"beanie", clipart:"assets/clothing/clipart/beanie.png", sign:"assets/clothing/signs/beanie.png", primaryWeather:"snowy" }
  ];

  // quick lookup maps
  const W = Object.fromEntries(weatherItems.map(w=>[w.key,w]));
  const C = Object.fromEntries(clothingItems.map(c=>[c.key,c]));
  const allWeather = weatherItems.map(w=>w.key);
  const matchableWeather = weatherItems.filter(w => Array.isArray(w.allowedClothing) && w.allowedClothing.length>0).map(w=>w.key);
  const allClothing = clothingItems.map(c=>c.key);

  // ----------------------------
  // Levels
  // - use matchableWeather for cross-topic levels
  // ----------------------------
  const levels = [
    { name: "Weather Signs → Weather Images", leftPool: allWeather, rightPool: allWeather, leftMode: "sign", rightMode: "clipart" },
    { name: "Weather Images → Weather Signs", leftPool: allWeather, rightPool: allWeather, leftMode: "clipart", rightMode: "sign" },
    { name: "Clothing Signs → Clothing Images", leftPool: allClothing, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Images → Clothing Signs", leftPool: allClothing, rightPool: allClothing, leftMode: "clipart", rightMode: "sign" },
    { name: "Weather Signs → Clothing Images", leftPool: matchableWeather, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Signs → Weather Images", leftPool: allClothing, rightPool: matchableWeather, leftMode: "sign", rightMode: "clipart" }
  ];

  // ----------------------------
  // UI feedback element (correct/wrong)
  // ----------------------------
  const feedbackImage = document.createElement("img");
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

  // utilities
  function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
  function showFeedback(correct){
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(()=>feedbackImage.style.display="none", 700);
  }
  function updateScore(){
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = (totalCorrect+totalIncorrect>0) ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100) : 0;
    scoreDisplayEl.innerText = `Score: ${percent}%`;
    return percent;
  }

  // safe save/restore helpers (used later)
  function saveProgress(){
    try{
      localStorage.setItem(saveKey, JSON.stringify({
        studentName, studentClass, currentLevel,
        levelAttempts: levelAttempts.map(l=>({ correct:Array.from(l.correct), incorrect:l.incorrect })),
        timestamp: Date.now()
      }));
    }catch(e){ console.warn("saveProgress failed", e); }
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
    }catch(e){
      console.warn("restoreProgress failed", e);
      return false;
    }
  }

  // ----------------------------
  // Main level/page builder — bulletproof safe
  // ----------------------------
  function loadPage(){
    const info = levels[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel+1}: ${info.name}`;
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    gameBoard.innerHTML = "";

    // select up to 9 left items
    const leftPool = shuffle(info.leftPool).slice(0, Math.min(9, info.leftPool.length));

    // build slot mapping
    const slots = leftPool.map(leftKey => {
      let rightKey = null;

      // 0-3 same-topic exact mapping (leftKey is the same)
      if (currentLevel >= 0 && currentLevel <= 3) {
        rightKey = leftKey;
      }
      // Level 4: Weather (left) -> Clothing (right)
      else if (currentLevel === 4) {
        const w = W[leftKey];
        if (w && w.obviousClothing && C[w.obviousClothing]) {
          rightKey = w.obviousClothing;
        } else if (w && Array.isArray(w.allowedClothing)) {
          // Pick first allowed clothing that exists in C
          rightKey = w.allowedClothing.find(k => C[k]) || null;
        }
        if (!rightKey) rightKey = shuffle(allClothing).find(k=>C[k]) || allClothing[0];
      }
      // Level 5: Clothing (left) -> Weather (right)
      else if (currentLevel === 5) {
        const c = C[leftKey];
        if (c && c.primaryWeather && matchableWeather.includes(c.primaryWeather)) {
          rightKey = c.primaryWeather;
        } else {
          rightKey = shuffle(matchableWeather).find(k => W[k]) || matchableWeather[0];
        }
      }

      // final safety: rightKey must be in the rightPool and exist in maps
      if (!rightKey || !(W[rightKey] || C[rightKey]) || !info.rightPool.includes(rightKey)) {
        // try to choose a valid one from info.rightPool
        rightKey = shuffle(info.rightPool).find(k => W[k] || C[k]) || info.rightPool[0];
      }

      return { leftKey, rightKey };
    });

    // create visual slots (targets) for each rightKey
    slots.forEach(s => {
      const slot = document.createElement("div");
      slot.style.display = "inline-block";
      slot.style.width = "120px";
      slot.style.height = "120px";
      slot.style.margin = "10px";
      slot.style.boxSizing = "border-box";

      const keyForTarget = s.rightKey;
      slot.dataset.key = keyForTarget;

      // choose item object safely
      const isWeather = keyForTarget in W;
      let itemObj = isWeather ? W[keyForTarget] : C[keyForTarget];

      if (!itemObj) {
        // try fallback from rightPool
        const fallback = shuffle(info.rightPool).find(k => W[k] || C[k]);
        if (fallback) itemObj = (fallback in W) ? W[fallback] : C[fallback];
        if (!itemObj) {
          console.warn("No valid itemObj for slot:", s);
          return; // skip this slot
        }
      }

      const bg = (info.rightMode === "clipart") ? itemObj.clipart : itemObj.sign;
      slot.style.backgroundImage = `url('${bg}')`;
      slot.style.backgroundSize = "contain";
      slot.style.backgroundPosition = "center";
      slot.style.backgroundRepeat = "no-repeat";

      slot.className = "slot";
      makeSlotDroppable(slot);
      gameBoard.appendChild(slot);
    });

    // build draggable keys (left items + decoys if needed)
    let draggableKeys = leftPool.slice();
    const needed = Math.max(0, 9 - draggableKeys.length);
    const candidates = shuffle(info.leftPool).filter(k => !draggableKeys.includes(k));
    for (let i=0;i<needed && i<candidates.length;i++) draggableKeys.push(candidates[i]);

    draggableKeys = shuffle(Array.from(new Set(draggableKeys))).slice(0,9);

    // render draggables into leftSigns and rightSigns
    const half = Math.ceil(draggableKeys.length / 2);
    draggableKeys.forEach((key, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "drag-wrapper";
      wrapper.style.width = "120px";
      wrapper.style.height = "120px";
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "center";
      wrapper.style.alignItems = "center";
      wrapper.style.margin = "8px";

      const img = document.createElement("img");
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";

      const isWeather = key in W;
      let obj = isWeather ? W[key] : C[key];
      if (!obj) {
        console.warn("Missing data for draggable key:", key);
        return;
      }

      img.src = (info.leftMode === "clipart") ? obj.clipart : obj.sign;
      makeDraggable(img, key);

      wrapper.appendChild(img);
      if (idx < half) leftSigns.appendChild(wrapper);
      else rightSigns.appendChild(wrapper);
    });

    // reset counters & save
    correctMatches = 0;
    updateScore();
    saveProgress();
  }

  // ----------------------------
  // Draggables + touch handling
  // ----------------------------
  function makeDraggable(img, key){
    img.classList.add("draggable");
    img.draggable = true;
    img.dataset.key = key;

    img.addEventListener("dragstart", e=>{
      e.dataTransfer.setData("text/plain", key);
      e.dataTransfer.setData("src", img.src || "");
      e.dataTransfer.setData("kind", (key in W) ? "weather" : "clothing");
    });

    // touch support (clone + simulate drop)
    img.addEventListener("touchstart", function touchStart(ev){
      ev.preventDefault();
      const clone = img.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.pointerEvents = "none";
      clone.style.opacity = "0.9";
      clone.style.zIndex = "10000";
      document.body.appendChild(clone);

      const move = t => {
        clone.style.left = `${t.clientX - clone.width/2}px`;
        clone.style.top = `${t.clientY - clone.height/2}px`;
      };
      move(ev.touches[0]);

      function onMove(evm){ evm.preventDefault(); move(evm.touches[0]); }
      function onEnd(evm){
        const touch = evm.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if(el && el.classList.contains("slot")){
          const fakeEvent = {
            preventDefault: ()=>{},
            currentTarget: el,
            dataTransfer: {
              getData: k => (k==="text/plain" ? key : (k==="src" ? img.src : ""))
            }
          };
          handleDrop(fakeEvent);
        }
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
        clone.remove();
      }
      document.addEventListener("touchmove", onMove, { passive:false });
      document.addEventListener("touchend", onEnd, { passive:false });
    }, { passive:false });
  }

  // attach drop listeners to slot
  function makeSlotDroppable(slot){
    slot.classList.add("slot");
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", handleDrop);
  }

  // ----------------------------
  // Drop handler
  // ----------------------------
  function handleDrop(e){
    e.preventDefault?.();
    const slot = e.currentTarget;
    const slotKey = slot.dataset.key;
    const draggedKey = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");

    if(!draggedKey) return;

    const isCorrect = checkMatch(slotKey, draggedKey);

    if(isCorrect){
      const lvlObj = levelAttempts[currentLevel];
      const pair = `${draggedKey}->${slotKey}`;
      if(!lvlObj.correct.has(pair)) lvlObj.correct.add(pair);

      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = src || ((draggedKey in W) ? W[draggedKey].clipart || W[draggedKey].sign : (C[draggedKey].clipart || C[draggedKey].sign));
      slot.appendChild(overlay);

      document.querySelectorAll(`img.draggable[data-key='${draggedKey}']`).forEach(el=>el.remove());

      correctMatches++;
      showFeedback(true);
      updateScore();

      const totalSlots = document.querySelectorAll(".slot").length;
      if(correctMatches >= totalSlots){
        correctMatches = 0;
        currentLevel++;
        if(currentLevel >= levels.length){
          modal.style.display = "flex";
          endGame();
        } else {
          setTimeout(loadPage, 600);
        }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${slotKey}`);
      showFeedback(false);
      slot.classList.add("shake");
      setTimeout(()=>slot.classList.remove("shake"), 450);
    }
    saveProgress();
  }

  // ----------------------------
  // Matching logic (safe)
  // Levels:
  // 0/1 weather<->weather exact
  // 2/3 clothing<->clothing exact
  // 4 weather->clothing (slot is clothing)
  // 5 clothing->weather (slot is weather)
  // ----------------------------
  function checkMatch(slotKey, draggedKey){
    const lvl = currentLevel;

    if(lvl === 0 || lvl === 1) return slotKey === draggedKey;
    if(lvl === 2 || lvl === 3) return slotKey === draggedKey;

    if(lvl === 4){
      // draggedKey should be weather; slotKey clothing
      const weather = W[draggedKey];
      if(!weather || !Array.isArray(weather.allowedClothing)) return false;
      return weather.allowedClothing.includes(slotKey);
    }

    if(lvl === 5){
      // draggedKey clothing -> slotKey weather
      const weather = W[slotKey];
      if(!weather || !Array.isArray(weather.allowedClothing)) return false;
      return weather.allowedClothing.includes(draggedKey);
    }

    return false;
  }

  // ----------------------------
  // Modal / Buttons behaviour
  // ----------------------------
  stopBtn.addEventListener("click", ()=> {
    const percent = updateScore();
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed/60);
    const secs = elapsed % 60;
    scoreModalText.innerHTML = `Score: ${percent}%<br>Time: ${mins} mins ${secs} sec<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display = "flex";
  });

  continueBtn.addEventListener("click", ()=> {
    modal.style.display = "none";
    gameEnded = false;
    const restored = restoreProgress();
    loadPage();
  });

  againBtn.addEventListener("click", ()=> {
    localStorage.removeItem(saveKey);
    location.reload();
  });

  finishBtn.addEventListener("click", ()=> {
    if(!gameEnded) endGame();
    setTimeout(()=> {
      window.location.href = "../MatchingGame/hub.html";
    }, 1200);
  });

  // ----------------------------
  // Google Form mapping (your values)
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

  const subject = "Weather";

  // ----------------------------
  // End game & Google Form submission
  // ----------------------------
  function endGame(){
    if(gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const elapsedSec = Math.round((endTime - startTime) / 1000);
    const timeString = `${Math.floor(elapsedSec/60)} mins ${elapsedSec%60} sec`;
    const percent = updateScore();

    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);

    const entries = {};
    entries[formEntries.studentName] = studentName;
    entries[formEntries.studentClass] = studentClass;
    entries[formEntries.subject] = subject;
    entries[formEntries.timeTaken] = timeString;
    entries[formEntries.percentage] = `${percent}%`;
    entries[formEntries.currentLevel] = `${Math.min(currentLevel+1, levels.length)}`;

    // per-level fields (levels 1..6)
    for(let i=0;i<6;i++){
      entries[formEntries[`level${i+1}Correct`]] = Array.from(levelAttempts[i].correct).join(",");
      entries[formEntries[`level${i+1}Incorrect`]] = (levelAttempts[i].incorrect || []).join(",");
    }
    entries[formEntries.totalCorrect] = `${totalCorrect}`;
    entries[formEntries.totalIncorrect] = `${totalIncorrect}`;
    entries[formEntries.errorsReviewed] = "";

    const form = document.createElement("form");
    form.action = formURL;
    form.method = "POST";
    form.target = "hidden_iframe";
    form.style.display = "none";

    if(!document.querySelector("iframe[name='hidden_iframe']")){
      const iframe = document.createElement("iframe");
      iframe.name = "hidden_iframe";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    for(const key in entries){
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    scoreModalText.innerHTML = `Score: ${percent}%<br>Time: ${timeString}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display = "flex";
  }

  // ----------------------------
  // Init: restore or start fresh
  // ----------------------------
  const resumed = restoreProgress();
  loadPage();

}); // end DOMContentLoaded

                          
