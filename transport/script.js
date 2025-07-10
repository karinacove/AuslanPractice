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

  // Create wrapper for new vehicle
  const wrapper = document.createElement('div');
  wrapper.classList.add('draggable-wrapper');
  wrapper.style.position = 'absolute';
  wrapper.style.zIndex = 1000;

  // Clone the vehicle image
  const clone = target.cloneNode(true);
  clone.classList.add("draggable");
  clone.style.width = "80px";
  clone.style.height = "auto";
  clone.style.pointerEvents = 'auto';
  wrapper.appendChild(clone);

  // Create flip button
  const flipBtn = document.createElement('button');
  flipBtn.className = 'flip-btn';
  flipBtn.innerHTML = '↔';
  flipBtn.style.display = 'none';

  flipBtn.onclick = (ev) => {
    ev.stopPropagation();
    clone.classList.toggle('flipped-horizontal');
  };

  // Show/hide flip button on hover
  wrapper.addEventListener('mouseenter', () => flipBtn.style.display = 'block');
  wrapper.addEventListener('mouseleave', () => flipBtn.style.display = 'none');

  wrapper.appendChild(flipBtn);
  document.body.appendChild(wrapper);
  dragged = wrapper;

  const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
  const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;

  dragged.offsetX = 40;
  dragged.offsetY = 40;
  dragged.style.left = (clientX - dragged.offsetX) + 'px';
  dragged.style.top = (clientY - dragged.offsetY) + 'px';

  e.preventDefault();

  // Allow double-click deletion
  wrapper.addEventListener("dblclick", () => {
    wrapper.remove();
  });
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

// Mouse events
document.body.addEventListener('mousedown', e => startDrag(e, false));
document.body.addEventListener('mousemove', e => moveDrag(e, false));
document.body.addEventListener('mouseup', endDrag);

// Touch events with passive:false to allow preventDefault
document.body.addEventListener('touchstart', e => startDrag(e, true), { passive: false });
document.body.addEventListener('touchmove', e => moveDrag(e, true), { passive: false });
document.body.addEventListener('touchend', endDrag, { passive: false });

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

  vehicleData.sort((a, b) => a.name.localeCompare(b.name));

  const vehicleSummary = vehicleData.map(v =>
    `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`
  ).join("; ");

  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse";

  const formData = new FormData();
  formData.append("entry.1202364028", "Mrs Cove");
  formData.append("entry.1957249768", studentClass);
  formData.append("entry.436910009", studentName);
  formData.append("entry.169376211", jobDescription);
  formData.append("entry.1017965571", "1");
  formData.append("entry.1568301781", vehicleSummary);

  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).then(() => {
    // Inject content into the modal
    endModal.innerHTML = `
      <div style="text-align: center; color: white; font-size: 1.5rem;">
        ✅ ${vehicleData.length} vehicle${vehicleData.length !== 1 ? 's' : ''} submitted.
      </div>
      <img id="continue-btn" src="assets/continue.png" alt="Continue">
      <img id="again-btn" src="assets/again.png" alt="Try Again">
      <img id="menu-btn" src="assets/menu.png" alt="Menu">
    `;
    endModal.classList.add("show");

    // Button actions
    document.getElementById("again-btn").addEventListener("click", () => {
      window.location.reload();
    });

    document.getElementById("menu-btn").addEventListener("click", () => {
      window.location.href = "hub.html";
    });

    document.getElementById("continue-btn").addEventListener("click", () => {
      // Optional: resume from saved state, or just reload
      window.location.reload(); // Replace if resume logic exists
    });

  }).catch(() => {
    alert("❌ Submission failed. Please try again.");
  });
});

// -------------------------
// Modal Button Handling
// -------------------------
againBtn.addEventListener("click", () => {
  window.location.reload();
});

menuBtn.addEventListener("click", () => {
  window.location.href = "hub.html";
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  window.location.href = "../index.html";
});
