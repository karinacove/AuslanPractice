/* ============================
   Sentences Game - script.js
   Fixed: decoy pools, shuffle, Level5 draggables, helper functions
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
let roundInLevel = 0; // 0 .. 9
let correctCount = 0;
let incorrectCount = 0;
let currentSentence = {}; // will contain animal, number, food, colour, verb, and for level5: video & videoSigns
let expectedDrops = [];
let mode = "image";
let collectedVideoURLs = [];
let startTime = null;

/* ===== VOCABULARY & DECROY POOLS ===== */
const animals = ["dog", "cat", "mouse", "bird", "fish", "rabbit", "cow", "sheep", "horse", "pig"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const foods = ["apple","banana","pear","grape","orange","strawberry","watermelon","bread","cake","pizza"];
const colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];
const verbsBasic = ["want"];
const verbsAll = ["want","eat","like","have","see"];
const helperSigns = ["i","see","what"];

// build decoy pools (composite combos)
const allAnimals = [...animals];
const allNumbers = [...numbers];
const allFoods = [...foods];
const allColours = [...colours];

// e.g., "dog-one", "cat-two" etc
const allAnimalNumberCombos = [];
animals.forEach(a => numbers.forEach(n => allAnimalNumberCombos.push(`${a}-${n}`)));

const allFoodColourCombos = [];
foods.forEach(f => colours.forEach(c => allFoodColourCombos.push(`${f}-${c}`)));

// all pair combos (animal-number and food-colour combined)
const allPairCombos = [...allAnimalNumberCombos, ...allFoodColourCombos];

// video signs pool (for level 5) — use signs vocabulary (animals + foods + colours + numbers + verbs)
const allVideoSigns = Array.from(new Set([...animals, ...foods, ...colours, ...numbers, ...verbsAll]));

/* ===== HELPERS ===== */

