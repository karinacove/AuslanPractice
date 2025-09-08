/* ============================
   Sentences Game - script.js
   Full game logic + recording + Google Form wiring
   ============================ */

/* ===== CONFIG ===== */
// If you have an Apps Script / server endpoint that accepts multipart/form-data
// and returns JSON { url: "https://..." } for uploaded files, put it here.
// If left empty, uploads will fall back to prompting a local download.
const UPLOAD_ENDPOINT = ""; // <-- replace with your upload endpoint if available

// Google Form mapping for saving per-level results (update if you have different IDs)
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
  // If you have Level5-10 ids, add them here similarly.
  videoField: "entry.116543611" // We'll store a semicolon-separated list of video URLs / placeholders here
};

/* ===== Student Info / DOM refs ===== */
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

// hidden google form
const googleForm = document.getElementById("googleForm");

/* Redirect if not signed in (keeps behaviour from your earlier script) */
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html";
} else {
  studentNameSpan.textContent = studentName;
  studentClassSpan.textContent = studentClass;
  if (document.getElementById("formName")) document.getElementById("formName").value = studentName;
  if (document.getElementById("formClass")) document.getElementById("formClass").value = studentClass;
}

/* ===== Game Variables ===== */
let currentLevel = 1;           // 1..10
let roundInLevel = 0;           // 0..9 (we will increment when question answered), up to 10 questions per level
let correctCount = 0;           // per-level correct tally
let incorrectCount = 0;         // per-level incorrect tally
let currentSentence = {};       // { animal, number, verb, food, colour }
let expectedDrops = [];         // array of expected identifiers (e.g., ['dog-one','apple-red'] or ['animal','number','verb','food','colour'])
let mode = "image";             // 'image' | 'sign' | 'record'
let collectedVideoURLs = [];    // for level 5 recordings (URLs or placeholders)
let startTime = null;

/* ===== Vocabulary ===== */
const animals = ["dog", "cat", "mouse", "bird", "fish", "rabbit"];
const numbers = ["one","two","three","four","five","six","seven","eight","nine","ten"];
const foods = ["apple","banana","pear","grape","orange","strawberry","watermelon"];
const colours = ["red","yellow","white","green","pink","purple","black","brown","orange","blue"];
const verbsBasic = ["want"];
const verbsAll = ["want","eat","like","have","see"]; // adjust if you need more

/* ===== Helpers ===== */
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }

// build sign path for an individual word
function signPathFor(word) {
  if (animals.includes(word)) return `assets/signs/animals/${word}-sign.png`;
  if (numbers.includes(word)) return `assets/signs/numbers/${word}-sign.png`;
  if (foods.includes(word)) return `assets/signs/food/${word}-sign.png`;
  if (colours.includes(word)) return `assets/signs/colours/${word}-sign.png`;
  if (verbsAll.includes(word)) return `assets/signs/verbs/${word}-sign.png`;
  return null;
}

// composite image path for combos like "dog-one" or "apple-red"
function compositeImagePath(combo) {
  return `assets/images/${combo}.png`;
}

/* ===== Sentence generation =====
   Always produce full components (animal, number, verb, food, colour).
   The "verb" chosen depends on level (levels 1-5 => want only).
*/
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

/* ===== Decide expected components by level+mode =====
   - image mode:
       level 1 -> ['animal-number']
       level 2 -> ['food-colour']
       level 3+ -> ['animal-number','food-colour']
   - sign mode:
       level 1 -> ['animal','number']
       level 2 -> ['food','colour']
       level 3+ -> ['animal','number','verb','food','colour']
*/
function expectedComponentsFor(level, mode) {
  if (mode === "image") {
    if (level === 1) return ['animal-number'];
    if (level === 2) return ['food-colour'];
    return ['animal-number', 'food-colour'];
  } else if (mode === "sign") {
    if (level === 1) return ['animal','number'];
    if (level === 2) return ['food','colour'];
    return ['animal','number','verb','food','colour'];
  } else {
    return []; // recording mode will handle itself
  }
}

