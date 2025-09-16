document.addEventListener("DOMContentLoaded", function () {
  // ==== STUDENT INFO ====
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) return window.location.href = "../index.html";
  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  // ==== ELEMENTS ====
  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");
  const modal = document.getElementById("end-modal");
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const stopBtn = document.getElementById("stop-btn");
  const scoreDisplay = document.getElementById("score-display");
  const endModalContent = document.getElementById("end-modal-content");

  const allColours = ["red","blue","green","yellow","orange","purple","pink","brown","black","white"];
  const pagesPerLevel = 2;
  const levels = [
    { type: "signToImage", decoys: 3 },
    { type: "imageToSign", decoys: 3 },
    { type: "mixed", decoys: 3 },
    { type: "signToImage", decoys: 5 },
    { type: "imageToSign", decoys: 5 },
    { type: "mixed", decoys: 5 }
  ];
  const formEntryIDs = {
    correct: ["entry.1897227570","entry.1116300030","entry.187975538","entry.1880514176","entry.497882042","entry.1591755601"],
    incorrect: ["entry.1249394203","entry.1551220511","entry.903633326","entry.856597282","entry.552536101","entry.922308538"]
  };

  // ==== STATE ====
  let currentLevel = 0, currentPage = 0, currentColours = [];
  let levelAttempts = Array(levels.length).fill(null).map(() => ({ correct: new Set(), incorrect: [] }));
  let correctThisPage = 0, startTime = Date.now(), gamePaused = false;

  // ==== FEEDBACK ====
  const feedbackImage = document.createElement("img");
  feedbackImage.id = "feedbackImage";
  Object.assign(feedbackImage.style,{
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    width:"200px", display:"none", zIndex:"1000"
  });
  document.body.appendChild(feedbackImage);

  function showFeedback(correct){
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(()=>feedbackImage.style.display="none",1000);
  }

  function updateScore(){
    const totalCorrect = levelAttempts.reduce((sum,lvl)=>sum+lvl.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((sum,lvl)=>sum+lvl.incorrect.length,0);
    const percent = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect/(totalCorrect+totalIncorrect))*100) : 0;
    scoreDisplay.innerText = `Score: ${percent}%`;
  }

  // ==== SAVE / LOAD ====
  function saveProgress(){
    const savedData = {
      currentLevel, currentPage, currentColours,
      levelAttempts: levelAttempts.map(lvl=>({ correct:Array.from(lvl.correct), incorrect:lvl.incorrect })),
      startTime
    };
    localStorage.setItem("coloursSavedProgress", JSON.stringify(savedData));
  }

  function loadProgress(){
    const data = localStorage.getItem("coloursSavedProgress");
    if(!data) return;
    const parsed = JSON.parse(data);
    currentLevel = parsed.currentLevel;
    currentPage = parsed.currentPage;
    currentColours = parsed.currentColours;
    levelAttempts = parsed.levelAttempts.map(lvl=>({ correct:new Set(lvl.correct), incorrect:lvl.incorrect }));
    startTime = parsed.startTime;
  }

  function clearProgress(){ localStorage.removeItem("coloursSavedProgress"); }
  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

  // ==== DROP / TOUCH HANDLERS ====
