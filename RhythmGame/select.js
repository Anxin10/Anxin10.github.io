const songs = [
  { title: "Test1", chart: "charts/song1.json", audio: "audio/song1.mp3" },
  { title: "Test2", chart: "charts/song2.json", audio: "audio/song2.mp3" },
  { title: "Test3", chart: "charts/song3.json", audio: "audio/song3.mp3" },
  { title: "Another Song", chart: "charts/song1.json", audio: "audio/song1.mp3" },
];

let selectedIndex = 0;

function updateCarousel() {
  const carousel = document.getElementById("song-carousel");
  carousel.innerHTML = "";

  for (let i = -1; i <= 1; i++) {
    const idx = (selectedIndex + i + songs.length) % songs.length;
    const song = songs[idx];
    const div = document.createElement("div");
    div.className = "song " + (i === 0 ? "center" : "side");
    div.textContent = song.title;
    carousel.appendChild(div);
  }
}

function handleInput(e) {
  const key = e.key.toLowerCase();
  if (key === "a") {
    selectedIndex = (selectedIndex - 1 + songs.length) % songs.length;
    updateCarousel();
  } else if (key === "d") {
    selectedIndex = (selectedIndex + 1) % songs.length;
    updateCarousel();
  } else if (key === "w") {
    const selectedSong = songs[selectedIndex];
    sessionStorage.setItem("selectedChart", selectedSong.chart);
    sessionStorage.setItem("selectedAudio", selectedSong.audio);
    location.href = "play.html";
  } else if (key === "x") {
    location.href = "title.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCarousel();
  document.addEventListener("keydown", handleInput);
});