// Fisher-Yates shuffle — returns the array
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
  if (foods.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (verbsAll.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  if (helperSigns.includes(word)) return `assets/signs/helpers/${word}.png`;
  return null;
}

function compositeImagePath(combo) {
  return `assets/images/${combo}.png`;
}

/* ===== SENTENCE GENERATION =====
   For levels 1-5 we produce fields required by build functions.
   Level 5 will provide: currentSentence.video (string) and currentSentence.videoSigns (array)
*/
function generateSentenceForLevel(level) {
  const animal = randomItem(animals);
  const number = randomItem(numbers);
  const food = randomItem(foods);
  const colour = randomItem(colours);
  const verbs = (level <= 5) ? verbsBasic : verbsAll;
  const verb = randomItem(verbs);

  // For level 5 we also set up a mock video + options (you should replace with your real mapping)
  if (level === 5) {
    // Example: choose 1 of 5 sample videos and related sign options
    // In practice, replace with an array of real video filenames and correct options
    const sampleVideos = [
      { video: "level5_q1.mp4", videoSigns: ["dog","cat","bird"] },
      { video: "level5_q2.mp4", videoSigns: ["apple","banana","pear"] },
      { video: "level5_q3.mp4", videoSigns: ["one","two","three"] },
      { video: "level5_q4.mp4", videoSigns: ["red","blue","pink"] },
      { video: "level5_q5.mp4", videoSigns: ["want","eat","have"] }
    ];
    const pick = randomItem(sampleVideos);
    currentSentence = { animal, number, verb, food, colour, video: pick.video, videoSigns: pick.videoSigns.slice() };
    return currentSentence;
  }

  // default
  currentSentence = { animal, number, verb, food, colour };
  return currentSentence;
}

/* ===== EXPECTED COMPONENTS ===== */
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

/* ===== UI helpers ===== */
function clearUI() {
  sentenceDiv.textContent = "";
  imageDiv.innerHTML = "";
  answerArea.innerHTML = "";
  draggableOptions.innerHTML = "";
  feedbackDiv.innerHTML = "";
  // hide check button until drop occurs
  if (checkBtn) checkBtn.style.display = "none";
}

function buildPromptForCurrentQuestion() {
  imageDiv.innerHTML = "";

  if (currentLevel === 1) {
    ['i','see','what'].forEach(w => {
      const img = document.createElement("img");
      img.src = signPathFor(w); img.alt = w; img.className = "promptSign";
      imageDiv.appendChild(img);
    });
    const combo = `${currentSentence.animal}-${currentSentence.number}`;
    const imgMain = document.createElement("img");
    imgMain.src = compositeImagePath(combo); imgMain.alt = combo; imgMain.className = "promptImage";
    imageDiv.appendChild(imgMain);
    return;
  }

  if (currentLevel === 2) {
    ['i','see','what'].forEach(w => {
      const img = document.createElement("img");
      img.src = signPathFor(w); img.alt = w; img.className = "promptSign";
      imageDiv.appendChild(img);
    });
    const combo = `${currentSentence.food}-${currentSentence.colour}`;
    const imgMain = document.createElement("img");
    imgMain.src = compositeImagePath(combo); imgMain.alt = combo; imgMain.className = "promptImage";
    imageDiv.appendChild(imgMain);
    return;
  }

  if (currentLevel === 3 || currentLevel === 4) {
    const comboAN = `${currentSentence.animal}-${currentSentence.number}`;
    const comboFC = `${currentSentence.food}-${currentSentence.colour}`;
    const imgAN = document.createElement("img");
    imgAN.src = compositeImagePath(comboAN); imgAN.alt = comboAN; imgAN.className = "promptImage";
    const imgFC = document.createElement("img");
    imgFC.src = compositeImagePath(comboFC); imgFC.alt = comboFC; imgFC.className = "promptImage";
    imageDiv.appendChild(imgAN);
    if (currentLevel === 4) {
      // "have" vs "don't have" spacing
      imgFC.style.marginLeft = currentSentence.verb === "have" ? "0px" : "50px";
    }
    imageDiv.appendChild(imgFC);
    return;
  }

  if (currentLevel === 5) {
    // show the single video (from currentSentence.video)
    if (currentSentence.video) {
      const vid = document.createElement("video");
      vid.controls = true;
      vid.width = 320;
      const src = document.createElement("source");
      src.src = `assets/videos/${currentSentence.video}`;
      src.type = "video/mp4";
      vid.appendChild(src);
      imageDiv.appendChild(vid);
    }
    return;
  }
}

/* ===== DROPZONES ===== */
function buildAnswerDropzones() {
  answerArea.innerHTML = "";
  expectedDrops.forEach(exp => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.expected = exp;
    dz.dataset.filled = "";
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    answerArea.appendChild(dz);
  });
}

/* ===== Add Decoys Helper ===== */
function addDecoys(items, pool, totalCount) {
  const result = [...items];
  const needed = totalCount - result.length;
  if (needed <= 0) return shuffleArray(result);
  const available = pool.filter(x => !result.includes(x));
  const picked = shuffleArray(available).slice(0, needed);
  result.push(...picked);
  return shuffleArray(result);
}