function drop(e) {
  if(gamePaused) return;
  e.preventDefault();

  const colour = e.dataTransfer ? e.dataTransfer.getData("text/plain") : e.colour;
  const target = e.currentTarget;
  const expected = target.dataset.letter;

  if (colour === expected) {
    if (!levelAttempts[currentLevel].correct.has(colour)) {
      levelAttempts[currentLevel].correct.add(colour);
      correctThisPage++;

      // Determine overlay based on slot type
      const slotIsSign = target.style.backgroundImage.includes("sign-");
      const overlay = document.createElement("img");
      overlay.src = slotIsSign ? `assets/colours/clipart/${colour}.png` : `assets/colours/signs/sign-${colour}.png`;
      overlay.className = "overlay";
      Object.assign(overlay.style, {
        opacity: 0.5,
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none"
      });
      target.appendChild(overlay);

      // Remove draggable
      document.querySelectorAll(`img.draggable[data-letter='${colour}']`).forEach(el => el.remove());

      showFeedback(true);
      updateScore();

      if (correctThisPage >= document.querySelectorAll(".slot").length) {
        correctThisPage = 0;
        currentPage++;
        if (currentPage < pagesPerLevel) { saveProgress(); setTimeout(loadPage, 800); }
        else { currentLevel++; currentPage = 0; if(currentLevel >= levels.length){ clearProgress(); showEndModal(); } else { saveProgress(); setTimeout(loadPage,800); } }
      }
    }
  } else {
    levelAttempts[currentLevel].incorrect.push(colour);
    showFeedback(false);
    const wrong = document.querySelector(`img.draggable[data-letter='${colour}']`);
    if(wrong){ wrong.classList.add("shake"); setTimeout(()=>wrong.classList.remove("shake"),500);}
  }
}

  function touchStart(e){
    if(gamePaused) return;
    e.preventDefault();
    const target = e.target;
    const colour = target.dataset.letter;
    const src = target.src;

    const clone = target.cloneNode(true);
    Object.assign(clone.style,{position:"absolute",pointerEvents:"none",opacity:"0.7",zIndex:"10000"});
    document.body.appendChild(clone);

    const moveClone=touch=>{ clone.style.left=`${touch.clientX-clone.width/2}px`; clone.style.top=`${touch.clientY-clone.height/2}px`; };
    moveClone(e.touches[0]);

    const handleMove=ev=>moveClone(ev.touches[0]);
    const handleEnd=ev=>{
      const touch = ev.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if(el && el.classList.contains("slot")) drop({preventDefault:()=>{}, currentTarget:el, colour, src});
      document.removeEventListener("touchmove",handleMove);
      document.removeEventListener("touchend",handleEnd);
      clone.remove();
    };
    document.addEventListener("touchmove",handleMove,{passive:false});
    document.addEventListener("touchend",handleEnd,{passive:false});
  }

  // ==== PAGE LOADER ====
  function loadPage(){
    const { type:mode, decoys } = levels[currentLevel];
    gameBoard.innerHTML=""; leftSigns.innerHTML=""; rightSigns.innerHTML="";
    levelTitle.innerText = `Level ${currentLevel+1}: ` + 
      (mode==="signToImage"?"Match the Sign to the Picture":mode==="imageToSign"?"Match the Picture to the Sign":"Match Signs and Pictures (Mixed)");

    if(currentPage===0 && currentColours.length===0){
      const shuffled = shuffle([...allColours]);
      currentColours = [];
      for(let i=0;i<pagesPerLevel;i++) currentColours.push(shuffle(shuffled.slice(i*5,(i+1)*5)));
    }

    const pageColours = currentColours[currentPage];
    const usedSet = new Set(pageColours);

    pageColours.forEach(colour=>{
      const slot=document.createElement("div"); slot.className="slot"; slot.dataset.letter=colour;
      const showSign = mode==="imageToSign"||(mode==="mixed"&&Math.random()<0.5);
      slot.style.backgroundImage=`url('assets/colours/${showSign?`signs/sign-${colour}.png`:`clipart/${colour}.png`}')`;
      if(levelAttempts[currentLevel].correct.has(colour)){
        const overlay=document.createElement("img");
        overlay.src=`assets/colours/clipart/${colour}.png`;
        overlay.className="overlay"; slot.appendChild(overlay);
      }
      gameBoard.appendChild(slot);
    });

    const allDecoys = allColours.filter(c=>!usedSet.has(c));
    const decoyColours = shuffle(allDecoys).slice(0, decoys);
    const draggableColours = shuffle([...pageColours,...decoyColours]).filter(c=>!levelAttempts[currentLevel].correct.has(c));

    draggableColours.forEach((colour,i)=>{
      const img=document.createElement("img"); img.className="draggable"; img.draggable=true; img.dataset.letter=colour;
      const opposite = mode==="signToImage"||(mode==="mixed"&&!gameBoard.querySelector(`.slot[data-letter='${colour}']`)?.style.backgroundImage.includes("sign-"));
      img.src=`assets/colours/${opposite?`signs/sign-${colour}.png`:`clipart/${colour}.png`}`;
      img.addEventListener("dragstart",e=>{ e.dataTransfer.setData("text/plain",colour); e.dataTransfer.setData("src",img.src); });
      img.addEventListener("touchstart",touchStart);

      const wrap=document.createElement("div"); wrap.className="drag-wrapper"; wrap.appendChild(img);
      if(i<draggableColours.length/2) leftSigns.appendChild(wrap); else rightSigns.appendChild(wrap);
    });

    correctThisPage = pageColours.filter(c=>levelAttempts[currentLevel].correct.has(c)).length;
    updateScore();

    document.querySelectorAll(".slot").forEach(slot=>{
      slot.addEventListener("dragover",e=>e.preventDefault());
      slot.addEventListener("drop",drop);
    });
  }

  // ==== END MODAL ====
  function showEndModal(){
    gamePaused = true;
    endModalContent.innerHTML="";

    // Total score
    let totalCorrect=0, totalAttempts=0;
    for(let i=0;i<levels.length;i++){
      totalCorrect+=levelAttempts[i].correct.size;
      totalAttempts+=levelAttempts[i].correct.size+levelAttempts[i].incorrect.length;
    }
    const percent = totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0;

    const scoreP = document.createElement("p"); scoreP.innerText=`Score: ${percent}%`;
    endModalContent.appendChild(scoreP);

    // Time
    const timeTaken = Math.round((Date.now()-startTime)/1000);
    const minutes = Math.floor(timeTaken/60); const seconds = timeTaken%60;
    const timeP = document.createElement("p"); timeP.innerText=`Time: ${minutes} mins ${seconds} sec`;
    endModalContent.appendChild(timeP);

    modal.style.display="flex";
  }

  // ==== STOP / MODAL BUTTONS ====
  stopBtn.addEventListener("click", showEndModal);
  continueBtn.addEventListener("click",()=>{ modal.style.display="none"; gamePaused=false; });
  finishBtn.addEventListener("click",()=>{ modal.style.display="none"; submitGoogleForm(); });
  againBtn.addEventListener("click",()=>location.reload());

  function submitGoogleForm(){
    const form=document.createElement("form");
    form.method="POST"; form.action="https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.target="hidden_iframe"; form.style.display="none";

    if(!document.querySelector("iframe[name='hidden_iframe']")){
      const f=document.createElement("iframe"); f.name="hidden_iframe"; f.style.display="none"; document.body.appendChild(f);
    }

    const entries={
      "entry.1387461004": studentName,
      "entry.1309291707": studentClass,
      "entry.477642881": "Colours",
      "entry.1374858042": `${Math.floor((Date.now()-startTime)/60)} mins ${Math.floor((Date.now()-startTime)%60)} sec`
    };

    for(let i=0;i<levels.length;i++){
      entries[formEntryIDs.correct[i]] = Array.from(levelAttempts[i].correct).sort().join(", ");
      entries[formEntryIDs.incorrect[i]] = levelAttempts[i].incorrect.sort().map(c=>`*${c}*`).join(", ");
    }

    let totalCorrect=0, totalAttempts=0;
    for(let i=0;i<levels.length;i++){ totalCorrect+=levelAttempts[i].correct.size; totalAttempts+=levelAttempts[i].correct.size+levelAttempts[i].incorrect.length;}
    entries["entry.1996137354"]=`${totalAttempts>0?Math.round((totalCorrect/totalAttempts)*100):0}%`;

    for(const key in entries){ const input=document.createElement("input"); input.type="hidden"; input.name=key; input.value=entries[key]; form.appendChild(input);}
    document.body.appendChild(form); form.submit();
  }

  // ==== INIT ====
  if(localStorage.getItem("coloursSavedProgress")) loadProgress();
  loadPage();
});
