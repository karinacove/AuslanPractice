document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // Student Sign-in Handling
  // -------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  const studentInfo = document.getElementById("student-info");
  const palette = document.getElementById("vehicle-palette");

  const finishBtn = document.getElementById("finish-btn"); 
  const stopBtn = document.getElementById("stop-btn"); 

  const startOverlay = document.getElementById("startOverlay");
  const startBtn = document.getElementById("start-btn");

  const stopModal = document.getElementById("stop-modal"); 
  const stopMessage = document.getElementById("stop-message");
  const continueGame = document.getElementById("continue-game");
  const submitGame = document.getElementById("submit-game");

  const endModal = document.getElementById("end-modal");
  const againBtn = document.getElementById("again-btn");
  const menuBtn = document.getElementById("menu-btn");
  const continueBtn = document.getElementById("continue-btn");

  const previewImg = document.getElementById("map-preview");
  const vehicleCountText = document.getElementById("vehicle-count");

  const row1 = document.getElementById("row-1");
  const row2 = document.getElementById("row-2");
  const row3 = document.getElementById("row-3");

  let jobDescription = "";
  let partnerName = "";

  if (endModal) endModal.classList.remove("show");

  // -------------------------
  // START OVERLAY
  // -------------------------
  if (startBtn) {
    startOverlay.style.display = "flex";

    startBtn.addEventListener("click", () => {
      jobDescription = document.getElementById("job-description").value;
      partnerName = document.getElementById("partner-name").value;

      if (!jobDescription || !partnerName) return;

      startOverlay.style.display = "none";

      if (palette) palette.style.display = "grid";
      if (stopBtn) stopBtn.style.display = "inline-block";

      if (studentInfo) {
        studentInfo.style.display = "block";
        studentInfo.textContent =
          `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
      }
    });
  }

  // -------------------------
  // DRAG SYSTEM
  // -------------------------
  const MAX_VEHICLES = 12;
  let dragged = null;

  function startDrag(e, isTouch = false) {
    const target = isTouch ? e.targetTouches[0].target : e.target;

    if (!target.classList.contains("draggable") || target.parentElement !== palette) return;
    if (document.querySelectorAll(".draggable-wrapper").length >= MAX_VEHICLES) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("draggable-wrapper");

    const clone = target.cloneNode(true);
    clone.classList.add("dropped-vehicle");
    clone.style.pointerEvents = "none";

    let rotation = 0;

    function updateTransform() {
      const flip = clone.classList.contains("flipped-horizontal") ? -1 : 1;
      clone.style.transform = `rotate(${rotation}deg) scaleX(${flip})`;
    }

    // -------------------------
    // ROTATE + FLIP BUTTONS
    // -------------------------
    const rotateLeftBtn = document.createElement("button");
    rotateLeftBtn.innerHTML = "⟲";
    rotateLeftBtn.className = "rotate-left-btn";

    rotateLeftBtn.onclick = (ev) => {
      ev.stopPropagation();
      rotation -= 90;
      updateTransform();
    };

    const rotateRightBtn = document.createElement("button");
    rotateRightBtn.innerHTML = "⟳";
    rotateRightBtn.className = "rotate-right-btn";

    rotateRightBtn.onclick = (ev) => {
      ev.stopPropagation();
      rotation += 90;
      updateTransform();
    };

    const flipBtn = document.createElement("button");
    flipBtn.className = "flip-btn";
    flipBtn.innerHTML = "↔";

    flipBtn.onclick = (ev) => {
      ev.stopPropagation();
      clone.classList.toggle("flipped-horizontal");
      updateTransform();
    };

    wrapper.appendChild(clone);
    wrapper.appendChild(rotateLeftBtn);
    wrapper.appendChild(rotateRightBtn);
    wrapper.appendChild(flipBtn);

    wrapper.addEventListener("mouseenter", () => {
      rotateLeftBtn.style.display = "block";
      rotateRightBtn.style.display = "block";
      flipBtn.style.display = "block";
    });

    wrapper.addEventListener("mouseleave", () => {
      rotateLeftBtn.style.display = "none";
      rotateRightBtn.style.display = "none";
      flipBtn.style.display = "none";
    });

    // -------------------------
    // DELETE (DOUBLE TAP / CLICK)
    // -------------------------
    let lastTap = 0;

    wrapper.addEventListener("touchend", () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        wrapper.remove();
      }
      lastTap = now;
    });

    wrapper.addEventListener("dblclick", () => {
      wrapper.remove();
    });

    // -------------------------
    // ADD TO MAP
    // -------------------------
    const map = document.getElementById("map-container");
    map.appendChild(wrapper);

    dragged = wrapper;

    const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
    const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;

    dragged.offsetX = 40;
    dragged.offsetY = 40;

    dragged.style.left = clientX - dragged.offsetX + "px";
    dragged.style.top = clientY - dragged.offsetY + "px";

    e.preventDefault();
  }

  function moveDrag(e, isTouch = false) {
    if (!dragged) return;

    const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
    const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;

    dragged.style.left = clientX - dragged.offsetX + "px";
    dragged.style.top = clientY - dragged.offsetY + "px";
  }

  function endDrag() {
    dragged = null;
  }

  document.body.addEventListener("mousedown", (e) => startDrag(e));
  document.body.addEventListener("mousemove", moveDrag);
  document.body.addEventListener("mouseup", endDrag);

  document.body.addEventListener("touchstart", (e) => startDrag(e, true), { passive: false });
  document.body.addEventListener("touchmove", (e) => moveDrag(e, true), { passive: false });
  document.body.addEventListener("touchend", endDrag);

  // -------------------------
  // STOP MODAL (NEW)
  // -------------------------
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      const count = document.querySelectorAll(".draggable-wrapper").length;

      stopMessage.textContent =
        `${studentName} is ${jobDescription} instructions with ${partnerName}`;

      vehicleCountText.textContent = `${count} items placed`;

      stopModal.style.display = "flex";
    });
  }

  if (continueGame) {
    continueGame.onclick = () => {
      stopModal.style.display = "none";
    };
  }

  if (submitGame) {
    submitGame.onclick = () => {
      stopModal.style.display = "none";
      finishBtn.click(); // 🔥 triggers your ORIGINAL submission logic
    };
  }

  // -------------------------
  // ORIGINAL FINISH LOGIC (UNCHANGED)
  // -------------------------
  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      const placedVehicles = document.querySelectorAll(".draggable-wrapper");
      const vehicleData = [];

      placedVehicles.forEach((wrapper) => {
        const img = wrapper.querySelector("img");
        const isFlipped = img.classList.contains("flipped-horizontal");

        vehicleData.push({
          name: img.src.split("/").pop().split(".")[0],
          x: wrapper.style.left,
          y: wrapper.style.top,
          flipped: isFlipped
        });
      });

      vehicleData.sort((a, b) => a.name.localeCompare(b.name));

      const vehicleSummary = vehicleData
        .map((v) => `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`)
        .join("; ");

      if (vehicleCountText) vehicleCountText.textContent = `${vehicleData.length} vehicles submitted.`;

      captureScreenshot().then((dataUrl) => {
        if (previewImg) previewImg.src = dataUrl;

        const now = new Date();
        const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
        const fileName = `${timestamp}_${studentName}_${studentClass}_${jobDescription}_with_${partnerName}.png`
          .replace(/\s+/g, '_')
          .replace(/[^\w\-\.]/g, '');

        fetch("https://script.google.com/macros/s/AKfycbzQFM9jcNCDPVg70SzmQ3hZIYahhDbTQXJ4UyqaTby81hTMWMmgxCtPX9nZxqHVfs_Mew/exec", {
          method: "POST",
          body: JSON.stringify({ image: dataUrl, filename: fileName }),
          headers: { "Content-Type": "application/json" }
        });
      });

      const formData = new FormData();
      formData.append("entry.1202364028", "Mrs Cove");
      formData.append("entry.1957249768", studentClass);
      formData.append("entry.436910009", studentName);
      formData.append("entry.169376211", jobDescription);
      formData.append("entry.1017965571", "1");
      formData.append("entry.1568301781", vehicleSummary);

      fetch("https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse", {
        method: "POST",
        mode: "no-cors",
        body: formData
      }).then(() => {
        document.querySelectorAll(".draggable-wrapper").forEach((el) => (el.style.display = "none"));
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
  // SCREENSHOT
  // -------------------------
  function captureScreenshot() {
    return html2canvas(document.body).then((canvas) => canvas.toDataURL("image/png"));
  }

  // -------------------------
  // EXISTING BUTTONS
  // -------------------------
  if (againBtn) {
    againBtn.addEventListener("click", () => {
      localStorage.removeItem("savedVehicles");
      window.location.reload();
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      localStorage.removeItem("savedVehicles");
      window.location.href = "hub.html";
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      const vehicleData = [];
      document.querySelectorAll(".draggable-wrapper").forEach((wrapper) => {
        const img = wrapper.querySelector("img");
        vehicleData.push({
          src: img.src,
          left: wrapper.style.left,
          top: wrapper.style.top,
          flipped: img.classList.contains("flipped-horizontal")
        });
      });

      localStorage.setItem("savedVehicles", JSON.stringify(vehicleData));
      if (endModal) endModal.classList.remove("show");
      document.querySelectorAll(".draggable-wrapper").forEach((el) => (el.style.display = "block"));
    });
  }
});