/* ===== DRAGGABLES ===== */
function buildDraggablesForCurrentQuestion() {
  draggableOptions.innerHTML = "";

  let items = [];
  // Alternate: even roundInLevel => signs draggable, odd => images draggable
  // (you can reverse parity if you prefer)
  const signsDraggable = roundInLevel % 2 === 0;

  if (currentLevel === 1) {
    if (signsDraggable) {
      items = [currentSentence.animal, currentSentence.number];
      // decoys must be sign words (animals or numbers)
      items = addDecoys(items, [...allAnimals, ...allNumbers], 10); // show 10 options
    } else {
      items = [`${currentSentence.animal}-${currentSentence.number}`];
      items = addDecoys(items, allAnimalNumberCombos, 8); // show 8 composite images
    }
  } else if (currentLevel === 2) {
    if (signsDraggable) {
      items = [currentSentence.food, currentSentence.colour];
      items = addDecoys(items, [...allFoods, ...allColours], 10);
    } else {
      items = [`${currentSentence.food}-${currentSentence.colour}`];
      items = addDecoys(items, allFoodColourCombos, 8);
    }
  } else if (currentLevel === 3 || currentLevel === 4) {
    if (signsDraggable) {
      items = [currentSentence.animal, currentSentence.number, currentSentence.food, currentSentence.colour];
      items = addDecoys(items, [...allAnimals, ...allNumbers, ...allFoods, ...allColours], 12);
    } else {
      items = [
        `${currentSentence.animal}-${currentSentence.number}`,
        `${currentSentence.food}-${currentSentence.colour}`
      ];
      items = addDecoys(items, allPairCombos, 8);
    }
  } else if (currentLevel === 5) {
    // Level 5: video matching — draggables are sign words (same type)
    // currentSentence.videoSigns must be an array of sign words (correct + decoys)
    // If generator only provided correct ones, add decoys from allVideoSigns
    items = Array.isArray(currentSentence.videoSigns) ? currentSentence.videoSigns.slice() : [];
    items = addDecoys(items, allVideoSigns, 8); // show 8 sign options
  } else {
    // Level 6+ not used here
    items = [];
  }

  // Build draggable DOM items
  items.forEach(word => {
    const div = document.createElement("div");
    div.className = "draggable";
    div.draggable = true;
    div.dataset.value = word;

    const img = document.createElement("img");
    // if word contains '-' treat as composite image; otherwise use sign image
    if (word.includes("-")) {
      img.src = compositeImagePath(word);
    } else {
      img.src = signPathFor(word) || ""; // signPathFor returns null if missing
    }
    img.alt = word;
    img.className = "draggableImage";
    div.appendChild(img);

    div.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", word));
    draggableOptions.appendChild(div);
  });
}

/* ===== DROP HANDLER ===== */
function dropHandler(e) {
  e.preventDefault();
  const dz = e.currentTarget;
  if (dz.childElementCount > 0) return; // one per slot
  const value = e.dataTransfer.getData("text/plain");
  const img = document.createElement("img");
  img.className = "droppedImage";
  img.alt = value;
  if (value.includes("-")) img.src = compositeImagePath(value);
  else img.src = signPathFor(value) || "";
  dz.appendChild(img);
  dz.dataset.filled = value;

  // show check button once there's at least one filled slot
  const anyFilled = Array.from(answerArea.querySelectorAll(".dropzone")).some(d => d.dataset.filled && d.dataset.filled.length > 0);
  if (anyFilled && checkBtn) checkBtn.style.display = "inline-block";
}

/* ===== CHECK ANSWER ===== */
function checkCurrentAnswer() {
  let roundCorrect = 0;
  let roundIncorrect = 0;
  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));

  dropzones.forEach(dz => {
    let expected = dz.dataset.expected;
    if (expected === 'animal-number') expected = `${currentSentence.animal}-${currentSentence.number}`;
    if (expected === 'food-colour') expected = `${currentSentence.food}-${currentSentence.colour}`;
    if (expected === 'animal') expected = currentSentence.animal;
    if (expected === 'number') expected = currentSentence.number;
    if (expected === 'verb') expected = currentSentence.verb;
    if (expected === 'food') expected = currentSentence.food;
    if (expected === 'colour') expected = currentSentence.colour;

    const filled = dz.dataset.filled || "";
    if (filled === expected) {
      dz.classList.add("correct");
      dz.style.borderColor = "#2e7d32";
      roundCorrect++;
    } else {
      dz.classList.add("incorrect", "shake");
      setTimeout(() => { dz.classList.remove("shake", "incorrect"); dz.innerHTML = ""; dz.dataset.filled = ""; }, 600);
      roundIncorrect++;
    }
  });

  correctCount += roundCorrect;
  incorrectCount += roundIncorrect;

  setTimeout(() => {
    roundInLevel++;
    if (roundInLevel >= 10) {
      saveResultsForCurrentLevel();
      if (currentLevel < 10) { currentLevel++; startNewLevel(); }
      else endGame();
    } else {
      nextQuestion();
    }
  }, 700);
}

