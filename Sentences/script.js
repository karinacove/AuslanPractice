/*=========================================================
  SENTENCE BUILDER GAME v3
  Core Engine
=========================================================*/

/*=========================================================
  GOOGLE FORM MAPPING
=========================================================*/

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
    level5: { correct: "entry.116543611", incorrect: "entry.1475510168" },
    level6: { correct: "entry.2131150011", incorrect: "entry.767086245" }
};

/*=========================================================
  SAVE KEY
=========================================================*/

const SAVE_KEY = "sentenceBuilder_v3";

/*=========================================================
  DOM ELEMENTS
=========================================================*/

const studentNameSpan = document.getElementById("studentName");
const studentClassSpan = document.getElementById("studentClass");

const topicScreen = document.getElementById("topicScreen");
const topicButtons = document.querySelectorAll(".topicBtn");
const gameContainer = document.getElementById("gameContainer");

const leftDraggables = document.getElementById("draggablesLeft");
const rightDraggables = document.getElementById("draggablesRight");
const verbDraggables = document.getElementById("verbDraggables");

const sentenceRow1 = document.getElementById("sentenceRow1");
const sentenceRow2 = document.getElementById("sentenceRow2");
const sentenceRow3 = document.getElementById("sentenceRow3");

const answerArea = document.getElementById("answerArea");
const feedbackDiv = document.getElementById("feedback");

const scoreDisplay = document.getElementById("scoreDisplay");

const checkBtn = document.getElementById("checkBtn");
const stopBtn = document.getElementById("stopBtn");

const stopModal = document.getElementById("stopModal");
const resumeModal = document.getElementById("resumeModal");
const endModal = document.getElementById("endModal");

const googleForm = document.getElementById("googleForm");

/*=========================================================
  VOCABULARY
=========================================================*/

const VOCAB = {

    modifiers: {

        numbers: [
            "one","two","three","four","five",
            "six","seven","eight","nine","ten"
        ],

        colours: [
            "red","orange","yellow","green","blue",
            "purple","pink","brown","black","white"
        ],

        zones: [
            "green",
            "blue",
            "yellow",
            "red"
        ]

    },

    topics: {

        animals: [
            "dog",
            "cat",
            "rabbit",
            "bird",
            "fish",
            "mouse"
        ],

        food: [
            "apple",
            "banana",
            "blueberry",
            "grape",
            "orange",
            "pear",
            "pineapple",
            "raspberry",
            "strawberry",
            "watermelon"
        ],

        family: [
            "mum",
            "dad",
            "brother",
            "sister",
            "baby",
            "grandma",
            "grandpa"
        ],

        emotions: [
            "happy",
            "sad",
            "angry",
            "excited",
            "tired",
            "worried",
            "scared",
            "proud",
            "sick",
            "surprised"
        ]

    }

};

const TOPICS = {

    animals: {
        title: "Animals",
        helperVerb: "see",
        questionWord: "what",
        modifier: "numbers",
        signFolder: "animals",
        imageFolder: "animals"
    },

    food: {
        title: "Food",
        helperVerb: "have",
        questionWord: "what",
        modifier: "colours",
        signFolder: "food",
        imageFolder: "food"
    },

    family: {
        title: "Family",
        helperVerb: "have",
        questionWord: "who",
        modifier: "numbers",
        signFolder: "family",
        imageFolder: "family"
    },

    emotions: {
        title: "Emotions",
        helperVerb: "feel",
        questionWord: "what",
        modifier: "zones",
        signFolder: "emotions",
        imageFolder: "emotions"
    }

};

/*=========================================================
  LEVELS
=========================================================*/

const LEVELS = [

{
    level:1,
    promptType:"sign",
    answerType:"image",
    answers:1
},

{
    level:2,
    promptType:"image",
    answerType:"sign",
    answers:1
},

{
    level:3,
    promptType:"sign",
    answerType:"image",
    answers:2
},

{
    level:4,
    promptType:"image",
    answerType:"sign",
    answers:2
},

{
    level:5,
    promptType:"sign",
    answerType:"image",
    answers:3,
    includeWhy:true
},

{
    level:6,
    promptType:"image",
    answerType:"sign",
    answers:3,
    includeWhy:true
}

];

const QUESTIONS_PER_LEVEL = 10;

