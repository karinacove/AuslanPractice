/* ============================
   Sentences Game - script.js
   Full game logic + recording + Google Form wiring
   ============================ */

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

/* ===== STUDENT INFO & DOM ===== */
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
const googleForm = document.getElementById("googleForm");

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;
  if (document.getElementById("formName")) document.getElementById("formName").value = studentName;
  if (document.getElementById("formClass")) document.getElementById("formClass").value = studentClass;
}

/* ===== GAME VARIABLES ===== */
let currentLevel = 1;
let roundInLevel = 0;
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let expectedDrops = [];
let mode = "image";
let collectedVideoURLs = [];
let startTime = null;

/* ===== VOCABULARY ===== */
const animals = ["dog", "cat", "mouse", "bird", "fish", "rabbit"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const foods = ["apple","banana","pear","grape","orange","strawberry","watermelon"];
const colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];
const verbsBasic = ["want"];
const verbsAll = ["want","eat","like","have","see"];
const helperSigns = ["i","see","what"];

/* ===== HELPERS ===== */
function randomItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function shuffleArray(arr) { return arr.sort(() => Math.random()-0.5); }

function signPathFor(word) {
  if (animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (foods.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (verbsAll.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if (helperSigns.includes(word)) return `assets/signs/helpers/${word}.png`;
  return null;
}

function compositeImagePath(combo) {
  return `assets/images/${combo}.png`;
}

/* ===== SENTENCE GENERATION ===== */
function generateSentenceForLevel(level) {
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const food = randomItem(foods);
  const colour = randomItem(colours);
  const verbs = (level <= 5) ? verbsBasic : verbsAll;
  const verb = randomItem(verbs);
  currentSentence = { animal, number, verb, food, colour };
  return currentSentence;
}

function expectedComponentsFor(level, mode) {
  if (mode === "image") {
    if (level === 1) return ['animal-number'];
    if (level === 2) return ['food-colour'];
    return ['animal-number','food-colour'];
  } else if (mode === "sign") {
    if (level === 1) return ['i','see','what','animal','number'];
    if (level === 2) return ['food','colour'];
    return ['i','see','what','animal','number','verb','food','colour'];
  }
  return [];
}

/* ===== UI BUILDERS ===== */
function clearUI() {
  sentenceDiv.textContent = "";
  imageDiv.innerHTML = "";
  answerArea.innerHTML = "";
  draggableOptions.innerHTML = "";
  feedbackDiv.innerHTML = "";
}

function buildPromptForCurrentQuestion() {
  imageDiv.innerHTML = "";
  
  if (currentLevel === 1) {
    // i see what? signs first
    ['i','see','what'].forEach(w => {
      const img = document.createElement("img");
      img.src = signPathFor(w);
      img.alt = w;
      img.className = "promptSign";
      imageDiv.appendChild(img);
    });

    // main animal-number
    const combo = `${currentSentence.animal}-${currentSentence.number}`;
    const imgMain = document.createElement("img");
    imgMain.src = compositeImagePath(combo);
    imgMain.alt = combo;
    imgMain.className = "promptImage";
    imageDiv.appendChild(imgMain);

  } else if (currentLevel === 2) {
    ['i','see','what'].forEach(w => {
      const img = document.createElement("img");
      img.src = signPathFor(w);
      img.alt = w;
      img.className = "promptSign";
      imageDiv.appendChild(img);
    });

    const combo = `${currentSentence.food}-${currentSentence.colour}`;
    const imgMain = document.createElement("img");
    imgMain.src = compositeImagePath(combo);
    imgMain.alt = combo;
    imgMain.className = "promptImage";
    imageDiv.appendChild(imgMain);

  } else if (currentLevel === 3 || currentLevel === 4) {
    // Permanent sentence: animal-number + verb + food-colour
    const comboAN = `${currentSentence.animal}-${currentSentence.number}`;
    const comboFC = `${currentSentence.food}-${currentSentence.colour}`;
    
    const imgAN = document.createElement("img");
    imgAN.src = compositeImagePath(comboAN);
    imgAN.alt = comboAN;
    imgAN.className = "promptImage";
    
    const imgFC = document.createElement("img");
    imgFC.src = compositeImagePath(comboFC);
    imgFC.alt = comboFC;
    imgFC.className = "promptImage";
    
    imageDiv.appendChild(imgAN);
    
    // Verb display for Level 4: have/don't have
    if (currentLevel === 4) {
      imgFC.style.marginLeft = currentSentence.verb === "have" ? "0px" : "50px";
    }
    
    imageDiv.appendChild(imgFC);
    
  } else if (currentLevel === 5) {
    // Level 5: 4 videos + 5 dropzones
    // Display videos in imageDiv
    currentSentence.videoURLs.forEach(url => {
      const vid = document.createElement("video");
      vid.src = url;
      vid.controls = true;
      vid.width = 120;
      imageDiv.appendChild(vid);
    });
  }
}

/* ===== DROPZONES ===== */
function buildAnswerDropzones() {
  answerArea.innerHTML = "";
  expectedDrops.forEach(exp => {
    const dz = document.createElement("div");
    dz.className = "dropzone"; dz.dataset.expected = exp; dz.dataset.filled="";
    dz.addEventListener("dragover", e=>e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    answerArea.appendChild(dz);
  });
}

/* ===== DRAGGABLES ===== */
function buildDraggablesForCurrentQuestion() {
  draggableOptions.innerHTML = "";
  let items = [];

  // Alternate question types: even Q = signs draggable, odd Q = images draggable
  const signsDraggable = roundInLevel % 2 === 0;

  if (currentLevel === 1) {
    if (signsDraggable) {
      items = [currentSentence.animal, currentSentence.number];
    } else {
      items = [`${currentSentence.animal}-${currentSentence.number}`];
    }
  } else if (currentLevel === 2) {
    if (signsDraggable) {
      items = [currentSentence.food, currentSentence.colour];
    } else {
      items = [`${currentSentence.food}-${currentSentence.colour}`];
    }
  } else if (currentLevel === 3 || currentLevel === 4) {
    if (signsDraggable) {
      items = [
        currentSentence.animal,
        currentSentence.number,
        currentSentence.food,
        currentSentence.colour
      ];
    } else {
      items = [
        `${currentSentence.animal}-${currentSentence.number}`,
        `${currentSentence.food}-${currentSentence.colour}`
      ];
    }
  } else if (currentLevel === 5) {
    // Level 5: matching my signed videos (5 questions)
    // draggable options are the signs that match the video
    items = currentSentence.videoSigns;  
    // Show the video as the prompt
    const promptDiv = document.getElementById("prompt");
    promptDiv.innerHTML = `
      <video controls autoplay width="240">
        <source src="assets/videos/${currentSentence.video}" type="video/mp4">
        Your browser does not support video.
      </video>
    `;
  } else if (currentLevel === 6) {
    // Level 6: student uploads their own video (no draggables)
    const promptDiv = document.getElementById("prompt");
    promptDiv.innerHTML = `
      <img src="assets/images/${currentSentence.image}" width="180">
    `;
    const answerArea = document.getElementById("answerArea");
    answerArea.innerHTML = `
      <div id="recordingControls">
        <button id="startRec">Start Recording</button>
        <button id="stopRec" disabled>Stop Recording</button>
        <video id="preview" autoplay muted></video>
      </div>
    `;
    setupRecordingHandlers();
    return; // stop here, no draggables in Level 6
  }

  // Build draggable elements (all levels except 6)
  items.forEach(word => {
    const div = document.createElement("div");
    div.className = "draggable";
    div.draggable = true;
    div.dataset.value = word;

    const img = document.createElement("img");
    img.src = signPathFor(word) || compositeImagePath(word);
    img.alt = word;
    img.className = "draggableImage";
    div.appendChild(img);

    div.addEventListener("dragstart", e =>
      e.dataTransfer.setData("text/plain", word)
    );

    draggableOptions.appendChild(div);
  });
}

/* ===== DROP HANDLER ===== */
function dropHandler(e){
  e.preventDefault();
  const value = e.dataTransfer.getData("text/plain");
  const dz = e.currentTarget;
  if(dz.childElementCount>0) return;
  const img = document.createElement("img");
  img.src = value.includes('-')?compositeImagePath(value):signPathFor(value)||""; img.alt=value; img.className="droppedImage";
  dz.appendChild(img);
  dz.dataset.filled = value;
}

/* ===== CHECK ANSWERS ===== */
function checkCurrentAnswer(){
  let roundCorrect=0, roundIncorrect=0;
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz=>{
    let filled = dz.dataset.filled||"", expected=dz.dataset.expected;
    if(expected==='animal-number') expected=`${currentSentence.animal}-${currentSentence.number}`;
    if(expected==='food-colour') expected=`${currentSentence.food}-${currentSentence.colour}`;
    if(filled===expected){ dz.classList.add("correct"); dz.style.borderColor="#2e7d32"; roundCorrect++; }
    else{ dz.classList.add("incorrect"); dz.classList.add("shake");
      setTimeout(()=>{ dz.classList.remove("shake","incorrect"); dz.innerHTML=""; dz.dataset.filled=""; },600);
      roundIncorrect++;
    }
  });
  correctCount+=roundCorrect; incorrectCount+=roundIncorrect;
  setTimeout(()=>{
    roundInLevel++;
    if(roundInLevel>=10){ saveResultsForCurrentLevel(); if(currentLevel<10){ currentLevel++; startNewLevel(); } else endGame(); }
    else nextQuestion();
  },700);
}

/* ===== RECORDING LEVEL 5 ===== */
let mediaRecorder=null, recordedBlobs=[], localStream=null;

async function startRecordingUI(){
  imageDiv.innerHTML=""; answerArea.innerHTML=""; draggableOptions.innerHTML=""; feedbackDiv.innerHTML="";
  buildPromptForCurrentQuestion();
  const controls=document.createElement("div"); controls.className="recordControls";
  const startBtn=document.createElement("button"); startBtn.textContent="Start Recording";
  const stopBtnRec=document.createElement("button"); stopBtnRec.textContent="Stop Recording"; stopBtnRec.disabled=true;
  const preview=document.createElement("video"); preview.autoplay=true; preview.muted=true; preview.playsInline=true; preview.className="preview";
  const playback=document.createElement("video"); playback.controls=true; playback.className="playback";
  const submitVideoBtn=document.createElement("button"); submitVideoBtn.textContent="Submit Video"; submitVideoBtn.disabled=true;
  controls.appendChild(startBtn); controls.appendChild(stopBtnRec); controls.appendChild(submitVideoBtn); answerArea.appendChild(controls); answerArea.appendChild(preview); answerArea.appendChild(playback);
  try{ localStream = await navigator.mediaDevices.getUserMedia({audio:true,video:true}); preview.srcObject = localStream; } catch(err){ feedbackDiv.textContent="Camera access denied"; return; }
  startBtn.addEventListener("click", ()=>{
    recordedBlobs=[]; mediaRecorder=new MediaRecorder(localStream,{mimeType:'video/webm;codecs=vp8,opus'});
    mediaRecorder.ondataavailable = (e)=>{ if(e.data&&e.data.size>0) recordedBlobs.push(e.data); };
    mediaRecorder.onstop = ()=>{ const superBuffer=new Blob(recordedBlobs,{type:'video/webm'}); playback.src=URL.createObjectURL(superBuffer); submitVideoBtn.disabled=false; };
    mediaRecorder.start(); startBtn.disabled=true; stopBtnRec.disabled=false; feedbackDiv.textContent="Recording...";
  });
  stopBtnRec.addEventListener("click", ()=>{ if(mediaRecorder&&mediaRecorder.state!=="inactive"){ mediaRecorder.stop(); startBtn.disabled=false; stopBtnRec.disabled=true; feedbackDiv.textContent="Recording stopped"; }});
  submitVideoBtn.addEventListener("click", async ()=>{
    if(!recordedBlobs.length){ feedbackDiv.textContent="No recording"; return; }
    const blob=new Blob(recordedBlobs,{type:'video/webm'});
    let uploadedURL=null;
    if(UPLOAD_ENDPOINT){ try{ const fd=new FormData(); fd.append("file",blob,`${studentName}_${currentLevel}_q${roundInLevel+1}.webm`); const res=await fetch(UPLOAD_ENDPOINT,{method:"POST",body:fd}); const json=await res.json(); uploadedURL=json.url||null; }catch(err){ console.error(err); feedbackDiv.textContent="Upload failed"; } }
    else{ const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${studentName}_${currentLevel}_q${roundInLevel+1}.webm`; document.body.appendChild(a); a.click(); a.remove(); uploadedURL=`LOCAL_DOWNLOAD:${studentName}_${currentLevel}_q${roundInLevel+1}.webm`; }
    collectedVideoURLs.push(uploadedURL||`UPLOAD_FAILED_q${roundInLevel+1}`); roundInLevel++;
    correctCount++; if(roundInLevel>=10){ saveResultsForCurrentLevel(); if(currentLevel<10){ currentLevel++; stopLocalStream(); startNewLevel(); } else finishGame(); } else buildQuestion();
  });
}

function stopLocalStream(){ if(localStream){ localStream.getTracks().forEach(t=>t.stop()); localStream=null; }}

/* ===== SAVE RESULTS ===== */
function saveResultsForCurrentLevel(){
  const mapping = {1:FORM_FIELD_MAP.level1,2:FORM_FIELD_MAP.level2,3:FORM_FIELD_MAP.level3,4:FORM_FIELD_MAP.level4,5:FORM_FIELD_MAP.level5,6:FORM_FIELD_MAP.level6,7:FORM_FIELD_MAP.level7,8:FORM_FIELD_MAP.level8,9:FORM_FIELD_MAP.level9,10:FORM_FIELD_MAP.level10};
  const map = mapping[currentLevel]; if(map){ try{ if(document.querySelector(`[name='${map.correct}']`)) document.querySelector(`[name='${map.correct}']`).value=correctCount;
    if(document.querySelector(`[name='${map.incorrect}']`)) document.querySelector(`[name='${map.incorrect}']`).value=incorrectCount;
  } catch(err){ console.warn(err); } }
  if(collectedVideoURLs.length>0 && FORM_FIELD_MAP.videoField){ const joined=collectedVideoURLs.join("; "); const el=document.querySelector(`[name='${FORM_FIELD_MAP.videoField}']`); if(el) el.value=joined; }
  if(FORM_FIELD_MAP.name && document.querySelector(`[name='${FORM_FIELD_MAP.name}']`)) document.querySelector(`[name='${FORM_FIELD_MAP.name}']`).value=studentName;
  if(FORM_FIELD_MAP.class && document.querySelector(`[name='${FORM_FIELD_MAP.class}']`)) document.querySelector(`[name='${FORM_FIELD_MAP.class}']`).value=studentClass;
}

/* ===== QUESTION FLOW ===== */
function startNewLevel(){ roundInLevel=0; correctCount=0; incorrectCount=0; collectedVideoURLs=[]; buildQuestion(); }
function nextQuestion(){ buildQuestion(); }
function buildQuestion(){
  clearUI(); generateSentenceForLevel(currentLevel);
  if(currentLevel===5){ mode="record"; expectedDrops=[]; sentenceDiv.textContent="Record yourself signing this sentence"; buildPromptForCurrentQuestion(); startRecordingUI(); return; }
  mode = (roundInLevel<5)?"image":"sign";
  expectedDrops = expectedComponentsFor(currentLevel,mode);
  sentenceDiv.textContent="";
  buildPromptForCurrentQuestion(); buildAnswerDropzones(); buildDraggablesForCurrentQuestion();
}

/* ===== END GAME ===== */
function endGame(){
  const timeTaken = Math.floor((Date.now()-startTime)/1000);
  const total = correctCount+incorrectCount;
  const percent = total>0?Math.round((correctCount/total)*100):0;
  if(FORM_FIELD_MAP.timeTaken && document.querySelector(`[name='${FORM_FIELD_MAP.timeTaken}']`)) document.querySelector(`[name='${FORM_FIELD_MAP.timeTaken}']`).value=`${timeTaken}s`;
  if(FORM_FIELD_MAP.percent && document.querySelector(`[name='${FORM_FIELD_MAP.percent}']`)) document.querySelector(`[name='${FORM_FIELD_MAP.percent}']`).value=`${percent}`;
  saveResultsForCurrentLevel();
  if(googleForm){ try{ googleForm.submit(); } catch(err){ console.warn(err); } }
  stopLocalStream();
  alert(`Finished. Correct:${correctCount} | Incorrect:${incorrectCount} | Time:${timeTaken}s | Accuracy:${percent}%`);
  window.location.href="../index.html";
}

/* ===== BUTTONS ===== */
if(checkBtn){ checkBtn.addEventListener("click", ()=>{
  if(mode==="record"){ feedbackDiv.textContent="Press Submit in recording panel"; return; }
  const filled=Array.from(answerArea.querySelectorAll(".dropzone")).some(d=>d.dataset.filled&&d.dataset.filled.length>0);
  if(!filled){ feedbackDiv.textContent="Place your answers first"; return; }
  checkCurrentAnswer();
});}
if(stopBtn){ stopBtn.addEventListener("click", ()=>{ saveResultsForCurrentLevel(); endGame(); });}

/* ===== START GAME ===== */
function startGame(){ startTime=Date.now(); currentLevel=1; roundInLevel=0; correctCount=0; incorrectCount=0; collectedVideoURLs=[]; buildQuestion(); }
window.addEventListener("DOMContentLoaded", startGame);
