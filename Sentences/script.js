/* ============================
   Sentences Game - Full JS
   Levels 1–4, odd/even questions
   Left/Right draggables, answer dropzones
   ============================ */

/* ===== CONFIG ===== */
const FORM_FIELD_MAP = {
  name: "entry.1040637824",
  class: "entry.1755746645",
  subject: "entry.1979136660",
  timeTaken: "entry.120322685",
  percent: "entry.1519181393",
  level1: { correct: "entry.1150173566", incorrect: "entry.28043347" },
  level2: { correct: "entry.1424808967", incorrect: "entry.352093752" },
  level3: { correct: "entry.475324608", incorrect: "entry.1767451434" },
  level4: { correct: "entry.1405337882", incorrect: "entry.1513946929" }
};

/* ===== DOM Elements ===== */
const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");
const scoreDisplay = document.getElementById("scoreDisplay");
const stopBtn = document.getElementById("stopBtn");
const leftDraggables = document.getElementById("draggablesLeft");
const rightDraggables = document.getElementById("draggablesRight");
const questionArea = document.getElementById("questionArea");
const answerArea = document.getElementById("answerArea");
const feedbackDiv = document.getElementById("feedback");
const checkBtn = document.getElementById("checkBtn");
const againBtn = document.getElementById("againBtn");
const endModal = document.getElementById("endModal");
const googleForm = document.getElementById("googleForm");

/* ===== STUDENT INFO ===== */
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;
}

/* ===== GAME VARIABLES ===== */
let currentLevel = 1;
let roundInLevel = 0; // 0..9
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let expectedDrops = [];
let startTime = null;

