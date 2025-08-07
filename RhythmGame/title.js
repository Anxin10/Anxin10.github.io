function startGame() {
  location.href = "select.html";
}

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (key === "w" || key === "s" || key === "x") {
    startGame();
  }
});
