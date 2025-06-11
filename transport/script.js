let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

const logoutBtn = document.getElementById("logout-btn");
const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html"; // Adjust path as needed
} else {
  studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  gameContainer.style.display = "block";
}

// Logout clears localStorage and redirects
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("studentName");
  localStorage.removeItem("studentClass");
  window.location.href = "../index.html";
});
const logoutBtn = document.getElementById("logout-btn");
const studentInfoDiv = document.getElementById("student-info");
const gameContainer = document.getElementById("game-container");

// Redirect if not signed in
if (!studentName || !studentClass) {
  alert("Please log in first.");
  window.location.href = "../index.html"; // Adjust path if needed
} else {
  if (studentInfoDiv) {
    studentInfoDiv.textContent = `Welcome, ${studentName} (${studentClass})`;
  }
  if (gameContainer) {
    gameContainer.style.display = "block";
  }
}

// Logout clears localStorage and redirects
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentClass");
    window.location.href = "../index.html";
  });
}

let selectedVehicle = null;
let studentData = null;

// Store coordinates
const answerData = {
  studentName: '',
  studentClass: '',
  question: '1', // You can adjust for each question if needed
  vehicleType: '',
  x: null,
  y: null
};

document.querySelectorAll('.draggable').forEach(vehicle => {
  vehicle.addEventListener('dragstart', (e) => {
    selectedVehicle = e.target.dataset.vehicle;
  });
});

const dropZone = document.getElementById('map-container');
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
});

dropZone.addEventListener('drop',
