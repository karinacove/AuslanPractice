// -------------------------
// Student Sign-in Handling
// -------------------------
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");
const finishButton = document.getElementById("finish-btn");
const startBtnn = document.getElementByID("start-btn");

const endModal = document.getElementById("end-modal");
const scoreDisplayModal = document.getElementById("score-display");
const continueBtn = document.getElementById("continue-btn");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const logoutImg = document.getElementById("logout-btn");

if (!studentName || !studentClass) {
  alert("Please return to the sign-in page.");
  window.location.href = "../index.html";
}

document.getElementById("student-info").textContent = `👤 ${studentName} (${studentClass})`;
document.getElementById("vehicle-palette").style.display = "block";

// Form submission
form.addEventListener('start-btn', function (e) {
  e.preventDefault();
  jobDescription = form.elements['jobDescription'].value;
  partnerName = form.elements['partnerName'].value;

  form.style.display = 'none';
  palette.style.display = 'grid';
  startBtn.style.display = 'inline-block';
  studentInfo.style.display = 'block';
  studentInfo.innerText = `${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
});

let jobDescription = '';
let partnerName = '';
const MAX_VEHICLES = 12;
const palette = document.getElementById("vehicle-palette");
let dragged = null;

function startDrag(e, isTouch = false) {
  const target = isTouch ? e.targetTouches[0].target : e.target;
  if (!target.classList.contains('draggable') || target.parentElement !== palette) return;
  if (document.querySelectorAll('body > .draggable-wrapper').length >= MAX_VEHICLES) return;

  const wrapper = document.createElement('div');
  wrapper.classList.add('draggable-wrapper');
  wrapper.style.position = 'absolute';
  wrapper.style.zIndex = 1000;

  const clone = target.cloneNode(true);
  clone.classList.add("dropped-vehicle");
  clone.style.pointerEvents = 'none';
  wrapper.appendChild(clone);

  const flipBtn = document.createElement('button');
  flipBtn.className = 'flip-btn';
  flipBtn.innerHTML = '↔';
  flipBtn.style.display = 'none';
  flipBtn.onclick = (ev) => {
    ev.stopPropagation();
    clone.classList.toggle('flipped-horizontal');
  };
  wrapper.appendChild(flipBtn);

  wrapper.addEventListener('mouseenter', () => flipBtn.style.display = 'block');
  wrapper.addEventListener('mouseleave', () => flipBtn.style.display = 'none');

  document.body.appendChild(wrapper);
  dragged = wrapper;

  const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
  const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;

  dragged.offsetX = 40;
  dragged.offsetY = 40;
  dragged.style.left = (clientX - dragged.offsetX) + 'px';
  dragged.style.top = (clientY - dragged.offsetY) + 'px';

  e.preventDefault();
}

function moveDrag(e, isTouch = false) {
  if (!dragged) return;
  const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
  const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;
  dragged.style.left = (clientX - dragged.offsetX) + 'px';
  dragged.style.top = (clientY - dragged.offsetY) + 'px';
}

function endDrag() {
  if (dragged) dragged.style.zIndex = '';
  dragged = null;
}

document.body.addEventListener('mousedown', e => startDrag(e, false));
document.body.addEventListener('mousemove', e => moveDrag(e, false));
document.body.addEventListener('mouseup', endDrag);
document.body.addEventListener('touchstart', e => startDrag(e, true));
document.body.addEventListener('touchmove', e => moveDrag(e, true));
document.body.addEventListener('touchend', endDrag);

 if (finishButton) {
    finishButton.addEventListener('click', () => {
      finishButton.style.display = 'none';
      finishButtonHandler(true);
    });
  }

  // Modal Buttons
  continueBtn.addEventListener("click", () => {
    modal.style.display = "none";
    gameEnded = false;
    loadPage();
  });

  againBtn.addEventListener('click', () => {
    endModal.style.display = 'none';
    resetGame();
  });

  menuBtn.addEventListener('click', () => {
    window.location.href = "../index.html";
  });

  logoutImg.addEventListener('click', () => {
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentClass");
    window.location.href = "../index.html";
  });

// -------------------------
// Submit to Google Form
// -------------------------
document.getElementById("submit-button").addEventListener("click", () => {
  const placedVehicles = document.querySelectorAll(".draggable-wrapper");
  const vehicleData = [];

  placedVehicles.forEach(wrapper => {
    const img = wrapper.querySelector("img");
    const isFlipped = img.classList.contains("flipped-horizontal");
    vehicleData.push({
      name: img.src.split("/").pop().split(".")[0],
      x: wrapper.style.left,
      y: wrapper.style.top,
      flipped: isFlipped
    });
  });

  vehicleData.sort((a, b) => a.name.localeCompare(b.name));

  const vehicleSummary = vehicleData.map(v =>
    `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`
  ).join("; ");

  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse";

  const formData = new FormData();
  formData.append("entry.1202364028", "Mrs Cove");             // Teacher
  formData.append("entry.1957249768", studentClass);           // Class
  formData.append("entry.436910009", studentName);             // Name
  formData.append("entry.169376211", "Give");                  // Task type
  formData.append("entry.1017965571", "1");                    // Task number
  formData.append("entry.1568301781", vehicleSummary);         // Vehicle positions

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).then(() => {
    alert("✅ Submission successful!");
  }).catch(() => {
    alert("❌ Submission failed. Please try again.");
  });
});

// -------------------------
// Logout Button Handling
// -------------------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  window.location.href = "../index.html";
});