/* ===== RECORDING (Level 5 fallback or Level6) ===== */
let mediaRecorder = null, recordedBlobs = [], localStream = null;
async function startRecordingUI(){
  imageDiv.innerHTML = ""; answerArea.innerHTML = ""; draggableOptions.innerHTML = ""; feedbackDiv.innerHTML = "";
  buildPromptForCurrentQuestion();
  const controls = document.createElement("div"); controls.className = "recordControls";
  const startBtn = document.createElement("button"); startBtn.textContent = "Start Recording";
  const stopBtnRec = document.createElement("button"); stopBtnRec.textContent = "Stop Recording"; stopBtnRec.disabled = true;
  const preview = document.createElement("video"); preview.autoplay = true; preview.muted = true; preview.playsInline = true; preview.className = "preview";
  const playback = document.createElement("video"); playback.controls = true; playback.className = "playback";
  const submitVideoBtn = document.createElement("button"); submitVideoBtn.textContent = "Submit Video"; submitVideoBtn.disabled = true;
  controls.appendChild(startBtn); controls.appendChild(stopBtnRec); controls.appendChild(submitVideoBtn);
  answerArea.appendChild(controls); answerArea.appendChild(preview); answerArea.appendChild(playback);

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    preview.srcObject = localStream;
  } catch(err) {
    feedbackDiv.textContent = "Camera access denied or unavailable.";
    return;
  }

  startBtn.addEventListener("click", () => {
    recordedBlobs = [];
    mediaRecorder = new MediaRecorder(localStream, { mimeType: 'video/webm;codecs=vp8,opus' });
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedBlobs.push(e.data); };
    mediaRecorder.onstop = () => { const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' }); playback.src = URL.createObjectURL(superBuffer); submitVideoBtn.disabled = false; };
    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtnRec.disabled = false;
    feedbackDiv.textContent = "Recording...";
  });

  stopBtnRec.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      startBtn.disabled = false;
      stopBtnRec.disabled = true;
      feedbackDiv.textContent = "Recording stopped.";
    }
  });

  submitVideoBtn.addEventListener("click", async () => {
    if (!recordedBlobs.length) { feedbackDiv.textContent = "No recording."; return; }
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    let uploadedURL = null;
    try {
      if (UPLOAD_ENDPOINT) {
        const fd = new FormData();
        const filename = `${studentName || 'student'}_${currentLevel}_q${roundInLevel+1}.webm`;
        fd.append("file", blob, filename);
        fd.append("studentName", studentName);
        fd.append("studentClass", studentClass);
        const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: fd });
        const json = await res.json();
        uploadedURL = json.url || json.downloadUrl || null;
      } else {
        const downloadName = `${studentName || 'student'}_${currentLevel}_q${roundInLevel+1}.webm`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = downloadName; document.body.appendChild(a); a.click(); a.remove();
        uploadedURL = `LOCAL_DOWNLOAD:${downloadName}`;
      }
      collectedVideoURLs.push(uploadedURL || `UPLOAD_FAILED_q${roundInLevel+1}`);
      feedbackDiv.textContent = "Video saved.";
      // count as correct for submission workflow if you like
      correctCount++;
      roundInLevel++;
      if (roundInLevel >= 10) {
        saveResultsForCurrentLevel();
        if (currentLevel < 10) { currentLevel++; stopLocalStream(); startNewLevel(); }
        else finishGame();
      } else {
        buildQuestion();
      }
    } catch(err) {
      console.error(err); feedbackDiv.textContent = "Upload failed.";
    }
  });
}

function stopLocalStream() {
  if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
}

/* ===== SAVE RESULTS ===== */
function saveResultsForCurrentLevel(){
  const mapping = {
    1: FORM_FIELD_MAP.level1, 2: FORM_FIELD_MAP.level2, 3: FORM_FIELD_MAP.level3, 4: FORM_FIELD_MAP.level4,
    5: FORM_FIELD_MAP.level5, 6: FORM_FIELD_MAP.level6, 7: FORM_FIELD_MAP.level7, 8: FORM_FIELD_MAP.level8,
    9: FORM_FIELD_MAP.level9, 10: FORM_FIELD_MAP.level10
  };
  const map = mapping[currentLevel];
  if (map) {
    try {
      if (document.querySelector(`[name='${map.correct}']`)) document.querySelector(`[name='${map.correct}']`).value = correctCount;
      if (document.querySelector(`[name='${map.incorrect}']`)) document.querySelector(`[name='${map.incorrect}']`).value = incorrectCount;
    } catch (err) { console.warn("Could not set per-level form fields", err); }
  }

  if (collectedVideoURLs.length > 0 && FORM_FIELD_MAP.videoField) {
    const joined = collectedVideoURLs.join("; ");
    const el = document.querySelector(`[name='${FORM_FIELD_MAP.videoField}']`);
    if (el) el.value = joined;
  }

  if (FORM_FIELD_MAP.name && document.querySelector(`[name='${FORM_FIELD_MAP.name}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.name}']`).value = studentName;
  }
  if (FORM_FIELD_MAP.class && document.querySelector(`[name='${FORM_FIELD_MAP.class}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.class}']`).value = studentClass;
  }
}

