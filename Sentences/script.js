/* ===== CONFIG ===== */
const UPLOAD_ENDPOINT = ""; // Optional upload endpoint

const FORM_FIELD_MAP = {
  name: "entry.1040637824",
  class: "entry.1755746645",
  subject: "entry.1979136660",
  timeTaken: "entry.120322685",
  percent: "entry.1519181393",
  level1: { correct: "entry.1150173566", incorrect: "entry.28043347" },
  level2: { correct: "entry.1424808967", incorrect: "entry.352093752" },
  level3: { correct: "entry.475324608", incorrect: "entry.1767451434" },
  level4: { correct: "entry.1405337882", incorrect: "entry.1513946929" },
  level5: { correct: "entry.level5_correct", incorrect: "entry.level5_incorrect" },
  level6: { correct: "entry.level6_correct", incorrect: "entry.level6_incorrect" },
  level7: { correct: "entry.level7_correct", incorrect: "entry.level7_incorrect" },
  level8: { correct: "entry.level8_correct", incorrect: "entry.level8_incorrect" },
  level9: { correct: "entry.level9_correct", incorrect: "entry.level9_incorrect" },
  level10: { correct: "entry.level10_correct", incorrect: "entry.level10_incorrect" },
  videoField: "entry.116543611"
};

/* ===== DOM & Student Info ===== */
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");
const stopBtn = document.getElementById("stopBtn");
const sentenceDiv = document.getElementById("sentence");
const imageDiv = document.getElementById("questionImage");
const answerArea = document.getElementById("answerArea");
const draggableOptions = document.getElementById("draggables");
const feedbackDiv = document.getElementById("feedback");
const checkBtn = document.getElementById("checkBtn");
const againBtn = document.getElementById("againBtn");
const googleForm = document.getElementById("googleForm");

/* ===== SCORE ===== */
const scoreDisplay = document.createElement("div");
if(studentNameSpan.parentNode) studentNameSpan.parentNode.appendChild(scoreDisplay);
let score = 0;

/* ===== INIT STUDENT INFO ===== */
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;
  if (document.getElementById("formName")) document.getElementById("formName").value = studentName;
  if (document.getElementById("formClass")) document.getElementById("formClass").value = studentClass;
  scoreDisplay.textContent = `Score: ${score}`;
}

/* ===== GAME VARIABLES ===== */
let currentLevel = 1;
let roundInLevel = 0;
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let expectedDrops = [];
let mode = "image";
let startTime = null;

/* ===== VOCABULARY & DECOY POOLS ===== */
const animals = ["dog","cat","mouse","bird","fish","rabbit","cow","sheep","horse","pig"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const foods = ["apple","banana","pear","grape","orange","strawberry","watermelon","bread","cake","pizza"];
const colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];
const verbsBasic = ["want"];
const verbsAll = ["want","eat","like","have","see"];
const helperSigns = ["i","see","what"];
const allAnimals = [...animals];
const allNumbers = [...numbers];
const allFoods = [...foods];
const allColours = [...colours];
const allAnimalNumberCombos = []; animals.forEach(a => numbers.forEach(n => allAnimalNumberCombos.push(`${a}-${n}`)));
const allFoodColourCombos = []; foods.forEach(f => colours.forEach(c => allFoodColourCombos.push(`${f}-${c}`)));
const allPairCombos = [...allAnimalNumberCombos,...allFoodColourCombos];
const allVideoSigns = Array.from(new Set([...animals,...foods,...colours,...numbers,...verbsAll]));

