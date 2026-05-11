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
  // SESSION ID (CRITICAL MATCH KEY)
  // -------------------------
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx_fNusLoNCFW5DhCQf-gtDloq-nMOYKy2mnQgLNFZalylzHC_9eOGgE8vQSV3Q2SDiDw/exec";

  // -------------------------
  // ELEMENTS
  // -------------------------
  const studentInfo = document.getElementById("student-info");
  const palette = document.getElementById("vehicle-palette");
  const map = document.getElementById("map-container");

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

  const vehicleCountText = document.getElementById("vehicle-count");

  // -------------------------
  // GAME STATE
  // -------------------------
  let jobDescription = "";
  let partnerName = "";

  // -------------------------
  // SAVE GAME
  // -------------------------
  function saveGame() {
    const vehicleData = [];

    document.querySelectorAll(".draggable-wrapper").forEach(wrapper => {
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

  // -------------------------
  // RESTORE GAME
  // -------------------------
  function restoreGame() {
    const saved = JSON.parse(localStorage.getItem("savedVehicles") || "[]");
    saved.forEach(v => map.appendChild(createVehicle(v)));
  }

  // -------------------------
  // CREATE VEHICLE
  // -------------------------
  function createVehicle(v) {
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

    function update() {
      const flip = img.classList.contains("flipped-horizontal") ? -1 : 1;
      img.style.transform = `rotate(${rotation}deg) scaleX(${flip})`;
      wrapper.dataset.rotation = rotation;
      saveGame();
    }

    update();

    const rotateL = document.createElement("button");
    rotateL.innerHTML = "⟲";
    rotateL.onclick = e => {
      e.stopPropagation();
      rotation -= 90;
      update();
    };

    const rotateR = document.createElement("button");
    rotateR.innerHTML = "⟳";
    rotateR.onclick = e => {
      e.stopPropagation();
      rotation += 90;
      update();
    };

    const flipBtn = document.createElement("button");
    flipBtn.innerHTML = "↔";
    flipBtn.onclick = e => {
      e.stopPropagation();
      img.classList.toggle("flipped-horizontal");
      update();
    };

    wrapper.append(img, rotateL, rotateR, flipBtn);

    wrapper.addEventListener("dblclick", () => {
      wrapper.remove();
      saveGame();
    });

    return wrapper;
  }

  // -------------------------
  // START / RESUME
  // -------------------------
  const savedMeta = JSON.parse(localStorage.getItem("savedGameMeta") || "{}");

  if (localStorage.getItem("savedVehicles") && savedMeta.studentName === studentName) {
    resumeScreen.style.display = "block";
    resumeInfo.textContent =
      `${savedMeta.studentName} was ${savedMeta.jobDescription} instructions with ${savedMeta.partnerName}`;
  } else {
    startOverlay.style.display = "flex";
  }

  resumeContinue?.addEventListener("click", () => {
    resumeScreen.style.display = "none";
    startOverlay.style.display = "none";

    jobDescription = savedMeta.jobDescription;
    partnerName = savedMeta.partnerName;

    palette.style.display = "grid";
    stopBtn.style.display = "inline-block";

    studentInfo.textContent =
      `👤 ${studentName} (${studentClass})`;

    restoreGame();
  });

  resumeSubmit?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  startBtn?.addEventListener("click", () => {
    jobDescription = document.getElementById("job-description").value;
    partnerName = document.getElementById("partner-name").value.trim();

    if (!jobDescription || !partnerName) {
      alert("Fill all fields");
      return;
    }

    startOverlay.style.display = "none";
    palette.style.display = "grid";
    stopBtn.style.display = "inline-block";

    studentInfo.textContent = `👤 ${studentName} (${studentClass})`;

    saveGame();
  });

  // -------------------------
  // DRAG SYSTEM
  // -------------------------
  let dragged = null;
  let offsetX = 0;
  let offsetY = 0;

  function startDrag(e, touch = false) {
    const t = touch ? e.touches[0] : e.target;

    if (t.classList.contains("draggable") && t.parentElement === palette) {
      dragged = createVehicle({
        src: t.src,
        left: "0px",
        top: "0px",
        flipped: false,
        rotation: 0
      });
      map.appendChild(dragged);
    } else {
      dragged = t.closest(".draggable-wrapper");
    }

    if (!dragged) return;

    const rect = dragged.getBoundingClientRect();
    const cx = touch ? e.touches[0].clientX : e.clientX;
    const cy = touch ? e.touches[0].clientY : e.clientY;

    offsetX = cx - rect.left;
    offsetY = cy - rect.top;
  }

  function moveDrag(e, touch = false) {
    if (!dragged) return;

    const cx = touch ? e.touches[0].clientX : e.clientX;
    const cy = touch ? e.touches[0].clientY : e.clientY;

    dragged.style.left = cx - offsetX + "px";
    dragged.style.top = cy - offsetY + "px";
  }

  function endDrag() {
    if (dragged) saveGame();
    dragged = null;
  }

  document.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", moveDrag);
  document.addEventListener("mouseup", endDrag);

  document.addEventListener("touchstart", e => startDrag(e, true));
  document.addEventListener("touchmove", e => moveDrag(e, true));
  document.addEventListener("touchend", endDrag);

  // -------------------------
  // STOP
  // -------------------------
  stopBtn.onclick = () => {
    const count = document.querySelectorAll(".draggable-wrapper").length;

    stopMessage.textContent = `${studentName}`;
    vehicleCountText.textContent = `${count} items`;

    stopModal.style.display = "flex";
  };

  stopContinue.onclick = () => stopModal.style.display = "none";
  stopSubmit.onclick = () => {
    stopModal.style.display = "none";
    finishBtn.click();
  };

  // -------------------------
  // FINISH (FIXED)
  // -------------------------
  finishBtn?.addEventListener("click", async () => {

    console.log("FINISH CLICKED");

    const vehicleData = [];

    document.querySelectorAll(".draggable-wrapper").forEach(wrapper => {
      const img = wrapper.querySelector("img");

      vehicleData.push({
        vehicle: img.src.split("/").pop().split(".")[0],
        x: parseFloat(wrapper.style.left) || 0,
        y: parseFloat(wrapper.style.top) || 0,
        flipped: img.classList.contains("flipped-horizontal"),
        rotation: wrapper.dataset.rotation || 0
      });
    });

    const payload = {
      sessionId,
      studentName,
      studentClass,
      role: jobDescription,
      partnerName,
      vehicleData
    };

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      localStorage.clear();
      window.location.href = "../index.html";

    } catch (err) {
      console.error("Finish error:", err);
      alert("Submit failed (check Apps Script deployment)");
    }
  });

});
