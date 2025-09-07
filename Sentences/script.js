/* ===== Student Info ===== */
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

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;

  document.getElementById("formName").value = studentName;
  document.getElementById("formClass").value = studentClass;
}

/* ===== Game Variables ===== */
let currentLevel = 1;
let currentQuestion = 1;
let correctCount = 0;
let incorrectCount = 0;
let selectedItems = [];
let correctAnswer = [];
let gameEnded = false;
let startTime;

/* ===== Vocabulary ===== */
const level1to5Animals = ["dog", "cat", "mouse", "bird", "fish", "rabbit"];
const level1to5Numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const level1to5Foods = ["apple","banana","pear","grape","orange","strawberry","watermelon"];
const level1to5Colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];

/* ===== Utility Functions ===== */
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }
function getRandomDecoys(pool, exclude, count) {
  return shuffleArray(pool.filter(item => !exclude.includes(item))).slice(0, count);
}

/* ===== Sentence Generator ===== */
function generateSentence(level, qType) {
  let animal = randomItem(level1to5Animals);
  let number = randomItem(level1to5Numbers);
  let food = randomItem(level1to5Foods);
  let colour = randomItem(level1to5Colours);

  if(level === 1){
    if(qType === 1){
      correctAnswer = [animal, number];
      return {prompt: "I see what?", image: `assets/images/${animal}-${number}.png`};
    } else {
      correctAnswer = [`${animal}-${number}`];
      return {prompt: `I see what? ${animal} ${number}`, image: null};
    }
  }

  if(level === 2){
    if(qType === 1){
      correctAnswer = [food, colour];
      return {prompt: "I see what?", image: `assets/images/${food}-${colour}.png`};
    } else {
      correctAnswer = [`${food}-${colour}`];
      return {prompt: `I see what? ${food} ${colour}`, image: null};
    }
  }

  if(level === 3){
    correctAnswer = [animal, number, "want", food, colour];
    return {prompt: `${animal} ${number} want what?`, image: `assets/images/${food}-${colour}.png`};
  }

  if(level === 4){
    correctAnswer = [animal, number, "have", food, colour];
    return {prompt: "Have vs don't have", image: null};
  }

  if(level === 5){
    correctAnswer = [];
    return {prompt: "Video task", image: null};
  }
}

/* ===== Build Question ===== */
function buildQuestion(){
  selectedItems = [];
  feedbackDiv.innerHTML = "";
  answerArea.innerHTML = "";
  draggableOptions.innerHTML = "";

  const qData = generateSentence(currentLevel, currentQuestion);
  sentenceDiv.textContent = qData.prompt;
  imageDiv.innerHTML = "";

  if(qData.image){
    const img = document.createElement("img");
    img.src = qData.image;
    img.className = "qImage";
    imageDiv.appendChild(img);
  }

  // Create dropzones dynamically
  correctAnswer.forEach(_=>{
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.addEventListener("dragover", allowDrop);
    dz.addEventListener("drop", drop);
    answerArea.appendChild(dz);
  });

  // Build draggables
  buildDraggables();
}

/* ===== Build Draggables ===== */
function buildDraggables(){
  let pool = [...correctAnswer];
  pool.push(...getRandomDecoys(level1to5Animals, correctAnswer, 3));
  pool.push(...getRandomDecoys(level1to5Numbers, correctAnswer, 3));
  pool.push(...getRandomDecoys(level1to5Foods, correctAnswer, 3));
  pool.push(...getRandomDecoys(level1to5Colours, correctAnswer, 3));

  pool = shuffleArray(pool).slice(0,15);

  pool.forEach(word=>{
    const div = document.createElement("div");
    div.className = "draggable";
    div.textContent = word;
    div.draggable = true;
    div.addEventListener("dragstart", dragStart);
    draggableOptions.appendChild(div);
  });
}

/* ===== Drag & Drop ===== */
function dragStart(e){ e.dataTransfer.setData("text/plain", e.target.textContent); }
function allowDrop(e){ e.preventDefault(); }
function drop(e){
  e.preventDefault();
  const word = e.dataTransfer.getData("text/plain");
  const target = e.target;
  if(target.classList.contains("dropzone") && target.childElementCount === 0){
    const div = document.createElement("div");
    div.textContent = word;
    div.className = "dropped";
    target.appendChild(div);
    selectedItems.push(word);
  }
}

/* ===== Check Answers ===== */
function checkAnswers(){
  let isCorrect = selectedItems.join(" ") === correctAnswer.join(" ");

  if(isCorrect){
    correctCount++;
    feedbackDiv.innerHTML = `<img src="assets/correct.png" alt="Correct">`;
  } else {
    incorrectCount++;
    feedbackDiv.innerHTML = `<img src="assets/incorrect.png" alt="Incorrect">`;
    document.querySelectorAll(".dropzone").forEach(z=>z.classList.add("shake"));
    setTimeout(()=>document.querySelectorAll(".dropzone").forEach(z=>z.classList.remove("shake")),600);
  }

  // Clear dropzones after 1 sec
  setTimeout(()=>{
    selectedItems = [];
    answerArea.innerHTML = "";
    currentQuestion = currentQuestion === 1 ? 2 : 1;
    if(currentQuestion === 1){ currentLevel++; }
    if(currentLevel <= 5){
      buildQuestion();
    } else {
      endGame();
    }
  },1000);
}

/* ===== Game Flow ===== */
function startGame(){
  currentLevel = 1;
  currentQuestion = 1;
  correctCount = 0;
  incorrectCount = 0;
  gameEnded = false;
  startTime = Date.now();
  buildQuestion();
}

function endGame(){
  gameEnded = true;
  const timeTaken = Math.floor((Date.now()-startTime)/1000);
  const percentage = Math.round((correctCount/(correctCount+incorrectCount))*100);
  saveLevelResults();
  alert(`Game Over!\nCorrect: ${correctCount}\nIncorrect: ${incorrectCount}\nTime: ${timeTaken}s\nAccuracy: ${percentage}%`);
  finishGame();
}

/* ===== Google Form ===== */
function saveLevelResults(){
  const formMap = {
    1:["entry.1150173566","entry.28043347"],
    2:["entry.1424808967","entry.352093752"],
    3:["entry.475324608","entry.1767451434"],
    4:["entry.1405337882","entry.1513946929"]
  };
  const [correctID, incorrectID] = formMap[currentLevel] || [];
  if(correctID && incorrectID){
    document.querySelector(`[name='${correctID}']`).value = correctCount;
    document.querySelector(`[name='${incorrectID}']`).value = incorrectCount;
  }
}

function finishGame(){
  document.getElementById("googleForm").submit();
  window.location.href = "../hub.html";
}

/* ===== Buttons ===== */
checkBtn.addEventListener("click", checkAnswers);
stopBtn.addEventListener("click", ()=>{
  saveLevelResults();
  finishGame();
});

/* ===== Start Game ===== */
startGame();
