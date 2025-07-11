// -------------------------
// Student Sign-in Handling
// -------------------------
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  alert("Please return to the sign-in page.");
  window.location.href = "../index.html";
}

const studentInfo = document.getElementById("student-info");
const palette = document.getElementById("vehicle-palette");
const finishBtn = document.getElementById("finish-btn");
const form = document.getElementById("student-form");
const startBtn = document.getElementById("start-btn");
const endModal = document.getElementById("end-modal");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const logoutBtn = document.getElementById("logout-btn");
const continueBtn = document.getElementById("continue-btn");

let jobDescription = '';
let partnerName = '';

form.addEventListener("submit", function (e) {
  e.preventDefault();
  jobDescription = document.getElementById("jobDescription").value;
  partnerName = document.getElementById("partnerName").value;

  form.style.display = 'none';
  palette.style.display = 'grid';
  finishBtn.style.display = 'inline-block';
  studentInfo.style.display = 'block';
  studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
});

// -------------------------
// Drag & Drop Vehicle Logic with Touch Support
// -------------------------
const MAX_VEHICLES = 12;
let dragged = null;

function startDrag(e, isTouch = false) {
  const target = isTouch ? e.targetTouches[0].target : e.target;
  if (!target.classList.contains('draggable') || target.parentElement !== palette) return;
  if (document.querySelectorAll('body > .draggable-wrapper').length >= MAX_VEHICLES) return;

  const wrapper = document.createElement('div');
  wrapper.classList.add('draggable-wrapper');

  const clone = target.cloneNode(true);
  clone.classList.add("dropped-vehicle");
  clone.style.pointerEvents = 'auto';
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

  e.preventDefault?.();
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
document.body.addEventListener('touchstart', e => startDrag(e, true), { passive: false });
document.body.addEventListener('touchmove', e => moveDrag(e, true), { passive: false });
document.body.addEventListener('touchend', endDrag);

// -------------------------
// Load saved vehicles
// -------------------------
function loadSavedVehicles() {
  const saved = localStorage.getItem("vehiclePlacements");
  if (!saved) return;

  const vehicles = JSON.parse(saved);
  vehicles.forEach(v => {
    const img = new Image();
    img.src = `assets/${v.name}.png`;
    img.className = 'draggable dropped-vehicle';
    if (v.flipped) img.classList.add('flipped-horizontal');

    const wrapper = document.createElement("div");
    wrapper.className = "draggable-wrapper";
    wrapper.style.left = v.x;
    wrapper.style.top = v.y;
    wrapper.appendChild(img);

    const flipBtn = document.createElement("button");
    flipBtn.className = "flip-btn";
    flipBtn.innerHTML = "↔";
    flipBtn.style.display = "none";

    flipBtn.onclick = (ev) => {
      ev.stopPropagation();
      img.classList.toggle("flipped-horizontal");
    };

    wrapper.appendChild(flipBtn);
    wrapper.addEventListener("mouseenter", () => flipBtn.style.display = "block");
    wrapper.addEventListener("mouseleave", () => flipBtn.style.display = "none");

    document.body.appendChild(wrapper);
  });
}

loadSavedVehicles();

// -------------------------
// Finish Button: Submit & Show Modal
// -------------------------
finishBtn.addEventListener("click", () => {
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

  // Save vehicle data to localStorage
  localStorage.setItem("vehiclePlacements", JSON.stringify(vehicleData));

  // Hide placed vehicles
  placedVehicles.forEach(wrapper => wrapper.style.display = "none");

  // Submit to Google Form
  vehicleData.sort((a, b) => a.name.localeCompare(b.name));
  const vehicleSummary = vehicleData.map(v => `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`).join("; ");

  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse";
  const formData = new FormData();
  formData.append("entry.1202364028", "Mrs Cove");
  formData.append("entry.1957249768", studentClass);
  formData.append("entry.436910009", studentName);
  formData.append("entry.169376211", jobDescription);
  formData.append("entry.1017965571", vehicleData.length.toString());
  formData.append("entry.1568301781", vehicleSummary);

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).then(() => {
    document.getElementById("vehicle-count").textContent = `${vehicleData.length} vehicles submitted.`;
    endModal.classList.add("show");
  }).catch(() => {
    alert("❌ Submission failed. Please try again.");
  });
});

// -------------------------
// Modal Button Handling
// -------------------------
againBtn.addEventListener("click", () => {
  localStorage.removeItem("vehiclePlacements");
  window.location.reload();
});

menuBtn.addEventListener("click", () => {
  window.location.href = "hub.html";
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  localStorage.removeItem("vehiclePlacements");
  window.location.href = "../index.html";
});

continueBtn.addEventListener("click", () => {
  endModal.classList.remove("show");
});
