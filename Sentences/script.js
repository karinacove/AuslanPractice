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

const againBtnEnd = document.getElementById("againBtnEnd");
const finishBtn = document.getElementById("finishBtn");

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
let roundInLevel = 0;
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {};
let startTime = null;
let savedTimeElapsed = 0;
let answersHistory = [];
let levelCorrect = {1:0,2:0,3:0,4:0};
let levelIncorrect = {1:0,2:0,3:0,4:0};
const TOTAL_LEVELS = 4;

/* ===== VOCAB ===== */
const animals = ["dog","cat","mouse","rabbit","fish","bird"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const colours = ["red","green","blue","orange","yellow","pink","purple","brown","black","white"];
const food = ["apple","banana","blueberry","grape","orange","pear","pineapple","raspberry","strawberry","watermelon"];
const verbs = ["want","have","donthave"];
const helpers = ["i","see","what"];

/* ===== HELPERS ===== */
function shuffleArray(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randomItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function signPathFor(word){
  if(animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if(numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if(food.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if(colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if(verbs.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if(helpers.includes(word)) return `assets/signs/helpers/${word}.png`;
  return "";
}
function compositeImagePath(combo){ return `assets/images/${combo}.png`; }

/* ===== TIMER HELPERS ===== */
function getTimeElapsed(){ return savedTimeElapsed + Math.round((Date.now()-startTime)/1000); }
function setTimeElapsed(seconds){ savedTimeElapsed=seconds; startTime=Date.now(); }

/* ===== SAVE/RESUME ===== */
const SAVE_KEY = "sentencesGameSave";
function saveProgress(){
  localStorage.setItem(SAVE_KEY,JSON.stringify({
    studentName, studentClass, currentLevel, roundInLevel, correctCount, incorrectCount,
    answersHistory, levelCorrect, levelIncorrect, timeElapsed:getTimeElapsed()
  }));
}
function loadProgress(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch{return null;} }
function clearProgress(){ localStorage.removeItem(SAVE_KEY); }

function showResumeModal(saved){
  const modal=document.getElementById("resumeModal");
  const msg=document.getElementById("resumeMessage");
  const cont=document.getElementById("resumeContinue");
  const again=document.getElementById("resumeAgain");
  msg.textContent=`Welcome back ${saved.studentName}! Continue from Level ${saved.currentLevel}, Question ${saved.roundInLevel+1}?`;
  cont.onclick=()=>{ modal.style.display="none"; restoreProgress(saved); };
  again.onclick=()=>{ modal.style.display="none"; clearProgress(); resetGame(); };
  modal.style.display="flex";
}

function restoreProgress(saved){
  studentName=saved.studentName; studentClass=saved.studentClass;
  currentLevel=saved.currentLevel; roundInLevel=saved.roundInLevel;
  correctCount=saved.correctCount; incorrectCount=saved.incorrectCount;
  answersHistory=saved.answersHistory||[];
  levelCorrect=saved.levelCorrect||{1:0,2:0,3:0,4:0};
  levelIncorrect=saved.levelIncorrect||{1:0,2:0,3:0,4:0};
  setTimeElapsed(saved.timeElapsed||0);
  buildQuestion();
}

/* ===== GENERATE SENTENCE ===== */
function generateSentence(){
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const foodItem = randomItem(food);
  const colour = randomItem(colours);
  const verb = (currentLevel === 4) ? randomItem(["have","donthave"]) : "want";

  currentSentence = { animal, number, food: foodItem, colour, verb };
}

/* end / stop / resume modal controls in HTML:
   - End modal elements: #endGif, #finalTime, #finalScore, #finalPercent, #finishBtn, #againBtnEnd, #logoffBtn
   - Stop modal elements: #stopModal, #stopTime, #stopPercent, #continueBtn, #againBtnStop, #finishBtnStop
   - Resume modal elements: #resumeModal, #resumeMessage, #resumeContinue, #resumeAgain
*/
const resumeContinueBtn = document.getElementById("resumeContinue");
const resumeAgainBtn = document.getElementById("resumeAgain");


/* ===== BUILD QUESTION ===== */
function buildQuestion() {
  generateSentence();
  questionArea.innerHTML = "";
  answerArea.innerHTML = "";
  feedbackDiv.innerHTML = "";
  checkBtn.style.display = "none";
  againBtn.style.display = "none";

  const isOdd = (roundInLevel % 2) === 1;

  // --- HELPER SIGNS (Level 1 & 2 only) ---
  if (currentLevel <= 2) {
    const helperDiv = document.createElement("div");
    helpers.forEach(h => {
      const img = document.createElement("img");
      img.src = signPathFor(h);
      helperDiv.appendChild(img);
    });
    questionArea.appendChild(helperDiv);
  }

  // --- QUESTION IMAGES ---
  const comboDiv = document.createElement("div");

  if (currentLevel === 1) {
    // Level 1: odd -> composite image, even -> separate signs
    if (isOdd) {
      comboDiv.innerHTML = `<img src="${compositeImagePath(currentSentence.animal + '-' + currentSentence.number)}">`;
    } else {
      comboDiv.innerHTML =
        `<img src="${signPathFor(currentSentence.animal)}">
         <img src="${signPathFor(currentSentence.number)}">`;
    }

  } else if (currentLevel === 2) {
    // Level 2: odd -> composite (food-colour), even -> separate
    if (isOdd) {
      comboDiv.innerHTML = `<img src="${compositeImagePath(currentSentence.food + '-' + currentSentence.colour)}">`;
    } else {
      comboDiv.innerHTML =
        `<img src="${signPathFor(currentSentence.food)}">
         <img src="${signPathFor(currentSentence.colour)}">`;
    }

  } else if (currentLevel === 3) {
    // Level 3: verb 'want' is always shown in the question and prefilled in answers
    if (isOdd) {
      comboDiv.innerHTML =
        `<img src="${compositeImagePath(currentSentence.animal + '-' + currentSentence.number)}">
         <img src="${signPathFor('want')}">
         <img src="${compositeImagePath(currentSentence.food + '-' + currentSentence.colour)}">`;
    } else {
      comboDiv.innerHTML =
        `<img src="${signPathFor(currentSentence.animal)}">
         <img src="${signPathFor(currentSentence.number)}">
         <img src="${signPathFor('want')}">
         <img src="${signPathFor(currentSentence.food)}">
         <img src="${signPathFor(currentSentence.colour)}">`;
    }

  } else if (currentLevel === 4) {
    // Level 4: similar pattern, but verb is have/donthave
    if (isOdd) {
      // question displays composite images for animal-number & food-colour with a verb icon between
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: compositeImagePath(`${currentSentence.animal}-${currentSentence.number}`) }));

      // verb (show 'have' sign and overlay X if donthave)
      if (currentSentence.verb === "donthave") {
        const verbWrap = document.createElement("div");
        verbWrap.className = "dontHaveWrapper";
        const vImg = document.createElement("img");
        vImg.src = signPathFor("have");
        verbWrap.appendChild(vImg);
        const x = document.createElement("div");
        x.className = "xOverlay";
        x.textContent = "X";
        verbWrap.appendChild(x);
        comboDiv.appendChild(verbWrap);
      } else {
        comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor("have") }));
      }

      const foodColourEl = Object.assign(document.createElement("img"), { src: compositeImagePath(`${currentSentence.food}-${currentSentence.colour}`) });
      comboDiv.appendChild(foodColourEl);

    } else {
      // separate signs: animal, number, verb, food, colour (verb shown)
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.animal) }));
      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.number) }));

      if (currentSentence.verb === "donthave") {
        const verbWrap2 = document.createElement("div");
        verbWrap2.className = "dontHaveWrapper";
        const vImg2 = document.createElement("img");
        vImg2.src = signPathFor("have");
        verbWrap2.appendChild(vImg2);
        const x2 = document.createElement("div");
        x2.className = "xOverlay";
        x2.textContent = "X";
        verbWrap2.appendChild(x2);
        comboDiv.appendChild(verbWrap2);
      } else {
        comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor("have") }));
      }

      if (currentSentence.verb === "donthave") {
        const f = document.createElement("img");
        f.src = signPathFor(currentSentence.food);
        const wrapper = document.createElement("div");
        wrapper.className = "dontHaveWrapper";
        wrapper.appendChild(f);
        const x = document.createElement("div");
        x.className = "xOverlay";
        x.textContent = "X";
        wrapper.appendChild(x);
        comboDiv.appendChild(wrapper);
      } else {
        comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.food) }));
      }

      comboDiv.appendChild(Object.assign(document.createElement("img"), { src: signPathFor(currentSentence.colour) }));
    }
  }

  questionArea.appendChild(comboDiv);

  // Build answers & draggables
  buildAnswerBoxes(isOdd);
  buildDraggables(isOdd);

  updateScoreDisplay();
}

