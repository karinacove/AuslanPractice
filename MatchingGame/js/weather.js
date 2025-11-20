/* matching.js — Weather & Clothing matching game (re-uses your engine style)
   - Levels:
     1: Weather signs  -> Weather images (sign -> image)
     2: Weather images -> Weather signs (image -> sign)
     3: Clothing signs -> Clothing images (sign -> image)
     4: Clothing images -> Clothing signs (image -> sign)
     5: Weather signs  -> Clothing images (weather -> clothing: any valid clothing counts)
     6: Clothing signs -> Weather images (clothing -> weather: primary obvious weather chosen)
*/

document.addEventListener("DOMContentLoaded", function () {
  // ===== STUDENT INFO =====
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }
  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // ===== DOM =====
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const stopBtn = document.getElementById("stop-btn");
  const stopScoreEl = document.getElementById("stop-score");
  const modal = document.getElementById("end-modal");
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  // ===== STATE =====
  let currentLevel = 0;
  let currentPage = 0;
  let pageSets = []; // array of pages (each page: array of items)
  let correctMatches = 0;
  let gameEnded = false;
  let startTime = Date.now();

  // keep track per level attempts (6 levels)
  const levelAttempts = Array(6).fill(null).map(()=>({correct: new Set(), incorrect: []}));

  // form entries (preserve your google form field ids if needed - updated to "WeatherClothing")
  const formEntryIDs = {
    correct: [
      "entry.1897227570","entry.1116300030","entry.187975538","entry.1880514176",
      "entry.497882042","entry.1591755601"
    ],
    incorrect: [
      "entry.1249394203","entry.1551220511","entry.903633326","entry.856597282",
      "entry.552536101","entry.922308538"
    ]
  };

  // ===== Items (weather and clothing) =====
  // NOTE: asset filenames must match paths described in the asset section below
  const weatherItems = [
    { key: "sunny", id: 0, name: "sunny", obviousClothing: "thongs", allowedClothing: ["hat","shirt","shorts","thongs","bathers","skirt","dress"], clipart: "assets/weather/clipart/sunny.png", sign: "assets/weather/signs/sunny.png" },
    { key: "cloudy", id: 1, name: "cloudy", obviousClothing: "jumper", allowedClothing: ["shirt","jumper","shorts","pants","shoes","socks","skirt","dress"], clipart: "assets/weather/clipart/cloudy.png", sign: "assets/weather/signs/cloudy.png" },
    { key: "rainy", id: 2, name: "rainy", obviousClothing: "umbrella", allowedClothing: ["jacket","boots","pants","umbrella"], clipart: "assets/weather/clipart/rainy.png", sign: "assets/weather/signs/rainy.png" },
    { key: "stormy", id: 3, name: "stormy", obviousClothing: "boots", allowedClothing: ["jacket","socks","boots","pants"], clipart: "assets/weather/clipart/stormy.png", sign: "assets/weather/signs/stormy.png" },
    { key: "windy", id: 4, name: "windy", obviousClothing: "jacket", allowedClothing: ["jumper","socks","shoes","pants","jacket"], clipart: "assets/weather/clipart/windy.png", sign: "assets/weather/signs/windy.png" },
    { key: "snowy", id: 5, name: "snowy", obviousClothing: "gloves", allowedClothing: ["gloves","scarf","beanie","socks","shoes","jumper","jacket"], clipart: "assets/weather/clipart/snowy.png", sign: "assets/weather/signs/snowy.png" }
  ];

  const clothingItems = [
    { key: "hat", id: 10, name: "hat", clipart: "assets/clothing/clipart/hat.png", sign: "assets/clothing/signs/hat.png", primaryWeather: "sunny" },
    { key: "shirt", id: 11, name: "shirt", clipart: "assets/clothing/clipart/shirt.png", sign: "assets/clothing/signs/shirt.png", primaryWeather: "cloudy" },
    { key: "shorts", id: 12, name: "shorts", clipart: "assets/clothing/clipart/shorts.png", sign: "assets/clothing/signs/shorts.png", primaryWeather: "sunny" },
    { key: "thongs", id: 13, name: "thongs", clipart: "assets/clothing/clipart/thongs.png", sign: "assets/clothing/signs/thongs.png", primaryWeather: "sunny" },
    { key: "bathers", id: 14, name: "bathers", clipart: "assets/clothing/clipart/bathers.png", sign: "assets/clothing/signs/bathers.png", primaryWeather: "sunny" },
    { key: "skirt", id: 15, name: "skirt", clipart: "assets/clothing/clipart/skirt.png", sign: "assets/clothing/signs/skirt.png", primaryWeather: "sunny" },
    { key: "dress", id: 16, name: "dress", clipart: "assets/clothing/clipart/dress.png", sign: "assets/clothing/signs/dress.png", primaryWeather: "sunny" },
    { key: "jumper", id: 17, name: "jumper", clipart: "assets/clothing/clipart/jumper.png", sign: "assets/clothing/signs/jumper.png", primaryWeather: "cloudy" },
    { key: "pants", id: 18, name: "pants", clipart: "assets/clothing/clipart/pants.png", sign: "assets/clothing/signs/pants.png", primaryWeather: "cloudy" },
    { key: "shoes", id: 19, name: "shoes", clipart: "assets/clothing/clipart/shoes.png", sign: "assets/clothing/signs/shoes.png", primaryWeather: "cloudy" },
    { key: "socks", id: 20, name: "socks", clipart: "assets/clothing/clipart/socks.png", sign: "assets/clothing/signs/socks.png", primaryWeather: "cloudy" },
    { key: "jacket", id: 21, name: "jacket", clipart: "assets/clothing/clipart/jacket.png", sign: "assets/clothing/signs/jacket.png", primaryWeather: "windy" },
    { key: "boots", id: 22, name: "boots", clipart: "assets/clothing/clipart/boots.png", sign: "assets/clothing/signs/boots.png", primaryWeather: "stormy" },
    { key: "umbrella", id: 23, name: "umbrella", clipart: "assets/clothing/clipart/umbrella.png", sign: "assets/clothing/signs/umbrella.png", primaryWeather: "rainy" },
    { key: "gloves", id: 24, name: "gloves", clipart: "assets/clothing/clipart/gloves.png", sign: "assets/clothing/signs/gloves.png", primaryWeather: "snowy" },
    { key: "scarf", id: 25, name: "scarf", clipart: "assets/clothing/clipart/scarf.png", sign: "assets/clothing/signs/scarf.png", primaryWeather: "snowy" },
    { key: "beanie", id: 26, name: "beanie", clipart: "assets/clothing/clipart/beanie.png", sign: "assets/clothing/signs/beanie.png", primaryWeather: "snowy" }
  ];

  // helper maps
  const weatherByKey = Object.fromEntries(weatherItems.map(w=>[w.key,w]));
  const clothingByKey = Object.fromEntries(clothingItems.map(c=>[c.key,c]));
  const allClothingKeys = clothingItems.map(c=>c.key);
  const allWeatherKeys = weatherItems.map(w=>w.key);

  // ===== Level definitions (6 levels) =====
  // Each level object describes:
  // - leftPool: array of keys to choose left side from (either weather keys or clothing keys)
  // - rightPool: array of keys to choose right side from
  // - leftMode: "sign" or "clipart" (left visuals)
  // - rightMode: "sign" or "clipart" (right visuals)
  // - pages: number of pages (kept to 1 here; can be increased)
  const levelDefinitions = [
    { name: "Weather Signs → Weather Images", leftPool: allWeatherKeys, rightPool: allWeatherKeys, leftMode: "sign", rightMode: "clipart", pages: 1 },
    { name: "Weather Images → Weather Signs", leftPool: allWeatherKeys, rightPool: allWeatherKeys, leftMode: "clipart", rightMode: "sign", pages: 1 },
    { name: "Clothing Signs → Clothing Images", leftPool: allClothingKeys, rightPool: allClothingKeys, leftMode: "sign", rightMode: "clipart", pages: 1 },
    { name: "Clothing Images → Clothing Signs", leftPool: allClothingKeys, rightPool: allClothingKeys, leftMode: "clipart", rightMode: "sign", pages: 1 },
    { name: "Weather Signs → Clothing Images", leftPool: allWeatherKeys, rightPool: allClothingKeys, leftMode: "sign", rightMode: "clipart", pages: 1 },
    { name: "Clothing Signs → Weather Images", leftPool: allClothingKeys, rightPool: allWeatherKeys, leftMode: "sign", rightMode: "clipart", pages: 1 }
  ];

  // ===== Feedback image =====
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "200px",
    display: "none",
    zIndex: "1000"
  });
  document.body.appendChild(feedbackImage);

  function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
  function showFeedback(correct){
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(()=>feedbackImage.style.display="none",800);
  }

  function updateScore(){
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect+totalIncorrect>0 ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100) : 0;
    document.getElementById("score-display").innerText=`Score: ${percent}%`;
    return percent;
  }

  function saveProgress(){
    localStorage.setItem("weatherClothingSave", JSON.stringify({
      studentName, studentClass, currentLevel, currentPage,
      levelAttempts: levelAttempts.map(l=>({correct:Array.from(l.correct),incorrect:l.incorrect})),
      timestamp: Date.now()
    }));
  }

  function restoreProgress(){
    const data = JSON.parse(localStorage.getItem("weatherClothingSave"));
    if(!data || data.studentName!==studentName || data.studentClass!==studentClass) return false;
    currentLevel=data.currentLevel; currentPage=data.currentPage;
    data.levelAttempts.forEach((lvl,i)=>{ levelAttempts[i].correct=new Set(lvl.correct); levelAttempts[i].incorrect=lvl.incorrect; });
    return true;
  }

  function endGame(){
    if(gameEnded) return;
    gameEnded=true;
    const endTime = Date.now();
    const formattedTime = `${Math.floor((endTime - startTime)/60000)} mins ${Math.floor((endTime - startTime)/1000)%60} sec`;
    const percent = updateScore();

    const form = document.createElement("form");
    form.action = "https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.method = "POST";
    form.target = "hidden_iframe"; form.style.display="none";
    if(!document.querySelector("iframe[name='hidden_iframe']")){
      const iframe = document.createElement("iframe");
      iframe.name="hidden_iframe"; iframe.style.display="none";
      document.body.appendChild(iframe);
    }

    const entries = {
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "WeatherClothing",
      "entry.1374858042": formattedTime,
      "entry.1996137354": `${percent}%`
    };
    for(let i=0;i<6;i++){
      entries[formEntryIDs.correct[i]] = Array.from(levelAttempts[i].correct).join(",");
      entries[formEntryIDs.incorrect[i]] = levelAttempts[i].incorrect.join(",");
    }
    for(const key in entries){
      const input=document.createElement("input");
      input.type="hidden"; input.name=key; input.value=entries[key];
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  // ===== Drag/drop handlers =====
  function dropHandler(e){
    e.preventDefault();
    const leftKey = e.currentTarget.dataset.key; // target slot key (the item shown on board)
    const targetMode = e.currentTarget.dataset.mode; // 'clipart' or 'sign'
    const draggedKey = e.dataTransfer.getData("text/plain"); // key of dragged item (left/right side image key)
    const draggedKind = e.dataTransfer.getData("kind"); // 'weather' or 'clothing'
    const draggedSrc = e.dataTransfer.getData("src");

    // determine if this is a correct match, using current level rules
    const info = levelDefinitions[currentLevel];
    const isCorrect = checkMatch(info, leftKey, draggedKey);

    if(isCorrect){
      // mark correct
      const levelObj = levelAttempts[currentLevel];
      if(!levelObj.correct.has(draggedKey)) levelObj.correct.add(draggedKey);
      // overlay the dragged image into slot
      e.currentTarget.innerHTML = "";
      const overlay = document.createElement("img");
      overlay.src = draggedSrc;
      overlay.className = "overlay";
      e.currentTarget.appendChild(overlay);
      // remove all draggable images with same key
      document.querySelectorAll(`img.draggable[data-key='${draggedKey}']`).forEach(el=>el.remove());
      correctMatches++; showFeedback(true); updateScore();

      // check page completion
      const totalSlots = document.querySelectorAll(".slot").length;
      if(correctMatches >= totalSlots){
        // prepare next page or next level
        correctMatches = 0;
        currentLevel++;
        currentPage = 0;
        if(currentLevel >= levelDefinitions.length){
          // done
          modal.style.display = "flex";
          endGame();
        } else {
          setTimeout(loadPage, 700);
        }
      }
    } else {
      levelAttempts[currentLevel].incorrect.push(draggedKey);
      showFeedback(false);
      // optional visual shake
      e.currentTarget.classList.add("shake");
      setTimeout(()=>e.currentTarget.classList.remove("shake"),500);
    }
  }

  function touchStart(e){
    const target = e.target;
    if(!target.classList.contains("draggable")) return;
    const key = target.dataset.key;
    const src = target.src;
    const clone = target.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.7";
    clone.style.zIndex = "10000";
    document.body.appendChild(clone);
    const moveClone = t => {
      clone.style.left = `${t.clientX-clone.width/2}px`;
      clone.style.top = `${t.clientY-clone.height/2}px`;
    };
    moveClone(e.touches[0]);
    const handleTouchMove = ev => { ev.preventDefault(); moveClone(ev.touches[0]); };
    const handleTouchEnd = ev => {
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if(el && el.classList.contains("slot")){
        // simulate drop
        dropHandler({ preventDefault: ()=>{}, currentTarget: el, dataTransfer: { getData: k => (k==="text/plain"?key:src) }});
      }
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      clone.remove();
    };
    document.addEventListener("touchmove", handleTouchMove, {passive:false});
    document.addEventListener("touchend", handleTouchEnd, {passive:false});
  }

  function checkMatch(levelInfo, slotKey, draggedKey){
    // slotKey and draggedKey are string keys (like 'sunny' or 'hat')
    // Determine match validity according to the current level.
    // Level semantics:
    // 0: weather(sign) -> weather(clipart)   : match if same weather key
    // 1: weather(clipart) -> weather(sign)   : match if same weather key
    // 2: clothing(sign) -> clothing(clipart) : match if same clothing key
    // 3: clothing(clipart) -> clothing(sign) : match if same clothing key
    // 4: weather(sign) -> clothing(clipart)  : match if dragged clothing is in weather.allowedClothing
    // 5: clothing(sign) -> weather(clipart)  : match if slot weather's allowedClothing contains dragged clothing.key's name OR clothing's primaryWeather equals slot weather (we use primaryWeather as the 'obvious' mapping)
    const lvl = currentLevel;

    if(lvl === 0 || lvl === 1){
      // weather-to-weather matches: both keys are weather keys and should equal
      return slotKey === draggedKey;
    } else if(lvl === 2 || lvl === 3){
      // clothing-to-clothing: exact match
      return slotKey === draggedKey;
    } else if(lvl === 4){
      // weather sign -> clothing clipart: slot = weather key, dragged = clothing key
      const weather = weatherByKey[slotKey];
      if(!weather) return false;
      return weather.allowedClothing.includes(draggedKey);
    } else if(lvl === 5){
      // clothing sign -> weather clipart: slot is weather, dragged is clothing OR vice versa?
      // In our definition level 6 (index 5) is clothing(sign)->weather(clipart)
      const weather = weatherByKey[draggedKey]; // check both ways just in case
      if(weather){
        // If draggedKey is a weather (rare), not expected; return false
        return false;
      }
      const clothing = clothingByKey[slotKey] ? clothingByKey[slotKey] : clothingByKey[draggedKey];
      // In this engine's setup, we expect slotKey to be clothing (left), right slot is weather - but dropHandler sets
      // slotKey to the board slot (which is weather). So we will check both ways to be safe:
      // If slotKey is a weather:
      if(weatherByKey[slotKey]){
        const slotWeather = weatherByKey[slotKey];
        // draggedKey should be clothing
        if(clothingByKey[draggedKey]){
          const draggedClothing = clothingByKey[draggedKey];
          // correct if the dragged clothing is in slotWeather.allowedClothing
          return slotWeather.allowedClothing.includes(draggedClothing.key);
        }
        return false;
      } else {
        // Slot is clothing and dragged is weather (less common): treat correct if clothing.primaryWeather === dragged weather
        if(clothingByKey[slotKey] && weatherByKey[draggedKey]){
          return clothingByKey[slotKey].primaryWeather === draggedKey;
        }
        return false;
      }
    }
    return false;
  }

  // ===== Load a page for current level =====
  function loadPage(){
    const info = levelDefinitions[currentLevel];
    levelTitle.innerText = `Level ${currentLevel+1}: ${info.name}`;

    // Build a simple page: choose up to 9 left items and up to 9 right items (or fewer if pool smaller)
    const leftPool = shuffle(info.leftPool).slice(0,9);
    // For matching we want a 1:1 set of answer slots on the board — we'll show the right-side targets as slots
    // We'll use rightPool as the candidates for draggable items.
    const rightPool = shuffle(info.rightPool).slice(0,9);

    // For levels that require cross-type matching (weather->clothing or clothing->weather), ensure
    // that there is at least one correct pair per slot. Strategy:
    // - For each slot (we will display up to 9 slots), choose the 'obvious' matching item to guarantee a correct answer exists.
    const slots = [];
    for(let i=0;i<Math.min(9,leftPool.length);i++){
      const leftKey = leftPool[i];
      // figure out the obvious right key for this slot based on the level
      let rightKey = null;
      if(currentLevel === 0 || currentLevel === 1){
        rightKey = leftKey; // same weather
      } else if(currentLevel === 2 || currentLevel === 3){
        rightKey = leftKey; // same clothing
      } else if(currentLevel === 4){
        // weather(sign) -> clothing(clipart): pick the 'obviousClothing' for the weather (but any allowed clothing accepted by checkMatch)
        const w = weatherByKey[leftKey];
        rightKey = w ? w.obviousClothing : null;
        if(!rightKey){
          // fallback to first allowed clothing
          rightKey = w.allowedClothing[0];
        }
      } else if(currentLevel === 5){
        // clothing(sign) -> weather(clipart): choose clothing's primaryWeather
        const c = clothingByKey[leftKey];
        rightKey = c ? c.primaryWeather : null;
      }
      slots.push({ leftKey, rightKey });
    }

    // Build DOM
    gameBoard.innerHTML = "";
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";

    // Create visual slots in the central board for the RIGHT items (targets) — consistent with original engine
    slots.forEach((s)=>{
      const slot = document.createElement("div");
      slot.className = "slot";
      // We'll display the target item (right) as background image depending on rightMode
      let targetMode = info.rightMode;
      let keyForTarget = s.rightKey;
      if(!keyForTarget){
        // fallback - pick a random rightPool item
        keyForTarget = rightPool[Math.floor(Math.random()*rightPool.length)];
      }
      slot.dataset.key = keyForTarget; // used in drop logic
      slot.dataset.mode = targetMode;
      // set background image according to mode and whether key is weather or clothing
      const isWeather = weatherByKey[keyForTarget];
      const itemObj = isWeather ? weatherByKey[keyForTarget] : clothingByKey[keyForTarget];
      const bg = (targetMode === "clipart") ? itemObj.clipart : itemObj.sign;
      slot.style.backgroundImage = `url('${bg}')`;
      gameBoard.appendChild(slot);
    });

    // Now build draggable images (left side) — include decoys. We'll include the obvious matching items plus random decoys that are incorrect for clarity.
    // We'll generate a set that includes for each slot its obvious correct left-side item, plus up to 3 decoys
    let draggableSet = [];

    // If left side is 'sign' (i.e., visual type sign), then left items will be sign images of keys from slots' leftKey
    slots.forEach(s=>{
      // leftKey is what should be displayed as draggable visuals on left/right columns
      let leftKey = s.leftKey;
      // For levels where left pool is weather but we want to present clothing draggables (or vice versa),
      // we must ensure the draggableSet uses the correct kind asked by level's leftPool.
      if(!leftKey) return;
      draggableSet.push(leftKey);
    });

    // Add "obvious matching" items for each slot to ensure at least one correct draggable exists
    slots.forEach(s=>{
      if(s.rightKey && !draggableSet.includes(s.rightKey)){
        // include the rightKey as a draggable too (helps in some modes)
        draggableSet.push(s.rightKey);
      }
    });

    // Add decoys (items that are deliberately wrong). Choose decoys from the opposite pool
    // For weather->clothing, decoys should be clothing items that are NOT in allowedClothing
    // For other modes, choose random items not equal to correct ones.
    const neededDecoys = Math.max(0, 9 - draggableSet.length);
    const allPossibleDraggables = (info.leftPool === allWeatherKeys ? allWeatherKeys : allClothingKeys);
    const candidateDecoys = shuffle(allPossibleDraggables).filter(k => !draggableSet.includes(k));
    for(let i=0;i<Math.min(neededDecoys, candidateDecoys.length); i++){
      draggableSet.push(candidateDecoys[i]);
    }

    // Ensure uniqueness and shuffle
    draggableSet = shuffle(Array.from(new Set(draggableSet))).slice(0, 9);

    // Create draggable images and append to columns (split between leftSigns and rightSigns)
    draggableSet.forEach((key, idx)=>{
      const img = document.createElement("img");
      img.className = "draggable";
      img.draggable = true;
      img.dataset.key = key;
      // choose whether this is clothing or weather for file selection
      const obj = weatherByKey[key] || clothingByKey[key];
      const srcMode = info.leftMode; // left visuals use leftMode
      img.src = (srcMode === "clipart") ? obj.clipart : obj.sign;
      img.addEventListener("dragstart", e=>{
        e.dataTransfer.setData("text/plain", key);
        e.dataTransfer.setData("kind", weatherByKey[key] ? "weather" : "clothing");
        e.dataTransfer.setData("src", img.src);
      });
      img.addEventListener("touchstart", touchStart);

      const wrap = document.createElement("div");
      wrap.className = "drag-wrapper";
      wrap.appendChild(img);
      (idx < Math.ceil(draggableSet.length/2) ? leftSigns : rightSigns).appendChild(wrap);
    });

    // add drop listeners to slots
    correctMatches = 0;
    document.querySelectorAll(".slot").forEach(slot=>{
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", dropHandler);
    });

    updateScore();
    saveProgress();
  }

  // ===== STOP button logic =====
  stopBtn.addEventListener("click", () => {
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const formattedTime = `${minutes} mins ${seconds} sec`;

    const totalCorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.correct.size, 0);
    const totalIncorrect = levelAttempts.reduce((sum, lvl) => sum + lvl.incorrect.length, 0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

    stopScoreEl.innerHTML = `Score: ${percent}%<br>Time: ${formattedTime}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display = "flex";
  });

  continueBtn.onclick=()=>{
    modal.style.display="none"; gameEnded=false;
    const saved=JSON.parse(localStorage.getItem("weatherClothingSave") || "null");
    if(saved && saved.studentName===studentName && saved.studentClass===studentClass){
      currentLevel=saved.currentLevel; currentPage=saved.currentPage;
      saved.levelAttempts.forEach((lvl,i)=>{ levelAttempts[i].correct=new Set(lvl.correct); levelAttempts[i].incorrect=lvl.incorrect; });
    }
    loadPage();
  };

  againBtn.onclick=()=>{
    localStorage.removeItem("weatherClothingSave"); location.reload();
  };

  finishBtn.onclick = () => {
    if (!gameEnded) endGame();
    setTimeout(()=> window.location.href = "../MatchingGame/hub.html", 1200);
  };

  const resumed = restoreProgress();
  if(resumed) loadPage(); else loadPage();
});
