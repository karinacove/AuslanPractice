document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("student-form");
  const palette = document.getElementById("palette");
  const dropzones = document.querySelectorAll(".dropzone");
  const partnerForm = document.getElementById("partner-form");
  const downloadBtn = document.getElementById("download-btn");
  const resumeScreen = document.getElementById("resume-screen");
  const resumeInfo = document.getElementById("resume-info");
  const resumeScreenshot = document.getElementById("resume-screenshot");
  const resumeContinue = document.getElementById("resume-continue");
  const resumeAgain = document.getElementById("resume-again");
  const resumeMenu = document.getElementById("resume-menu");

  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  if (!studentName || !studentClass) {
    alert("Please return to the sign-in page.");
    return;
  }

  let partnerName = "";
  let jobDescription = "";
  let startTime = null;
  let placedVehicles = [];
  let screenshotDataUrl = "";

  const savedData = JSON.parse(localStorage.getItem("transportGameData") || "{}");
  const today = new Date().toISOString().split("T")[0];

  // ----------- Resume Screen Logic -----------
  if (savedData.date === today && (savedData.partnerName || (savedData.vehicles && savedData.vehicles.length))) {
    resumeScreen.style.display = "block";
    resumeInfo.textContent = `Partner: ${savedData.partnerName || "?"}, Job: ${savedData.jobDescription || "?"}, Vehicles: ${savedData.vehicles?.length || 0}`;

    if (savedData.screenshot) {
      resumeScreenshot.src = savedData.screenshot;
      resumeScreenshot.style.display = "block";
    }

    resumeContinue.onclick = () => {
      partnerName = savedData.partnerName || "";
      jobDescription = savedData.jobDescription || "";
      screenshotDataUrl = savedData.screenshot || "";
      placedVehicles = savedData.vehicles || [];
      startTime = new Date();

      document.getElementById("partner-inputs").style.display = "none";
      palette.style.display = "flex";
      placeSavedVehicles();
      resumeScreen.style.display = "none";
    };

    resumeAgain.onclick = () => {
      localStorage.removeItem("transportGameData");
      location.reload();
    };

    resumeMenu.onclick = () => {
      window.location.href = "../hub.html";
    };

    return; // Stop DOMContentLoaded here until resume choice is made
  }

  // ----------- Start Game Normally -----------
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    partnerName = document.getElementById("partner-name").value.trim();
    jobDescription = document.getElementById("job-description").value.trim();
    if (!partnerName || !jobDescription) {
      alert("Please fill in both fields.");
      return;
    }

    startTime = new Date();
    partnerForm.style.display = "none";
    palette.style.display = "flex";
  });

  // ----------- Vehicle Drag-and-Drop -----------
  document.querySelectorAll(".vehicle").forEach(vehicle => {
    vehicle.setAttribute("draggable", true);
    vehicle.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", vehicle.id);
    });
  });

  dropzones.forEach(zone => {
    zone.addEventListener("dragover", e => e.preventDefault());

    zone.addEventListener("drop", e => {
      e.preventDefault();
      const vehicleId = e.dataTransfer.getData("text/plain");
      const vehicle = document.getElementById(vehicleId);
      if (vehicle && !zone.querySelector("img")) {
        const clone = vehicle.cloneNode(true);
        clone.removeAttribute("id");
        zone.innerHTML = "";
        zone.appendChild(clone);
        placedVehicles.push({ vehicleId, zoneId: zone.id });
        saveProgress();
      }
    });
  });

  // ----------- Save to LocalStorage -----------
  function saveProgress() {
    const gameData = {
      studentName,
      studentClass,
      partnerName,
      jobDescription,
      date: today,
      vehicles: placedVehicles,
      screenshot: screenshotDataUrl
    };
    localStorage.setItem("transportGameData", JSON.stringify(gameData));
  }

  function placeSavedVehicles() {
    placedVehicles.forEach(({ vehicleId, zoneId }) => {
      const zone = document.getElementById(zoneId);
      const vehicle = document.getElementById(vehicleId);
      if (zone && vehicle) {
        const clone = vehicle.cloneNode(true);
        clone.removeAttribute("id");
        zone.innerHTML = "";
        zone.appendChild(clone);
      }
    });
  }

  // ----------- Screenshot and Submit Logic -----------
  downloadBtn.addEventListener("click", async () => {
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    const vehicleCount = placedVehicles.length;

    if (vehicleCount === 0 || !partnerName) {
      alert("Please make sure you’ve filled in partner details and placed at least one vehicle.");
      return;
    }

    try {
      const canvas = await html2canvas(document.getElementById("dropzone-container"));
      screenshotDataUrl = canvas.toDataURL("image/png");

      // Submit to Google Forms
      const formData = new FormData();
      formData.append("entry.1387461004", studentName);
      formData.append("entry.1309291707", studentClass);
      formData.append("entry.477642881", "Transport");
      formData.append("entry.1633664084", partnerName);
      formData.append("entry.1185507483", jobDescription);
      formData.append("entry.118216325", `${vehicleCount} vehicles`);
      formData.append("entry.349263448", `${timeTaken} seconds`);
      formData.append("entry.893212440", "Image uploaded separately");

      await fetch("https://docs.google.com/forms/d/e/1FAIpQLSelMV1jAUSR2aiKKvbOHj6st2_JWMH-6LA9D9FWiAdNVQd1wQ/formResponse", {
        method: "POST",
        mode: "no-cors",
        body: formData
      });

      // Save screenshot in localStorage and prompt for download
      saveProgress();

      const link = document.createElement("a");
      link.href = screenshotDataUrl;
      link.download = `${studentName}-${studentClass}-Transport.png`;
      link.click();

      setTimeout(() => {
        alert("Screenshot captured and data submitted. Well done!");
        window.location.href = "../hub.html";
      }, 1000);

    } catch (error) {
      alert("There was an error capturing or submitting. Please try again.");
      console.error(error);
    }
  });
});