/* ===== HELPERS ===== */
function shuffleArray(arr) { const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function signPathFor(word){ if(animals.includes(word)) return `assets/signs/animals/${word}-sign.png`; if(numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`; if(foods.includes(word)) return `assets/signs/food/${word}-sign.png`; if(colours.includes(word)) return `assets/signs/colours/${word}-sign.png`; if(verbsAll.includes(word)) return `assets/signs/verbs/${word}-sign.png`; if(helperSigns.includes(word)) return `assets/signs/helpers/${word}.png`; return null; }
function compositeImagePath(combo){ return `assets/images/${combo}.png`; }
function addDecoys(items,pool,totalCount){ const result=[...items]; const needed=totalCount-result.length; if(needed<=0) return shuffleArray(result); const available=pool.filter(x=>!result.includes(x)); result.push(...shuffleArray(available).slice(0,needed)); return shuffleArray(result); }

/* ===== SENTENCE GENERATION ===== */
function generateSentenceForLevel(level){
  const animal=randomItem(animals); const number=randomItem(numbers);
  const food=randomItem(foods); const colour=randomItem(colours);
  const verbs=(level<=5)?verbsBasic:verbsAll; const verb=randomItem(verbs);
  if(level===5){
    const sampleVideos=[
      {video:"level5_q1.mp4",videoSigns:["dog","cat","bird"]},
      {video:"level5_q2.mp4",videoSigns:["apple","banana","pear"]},
      {video:"level5_q3.mp4",videoSigns:["one","two","three"]},
      {video:"level5_q4.mp4",videoSigns:["red","blue","pink"]},
      {video:"level5_q5.mp4",videoSigns:["want","eat","have"]}
    ];
    const pick=randomItem(sampleVideos);
    currentSentence={animal,number,verb,food,colour,video:pick.video,videoSigns:pick.videoSigns.slice()};
    return currentSentence;
  }
  currentSentence={animal,number,verb,food,colour};
  return currentSentence;
}

/* ===== EXPECTED COMPONENTS ===== */
function expectedComponentsFor(level,mode){
  if(mode==="image"){ if(level===1) return ['animal-number']; if(level===2) return ['food-colour']; return ['animal-number','food-colour']; }
  if(mode==="sign"){ if(level===1) return ['i','see','what','animal','number']; if(level===2) return ['food','colour']; return ['i','see','what','animal','number','verb','food','colour']; }
  return [];
}

/* ===== UI HELPERS ===== */
function clearUI(){ sentenceDiv.textContent=""; imageDiv.innerHTML=""; answerArea.innerHTML=""; draggableOptions.innerHTML=""; feedbackDiv.innerHTML=""; if(checkBtn) checkBtn.style.display="none"; if(againBtn) againBtn.style.display="none"; }

/* ===== BUILD PROMPTS ===== */
function buildPromptForCurrentQuestion(){
  imageDiv.innerHTML="";
  if(currentLevel<=4){
    const combos=[];
    if(currentLevel===1) combos.push(`${currentSentence.animal}-${currentSentence.number}`);
    else if(currentLevel===2) combos.push(`${currentSentence.food}-${currentSentence.colour}`);
    else combos.push(`${currentSentence.animal}-${currentSentence.number}`,`${currentSentence.food}-${currentSentence.colour}`);
    combos.forEach(c=>{const img=document.createElement("img"); img.src=compositeImagePath(c); img.alt=c; img.className="promptImage"; imageDiv.appendChild(img);});
  } else if(currentLevel===5 && currentSentence.video){
    const vid=document.createElement("video"); vid.controls=true; vid.width=320;
    const src=document.createElement("source"); src.src=`assets/videos/${currentSentence.video}`; src.type="video/mp4";
    vid.appendChild(src); imageDiv.appendChild(vid);
  }
}

/* ===== DROPZONES ===== */
function buildAnswerDropzones(){
  answerArea.innerHTML="";
  let dropCount = expectedDrops.length || 2; // default

  // Level 5 (video) always has 3 dropzones
  if(currentLevel===5) dropCount = 3;

  for(let i=0;i<dropCount;i++){
    const dz=document.createElement("div");
    dz.className="dropzone";
    dz.dataset.filled="";
    dz.addEventListener("dragover", e=>e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    answerArea.appendChild(dz);
  }

  if(againBtn) againBtn.style.display="none";
  if(checkBtn) checkBtn.style.display="none";
}

/* ===== DROP HANDLER ===== */
function dropHandler(e){
  e.preventDefault();
  const dz=e.currentTarget;
  if(dz.childElementCount>0) return;
  const value=e.dataTransfer.getData("text/plain");
  const img=document.createElement("img"); img.className="droppedImage"; img.alt=value; img.src=value.includes("-")?compositeImagePath(value):signPathFor(value)||"";
  dz.appendChild(img); dz.dataset.filled=value;
  if(againBtn && againBtn.style.display==="none") againBtn.style.display="inline-block";
  const allFilled=Array.from(answerArea.querySelectorAll(".dropzone")).every(d=>d.dataset.filled && d.dataset.filled.length>0);
  if(checkBtn) checkBtn.style.display=allFilled?"inline-block":"none";
}

/* ===== DRAGGABLES ===== */
function buildDraggablesForCurrentQuestion(){
  draggableOptions.innerHTML="";
  let items=[]; const signsDraggable=roundInLevel%2===0;
  if(currentLevel===1) items=signsDraggable?addDecoys([currentSentence.animal,currentSentence.number],[...allAnimals,...allNumbers],10):addDecoys([`${currentSentence.animal}-${currentSentence.number}`],allAnimalNumberCombos,8);
  else if(currentLevel===2) items=signsDraggable?addDecoys([currentSentence.food,currentSentence.colour],[...allFoods,...allColours],10):addDecoys([`${currentSentence.food}-${currentSentence.colour}`],allFoodColourCombos,8);
  else if(currentLevel===3||currentLevel===4) items=signsDraggable?addDecoys([currentSentence.animal,currentSentence.number,currentSentence.food,currentSentence.colour],[...allAnimals,...allNumbers,...allFoods,...allColours],12):addDecoys([`${currentSentence.animal}-${currentSentence.number}`,`${currentSentence.food}-${currentSentence.colour}`],allPairCombos,8);
  else if(currentLevel===5) items=Array.isArray(currentSentence.videoSigns)?addDecoys(currentSentence.videoSigns.slice(),allVideoSigns,8):[];
  shuffleArray(items).forEach(word=>{
    const div=document.createElement("div"); div.className="draggable"; div.draggable=true; div.dataset.value=word;
    const img=document.createElement("img"); img.alt=word; img.className="draggableImage"; img.src=word.includes("-")?compositeImagePath(word):signPathFor(word)||""; div.appendChild(img);
    div.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",word)); draggableOptions.appendChild(div);
  });
}

/* ===== FEEDBACK ===== */
function showFeedback(type){ feedbackDiv.innerHTML=`<img src="assets/${type}.png" alt="${type}">`; setTimeout(()=>{feedbackDiv.innerHTML="";},2000); }

/* ===== BUILD QUESTION ===== */
function buildQuestion(resetDraggables=true){
  clearUI();
  if(resetDraggables) generateSentenceForLevel(currentLevel);
  mode=(roundInLevel%2===0)?"sign":"image";
  expectedDrops=expectedComponentsFor(currentLevel,mode);
  buildPromptForCurrentQuestion();
  buildAnswerDropzones();
  if(resetDraggables) buildDraggablesForCurrentQuestion();
}

/* ===== GAME FLOW ===== */
function nextRound(){ roundInLevel++; if(roundInLevel>=10) endLevel(); else buildQuestion(); }
function endLevel(){ currentLevel++; if(currentLevel>6) endGame(); else { roundInLevel=0; buildQuestion(); } }

/* ===== END GAME ===== */
async function endGame(){
  const timeTaken=Math.round((Date.now()-startTime)/1000);
  const formData=new FormData();
  formData.append(FORM_FIELD_MAP.name,studentName);
  formData.append(FORM_FIELD_MAP.class,studentClass);
  formData.append(FORM_FIELD_MAP.subject,"Sentences");
  formData.append(FORM_FIELD_MAP.timeTaken,timeTaken);
  formData.append(FORM_FIELD_MAP.percent,Math.round((correctCount/(correctCount+incorrectCount))*100));
  try{ await fetch(googleForm.action,{method:"POST",body:formData,mode:"no-cors"});} catch(err){console.warn("Google Form submit failed:",err);}
  alert(`Well done! You finished the game.\nScore: ${correctCount}/${correctCount+incorrectCount}\nTime: ${timeTaken}s`);
  window.location.href="../hub.html";
}

/* ===== BUTTON EVENTS ===== */
if(checkBtn) checkBtn.addEventListener("click",()=>{
  const dropzones=Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect=true;
  dropzones.forEach(dz=>{
    const filled=dz.dataset.filled;
    if(!expectedDrops.includes(filled)){ dz.classList.add("incorrect"); allCorrect=false; incorrectCount++; }
    else{ dz.classList.add("correct"); correctCount++; }
  });
  if(allCorrect){ score++; scoreDisplay.textContent=`Score: ${score}`; showFeedback("correct"); setTimeout(nextRound,2000); }
  else{ showFeedback("wrong"); const draggablesDiv=document.getElementById("draggables"); dropzones.forEach(dz=>{ const img=dz.querySelector("img"); if(img) draggablesDiv.appendChild(img); dz.dataset.filled=""; dz.classList.remove("incorrect"); }); }
});

if(againBtn) againBtn.addEventListener("click",()=>{ buildQuestion(false); buildDraggablesForCurrentQuestion(); });

if(stopBtn) stopBtn.addEventListener("click",endGame);

/* ===== INIT GAME ===== */
function startGame(){ startTime=Date.now(); buildQuestion(); }
startGame();