/* ===== VOCAB ===== */
const animals = ["dog","cat","mouse","rabbit","fish","bird"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const food = ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"];
const verbs = ["want","have","donthave"];
const helpers = ["i","see","what"];

/* ===== HELPERS ===== */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function signPathFor(word) {
  if (animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (verbs.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if (helpers.includes(word)) return `assets/signs/helpers/${word}.png`;
  return "";
}

function compositeImagePath(combo) { return `assets/images/${combo}.png`; }

/* ===== SENTENCE GENERATION ===== */
function generateSentence() {
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const foodItem = randomItem(food);
  const colour = randomItem(colours);
  const verb = (currentLevel===4)?randomItem(["have","donthave"]):"want";
  currentSentence = { animal, number, food: foodItem, colour, verb };
}

/* ===== BUILD QUESTION DISPLAY ===== */
function buildQuestion() {
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const isOdd = roundInLevel % 2 === 0 ? false : true; // odd = 1,3,5...
  const helperDiv = document.createElement("div");
  helperDiv.className = "helperSigns";
  helpers.forEach(h => {
    const img = document.createElement("img");
    img.src = signPathFor(h);
    helperDiv.appendChild(img);
  });
  questionArea.appendChild(helperDiv);

  const comboDiv = document.createElement("div");
  comboDiv.className = "comboImages";
  if (isOdd) {
    if (currentLevel===1) comboDiv.innerHTML = `<img src="${compositeImagePath(currentSentence.animal+'-'+currentSentence.number)}">`;
    if (currentLevel===2) comboDiv.innerHTML = `<img src="${compositeImagePath(currentSentence.food+'-'+currentSentence.colour)}">`;
  } else {
    if (currentLevel===1) {
      comboDiv.innerHTML = `<img src="${signPathFor(currentSentence.animal)}"><img src="${signPathFor(currentSentence.number)}">`;
    }
    if (currentLevel===2) {
      comboDiv.innerHTML = `<img src="${signPathFor(currentSentence.food)}"><img src="${signPathFor(currentSentence.colour)}">`;
    }
  }
  questionArea.appendChild(comboDiv);

  buildAnswerBoxes(isOdd);
  buildDraggables(isOdd);
  updateScoreDisplay();
}

/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(isOdd) {
  answerArea.innerHTML = "";
  const dropCount = (currentLevel<=2)? (isOdd?2:1) : (isOdd?4:3); // simplified for 1-4
  for (let i=0;i<dropCount;i++) {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.filled = "";
    dz.dataset.hint = ""; // can later add "animal-number" etc
    dz.addEventListener("dragover", e=>e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    answerArea.appendChild(dz);
  }
}

/* ===== DRAG & DROP ===== */
function buildDraggables(isOdd) {
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  let items = [];
  const totalItems = 16;

  // populate draggables depending on level
  if (currentLevel===1) {
    if (isOdd) items = [currentSentence.animal, currentSentence.number];
    else items = [currentSentence.animal, currentSentence.number];
  }
  if (currentLevel===2) {
    if (isOdd) items = [currentSentence.food, currentSentence.colour];
    else items = [currentSentence.food, currentSentence.colour];
  }
  if (currentLevel>=3) {
    items = [currentSentence.animal,currentSentence.number,currentSentence.food,currentSentence.colour,currentSentence.verb];
  }

  // add decoys
  while(items.length < totalItems) {
    let decoy = randomItem([...animals,...numbers,...food,...colours]);
    if(!items.includes(decoy)) items.push(decoy);
  }

  items = shuffleArray(items);

  // split into left/right 2x2 grids
  const leftItems = items.slice(0,8);
  const rightItems = items.slice(8,16);

  [leftItems,leftItems].forEach((group,idx)=>{
    const container = idx===0? leftDraggables : rightDraggables;
    container.innerHTML = "";
    group.forEach(word=>{
      const div = document.createElement("div");
      div.className="draggable";
      div.draggable=true;
      div.dataset.value=word;
      const img = document.createElement("img");
      img.src = word.includes("-")? compositeImagePath(word) : signPathFor(word);
      div.appendChild(img);
      div.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",word));
      container.appendChild(div);
    });
  });
}

function dropHandler(e) {
  e.preventDefault();
  const dz = e.currentTarget;
  if(dz.childElementCount>0) return;
  const value = e.dataTransfer.getData("text/plain");
  const img = document.createElement("img");
  img.src = value.includes("-")? compositeImagePath(value) : signPathFor(value);
  dz.appendChild(img);
  dz.dataset.filled = value;

  // show buttons when first drop
  againBtn.style.display = "inline-block";
  const allFilled = Array.from(answerArea.querySelectorAll(".dropzone")).every(d=>d.dataset.filled.length>0);
  checkBtn.style.display = allFilled ? "inline-block" : "none";
}

/* ===== BUTTON EVENTS ===== */
checkBtn.addEventListener("click",()=>{
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;
  dropzones.forEach((dz,i)=>{
    let expected="";
    if(currentLevel===1){
      expected = (roundInLevel%2===1)? (i===0?currentSentence.an
      expected = (roundInLevel%2===1) ? (i===0 ? currentSentence.animal : currentSentence.number) : currentSentence.animal + "-" + currentSentence.number;
    } else if(currentLevel===2){
      expected = (roundInLevel%2===1) ? (i===0 ? currentSentence.food : currentSentence.colour) : currentSentence.food + "-" + currentSentence.colour;
    } else if(currentLevel>=3){
      const sequence = [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];
      expected = sequence[i] || "";
    }

    if(dz.dataset.filled === expected){
      dz.classList.add("correct");
      correctCount++;
    } else {
      dz.classList.add("incorrect");
      allCorrect = false;
      incorrectCount++;
    }
  });

  // show feedback image for 2 seconds
  const feedbackImg = document.createElement("img");
  feedbackImg.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  feedbackDiv.appendChild(feedbackImg);

  setTimeout(()=>{
    feedbackDiv.innerHTML="";
    if(allCorrect){
      nextRound();
    } else {
      // reset draggables for retry
      buildDraggables(roundInLevel%2===1);
      dropzones.forEach(dz=>dz.innerHTML=""); dz.dataset.filled="";
      checkBtn.style.display="none";
      againBtn.style.display="inline-block";
    }
  },2000);
});

againBtn.addEventListener("click",()=>{
  buildDraggables(roundInLevel%2===1);
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  dropzones.forEach(dz=>{dz.innerHTML=""; dz.dataset.filled=""; dz.classList.remove("correct","incorrect");});
  checkBtn.style.display="none";
  againBtn.style.display="none";
});

stopBtn.addEventListener("click",()=>{
  const endTime = Date.now();
  const timeTaken = Math.round((endTime - startTime)/1000);
  alert(`Game paused\nScore: ${correctCount}/${correctCount+incorrectCount}\nTime: ${Math.floor(timeTaken/60)}m ${timeTaken%60}s`);
  // optionally implement modal with continue/finish/again
});

function nextRound(){
  roundInLevel++;
  if(roundInLevel>=10){
    endLevel();
  } else {
    buildQuestion();
  }
}

async function endLevel(){
  // submit results to Google Form
  const endTime = Date.now();
  const timeTaken = Math.round((endTime - startTime)/1000);
  const percent = Math.round((correctCount/(correctCount+incorrectCount))*100);

  const formData = new FormData();
  formData.append(FORM_FIELD_MAP.name, studentName);
  formData.append(FORM_FIELD_MAP.class, studentClass);
  formData.append(FORM_FIELD_MAP.subject,"Sentences");
  formData.append(FORM_FIELD_MAP.timeTaken,timeTaken);
  formData.append(FORM_FIELD_MAP.percent, percent);

  // append per-level correct/incorrect
  for(let l=1;l<=currentLevel;l++){
    const correctField = FORM_FIELD_MAP[`level${l}`]?.correct;
    const incorrectField = FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if(correctField) formData.append(correctField, correctCount);
    if(incorrectField) formData.append(incorrectField, incorrectCount);
  }

  try { await fetch(googleForm.action,{method:"POST",body:formData,mode:"no-cors"}); }
  catch(err){ console.warn("Form submit failed",err); }

  if(currentLevel>=4){
    // end modal with final results
    endModal.style.display="block";
    document.getElementById("finalScore").textContent = `${correctCount}/${correctCount+incorrectCount}`;
    document.getElementById("finalPercent").textContent = percent + "%";
  } else {
    currentLevel++;
    roundInLevel=0;
    buildQuestion();
  }
}

function startGame(){
  startTime = Date.now();
  currentLevel = 1;
  roundInLevel = 0;
  correctCount = 0;
  incorrectCount = 0;
  buildQuestion();
}

function updateScoreDisplay(){
  scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/10`;
}

/* ===== INIT ===== */
startGame();