/* ===== UI builders ===== */
function clearUI() {
  sentenceDiv.textContent = "";
  imageDiv.innerHTML = "";
  answerArea.innerHTML = "";
  draggableOptions.innerHTML = "";
  feedbackDiv.innerHTML = "";
}

function buildPromptForCurrentQuestion() {
  // For clarity we show signed images (not English) as the user requested.
  imageDiv.innerHTML = "";

  // If image-mode: show sign(s) of the components the student should look for.
  // If sign-mode: show the composite image(s) of the scene (animal-number and food-colour)
  if (mode === "image") {
    // show sign images for the components (helps students know which images to pick)
    expectedDrops.forEach(comp => {
      if (comp === 'animal-number') {
        // show animal sign + number sign together
        const imgA = document.createElement("img");
        imgA.src = signPathFor(currentSentence.animal);
        imgA.alt = currentSentence.animal;
        imgA.className = "promptSign";
        const imgN = document.createElement("img");
        imgN.src = signPathFor(currentSentence.number);
        imgN.alt = currentSentence.number;
        imgN.className = "promptSign";
        imageDiv.appendChild(imgA);
        imageDiv.appendChild(imgN);
      } else if (comp === 'food-colour') {
        const imgF = document.createElement("img");
        imgF.src = signPathFor(currentSentence.food);
        imgF.alt = currentSentence.food;
        imgF.className = "promptSign";
        const imgC = document.createElement("img");
        imgC.src = signPathFor(currentSentence.colour);
        imgC.alt = currentSentence.colour;
        imgC.className = "promptSign";
        imageDiv.appendChild(imgF);
        imageDiv.appendChild(imgC);
      }
    });
    // also show verb sign in prompt if level >= 3 (helps comprehension)
    if (currentLevel >= 3) {
      const v = document.createElement("img");
      v.src = signPathFor(currentSentence.verb);
      v.alt = currentSentence.verb;
      v.className = "promptSign";
      imageDiv.appendChild(v);
    }
  } else if (mode === "sign") {
    // show the composite image(s) of the scene so students can sign it back using signs
    if (currentLevel === 1) {
      const combo = `${currentSentence.animal}-${currentSentence.number}`;
      const img = document.createElement("img");
      img.src = compositeImagePath(combo);
      img.alt = combo;
      img.className = "promptImage";
      imageDiv.appendChild(img);
    } else if (currentLevel === 2) {
      const combo = `${currentSentence.food}-${currentSentence.colour}`;
      const img = document.createElement("img");
      img.src = compositeImagePath(combo);
      img.alt = combo;
      img.className = "promptImage";
      imageDiv.appendChild(img);
    } else {
      // show both composites side by side
      const combo1 = `${currentSentence.animal}-${currentSentence.number}`;
      const combo2 = `${currentSentence.food}-${currentSentence.colour}`;
      const img1 = document.createElement("img");
      img1.src = compositeImagePath(combo1);
      img1.alt = combo1;
      img1.className = "promptImage";
      const img2 = document.createElement("img");
      img2.src = compositeImagePath(combo2);
      img2.alt = combo2;
      img2.className = "promptImage";
      imageDiv.appendChild(img1);
      imageDiv.appendChild(img2);
    }
  } else if (mode === "record") {
    // For recording we also display the signed prompt (verbs signs and component signs)
    // student will record themselves signing the sentence
    // Show animal sign + number sign + verb sign + food sign + colour sign
    const parts = ['animal','number','verb','food','colour'];
    parts.forEach(p => {
      const img = document.createElement("img");
      if (p === 'animal') img.src = signPathFor(currentSentence.animal);
      else if (p === 'number') img.src = signPathFor(currentSentence.number);
      else if (p === 'verb') img.src = signPathFor(currentSentence.verb);
      else if (p === 'food') img.src = signPathFor(currentSentence.food);
      else if (p === 'colour') img.src = signPathFor(currentSentence.colour);
      img.alt = p;
      img.className = "promptSign";
      imageDiv.appendChild(img);
    });
  }
}