/* ===== BUILD ANSWER BOXES ===== */
function buildAnswerBoxes(isOdd) {
  answerArea.innerHTML = "";
  let dropLabels = [];

  if (currentLevel === 1) {
    dropLabels = isOdd ? ["animal","number"] : ["animal+number"];
  } else if (currentLevel === 2) {
    dropLabels = isOdd ? ["food","colour"] : ["food+colour"];
  } else if (currentLevel === 3) {
    // verb prefilled ALWAYS (want)
    dropLabels = isOdd ? ["animal","number","verb","food","colour"] : ["animal+number","verb","food+colour"];
  } else if (currentLevel === 4) {
    // keep the same mapping as level 3 for drop zones: if question has composite (isOdd true) -> student drags individual parts
    // if question shows separate signs (isOdd false) -> student drags composites (animal+number and food+colour) + verb
    dropLabels = isOdd ? ["animal","number","verb","food","colour"] : ["animal+number","verb","food+colour"];
  }

  dropLabels.forEach(label => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.placeholder = label; // used in check logic
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);

    // Level 3: prefill verb ("want") in all questions and mark permanent
    if (currentLevel === 3 && label === "verb") {
      const img = document.createElement("img");
      img.src = signPathFor("want");
      dz.appendChild(img);
      dz.dataset.filled = "want";
      dz.classList.add("filled");
      dz.dataset.permanent = "true";
    }

    answerArea.appendChild(dz);
  });
}

