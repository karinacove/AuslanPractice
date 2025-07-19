// Global Variables
let placedCount = 0;
let studentName = localStorage.getItem("studentName") || "";
let studentClass = localStorage.getItem("studentClass") || "";

// DOM Elements
const finishButton = document.getElementById("finish-button");
const modal = document.getElementById("modal");
const againBtn = document.getElementById("again-btn");
const menuBtn = document.getElementById("menu-btn");
const downloadBtn = document.getElementById("download-btn");
const previewImg = document.getElementById("preview-img");
const gameUI = document.getElementById("game-ui");
const vehiclePalette = document.getElementById("vehicle-palette");

// Ensure student is signed in
if (!studentName || !studentClass) {
  alert("Please return to the sign-in page.");
  window.location.href = "index.html";
}

// Finish Button Clicked
finishButton.addEventListener("click", () => {
  captureScreenshot();
});

// Screenshot capture + upload function
function captureScreenshot() {
  html2canvas(document.body).then(canvas => {
    const imageBase64 = canvas.toDataURL("image/png").split(",")[1]; // Remove data:image prefix
    const previewURL = canvas.toDataURL("image/png");
    previewImg.src = previewURL;
    modal.classList.remove("hidden");

    // Rename file: YYYYMMDD-Class-Name-instructions-partner.png
    const now = new Date();
    const dateString = now.toISOString().slice(0,10).replace(/-/g, "");
    const fileName = `${dateString}-${studentClass}-${studentName}-instructions-partner.png`;

    // Setup download button (optional backup)
    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.download = fileName;
      link.href = previewURL;
      link.click();
    };

    // Auto-upload to Google Drive
    fetch("https://script.google.com/macros/s/AKfycbyIpF3yI4PHakjaAkuyjLCwEGxmzMQa6ePgb0crTclxDBstCIuzzf1OMm7wNk3TP_wObQ/exec", {
      method: "POST",
      body: JSON.stringify({
        imageBase64: imageBase64,
        filename: fileName
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => response.text())
      .then(result => console.log("Upload result:", result))
      .catch(error => console.error("Upload error:", error));
  });
}

// Modal buttons
againBtn.addEventListener("click", () => {
  window.location.reload();
});

menuBtn.addEventListener("click", () => {
  window.location.href = "hub.html";
});
