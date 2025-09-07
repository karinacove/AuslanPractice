// Balloon Pop — full working script with modal buttons

(() => {
  // --- LOGIN & STATE
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  const STATE_KEY = "balloonGameState_v1";
  const $ = (id) => document.getElementById(id);

  const defaultState = {
    score: 0,
    totalClicks: 0,
    correctAnswers: 0,
    correctAnswersList: [],
    incorrectAnswersList: [],
    level: 1,
    collectedCount: 0,
    targetColour: null,
    targetNumber: null
  };

  function saveState(state) { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
  function loadState() { try { return Object.assign({}, defaultState, JSON.parse(localStorage.getItem(STATE_KEY) || "{}")); } catch { return {...defaultState}; } }
  function clearGameState() { localStorage.removeItem(STATE_KEY); }

  let state = loadState();
  let balloonInterval = null, correctBalloonInterval = null;
  let floatSpeed = 30, consecutiveIncorrect = 0;
  const colours = ["green","red","orange","yellow","purple","pink","blue","brown","black","white"];
  const colourOffsets = {green:41,red:41,orange:43,yellow:42,purple:43,pink:44,blue:44,brown:42,black:44,white:43};

  document.addEventListener("DOMContentLoaded", () => {
    const studentInfoDiv = $("student-info");
    const gameContainer = $("game-container");
    const stopBtn = $("stop-btn");
    const endModal = $("end-modal");
    const scoreDisplayModal = $("score-display");
    const continueBtn = $("continue-btn");
    const finishBtn = $("finish-btn");
    const againBtn = $("again-btn");
    const logoutBtn = $("logout-btn");
    const balloonArea = $("balloon-area");
    const scoreDisplay = $("score");
    const levelDisplay = $("level");
    const thoughtBubble = $("thought-bubble");
    const background = $("background");
    const mrsC = $("mrs-c");

    if(!studentName || !studentClass){
      alert("Please log in first.");
      window.location.href="../index.html";
      return;
    }
    if(studentInfoDiv) studentInfoDiv.textContent=`Welcome, ${studentName} (${studentClass})`;
    if(gameContainer) gameContainer.style.display="block";

    // --- BUTTONS
    if(stopBtn) stopBtn.addEventListener("click",()=>{
      pauseGame();
      showModal();
      stopBtn.style.display="none";
    });

    if(continueBtn) continueBtn.addEventListener("click",()=>{
      if(endModal) endModal.style.display="none";
      if(stopBtn) stopBtn.style.display="block";
      startGame();
    });

    if(finishBtn) finishBtn.addEventListener("click",()=>{
      pauseGame();
      submitResults();
      showModal(true); // modal with final score
    });

    if(againBtn) againBtn.addEventListener("click",()=>{
      clearGameState();
      state = loadState();
      updateUIFromState();
      if(endModal) endModal.style.display="none";
      if(stopBtn) stopBtn.style.display="block";
      startGame();
    });

    if(logoutBtn) logoutBtn.addEventListener("click",()=>{
      localStorage.clear();
      window.location.href="../index.html";
    });

    // --- STATE & UI FUNCTIONS
    function updateUIFromState(){
      if(scoreDisplay) scoreDisplay.textContent=`Score: ${state.score}`;
      if(levelDisplay) levelDisplay.textContent=`Level: ${state.level}`;
      updateBackground();
    }

    function updateBackground(){
      if(!background) return;
      const bgIndex = Math.min(state.level,12);
      background.style.backgroundImage=`url('assets/background/background_${bgIndex}.png')`;
    }

    function updateFloatSpeed(){
      const lv = state.level;
      if([1,4,7,10].includes(lv)) floatSpeed=30;
      else if([2,5,8,11].includes(lv)) floatSpeed=20;
      else if([3,6,9,12].includes(lv)) floatSpeed=10;
    }

    function updateThoughtBubble(){
      state.targetColour = colours[Math.floor(Math.random()*colours.length)];
      const validNumbers = getValidNumbersForColour(state.targetColour)
        .filter(n=>getNumberRangeForLevel(state.level).includes(n));
      state.targetNumber = validNumbers[Math.floor(Math.random()*validNumbers.length)];
      if(!thoughtBubble) return;
      thoughtBubble.innerHTML="";
      const colourImg = document.createElement("img");
      colourImg.src=`assets/colour/${state.targetColour}.png`;
      colourImg.className="sign-img";
      colourImg.addEventListener("click",()=>playSignVideo(state.targetColour,"colour"));
      const numberImg = document.createElement("img");
      numberImg.src=`assets/number/${state.targetNumber}.png`;
      numberImg.className="sign-img";
      numberImg.addEventListener("click",()=>playSignVideo(state.targetNumber,"number"));
      thoughtBubble.appendChild(colourImg);
      thoughtBubble.appendChild(numberImg);
      saveState(state);
    }

    function playSignVideo(value,type){
      const video=document.createElement("video");
      video.src=`assets/${type}/${value}.mp4`;
      video.autoplay=true;
      video.controls=false;
      video.style.position="fixed";
      video.style.left="50%";
      video.style.top="50%";
      video.style.transform="translate(-50%,-50%)";
      video.style.zIndex=2000;
      video.addEventListener("ended",()=>video.remove());
      document.body.appendChild(video);
    }

    // --- GAME LOGIC
    function startGame(){
      pauseGame();
      updateFloatSpeed();
      if(!state.targetColour||!state.targetNumber) updateThoughtBubble();
      spawnBalloon();
      balloonInterval=setInterval(spawnBalloon,1000);
      correctBalloonInterval=setInterval(spawnCorrectBalloon,5000);
    }

    function pauseGame(){
      clearInterval(balloonInterval);
      clearInterval(correctBalloonInterval);
      balloonInterval=null;
      correctBalloonInterval=null;
    }

    function getNumberRangeForLevel(lv){
      if(lv>=1 && lv<=3) return Array.from({length:12},(_,i)=>i+1);
      if(lv>=4 && lv<=6) return Array.from({length:8},(_,i)=>i+13);
      if(lv>=7 && lv<=9) return Array.from({length:21},(_,i)=>i+20);
      if(lv>=10 && lv<=12) return Array.from({length:60},(_,i)=>i+41);
      return Array.from({length:100},(_,i)=>i+1);
    }

    function getValidNumbersForColour(colour){
      const base = Array.from({length:41},(_,i)=>i);
      const start = colourOffsets[colour];
      const extended = [];
      if(start) for(let n=start;n<=100;n+=4) extended.push(n);
      return base.concat(extended);
    }

    function spawnBalloon(){
      const colour=colours[Math.floor(Math.random()*colours.length)];
      const validNumbers=getValidNumbersForColour(colour).filter(n=>getNumberRangeForLevel(state.level).includes(n));
      if(validNumbers.length===0) return;
      const number=validNumbers[Math.floor(Math.random()*validNumbers.length)];
      createBalloon(colour,number,false);
    }

    function spawnCorrectBalloon(){
      if(!state.targetColour||!state.targetNumber) updateThoughtBubble();
      createBalloon(state.targetColour,state.targetNumber,true);
    }

    function createBalloon(colour,number,isCorrect){
      const img=document.createElement("img");
      img.src=`assets/balloon/${colour}_${number}.png`;
      img.className="balloon";
      img.dataset.colour=colour;
      img.dataset.number=number;
      img.dataset.correct=isCorrect?"true":"false";
      img.dataset.clicked="false";
      const gameWidth=window.innerWidth;
      const x=Math.random()*(gameWidth*0.75 - gameWidth*0.15-120) + gameWidth*0.15;
      img.style.left=`${x}px`;
      img.style.bottom="-150px";

      img.addEventListener("click",()=>{
        if(img.dataset.clicked==="true") return;
        img.dataset.clicked="true";
        state.totalClicks++;
        const answerKey=`${colour}_${number}`;
        if(colour===state.targetColour && number===Number(state.targetNumber)){
          state.score++;
          state.correctAnswers++;
          state.correctAnswersList.push(answerKey);
          state.collectedCount++;
          updateUIFromState();
          animateMrsC();
          updateThoughtBubble();
          if(state.score%10===0 && state.level<12){
            state.level++;
            state.collectedCount=0;
            clearAllFloating();
            updateBackground();
            updateFloatSpeed();
            setTimeout(()=>startGame(),300);
          } else if(state.score>=120){
            saveState(state);
            showModal(true);
          } else saveState(state);
        } else {
          state.incorrectAnswersList.push(answerKey);
          consecutiveIncorrect++;
          if(consecutiveIncorrect>=5){showCarefulWarning();consecutiveIncorrect=0;}
          img.remove();
          saveState(state);
        }
      });

      balloonArea.appendChild(img);
      floatBalloon(img);
    }

    function floatBalloon(balloon){
      let pos=-150;
      const interval=setInterval(()=>{
        pos+=2;
        balloon.style.bottom=`${pos}px`;
        if(pos>window.innerHeight+100){
          balloon.remove();
          clearInterval(interval);
        }
      },floatSpeed);
      balloon.dataset.floatInterval=interval;
    }

    function animateMrsC(){
      if(!mrsC) return;
      mrsC.style.transition="transform 0.25s ease";
      mrsC.style.transform="translateY(-8px)";
      setTimeout(()=>mrsC.style.transform="translateY(0)",300);
    }

    function clearAllFloating(){
      document.querySelectorAll(".balloon").forEach(b=>{
        try{clearInterval(b.dataset.floatInterval);}catch{}
        b.remove();
      });
    }

    function showCarefulWarning(){
      const img=document.createElement("img");
      img.src="assets/careful.png";
      img.className="careful-warning";
      img.style.position="fixed";
      img.style.left="50%";
      img.style.top="50%";
      img.style.transform="translate(-50%,-50%)";
      img.style.zIndex=1000;
      document.body.appendChild(img);
      setTimeout(()=>img.remove(),1500);
    }

    function submitResults(){
      const percentage=state.totalClicks>0?Math.round((state.correctAnswers/state.totalClicks)*100):0;
      const correctList=state.correctAnswersList.join(",");
      const incorrectList=state.incorrectAnswersList.join(",");

      const form=document.createElement("form");
      form.method="POST";
      form.action="https://docs.google.com/forms/d/e/1FAIpQLSeHCxQ4czHbx1Gdv649vlr5-Dz9-4DQu5M5OcIfC46WlL-6Qw/formResponse";
      form.target="hidden_iframe";
      form.style.display="none";

      const entries={
        'entry.1609572894':studentName,
        'entry.1168342531':studentClass,
        'entry.91913727':state.score,
        'entry.63569940':state.totalClicks,
        'entry.1746910343':correctList,
        'entry.1748975026':incorrectList
      };

      for(const k in entries){
        const input=document.createElement("input");
        input.type="hidden";
        input.name=k;
        input.value=entries[k];
        form.appendChild(input);
      }

      const iframe=document.createElement("iframe");
      iframe.name="hidden_iframe";
      iframe.style.display="none";
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    }

function showModal(final=false){
  const percentage = state.totalClicks > 0 ? Math.round((state.correctAnswers / state.totalClicks) * 100) : 0;
  if(scoreDisplayModal) scoreDisplayModal.textContent = `Score: ${state.score} (${percentage}%)`;
  
  // Show/hide Continue button
  if(continueBtn){
    if(final || state.score >= 120){
      continueBtn.style.display = "none"; // hide Continue if game ended
    } else {
      continueBtn.style.display = "inline-block"; // show Continue if game can continue
    }
  }
  
  if(stopBtn && final) stopBtn.style.display = "none"; // hide top-right stop if final
  
  if(endModal) endModal.style.display = "flex";
}


    // --- INITIALIZE
    updateUIFromState();
    startGame();
  });
})();