/* ===== BUILD DRAGGABLES ===== */
function buildDraggables(isOdd) {
  leftDraggables.innerHTML = "";
  rightDraggables.innerHTML = "";
  let items = [];
  const totalItems = 16; // total draggable tiles you want (8 left, 8 right)

  // --- Correct answers depending on level/mode ---
  if (currentLevel === 1) {
    items = isOdd ? [currentSentence.animal, currentSentence.number] : [`${currentSentence.animal}-${currentSentence.number}`];
  } else if (currentLevel === 2) {
    items = isOdd ? [currentSentence.food, currentSentence.colour] : [`${currentSentence.food}-${currentSentence.colour}`];
  } else if (currentLevel === 3) {
    // Level 3: NO verbs draggable (verb 'want' is prefilled)
    items = isOdd ? [currentSentence.animal, currentSentence.number, currentSentence.food, currentSentence.colour]
                  : [`${currentSentence.animal}-${currentSentence.number}`, `${currentSentence.food}-${currentSentence.colour}`];
  } else if (currentLevel === 4) {
    // Level 4 uses single combined draggable to fill all slots (this approach is stable)
    // Combined label format: animal-number-verb-food-colour
    const label = `${currentSentence.animal}-${currentSentence.number}-${currentSentence.verb}-${currentSentence.food}-${currentSentence.colour}`;
    items = [label];
  }

  // --- Add decoys ensuring uniqueness ---
  const used = new Set(items);
  const allSimplePool = [...animals, ...numbers, ...food, ...colours];
  const allCombosAnimalNumber = animals.flatMap(a => numbers.map(n => `${a}-${n}`));
  const allCombosFoodColour = food.flatMap(f => colours.map(c => `${f}-${c}`));
  const allCombos = allCombosAnimalNumber.concat(allCombosFoodColour);

  while (items.length < totalItems) {
    let decoy = null;

    if (currentLevel === 4) {
      // decoys for level 4: mix of single signs and combos and occasionally another combined
      if (Math.random() < 0.4) {
        // single sign decoy
        decoy = randomItem(allSimplePool);
      } else if (Math.random() < 0.8) {
        // composite decoy
        decoy = randomItem(allCombos);
      } else {
        // sometimes a "fake combined" (different verb/words) -- keep to same format (5-part) but rand
        const a = randomItem(animals);
        const n = randomItem(numbers);
        const v = randomItem(["have","donthave"]);
        const f = randomItem(food);
        const c = randomItem(colours);
        decoy = `${a}-${n}-${v}-${f}-${c}`;
      }
    } else {
      // other levels: either single sign decoy or combos depending on isOdd
      if (isOdd) {
        decoy = randomItem(allSimplePool);
      } else {
        // combos expected on even questions
        decoy = randomItem(allCombos);
      }
    }

    if (!used.has(decoy)) {
      items.push(decoy);
      used.add(decoy);
    }
  }

  // shuffle and split into two columns
  items = shuffleArray(items);
  const left = items.slice(0, totalItems / 2);
  const right = items.slice(totalItems / 2, totalItems);

  function makeDraggableItem(value) {
    const div = document.createElement("div");
    div.className = "draggable";
    div.draggable = true;
    div.dataset.value = value;

    // build a sensible preview:
    // - combined (5-part) label -> show food-colour composite preview and an X overlay if 'donthave'
    // - 2-part combos show the composite image
    // - single words show signPath
    const parts = String(value).split("-");
    if (parts.length === 5) {
      // combined: show food-colour as preview and overlay X if verb === 'donthave'
      const verb = parts[2];
      const foodCombo = `${parts[3]}-${parts[4]}`;
      const img = document.createElement("img");
      img.src = compositeImagePath(foodCombo);
      if (verb === "donthave") {
        const wrapper = document.createElement("div");
        wrapper.className = "dontHaveWrapper";
        wrapper.appendChild(img);
        const x = document.createElement("div");
        x.className = "xOverlay";
        x.textContent = "X";
        wrapper.appendChild(x);
        div.appendChild(wrapper);
      } else {
        div.appendChild(img);
      }
    } else if (parts.length === 2) {
      // composite preview
      const img = document.createElement("img");
      img.src = compositeImagePath(value);
      div.appendChild(img);
    } else {
      // single sign
      const img = document.createElement("img");
      img.src = signPathFor(value);
      div.appendChild(img);
    }

    // native dragstart set dataTransfer (for desktop drag/drop)
    div.addEventListener("dragstart", e => {
      try { e.dataTransfer.setData("text/plain", value); } catch (err) { /* ignore */ }
    });

    return div;
  }

  left.forEach(v => leftDraggables.appendChild(makeDraggableItem(v)));
  right.forEach(v => rightDraggables.appendChild(makeDraggableItem(v)));
}

/* ===== UNIFIED DRAG (mouse & touch) ===== */
let dragItem = null;
let dragClone = null;
let isTouch = false;

function startDrag(e) {
  // find the draggable target at pointer/touch location
  const target = e.target.closest(".draggable");
  if (!target) return;

  dragItem = target;
  isTouch = e.type && e.type.startsWith && e.type.startsWith("touch");

  const rect = target.getBoundingClientRect();

  // create floating clone
  dragClone = target.cloneNode(true);
  dragClone.style.position = "fixed";
  dragClone.style.left = rect.left + "px";
  dragClone.style.top = rect.top + "px";
  dragClone.style.width = rect.width + "px";
  dragClone.style.height = rect.height + "px";
  dragClone.style.opacity = "0.85";
  dragClone.style.pointerEvents = "none";
  dragClone.style.zIndex = "10000";
  document.body.appendChild(dragClone);

  e.preventDefault();

  if (isTouch) {
    document.addEventListener("touchmove", moveDrag, { passive: false });
    document.addEventListener("touchend", endDrag);
  } else {
    document.addEventListener("mousemove", moveDrag);
    document.addEventListener("mouseup", endDrag);
  }
}

