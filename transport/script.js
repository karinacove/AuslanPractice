document.addEventListener("DOMContentLoaded", () => {
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  const partnerName = localStorage.getItem("partnerName") || "";
  const jobDescription = localStorage.getItem("jobDescription") || "";
  const savedVehicles = JSON.parse(localStorage.getItem("placedVehicles") || "[]");
  const savedDate = localStorage.getItem("savedDate");

  const todayStr = new Date().toISOString().slice(0, 10);
  const MAX_VEHICLES = 12;
  let dragged = null;

  const palette = document.getElementById("vehicle-palette");
  const startOverlay = document.getElementById("startOverlay"); // 🔄 fixed ID
  const startBtn = document.getElementById("start-btn");
  const finishBtn = document.getElementById("finish-btn");
  const endModal = document.getElementById("end-modal");
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const menuBtn = document.getElementById("menu-btn");
  const downloadBtn = document.getElementById("download-btn");
  const previewImg = document.getElementById("map-preview");
  const vehicleCountText = document.getElementById("vehicle-count");
  const studentInfo = document.getElementById("student-info");

  const partnerInput = document.getElementById("partner-name");
  const jobInput = document.getElementById("job-description");

  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }

  function isSameDay(dateStr1, dateStr2) {
    return dateStr1 === dateStr2;
  }

  function saveVehiclesToStorage() {
    const wrappers = document.querySelectorAll(".draggable-wrapper");
    const data = [];
    wrappers.forEach(wrapper => {
      const img = wrapper.querySelector("img");
      data.push({
        src: img.src,
        left: wrapper.style.left,
        top: wrapper.style.top,
        flipped: img.classList.contains("flipped-horizontal")
      });
    });
    localStorage.setItem("placedVehicles", JSON.stringify(data));
    localStorage.setItem("savedDate", todayStr);
  }

  function restoreVehiclesFromStorage() {
    const data = JSON.parse(localStorage.getItem("placedVehicles") || "[]");
    data.forEach(item => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("draggable-wrapper");
      wrapper.style.position = "absolute";
      wrapper.style.left = item.left;
      wrapper.style.top = item.top;

      const img = document.createElement("img");
      img.src = item.src;
      img.classList.add("dropped-vehicle");
      if (item.flipped) img.classList.add("flipped-horizontal");
      img.style.pointerEvents = "none";

      const flipBtn = document.createElement("button");
      flipBtn.className = "flip-btn";
      flipBtn.innerHTML = "↔";
      flipBtn.style.display = "none";
      flipBtn.onclick = ev => {
        ev.stopPropagation();
        img.classList.toggle("flipped-horizontal");
        saveVehiclesToStorage();
      };

      wrapper.addEventListener("mouseenter", () => (flipBtn.style.display = "block"));
      wrapper.addEventListener("mouseleave", () => (flipBtn.style.display = "none"));
      wrapper.ondblclick = () => {
        wrapper.remove();
        saveVehiclesToStorage();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(flipBtn);
      document.body.appendChild(wrapper);
    });
  }

  function showModal() {
    if (endModal) endModal.classList.add("show");
    if (vehicleCountText) vehicleCountText.textContent = `${savedVehicles.length} vehicles placed with ${partnerName}`;
    if (studentInfo) studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
  }

  function clearDataAndReload() {
    localStorage.removeItem("placedVehicles");
    localStorage.removeItem("partnerName");
    localStorage.removeItem("jobDescription");
    localStorage.removeItem("savedDate");
    window.location.reload();
  }

  // 💡 Fixed conditional display
  if (isSameDay(savedDate, todayStr) && savedVehicles.length > 0 && partnerName && jobDescription) {
    showModal();
  } else if (startOverlay) {
    startOverlay.style.display = "flex";
  }

  startBtn.addEventListener("click", () => {
    const pName = partnerInput.value.trim();
    const jDesc = jobInput.value.trim();
    if (!pName || !jDesc) {
      alert("Please enter partner name and job description.");
      return;
    }
    localStorage.setItem("partnerName", pName);
    localStorage.setItem("jobDescription", jDesc);
    startOverlay.style.display = "none";
    palette.style.display = "grid";
    finishBtn.style.display = "inline-block";
    if (studentInfo) studentInfo.textContent = `👤 ${studentName} (${studentClass})\n${jDesc} with ${pName}`;
  });

  continueBtn.addEventListener("click", () => {
    endModal.classList.remove("show");
    palette.style.display = "grid";
    finishBtn.style.display = "inline-block";
    restoreVehiclesFromStorage();
  });

  againBtn.addEventListener("click", clearDataAndReload);

  menuBtn.addEventListener("click", () => {
    clearDataAndReload();
    window.location.href = "hub.html";
  });

  downloadBtn.addEventListener("click", async () => {
    const canvas = await html2canvas(document.body);
    const dataUrl = canvas.toDataURL("image/png");
    if (previewImg) previewImg.src = dataUrl;

    const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
    const fileName = `${timestamp}_${studentClass}_${studentName}_${jobDescription}_with_${partnerName}`.replace(/\s+/g, "_");

    fetch("https://script.google.com/macros/s/AKfycbzQFM9jcNCDPVg70SzmQ3hZIYahhDbTQXJ4UyqaTby81hTMWMmgxCtPX9nZxqHVfs_Mew/exec", {
      method: "POST",
      body: JSON.stringify({ image: dataUrl, filename: fileName }),
      headers: { "Content-Type": "application/json" },
    });

    const wrappers = document.querySelectorAll(".draggable-wrapper");
    const vehicleSummary = Array.from(wrappers).map(wrapper => {
      const img = wrapper.querySelector("img");
      const name = img.src.split("/").pop().split(".")[0];
      const flipped = img.classList.contains("flipped-horizontal") ? " [flipped]" : "";
      return `${name} at (${wrapper.style.left}, ${wrapper.style.top})${flipped}`;
    }).join("; ");

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
      body: formData,
    });

    clearDataAndReload();
    window.location.href = "index.html";
  });
});

  // Drag & Drop with Mouse + Touch
  function startDrag(e, isTouch = false) {
    const target = isTouch ? e.targetTouches[0].target : e.target;
    if (!target.classList.contains("draggable") || target.parentElement !== palette) return;
    if (document.querySelectorAll(".draggable-wrapper").length >= MAX_VEHICLES) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("draggable-wrapper");
    wrapper.style.position = "absolute";
    wrapper.style.zIndex = 1000;

    const clone = target.cloneNode(true);
    clone.classList.add("dropped-vehicle");
    clone.style.pointerEvents = "none";
    wrapper.appendChild(clone);

    const flipBtn = document.createElement("button");
    flipBtn.className = "flip-btn";
    flipBtn.innerHTML = "↔";
    flipBtn.style.display = "none";
    flipBtn.onclick = ev => {
      ev.stopPropagation();
      clone.classList.toggle("flipped-horizontal");
      saveVehiclesToStorage();
    };
    wrapper.appendChild(flipBtn);

    wrapper.addEventListener("mouseenter", () => (flipBtn.style.display = "block"));
    wrapper.addEventListener("mouseleave", () => (flipBtn.style.display = "none"));
    wrapper.ondblclick = () => {
      wrapper.remove();
      saveVehiclesToStorage();
    };

    document.body.appendChild(wrapper);
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
    if (dragged) dragged.style.zIndex = "";
    dragged = null;
    saveVehiclesToStorage();
  }

  document.body.addEventListener("mousedown", (e) => startDrag(e, false));
  document.body.addEventListener("mousemove", (e) => moveDrag(e, false));
  document.body.addEventListener("mouseup", endDrag);
  document.body.addEventListener("touchstart", (e) => startDrag(e, true), { passive: false });
  document.body.addEventListener("touchmove", (e) => moveDrag(e, true), { passive: false });
  document.body.addEventListener("touchend", endDrag);
});
