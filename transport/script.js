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
  // SESSION (CRITICAL FOR MATCHING GIVER/FOLLOWER)
  // -------------------------
  let sessionId = localStorage.getItem("sessionId");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }

  // -------------------------
  // ELEMENTS
  // -------------------------
  const studentInfo = document.getElementById("student-info");
  const palette = document.getElementById("vehicle-palette");
  const role = jobDescription;

  const finishBtn = document.getElementById("finish-btn");
  const stopBtn = document.getElementById("stop-btn");

  const startOverlay = document.getElementById("startOverlay");
  const startBtn = document.getElementById("start-btn");

  const stopModal = document.getElementById("stop-modal");
  const stopMessage = document.getElementById("stop-message");
  const stopContinue = document.getElementById("stop-continue");
  const stopSubmit = document.getElementById("stop-submit");

  const resumeScreen = document.getElementById("resume-screen");
  const resumeInfo = document.getElementById("resume-info");
  const resumeContinue = document.getElementById("resume-continue");
  const resumeSubmit = document.getElementById("resume-submit");

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_fNusLoNCFW5DhCQf-gtDloq-nMOYKy2mnQgLNFZalylzHC_9eOGgE8vQSV3Q2SDiDw/exec";

  const map = document.getElementById("map-container");
  const vehicleCountText = document.getElementById("vehicle-count");
  const previewImg = document.getElementById("map-preview");

  let jobDescription = "";
  let partnerName = "";

  let sessionId = localStorage.getItem("sessionId");

  if (!sessionId) {
  sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem("sessionId", sessionId);
  }
  // -------------------------
  // SAVE / RESTORE (LOCAL ONLY)
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
  sessionId,
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
  // VEHICLE CREATION
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
  const savedMeta = JSON.parse(localStorage.getItem("savedGameMeta") || "{}");

  if (localStorage.getItem("savedVehicles") && savedMeta.studentName === studentName) {
    resumeScreen.style.display = "block";
    resumeInfo.textContent =
      `${savedMeta.studentName} was ${savedMeta.jobDescription} instructions with ${savedMeta.partnerName}`;
  } else {
    startOverlay.style.display = "flex";
  }

  // -------------------------
  // RESUME CONTINUE
  // -------------------------
  if (resumeContinue) {
    resumeContinue.onclick = () => {
      resumeScreen.style.display = "none";
      startOverlay.style.display = "none";

      jobDescription = savedMeta.jobDescription;
      partnerName = savedMeta.partnerName;

      palette.style.display = "grid";
      stopBtn.style.display = "inline-block";

      studentInfo.textContent =
        `👤 ${studentName} (${studentClass})
${jobDescription} instructions with ${partnerName}`;

      restoreGame();
    };
  }

  // -------------------------
  // START GAME
  // -------------------------
  if (startBtn) {
    startBtn.addEventListener("click", () => {

      const jobSelect = document.getElementById("job-description");
      const partnerInput = document.getElementById("partner-name");

      jobDescription = jobSelect.value;
      partnerName = partnerInput.value.trim();

      if (!jobDescription || !partnerName) {
        alert("Please complete all fields");
        return;
      }

      startOverlay.style.display = "none";
      palette.style.display = "grid";
      stopBtn.style.display = "inline-block";

      studentInfo.textContent =
        `👤 ${studentName} (${studentClass})
${jobDescription} instructions with ${partnerName}`;

      saveGame();
    });
  }

  // -------------------------
  // DRAG SYSTEM
  // -------------------------
  let dragged = null;
  let offsetX = 0;
  let offsetY = 0;

  function startDrag(e, touch = false) {
    const target = touch ? e.targetTouches[0].target : e.target;

    const clientX = touch ? e.targetTouches[0].clientX : e.clientX;
    const clientY = touch ? e.targetTouches[0].clientY : e.clientY;

    if (target.classList.contains("draggable") && target.parentElement === palette) {
      const wrapper = createVehicleFromData({
        src: target.src,
        left: `${clientX - 40}px`,
        top: `${clientY - 40}px`,
        flipped: false,
        rotation: 0
      });

      map.appendChild(wrapper);
      dragged = wrapper;

      offsetX = 40;
      offsetY = 40;
    }

    else if (target.closest(".draggable-wrapper")) {
      dragged = target.closest(".draggable-wrapper");
      const rect = dragged.getBoundingClientRect();

      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
    }

    if (!dragged) return;

    dragged.style.zIndex = 2000;
    e.preventDefault();
  }

  function moveDrag(e, touch = false) {
    if (!dragged) return;

    const clientX = touch ? e.targetTouches[0].clientX : e.clientX;
    const clientY = touch ? e.targetTouches[0].clientY : e.clientY;

    dragged.style.left = clientX - offsetX + "px";
    dragged.style.top = clientY - offsetY + "px";
  }

  function endDrag() {
    if (dragged) {
      dragged.style.zIndex = "";
      saveGame();
    }
    dragged = null;
  }

  document.body.addEventListener("mousedown", startDrag);
  document.body.addEventListener("mousemove", moveDrag);
  document.body.addEventListener("mouseup", endDrag);

  document.body.addEventListener("touchstart", (e) => startDrag(e, true), { passive: false });
  document.body.addEventListener("touchmove", (e) => moveDrag(e, true), { passive: false });
  document.body.addEventListener("touchend", endDrag);

  // -------------------------
  // STOP BUTTON
  // -------------------------
  stopBtn.onclick = () => {
    const count = document.querySelectorAll(".draggable-wrapper").length;

    stopMessage.textContent =
      `${studentName} is ${jobDescription} instructions with ${partnerName}`;

    vehicleCountText.textContent = `${count} items placed`;

    stopModal.style.display = "flex";
  };

  // -------------------------
  // STOP ACTIONS (SUBMIT)
  // -------------------------
  if (stopSubmit) {
    stopSubmit.onclick = () => {
      stopModal.style.display = "none";

      if (finishBtn) finishBtn.click();
    };
  }

  if (stopContinue) {
    stopContinue.onclick = () => {
      stopModal.style.display = "none";
    };
  }

// -------------------------
// FINISH → SEND TO APPS SCRIPT (SESSION MATCHING SYSTEM)
// -------------------------
if (finishBtn) {
  finishBtn.addEventListener("click", () => {

    const vehicleData = [];

    document.querySelectorAll(".draggable-wrapper").forEach((wrapper) => {
      const img = wrapper.querySelector("img");

      vehicleData.push({
        vehicle: decodeURIComponent(img.src.split("/").pop().split(".")[0]),
        x: parseFloat(wrapper.style.left),
        y: parseFloat(wrapper.style.top),
        flipped: img.classList.contains("flipped-horizontal"),
        rotation: wrapper.dataset.rotation || 0
      });
    });

    const vehicleSummary = vehicleData
      .map(v =>
        `${v.vehicle} at (${v.x}, ${v.y})${v.flipped ? " [flipped]" : ""}`
      )
      .join("; ");

    const sessionId =
      localStorage.getItem("sessionId") ||
      `${studentClass}_${partnerName}`;

fetch(SCRIPT_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    sessionId,
    studentName,
    studentClass,
    role: jobDescription,
    partnerName,
    vehicleSummary,
    vehicleData
  })
})
.then(() => {

  localStorage.removeItem("savedVehicles");
  localStorage.removeItem("savedGameMeta");

  setTimeout(() => {
    window.location.href = "../index.html";
  }, 800);

});

  });
}

  function captureScreenshot() {
    return html2canvas(document.body)
      .then(canvas => canvas.toDataURL("image/png"));
  }

});