function moveDrag(e) {
  if (!dragClone) return;
  let clientX, clientY;
  if (isTouch && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  dragClone.style.left = (clientX - dragClone.offsetWidth / 2) + "px";
  dragClone.style.top = (clientY - dragClone.offsetHeight / 2) + "px";
}

function endDrag(e) {
  if (!dragItem || !dragClone) return;

  // coordinates where pointer/touch ended
  let clientX, clientY;
  if (isTouch && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const dropzones = Array.from(document.querySelectorAll(".dropzone"));
  let dropped = false;

  dropzones.forEach(dz => {
    const rect = dz.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && dz.childElementCount === 0) {
      // place the dragItem value into dz (and for level 4 combined, fill all dzs)
      const value = dragItem.dataset.value;

      // Level 4 combined draggable (5-part) — fill all in one go
      if (currentLevel === 4 && typeof value === "string" && value.split("-").length === 5) {
        const [animal, number, verb, f, colour] = value.split("-");
        const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));

        dzs.forEach(box => {
          box.innerHTML = "";
          box.classList.add("filled");
          if (box.dataset.placeholder === "animal+number") {
            const img = document.createElement("img");
            img.src = compositeImagePath(`${animal}-${number}`);
            box.appendChild(img);
            box.dataset.filled = `${animal}-${number}`;
          } else if (box.dataset.placeholder === "animal") {
            const img = document.createElement("img");
            img.src = signPathFor(animal);
            box.appendChild(img);
            box.dataset.filled = animal;
          } else if (box.dataset.placeholder === "number") {
            const img = document.createElement("img");
            img.src = signPathFor(number);
            box.appendChild(img);
            box.dataset.filled = number;
          } else if (box.dataset.placeholder === "verb") {
            const img = document.createElement("img");
            img.src = signPathFor(verb === "donthave" ? "have" : verb);
            box.appendChild(img);
            box.dataset.filled = verb;
          } else if (box.dataset.placeholder === "food+colour") {
            const img = document.createElement("img");
            img.src = compositeImagePath(`${f}-${colour}`);
            box.appendChild(img);
            // if verb === donthave, treat food slot as 'donthave'
            box.dataset.filled = verb === "donthave" ? "donthave" : `${f}-${colour}`;
            if (verb === "donthave") {
              const xDiv = document.createElement("div");
              xDiv.className = "xOverlay";
              xDiv.textContent = "X";
              box.appendChild(xDiv);
            }
          } else if (box.dataset.placeholder === "food") {
            const img = document.createElement("img");
            img.src = signPathFor(f);
            box.appendChild(img);
            box.dataset.filled = f;
            if (verb === "donthave") {
              const xDiv = document.createElement("div");
              xDiv.className = "xOverlay";
              xDiv.textContent = "X";
              box.appendChild(xDiv);
            }
          } else if (box.dataset.placeholder === "colour") {
            const img = document.createElement("img");
            img.src = signPathFor(colour);
            box.appendChild(img);
            box.dataset.filled = colour;
          }
        });
      } else {
        // standard single draggable (a single sign or a two-part composite)
        const imgClone = document.createElement("img");
        if (String(value).split("-").length === 2) {
          // composite image (animal-number or food-colour)
          imgClone.src = compositeImagePath(value);
        } else {
          imgClone.src = signPathFor(value);
        }
        dz.appendChild(imgClone);

        // If we dropped a composite and the dropzone expects 'food+colour' but the verb is donthave,
        // we will still store the actual composite value — checking handles the donthave logic.
        dz.dataset.filled = value;
        dz.classList.add("filled");
      }

      dropped = true;
    }
  });

  // cleanup clone + listeners
  if (dragClone && dragClone.parentNode) document.body.removeChild(dragClone);
  dragClone = null;
  dragItem = null;

  if (isTouch) {
    document.removeEventListener("touchmove", moveDrag, { passive: false });
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }

  // update buttons
  if (dropped) {
    againBtn.style.display = "inline-block";
    const allFilled = Array.from(answerArea.querySelectorAll(".dropzone")).every(d => d.dataset.filled);
    checkBtn.style.display = allFilled ? "inline-block" : "none";
  }
}

// attach global listeners for unified dragging
document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, { passive: false });

