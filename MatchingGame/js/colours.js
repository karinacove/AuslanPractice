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

  // ==== DATA ====
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
    correct: [
      "entry.1897227570","entry.1116300030","entry.187975538",
      "entry.1880514176","entry.497882042","entry.1591755601"
    ],
    incorrect: [
      "entry.1249394203","entry.1551220511","entry.903633326",
      "entry.856597282","entry.552536101","entry.922308538"
    ]
  };

  // ==== STATE ====
  let currentLevel = 0;
  let currentPage = 0;
  let currentColours = [];
  let correctThisPage = 0;
  let startTime = Date.now();
  let gamePaused = false;
  let gameEnded = false;

  let levelAttempts = Array(levels.length)
    .fill(null)
    .map(() => ({ correct: new Set(), incorrect: [] }));

  // ==== FEEDBACK ====
  const feedbackImage = document.createElement("img");
  Object.assign(feedbackImage.style,{
    position:"fixed",top:"50%",left:"50%",
    transform:"translate(-50%,-50%)",
    width:"200px",display:"none",zIndex:"1000"
  });
  document.body.appendChild(feedbackImage);

  const showFeedback = correct => {
    feedbackImage.src = correct ? "assets/correct.png" : "assets/wrong.png";
    feedbackImage.style.display = "block";
    setTimeout(()=>feedbackImage.style.display="none",800);
  };

  const updateScore = () => {
    const totalCorrect = levelAttempts.reduce((s,l)=>s+l.correct.size,0);
    const totalIncorrect = levelAttempts.reduce((s,l)=>s+l.incorrect.length,0);
    const percent = totalCorrect+totalIncorrect>0
      ? Math.round(totalCorrect/(totalCorrect+totalIncorrect)*100)
      : 0;
    scoreDisplay.innerText = `Score: ${percent}%`;
    return percent;
  };

  // ==== SAVE / LOAD ====
  const saveProgress = () => {
    localStorage.setItem("coloursSavedProgress", JSON.stringify({
      currentLevel,currentPage,currentColours,
      levelAttempts: levelAttempts.map(l=>({
        correct:Array.from(l.correct),
        incorrect:l.incorrect
      })),
      startTime
    }));
  };

  const loadProgress = () => {
    const data = JSON.parse(localStorage.getItem("coloursSavedProgress"));
    if(!data) return;

    currentLevel = data.currentLevel;
    currentPage = data.currentPage;
    currentColours = data.currentColours;
    startTime = data.startTime;

    data.levelAttempts.forEach((lvl,i)=>{
      levelAttempts[i].correct = new Set(lvl.correct);
      levelAttempts[i].incorrect = lvl.incorrect;
    });
  };

  const clearProgress = () => localStorage.removeItem("coloursSavedProgress");

  const shuffle = arr => arr.sort(()=>Math.random()-0.5);

  // ==== DROP ====
  const drop = e => {
    if(gamePaused) return;
    e.preventDefault();

    const colour = e.dataTransfer ? e.dataTransfer.getData("text/plain") : e.colour;
    const target = e.currentTarget;

    if(colour === target.dataset.letter){

      if(!levelAttempts[currentLevel].correct.has(colour)){
        levelAttempts[currentLevel].correct.add(colour);
        correctThisPage++;

        target.innerHTML="";
        const overlay=document.createElement("img");
        overlay.src = target.style.backgroundImage.includes("sign-")
          ? `assets/colours/clipart/${colour}.png`
          : `assets/colours/signs/sign-${colour}.png`;
        overlay.className="overlay";
        target.appendChild(overlay);

        document.querySelectorAll(`img[data-letter='${colour}']`).forEach(el=>el.remove());

        showFeedback(true);
        updateScore();

        if(correctThisPage >= document.querySelectorAll(".slot").length){
          correctThisPage=0;
          currentPage++;

          if(currentPage < pagesPerLevel){
            saveProgress();
            setTimeout(loadPage,800);
          } else {
            currentLevel++;
            currentPage=0;

            if(currentLevel >= levels.length){
              showEndModal(true);
              submitGoogleForm(); // ✅ FIX: auto submit
            } else {
              saveProgress();
              setTimeout(loadPage,800);
            }
          }
        }
      }

    } else {
      levelAttempts[currentLevel].incorrect.push(colour);
      showFeedback(false);
    }
  };

  // ==== TOUCH ====
  const touchStart = e => {
    if(gamePaused) return;

    const target = e.target;
    const colour = target.dataset.letter;

    const clone = target.cloneNode(true);
    Object.assign(clone.style,{
      position:"absolute",pointerEvents:"none",
      opacity:"0.7",zIndex:"10000"
    });

    document.body.appendChild(clone);

    const move = t=>{
      clone.style.left=`${t.clientX-clone.width/2}px`;
      clone.style.top=`${t.clientY-clone.height/2}px`;
    };

    move(e.touches[0]);

    const moveHandler = ev=>move(ev.touches[0]);
    const endHandler = ev=>{
      const touch=ev.changedTouches[0];
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      if(el && el.classList.contains("slot")){
        drop({preventDefault:()=>{},currentTarget:el,colour});
      }
      document.removeEventListener("touchmove",moveHandler);
      document.removeEventListener("touchend",endHandler);
      clone.remove();
    };

    document.addEventListener("touchmove",moveHandler,{passive:false});
    document.addEventListener("touchend",endHandler,{passive:false});
  };

  // ==== LOAD PAGE ====
  function loadPage(){
    const {type,decoys}=levels[currentLevel];

    gameBoard.innerHTML="";
    leftSigns.innerHTML="";
    rightSigns.innerHTML="";

    levelTitle.innerText=`Level ${currentLevel+1}`;

    if(currentPage===0 && currentColours.length===0){
      const shuffled=shuffle([...allColours]);
      currentColours=[];
      for(let i=0;i<pagesPerLevel;i++){
        currentColours.push(shuffle(shuffled.slice(i*5,(i+1)*5)));
      }
    }

    const pageColours=currentColours[currentPage];

    pageColours.forEach(colour=>{
      const slot=document.createElement("div");
      slot.className="slot";
      slot.dataset.letter=colour;

      const showSign = type==="imageToSign" || (type==="mixed" && Math.random()<0.5);
      slot.style.backgroundImage=`url('assets/colours/${showSign?`signs/sign-${colour}.png`:`clipart/${colour}.png`}')`;

      gameBoard.appendChild(slot);
    });

    const decoysList = shuffle(allColours.filter(c=>!pageColours.includes(c))).slice(0,decoys);
    const draggable = shuffle([...pageColours,...decoysList]);

    draggable.forEach((colour,i)=>{
      const img=document.createElement("img");
      img.className="draggable";
      img.draggable=true;
      img.dataset.letter=colour;

      img.src=`assets/colours/clipart/${colour}.png`;

      img.addEventListener("dragstart",e=>{
        e.dataTransfer.setData("text/plain",colour);
      });

      img.addEventListener("touchstart",touchStart);

      const wrap=document.createElement("div");
      wrap.className="drag-wrapper";
      wrap.appendChild(img);

      (i<draggable.length/2?leftSigns:rightSigns).appendChild(wrap);
    });

    correctThisPage=0;

    document.querySelectorAll(".slot").forEach(slot=>{
      slot.addEventListener("dragover",e=>e.preventDefault());
      slot.addEventListener("drop",drop);
    });

    updateScore();
  }

  // ==== MODAL ====
  function showEndModal(isFinished=false){
    gamePaused=true;
    modal.style.display="flex";
    continueBtn.style.display = isFinished ? "none" : "inline-block";
  }

  // ==== FORM SUBMIT ====
  function submitGoogleForm(){
    if(gameEnded) return;
    gameEnded=true;

    const percent = updateScore();
    const seconds=Math.floor((Date.now()-startTime)/1000);
    const formattedTime=`${Math.floor(seconds/60)} mins ${seconds%60} sec`;

    const currentPosition = `Level ${currentLevel+1} Page ${currentPage+1}`;

    if(!document.querySelector("iframe[name='hidden_iframe']")){
      const iframe=document.createElement("iframe");
      iframe.name="hidden_iframe";
      iframe.style.display="none";
      document.body.appendChild(iframe);
    }

    const form=document.createElement("form");
    form.method="POST";
    form.action="https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse";
    form.target="hidden_iframe";
    form.style.display="none";

    const entries={
      "entry.1387461004":studentName,
      "entry.1309291707":studentClass,
      "entry.477642881":"Colours",
      "entry.1374858042":formattedTime,
      "entry.1996137354":`${percent}%`,
      "entry.750436458":currentPosition
    };

    for(let i=0;i<levels.length;i++){
      entries[formEntryIDs.correct[i]] =
        Array.from(levelAttempts[i].correct).join(",");

      entries[formEntryIDs.incorrect[i]] =
        levelAttempts[i].incorrect.join(",");
    }

    for(const key in entries){
      const input=document.createElement("input");
      input.type="hidden";
      input.name=key;
      input.value=entries[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  // ==== BUTTONS ====
  stopBtn.onclick = ()=>showEndModal(false);
  continueBtn.onclick = ()=>{
    modal.style.display="none";
    gamePaused=false;
  };

  finishBtn.onclick = ()=>{
    submitGoogleForm();
    clearProgress();
    setTimeout(()=>window.location.href="../MatchingGame/hub.html",1000);
  };

  againBtn.onclick = ()=>location.reload();

  // ==== INIT ====
  if(localStorage.getItem("coloursSavedProgress")) loadProgress();
  loadPage();

});