/*=========================================================
  GAME STATE
=========================================================*/

let selectedTopic = null;

let currentLevel = 1;
let currentRound = 1;

let candidatePool = [];

let expectedAnswers = [];

let usedQuestions = new Set();
let usedDraggables = new Set();

let correctCount = 0;
let incorrectCount = 0;

let levelCorrect = {};
let levelIncorrect = {};

LEVELS.forEach(level=>{

    levelCorrect[level.level]=0;
    levelIncorrect[level.level]=0;

});

let startTime = null;
let savedTime = 0;

let formSubmitted = false;



/*=========================================================
  HELPERS
=========================================================*/

function shuffle(array){

    const a=[...array];

    for(let i=a.length-1;i>0;i--){

        const j=Math.floor(Math.random()*(i+1));

        [a[i],a[j]]=[a[j],a[i]];

    }

    return a;

}

function randomItem(array){

    return array[Math.floor(Math.random()*array.length)];

}

function elapsedTime(){

    return savedTime +

        (startTime
            ? Math.floor((Date.now()-startTime)/1000)
            :0);

}

/*=========================================================
  ASSET HELPERS
=========================================================*/

function getCurrentTopic() {
    return TOPICS[selectedTopic];
}

function getWordSign(word) {

    const topic = getCurrentTopic();

    if (selectedTopic === "emotions") {
        return `assets/signs/${topic.signFolder}/sign-${word}.mp4`;
    }

    return `assets/signs/${topic.signFolder}/${word}-sign.png`;

}

function getModifierSign(modifier) {

    const topic = getCurrentTopic();

    return `assets/signs/${topic.modifier}/${modifier}-sign.png`;

}

function getHelperSign(helper) {

    const helpers = {

        i: "i.png",
        see: "see.png",
        have: "have.png",
        feel: "feel.png",
        what: "what.png",
        who: "who.png",
        why: "why.png"

    };

    return `assets/signs/helpers/${helpers[helper]}`;

}

function getCompositeImage(word, modifier) {

    const topic = getCurrentTopic();

    return `assets/images/${topic.imageFolder}/${word}-${modifier}.png`;

}

/*=========================================================
  BUILD CANDIDATE POOL
=========================================================*/

function buildCandidatePool() {

    candidatePool = [];

    const topic = getCurrentTopic();

    const words = VOCAB.topics[selectedTopic];

    const modifiers = VOCAB.modifiers[topic.modifier];

    words.forEach(word => {

        modifiers.forEach(modifier => {

            candidatePool.push({

                key: `${selectedTopic}::${word}::${modifier}`,

                word,

                modifier,

                image: getCompositeImage(word, modifier)

            });

        });

    });

}

/*=========================================================
  NEXT QUESTION
=========================================================*/

function getQuestionSet(answerCount) {

    const available = shuffle(

        candidatePool.filter(item =>
            !usedQuestions.has(item.key)
        )

    );

    return available.slice(0, answerCount);

}

/*=========================================================
  BUILD SENTENCE OBJECTS
=========================================================*/

function buildSentence(questionItems, level) {

    const topic = getCurrentTopic();

    const sentence = [];

    sentence.push({

        type: "helper",

        src: getHelperSign("i")

    });

    sentence.push({

        type: "helper",

        src: getHelperSign(topic.helperVerb)

    });

    sentence.push({

        type: "helper",

        src: getHelperSign(topic.questionWord)

    });

    questionItems.forEach(item => {

        if (level.promptType === "sign") {

            sentence.push({

                type: "word",

                src: getWordSign(item.word),

                video: selectedTopic === "emotions"

            });

            sentence.push({

                type: "modifier",

                src: getModifierSign(item.modifier)

            });

        }

        else {

            sentence.push({

                type: "image",

                src: item.image

            });

        }

    });

    if (level.includeWhy) {

        sentence.push({

            type: "helper",

            src: getHelperSign("why")

        });

    }

    return sentence;

}

/*=========================================================
  BUILD ANSWERS
=========================================================*/

function buildExpectedAnswers(questionItems) {

    expectedAnswers = [];

    questionItems.forEach(item => {

        expectedAnswers.push(item.key);

    });

}

/*=========================================================
  RENDER SENTENCE
=========================================================*/

