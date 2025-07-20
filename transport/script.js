document.addEventListener("DOMContentLoaded", () => {
  const studentForm = document.getElementById("student-form");
  const partnerInput = document.getElementById("partner-name");
  const jobInput = document.getElementById("job-description");
  const studentInfoDiv = document.getElementById("student-info");
  const submitBtn = document.getElementById("submit-btn");
  const vehiclePalette = document.getElementById("vehicle-palette");
  const endModal = document.getElementById("end-modal");
  const vehicleCountText = document.getElementById("vehicle-count");
  const downloadBtn = document.getElementById("download-btn");
  const continueBtn = document.getElementById("continue-btn");
  const againBtn = document.getElementById("again-btn");
  const menuBtn = document.getElementById("menu-btn");
  const mapPreview = document.getElementById("map-preview");

  // Utilities
  const getVehicleCount = () => document.querySelectorAll(".vehicle").length;

  // Load saved session
  const savedPartner = localStorage.getItem("partnerName");
  const savedJob = localStorage.getItem("jobDescription");
  const savedVehicles = JSON.parse(localStorage.getItem("placedVehicles") || "[]");
  const savedScreenshot = localStorage.getItem("screenshotData");

  const showModal = () => {
    if (savedPartner && savedJob && (savedVehicles.length > 0 || savedScreenshot)) {
      vehicleCountText.textContent = savedVehicles.length
        ? `${savedVehicles.length} vehicles previously placed.`
        : "0 vehicles previously placed.";
      if (savedScreenshot) {
        mapPreview.src = savedScreenshot;
        mapPreview.style.display = "block";
      } else {
        mapPreview.style.display = "none";
      }
      endModal.style.display = "flex";
    }
  };

  const hideModal = () => {
    endModal.style.display = "none";
  };

  const saveScreenshot = () => {
    html2canvas(document.getElementById("map-container")).then(canvas => {
      const imageData = canvas.toDataURL("image/png");
      mapPreview.src = imageData;
      mapPreview.style.display = "block";
      localStorage.setItem("screenshotData", imageData);

      // Submit to Google Form (example only - replace with actual Form URL and entry IDs)
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://docs.google.com/forms/d/e/your-form-id/formResponse"; // Replace with real one
      form.target = "hiddenIframe";

      const nameEntry = document.createElement("input");
      nameEntry.name = "entry.123456"; // Replace with correct entry
      nameEntry.value = savedPartner || "";
      form.appendChild(nameEntry);

      const imgEntry = document.createElement("input");
      imgEntry.name = "entry.654321"; // Replace with correct entry
      imgEntry.value = imageData;
      form.appendChild(imgEntry);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    });
  };

  // Submit form (Start game)
  if (studentForm) {
    studentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const partnerName = partnerInput.value.trim();
      const jobDescription = jobInput.value.trim();
      if (!partnerName || !jobDescription) return;

      localStorage.setItem("partnerName", partnerName);
      localStorage.setItem("jobDescription", jobDescription);
      studentInfoDiv.textContent = `Partner: ${partnerName} | Job: ${jobDescription}`;
      studentForm.style.display = "none";
      submitBtn.style.display = "block";
      vehiclePalette.style.display = "flex";
    });
  }

  // Show resume modal if applicable
  if (savedPartner && savedJob) {
    studentForm.style.display = "none";
    studentInfoDiv.textContent = `Partner: ${savedPartner} | Job: ${savedJob}`;
    submitBtn.style.display = "block";
    vehiclePalette.style.display = "flex";
    showModal();
  }

  // Download/Screenshot and Submit
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      saveScreenshot();
      downloadBtn.style.display = "none";
      continueBtn.style.display = "inline-block";
      againBtn.style.display = "inline-block";
      menuBtn.style.display = "inline-block";
    });
  }

  // Continue session
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      hideModal();
    });
  }

  // Start Again
  if (againBtn) {
    againBtn.addEventListener("click", () => {
      localStorage.clear();
      location.reload();
    });
  }

  // Back to menu
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../hub.html";
    });
  }
});
