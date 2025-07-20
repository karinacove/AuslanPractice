const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSd8nbI_Nck6x7Jkpv6t61tpAvZC1MQyTLwnNqOLiNipVwAt1A/formResponse";

document.addEventListener("DOMContentLoaded", function () {
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

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

  const row1 = document.getElementById("row-1"); // preview + download
  const row2 = document.getElementById("row-2"); // count + continue
  const row3 = document.getElementById("row-3"); // again + menu

  let jobDescription = localStorage.getItem("partnerJob") || "";
  let partnerName = localStorage.getItem("partnerName") || "";
  const todayStr = new Date().toISOString().slice(0, 10);

  let savedData = null;
  const savedDataJSON = localStorage.getItem("savedVehicles");
  if (savedDataJSON) {
    try {
      savedData = JSON.parse(savedDataJSON);
      if (savedData.savedDate !== todayStr) {
        savedData = null;
        localStorage.removeItem("savedVehicles");
      }
    } catch {
      savedData = null;
      localStorage.removeItem("savedVehicles");
    }
  }

  function showInitialModal() {
    endModal.classList.add("show");
    row1.style.display = "flex";
    row2.style.display = "flex";
    row3.style.display = "none";

    downloadBtn.style.display = "inline-block";
    continueBtn.style.display = "inline-block";
    againBtn.style.display = "inline-block";
    menuBtn.style.display = "none";

    if (vehicleCountText && savedData) {
      vehicleCountText.textContent = `${savedData.vehicles.length} vehicles previously placed. Partner: ${partnerName} Job: ${jobDescription}`;
    }

    previewImg.src = savedData.screenshotDataUrl || "";
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

  if (
    savedData &&
    Array.isArray(savedData.vehicles) &&
    savedData.vehicles.length > 0 &&
    partnerName.trim() !== "" &&
    jobDescription.trim() !== ""
  ) {
    showInitialModal();
    form.style.display = "none";
    palette.style.display = "none";
    finishBtn.style.display = "none";
    studentInfo.style.display = "block";
    studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
  } else {
    localStorage.removeItem("savedVehicles");
    localStorage.removeItem("partnerName");
    localStorage.removeItem("partnerJob");

    form.style.display = "block";
    palette.style.display = "none";
    finishBtn.style.display = "none";
    studentInfo.style.display = "none";
    endModal.classList.remove("show");
  }

  continueBtn.addEventListener("click", () => {
    if (!savedData) return;
    form.style.display = "none";
    palette.style.display = "grid";
    finishBtn.style.display = "inline-block";
    studentInfo.style.display = "block";
    studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
    endModal.classList.remove("show");
    restoreSavedVehicles();
    document.querySelectorAll(".draggable-wrapper").forEach((el) => (el.style.display = "block"));
  });

  downloadBtn.addEventListener("click", async () => {
    if (!savedData) return;
    downloadBtn.style.pointerEvents = "none";
    let screenshotDataUrl = await captureScreenshot();
    savedData.screenshotDataUrl = screenshotDataUrl;
    localStorage.setItem("savedVehicles", JSON.stringify(savedData));
    localStorage.setItem("screenshotData", screenshotDataUrl);

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "-").split(".")[0];
    let fileName = `${timestamp}_${studentName}_${studentClass}_${jobDescription}_with_${partnerName}.png`;
    fileName = fileName.replace(/\s+/g, "_").replace(/[^\w\-\.]/g, "");

    await fetch(
      "https://script.google.com/macros/s/AKfycbzQFM9jcNCDPVg70SzmQ3hZIYahhDbTQXJ4UyqaTby81hTMWMmgxCtPX9nZxqHVfs_Mew/exec",
      {
        method: "POST",
        body: JSON.stringify({ image: screenshotDataUrl, filename: fileName }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const formData = new FormData();
    formData.append("entry.1202364028", "Mrs Cove");
    formData.append("entry.1957249768", studentClass);
    formData.append("entry.436910009", studentName);
    formData.append("entry.169376211", jobDescription);
    formData.append("entry.1017965571", "1");
    const vehicleSummary = savedData.vehicles
      .map(v => {
        const name = v.src.split("/").pop().split(".")[0];
        return `${name} at (${v.left},${v.top})${v.flipped ? " [flipped]" : ""}`;
      })
      .join("; ");
    formData.append("entry.1568301781", vehicleSummary);

    await fetch("https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse", {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    showPostUploadModal();
    downloadBtn.style.pointerEvents = "auto";
  });

  againBtn.addEventListener("click", () => {
    localStorage.removeItem("savedVehicles");
    localStorage.removeItem("partnerName");
    localStorage.removeItem("partnerJob");
    localStorage.removeItem("screenshotData");
    window.location.reload();
  });

  menuBtn.addEventListener("click", () => {
    localStorage.removeItem("savedVehicles");
    localStorage.removeItem("partnerName");
    localStorage.removeItem("partnerJob");
    localStorage.removeItem("screenshotData");
    window.location.href = "hub.html";
  });

  function captureScreenshot() {
    return html2canvas(document.body).then((canvas) => canvas.toDataURL("image/png"));
  }

  function restoreSavedVehicles() {
    if (!savedData || !savedData.vehicles) return;
    document.querySelectorAll(".draggable-wrapper").forEach((el) => el.remove());

    savedData.vehicles.forEach((vehicle) => {
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
        screenshotDataUrl: savedData ? savedData.screenshotDataUrl : null,
      })
    );

    if (partnerName) localStorage.setItem("partnerName", partnerName);
    if (jobDescription) localStorage.setItem("partnerJob", jobDescription);
  }
});

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