function renderSentence(sentence) {

    sentenceRow1.innerHTML = "";
    sentenceRow2.innerHTML = "";
    sentenceRow3.innerHTML = "";

    let row = sentenceRow2;

    sentence.forEach(item => {

        if (item.type === "helper") {

            row = sentenceRow1;

        }

        const element = item.video
            ? document.createElement("video")
            : document.createElement("img");

        element.src = item.src;

        if (item.video) {

            element.autoplay = true;
            element.loop = true;
            element.muted = true;
            element.playsInline = true;

        }

        row.appendChild(element);

        if (item.type !== "helper") {

            row = sentenceRow2;

        }

    });

}

/*=========================================================
  BUILD QUESTION
=========================================================*/

function buildQuestion() {

    feedbackDiv.innerHTML = "";

    answerArea.innerHTML = "";

    const level = LEVELS[currentLevel - 1];

    const questionItems = getQuestionSet(level.answers);

    buildExpectedAnswers(questionItems);

    renderSentence(

        buildSentence(questionItems, level)

    );

    populateDraggables(

        questionItems,

        level

    );

    createDropZones(level.answers);

}

/*=========================================================
  PART 3 - DRAG & DROP ENGINE
=========================================================*/

/*=========================================================
  DROP ZONES
=========================================================*/

function createDropZones(answerCount) {

    answerArea.innerHTML = "";

    for (let i = 0; i < answerCount; i++) {

        const zone = document.createElement("div");

        zone.className = "dropzone";
        zone.dataset.index = i;

        zone.expected = expectedAnswers[i];
        zone.current = null;

        zone.addEventListener("dragover", handleDragOver);
        zone.addEventListener("dragleave", handleDragLeave);
        zone.addEventListener("drop", handleDrop);

        answerArea.appendChild(zone);

    }

}

/*=========================================================
  POPULATE DRAGGABLES
=========================================================*/

function populateDraggables(questionItems, level) {

    leftDraggables.innerHTML = "";
    rightDraggables.innerHTML = "";
    verbDraggables.innerHTML = "";

    const draggables = [];

    if (level.answerType === "image") {

        questionItems.forEach(item => {

            draggables.push({

                id: item.key,

                type: "image",

                asset: item.image,

                answer: item.key

            });

        });

    }

    else {

        questionItems.forEach(item => {

            draggables.push({

                id: item.key + "-word",

                type: "word",

                asset: getWordSign(item.word),

                answer: item.key,

                part: "word"

            });

            draggables.push({

                id: item.key + "-modifier",

                type: "modifier",

                asset: getModifierSign(item.modifier),

                answer: item.key,

                part: "modifier"

            });

        });

    }

    shuffle(draggables).forEach((item, index) => {

        const draggable = createDraggable(item);

        if (index % 2 === 0)
            leftDraggables.appendChild(draggable);
        else
            rightDraggables.appendChild(draggable);

    });

}

/*=========================================================
  CREATE DRAGGABLE
=========================================================*/

function createDraggable(data) {

    const wrapper = document.createElement("div");

    wrapper.className = "draggable";

    wrapper.draggable = true;

    wrapper.dataset.id = data.id;
    wrapper.dataset.answer = data.answer;
    wrapper.dataset.type = data.type;

    wrapper.dragData = data;

    let element;

    if (data.asset.endsWith(".mp4")) {

        element = document.createElement("video");

        element.src = data.asset;
        element.autoplay = true;
        element.loop = true;
        element.muted = true;
        element.playsInline = true;

    }

    else {

        element = document.createElement("img");

        element.src = data.asset;

    }

    wrapper.appendChild(element);

    attachNativeDragHandlers(wrapper);
    attachTouchHandlers(wrapper);
    attachRemoveHandlers(wrapper);

    return wrapper;

}

/*=========================================================
  HTML5 DRAG
=========================================================*/

let draggingElement = null;

function attachNativeDragHandlers(element) {

    element.addEventListener("dragstart", e => {

        draggingElement = element;

        e.dataTransfer.effectAllowed = "move";

        element.classList.add("dragging");

    });

    element.addEventListener("dragend", () => {

        element.classList.remove("dragging");

    });

}

function handleDragOver(e) {

    e.preventDefault();

    this.classList.add("dragover");

}

function handleDragLeave() {

    this.classList.remove("dragover");

}

