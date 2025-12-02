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
  // DOM refs (create fallbacks if needed)
  // ----------------------------
  const ensureEl = (id, createTag = "div", createClass = "") => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(createTag);
      if (createClass) el.className = createClass;
      el.id = id;
      // try to attach inside .layout if exists, otherwise to body
      const layout = document.querySelector(".layout") || document.body;
      layout.appendChild(el);
    }
    return el;
  };

  const studentInfoEl = ensureEl("student-info");
  const scoreDisplayEl = ensureEl("score-display");
  const levelTitleEl = ensureEl("levelTitle", "h1");
  const leftSigns = ensureEl("leftSigns", "div", "left-signs");
  const gameBoard = document.getElementById("gameBoard") || null; // used for levels 0-3 only
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
  // State
  // ----------------------------
  let currentLevel = 0;
  let correctMatches = 0;
  let gameEnded = false;
  const startTime = Date.now();
  const saveKey = "weatherClothingSave_v2";

  // Per-level attempts (6 levels)
  const levelAttempts = Array(6).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  // For paged levels
  let pageIndex = 0; // 0 or 1 (two pages)
  const pagesPerLevel = 2;
  const itemsPerPage = 3; // show 3 weather per page

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
    // non-matchable extras (not used in cross-topic)
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
    { key:"clothes", clipart:"assets/clothing/clipart/clothes.png", signs:"assets/clothing/signs/clothes.png", primaryWeather: "weather" }
  ];

  const W = Object.fromEntries(weatherItems.map(w => [w.key, w]));
  const C = Object.fromEntries(clothingItems.map(c => [c.key, c]));
  const allWeather = weatherItems.map(w => w.key);
  const matchableWeather = weatherItems.filter(w => Array.isArray(w.obviousClothing) && w.obviousClothing.length>0).map(w=>w.key);
  const allClothing = clothingItems.map(c=>c.key);

  // levels:
  // 0,1: weather <-> weather
  // 2,3: clothing <-> clothing
  // 4: Weather Signs -> Clothing (paged)
  // 5: Weather Images -> Clothing Signs (paged)
  const levels = [
    { name: "Weather Signs → Weather Images", leftPool: allWeather, rightPool: allWeather, leftMode: "sign", rightMode: "clipart" },
    { name: "Weather Images → Weather Signs", leftPool: allWeather, rightPool: allWeather, leftMode: "clipart", rightMode: "sign" },
    { name: "Clothing Signs → Clothing Images", leftPool: allClothing, rightPool: allClothing, leftMode: "sign", rightMode: "clipart" },
    { name: "Clothing Images → Clothing Signs", leftPool: allClothing, rightPool: allClothing, leftMode: "clipart", rightMode: "sign" },
    // paged, 3 per page, 2 pages per level (matchableWeather only)
    { name: "Weather Signs → Clothing Images (paged)", leftPool: matchableWeather, rightPool: allClothing, leftMode: "sign", rightMode: "clipart", paged: true },
    { name: "Weather Images → Clothing Signs (paged)", leftPool: matchableWeather, rightPool: allClothing, leftMode: "clipart", rightMode: "sign", paged: true }
  ];

  // ----------------------------
  // Utilities
  // ----------------------------
  function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
  function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

  // feedback element
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style, {
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    width:"200px", display:"none", zIndex:"3000", pointerEvents:"none"
  });
  document.body.appendChild(feedbackImage);

  function showFeedback(correct){
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(()=>feedbackImage.style.display="none", 700);
  }

  function updateScore(){
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = (totalCorrect + totalIncorrect > 0) ? Math.round(totalCorrect / (totalCorrect + totalIncorrect) * 100) : 0;
    scoreDisplayEl.innerText = `Score: ${percent}%`;
    return percent;
  }

  // ----------------------------
  // Persistence
  // ----------------------------
  function saveProgress(){
    try{
      const payload = {
        studentName, studentClass, currentLevel, pageIndex,
        levelAttempts: levelAttempts.map(l => ({ correct: Array.from(l.correct), incorrect: l.incorrect })),
        timestamp: Date.now()
      };
      localStorage.setItem(saveKey, JSON.stringify(payload));
    }catch(e){ console.warn("saveProgress failed", e); }
  }

  function restoreProgress(){
    try{
      const raw = localStorage.getItem(saveKey);
      if(!raw) return false;
      const data = JSON.parse(raw);
      if(!data || data.studentName !== studentName || data.studentClass !== studentClass) return false;
      currentLevel = data.currentLevel || 0;
      pageIndex = data.pageIndex || 0;
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
  // Matching logic for levels 0-3 (exact) and paged levels (slot-based)
  // ----------------------------
  // For paged levels we will use per-weather required list (the chosen subset of obviousClothing)
  function checkExactMatch(slotKey, draggedKey){ return slotKey === draggedKey; }

  // ----------------------------
  // Drag & Drop + touch helpers
  // ----------------------------
  function createDraggableImage(src, key, mode){
    const img = document.createElement("img");
    img.src = src;
    img.draggable = true;
    img.className = "draggable";
    img.dataset.key = key;
    img.dataset.mode = mode || "";
    img.style.width = "100%";
    img.style.height = "100%";
    img.addEventListener("dragstart", e=>{
      // store the key and the src
      e.dataTransfer.setData("text/plain", key);
      e.dataTransfer.setData("src", src || "");
      e.dataTransfer.effectAllowed = "copy";
    });
    // touch support: we will simulate drag using clone on touchstart
    img.addEventListener("touchstart", function touchStart(ev){
      ev.preventDefault();
      const touch = ev.touches[0];
      const clone = img.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.pointerEvents = "none";
      clone.style.opacity = "0.9";
      clone.style.width = img.offsetWidth + "px";
      clone.style.height = img.offsetHeight + "px";
      clone.style.left = (touch.clientX - clone.width/2) + "px";
      clone.style.top = (touch.clientY - clone.height/2) + "px";
      document.body.appendChild(clone);

      function move(evm){
        const t = evm.touches[0];
        clone.style.left = (t.clientX - clone.width/2) + "px";
        clone.style.top = (t.clientY - clone.height/2) + "px";
      }
      function end(evm){
        const t = evm.changedTouches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if(el && el.classList.contains("slot")) {
          // simulate drop event object to handleDrop
          const fake = {
            preventDefault: ()=>{},
            currentTarget: el,
            dataTransfer: {
              getData: k => (k === "text/plain" ? key : (k === "src" ? src : ""))
            }
          };
          handleDrop(fake);
        }
        document.removeEventListener("touchmove", move);
        document.removeEventListener("touchend", end);
        clone.remove();
      }
      document.addEventListener("touchmove", move, { passive:false });
      document.addEventListener("touchend", end, { passive:false });
    }, { passive:false });

    return img;
  }

  // makeSlotDroppable for slot elements
  function makeSlotDroppable(slot){
    slot.classList.add("slot");
    slot.addEventListener("dragover", e=> e.preventDefault());
    slot.addEventListener("drop", handleDrop);
  }

  // ----------------------------
  // Paged level internal state (for current page)
  // We'll create an array pageWeatherKeys with up to 3 weather keys for the current page
  // and a map requiredMap: weatherKey -> { required: [clothingKeys], filled:Set() }
  // ----------------------------
  let pageWeatherKeys = [];
  let requiredMap = {}; // weatherKey => { required: [...], filled: Set() }

  // ----------------------------
  // handleDrop: used for BOTH gameBoard (levels 0-3) and paged layout (levels 4-5)
  // ----------------------------
  function handleDrop(e){
    e.preventDefault?.();
    const slot = e.currentTarget;
    const draggedKey = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src") || "";
    if(!draggedKey) return;

    // Distinguish modes: paged levels vs normal levels
    const info = levels[currentLevel];
    if(info.paged){
      // slot.dataset.weather = weatherKey; slot.dataset.slotIndex = idx
      const weatherKey = slot.dataset.weather;
      if(!weatherKey) return;
      const mapEntry = requiredMap[weatherKey];
      if(!mapEntry) return;

      // if slot already filled, reject
      if(slot.dataset.filled === "true") {
        showFeedback(false);
        return;
      }

      // If draggedKey is one of required and not already used for this weather -> accept
      if(mapEntry.required.includes(draggedKey) && !mapEntry.filled.has(draggedKey)){
        // accept
        slot.innerHTML = "";
        const img = document.createElement("img");
        // show the clothing's clipart or sign depending on level.rightMode (info.rightMode)
        const clothingObj = C[draggedKey];
        const srcToUse = (info.rightMode === "clipart" ? clothingObj.clipart : clothingObj.sign);
        img.src = src || srcToUse;
        img.style.width = "100%";
        img.style.height = "100%";
        slot.appendChild(img);
        slot.dataset.filled = "true";
        mapEntry.filled.add(draggedKey);

        // record attempt
        const pair = `${draggedKey}->${weatherKey}`;
        if(!levelAttempts[currentLevel].correct.has(pair)) levelAttempts[currentLevel].correct.add(pair);

        correctMatches++;
        showFeedback(true);
        updateScore();

        // After each successful placement, check if page completed (all slots filled)
        const totalSlots = document.querySelectorAll(`.paged-slot[data-page='${pageIndex}']`).length;
        const filledSlots = document.querySelectorAll(`.paged-slot[data-page='${pageIndex}'][data-filled='true'], .paged-slot[data-page='${pageIndex}'][data-filled='true']`).length;
        // We used slot.dataset.filled but also data-filled inconsistencies; rely on counting 'slot.dataset.filled'
        const allSlots = Array.from(document.querySelectorAll(`.paged-slot[data-page='${pageIndex}']`));
        const allFilled = allSlots.every(s => s.dataset.filled === "true");

        if(allFilled){
          // next page or next level
          pageIndex++;
          if(pageIndex >= pagesPerLevel){
            // level complete
            pageIndex = 0;
            currentLevel++;
            if(currentLevel >= levels.length){
              modal.style.display = "flex";
              endGame();
              return;
            } else {
              // reset and load new level
              saveProgress();
              setTimeout(loadPage, 700);
              return;
            }
          } else {
            // load next page of same level
            saveProgress();
            setTimeout(loadPage, 500);
            return;
          }
        }

      } else {
        // incorrect (either not required or already used)
        showFeedback(false);
        slot.classList.add("shake");
        setTimeout(()=>slot.classList.remove("shake"), 450);
        levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${weatherKey}`);
      }

    } else {
      // non-paged mode (levels 0-3): slot.dataset.key is the expected key
      const expected = slot.dataset.key;
      if(!expected) return;
      const ok = checkExactMatch(expected, draggedKey);
      if(ok){
        slot.innerHTML = "";
        const img = document.createElement("img");
        // if left/right mode etc - here use dragged item's clipart or sign if available
        const srcToUse = src || ((draggedKey in C) ? (C[draggedKey].clipart || C[draggedKey].sign) : (W[draggedKey]?.clipart || W[draggedKey]?.sign));
        img.src = srcToUse;
        img.style.width = "100%";
        img.style.height = "100%";
        slot.appendChild(img);
        slot.dataset.filled = "true";

        const pair = `${draggedKey}->${expected}`;
        if(!levelAttempts[currentLevel].correct.has(pair)) levelAttempts[currentLevel].correct.add(pair);

        correctMatches++;
        showFeedback(true);
        updateScore();

        // remove draggable copies with same key so they disappear (optional)
        document.querySelectorAll(`img.draggable[data-key='${draggedKey}']`).forEach(el=>el.remove());

        const totalSlots = document.querySelectorAll(".slot").length;
        const all = Array.from(document.querySelectorAll(".slot"));
        if(all.every(s=>s.dataset.filled === "true")){
          // next level
          currentLevel++;
          pageIndex = 0;
          if(currentLevel >= levels.length){
            modal.style.display = "flex";
            endGame();
            return;
          } else {
            saveProgress();
            setTimeout(loadPage, 600);
            return;
          }
        }
      } else {
        // incorrect
        showFeedback(false);
        slot.classList.add("shake");
        setTimeout(()=>slot.classList.remove("shake"),450);
        levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${expected}`);
      }
    }

    saveProgress();
  }

  // ----------------------------
  // Build paged level UI
  // ----------------------------
  function buildPagedUI(info){
    // info.leftPool = matchableWeather keys
    // Determine which 3 weather keys for this page
    const pool = info.leftPool.slice(); // array of weather keys
    // We want paging deterministic across runs, slice by pageIndex
    // If pool length <= itemsPerPage, then pagesPerLevel may be 1; but we still do two pages by repeating or shuffling
    // Simpler: shuffle pool once per level load, but to keep deterministic while navigating pages, we will shuffle per load.
    const shuffled = shuffle(pool);
    const start = pageIndex * itemsPerPage;
    let pageKeys = shuffled.slice(start, start + itemsPerPage);
    // if not enough items, wrap around from start
    if(pageKeys.length < itemsPerPage){
      pageKeys = pageKeys.concat(shuffled.slice(0, itemsPerPage - pageKeys.length));
    }

    pageWeatherKeys = pageKeys;
    requiredMap = {}; // reset

    // Left: show 3 weather visuals
    leftSigns.innerHTML = "";
    middleSlots.innerHTML = "";
    rightSigns.innerHTML = "";

    // Build requiredMap: for each weather choose 2 or 3 required clothing items (random subset of obviousClothing)
    pageWeatherKeys.forEach((wKey, wIndex) => {
      const wObj = W[wKey];
      if(!wObj) return;
      // choose nSlots = 2 if obviousClothing length <=3 else 3
      const poolCloth = (Array.isArray(wObj.obviousClothing) && wObj.obviousClothing.length>0) ? wObj.obviousClothing.slice() : [];
      const nSlots = poolCloth.length <= 3 ? 2 : 3;
      // choose unique random required items
      const required = shuffle(poolCloth).slice(0, Math.min(nSlots, poolCloth.length));
      requiredMap[wKey] = { required: required.slice(), filled: new Set() };

      // LEFT: weather image/sign
      const wEl = document.createElement("div");
      wEl.className = "paged-weather";
      wEl.style.width = "120px";
      wEl.style.height = "120px";
      wEl.style.margin = "8px";
      const img = document.createElement("img");
      img.src = (info.leftMode === "clipart") ? wObj.clipart : wObj.sign;
      img.style.width = "100%"; img.style.height = "100%";
      wEl.appendChild(img);
      leftSigns.appendChild(wEl);

      // MIDDLE: create slots for this weather vertically aligned
      // container for this weather's slots
      const midRow = document.createElement("div");
      midRow.className = "paged-midrow";
      midRow.style.display = "flex";
      midRow.style.gap = "8px";
      midRow.style.margin = "8px";
      // create one slot per required item
      required.forEach((cKey, idx) => {
        const slot = document.createElement("div");
        slot.className = "paged-slot slot";
        slot.dataset.weather = wKey;
        slot.dataset.expected = cKey; // for debugging; not used for matching since order doesn't matter
        slot.dataset.page = pageIndex;
        slot.style.width = "100px";
        slot.style.height = "100px";
        slot.style.border = "2px dashed #ccc";
        slot.style.background = "white";
        slot.style.display = "inline-flex";
        slot.style.alignItems = "center";
        slot.style.justifyContent = "center";
        slot.style.borderRadius = "8px";
        makeSlotDroppable(slot);
        midRow.appendChild(slot);
      });
      middleSlots.appendChild(midRow);
    });

    // RIGHT: build a 3x3 grid of draggable clothing
    // Compose a candidate list: ensure all required items are included at least once, then fill with decoys
    let candidates = [];
    // include all required items across the page
    Object.values(requiredMap).forEach(r => { candidates = candidates.concat(r.required); });
    // fill up to 9 unique candidates then allow duplicates if needed
    const uniqueCandidates = Array.from(new Set(candidates));
    const needed = 9 - uniqueCandidates.length;
    const decoyPool = shuffle(allClothing).filter(k => !uniqueCandidates.includes(k));
    const fill = decoyPool.slice(0, Math.max(0, needed));
    let finalList = uniqueCandidates.concat(fill);
    // if still less than 9, repeat some items (rare)
    while(finalList.length < 9){
      finalList.push(finalList[ finalList.length % uniqueCandidates.length ]);
    }
    finalList = shuffle(finalList).slice(0,9);

    // Render 3x3 grid
    const grid = document.createElement("div");
    grid.className = "paged-clothing-grid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(3, 1fr)";
    grid.style.gap = "8px";
    grid.style.margin = "8px";

    finalList.forEach(cKey => {
      const cObj = C[cKey];
      if(!cObj) return;
      const wrapper = document.createElement("div");
      wrapper.className = "drag-wrapper";
      wrapper.style.width = "100px"; wrapper.style.height = "100px";
      wrapper.style.display = "flex"; wrapper.style.alignItems = "center"; wrapper.style.justifyContent = "center";
      const img = createDraggableImage( (info.rightMode==="clipart" ? cObj.clipart : cObj.sign), cKey, "clothing" );
      // attach dataset so we can remove originals if needed
      img.dataset.key = cKey;
      wrapper.appendChild(img);
      grid.appendChild(wrapper);
    });

    rightSigns.appendChild(grid);
    correctMatches = 0;
  }

  // ----------------------------
  // Build non-paged gameBoard UI (levels 0-3)
  // This is more like your original engine: show up to 9 slots in a 3x3 board
  // ----------------------------
  function buildGameBoardUI(info){
    leftSigns.innerHTML = "";
    rightSigns.innerHTML = "";
    if(gameBoard) gameBoard.innerHTML = "";

    // choose up to 9 items for slots
    const pool = info.leftPool.slice();
    const chosen = shuffle(pool).slice(0, Math.min(9, pool.length));
    // build slots (targets)
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(3, 1fr)";
    grid.style.gap = "10px";
    grid.style.width = "min(60vw, 500px)";
    // For each chosen key create a slot with background image
    chosen.forEach(key => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.key = key;
      slot.style.width = "120px";
      slot.style.height = "120px";
      slot.style.backgroundSize = "contain";
      slot.style.backgroundPosition = "center";
      slot.style.backgroundRepeat = "no-repeat";
      const itemObj = (key in W) ? W[key] : C[key];
      const bg = (info.rightMode === "clipart") ? itemObj.clipart : itemObj.sign;
      slot.style.backgroundImage = `url('${bg}')`;
      makeSlotDroppable(slot);
      grid.appendChild(slot);
    });
    if(gameBoard) gameBoard.appendChild(grid);

    // draggables: put matching images (opposite media type) + decoys
    // create draggable list: include correct counterparts and some decoys
    let draggables = chosen.slice();
    // add decoys from pool
    const decoys = shuffle(info.rightPool).filter(k => !draggables.includes(k)).slice(0, Math.max(0, 9 - draggables.length));
    draggables = shuffle(draggables.concat(decoys)).slice(0,9);
    // render into leftSigns and rightSigns split
    const half = Math.ceil(draggables.length / 2);
    draggables.forEach((k, idx) => {
      const obj = (k in W) ? W[k] : C[k];
      const src = (info.leftMode === "clipart") ? obj.clipart : obj.sign;
      const img = createDraggableImage(src, k, (k in W) ? "weather" : "clothing");
      const wrapper = document.createElement("div");
      wrapper.className = "drag-wrapper";
      wrapper.style.width="120px"; wrapper.style.height="120px"; wrapper.style.margin="8px";
      wrapper.appendChild(img);
      if(idx < half) leftSigns.appendChild(wrapper);
      else rightSigns.appendChild(wrapper);
    });
    correctMatches = 0;
  }

  // ----------------------------
  // loadPage: choose which UI to build
  // ----------------------------
  function loadPage(){
    const info = levels[currentLevel];
    levelTitleEl.innerText = `Level ${currentLevel+1}: ${info.name}`;

    // clear all areas
    leftSigns.innerHTML = "";
    middleSlots.innerHTML = "";
    rightSigns.innerHTML = "";
    if(gameBoard) gameBoard.innerHTML = "";

    // if paged build paged UI
    if(info.paged){
      // ensure pageIndex valid
      pageIndex = clamp(pageIndex, 0, pagesPerLevel-1);
      buildPagedUI(info);
    } else {
      // non-paged
      buildGameBoardUI(info);
    }

    updateScore();
    saveProgress();
  }

  // ----------------------------
  // Modal/buttons
  // ----------------------------
  stopBtn.addEventListener("click", ()=>{
    const percent = updateScore();
    const elapsed = Math.round((Date.now() - startTime)/1000);
    const mins = Math.floor(elapsed/60), secs = elapsed % 60;
    scoreModalText.innerHTML = `Score: ${percent}%<br>Time: ${mins} mins ${secs} sec<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display = "flex";
  });
  continueBtn.addEventListener("click", ()=>{ modal.style.display = "none"; loadPage(); });
  againBtn.addEventListener("click", ()=>{ localStorage.removeItem(saveKey); location.reload(); });
  finishBtn.addEventListener("click", ()=>{ if(!gameEnded) endGame(); setTimeout(()=>window.location.href="../MatchingGame/hub.html",1200); });

  // ----------------------------
  // Google Form mapping & endGame
  // ----------------------------
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfP71M2M1SmaIzHVnsOSx4390iYgSxQy7Yo3NAPpbsR_Q7JaA/formResponse";
  const formEntries = { studentName:"entry.649726739", studentClass:"entry.2105926443", subject:"entry.1916287201",
    timeTaken:"entry.1743763592", percentage:"entry.393464832", currentLevel:"entry.1202549392",
    level1Correct:"entry.1933213595", level1Incorrect:"entry.2087978837",
    level2Correct:"entry.1160438650", level2Incorrect:"entry.2081595072",
    level3Correct:"entry.883075031", level3Incorrect:"entry.2093517837",
    level4Correct:"entry.498801806", level4Incorrect:"entry.754032840",
    level5Correct:"entry.1065703343", level5Incorrect:"entry.880100066",
    level6Correct:"entry.1360743630", level6Incorrect:"entry.112387671",
    totalCorrect:"entry.395384696", totalIncorrect:"entry.1357567724", errorsReviewed:"entry.11799771"
  };

  function endGame(){
    if(gameEnded) return;
    gameEnded = true;
    const end = Date.now();
    const elapsedSec = Math.round((end - startTime)/1000);
    const timeString = `${Math.floor(elapsedSec/60)} mins ${elapsedSec%60} sec`;
    const percent = updateScore();
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);

    const entries = {};
    entries[formEntries.studentName] = studentName;
    entries[formEntries.studentClass] = studentClass;
    entries[formEntries.subject] = "Weather";
    entries[formEntries.timeTaken] = timeString;
    entries[formEntries.percentage] = `${percent}%`;
    entries[formEntries.currentLevel] = `${Math.min(currentLevel+1, levels.length)}`;
    for(let i=0;i<6;i++){
      entries[formEntries[`level${i+1}Correct`]] = Array.from(levelAttempts[i].correct).join(",");
      entries[formEntries[`level${i+1}Incorrect`]] = (levelAttempts[i].incorrect || []).join(",");
    }
    entries[formEntries.totalCorrect] = `${totalCorrect}`;
    entries[formEntries.totalIncorrect] = `${totalIncorrect}`;
    entries[formEntries.errorsReviewed] = "";

    const form = document.createElement("form");
    form.action = formURL; form.method = "POST"; form.target = "hidden_iframe"; form.style.display = "none";

    for(const k in entries){
      const input = document.createElement("input"); input.type="hidden"; input.name=k; input.value=entries[k];
      form.appendChild(input);
    }
    document.body.appendChild(form); form.submit();

    scoreModalText.innerHTML = `Score: ${percent}%<br>Time: ${timeString}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display = "flex";
  }

  // ----------------------------
  // Init
  // ----------------------------
  restoreProgress();
  loadPage();
});