/* ===== Dropzone creation for expected components ===== */
function buildAnswerDropzones() {
  answerArea.innerHTML = "";
  expectedDrops.forEach((exp, idx) => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.expected = exp; // either 'dog-one' or 'animal' etc.
    dz.dataset.filled = "";     // will be set to dropped value
    dz.addEventListener("dragover", e => e.preventDefault());
    dz.addEventListener("drop", dropHandler);
    // visually show the expected slot (for sign-mode show small placeholder)
    answerArea.appendChild(dz);
  });
}

/* ===== Build draggable pool =====
   - For image mode: pool of composite images (animal-number and food-colour combos).
   - For sign mode: pool of sign words (animal, number, verb, food, colour).
   Always produce 16 items (correct items included), shuffled.
*/
function buildDraggablesForCurrentQuestion() {
  draggableOptions.innerHTML = "";
  const pool = new Set();

  if (mode === "image") {
    // add correct composite(s)
    if (expectedDrops.includes('animal-number')) pool.add(`${currentSentence.animal}-${currentSentence.number}`);
    if (expectedDrops.includes('food-colour')) pool.add(`${currentSentence.food}-${currentSentence.colour}`);

    // add composite decoys (generate a mix of animal-number and food-colour combos)
    while (pool.size < 16) {
      const pickType = (Math.random() < 0.5) ? 'animal-number' : 'food-colour';
      if (pickType === 'animal-number') {
        const a = randomItem(animals);
        const n = randomItem(numbers);
        pool.add(`${a}-${n}`);
      } else {
        const f = randomItem(foods);
        const c = randomItem(colours);
        pool.add(`${f}-${c}`);
      }
    }

    // create draggable elements (composite images)
    shuffleArray(Array.from(pool)).forEach(item => {
      const div = document.createElement("div");
      div.className = "draggable";
      div.draggable = true;
      div.dataset.value = item; // composite key

      const img = document.createElement("img");
      img.src = compositeImagePath(item);
      img.alt = item;
      img.className = "draggableImage";
      div.appendChild(img);

      div.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", item);
      });

      draggableOptions.appendChild(div);
    });

  } else if (mode === "sign") {
    // add correct signs (words)
    expectedDrops.forEach(exp => {
      if (exp === 'animal') pool.add(currentSentence.animal);
      else if (exp === 'number') pool.add(currentSentence.number);
      else if (exp === 'verb') pool.add(currentSentence.verb);
      else if (exp === 'food') pool.add(currentSentence.food);
      else if (exp === 'colour') pool.add(currentSentence.colour);
    });

    // create a decoy pool across categories and fill until 16
    const categories = [animals, numbers, verbsAll, foods, colours];
    let catIdx = 0;
    while (pool.size < 16) {
      const arr = categories[catIdx % categories.length];
      pool.add(randomItem(arr));
      catIdx++;
    }

    shuffleArray(Array.from(pool)).forEach(word => {
      const div = document.createElement("div");
      div.className = "draggable";
      div.draggable = true;
      div.dataset.value = word;

      const img = document.createElement("img");
      const path = signPathFor(word);
      if (path) img.src = path;
      else img.src = ""; // fallback
      img.alt = word;
      img.className = "draggableImage";
      div.appendChild(img);

      div.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", word);
      });

      draggableOptions.appendChild(div);
    });
  }
}