function handleDrop(e) {

    e.preventDefault();

    this.classList.remove("dragover");

    if (!draggingElement)
        return;

    placeIntoDropzone(draggingElement, this);

}

/*=========================================================
  PLACE INTO DROPZONE
=========================================================*/

function placeIntoDropzone(draggable, zone) {

    if (zone.firstChild)
        restoreDraggable(zone.firstChild);

    const clone = draggable.cloneNode(true);

    clone.dragData = draggable.dragData;

    attachNativeDragHandlers(clone);
    attachTouchHandlers(clone);
    attachRemoveHandlers(clone);

    zone.innerHTML = "";

    zone.appendChild(clone);

    zone.current = clone.dragData.answer;

    draggable.style.visibility = "hidden";

    updateCheckButton();

}

/*=========================================================
  RESTORE
=========================================================*/

function restoreDraggable(draggable) {

    const original = document.querySelector(

        `.draggable[data-id="${draggable.dataset.id}"]`

    );

    if (original)
        original.style.visibility = "visible";

    draggable.remove();

    updateCheckButton();

}

/*=========================================================
  REMOVE HANDLERS
=========================================================*/

function attachRemoveHandlers(element) {

    element.addEventListener("dblclick", () => {

        if (!element.parentElement.classList.contains("dropzone"))
            return;

        restoreDraggable(element);

    });

    let lastTap = 0;

    element.addEventListener("touchend", () => {

        const now = Date.now();

        if (now - lastTap < 300) {

            if (element.parentElement.classList.contains("dropzone"))
                restoreDraggable(element);

        }

        lastTap = now;

    });

}

/*=========================================================
  TOUCH DRAG
=========================================================*/

function attachTouchHandlers(element) {

    let ghost = null;

    element.addEventListener("touchstart", e => {

        draggingElement = element;

        ghost = element.cloneNode(true);

        ghost.style.position = "fixed";
        ghost.style.pointerEvents = "none";
        ghost.style.zIndex = "9999";
        ghost.style.opacity = "0.8";

        document.body.appendChild(ghost);

    });

    element.addEventListener("touchmove", e => {

        if (!ghost)
            return;

        const touch = e.touches[0];

        ghost.style.left = touch.clientX - 40 + "px";
        ghost.style.top = touch.clientY - 40 + "px";

    });

    element.addEventListener("touchend", e => {

        if (ghost)
            ghost.remove();

        ghost = null;

        const touch = e.changedTouches[0];

        const target = document.elementFromPoint(

            touch.clientX,
            touch.clientY

        );

        if (!target)
            return;

        const zone = target.closest(".dropzone");

        if (!zone)
            return;

        placeIntoDropzone(element, zone);

    });

}

/*=========================================================
  CHECK BUTTON
=========================================================*/

function updateCheckButton() {

    const filled = document.querySelectorAll(

        ".dropzone img, .dropzone video"

    ).length;

    checkBtn.style.display =

        filled === expectedAnswers.length
            ? "block"
            : "none";

}

/*=========================================================
  PART 4 - ANSWER ENGINE & LEVEL PROGRESSION
=========================================================*/

/*=========================================================
  CHECK ANSWERS
=========================================================*/

checkBtn.addEventListener("click", checkAnswers);

function checkAnswers() {

    checkBtn.style.display = "none";

    const level = LEVELS[currentLevel - 1];

    let correct = true;

    if (level.answerType === "image") {

        document.querySelectorAll(".dropzone").forEach(zone => {

            if (!zone.current || zone.current !== zone.expected)
                correct = false;

        });

    } else {

        const expectedMap = {};

        expectedAnswers.forEach(key => {

            expectedMap[key] = {
                word: false,
                modifier: false
            };

        });

        document.querySelectorAll(".dropzone").forEach(zone => {

            if (!zone.firstChild) {
                correct = false;
                return;
            }

            const drag = zone.firstChild.dragData;

            if (!drag)
                correct = false;

            if (drag.part === "word")
                expectedMap[drag.answer].word = true;

            if (drag.part === "modifier")
                expectedMap[drag.answer].modifier = true;

        });

        Object.values(expectedMap).forEach(item => {

            if (!item.word || !item.modifier)
                correct = false;

        });

    }

    if (correct)
        correctAnswer();
    else
        incorrectAnswer();

}

