// Transport Game Full Logic (Updated)

// -------------------------
// Global Variables
// -------------------------
const MAX_VEHICLES = 12;
let placedVehicles = [];
let vehicleIdCounter = 0;
let selectedVehicle = null;
let startTime;

// -------------------------
// DOM Elements
// -------------------------
const nameInput = document.getElementById("name");
const classInput = document.getElementById("class");
const partnerInput = document.getElementById("partner");
const jobInput = document.getElementById("job");
const startBtn = document.getElementById("start-btn");
const startOverlay = document.getElementById("start-overlay");
const map = document.getElementById("map");
const palette = document.getElementById("palette");
const finishBtn = document.getElementById("finish-btn");
const vehicleCounter = document.getElementById("vehicle-count");
const screenshotPreview = document.getElementById("screenshot-preview");
const downloadBtn = document.getElementById("download-btn");
const menuBtn = document.getElementById("menu-btn");
const resetBtn = document.getElementById("reset-btn");

// -------------------------
// Init
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Restore student session
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem("lastSessionDate");

  if (today !== lastDate) {
    localStorage.removeItem("transportData");
    localStorage.setItem("lastSessionDate", today);
  }

  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    startOverlay.style.display = "flex";
  } else {
    document.getElementById("student-info").textContent = `${studentName} (${studentClass})`;
    startTime = Date.now();
    loadSavedVehicles();
  }
});

// -------------------------
// Start Button
// -------------------------
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const cls = classInput.value.trim();
    const partner = partnerInput.value.trim();
    const job = jobInput.value.trim();

    if (!name || !cls) return alert("Enter name and class");

    localStorage.setItem("studentName", name);
    localStorage.setItem("studentClass", cls);
    localStorage.setItem("partnerName", partner);
    localStorage.setItem("jobDescription", job);
    localStorage.setItem("lastSessionDate", new Date().toDateString());

    document.getElementById("student-info").textContent = `${name} (${cls})`;
    startOverlay.style.display = "none";
    startTime = Date.now();
    loadSavedVehicles();
  });
}

// -------------------------
// Palette Vehicle Events
// -------------------------
if (palette) {
  palette.addEventListener("click", (e) => {
    if (!e.target.classList.contains("palette-vehicle")) return;
    if (placedVehicles.length >= MAX_VEHICLES) return alert("Max 12 vehicles");

    const clone = e.target.cloneNode(true);
    clone.classList.add("placed-vehicle");
    clone.style.left = "100px";
    clone.style.top = "100px";
    clone.dataset.id = vehicleIdCounter++;

    addDragEvents(clone);
    map.appendChild(clone);
    placedVehicles.push(clone);
    updateVehicleCount();
    saveVehicleData();
  });
}

function addDragEvents(el) {
  let offsetX, offsetY;

  const onMouseDown = (e) => {
    selectedVehicle = el;
    selectedVehicle.classList.add("selected");
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!selectedVehicle) return;
    selectedVehicle.style.left = `${e.pageX - offsetX}px`;
    selectedVehicle.style.top = `${e.pageY - offsetY}px`;
  };

  const onMouseUp = () => {
    if (selectedVehicle) selectedVehicle.classList.remove("selected");
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    saveVehicleData();
  };

  el.addEventListener("mousedown", onMouseDown);

  el.addEventListener("click", (e) => {
    if (e.altKey) {
      el.remove();
      placedVehicles = placedVehicles.filter((v) => v !== el);
      updateVehicleCount();
      saveVehicleData();
    } else if (e.shiftKey) {
      const current = parseInt(el.dataset.rotation || 0);
      const next = (current + 90) % 360;
      el.style.transform = `rotate(${next}deg)`;
      el.dataset.rotation = next;
      saveVehicleData();
    }
  });
}

function updateVehicleCount() {
  if (vehicleCounter) vehicleCounter.textContent = `${placedVehicles.length}/${MAX_VEHICLES}`;
}

function saveVehicleData() {
  const vehicleData = placedVehicles.map((el) => ({
    src: el.src,
    left: el.style.left,
    top: el.style.top,
    rotation: el.dataset.rotation || 0,
    id: el.dataset.id,
  }));
  localStorage.setItem("transportData", JSON.stringify(vehicleData));
}

function loadSavedVehicles() {
  const saved = localStorage.getItem("transportData");
  if (!saved) return;
  const items = JSON.parse(saved);
  items.forEach((v) => {
    const img = document.createElement("img");
    img.src = v.src;
    img.className = "placed-vehicle";
    img.style.left = v.left;
    img.style.top = v.top;
    img.dataset.rotation = v.rotation;
    img.dataset.id = v.id;
    img.style.transform = `rotate(${v.rotation}deg)`;
    addDragEvents(img);
    map.appendChild(img);
    placedVehicles.push(img);
  });
  updateVehicleCount();
}

// -------------------------
// Finish Button
// -------------------------
if (finishBtn) {
  finishBtn.addEventListener("click", finishActivity);
}

function finishActivity() {
  html2canvas(map).then((canvas) => {
    const imageDataURL = canvas.toDataURL("image/png");
    screenshotPreview.src = imageDataURL;
    screenshotPreview.style.display = "block";
    downloadBtn.style.display = "inline-block";
    menuBtn.style.display = "inline-block";
    resetBtn.style.display = "inline-block";
    submitToGoogleForm(imageDataURL);
  });
}

function submitToGoogleForm(imageDataURL) {
  const name = localStorage.getItem("studentName") || "";
  const cls = localStorage.getItem("studentClass") || "";
  const partner = localStorage.getItem("partnerName") || "";
  const job = localStorage.getItem("jobDescription") || "";
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  const vehicleDetails = placedVehicles.map((v) => `${v.src.split("/").pop()} (${v.style.left}, ${v.style.top}) rot:${v.dataset.rotation}`).join("; ");

  const form = document.createElement("form");
  form.action = "https://docs.google.com/forms/d/e/1FAIpQLSdRr3K39UOx7W0FEXAMPLEURL/formResponse";
  form.method = "POST";
  form.target = "hidden_iframe";

  const entries = {
    "entry.1111111111": name,
    "entry.2222222222": cls,
    "entry.3333333333": partner,
    "entry.4444444444": job,
    "entry.5555555555": `${placedVehicles.length}`,
    "entry.6666666666": `${duration}s",
    "entry.7777777777": vehicleDetails,
    "entry.8888888888": imageDataURL,
  };

  for (let key in entries) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = entries[key];
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

// -------------------------
// End Buttons
// -------------------------
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = screenshotPreview.src;
    link.download = "transport-screenshot.png";
    link.click();
  });
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    window.location.href = "hub.html";
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("transportData");
    location.reload();
  });
}
