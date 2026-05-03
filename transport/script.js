document.addEventListener("DOMContentLoaded", () => {

  // -------------------------
  // STUDENT INFO
  // -------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  // -------------------------
  // ELEMENTS
  // -------------------------
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

  const resumeScreen = document.getElementById("resume-screen");
  const resumeInfo = document.getElementById("resume-info");
  const resumeContinue = document.getElementById("resume-continue");
  const resumeAgain = document.getElementById("resume-again");
  const resumeMenu = document.getElementById("resume-menu");

  const endModal = document.getElementById("end-modal");
  const againBtn = document.getElementById("again-btn");
  const menuBtn = document.getElementById("menu-btn");
  const continueBtn = document.getElementById("continue-btn");

  const previewImg = document.getElementById("map-preview");
  const vehicleCountText = document.getElementById("vehicle-count");

  const row1 = document.getElementById("row-1");
  const row2 = document.getElementById("row-2");
  const row3 = document.getElementById("row-3");

  const map = document.getElementById("map-container");

  let jobDescription = "";
  let partnerName = "";

  // -------------------------
  // SAVE / RESTORE
  // -------------------------
  function saveGame() {
    const vehicleData = [];

    document.querySelectorAll(".draggable-wrapper").forEach((wrapper) => {
      const img = wrapper.querySelector("img");

      vehicleData.push({
        src: img.src,
        left: wrapper.style.left,
        top: wrapper.style.top,
        flipped: img.classList.contains("flipped-horizontal"),
        rotation: wrapper.dataset.rotation || 0
      });
    });

    localStorage.setItem("savedVehicles", JSON.stringify(vehicleData));
    localStorage.setItem("savedGameMeta", JSON.stringify({
      studentName,
      studentClass,
      jobDescription,
      partnerName
    }));
  }

  function restoreGame() {
    const saved = JSON.parse(localStorage.getItem("savedVehicles") || "[]");

    saved.forEach(v => {
      const wrapper = createVehicleFromData(v);
      map.appendChild(wrapper);
    });
  }

  // -------------------------
  // CREATE VEHICLE (REUSABLE)
  // -------------------------
  function createVehicleFromData(v) {
    const wrapper = document.createElement("div");
    wrapper.className = "draggable-wrapper";
    wrapper.style.left = v.left;
    wrapper.style.top = v.top;

    let rotation = parseInt(v.rotation) || 0;
    wrapper.dataset.rotation = rotation;

    const img = document.createElement("img");
    img.src = v.src;
    img.className = "dropped-vehicle";

    if (v.flipped) img.classList.add("flipped-horizontal");

    function updateTransform() {
      const flip = img.classList.contains("flipped-horizontal") ? -1 : 1;
      img.style.transform = `rotate(${rotation}deg) scaleX(${flip})`;
      wrapper.dataset.rotation = rotation;
      saveGame();
    }

    updateTransform();

    // ROTATE + FLIP
    const rotateLeftBtn = document.createElement("button");
    rotateLeftBtn.innerHTML = "⟲";
    rotateLeftBtn.className = "rotate-left-btn";
    rotateLeftBtn.onclick = (e) => {
      e.stopPropagation();
      rotation -= 90;
      updateTransform();
    };

    const rotateRightBtn = document.createElement("button");
    rotateRightBtn.innerHTML = "⟳";
    rotateRightBtn.className = "rotate-right-btn";
    rotateRightBtn.onclick = (e) => {
      e.stopPropagation();
      rotation += 90;
      updateTransform();
    };

    const flipBtn = document.createElement("button");
    flipBtn.innerHTML = "↔";
    flipBtn.className = "flip-btn";
    flipBtn.onclick = (e) => {
      e.stopPropagation();
      img.classList.toggle("flipped-horizontal");
      updateTransform();
    };

    wrapper.appendChild(img);
    wrapper.appendChild(rotateLeftBtn);
    wrapper.appendChild(rotateRightBtn);
    wrapper.appendChild(flipBtn);

    // SHOW BUTTONS
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

    // DELETE
    let lastTap = 0;

    wrapper.addEventListener("touchend", () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        wrapper.remove();
        saveGame();
      }
      lastTap = now;
    });

    wrapper.addEventListener("dblclick", () => {
      wrapper.remove();
      saveGame();
    });

    return wrapper;
  }

  // -------------------------
  // RESUME LOGIC
  // -------------------------
  const savedVehicles = localStorage.getItem("savedVehicles");
  const savedMeta = JSON.parse(localStorage.getItem("savedGameMeta") || "{}");

  if (savedVehicles && savedMeta.studentName === studentName) {
    resumeScreen.style.display = "block";

    resumeInfo.textContent =
      `${savedMeta.studentName} was ${savedMeta.jobDescription} instructions with ${savedMeta.partnerName}`;
  } else {
    startOverlay.style.display = "flex";
  }

  resumeContinue.onclick = () => {
    resumeScreen.style.display = "none";

    jobDescription = savedMeta.jobDescription;
    partnerName = savedMeta.partnerName;

    palette.style.display = "grid";
    stopBtn.style.display = "inline-block";

    studentInfo.style.display = "block";
    studentInfo.textContent =
      `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;

    restoreGame();
  };

  resumeAgain.onclick = () => {
    localStorage.clear();
    location.reload();
  };

  resumeMenu.onclick = () => {
    localStorage.clear();
    window.location.href = "hub.html";
  };

  // -------------------------
  // START BUTTON
  // -------------------------
// -------------------------
// START BUTTON (FIXED)
// -------------------------
if (startBtn && startOverlay) {
  startOverlay.style.display = "flex";

  startBtn.addEventListener("click", () => {
    const jobSelect = document.getElementById("job-description");
    const partnerInput = document.getElementById("partner-name");

    if (!jobSelect || !partnerInput) return;

    jobDescription = jobSelect.value;
    partnerName = partnerInput.value.trim();

    if (jobDescription === "" || partnerName === "") {
      alert("Please select role and enter partner name");
      return;
    }

    startOverlay.style.display = "none";

    if (palette) palette.style.display = "grid";
    if (document.getElementById("stop-btn")) {
      document.getElementById("stop-btn").style.display = "inline-block";
    }

    if (studentInfo) {
      studentInfo.style.display = "block";
      studentInfo.textContent =
        `👤 ${studentName} (${studentClass})\n${jobDescription} instructions with ${partnerName}`;
    }

    saveGame();
  });
}

  // -------------------------
  // DRAG FROM PALETTE
  // -------------------------
  let dragged = null;

  function startDrag(e, isTouch = false) {
    const target = isTouch ? e.targetTouches[0].target : e.target;

    if (!target.classList.contains("draggable") || target.parentElement !== palette) return;

    const wrapper = createVehicleFromData({
      src: target.src,
      left: "0px",
      top: "0px",
      flipped: false,
      rotation: 0
    });

    map.appendChild(wrapper);
    dragged = wrapper;

    const clientX = isTouch ? e.targetTouches[0].clientX : e.clientX;
    const clientY = isTouch ? e.targetTouches[0].clientY : e.clientY;

    dragged.offsetX = 40;
    dragged.offsetY = 40;

    dragged.style.left = clientX - dragged.offsetX + "px";
    dragged.style.top = clientY - dragged.offsetY + "px";

    saveGame();
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
    if (dragged) saveGame();
    dragged = null;
  }

  document.body.addEventListener("mousedown", startDrag);
  document.body.addEventListener("mousemove", moveDrag);
  document.body.addEventListener("mouseup", endDrag);

  document.body.addEventListener("touchstart", (e) => startDrag(e, true), { passive: false });
  document.body.addEventListener("touchmove", (e) => moveDrag(e, true), { passive: false });
  document.body.addEventListener("touchend", endDrag);

  // -------------------------
  // STOP MODAL
  // -------------------------
  stopBtn.onclick = () => {
    const count = document.querySelectorAll(".draggable-wrapper").length;

    stopMessage.textContent =
      `${studentName} is ${jobDescription} instructions with ${partnerName}`;

    vehicleCountText.textContent = `${count} items placed`;

    stopModal.style.display = "flex";
  };

  continueGame.onclick = () => {
    stopModal.style.display = "none";
  };

  submitGame.onclick = () => {
    stopModal.style.display = "none";
    finishBtn.click();
  };

  // -------------------------
  // ORIGINAL FINISH LOGIC (UNCHANGED)
  // -------------------------
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

    const vehicleSummary = vehicleData
      .map((v) => `${v.name} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`)
      .join("; ");

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
    });
  });

  function captureScreenshot() {
    return html2canvas(document.body).then((canvas) => canvas.toDataURL("image/png"));
  }
});
