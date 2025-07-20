// Constants
const MAX_VEHICLES = 12;
const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse";
const uploadScriptURL = "https://script.google.com/macros/s/AKfycbzQFM9jcNCDPVg70SzmQ3hZIYahhDbTQXJ4UyqaTby81hTMWMmgxCtPX9nZxqHVfs_Mew/exec";
const todayStr = new Date().toISOString().slice(0, 10);

// DOM elements
const studentInfo = document.getElementById("student-info");
const palette = document.getElementById("vehicle-palette");
const finishBtn = document.getElementById("finish-btn");
const form = document.getElementById("student-form");
const endModal = document.getElementById("end-modal");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const continueBtn = document.getElementById("continue-btn");
const downloadBtn = document.getElementById("download-btn");
const previewImg = document.getElementById("map-preview");
const vehicleCountText = document.getElementById("vehicle-count");

const row1 = document.getElementById("row-1");
const row2 = document.getElementById("row-2");
const row3 = document.getElementById("row-3");

// Stored info
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";
let jobDescription = localStorage.getItem("partnerJob") || "";
let partnerName = localStorage.getItem("partnerName") || "";

if (!studentName || !studentClass) {
  window.location.href = "../index.html";
}

let savedData = null;
try {
  const savedDataJSON = localStorage.getItem("savedVehicles");
  if (savedDataJSON) {
    const parsed = JSON.parse(savedDataJSON);
    if (parsed.savedDate === todayStr && Array.isArray(parsed.vehicles)) {
      savedData = parsed;
    } else {
      localStorage.removeItem("savedVehicles");
    }
  }
} catch {
  localStorage.removeItem("savedVehicles");
}

// Utility functions
function captureScreenshot() {
  return html2canvas(document.body).then(canvas => canvas.toDataURL("image/png"));
}

function saveVehiclesToStorage() {
  const wrappers = document.querySelectorAll(".draggable-wrapper");
  const vehicles = Array.from(wrappers).map(wrapper => {
    const img = wrapper.querySelector("img");
    return {
      src: img.src,
      left: wrapper.style.left,
      top: wrapper.style.top,
      flipped: img.classList.contains("flipped-horizontal"),
    };
  });
  localStorage.setItem("savedVehicles", JSON.stringify({
    savedDate: todayStr,
    vehicles,
    screenshotDataUrl: savedData?.screenshotDataUrl || null,
  }));
  if (partnerName) localStorage.setItem("partnerName", partnerName);
  if (jobDescription) localStorage.setItem("partnerJob", jobDescription);
}

function restoreSavedVehicles() {
  document.querySelectorAll(".draggable-wrapper").forEach(el => el.remove());
  if (!savedData?.vehicles) return;

  savedData.vehicles.forEach(vehicle => {
    const wrapper = document.createElement("div");
    wrapper.className = "draggable-wrapper";
    wrapper.style.position = "absolute";
    wrapper.style.left = vehicle.left;
    wrapper.style.top = vehicle.top;
    wrapper.style.zIndex = 1000;

    const img = document.createElement("img");
    img.src = vehicle.src;
    img.className = "dropped-vehicle";
    if (vehicle.flipped) img.classList.add("flipped-horizontal");
    img.style.pointerEvents = "none";

    const flipBtn = document.createElement("button");
    flipBtn.className = "flip-btn";
    flipBtn.innerHTML = "↔";
    flipBtn.style.display = "none";
    flipBtn.onclick = e => {
      e.stopPropagation();
      img.classList.toggle("flipped-horizontal");
      saveVehiclesToStorage();
    };

    wrapper.appendChild(img);
    wrapper.appendChild(flipBtn);
    wrapper.onmouseenter = () => flipBtn.style.display = "block";
    wrapper.onmouseleave = () => flipBtn.style.display = "none";
    document.body.appendChild(wrapper);
  });
}

// Modal logic
function showInitialModal() {
  endModal.classList.add("show");
  row1.style.display = "flex";
  row2.style.display = "flex";
  row3.style.display = "none";
  downloadBtn.style.display = "inline-block";
  continueBtn.style.display = "inline-block";
  againBtn.style.display = "inline-block";
  menuBtn.style.display = "none";

  if (vehicleCountText) {
    vehicleCountText.textContent = `${savedData.vehicles.length} vehicles previously placed. Partner: ${partnerName} Job: ${jobDescription}`;
  }
  if (previewImg && savedData?.screenshotDataUrl) {
    previewImg.src = savedData.screenshotDataUrl;
  }
}

function showPostUploadModal() {
  endModal.classList.add("show");
  row1.style.display = "none";
  row2.style.display = "none";
  row3.style.display = "flex";
  downloadBtn.style.display = "none";
  continueBtn.style.display = "none";
  againBtn.style.display = "inline-block";
  menuBtn.style.display = "inline-block";
}

// Initial UI setup
if (savedData && jobDescription && partnerName) {
  showInitialModal();
  form.style.display = "none";
  palette.style.display = "none";
  finishBtn.style.display = "none";
  studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
  studentInfo.style.display = "block";
} else {
  localStorage.removeItem("savedVehicles");
  localStorage.removeItem("partnerName");
  localStorage.removeItem("partnerJob");
}

