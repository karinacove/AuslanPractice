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
  // -------------------------
  // Drag & drop vehicle logic with touch support
  // -------------------------
  const MAX_VEHICLES = 12;
  let dragged = null;

  // Drag start handler
  function startDrag(e, isTouch = false) {
    const target = isTouch ? e.targetTouches[0].target : e.target;

    // Only start drag if from palette and draggable class
    if (!target.classList.contains("draggable") || target.parentElement !== palette) return;

    // Limit max vehicles placed
    if (document.querySelectorAll("body > .draggable-wrapper").length >= MAX_VEHICLES) return;

    // Create wrapper container for dragging, positioning absolute
    const wrapper = document.createElement("div");
    wrapper.classList.add("draggable-wrapper");
    wrapper.style.position = "absolute";
    wrapper.style.zIndex = 1000;

    // Clone target image and add it inside wrapper
    const clone = target.cloneNode(true);
    clone.classList.add("dropped-vehicle");
    clone.style.pointerEvents = "none"; // avoid interfering with drag
    wrapper.appendChild(clone);

    // Create flip button and append
    const flipBtn = document.createElement("button");
    flipBtn.className = "flip-btn";
    flipBtn.innerHTML = "↔";
    flipBtn.style.display = "none";
    flipBtn.onclick = (ev) => {
      ev.stopPropagation();
      clone.classList.toggle("flipped-horizontal");
      saveVehiclesToStorage();
    };
    wrapper.appendChild(flipBtn);

    // Show flip button on hover
    wrapper.addEventListener("mouseenter", () => (flipBtn.style.display = "block"));
    wrapper.addEventListener("mouseleave", () => (flipBtn.style.display = "none"));

    // Append wrapper to body for absolute positioning & drag
    document.body.appendChild(wrapper);
    dragged = wrapper;

    // Get cursor/touch coordinates
    const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
    const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;

    // Set offset for cursor inside wrapper (hardcoded 40px center)
    dragged.offsetX = 40;
    dragged.offsetY = 40;
    dragged.style.left = clientX - dragged.offsetX + "px";
    dragged.style.top = clientY - dragged.offsetY + "px";

    e.preventDefault();
  }

  // Drag move handler
  function moveDrag(e, isTouch = false) {
    if (!dragged) return;
    const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
    const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;
    dragged.style.left = clientX - dragged.offsetX + "px";
    dragged.style.top = clientY - dragged.offsetY + "px";
  }

  // Drag end handler
  function endDrag() {
    if (dragged) dragged.style.zIndex = "";
    dragged = null;
    // Save state on drag end
    saveVehiclesToStorage();
  }

  // Attach mouse and touch event listeners for drag-drop
  document.body.addEventListener("mousedown", (e) => startDrag(e, false));
  document.body.addEventListener("mousemove", (e) => moveDrag(e, false));
  document.body.addEventListener("mouseup", endDrag);
  document.body.addEventListener("touchstart", (e) => startDrag(e, true), { passive: false });
  document.body.addEventListener("touchmove", (e) => moveDrag(e, true), { passive: false });
  document.body.addEventListener("touchend", endDrag);
});

