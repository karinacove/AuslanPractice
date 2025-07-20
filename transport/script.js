document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // Initial Setup
  // -------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  const partnerName = localStorage.getItem("partnerName") || "";
  const partnerClass = localStorage.getItem("partnerClass") || "";
  const savedVehicles = JSON.parse(localStorage.getItem("placedVehicles") || "[]");

  const nameDisplay = document.getElementById("student-name");
  const classDisplay = document.getElementById("student-class");

  if (nameDisplay && studentName) nameDisplay.textContent = studentName;
  if (classDisplay && studentClass) classDisplay.textContent = studentClass;

  const palette = document.getElementById("palette");
  const finishBtn = document.getElementById("finish-btn");
  const screenshotBtn = document.getElementById("screenshot-btn");

  const startOverlay = document.getElementById("start-overlay");
  const startForm = document.getElementById("partner-form");
  const startContinue = document.getElementById("continue-btn");

  const MAX_VEHICLES = 12;
  let dragged = null;

  // -------------------------
  // Modal Logic & Resume
  // -------------------------
  if (!partnerName || !partnerClass || savedVehicles.length === 0) {
    startOverlay.style.display = "flex";
    startContinue.style.display = "none";
  } else {
    startOverlay.style.display = "none";
    restoreVehiclesFromStorage();
  }

  startForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const pName = document.getElementById("partner-name").value;
    const pClass = document.getElementById("partner-class").value;

    if (!pName || !pClass) {
      alert("Please enter your partner's details.");
      return;
    }

    localStorage.setItem("partnerName", pName);
    localStorage.setItem("partnerClass", pClass);
    startOverlay.style.display = "none";
  });

  startContinue.addEventListener("click", () => {
    startOverlay.style.display = "none";
    restoreVehiclesFromStorage();
  });

  // -------------------------
  // Drag & Drop with Touch
  // -------------------------
  function startDrag(e, isTouch = false) {
    const target = isTouch ? e.targetTouches[0].target : e.target;
    if (!target.classList.contains("draggable") || target.parentElement !== palette) return;

    if (document.querySelectorAll("body > .draggable-wrapper").length >= MAX_VEHICLES) return;

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
    flipBtn.onclick = (ev) => {
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

  // -------------------------
  // Save/Restore Vehicle Placement
  // -------------------------
  function saveVehiclesToStorage() {
    const wrappers = document.querySelectorAll(".draggable-wrapper");
    const data = [];

    wrappers.forEach(wrapper => {
      const img = wrapper.querySelector("img");
      const flipped = img.classList.contains("flipped-horizontal");
      data.push({
        src: img.src,
        left: wrapper.style.left,
        top: wrapper.style.top,
        flipped: flipped
      });
    });

    localStorage.setItem("placedVehicles", JSON.stringify(data));
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
      flipBtn.onclick = (ev) => {
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

  // -------------------------
  // Screenshot / Finish
  // -------------------------
  screenshotBtn.addEventListener("click", async () => {
    try {
      const canvas = await html2canvas(document.body);
      const link = document.createElement("a");
      link.download = `${studentName}_${studentClass}_vehicles.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      alert("Screenshot failed.");
    }
  });

  finishBtn.addEventListener("click", () => {
    const vehicleCount = document.querySelectorAll("body > .draggable-wrapper").length;

    if (!partnerName || !partnerClass || vehicleCount === 0) {
      alert("Make sure your partner’s name/class is entered and at least one vehicle is placed.");
      return;
    }

    const time = new Date().toLocaleTimeString();
    alert(`Finished! Vehicles placed: ${vehicleCount}\nTime: ${time}`);
    localStorage.removeItem("placedVehicles");
    window.location.href = "hub.html";
  });
});