// Button handlers
if (continueBtn) {
  continueBtn.addEventListener("click", () => {
    form.style.display = "none";
    palette.style.display = "grid";
    finishBtn.style.display = "inline-block";
    studentInfo.style.display = "block";
    studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
    endModal.classList.remove("show");
    restoreSavedVehicles();
    document.querySelectorAll(".draggable-wrapper").forEach(el => el.style.display = "block");
  });
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    if (!savedData) return;

    downloadBtn.style.pointerEvents = "none";
    const screenshotDataUrl = await captureScreenshot();
    savedData.screenshotDataUrl = screenshotDataUrl;
    localStorage.setItem("savedVehicles", JSON.stringify(savedData));

    const timestamp = new Date().toISOString().replace(/T/, "_").replace(/:/g, "-").split(".")[0];
    const filename = `${timestamp}_${studentName}_${studentClass}_${jobDescription}_with_${partnerName}`.replace(/\s+/g, "_").replace(/[^\w\-\.]/g, "") + ".png";

    await fetch(uploadScriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: screenshotDataUrl, filename }),
    });

    const formData = new FormData();
    formData.append("entry.1202364028", "Mrs Cove");
    formData.append("entry.1957249768", studentClass);
    formData.append("entry.436910009", studentName);
    formData.append("entry.169376211", jobDescription);
    formData.append("entry.1017965571", "1");
    const summary = savedData.vehicles.map(v => {
      const name = v.src.split("/").pop().split(".")[0];
      return `${name} at (${v.left},${v.top})${v.flipped ? " [flipped]" : ""}`;
    }).join("; ");
    formData.append("entry.1568301781", summary);

    await fetch(formURL, { method: "POST", mode: "no-cors", body: formData });
    showPostUploadModal();
    downloadBtn.style.pointerEvents = "auto";
  });
}

if (finishBtn) {
  finishBtn.addEventListener("click", async () => {
    const wrappers = document.querySelectorAll(".draggable-wrapper");
    const vehicleData = Array.from(wrappers).map(wrapper => {
      const img = wrapper.querySelector("img");
      return {
        name: img.src.split("/").pop().split(".")[0],
        x: wrapper.style.left,
        y: wrapper.style.top,
        flipped: img.classList.contains("flipped-horizontal"),
      };
    });

    const summary = vehicleData.sort((a, b) => a.name.localeCompare(b.name)).map(v =>
      `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`
    ).join("; ");

    if (vehicleCountText) vehicleCountText.textContent = `${vehicleData.length} vehicles submitted.`;

    const screenshotDataUrl = await captureScreenshot();
    if (previewImg) previewImg.src = screenshotDataUrl;

    const timestamp = new Date().toISOString().replace(/T/, "_").replace(/:/g, "-").split(".")[0];
    const filename = `${timestamp}_${studentName}_${studentClass}_${jobDescription}_with_${partnerName}`.replace(/\s+/g, "_").replace(/[^\w\-\.]/g, "") + ".png";

    await fetch(uploadScriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: screenshotDataUrl, filename }),
    });

    const formData = new FormData();
    formData.append("entry.1202364028", "Mrs Cove");
    formData.append("entry.1957249768", studentClass);
    formData.append("entry.436910009", studentName);
    formData.append("entry.169376211", jobDescription);
    formData.append("entry.1017965571", "1");
    formData.append("entry.1568301781", summary);

    await fetch(formURL, { method: "POST", mode: "no-cors", body: formData });

    document.querySelectorAll(".draggable-wrapper").forEach(el => el.style.display = "none");
    showPostUploadModal();
  });
}

if (againBtn) {
  againBtn.addEventListener("click", () => {
    localStorage.removeItem("savedVehicles");
    localStorage.removeItem("partnerName");
    localStorage.removeItem("partnerJob");
    window.location.reload();
  });
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    localStorage.removeItem("savedVehicles");
    localStorage.removeItem("partnerName");
    localStorage.removeItem("partnerJob");
    window.location.href = "hub.html";
  });
}

// Drag & Drop
let dragged = null;
document.body.addEventListener("mousedown", e => startDrag(e, false));
document.body.addEventListener("mousemove", e => moveDrag(e, false));
document.body.addEventListener("mouseup", endDrag);
document.body.addEventListener("touchstart", e => startDrag(e, true), { passive: false });
document.body.addEventListener("touchmove", e => moveDrag(e, true), { passive: false });
document.body.addEventListener("touchend", endDrag);

function startDrag(e, isTouch) {
  const target = isTouch ? e.targetTouches[0].target : e.target;
  if (!target.classList.contains("draggable") || target.parentElement !== palette) return;
  if (document.querySelectorAll(".draggable-wrapper").length >= MAX_VEHICLES) return;

  const wrapper = document.createElement("div");
  wrapper.className = "draggable-wrapper";
  wrapper.style.position = "absolute";
  wrapper.style.zIndex = 1000;

  const clone = target.cloneNode(true);
  clone.classList.add("dropped-vehicle");
  clone.style.pointerEvents = "none";

  const flipBtn = document.createElement("button");
  flipBtn.className = "flip-btn";
  flipBtn.innerHTML = "↔";
  flipBtn.style.display = "none";
  flipBtn.onclick = ev => {
    ev.stopPropagation();
    clone.classList.toggle("flipped-horizontal");
    saveVehiclesToStorage();
  };

  wrapper.appendChild(clone);
  wrapper.appendChild(flipBtn);
  wrapper.onmouseenter = () => flipBtn.style.display = "block";
  wrapper.onmouseleave = () => flipBtn.style.display = "none";

  document.body.appendChild(wrapper);
  dragged = wrapper;
  const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
  const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;
  dragged.offsetX = 40;
  dragged.offsetY = 40;
  dragged.style.left = clientX - 40 + "px";
  dragged.style.top = clientY - 40 + "px";
  e.preventDefault();
}

function moveDrag(e, isTouch) {
  if (!dragged) return;
  const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
  const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;
  dragged.style.left = clientX - dragged.offsetX + "px";
  dragged.style.top = clientY - dragged.offsetY + "px";
}

function endDrag() {
  if (!dragged) return;
  dragged.style.zIndex = "";
  dragged = null;
  saveVehiclesToStorage();
}