/* ===== Drop handler ===== */
function dropHandler(e) {
  e.preventDefault();
  const value = e.dataTransfer.getData("text/plain");
  const dz = e.currentTarget; // the dropzone element
  // Only allow one child in a dropzone
  if (dz.childElementCount > 0) return;

  if (mode === "image") {
    // dropped value is composite key (e.g., "dog-one" or "apple-red")
    const img = document.createElement("img");
    img.src = compositeImagePath(value);
    img.alt = value;
    img.className = "droppedImage";
    dz.appendChild(img);
    dz.dataset.filled = value;
  } else if (mode === "sign") {
    // dropped value is a sign word (e.g., "dog" or "one")
    const img = document.createElement("img");
    const path = signPathFor(value);
    img.src = path || ""; // if missing path, still set alt
    img.alt = value;
    img.className = "droppedImage";
    dz.appendChild(img);
    dz.dataset.filled = value;
  }
}

/* ===== Check answers for the current question =====
   - Compares each dropzone.dataset.filled to dataset.expected
   - Gives feedback: correct items stay green; incorrect items shake and reset
   - Updates correctCount and incorrectCount
*/
function checkCurrentAnswer() {
  let roundCorrect = 0;
  let roundIncorrect = 0;

  const dropzones = Array.from(answerArea.querySelectorAll(".dropzone"));

  dropzones.forEach(dz => {
    const expected = dz.dataset.expected;
    const filled = dz.dataset.filled || "";

    // Normalize expected -> for composite, compute current expected value
    let expectedValue = expected;
    if (expected === 'animal-number') expectedValue = `${currentSentence.animal}-${currentSentence.number}`;
    if (expected === 'food-colour') expectedValue = `${currentSentence.food}-${currentSentence.colour}`;
    if (expected === 'animal') expectedValue = currentSentence.animal;
    if (expected === 'number') expectedValue = currentSentence.number;
    if (expected === 'verb') expectedValue = currentSentence.verb;
    if (expected === 'food') expectedValue = currentSentence.food;
    if (expected === 'colour') expectedValue = currentSentence.colour;

    if (filled === expectedValue) {
      dz.classList.add("correct");
      dz.style.borderColor = "#2e7d32";
      roundCorrect++;
    } else {
      dz.classList.add("incorrect");
      dz.classList.add("shake");
      // after 600ms reset this dropzone for retry
      setTimeout(() => {
        dz.classList.remove("shake", "incorrect");
        dz.innerHTML = "";
        dz.dataset.filled = "";
      }, 600);
      roundIncorrect++;
    }
  });

  correctCount += roundCorrect;
  incorrectCount += roundIncorrect;

  // proceed to next question after a short pause (so teacher/students can see feedback)
  setTimeout(() => {
    roundInLevel++;
    if (roundInLevel >= 10) {
      // end of level
      saveResultsForCurrentLevel();
      if (currentLevel < 10) {
        currentLevel++;
        startNewLevel();
      } else {
        endGame();
      }
    } else {
      // next question in same level
      nextQuestion();
    }
  }, 700);
}

/* ===== Recording helpers (Level 5) ===== */
let mediaRecorder = null;
let recordedBlobs = [];
let localStream = null;