/* ===== DROP HANDLER (HTML5 drop event) ===== */
function dropHandler(e) {
  e.preventDefault();
  const dz = e.currentTarget;
  if (dz.childElementCount > 0) return;

  // get value from dataTransfer (desktop drag) or fallback
  let value = "";
  try { value = e.dataTransfer.getData("text/plain"); } catch (_) { /* ignore */ }

  // if empty and we have a dragItem (from unified drag), use its dataset
  if (!value && dragItem) value = dragItem.dataset.value;

  if (!value) return;

  // Level 4 combined draggable: fill all dropzones in one action
  if (currentLevel === 4 && String(value).split("-").length === 5) {
    const [animal, number, verb, f, colour] = String(value).split("-");
    const dzs = Array.from(answerArea.querySelectorAll(".dropzone"));
    dzs.forEach(box => {
      box.innerHTML = "";
      box.classList.add("filled");
      if (box.dataset.placeholder === "animal+number") {
        const img = document.createElement("img");
        img.src = compositeImagePath(`${animal}-${number}`);
        box.appendChild(img);
        box.dataset.filled = `${animal}-${number}`;
      } else if (box.dataset.placeholder === "animal") {
        const img = document.createElement("img");
        img.src = signPathFor(animal);
        box.appendChild(img);
        box.dataset.filled = animal;
      } else if (box.dataset.placeholder === "number") {
        const img = document.createElement("img");
        img.src = signPathFor(number);
        box.appendChild(img);
        box.dataset.filled = number;
      } else if (box.dataset.placeholder === "verb") {
        const img = document.createElement("img");
        img.src = signPathFor(verb === "donthave" ? "have" : verb);
        box.appendChild(img);
        box.dataset.filled = verb;
      } else if (box.dataset.placeholder === "food+colour") {
        const img = document.createElement("img");
        img.src = compositeImagePath(`${f}-${colour}`);
        box.appendChild(img);
        box.dataset.filled = verb === "donthave" ? "donthave" : `${f}-${colour}`;
        if (verb === "donthave") {
          const xDiv = document.createElement("div");
          xDiv.className = "xOverlay";
          xDiv.textContent = "X";
          box.appendChild(xDiv);
        }
      } else if (box.dataset.placeholder === "food") {
        const img = document.createElement("img");
        img.src = signPathFor(f);
        box.appendChild(img);
        box.dataset.filled = f;
        if (verb === "donthave") {
          const xDiv = document.createElement("div");
          xDiv.className = "xOverlay";
          xDiv.textContent = "X";
          box.appendChild(xDiv);
        }
      } else if (box.dataset.placeholder === "colour") {
        const img = document.createElement("img");
        img.src = signPathFor(colour);
        box.appendChild(img);
        box.dataset.filled = colour;
      }
    });
  } else {
    // single draggable -> put its preview into the dropzone
    const img = document.createElement("img");
    if (String(value).split("-").length === 2) img.src = compositeImagePath(value);
    else img.src = signPathFor(value);
    dz.appendChild(img);
    dz.dataset.filled = value;
    dz.classList.add("filled");
  }

  againBtn.style.display = "inline-block";
  const allFilled = Array.from(answerArea.querySelectorAll(".dropzone")).every(d => d.dataset.filled);
  checkBtn.style.display = allFilled ? "inline-block" : "none";

  // cleanup dragClone if present (touch drag)
  if (dragClone && dragClone.parentNode) document.body.removeChild(dragClone);
  dragClone = null;
  dragItem = null;
}

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click", () => {
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;

  dropzones.forEach((dz, i) => {
    // compute expected for each dropzone according to current level & round mode
    let expected = "";

    if (currentLevel === 1) {
      if ((roundInLevel % 2) === 1) {
        // odd: separate animal / number
        expected = (dz.dataset.placeholder === "animal") ? currentSentence.animal : currentSentence.number;
      } else {
        expected = `${currentSentence.animal}-${currentSentence.number}`;
      }
    } else if (currentLevel === 2) {
      if ((roundInLevel % 2) === 1) {
        expected = (dz.dataset.placeholder === "food") ? currentSentence.food : currentSentence.colour;
      } else {
        expected = `${currentSentence.food}-${currentSentence.colour}`;
      }
    } else if (currentLevel === 3) {
      if ((roundInLevel % 2) === 1) {
        // odd: animal, number, verb, food, colour
        const seq = [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];
        if (dz.dataset.placeholder === "animal") expected = seq[0];
        else if (dz.dataset.placeholder === "number") expected = seq[1];
        else if (dz.dataset.placeholder === "verb") expected = seq[2];
        else if (dz.dataset.placeholder === "food") expected = seq[3];
        else if (dz.dataset.placeholder === "colour") expected = seq[4];
      } else {
        // even: combos + verb
        const combos = [`${currentSentence.animal}-${currentSentence.number}`, currentSentence.verb, `${currentSentence.food}-${currentSentence.colour}`];
        if (dz.dataset.placeholder === "animal+number") expected = combos[0];
        else if (dz.dataset.placeholder === "verb") expected = combos[1];
        else if (dz.dataset.placeholder === "food+colour") expected = combos[2];
      }
    } else if (currentLevel === 4) {
      // Level 4 expected values: either split or combos (verb in middle)
      if ((roundInLevel % 2) === 1) {
        // odd: split placeholders
        const seq = [currentSentence.animal, currentSentence.number, currentSentence.verb, currentSentence.food, currentSentence.colour];
        if (dz.dataset.placeholder === "animal") expected = seq[0];
        else if (dz.dataset.placeholder === "number") expected = seq[1];
        else if (dz.dataset.placeholder === "verb") expected = seq[2];
        else if (dz.dataset.placeholder === "food") expected = seq[3];
        else if (dz.dataset.placeholder === "colour") expected = seq[4];
      } else {
        const seq = [`${currentSentence.animal}-${currentSentence.number}`, currentSentence.verb, `${currentSentence.food}-${currentSentence.colour}`];
        if (dz.dataset.placeholder === "animal+number") expected = seq[0];
        else if (dz.dataset.placeholder === "verb") expected = seq[1];
        else if (dz.dataset.placeholder === "food+colour") expected = currentSentence.verb === "donthave" ? "donthave" : seq[2];
      }
    }

    // treat permanent prefilled (level 3 verb) correctly and don't clear it
    if (dz.dataset.permanent === "true") {
      // it's prefilled with "want" — treat as correct
      if (dz.dataset.filled === expected) {
        correctCount++;
        perLevelResults[currentLevel - 1].correct++;
        dz.classList.add("correct");
      } else {
        // shouldn't happen because permanent is set to the expected 'want', but leave safeguard
        dz.classList.add("incorrect");
        incorrectCount++;
        perLevelResults[currentLevel - 1].incorrect++;
      }
      return; // move to next dropzone (do NOT clear permanent)
    }

    // compare filled value (string) with expected
    if (dz.dataset.filled === expected) {
      correctCount++;
      perLevelResults[currentLevel - 1].correct++;
      dz.classList.add("correct");
    } else {
      incorrectCount++;
      perLevelResults[currentLevel - 1].incorrect++;
      allCorrect = false;

      // clear incorrect only (do not touch permanent)
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("filled");
      dz.classList.add("incorrect");
    }
  });

  // show feedback image
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  feedbackDiv.appendChild(fb);

  saveProgress();

  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if (allCorrect) {
      nextRound();
    } else {
      // rebuild draggables for retry (perm verb remains)
      buildDraggables((roundInLevel % 2) === 1);
      checkBtn.style.display = "none";
      againBtn.style.display = "inline-block";
    }
  }, 1200);
});

