document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // Sign-in Handling
  // -------------------------
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  const currentLevel = parseInt(localStorage.getItem("currentLevel")) || 1;
  const placedVehicles = JSON.parse(localStorage.getItem("placedVehicles")) || [];

  if (!studentName || !studentClass) {
    alert("Please return to the sign-in page.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("student-name").textContent = studentName;
  document.getElementById("student-class").textContent = studentClass;

  // -------------------------
  // Drag & Drop Vehicle Logic with Touch Support
  // -------------------------
  const MAX_VEHICLES = 12;
  const palette = document.getElementById("vehicle-palette");
  let dragged = null;

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

    // Double-click to remove the vehicle
    wrapper.addEventListener("dblclick", () => {
      wrapper.remove();
      saveVehiclesToStorage();
    });

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
  // Screenshot / Finish Button Logic
  // -------------------------
  const finishBtn = document.getElementById("finish-btn");
  const modal = document.getElementById("finish-modal");
  const closeModal = document.getElementById("close-modal");
  const downloadBtn = document.getElementById("download-btn");
  const imagePreview = document.getElementById("image-preview");

  finishBtn?.addEventListener("click", async () => {
    modal?.classList.remove("hidden");

    try {
      const canvas = await html2canvas(document.body);
      const dataURL = canvas.toDataURL();
      imagePreview.src = dataURL;

      // Optional: Download logic
      downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.download = "auslan-transport.png";
        link.href = dataURL;
        link.click();
      };
    } catch (err) {
      console.error("Screenshot failed:", err);
    }
  });

  closeModal?.addEventListener("click", () => {
    modal?.classList.add("hidden");
  });

  // -------------------------
  // Vehicle Save & Restore Logic
  // -------------------------
  function saveVehiclesToStorage() {
    const vehicles = [];
    document.querySelectorAll(".draggable-wrapper").forEach((wrapper) => {
      const img = wrapper.querySelector("img");
      vehicles.push({
        src: img.getAttribute("src"),
        flipped: img.classList.contains("flipped-horizontal"),
        left: wrapper.style.left,
        top: wrapper.style.top,
      });
    });
    localStorage.setItem("placedVehicles", JSON.stringify(vehicles));
  }

  function loadVehiclesFromStorage() {
    placedVehicles.forEach((v) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("draggable-wrapper");
      wrapper.style.position = "absolute";
      wrapper.style.zIndex = 1000;
      wrapper.style.left = v.left;
      wrapper.style.top = v.top;

      const clone = document.createElement("img");
      clone.src = v.src;
      clone.classList.add("dropped-vehicle");
      if (v.flipped) clone.classList.add("flipped-horizontal");
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

      // Double-click to remove
      wrapper.addEventListener("dblclick", () => {
        wrapper.remove();
        saveVehiclesToStorage();
      });

      document.body.appendChild(wrapper);
    });
  }

  // Auto-resume
  if (placedVehicles.length > 0) {
    loadVehiclesFromStorage();
  }
});
