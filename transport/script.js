// Transport Game Script

const MAX_VEHICLES = 12;
let selectedVehicle = null;
let offsetX, offsetY;
let isDragging = false;
let vehiclePlacements = [];
let sessionStartTime = Date.now();

// DOM Elements
const mapArea = document.getElementById("map-area");
const palette = document.getElementById("palette");
const vehicleCount = document.getElementById("vehicle-count");
const downloadBtn = document.getElementById("download-btn");
const resetBtn = document.getElementById("reset-btn");
const menuBtn = document.getElementById("menu-btn");
const finishBtn = document.getElementById("finish-btn");
const screenshotPreview = document.getElementById("screenshot-preview");
const finalButtons = document.getElementById("final-buttons");

// Sign-in Elements
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";
const partnerName = localStorage.getItem("partnerName") || "";
const jobDescription = localStorage.getItem("jobDescription") || "";

if (!studentName || !studentClass) {
  alert("Please return to the sign-in page.");
  window.location.href = "index.html";
}

// Load vehicles from palette
function createVehicleElement(type, index) {
  const vehicle = document.createElement("img");
  vehicle.src = `assets/vehicles/${type}`;
  vehicle.classList.add("vehicle");
  vehicle.dataset.index = index;
  vehicle.dataset.type = type;
  vehicle.setAttribute("draggable", false);

  // Click to select and drag
  vehicle.addEventListener("mousedown", startDrag);
  vehicle.addEventListener("touchstart", startDrag);

  return vehicle;
}

function updateVehicleCount() {
  vehicleCount.textContent = vehiclePlacements.length;
}

function startDrag(e) {
  e.preventDefault();
  if (vehiclePlacements.length >= MAX_VEHICLES && !e.target.classList.contains("placed")) return;

  selectedVehicle = e.target.cloneNode(true);
  selectedVehicle.classList.add("selected");
  mapArea.appendChild(selectedVehicle);

  const rect = mapArea.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  offsetX = 50;
  offsetY = 50;

  selectedVehicle.style.left = `${clientX - rect.left - offsetX}px`;
  selectedVehicle.style.top = `${clientY - rect.top - offsetY}px`;

  isDragging = true;
}

function drag(e) {
  if (!isDragging || !selectedVehicle) return;

  const rect = mapArea.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  selectedVehicle.style.left = `${clientX - rect.left - offsetX}px`;
  selectedVehicle.style.top = `${clientY - rect.top - offsetY}px`;
}

function endDrag() {
  if (!selectedVehicle) return;

  selectedVehicle.classList.remove("selected");
  selectedVehicle.classList.add("placed");

  selectedVehicle.addEventListener("click", () => {
    mapArea.removeChild(selectedVehicle);
    vehiclePlacements = vehiclePlacements.filter(v => v !== selectedVehicle);
    updateVehicleCount();
  });

  vehiclePlacements.push(selectedVehicle);
  updateVehicleCount();

  selectedVehicle = null;
  isDragging = false;
}

function finishActivity() {
  // 1. Take screenshot
  html2canvas(mapArea).then(canvas => {
    const imageData = canvas.toDataURL("image/png");

    // 2. Show screenshot preview
    screenshotPreview.src = imageData;
    screenshotPreview.style.display = "block";
    finalButtons.style.display = "flex";

    // 3. Send to Google Form silently
    const placedCount = vehiclePlacements.length;
    const scorePercent = Math.round((placedCount / MAX_VEHICLES) * 100);
    const timeTaken = Math.round((Date.now() - sessionStartTime) / 1000);

    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfXCG5iGctZFFKPRmTDv82Ihv2k9wBP4EKyG4RbFqjFl8pkPQ/formResponse";
    const form = new FormData();
    form.append("entry.1387461004", studentName);
    form.append("entry.1309291707", studentClass);
    form.append("entry.477642881", "Transport");
    form.append("entry.1499502291", partnerName);
    form.append("entry.644540153", jobDescription);
    form.append("entry.1996137354", `${scorePercent}%`);
    form.append("entry.1948763139", `${timeTaken}s`);

    fetch(formURL, {
      method: "POST",
      mode: "no-cors",
      body: form
    });
  });
}

function resetActivity() {
  location.reload();
}

function goToMenu() {
  window.location.href = "hub.html";
}

function downloadScreenshot() {
  const link = document.createElement("a");
  link.download = `transport_${studentName}_${studentClass}.png`;
  link.href = screenshotPreview.src;
  link.click();
}

// Load saved session
function restoreState() {
  const saved = JSON.parse(localStorage.getItem("transportPlacements"));
  if (!saved) return;

  saved.forEach(data => {
    const img = createVehicleElement(data.type, data.index);
    img.style.left = data.left;
    img.style.top = data.top;
    img.classList.add("placed");

    img.addEventListener("click", () => {
      mapArea.removeChild(img);
      vehiclePlacements = vehiclePlacements.filter(v => v !== img);
      updateVehicleCount();
    });

    mapArea.appendChild(img);
    vehiclePlacements.push(img);
  });
  updateVehicleCount();
}

function saveState() {
  const data = vehiclePlacements.map(img => ({
    type: img.dataset.type,
    index: img.dataset.index,
    left: img.style.left,
    top: img.style.top
  }));
  localStorage.setItem("transportPlacements", JSON.stringify(data));
}

mapArea.addEventListener("mousemove", drag);
mapArea.addEventListener("mouseup", endDrag);
mapArea.addEventListener("touchmove", drag);
mapArea.addEventListener("touchend", endDrag);

resetBtn?.addEventListener("click", resetActivity);
menuBtn?.addEventListener("click", goToMenu);
downloadBtn?.addEventListener("click", downloadScreenshot);
finishBtn?.addEventListener("click", finishActivity);

// Load vehicle palette
const vehicleTypes = [
  "car.png", "bus.png", "bike.png", "truck.png",
  "van.png", "ambulance.png", "firetruck.png", "tractor.png"
];
vehicleTypes.forEach((type, i) => {
  const el = createVehicleElement(type, i);
  palette.appendChild(el);
});

// Initial restore
restoreState();

// Save on unload
window.addEventListener("beforeunload", saveState);