/* ===== AGAIN BUTTON ===== */
againBtn.addEventListener("click", () => {
  buildDraggables((roundInLevel % 2) === 1);
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz => {
    if (dz.dataset.permanent !== "true") { // keep permanent verb
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("correct", "incorrect", "filled");
    } else {
      dz.classList.add("correct"); // permanent 'want' stays correct
    }
  });
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== GAME FLOW & STOP / END modals ===== */
document.getElementById("stopBtn").addEventListener("click", () => {
  // pause timer
  savedTimeElapsed = getTimeElapsed();
  startTime = null;

  const total = correctCount + incorrectCount;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // show stop modal
  const stopModal = document.getElementById("stopModal");
  stopModal.style.display = "block";
  document.getElementById("stopTime").textContent = `${Math.floor(savedTimeElapsed / 60)}m ${savedTimeElapsed % 60}s`;
  document.getElementById("stopPercent").textContent = percent + "%";

  document.getElementById("continueBtn").onclick = () => {
    stopModal.style.display = "none";
    // resume timer
    startTime = Date.now();
  };

  document.getElementById("againBtnStop").onclick = () => {
    stopModal.style.display = "none";
    resetGame();
  };

  document.getElementById("finishBtnStop").onclick = async () => {
    stopModal.style.display = "none";
    // submit and finish
    await endGame();
    window.location.href = "../index.html";
  };
});

function nextRound() {
  roundInLevel++;
  if (roundInLevel >= 10) {
    endLevel();
  } else {
    buildQuestion();
    saveProgress();
  }
}

async function endLevel() {
  // if there are more levels, advance and restart rounds
  if (currentLevel < TOTAL_LEVELS) {
    currentLevel++;
    roundInLevel = 0;
    saveProgress();
    startGame(); // build next level question
    return;
  }

  // otherwise final end-of-game
  await endGame();
}

/* ===== END GAME (submit + modal) ===== */
async function endGame() {
  const timeTaken = getTimeElapsed();
  const total = correctCount + incorrectCount;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // submit to Google Form (no-cors)
  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);

  // append per-level counts
  for (let l = 1; l <= TOTAL_LEVELS; l++) {
    const cf = FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf = FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if (cf) fd.append(cf, perLevelResults[l - 1].correct);
    if (inf) fd.append(inf, perLevelResults[l - 1].incorrect);
  }

  try {
    await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" });
  } catch (err) {
    // no-cors will throw — ignore, submission is attempted
    console.warn("Form submission attempted (no-cors).", err);
  }

  clearProgress();

  // Show End Modal info
  const elapsedSecs = Math.floor((Date.now() - (startTime || Date.now()) + savedTimeElapsed) / 1000);
  const mins = Math.floor(elapsedSecs / 60);
  const secs = elapsedSecs % 60;

  const endGif = document.getElementById("endGif");
  if (endGif) endGif.src = "assets/auslan-clap.gif";

  const finalTimeEl = document.getElementById("finalTime");
  if (finalTimeEl) finalTimeEl.textContent = `${mins}:${String(secs).padStart(2, "0")}`;

  const finalScoreEl = document.getElementById("finalScore");
  if (finalScoreEl) finalScoreEl.textContent = `${correctCount}/${total}`;

  const finalPercentEl = document.getElementById("finalPercent");
  if (finalPercentEl) finalPercentEl.textContent = percent + "%";

  endModal.style.display = "block";

  // End modal buttons
  const finishBtn = document.getElementById("finishBtn");
  const againBtnEnd = document.getElementById("againBtnEnd");
  const logoffBtn = document.getElementById("logoffBtn");

  if (finishBtn) finishBtn.onclick = () => { window.location.href = "../index.html"; };
  if (againBtnEnd) againBtnEnd.onclick = () => { endModal.style.display = "none"; resetGame(); };
  if (logoffBtn) logoffBtn.onclick = () => { window.location.href = "../index.html"; };
}

