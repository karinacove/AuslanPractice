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
const animals = ["dog", "cat", "mouse", "bird", "fish", "rabbit"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const foods = ["apple","banana","pear","grape","orange","strawberry","watermelon"];
const colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];
const verbsBasic = ["want"];
const verbsAll = ["want","eat","like","have"];

/* ===== Utility Functions ===== */
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }
function getRandomDecoys(pool, exclude, count) {
  return shuffleArray(pool.filter(item => !exclude.includes(item))).slice(0, count);
}

/* ===== Sentence Generator ===== */
function generateSentence(level) {
  let animal = randomItem(animals);
  let number = randomItem(numbers);
  let food = randomItem(foods);
  let colour = randomItem(colours);

  if(level === 1){
    let combo = `${animal}-${number}`;
    correctAnswer = [combo];
    return { 
      prompt: "Select the correct animal with number",
      sign: `assets/signs/animals/${animal}-sign.png`,
      draggableItems: [combo] 
    };
  }

  if(level === 2){
    let combo = `${food}-${colour}`;
    correctAnswer = [combo];
    return { 
      prompt: "Select the correct food with colour",
      sign: `assets/signs/food/${food}-sign.png`,
      draggableItems: [combo] 
    };
  }

  if(level >= 3){
    let verbs = level <= 5 ? verbsBasic : verbsAll;
    let verb = randomItem(verbs);
    correctAnswer = [animal, number, verb, food, colour];
    return { 
      prompt: `${animal} ${number} ${verb} ${colour} ${food}`,
      sign: `assets/signs/verbs/${verb}-sign.png`,
      draggableItems: [animal, number, verb, food, colour] 
    };
  }
}

/* ===== Build Question ===== */
function buildQuestion(){
  selectedItems = [];
  feedbackDiv.innerHTML = "";
  answerArea.innerHTML = "";
  draggableOptions.innerHTML = "";

  const qData = generateSentence(currentLevel);
  sentenceDiv.textContent = qData.prompt;
  imageDiv.innerHTML = "";

  if(qData.sign){
    const img = document.createElement("img");
    img.src = qData.sign;
    img.className = "qImage";
    imageDiv.appendChild(img);
  }

  // Create dropzones dynamically
  qData.draggableItems.forEach(_=>{
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.addEventListener("dragover", allowDrop);
    dz.addEventListener("drop", drop);
    answerArea.appendChild(dz);
  });

  // Build draggables
  buildDraggables(qData.draggableItems);
}

/* ===== Build Draggables ===== */
function buildDraggables(items){
  let pool = [...items];

  // add decoys
  pool.push(...getRandomDecoys(animals, items, 3));
  pool.push(...getRandomDecoys(numbers, items, 3));
  pool.push(...getRandomDecoys(foods, items, 3));
  pool.push(...getRandomDecoys(colours, items, 3));
  if(currentLevel >= 3){
    let verbs = currentLevel <= 5 ? verbsBasic : verbsAll;
    pool.push(...getRandomDecoys(verbs, items, 2));
  }

  pool = shuffleArray(pool).slice(0,16);

  pool.forEach(word=>{
    const div = document.createElement("div");
    div.className = "draggable";
    const img = document.createElement("img");

    // decide path
    if(animals.includes(word)){
      img.src = `assets/signs/animals/${word}-sign.png`;
    } else if(numbers.includes(word)){
      img.src = `assets/signs/numbers/${word}-sign.png`;
    } else if(foods.includes(word)){
      img.src = `assets/signs/food/${word}-sign.png`;
    } else if(colours.includes(word)){
      img.src = `assets/signs/colours/${word}-sign.png`;
    } else if(verbsAll.includes(word)){
      img.src = `assets/signs/verbs/${word}-sign.png`;
    } else if(word.includes("-")) {
      // composite image (e.g., dog-one or apple-red)
      img.src = `assets/images/${word}.png`;
    }

    img.alt = word;
    div.appendChild(img);
    div.draggable = true;
    div.addEventListener("dragstart", dragStart);
    draggableOptions.appendChild(div);
  });
}

/* ===== Drag & Drop ===== */
function dragStart(e){ e.dataTransfer.setData("text/plain", e.target.alt || e.target.textContent); }
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
    if(currentLevel <= 10){
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
  window.location.href = "../index.html";
}

/* ===== Buttons ===== */
checkBtn.addEventListener("click", checkAnswers);
stopBtn.addEventListener("click", ()=>{
  saveLevelResults();
  finishGame();
});

/* ===== Start Game ===== */
startGame();