async function startRecordingUI() {
  // create UI elements inside imageDiv and answerArea
  imageDiv.innerHTML = ""; answerArea.innerHTML = ""; draggableOptions.innerHTML = ""; feedbackDiv.innerHTML = "";

  // show prompt signs for the sentence
  buildPromptForCurrentQuestion();

  const controls = document.createElement("div");
  controls.className = "recordControls";

  const startBtn = document.createElement("button");
  startBtn.textContent = "Start Recording";
  const stopBtnRec = document.createElement("button");
  stopBtnRec.textContent = "Stop Recording";
  stopBtnRec.disabled = true;

  const preview = document.createElement("video");
  preview.autoplay = true;
  preview.muted = true;
  preview.playsInline = true;
  preview.className = "preview";

  const playback = document.createElement("video");
  playback.controls = true;
  playback.className = "playback";

  const submitVideoBtn = document.createElement("button");
  submitVideoBtn.textContent = "Submit Video";
  submitVideoBtn.disabled = true;

  controls.appendChild(startBtn);
  controls.appendChild(stopBtnRec);
  controls.appendChild(submitVideoBtn);
  answerArea.appendChild(controls);
  answerArea.appendChild(preview);
  answerArea.appendChild(playback);

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    preview.srcObject = localStream;
  } catch (err) {
    console.error("Camera access error:", err);
    feedbackDiv.textContent = "Camera access denied or unavailable.";
    return;
  }

  startBtn.addEventListener("click", () => {
    recordedBlobs = [];
    mediaRecorder = new MediaRecorder(localStream, { mimeType: 'video/webm;codecs=vp8,opus' });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedBlobs.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
      playback.src = URL.createObjectURL(superBuffer);
      submitVideoBtn.disabled = false;
    };
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
      feedbackDiv.textContent = "Recording stopped. Preview then submit.";
    }
  });

  submitVideoBtn.addEventListener("click", async () => {
    if (!recordedBlobs.length) {
      feedbackDiv.textContent = "No recording found.";
      return;
    }
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    feedbackDiv.textContent = "Uploading...";
    // try uploading to endpoint if provided
    try {
      let uploadedURL = null;
      if (UPLOAD_ENDPOINT && UPLOAD_ENDPOINT.length > 0) {
        // upload as multipart/form-data
        const fd = new FormData();
        const filename = `${studentName || 'student'}_${currentLevel}_q${roundInLevel+1}.webm`;
        fd.append("file", blob, filename);
        fd.append("studentName", studentName);
        fd.append("studentClass", studentClass);
        // adjust server expectation as needed
        const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        uploadedURL = json.url || json.downloadUrl || null;
      } else {
        // fallback: prompt download locally and store a placeholder string to form
        const downloadName = `${studentName || 'student'}_${currentLevel}_q${roundInLevel+1}.webm`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        uploadedURL = `LOCAL_DOWNLOAD:${downloadName}`;
      }

      // record the returned URL/placeholder
      collectedVideoURLs.push(uploadedURL || `UPLOAD_FAILED_q${roundInLevel+1}`);
      feedbackDiv.textContent = "Video saved.";
      // consider this question "answered"
      correctCount++; // treat successful submission as a correct action (you can change)
      // next question/level flow:
      roundInLevel++;
      // release webcam preview if this was final recording in level
      if (roundInLevel >= 10) {
        saveResultsForCurrentLevel();
        if (currentLevel < 10) {
          currentLevel++;
          stopLocalStream();
          startNewLevel();
        } else {
          finishGame();
        }
      } else {
        // continue to next recording prompt
        buildQuestion();
      }
    } catch (err) {
      console.error("Upload error:", err);
      feedbackDiv.textContent = "Upload failed. Try again or download locally.";
    }
  });
}

function stopLocalStream() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
}

/* ===== Save results to Google Form hidden inputs ===== */
function saveResultsForCurrentLevel() {
  // put per-level correct/incorrect into form fields where available
  const mapping = {
    1: FORM_FIELD_MAP.level1,
    2: FORM_FIELD_MAP.level2,
    3: FORM_FIELD_MAP.level3,
    4: FORM_FIELD_MAP.level4
    // add 5..10 if you have ids
  };

  const map = mapping[currentLevel];
  if (map) {
    try {
      if (document.querySelector(`[name='${map.correct}']`)) {
        document.querySelector(`[name='${map.correct}']`).value = correctCount;
      }
      if (document.querySelector(`[name='${map.incorrect}']`)) {
        document.querySelector(`[name='${map.incorrect}']`).value = incorrectCount;
      }
    } catch (err) {
      console.warn("Could not set form fields:", err);
    }
  }

  // save video URLs into a single field (if present)
  if (collectedVideoURLs.length > 0 && FORM_FIELD_MAP.videoField) {
    const joined = collectedVideoURLs.join("; ");
    const el = document.querySelector(`[name='${FORM_FIELD_MAP.videoField}']`);
    if (el) el.value = joined;
  }

  // also set name/class if present
  if (FORM_FIELD_MAP.name && document.querySelector(`[name='${FORM_FIELD_MAP.name}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.name}']`).value = studentName;
  }
  if (FORM_FIELD_MAP.class && document.querySelector(`[name='${FORM_FIELD_MAP.class}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.class}']`).value = studentClass;
  }
}

