<script>
  // Retrieve login info
  let studentName = localStorage.getItem("studentName") || "";
  let studentClass = localStorage.getItem("studentClass") || "";

  // Redirect if not signed in
  if (!studentName || !studentClass) {
    alert("Please log in first.");
    window.location.href = "../index.html"; // Adjust path as needed
  }

  // DOM elements
  const logoutBtn = document.getElementById("logoutBtn");
  const form = document.getElementById("student-form");
  const palette = document.getElementById("vehicle-palette");
  const submitButton = document.getElementById("submit-button");
  const studentInfo = document.getElementById("student-info");

  // Logout clears localStorage and redirects
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentClass");
      window.location.href = "../index.html";
    });
  }

  // State variables
  let jobDescription = '';
  let partnerName = '';
  let dragged;
  const MAX_VEHICLES = 10;

  // Form submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    jobDescription = form.elements['jobDescription'].value;
    partnerName = form.elements['partnerName'].value;

    form.style.display = 'none';
    palette.style.display = 'grid';
    submitButton.style.display = 'inline-block';
    studentInfo.style.display = 'block';
    studentInfo.innerText = `${studentName} (${studentClass})\n${jobDescription} with ${partnerName}`;
  });

  // Vehicle dragging
  document.body.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('draggable') || e.target.parentElement !== palette) return;
    const existingCount = document.querySelectorAll('body > .draggable').length;
    if (existingCount >= MAX_VEHICLES) return;

    dragged = e.target.cloneNode(true);
    dragged.style.position = 'absolute';
    dragged.style.left = e.pageX - 40 + 'px';
    dragged.style.top = e.pageY - 40 + 'px';
    dragged.style.zIndex = 1000;
    document.body.appendChild(dragged);

    dragged.offsetX = e.offsetX;
    dragged.offsetY = e.offsetY;
  });

 document.body.addEventListener('mousedown', (e) => {
  if (!e.target.classList.contains('draggable') || e.target.parentElement !== palette) return;
  const existingCount = document.querySelectorAll('body > .draggable-wrapper').length;
  if (existingCount >= MAX_VEHICLES) return;

  // Create a wrapper div for dragging
  const wrapper = document.createElement('div');
  wrapper.classList.add('draggable-wrapper');
  wrapper.style.position = 'absolute';
  wrapper.style.left = (e.pageX - 40) + 'px';
  wrapper.style.top = (e.pageY - 40) + 'px';
  wrapper.style.width = '80px';  // match your draggable width
  wrapper.style.height = 'auto';
  wrapper.style.cursor = 'grab';
  wrapper.style.zIndex = 1000;

  // Clone the image
  const dragged = e.target.cloneNode(true);
  dragged.classList.remove('draggable'); // prevent interference
  dragged.style.width = '100%';
  dragged.style.height = 'auto';
  dragged.style.userSelect = 'none';
  dragged.draggable = false;

  // Create the flip button
  const flipBtn = document.createElement('button');
  flipBtn.classList.add('flip-btn');
  flipBtn.title = 'Flip horizontally';
  flipBtn.innerText = '⇆';

  // Add flip functionality
  flipBtn.addEventListener('click', (evt) => {
    evt.stopPropagation();
    dragged.classList.toggle('flipped-horizontal');
  });

  // Add image and button to wrapper
  wrapper.appendChild(dragged);
  wrapper.appendChild(flipBtn);

  // Add the wrapper to body
  document.body.appendChild(wrapper);

  // Start dragging
  let offsetX = e.offsetX;
  let offsetY = e.offsetY;

  function onMouseMove(moveEvent) {
    wrapper.style.left = (moveEvent.pageX - offsetX) + 'px';
    wrapper.style.top = (moveEvent.pageY - offsetY) + 'px';
  }

  function onMouseUp() {
    wrapper.style.zIndex = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});

  // Double-click to remove vehicle
  document.body.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('draggable') && e.target.parentElement === document.body) {
      e.target.remove();
    }
  });

  // Submit button
  submitButton.addEventListener('click', () => {
    const vehicleData = [...document.querySelectorAll('body > .draggable')]
      .map(el => `${el.alt} at (${el.style.left}, ${el.style.top})`)
      .sort((a, b) => a.localeCompare(b))
      .join('; ');

    const formData = new FormData();
    formData.append('entry.1202364028', studentName);
    formData.append('entry.1957249768', studentClass);
    formData.append('entry.436910009', jobDescription);
    formData.append('entry.169376211', partnerName);
    formData.append('entry.1017965571', '1'); // Question number
    formData.append('entry.1568301781', vehicleData); // Answer data

    fetch('https://docs.google.com/forms/d/e/1FAIpQLSdGYfUokvgotPUu7vzNVEOiEny2Qd52Xlj_dD-_v_ZCI2YGNw/formResponse', {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    });

    alert("How many vehicles did you get right?");
    submitButton.disabled = true;
    submitButton.innerText = 'Submitted';
    setTimeout(() => {
      showPlayAgainButton();
    }, 3000);
  });

  // Show play again button
  function showPlayAgainButton() {
    let button = document.getElementById("playAgain");
    if (!button) {
      button = document.createElement("img");
      button.id = "playAgain";
      button.src = "assets/Again.png";
      button.alt = "Play Again";
      button.style.position = "fixed";
      button.style.bottom = "5vh";
      button.style.left = "50%";
      button.style.transform = "translateX(-50%)";
      button.style.cursor = "pointer";
      button.style.width = "200px";
      button.style.zIndex = "1000";
      document.body.appendChild(button);
    }
    button.style.display = "block";
    button.addEventListener("click", () => location.reload());
  }
</script>
