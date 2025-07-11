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
const previewImage = document.getElementById("preview-screenshot");

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

  const savedData = JSON.parse(localStorage.getItem("savedVehicles"));
  if (savedData) {
    showModal(true);
  }
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
  wrapper.addEventListener('dblclick', () => wrapper.remove());

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

['mousedown', 'touchstart'].forEach(type => document.body.addEventListener(type, e => startDrag(e, type === 'touchstart'), { passive: false }));
['mousemove', 'touchmove'].forEach(type => document.body.addEventListener(type, e => moveDrag(e, type === 'touchmove'), { passive: false }));
document.body.addEventListener('mouseup', endDrag);
document.body.addEventListener('touchend', endDrag);

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

  const vehicleCount = vehicleData.length;
  const vehicleSummary = vehicleData.map(v =>
    `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`
  ).join("; ");

  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse";
  const formData = new FormData();
  formData.append("entry.1202364028", "Mrs Cove");
  formData.append("entry.1957249768", studentClass);
  formData.append("entry.436910009", studentName);
  formData.append("entry.169376211", jobDescription);
  formData.append("entry.1017965571", vehicleCount);
  formData.append("entry.1568301781", vehicleSummary);

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).then(() => {
    showModal();
  })
});

function showModal(isReload = false) {
  endModal.classList.add("show");
  document.querySelectorAll('.draggable-wrapper').forEach(el => el.style.display = 'none');
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(document.body, 0, 0);
  previewImage.src = canvas.toDataURL();
  previewImage.style.display = 'block';

  if (isReload) {
    againBtn.style.display = 'inline';
    menuBtn.style.display = 'inline';
    continueBtn.style.display = 'inline';
  }
}

// -------------------------
// Modal Button Handling
// -------------------------
againBtn.addEventListener("click", () => {
  localStorage.removeItem("savedVehicles");
  window.location.reload();
});

menuBtn.addEventListener("click", () => {
  localStorage.removeItem("savedVehicles");
  window.location.href = "hub.html";
});

continueBtn.addEventListener("click", () => {
  const placedVehicles = document.querySelectorAll(".draggable-wrapper");
  const saved = [];
  placedVehicles.forEach(wrapper => {
    const img = wrapper.querySelector("img");
    saved.push({
      src: img.src,
      left: wrapper.style.left,
      top: wrapper.style.top,
      flipped: img.classList.contains("flipped-horizontal")
    });
  });
  localStorage.setItem("savedVehicles", JSON.stringify(saved));
  endModal.classList.remove("show");
  document.querySelectorAll('.draggable-wrapper').forEach(el => el.style.display = 'block');
  previewImage.style.display = 'none';
});

// -------------------------
// Load Saved Vehicles if Exist
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("savedVehicles"));
  if (saved) {
    saved.forEach(data => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("draggable-wrapper");
      wrapper.style.left = data.left;
      wrapper.style.top = data.top;

      const img = document.createElement("img");
      img.src = data.src;
      img.className = "draggable dropped-vehicle";
      if (data.flipped) img.classList.add("flipped-horizontal");
      wrapper.appendChild(img);

      const flipBtn = document.createElement('button');
      flipBtn.className = 'flip-btn';
      flipBtn.innerHTML = '↔';
      flipBtn.style.display = 'none';
      flipBtn.onclick = (ev) => {
        ev.stopPropagation();
        img.classList.toggle('flipped-horizontal');
      };

      wrapper.appendChild(flipBtn);
      wrapper.addEventListener('mouseenter', () => flipBtn.style.display = 'block');
      wrapper.addEventListener('mouseleave', () => flipBtn.style.display = 'none');
      wrapper.addEventListener('dblclick', () => wrapper.remove());

      document.body.appendChild(wrapper);
    });
  }
});
