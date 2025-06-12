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
// Submit Button Handling
// -------------------------
document.getElementById("submit-button").addEventListener("click", () => {
  const placedVehicles = document.querySelectorAll(".draggable-wrapper");
  const results = [];

  placedVehicles.forEach(wrapper => {
    const img = wrapper.querySelector("img");
    const isFlipped = img.classList.contains("flipped-horizontal");
    results.push({
      vehicle: img.src.split("/").pop(),
      x: parseInt(wrapper.style.left),
      y: parseInt(wrapper.style.top),
      flipped: isFlipped
    });
  });

  console.log("Submitting data:", {
    studentName,
    studentClass,
    vehicles: results
  });

  // Send to Google Form or backend if needed
  alert("Submission complete!");
});