/*=========================================================
  CORRECT
=========================================================*/

function correctAnswer() {

    feedbackDiv.innerHTML = "✅ Correct!";
    feedbackDiv.className = "correct";

    correctCount++;
    levelCorrect[currentLevel]++;

    expectedAnswers.forEach(key => usedQuestions.add(key));

    scoreDisplay.innerHTML =
        `${correctCount} / ${correctCount + incorrectCount}`;

    saveProgress();

    setTimeout(nextQuestion, 1000);

}

/*=========================================================
  INCORRECT
=========================================================*/

function incorrectAnswer() {

    feedbackDiv.innerHTML = "❌ Try Again";
    feedbackDiv.className = "incorrect";

    incorrectCount++;
    levelIncorrect[currentLevel]++;

    scoreDisplay.innerHTML =
        `${correctCount} / ${correctCount + incorrectCount}`;

    saveProgress();

    setTimeout(() => {

        feedbackDiv.innerHTML = "";

        clearDropZones();

    }, 1200);

}

/*=========================================================
  CLEAR DROP ZONES
=========================================================*/

function clearDropZones() {

    document.querySelectorAll(".dropzone").forEach(zone => {

        if (zone.firstChild)
            restoreDraggable(zone.firstChild);

        zone.current = null;

    });

}

/*=========================================================
  NEXT QUESTION
=========================================================*/

function nextQuestion() {

    currentRound++;

    if (currentRound > QUESTIONS_PER_LEVEL) {

        currentRound = 1;

        currentLevel++;

        if (currentLevel > LEVELS.length) {

            finishGame();
            return;

        }

    }

    buildQuestion();

    saveProgress();

}

/*=========================================================
  START GAME
=========================================================*/

function startGame(topic) {

    selectedTopic = topic;

    topicScreen.style.display = "none";
    gameContainer.style.display = "block";

    currentLevel = 1;
    currentRound = 1;

    correctCount = 0;
    incorrectCount = 0;

    usedQuestions.clear();

    LEVELS.forEach(level => {

        levelCorrect[level.level] = 0;
        levelIncorrect[level.level] = 0;

    });

    scoreDisplay.innerHTML = "0 / 0";

    startTime = Date.now();
    savedTime = 0;

    buildCandidatePool();

    buildQuestion();

    saveProgress();

}

/*=========================================================
  TOPIC BUTTONS
=========================================================*/

topicButtons.forEach(button => {

    button.addEventListener("click", () => {

        const topic = button.dataset.topic;

        if (!topic)
            return;

        startGame(topic);

    });

});

/*=========================================================
  PLAY AGAIN
=========================================================*/

function playAgain() {

    localStorage.removeItem(SAVE_KEY);

    topicScreen.style.display = "block";
    gameContainer.style.display = "none";

    answerArea.innerHTML = "";
    feedbackDiv.innerHTML = "";

}

/*=========================================================
  FINISH GAME
=========================================================*/

function finishGame() {

    saveProgress();

    const seconds = elapsedTime();

    const percent = Math.round(

        (correctCount /
            Math.max(1, correctCount + incorrectCount))

        * 100

    );

    document.getElementById("finalTime").textContent =
        formatTime(seconds);

    document.getElementById("finalScore").textContent =
        `${correctCount} / ${correctCount + incorrectCount}`;

    document.getElementById("finalPercent").textContent =
        percent + "%";

    endModal.style.display = "flex";

    submitGoogleForm();

}

/*=========================================================
  TIMER FORMAT
=========================================================*/

function formatTime(totalSeconds) {

    const mins = Math.floor(totalSeconds / 60);

    const secs = totalSeconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;

}

/*=========================================================
  PART 5 - SAVE / RESUME / MODALS / GOOGLE FORM
=========================================================*/

/*=========================================================
  SAVE PROGRESS
=========================================================*/

function saveProgress() {

    const saveData = {

        topic: selectedTopic,

        currentLevel,
        currentRound,

        correctCount,
        incorrectCount,

        levelCorrect,
        levelIncorrect,

        usedQuestions: [...usedQuestions],

        elapsed: elapsedTime()

    };

    localStorage.setItem(

        SAVE_KEY,

        JSON.stringify(saveData)

    );

}

