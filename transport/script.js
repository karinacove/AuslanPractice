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
const endModal = document.getElementById("end-modal");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const continueBtn = document.getElementById("continue-btn");
const previewImg = document.getElementById("map-preview");
const vehicleCountText = document.getElementById("vehicle-count");
const downloadBtn = document.getElementById("download-btn");

// Modal rows
const row1 = document.getElementById("row-1");
const row2 = document.getElementById("row-2");
const row3 = document.getElementById("row-3");

let jobDescription = "";
let partnerName = "";

form.addEventListener("submit", function (e) {
  e.preventDefault();
  jobDescription = document.getElementById("jobDescription").value;
  partnerName = document.getElementById("partnerName").value;

  form.style.display = "none";
  palette.style.display = "grid";
  finishBtn.style.display = "inline-block";
  studentInfo.style.display = "block";
  studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;

  if (localStorage.getItem("savedVehicles")) {
    endModal.classList.add("show");
    restorePreview();
    vehicleCountText.textContent = `${JSON.parse(localStorage.getItem("savedVehicles")).length} vehicles previously placed.`;
  }
});

// -------------------------
// Drag & Drop Vehicle Logic with Touch Support
// -------------------------
const MAX_VEHICLES = 12;
let dragged = null;

function startDrag(e, isTouch = false) {
  const target = isTouch ? e.targetTouches[0].target : e.target;
  if (!target.classList.contains("draggable") || target.parentElement !== palette) return;
  if (document.querySelectorAll("body > .draggable-wrapper").length >= MAX_VEHICLES) return;

  const wrapper = document.createElement("div");
  wrapper.classList.add("draggable-wrapper");
  wrapper.style.position = "absolute";
  wrapper.style.zIndex = 1000;

  const clone = target.cloneNode(true);
  clone.classList.add("dropped-vehicle");
  clone.style.pointerEvents = "none";
  wrapper.appendChild(clone);

  const flipBtn = document.createElement("button");
  flipBtn.className = "flip-btn";
  flipBtn.innerHTML = "↔";
  flipBtn.style.display = "none";
  flipBtn.onclick = (ev) => {
    ev.stopPropagation();
    clone.classList.toggle("flipped-horizontal");
  };
  wrapper.appendChild(flipBtn);

  wrapper.addEventListener("mouseenter", () => (flipBtn.style.display = "block"));
  wrapper.addEventListener("mouseleave", () => (flipBtn.style.display = "none"));

  document.body.appendChild(wrapper);
  dragged = wrapper;

  const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
  const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;

  dragged.offsetX = 40;
  dragged.offsetY = 40;
  dragged.style.left = clientX - dragged.offsetX + "px";
  dragged.style.top = clientY - dragged.offsetY + "px";

  e.preventDefault();
}

function moveDrag(e, isTouch = false) {
  if (!dragged) return;
  const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
  const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;
  dragged.style.left = clientX - dragged.offsetX + "px";
  dragged.style.top = clientY - dragged.offsetY + "px";
}

function endDrag() {
  if (dragged) dragged.style.zIndex = "";
  dragged = null;
}

document.body.addEventListener("mousedown", (e) => startDrag(e, false));
document.body.addEventListener("mousemove", (e) => moveDrag(e, false));
document.body.addEventListener("mouseup", endDrag);
document.body.addEventListener("touchstart", (e) => startDrag(e, true), { passive: false });
document.body.addEventListener("touchmove", (e) => moveDrag(e, true), { passive: false });
document.body.addEventListener("touchend", endDrag);

// -------------------------
// Finish Button
// -------------------------
finishBtn.addEventListener("click", () => {
  const placedVehicles = document.querySelectorAll(".draggable-wrapper");
  const vehicleData = [];

  placedVehicles.forEach((wrapper) => {
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

  const vehicleSummary = vehicleData
    .map((v) => `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`)
    .join("; ");

  vehicleCountText.textContent = `${vehicleData.length} vehicles submitted.`;

  captureScreenshot().then((dataUrl) => {
    previewImg.src = dataUrl;

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    const fileName = `${timestamp}_${studentName}_${studentClass}_${jobDescription}_with_${partnerName}.png`
      .replace(/\s+/g, '_')
      .replace(/[^\w\-\.]/g, '');

    fetch("https://script.google.com/macros/s/AKfycbzQFM9jcNCDPVg70SzmQ3hZIYahhDbTQXJ4UyqaTby81hTMWMmgxCtPX9nZxqHVfs_Mew/exec", {
      method: "POST",
      body: JSON.stringify({ image: dataUrl, filename: fileName }),
      headers: { "Content-Type": "application/json" }
    });
  });

  const formData = new FormData();
  formData.append("entry.1202364028", "Mrs Cove");
  formData.append("entry.1957249768", studentClass);
  formData.append("entry.436910009", studentName);
  formData.append("entry.169376211", jobDescription);
  formData.append("entry.1017965571", "1");
  formData.append("entry.1568301781", vehicleSummary);

  fetch("https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse", {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).then(() => {
    document.querySelectorAll(".draggable-wrapper").forEach((el) => (el.style.display = "none"));
    endModal.classList.add("show");
    row1.style.display = "none";
    row2.style.display = "none";
    row3.style.display = "flex";
    againBtn.style.display = "inline-block";
    menuBtn.style.display = "inline-block";
    continueBtn.style.display = "none";
  });
});

function captureScreenshot() {
  return html2canvas(document.body).then((canvas) => canvas.toDataURL("image/png"));
}

function restorePreview() {
  captureScreenshot().then((dataUrl) => (previewImg.src = dataUrl));
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
  const vehicleData = [];
  document.querySelectorAll(".draggable-wrapper").forEach((wrapper) => {
    const img = wrapper.querySelector("img");
    vehicleData.push({
      src: img.src,
      left: wrapper.style.left,
      top: wrapper.style.top,
      flipped: img.classList.contains("flipped-horizontal")
    });
  });

  localStorage.setItem("savedVehicles", JSON.stringify(vehicleData));
  endModal.classList.remove("show");
  document.querySelectorAll(".draggable-wrapper").forEach((el) => (el.style.display = "block"));
});
