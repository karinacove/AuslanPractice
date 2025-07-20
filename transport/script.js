
document.addEventListener("DOMContentLoaded", function () {
  // -------------------------
  // Student sign-in & localStorage keys
  // -------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    // Redirect to sign-in page if missing
    window.location.href = "../index.html";
    return;
  }

  // DOM references
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
  const row1 = document.getElementById("row-1");
  const row2 = document.getElementById("row-2");
  const row3 = document.getElementById("row-3");

  // State variables for form inputs
  let jobDescription = "";
  let partnerName = "";

  if (endModal) endModal.classList.remove("show");

  // -------------------------
  // Daily saved data check and clearing
  // -------------------------
  const savedDataJSON = localStorage.getItem("savedVehicles");
  let savedData = null;

  if (savedDataJSON) {
    try {
      savedData = JSON.parse(savedDataJSON);
    } catch (e) {
      // If corrupted, clear it
      localStorage.removeItem("savedVehicles");
      savedData = null;
    }
  }

  // Utility function: check if two YYYY-MM-DD dates are same day
  function isSameDay(dateStr1, dateStr2) {
    return dateStr1 === dateStr2;
  }

  // Get today string YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // Validate savedData date and clear old data
  if (savedData && savedData.savedDate) {
    if (!isSameDay(savedData.savedDate, todayStr)) {
      localStorage.removeItem("savedVehicles");
      savedData = null;
    }
  } else if (savedData) {
    localStorage.removeItem("savedVehicles");
    savedData = null;
  }

  // -------------------------
  // Initialize UI depending on savedData existence & vehicle count
  // -------------------------
  if (savedData && savedData.vehicles && savedData.vehicles.length > 0) {
    // Show modal only if there are saved vehicles
    if (endModal) endModal.classList.add("show");
    restorePreview();

    if (vehicleCountText) {
      vehicleCountText.textContent = `${savedData.vehicles.length} vehicles previously placed.`;
    }

    // Hide form, show palette and finish button
    if (form) form.style.display = "none";
    if (palette) palette.style.display = "grid";
    if (finishBtn) finishBtn.style.display = "inline-block";

    if (studentInfo) {
      studentInfo.style.display = "block";
      studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
    }
  } else {
    // No saved vehicles or no saved data: show form, hide palette and finish button, hide modal
    if (form) form.style.display = "block";
    if (palette) palette.style.display = "none";
    if (finishBtn) finishBtn.style.display = "none";
    if (studentInfo) studentInfo.style.display = "none";
    if (endModal) endModal.classList.remove("show");
  }

  // -------------------------
  // Form submission: get partner/job info & start
  // -------------------------
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      jobDescription = document.getElementById("jobDescription").value;
      partnerName = document.getElementById("partnerName").value;

      form.style.display = "none";
      if (palette) palette.style.display = "grid";
      if (finishBtn) finishBtn.style.display = "inline-block";
      if (studentInfo) {
        studentInfo.style.display = "block";
        studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
      }

      // Check again if saved vehicles exist on start and show modal accordingly
      if (localStorage.getItem("savedVehicles")) {
        const savedVehicles = JSON.parse(localStorage.getItem("savedVehicles"));
        if (savedVehicles.vehicles && savedVehicles.vehicles.length > 0) {
          if (endModal) endModal.classList.add("show");
          restorePreview();

          if (vehicleCountText) {
            vehicleCountText.textContent = `${savedVehicles.vehicles.length} vehicles previously placed.`;
          }
        }
      }
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

  // -------------------------
  // Save vehicles to localStorage
  // -------------------------
  function saveVehiclesToStorage() {
    const wrappers = document.querySelectorAll(".draggable-wrapper");
    const vehicles = [];

    wrappers.forEach((wrapper) => {
      const img = wrapper.querySelector("img");
      vehicles.push({
        src: img.src,
        left: wrapper.style.left,
        top: wrapper.style.top,
        flipped: img.classList.contains("flipped-horizontal"),
      });
    });

    localStorage.setItem(
      "savedVehicles",
      JSON.stringify({
        savedDate: todayStr,
        vehicles: vehicles,
      })
    );
  }

  // -------------------------
  // Restore preview image from screenshot
  // -------------------------
  function restorePreview() {
    captureScreenshot().then((dataUrl) => {
      if (previewImg) previewImg.src = dataUrl;
    });
  }

  // -------------------------
  // Capture screenshot using html2canvas
  // -------------------------
  function captureScreenshot() {
    return html2canvas(document.body).then((canvas) => canvas.toDataURL("image/png"));
  }

  // -------------------------
  // Finish button click handler
  // -------------------------
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      const placedWrappers = document.querySelectorAll(".draggable-wrapper");
      const vehicleData = [];

      // Collect vehicle data for form and display
      placedWrappers.forEach((wrapper) => {
        const img = wrapper.querySelector("img");
        const isFlipped = img.classList.contains("flipped-horizontal");
        const fileName = img.src.split("/").pop().split(".")[0];
        vehicleData.push({
          name: fileName,
          x: wrapper.style.left,
          y: wrapper.style.top,
          flipped: isFlipped,
        });
      });

      // Sort by vehicle name alphabetically
      vehicleData.sort((a, b) => a.name.localeCompare(b.name));

      // Create summary string for Google Form
      const vehicleSummary = vehicleData
        .map((v) => `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`)
        .join("; ");

      if (vehicleCountText) vehicleCountText.textContent = `${vehicleData.length} vehicles submitted.`;

      // Take screenshot and upload to Google Drive
      captureScreenshot().then((dataUrl) => {
        if (previewImg) previewImg.src = dataUrl;

        const now = new Date();
        const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "-").split(".")[0];
        let fileName = `${timestamp}_${studentName}_${studentClass}_${jobDescription}_with_${partnerName}.png`;
        fileName = fileName.replace(/\s+/g, "_").replace(/[^\w\-\.]/g, "");

        fetch(
          "https://script.google.com/macros/s/AKfycbzQFM9jcNCDPVg70SzmQ3hZIYahhDbTQXJ4UyqaTby81hTMWMmgxCtPX9nZxqHVfs_Mew/exec",
          {
            method: "POST",
            body: JSON.stringify({ image: dataUrl, filename: fileName }),
            headers: { "Content-Type": "application/json" },
          }
        );
      });

      // Prepare Google Form data submission
      const formData = new FormData();
      formData.append("entry.1202364028", "Mrs Cove"); // fixed teacher name
      formData.append("entry.1957249768", studentClass);
      formData.append("entry.436910009", studentName);
      formData.append("entry.169376211", jobDescription);
      formData.append("entry.1017965571", "1"); // some fixed field - e.g. attempt?
      formData.append("entry.1568301781", vehicleSummary);

      // Submit form silently (no-cors)
      fetch("https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse", {
        method: "POST",
        mode: "no-cors",
        body: formData,
      }).then(() => {
        // Hide all draggable vehicles after submission
        document.querySelectorAll(".draggable-wrapper").forEach((el) => (el.style.display = "none"));

        // Show modal with results, update UI rows and buttons
        if (endModal) endModal.classList.add("show");
        if (row1) row1.style.display = "none";
        if (row2) row2.style.display = "none";
        if (row3) row3.style.display = "flex";
        if (againBtn) againBtn.style.display = "inline-block";
        if (menuBtn) menuBtn.style.display = "inline-block";
        if (continueBtn) continueBtn.style.display = "none";
      });
    });
  }

  // -------------------------
  // "Again" button: clear saved vehicles & reload
  // -------------------------
  if (againBtn) {
    againBtn.addEventListener("click", () => {
      localStorage.removeItem("savedVehicles");
      window.location.reload();
    });
  }

  // -------------------------
  // "Menu" button: clear saved vehicles & go to hub
  // -------------------------
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      localStorage.removeItem("savedVehicles");
      window.location.href = "hub.html";
    });
  }

  // -------------------------
  // "Continue" button: save current vehicles, hide modal, restore vehicle display
  // -------------------------
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      const vehicleData = [];
      document.querySelectorAll(".draggable-wrapper").forEach((wrapper) => {
        const img = wrapper.querySelector("img");
        vehicleData.push({
          src: img.src,
          left: wrapper.style.left,
          top: wrapper.style.top,
          flipped: img.classList.contains("flipped-horizontal"),
        });
      });

      // Save current vehicle placements with today's date
      localStorage.setItem(
        "savedVehicles",
        JSON.stringify({
          savedDate: todayStr,
          vehicles: vehicleData,
        })
      );

      if (endModal) endModal.classList.remove("show");

      // Show all vehicles again
      document.querySelectorAll(".draggable-wrapper").forEach((el) => (el.style.display = "block"));
    });
  }

  // -------------------------
  // On page load: restore saved vehicles to palette if savedData exists
  // -------------------------
  if (savedData && savedData.vehicles && savedData.vehicles.length) {
    // Remove existing draggable-wrapper elements first
    document.querySelectorAll(".draggable-wrapper").forEach((el) => el.remove());

    // Recreate draggable vehicles from saved data
    savedData.vehicles.forEach((vehicle, i) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("draggable-wrapper");
      wrapper.style.position = "absolute";
      wrapper.style.left = vehicle.left;
      wrapper.style.top = vehicle.top;
      wrapper.style.zIndex = 1000;

      const img = document.createElement("img");
      img.src = vehicle.src;
      img.classList.add("dropped-vehicle");
      if (vehicle.flipped) img.classList.add("flipped-horizontal");
      img.style.pointerEvents = "none";

      wrapper.appendChild(img);

      // Add flip button for restored vehicle
      const flipBtn = document.createElement("button");
      flipBtn.className = "flip-btn";
      flipBtn.innerHTML = "↔";
      flipBtn.style.display = "none";
      flipBtn.onclick = (ev) => {
        ev.stopPropagation();
        img.classList.toggle("flipped-horizontal");
        saveVehiclesToStorage();
      };
      wrapper.appendChild(flipBtn);

      wrapper.addEventListener("mouseenter", () => (flipBtn.style.display = "block"));
      wrapper.addEventListener("mouseleave", () => (flipBtn.style.display = "none"));

      document.body.appendChild(wrapper);
    });
  }
});