/*=========================================================
  LOAD SAVE
=========================================================*/

function loadProgress() {

    const save = localStorage.getItem(SAVE_KEY);

    if (!save)
        return null;

    try {

        return JSON.parse(save);

    }

    catch {

        return null;

    }

}

/*=========================================================
  RESTORE GAME
=========================================================*/

function restoreProgress(save) {

    selectedTopic = save.topic;

    currentLevel = save.currentLevel;
    currentRound = save.currentRound;

    correctCount = save.correctCount;
    incorrectCount = save.incorrectCount;

    levelCorrect = save.levelCorrect;
    levelIncorrect = save.levelIncorrect;

    usedQuestions = new Set(save.usedQuestions);

    savedTime = save.elapsed;

    topicScreen.style.display = "none";
    gameContainer.style.display = "block";

    scoreDisplay.textContent =
        `${correctCount} / ${correctCount + incorrectCount}`;

    buildCandidatePool();

    startTime = Date.now();

    buildQuestion();

}

/*=========================================================
  CLEAR SAVE
=========================================================*/

function clearProgress() {

    localStorage.removeItem(SAVE_KEY);

}

/*=========================================================
  STOP BUTTON
=========================================================*/

stopBtn.addEventListener("click", () => {

    const answered = correctCount + incorrectCount;

    const percent = answered === 0
        ? 0
        : Math.round((correctCount / answered) * 100);

    document.getElementById("stopPercent").textContent =
        `Score so far: ${percent}%`;

    stopModal.style.display = "flex";

    saveProgress();

});

/*=========================================================
  STOP MODAL
=========================================================*/

continueBtn.addEventListener("click", () => {

    stopModal.style.display = "none";

});

againBtnStop.addEventListener("click", () => {

    stopModal.style.display = "none";

    clearProgress();

    playAgain();

});

finishBtnStop.addEventListener("click", () => {

    stopModal.style.display = "none";

    finishGame();

});

/*=========================================================
  END MODAL
=========================================================*/

againBtnEnd.addEventListener("click", () => {

    endModal.style.display = "none";

    clearProgress();

    playAgain();

});

finishBtn.addEventListener("click", () => {

    clearProgress();

    window.location.href = "../index.html";

});

/*=========================================================
  RESUME MODAL
=========================================================*/

resumeContinue.addEventListener("click", () => {

    resumeModal.style.display = "none";

    restoreProgress(window.pendingSave);

});

resumeAgain.addEventListener("click", () => {

    resumeModal.style.display = "none";

    clearProgress();

});

/*=========================================================
  GOOGLE FORM
=========================================================*/

async function submitGoogleForm() {

    if (formSubmitted)
        return;

    formSubmitted = true;

    const form = googleForm;

    form.innerHTML = "";

    function addField(name, value) {

        const input = document.createElement("input");

        input.type = "hidden";
        input.name = name;
        input.value = value;

        form.appendChild(input);

    }

    const total = correctCount + incorrectCount;

    const percent = total === 0
        ? 0
        : Math.round((correctCount / total) * 100);

    addField(FORM_FIELD_MAP.name, studentName);
    addField(FORM_FIELD_MAP.class, studentClass);
    addField(FORM_FIELD_MAP.subject, "Sentence Builder");
    addField(FORM_FIELD_MAP.timeTaken, formatTime(elapsedTime()));
    addField(FORM_FIELD_MAP.percent, percent);

    LEVELS.forEach(level => {

        const map = FORM_FIELD_MAP["level" + level.level];

        if (!map)
            return;

        addField(
            map.correct,
            levelCorrect[level.level] || 0
        );

        addField(
            map.incorrect,
            levelIncorrect[level.level] || 0
        );

    });

    form.submit();

}

/*=========================================================
  STUDENT INFO
=========================================================*/

const studentName =
    localStorage.getItem("studentName") || "";

const studentClass =
    localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {

    window.location.href = "../index.html";

}

studentNameSpan.textContent = studentName;
studentClassSpan.textContent = studentClass;

/*=========================================================
  INITIAL LOAD
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const save = loadProgress();

    if (save) {

        window.pendingSave = save;

        resumeMessage.textContent =
            `Resume your ${TOPICS[save.topic].title} game?`;

        resumeModal.style.display = "flex";

    }

});
