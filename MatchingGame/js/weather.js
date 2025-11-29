/* weather.js — Full merged, production-ready
   - Uses localStorage studentName & studentClass gating (must be set earlier)
   - 6 levels:
     0: Weather Signs -> Weather Images
     1: Weather Images -> Weather Signs
     2: Clothing Signs -> Clothing Images
     3: Clothing Images -> Clothing Signs
     4: Weather Signs -> Clothing Images (any allowed clothing counts)
     5: Clothing Signs -> Weather Images (primary / allowed mapping used)
   - Google Form mapping included at bottom
*/

document.addEventListener("DOMContentLoaded", function () {
  // ----------------------------
  // Student gating (must be set earlier)
  // ----------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    // redirect to entry page if missing
    window.location.href = "../index.html";
    return;
  }

  // ----------------------------
  // DOM
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

  // track per-level attempts
  const levelAttempts = Array(6).fill(null).map(()=>({ correct: new Set(), incorrect: [] }));

  // ----------------------------
  // Data - weather & clothing items
  // ----------------------------
  const weatherItems = [
    { key:"sunny",  obviousClothing:"thongs", allowedClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart:"assets/weather/clipart/sunny.png", sign:"assets/weather/signs/sunny.png" },
    { key:"cloudy", obviousClothing:"jumper", allowedClothing:["shirt","jumper","shorts","pants","shoes","socks","skirt","dress"], clipart:"assets/weather/clipart/cloudy.png", sign:"assets/weather/signs/cloudy.png" },
    { key:"rainy",  obviousClothing:"umbrella", allowedClothing:["jacket","boots","pants","umbrella"], clipart:"assets/weather/clipart/rainy.png", sign:"assets/weather/signs/rainy.png" },
    { key:"stormy", obviousClothing:"boots", allowedClothing:["jacket","socks","boots","pants"], clipart:"assets/weather/clipart/stormy.png", sign:"assets/weather/signs/stormy.png" },
    { key:"windy",  obviousClothing:"jacket", allowedClothing:["jumper","socks","shoes","pants","jacket"], clipart:"assets/weather/clipart/windy.png", sign:"assets/weather/signs/windy.png" },
    { key:"snowy",  obviousClothing:"gloves", allowedClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart:"assets/weather/clipart/snowy.png", sign:"assets/weather/signs/snowy.png" },
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
    { key:"boots", clipart:"assets/clothing/clipart/boots.png", sign:"assets/clothing/signs/boots.png", primaryWeather:"stormy" },
    { key:"umbrella", clipart:"assets/clothing/clipart/umbrella.png", sign:"assets/clothing/signs/umbrella.png", primaryWeather:"rainy" },
    { key:"gloves", clipart:"assets/clothing/clipart/gloves.png", sign:"assets/clothing/signs/gloves.png", primaryWeather:"snowy" },
    { key:"scarf", clipart:"assets/clothing/clipart/scarf.png", sign:"assets/clothing/signs/scarf.png", primaryWeather:"snowy" },
    { key:"beanie", clipart:"assets/clothing/clipart/beanie.png", sign:"assets/clothing/signs/beanie.png", primaryWeather:"snowy" }
  ];

  // quick lookup
  const W = Object.fromEntries(weatherItems.map(w=>[w.key,w]));
  const C = Object.fromEntries(clothingItems.map(c=>[c.key,c]));
  const allWeather = weatherItems.map(w=>w.key);
  const allClothing = clothingItems.map(c=>c.key);

  // level definitions
  const levels = [
    { name: "Weather Signs → Weather Images", leftPool: allWeather, rightPool: allWeather, leftMode: "sign", rightMode: "clipart" },
    { name: "Weather Images → Weather Signs", leftPool: allWeather, rightPool: allWeather, leftMode: "clipart", rightMode: "sign" },
    { name: "Clothing Signs → Clothing Images", leftPool: allClothing, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Images → Clothing Signs", leftPool: allClothing, rightPool: allClothing, leftMode: "clipart", rightMode: "sign" },
    { name: "Weather Signs → Clothing Images", leftPool: allWeather, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Signs → Weather Images", leftPool: allClothing, rightPool: allWeather, leftMode: "sign", rightMode: "clipart" }
  ];

  // feedback image element (correct/wrong)
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

  // save/restore
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
  // Match checking logic
  // ----------------------------
  // draggedKey = key of the dragged item (from leftPool)
  // slotKey = key of the target slot (rightPool)
  function checkMatch(slotKey, draggedKey){
    const lvl = currentLevel;

    // levels 0 & 1: weather <-> weather (exact)
    if(lvl === 0 || lvl === 1){
      return slotKey === draggedKey;
    }

    // levels 2 & 3: clothing <-> clothing (exact)
    if(lvl === 2 || lvl === 3){
      return slotKey === draggedKey;
    }

    // level 4: weather (draggable) -> clothing (slot). OK if weather.allowedClothing includes slotKey
    if(lvl === 4){
      const weather = W[draggedKey];
      if(!weather) return false;
      return weather.allowedClothing.includes(slotKey);
    }

    // level 5: clothing (draggable) -> weather (slot). OK if weather.allowedClothing includes draggedKey
    if(lvl === 5){
      const weather = W[slotKey];
      if(!weather) return false;
      return weather.allowedClothing.includes(draggedKey);
    }

    return false;
  }

  // ----------------------------
  // Drag & Drop + Touch support
  // ----------------------------
  function makeDraggable(img, key){
    img.classList.add("draggable");
    img.draggable = true;
    img.dataset.key = key;
    img.addEventListener("dragstart", e=>{
      e.dataTransfer.setData("text/plain", key);
      e.dataTransfer.setData("src", img.src || "");
      // small mime to detect type if needed
      e.dataTransfer.setData("kind", W[key] ? "weather" : "clothing");
    });
    // touch support
    img.addEventListener("touchstart", function touchStart(ev){
      ev.preventDefault();
      const clone = img.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.pointerEvents = "none";
      clone.style.opacity = "0.85";
      clone.style.zIndex = "10000";
      document.body.appendChild(clone);

      const move = t => {
        clone.style.left = `${t.clientX - clone.width/2}px`;
        clone.style.top = `${t.clientY - clone.height/2}px`;
      };
      move(ev.touches[0]);

      function onMove(evm){
        evm.preventDefault();
        move(evm.touches[0]);
      }
      function onEnd(evm){
        const touch = evm.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if(el && el.classList.contains("slot")){
          // simulate drop
          const fakeEvent = {
            preventDefault: ()=>{},
            currentTarget: el,
            dataTransfer: {
              getData: (k)=> k === "text/plain" ? key : (k === "src" ? img.src : "")
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

  function handleDrop(e){
    e.preventDefault?.();
    const slot = e.currentTarget;
    const slotKey = slot.dataset.key; // target (rightPool)
    const draggedKey = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src");

    if(!draggedKey) return;

    const isCorrect = checkMatch(slotKey, draggedKey);

    if(isCorrect){
      // mark correct in attempts
      const lvlObj = levelAttempts[currentLevel];
      if(!lvlObj.correct.has(`${draggedKey}->${slotKey}`)){
        lvlObj.correct.add(`${draggedKey}->${slotKey}`);
      }

      // show overlay: append an img (use provided src where possible)
      slot.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.className = "overlay";
      overlay.src = src || (W[draggedKey] ? (levels[currentLevel].leftMode==="clipart"? W[draggedKey].clipart : W[draggedKey].sign) : (C[draggedKey]? (levels[currentLevel].leftMode==="clipart"? C[draggedKey].clipart : C[draggedKey].sign) : ""));
      slot.appendChild(overlay);

      // remove all draggables with same key (they should go away)
      document.querySelectorAll(`img.draggable[data-key='${draggedKey}']`).forEach(el=>el.remove());

      correctMatches++;
      showFeedback(true);
      updateScore();

      // if all slots filled, move to next level or show modal if final
      const totalSlots = document.querySelectorAll(".slot").length;
      if(correctMatches >= totalSlots){
        correctMatches = 0;
        currentLevel++;
        if(currentLevel >= levels.length){
          // finished game
          // show modal & submit
          modal.style.display = "flex";
          endGame();
        } else {
          setTimeout(loadPage, 600);
        }
      }
    } else {
      // incorrect
      levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${slotKey}`);
      showFeedback(false);
      // small shake animation
      slot.classList.add("shake");
      setTimeout(()=>slot.classList.remove("shake"), 450);
    }
    saveProgress();
  }

  // attach drop handlers to a slot element
  function makeSlotDroppable(slot){
    slot.classList.add("slot");
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", handleDrop);
    // touch drop handled by touchstart simulation on draggables
  }

  // ----------------------------
  // Page / Level generation
  // ----------------------------
  function loadPage(){
    const info = levels[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel+1}: ${info.name}`;
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    gameBoard.innerHTML = "";

    // select up to 9 left items and build slots based on them
    const leftPool = shuffle(info.leftPool).slice(0, Math.min(9, info.leftPool.length));
    // choose right targets based on left items and level semantics
    const slots = leftPool.map(leftKey => {
      let rightKey = null;
      if(currentLevel === 0 || currentLevel === 1) rightKey = leftKey;
      else if(currentLevel === 2 || currentLevel === 3) rightKey = leftKey;
      else if(currentLevel === 4){
        // left is weather, right should be obvious clothing (ensure a valid clothing target)
        const w = W[leftKey];
        rightKey = w && w.obviousClothing ? w.obviousClothing : (w? w.allowedClothing[0] : null);
      } else if(currentLevel === 5){
        // left is clothing, right should be clothing.primaryWeather (a weather key)
        const c = C[leftKey];
        rightKey = c && c.primaryWeather ? c.primaryWeather : (allWeather[0]);
      }
      return { leftKey, rightKey };
    });

    // Build slots in center for right items (these are the drop targets)
    slots.forEach(s => {
      const slot = document.createElement("div");
      slot.style.width = "";
      // dataset key must be the rightKey (target)
      let keyForTarget = s.rightKey;
      if(!keyForTarget){
        // fallback: random from rightPool
        keyForTarget = shuffle(info.rightPool)[0];
      }
      slot.dataset.key = keyForTarget;
      // background per rightMode
      const isWeather = !!W[keyForTarget];
      const itemObj = isWeather ? W[keyForTarget] : C[keyForTarget];
      const bg = (info.rightMode === "clipart") ? itemObj.clipart : itemObj.sign;
      slot.style.backgroundImage = `url('${bg}')`;
      slot.style.backgroundSize = "contain";
      slot.style.backgroundPosition = "center";
      slot.style.backgroundRepeat = "no-repeat";
      slot.style.width = "120px";
      slot.style.height = "120px";
      slot.style.margin = "10px";
      slot.style.border = "none";
      slot.style.boxSizing = "border-box";
      // add proper classes to be styled by your CSS
      slot.className = "slot";
      makeSlotDroppable(slot);
      gameBoard.appendChild(slot);
    });

    // Draggables: present the left keys (leftPool) as draggable images
    // plus some decoys from left pool to reach up to 9 draggables total
    let draggableKeys = leftPool.slice();
    // add decoys if needed (from leftPool universe)
    const needed = Math.max(0, 9 - draggableKeys.length);
    const candidates = shuffle(info.leftPool).filter(k=>!draggableKeys.includes(k));
    for(let i=0;i<needed && i<candidates.length;i++) draggableKeys.push(candidates[i]);

    draggableKeys = shuffle(Array.from(new Set(draggableKeys))).slice(0,9);

    // create draggable nodes and put half in leftSigns and half in rightSigns
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

      const isWeather = !!W[key];
      const obj = isWeather ? W[key] : C[key];
      const src = (info.leftMode === "clipart") ? obj.clipart : obj.sign;
      img.src = src;
      makeDraggable(img, key);

      wrapper.appendChild(img);
      if(idx < half) leftSigns.appendChild(wrapper);
      else rightSigns.appendChild(wrapper);
    });

    // reset counters
    correctMatches = 0;
    updateScore();
    saveProgress();
  }

  // ----------------------------
  // Modal / Buttons behaviour
  // ----------------------------
  stopBtn.addEventListener("click", ()=> {
    // compute score and time
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
    // load page either from restored state or fresh
    loadPage();
  });

  againBtn.addEventListener("click", ()=> {
    localStorage.removeItem(saveKey);
    location.reload();
  });

  finishBtn.addEventListener("click", ()=> {
    if(!gameEnded) endGame();
    setTimeout(()=> {
      // go back to hub (same as your other pages)
      window.location.href = "../MatchingGame/hub.html";
    }, 1400);
  });

  // ----------------------------
  // End game & Google Form submission
  // ----------------------------
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

  function endGame(){
    if(gameEnded) return;
    gameEnded = true;

    const endTime = Date.now();
    const elapsedSec = Math.round((endTime - startTime) / 1000);
    const timeString = `${Math.floor(elapsedSec/60)} mins ${elapsedSec%60} sec`;
    const percent = updateScore();

    // build submission payload
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);

    const entries = {};
    entries[formEntries.studentName] = studentName;
    entries[formEntries.studentClass] = studentClass;
    entries[formEntries.subject] = subject;
    entries[formEntries.timeTaken] = timeString;
    entries[formEntries.percentage] = `${percent}%`;
    entries[formEntries.currentLevel] = `${Math.min(currentLevel+1, levels.length)}`;

    // per-level fields
    for(let i=0;i<6;i++){
      entries[formEntries[`level${i+1}Correct`]] = Array.from(levelAttempts[i].correct).join(",");
      entries[formEntries[`level${i+1}Incorrect`]] = (levelAttempts[i].incorrect || []).join(",");
    }
    entries[formEntries.totalCorrect] = `${totalCorrect}`;
    entries[formEntries.totalIncorrect] = `${totalIncorrect}`;
    entries[formEntries.errorsReviewed] = ""; // optional

    // create form element and submit to hidden iframe to avoid navigation
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

    // show modal with results
    scoreModalText.innerHTML = `Score: ${percent}%<br>Time: ${timeString}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display = "flex";
  }

  // ----------------------------
  // Init: restore or start fresh
  // ----------------------------
  const resumed = restoreProgress();
  // If resumed, load that level, otherwise start at currentLevel(0)
  loadPage();
});
