// -------------------------
// Student Sign-in Handling
// -------------------------
const studentName = localStorage.getItem("studentName") || "";
const studentClass = localStorage.getItem("studentClass") || "";

if (!studentName || !studentClass) {
  alert("Please return to the sign-in page.");
  window.location.href = "../index.html";
}

document.getElementById("student-info").textContent = `👤 ${studentName} (${studentClass})`;

// -------------------------
// Drag & Drop Vehicle Logic
// -------------------------
let selectedVehicleSrc = "";

const paletteImages = document.querySelectorAll("#vehicle-palette img");
paletteImages.forEach(img => {
  img.addEventListener("dragstart", (e) => {
    selectedVehicleSrc = e.target.src;
  });
});

const mapContainer = document.getElementById("map-container");
mapContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
});

mapContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  const x = e.offsetX;
  const y = e.offsetY;
  if (selectedVehicleSrc) {
    dropVehicle(selectedVehicleSrc, x, y);
  }
});

// -------------------------
// Drop and Flip Function
// -------------------------
function dropVehicle(src, x, y) {
  const wrapper = document.createElement("div");
  wrapper.className = "draggable-wrapper";
  wrapper.style.left = `${x}px`;
  wrapper.style.top = `${y}px`;
  wrapper.style.position = "absolute";

  const vehicle = document.createElement("img");
  vehicle.src = src;
  vehicle.className = "dropped-vehicle";
  vehicle.style.pointerEvents = "auto";

  const flipBtn = document.createElement("button");
  flipBtn.className = "flip-btn";
  flipBtn.innerText = "↔";
  flipBtn.style.display = "none";

  flipBtn.addEventListener("click", () => {
    vehicle.classList.toggle("flipped-horizontal");
  });

  wrapper.addEventListener("mouseenter", () => {
    flipBtn.style.display = "block";
  });

  wrapper.addEventListener("mouseleave", () => {
    flipBtn.style.display = "none";
  });

  wrapper.appendChild(vehicle);
  wrapper.appendChild(flipBtn);
  mapContainer.appendChild(wrapper);
}

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

  // ✅ Sort vehicle data alphabetically by name
  vehicleData.sort((a, b) => a.name.localeCompare(b.name));

  const vehicleSummary = vehicleData.map(v =>
    `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`
  ).join("; ");

  // ✅ Google Form submission
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