/* ===== Advance / build question flow ===== */
function startNewLevel() {
  roundInLevel = 0;
  correctCount = 0;
  incorrectCount = 0;
  collectedVideoURLs = [];
  buildQuestion();
}

function nextQuestion() {
  buildQuestion();
}

function buildQuestion() {
  clearUI();
  // generate sentence
  generateSentenceForLevel(currentLevel);

  // determine mode:
  if (currentLevel === 5) {
    mode = "record";
  } else {
    // first 5 questions of level: image mode (students pick images),
    // next 5 questions: sign mode (students drag signs)
    mode = (roundInLevel < 5) ? "image" : "sign";
  }

  if (mode === "record") {
    // for recording we still increment roundInLevel when user submits a video
    expectedDrops = []; // not used
    sentenceDiv.textContent = "Record yourself signing this sentence (watch the signed prompt)";
    buildPromptForCurrentQuestion();
    startRecordingUI();
    return;
  }

  // Set expected components for this question
  expectedDrops = expectedComponentsFor(currentLevel, mode);

  // Put prompt text (for teacher reference) — but we prefer signed images
  sentenceDiv.textContent = ""; // we use sign images in imageDiv; leave sentenceDiv empty or use it for debug

  // show prompt signs/images
  buildPromptForCurrentQuestion();

  // build dropzones
  buildAnswerDropzones();

  // build draggables (16 items)
  buildDraggablesForCurrentQuestion();
}

/* ===== End of game ===== */
function endGame() {
  const timeTaken = Math.floor((Date.now() - startTime) / 1000);
  const total = correctCount + incorrectCount;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // write summary fields if present
  if (FORM_FIELD_MAP.timeTaken && document.querySelector(`[name='${FORM_FIELD_MAP.timeTaken}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.timeTaken}']`).value = `${timeTaken}s`;
  }
  if (FORM_FIELD_MAP.percent && document.querySelector(`[name='${FORM_FIELD_MAP.percent}']`)) {
    document.querySelector(`[name='${FORM_FIELD_MAP.percent}']`).value = `${percent}`;
  }

  // save final level (currentLevel may be >4 but mapping only has 1-4)
  saveResultsForCurrentLevel();

  // submit form if exists
  if (googleForm) {
    try {
      googleForm.submit();
    } catch (err) {
      console.warn("Form submit failed:", err);
    }
  }

  stopLocalStream();
  alert(`Finished. Correct: ${correctCount} | Incorrect: ${incorrectCount} | Time: ${timeTaken}s | Accuracy: ${percent}%`);
  // redirect back to hub or index
  window.location.href = "../hub.html";
}

/* ===== UI: submit/check button handler ===== */
if (checkBtn) {
  checkBtn.addEventListener("click", () => {
    if (mode === "record") {
      feedbackDiv.textContent = "Recording questions use the recording UI; press Submit inside that panel.";
      return;
    }
    // ensure at least one placement exists
    const filled = Array.from(answerArea.querySelectorAll(".dropzone")).some(d => d.dataset.filled && d.dataset.filled.length > 0);
    if (!filled) {
      feedbackDiv.textContent = "Place your answers first.";
      return;
    }
    // check answers
    checkCurrentAnswer();
  });
}

/* ===== Stop button (save & finish) ===== */
if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    // save level results then finish
    saveResultsForCurrentLevel();
    endGame();
  });
}

/* ===== Init game ===== */
function startGame() {
  startTime = Date.now();
  currentLevel = 1;
  roundInLevel = 0;
  correctCount = 0;
  incorrectCount = 0;
  collectedVideoURLs = [];
  buildQuestion();
}

/* ===== Kick off ===== */
startGame();

/* ===== End of script ===== */
