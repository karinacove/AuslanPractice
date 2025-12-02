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
  // DOM refs
  // ----------------------------
  const ensureEl = (id, createTag = "div", createClass = "") => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(createTag);
      if (createClass) el.className = createClass;
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
  const gameBoard = document.getElementById("gameBoard") || null;
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
  let submitted = false;

  const levelAttempts = Array(6).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));

  let pageIndex = 0;
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
    { key:"clothes", clipart:"assets/clothing/clipart/clothes.png", sign:"assets/clothing/signs/clothes.png", primaryWeather:"weather" }
  ];

  const W = Object.fromEntries(weatherItems.map(w => [w.key, w]));
  const C = Object.fromEntries(clothingItems.map(c => [c.key, c]));
  const allWeather = weatherItems.map(w => w.key);
  const matchableWeather = weatherItems.filter(w => Array.isArray(w.obviousClothing) && w.obviousClothing.length>0).map(w=>w.key);
  const allClothing = clothingItems.map(c=>c.key);

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
  const clamp = (n,min,max) => Math.max(min, Math.min(max,n));

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
  // Drag & Drop helpers
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
      e.dataTransfer.setData("text/plain", key);
      e.dataTransfer.setData("src", src || "");
      e.dataTransfer.effectAllowed = "copy";
    });
    return img;
  }

  function makeSlotDroppable(slot){
    slot.classList.add("slot");
    slot.addEventListener("dragover", e=> e.preventDefault());
    slot.addEventListener("drop", handleDrop);
  }

  // ----------------------------
  // Paged UI state
  // ----------------------------
  let pageWeatherKeys = [];
  let requiredMap = {};

  // ----------------------------
  // handleDrop: universal
  // ----------------------------
  function handleDrop(e){
    e.preventDefault?.();
    const slot = e.currentTarget;
    const draggedKey = e.dataTransfer.getData("text/plain");
    const src = e.dataTransfer.getData("src") || "";
    if(!draggedKey) return;

    const info = levels[currentLevel];

    if(info.paged){
      const weatherKey = slot.dataset.weather;
      if(!weatherKey) return;
      const mapEntry = requiredMap[weatherKey];
      if(!mapEntry) return;
      if(slot.dataset.filled === "true"){ showFeedback(false); return; }

      if(mapEntry.required.includes(draggedKey) && !mapEntry.filled.has(draggedKey)){
        slot.innerHTML = "";
        const img = document.createElement("img");
        const clothingObj = C[draggedKey];
        const srcToUse = (info.rightMode === "clipart" ? clothingObj.clipart : clothingObj.sign);
        img.src = src || srcToUse;
        img.style.width = "100%";
        img.style.height = "100%";
        slot.appendChild(img);
        slot.dataset.filled = "true";
        mapEntry.filled.add(draggedKey);
        levelAttempts[currentLevel].correct.add(`${draggedKey}->${weatherKey}`);
        correctMatches++;
        showFeedback(true);
        updateScore();

        const allSlots = Array.from(document.querySelectorAll(`.paged-slot[data-page='${pageIndex}']`));
        const allFilled = allSlots.every(s => s.dataset.filled === "true");
        if(allFilled){
          pageIndex++;
          if(pageIndex >= pagesPerLevel){
            pageIndex=0; currentLevel++;
            if(currentLevel >= levels.length){ modal.style.display="flex"; endGame(); return; }
            else{ saveProgress(); setTimeout(loadPage,700); return; }
          } else { saveProgress(); setTimeout(loadPage,500); return; }
        }
      } else {
        showFeedback(false);
        slot.classList.add("shake");
        setTimeout(()=>slot.classList.remove("shake"),450);
        levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${weatherKey}`);
      }
    } else {
      const expected = slot.dataset.key;
      if(!expected) return;
      const ok = expected === draggedKey;
      if(ok){
        slot.innerHTML="";
        const img = document.createElement("img");
        const srcToUse = src || ((draggedKey in C) ? (C[draggedKey].clipart || C[draggedKey].sign) : (W[draggedKey]?.clipart || W[draggedKey]?.sign));
        img.src = srcToUse; img.style.width="100%"; img.style.height="100%";
        slot.appendChild(img);
        slot.dataset.filled="true";
        levelAttempts[currentLevel].correct.add(`${draggedKey}->${expected}`);
        correctMatches++;
        showFeedback(true);
        updateScore();
        document.querySelectorAll(`img.draggable[data-key='${draggedKey}']`).forEach(el=>el.remove());
        const allSlots = Array.from(document.querySelectorAll(".slot"));
        if(allSlots.every(s=>s.dataset.filled==="true")){
          currentLevel++; pageIndex=0;
          if(currentLevel>=levels.length){ modal.style.display="flex"; endGame(); return; }
          else{ saveProgress(); setTimeout(loadPage,600); return; }
        }
      } else {
        showFeedback(false);
        slot.classList.add("shake");
        setTimeout(()=>slot.classList.remove("shake"),450);
        levelAttempts[currentLevel].incorrect.push(`${draggedKey}->${expected}`);
      }
    }
    saveProgress();
  }

  // ----------------------------
  // Build paged UI
  // ----------------------------
  function buildPagedUI(info){
    const pool = info.leftPool.slice();
    const shuffled = shuffle(pool);
    let pageKeys = shuffled.slice(pageIndex*itemsPerPage, pageIndex*itemsPerPage+itemsPerPage);
    if(pageKeys.length<itemsPerPage) pageKeys=pageKeys.concat(shuffle(pool).slice(0, itemsPerPage-pageKeys.length));

    pageWeatherKeys = pageKeys;
    requiredMap = {};
    leftSigns.innerHTML=""; middleSlots.innerHTML=""; rightSigns.innerHTML="";

    pageWeatherKeys.forEach((wKey,wIndex)=>{
      const wObj = W[wKey];
      if(!wObj) return;
      const poolCloth = Array.isArray(wObj.obviousClothing) ? wObj.obviousClothing.slice() : [];
      const nSlots = poolCloth.length<=3?2:3;
      const required = shuffle(poolCloth).slice(0,Math.min(nSlots,poolCloth.length));
      requiredMap[wKey]={required:required.slice(), filled:new Set()};

      // Left
      const wEl=document.createElement("div"); wEl.className="paged-weather"; wEl.style.width="120px"; wEl.style.height="120px"; wEl.style.margin="8px";
      const img=document.createElement("img"); img.src=(info.leftMode==="clipart")?wObj.clipart:wObj.sign; img.style.width="100%"; img.style.height="100%";
      wEl.appendChild(img); leftSigns.appendChild(wEl);

      // Middle slots
      const midRow=document.createElement("div"); midRow.className="paged-midrow"; midRow.style.display="flex"; midRow.style.gap="8px"; midRow.style.margin="8px";
      required.forEach(cKey=>{
        const slot=document.createElement("div"); slot.className="paged-slot slot"; slot.dataset.weather=wKey; slot.dataset.page=pageIndex; slot.dataset.expected=cKey;
        slot.style.width="100px"; slot.style.height="100px"; slot.style.border="2px dashed #ccc"; slot.style.background="white"; slot.style.display="inline-flex"; slot.style.alignItems="center"; slot.style.justifyContent="center"; slot.style.borderRadius="8px";
        makeSlotDroppable(slot); midRow.appendChild(slot);
      });
      middleSlots.appendChild(midRow);
    });

    // Right: 12 items including all required + decoys
    let candidates=[]; Object.values(requiredMap).forEach(r=>candidates=candidates.concat(r.required));
    let uniqueCandidates=Array.from(new Set(candidates));
    const needed=12-uniqueCandidates.length;
    const decoys=shuffle(allClothing).filter(k=>!uniqueCandidates.includes(k)).slice(0,needed);
    let finalList=shuffle(uniqueCandidates.concat(decoys));
    const grid=document.createElement("div"); grid.className="paged-clothing-grid"; grid.style.display="grid"; grid.style.gridTemplateColumns="repeat(4,1fr)"; grid.style.gap="8px"; grid.style.margin="8px";
    finalList.forEach(cKey=>{
      const cObj=C[cKey]; if(!cObj) return;
      const wrapper=document.createElement("div"); wrapper.className="drag-wrapper"; wrapper.style.width="100px"; wrapper.style.height="100px"; wrapper.style.display="flex"; wrapper.style.alignItems="center"; wrapper.style.justifyContent="center";
      const img=createDraggableImage((info.rightMode==="clipart"?cObj.clipart:cObj.sign), cKey, "clothing"); img.dataset.key=cKey;
      wrapper.appendChild(img); grid.appendChild(wrapper);
    });
    rightSigns.appendChild(grid);
    correctMatches=0;
  }

  // ----------------------------
  // Non-paged UI
  // ----------------------------
  function buildGameBoardUI(info){
    leftSigns.innerHTML=""; rightSigns.innerHTML=""; if(gameBoard) gameBoard.innerHTML="";
    const pool=info.leftPool.slice(); const chosen=shuffle(pool).slice(0,Math.min(9,pool.length));
    const grid=document.createElement("div"); grid.style.display="grid"; grid.style.gridTemplateColumns="repeat(3,1fr)"; grid.style.gap="10px"; grid.style.width="min(60vw,500px)";
    chosen.forEach(key=>{
      const slot=document.createElement("div"); slot.className="slot"; slot.dataset.key=key; slot.style.width="120px"; slot.style.height="120px"; slot.style.backgroundSize="contain"; slot.style.backgroundPosition="center"; slot.style.backgroundRepeat="no-repeat";
      const itemObj=(key in W)?W[key]:C[key]; const bg=(info.rightMode==="clipart")?itemObj.clipart:itemObj.sign; slot.style.backgroundImage=`url('${bg}')`;
      makeSlotDroppable(slot); grid.appendChild(slot);
    });
    if(gameBoard) gameBoard.appendChild(grid);

    let draggables=chosen.slice(); const decoys=shuffle(info.rightPool).filter(k=>!draggables.includes(k)).slice(0,Math.max(0,9-draggables.length));
    draggables=shuffle(draggables.concat(decoys)).slice(0,9);
    const half=Math.ceil(draggables.length/2);
    draggables.forEach((k,idx)=>{
      const obj=(k in W)?W[k]:C[k]; const src=(info.leftMode==="clipart")?obj.clipart:obj.sign;
      const img=createDraggableImage(src,k,(k in W)?"weather":"clothing");
      const wrapper=document.createElement("div"); wrapper.className="drag-wrapper"; wrapper.style.width="120px"; wrapper.style.height="120px"; wrapper.style.margin="8px"; wrapper.appendChild(img);
      if(idx<half) leftSigns.appendChild(wrapper); else rightSigns.appendChild(wrapper);
    });
    correctMatches=0;
  }

  // ----------------------------
  // loadPage
  // ----------------------------
  function loadPage(){
    const info=levels[currentLevel]; levelTitleEl.innerText=`Level ${currentLevel+1}: ${info.name}`;
    leftSigns.innerHTML=""; middleSlots.innerHTML=""; rightSigns.innerHTML=""; if(gameBoard) gameBoard.innerHTML="";
    if(info.paged){ pageIndex=clamp(pageIndex,0,pagesPerLevel-1); buildPagedUI(info); }
    else buildGameBoardUI(info);
    updateScore(); saveProgress();
  }

  // ----------------------------
  // Buttons
  // ----------------------------
  stopBtn.addEventListener("click", ()=>{
    const percent=updateScore(); const elapsed=Math.round((Date.now()-startTime)/1000);
    const mins=Math.floor(elapsed/60), secs=elapsed%60;
    scoreModalText.innerHTML=`Score: ${percent}%<br>Time: ${mins} mins ${secs} sec<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display="flex";
  });
  continueBtn.addEventListener("click", ()=>{ modal.style.display="none"; loadPage(); });
  againBtn.addEventListener("click", ()=>{ localStorage.removeItem(saveKey); location.reload(); });
if(finishBtn){
  finishBtn.addEventListener("click", ()=>{
    if(!gameEnded){
      endGame();
      submitted = true;
    }
  });
} else {
  console.warn("Finish button not found in DOM!");
}

  // ----------------------------
  // Google Form
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
    if(gameEnded) return; gameEnded=true;
    const end=Date.now(); const elapsedSec=Math.round((end-startTime)/1000);
    const timeString=`${Math.floor(elapsedSec/60)} mins ${elapsedSec%60} sec`;
    const percent=updateScore();
    const totalCorrect=levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect=levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);

    if(!document.querySelector("iframe[name='hidden_iframe']")){
      const iframe=document.createElement("iframe"); iframe.name="hidden_iframe"; iframe.style.display="none"; document.body.appendChild(iframe);
    }

    const entries={};
    entries[formEntries.studentName]=studentName; entries[formEntries.studentClass]=studentClass; entries[formEntries.subject]="Weather";
    entries[formEntries.timeTaken]=timeString; entries[formEntries.percentage]=`${percent}%`;
    entries[formEntries.currentLevel]=`${Math.min(currentLevel+1,levels.length)}`;
    for(let i=0;i<6;i++){
      entries[formEntries[`level${i+1}Correct`]]=Array.from(levelAttempts[i].correct).join(",");
      entries[formEntries[`level${i+1}Incorrect`]]=(levelAttempts[i].incorrect||[]).join(",");
    }
    entries[formEntries.totalCorrect]=`${totalCorrect}`; entries[formEntries.totalIncorrect]=`${totalIncorrect}`;
    entries[formEntries.errorsReviewed]="";

    const form=document.createElement("form"); form.action=formURL; form.method="POST"; form.target="hidden_iframe"; form.style.display="none";
    for(const k in entries){ const input=document.createElement("input"); input.type="hidden"; input.name=k; input.value=entries[k]; form.appendChild(input); }
    document.body.appendChild(form); form.submit();

    scoreModalText.innerHTML=`Score: ${percent}%<br>Time: ${timeString}<br><img src="assets/auslan-clap.gif" width="150">`;
    modal.style.display="flex";
  }

  restoreProgress(); loadPage();
});
