const keys = ['w', 'e', 'd', 'c', 'x', 'z', 'a', 'q'];
const grid = document.getElementById('grid');
const ROWS = 32;

let chart = [];

for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < keys.length; x++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.key = keys[x];
    cell.dataset.time = y * 500;

    cell.addEventListener('click', () => {
      cell.classList.toggle('active');
    });

    grid.appendChild(cell);
  }
}

document.getElementById('export-btn').addEventListener('click', () => {
  const notes = [];
  document.querySelectorAll('.cell.active').forEach(cell => {
    notes.push({
      key: cell.dataset.key,
      time: parseInt(cell.dataset.time)
    });
  });

  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'notes_custom.json';
  a.click();
});