/* ===== QUESTION FLOW ===== */
function startNewLevel() {
  roundInLevel = 0; correctCount = 0; incorrectCount = 0; collectedVideoURLs = [];
  buildQuestion();
}
function nextQuestion() { buildQuestion(); }

function buildQuestion(){
  clearUI();
  generateSentenceForLevel(currentLevel);

  // Level5 uses video-matching; Level6 would be upload/recording level
  if (currentLevel === 5) {
    mode = "video-match";
    expectedDrops = ['sign']; // for UI; actual logic checks in check
    sentenceDiv.textContent = "Watch the video and drag the sign(s) that match.";
    buildPromptForCurrentQuestion();
    // Build dropzones: for level5 we'll create 3 slots (example)
    answerArea.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const dz = document.createElement("div");
      dz.className = "dropzone";
      dz.dataset.expected = "sign";
      dz.dataset.filled = "";
      dz.addEventListener("dragover", e => e.preventDefault());
      dz.addEventListener("drop", dropHandler);
      answerArea.appendChild(dz);
    }
    buildDraggablesForCurrentQuestion();
    return;
  }

  if (currentLevel === 6) {
    // recording/upload level
    mode = "record";
    expectedDrops = [];
    sentenceDiv.textContent = "Record (or upload) yourself signing this image.";
    // show prompt + recording UI
    buildPromptForCurrentQuestion();
    startRecordingUI();
    return;
  }

  // default: levels 1-4 alternating image/sign within the level
  mode = (roundInLevel < 5) ? "image" : "sign";
  expectedDrops = expectedComponentsFor(currentLevel, mode);
  sentenceDiv.textContent = "";
  buildPromptForCurrentQuestion();
  buildAnswerDropzones();
  buildDraggablesForCurrentQuestion();
}

/* ===== END GAME ===== */
function endGame(){
  const timeTaken = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
  const total = correctCount + incorrectCount;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  if (FORM_FIELD_MAP.timeTaken && document.querySelector(`[name='${FORM_FIELD_MAP.timeTaken}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.timeTaken}']`).value = `${timeTaken}s`;
  }
  if (FORM_FIELD_MAP.percent && document.querySelector(`[name='${FORM_FIELD_MAP.percent}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.percent}']`).value = `${percent}`;
  }

  saveResultsForCurrentLevel();

  if (googleForm) {
    try { googleForm.submit(); } catch (err) { console.warn("Form submit failed", err); }
  }

  stopLocalStream();
  alert(`Finished. Correct: ${correctCount} | Incorrect: ${incorrectCount} | Time: ${timeTaken}s | Accuracy: ${percent}%`);
  window.location.href = "../index.html";
}

/* ===== BUTTON HOOKUPS ===== */
if (checkBtn) {
  checkBtn.addEventListener("click", () => {
    if (mode === "record") {
      feedbackDiv.textContent = "Use the recording panel for this question.";
      return;
    }
    const filled = Array.from(answerArea.querySelectorAll(".dropzone")).some(d => d.dataset.filled && d.dataset.filled.length > 0);
    if (!filled) { feedbackDiv.textContent = "Place your answers first."; return; }
    checkCurrentAnswer();
  });
}

if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    saveResultsForCurrentLevel();
    endGame();
  });
}

/* ===== START GAME ===== */
function startGame() {
  startTime = Date.now();
  currentLevel = 1;
  roundInLevel = 0;
  correctCount = 0;
  incorrectCount = 0;
  collectedVideoURLs = [];
  buildQuestion();
}
window.addEventListener("DOMContentLoaded", startGame);