/* ===== START / RESET / UPDATE UI ===== */
function startGame() {
  startTime = Date.now();
  buildQuestion();
}
function resetGame() {
  currentLevel = 1;
  roundInLevel = 0;
  correctCount = 0;
  incorrectCount = 0;
  savedTimeElapsed = 0;
  perLevelResults = Array.from({ length: TOTAL_LEVELS }, () => ({ correct: 0, incorrect: 0 }));
  startGame();
}
function updateScoreDisplay() {
  scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel + 1}/10`;
}

/* ===== INIT on load ===== */
window.addEventListener("load", () => {
  const saved = loadProgress();
  if (saved && saved.studentName) {
    showResumeModal(saved);
  } else {
    resetGame();
  }
});

  // --- Render draggables ---
  const leftDiv = document.getElementById("draggablesLeft");
  const rightDiv = document.getElementById("draggablesRight");
  leftDiv.innerHTML = "";
  rightDiv.innerHTML = "";

  shuffle(items).forEach((val, idx) => {
    const drag = document.createElement("div");
    drag.className = "draggable";
    drag.draggable = true;
    drag.dataset.value = val;

    const img = document.createElement("img");
    img.src = val.includes("-") ? compositeImagePath(val) : signPathFor(val);
    drag.appendChild(img);

    // Events for drag+touch
    drag.addEventListener("dragstart", dragStartHandler);
    drag.addEventListener("touchstart", touchStartHandler, { passive: true });
    drag.addEventListener("touchmove", touchMoveHandler, { passive: false });
    drag.addEventListener("touchend", touchEndHandler);

    if (idx % 2 === 0) leftDiv.appendChild(drag);
    else rightDiv.appendChild(drag);
  });

  items = shuffleArray(items);
  const halves = [items.slice(0,8), items.slice(8,16)];

  halves.forEach((group, idx) => {
    const container = idx === 0 ? leftDraggables : rightDraggables;
    group.forEach(val => {
      const div = document.createElement("div");
      div.className = "draggable";
      div.draggable = true;
      div.dataset.originalParent = idx === 0 ? "draggablesLeft" : "draggablesRight";

      // For level4 we used the convention:
      // - individual sign draggables are plain strings (word)
      // - composite with X is like "food-colour-X"
      // - composite without X is "food-colour" or "animal-number"

      if(typeof val === "string"){
        if(val.includes("-")){ // composite
          // If composite ends with -X, treat as composite with X overlay
          if(val.endsWith("-X")){
            const base = val.replace(/-X$/, "");
            const img = document.createElement("img");
            img.src = compositeImagePath(base);
            const wrapper = document.createElement("div");
            wrapper.className = "dontHaveWrapper";
            wrapper.appendChild(img);
            const xDiv = document.createElement("div");
            xDiv.className = "xOverlay";
            xDiv.textContent = "X";
            wrapper.appendChild(xDiv);
            div.appendChild(wrapper);
            div.dataset.value = val; // e.g. "apple-red-X"
          } else {
            const img = document.createElement("img");
            // Decide: show composite image or composite sign path? use compositeImagePath
            img.src = compositeImagePath(val);
            div.appendChild(img);
            div.dataset.value = val; // e.g. "dog-two" or "apple-red"
          }
        } else {
          // single sign
          const img = document.createElement("img");
          img.src = signPathFor(val);
          div.appendChild(img);
          div.dataset.value = val; // e.g. "dog" or "have"
        }
      } else {
        // fallback: render text
        div.textContent = String(val);
        div.dataset.value = String(val);
      }

      div.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", div.dataset.value));
      container.appendChild(div);
    });
  });
}

/* ===== UNIFIED DRAG & DROP ===== */
function startDrag(e){
  const target = e.target.closest(".draggable");
  if(!target) return;
  dragItem = target;
  isTouch = e.type.startsWith("touch");
  const rect = target.getBoundingClientRect();
  dragClone = target.cloneNode(true);
  Object.assign(dragClone.style, {
    position: "fixed",
    left: rect.left + "px",
    top: rect.top + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    opacity: "0.7",
    pointerEvents: "none",
    zIndex: "10000"
  });
  document.body.appendChild(dragClone);
  e.preventDefault();
  if(isTouch){
    document.addEventListener("touchmove", moveDrag, {passive:false});
    document.addEventListener("touchend", endDrag);
  } else {
    document.addEventListener("mousemove", moveDrag);
    document.addEventListener("mouseup", endDrag);
  }
}
function moveDrag(e){
  if(!dragClone) return;
  let clientX, clientY;
  if(isTouch && e.touches && e.touches.length>0){ clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }
  dragClone.style.left = clientX - dragClone.offsetWidth/2 + "px";
  dragClone.style.top = clientY - dragClone.offsetHeight/2 + "px";
}
function endDrag(e){
  if(!dragItem || !dragClone) return;
  let clientX, clientY;
  if(isTouch && e.changedTouches && e.changedTouches.length>0){ clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }

  let dropped = false;
  document.querySelectorAll(".dropzone").forEach(dz => {
    const rect = dz.getBoundingClientRect();
    if(clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom && dz.childElementCount === 0){
      // append clone of the draggable so original remains
      const node = dragItem.cloneNode(true);
      node.classList.remove("draggable"); // optional
      dz.appendChild(node);
      dz.dataset.filled = dragItem.dataset.value; // record the value (e.g. "dog" or "apple-red-X")
      dz.classList.add("filled");
      dropped = true;
    }
  });

  if(dragClone) document.body.removeChild(dragClone);
  dragClone = null;
  dragItem = null;
  if(isTouch){
    document.removeEventListener("touchmove", moveDrag, {passive:false});
    document.removeEventListener("touchend", endDrag);
  } else {
    document.removeEventListener("mousemove", moveDrag);
    document.removeEventListener("mouseup", endDrag);
  }

  if(dropped){
    againBtn.style.display = "inline-block";
    const allFilled = Array.from(document.querySelectorAll(".dropzone")).every(d => d.dataset.filled);
    checkBtn.style.display = allFilled ? "inline-block" : "none";
  }
}

document.addEventListener("mousedown", startDrag);
document.addEventListener("touchstart", startDrag, {passive:false});

/* drop placeholder */
function dropHandler(e){ e.preventDefault(); }

/* ===== CHECK ANSWER ===== */
checkBtn.addEventListener("click", () => {
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));
  let allCorrect = true;

  dropzones.forEach((dz, i) => {
    if (dz.dataset.permanent === "true") {
      dz.classList.add("correct");
      return;
    }

    let expected = "";
    let isCorrect = false;
    const filled = dz.dataset.filled || "";

    if (currentLevel === 1) {
      expected = (roundInLevel % 2 === 1)
        ? (i === 0 ? currentSentence.animal : currentSentence.number)
        : `${currentSentence.animal}-${currentSentence.number}`;
      isCorrect = filled === expected;

    } else if (currentLevel === 2) {
      expected = (roundInLevel % 2 === 1)
        ? (i === 0 ? currentSentence.food : currentSentence.colour)
        : `${currentSentence.food}-${currentSentence.colour}`;
      isCorrect = filled === expected;

    } else if (currentLevel === 3) {
      const oddValues = [
        currentSentence.animal,
        currentSentence.number,
        currentSentence.verb,
        currentSentence.food,
        currentSentence.colour
      ];
      const evenValues = [
        `${currentSentence.animal}-${currentSentence.number}`,
        currentSentence.verb,
        `${currentSentence.food}-${currentSentence.colour}`
      ];
      expected = (roundInLevel % 2 === 1) ? oddValues[i] : evenValues[i];
      isCorrect = filled === expected;

    } else if (currentLevel === 4) {
      const isOdd = roundInLevel % 2 === 1;

      if (isOdd) {
        // QUESTION was composites -> dropzones are five separate sign placeholders
        // placeholders: animal, howmany?, verb, food, colour
        if (dz.dataset.placeholder === "animal") expected = currentSentence.animal;
        else if (dz.dataset.placeholder === "howmany?") expected = currentSentence.number;
        else if (dz.dataset.placeholder === "verb") expected = currentSentence.verb;
        else if (dz.dataset.placeholder === "food") expected = currentSentence.food;
        else if (dz.dataset.placeholder === "colour") expected = currentSentence.colour;

        if (dz.dataset.placeholder === "food" && currentSentence.verb === "donthave") {
          // accept food dragged with either value "apple" or "apple-X" (some draggables use -X)
          isCorrect = filled === expected || filled === `${expected}-X` || (filled && filled.includes(expected));
        } else {
          isCorrect = filled === expected;
        }

      } else {
        // QUESTION was separate signs -> dropzones are two composites: animal+howmany?, food+colour
        if (dz.dataset.placeholder === "animal+howmany?") {
          expected = `${currentSentence.animal}-${currentSentence.number}`;
          isCorrect = filled === expected;
        } else if (dz.dataset.placeholder === "food+colour") {
          expected = `${currentSentence.food}-${currentSentence.colour}`;
          if (currentSentence.verb === "donthave") {
            // allow X-suffixed composite
            isCorrect = filled === expected || filled === `${expected}-X` || (filled && filled.includes(expected));
          } else {
            isCorrect = filled === expected;
          }
        } else {
          // safety
          isCorrect = filled === (dz.dataset.placeholder || "");
        }
      }
    }

    // mark and record
    if (isCorrect) {
      correctCount++;
      levelCorrect[currentLevel]++;
      dz.classList.add("correct");
    } else {
      incorrectCount++;
      levelIncorrect[currentLevel]++;
      allCorrect = false;
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("correct", "filled");
      dz.classList.add("incorrect");
    }

    // Save answers for Google Form recording
    if (filled) {
      const items = filled.split("-").map(v => v.trim());
      const labels = dz.dataset.placeholder.includes("+") ? dz.dataset.placeholder.split("+") : [dz.dataset.placeholder];
      labels.forEach((lbl, idx) => {
        answersHistory.push({
          level: currentLevel,
          label: lbl,
          value: items[idx] || items.join("-") || "",
          correct: isCorrect
        });
      });
    }
  });

  // show feedback image
  const fb = document.createElement("img");
  fb.src = allCorrect ? "assets/correct.png" : "assets/wrong.png";
  feedbackDiv.appendChild(fb);
  saveProgress();

  setTimeout(() => {
    feedbackDiv.innerHTML = "";
    if (allCorrect) nextRound();
    else {
      // Return draggables to original layout but keep the question (no new question)
      restoreDraggablePositions();
      checkBtn.style.display = "none";
      againBtn.style.display = "inline-block";
    }
  }, 2000);
});

/* ===== AGAIN BUTTON ===== */
function restoreDraggablePositions(){
  // Move draggable elements back to their original parent containers
  document.querySelectorAll(".draggable").forEach(d => {
    const parentId = d.dataset.originalParent;
    const container = document.getElementById(parentId);
    if (container) container.appendChild(d);
  });
}

againBtn.addEventListener("click", () => {
  restoreDraggablePositions();
  Array.from(answerArea.querySelectorAll(".dropzone")).forEach(dz => {
    if (dz.dataset.permanent !== "true") {
      dz.innerHTML = "";
      dz.dataset.filled = "";
      dz.classList.remove("incorrect", "filled", "correct");
    } else {
      dz.classList.add("correct");
    }
  });
  checkBtn.style.display = "none";
  againBtn.style.display = "none";
});

/* ===== GAME FLOW ===== */
function nextRound(){
  roundInLevel++;
  if(roundInLevel >= 10){
    if(currentLevel < TOTAL_LEVELS){
      currentLevel++;
      roundInLevel = 0;
      buildQuestion();
      saveProgress();
    } else {
      endLevel();
    }
  } else {
    buildQuestion();
    saveProgress();
  }
}

/* ===== FULLY MERGED STOP/FINISH/AGAIN WITH GOOGLE FORM SUBMISSION ===== */
async function submitResults(){
  const timeTaken = getTimeElapsed();
  const totalCorrect = Object.values(levelCorrect).reduce((a,b)=>a+b,0);
  const totalAttempts = totalCorrect + Object.values(levelIncorrect).reduce((a,b)=>a+b,0);
  const percent = totalAttempts>0 ? Math.round((totalCorrect/totalAttempts)*100) : 0;

  const fd = new FormData();
  fd.append(FORM_FIELD_MAP.name, studentName);
  fd.append(FORM_FIELD_MAP.class, studentClass);
  fd.append(FORM_FIELD_MAP.subject, "Sentences");
  fd.append(FORM_FIELD_MAP.timeTaken, timeTaken);
  fd.append(FORM_FIELD_MAP.percent, percent);

  for(let l=1; l<=TOTAL_LEVELS; l++){
    const cf = FORM_FIELD_MAP[`level${l}`]?.correct;
    const inf = FORM_FIELD_MAP[`level${l}`]?.incorrect;
    if(cf) fd.append(cf, formatAnswersForLevel(l, true));
    if(inf) fd.append(inf, formatAnswersForLevel(l, false));
  }

  try { await fetch(googleForm.action, { method: "POST", body: fd, mode: "no-cors" }); }
  catch(err){ console.warn("Form submission failed", err); }
}

function formatAnswersForLevel(level, correct=true){
  return answersHistory
    .filter(a => a.level === level && a.correct === correct)
    .sort((a,b) => a.label.localeCompare(b.label))
    .map(a => `${a.label}-${a.value}`)
    .join(",");
}

/* ===== END LEVEL/FINISH LOGIC ===== */
async function endLevel(){
  await submitResults();
  clearProgress();
  endModal.style.display = "block";
  document.getElementById("endGif").src = "assets/auslan-clap.gif";
  const totalCorrect = correctCount;
  const totalAttempts = correctCount + incorrectCount;
  document.getElementById("finalScore").textContent = `${totalCorrect}/${totalAttempts}`;
  document.getElementById("finalPercent").textContent = Math.round((totalCorrect/totalAttempts)*100) + "%";
}

/* ===== END MODAL BUTTONS ===== */
finishBtn.onclick = () => window.location.href = "../index.html";
againBtnEnd.onclick = () => { endModal.style.display = "none"; resetGame(); };

/* ===== STOP BUTTON ===== */
stopBtn.addEventListener("click", () => {
  savedTimeElapsed = getTimeElapsed();
  const percent = Math.round((correctCount/(correctCount+incorrectCount))*100);
  const modal = document.getElementById("stopModal"); modal.style.display = "block";
  document.getElementById("stopTime").textContent = `${Math.floor(savedTimeElapsed/60)}m ${savedTimeElapsed%60}s`;
  document.getElementById("stopPercent").textContent = percent + "%";

  document.getElementById("continueBtn").onclick = () => { modal.style.display = "none"; startTime = Date.now(); };
  document.getElementById("againBtnStop").onclick = () => { modal.style.display = "none"; resetGame(); };
  document.getElementById("finishBtnStop").onclick = async () => {
    modal.style.display = "none";
    await submitResults();
    clearProgress();
    window.location.href = "../index.html";
  };
});

/* ===== START/RESET GAME ===== */
function startGame(){ startTime = Date.now(); buildQuestion(); }
function resetGame(){ currentLevel = 1; roundInLevel = 0; correctCount = 0; incorrectCount = 0; savedTimeElapsed = 0; startGame(); }
function updateScoreDisplay(){ scoreDisplay.textContent = `Level ${currentLevel} - Question ${roundInLevel+1}/10`; }

/* ===== INIT ===== */
window.addEventListener("load", () => {
  const saved = loadProgress();
  if (saved && saved.studentName) showResumeModal(saved);
  else resetGame();
});
