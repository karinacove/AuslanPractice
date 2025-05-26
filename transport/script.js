let selectedVehicle = null;
let studentData = null;

// Store coordinates
const answerData = {
  studentName: '',
  className: '',
  question: '1', // You can adjust for each question if needed
  vehicleType: '',
  x: null,
  y: null
};

document.querySelectorAll('.draggable').forEach(vehicle => {
  vehicle.addEventListener('dragstart', (e) => {
    selectedVehicle = e.target.dataset.vehicle;
  });
});

const dropZone = document.getElementById('map-container');
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
});

dropZone.addEventListener('drop',
