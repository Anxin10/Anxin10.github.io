const keyMap = {
  q: 0, w: 1, e: 2,
  a: 3, s: 4, d: 5,
  z: 6, x: 7, c: 8
};

let noteChart = [];
let currentNotes = [];
let noteIndex = 0;
let startTime = 0;
let score = 100;

const HIT_WINDOW = 800;
const NOTE_GROW_DURATION = 600;
const NOTE_HOLD_DURATION = 200;
const NOTE_FADE_DURATION = 200;

// AudioContextのウォームアップ（Chromeなどで初回遅延を防ぐ）
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function warmUpAudioContext() {
  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

function playGame(chartPath, audioPath) {
  const container = document.getElementById("game-container");
  const music = document.getElementById("music");

  const cells = [];
  container.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    const key = Object.keys(keyMap).find(k => keyMap[k] === i);
    cell.dataset.key = key;
    container.appendChild(cell);
    cells.push(cell);
  }

  const scoreDisplay = document.getElementById("score-display");
  
  function updateScore(amount) {
    score = Math.max(0, score + amount);
    scoreDisplay.textContent = `Score: ${score}`;

    // socket が存在し、接続済みのときだけ送信
    if (typeof socket !== "undefined" && socket && socket.readyState === WebSocket.OPEN) {
      socket.send("SCORE:" + score);
    }
  }

  function spawnNote(note) {
    const key = note.key;
    const index = keyMap[key];
    if (index === undefined) return;
    const cell = cells[index];

    const square = document.createElement("div");
    square.className = "note-square";
    square.style.transform = "translate(-50%, -50%) scale(0.1)";
    square.style.opacity = "1";
    cell.appendChild(square);

    const noteObj = {
      el: square,
      key: key,
      cell: cell,
      time: note.time,
      hit: false,
      state: "growing",
      stateStart: performance.now(),
      scale: 0.1
    };
    currentNotes.push(noteObj);
  }

  function updateNotes(currentTime) {
    for (let i = currentNotes.length - 1; i >= 0; i--) {
      const note = currentNotes[i];
      const elapsed = currentTime - note.stateStart;

      if (note.state === "growing") {
        const progress = Math.min(elapsed / NOTE_GROW_DURATION, 1);
        const scale = 0.1 + 0.9 * progress;
        note.scale = scale;
        note.el.style.transform = `translate(-50%, -50%) scale(${scale})`;

        if (progress >= 1) {
          note.state = "holding";
          note.stateStart = currentTime;
          note.el.classList.add("hold-ready");
        }
      } else if (note.state === "holding") {
        note.scale = 1.0;
        note.el.style.transform = "translate(-50%, -50%) scale(1)";
        if (!note.hit && elapsed >= NOTE_HOLD_DURATION) {
          note.hit = true;
          updateScore(-50);
          note.state = "fading";
          note.stateStart = currentTime;
        }
      } else if (note.state === "fading") {
        const progress = Math.min(elapsed / NOTE_FADE_DURATION, 1);
        note.el.style.opacity = `${1 - progress}`;
        if (progress >= 1) {
          if (note.el.parentNode) note.el.parentNode.removeChild(note.el);
          currentNotes.splice(i, 1);
        }
      }
    }
  }

  function gameLoop(currentTime) {
    if (!startTime) {
      requestAnimationFrame(gameLoop);
      return;
    }

    const elapsed = currentTime - startTime;

    while (
      noteIndex < noteChart.length &&
      elapsed >= noteChart[noteIndex].time - NOTE_GROW_DURATION
    ) {
      spawnNote(noteChart[noteIndex]);
      noteIndex++;
    }

    updateNotes(currentTime);
    requestAnimationFrame(gameLoop);
  }

  let gameStarted = false;
  let audioReady = false;
  let userReady = false;

  fetch(chartPath)
    .then(res => res.json())
    .then(json => {
      noteChart = json;
      score = 100;
      updateScore(0);
      noteIndex = 0;
      startTime = 0;
      currentNotes = [];
      music.src = audioPath;

      // 読み込み完了
      music.addEventListener("canplaythrough", () => {
        audioReady = true;
        if (userReady && !gameStarted) {
          startGame();
        }
      });

      music.addEventListener("playing", () => {
        if (!startTime) {
          startTime = performance.now();
          requestAnimationFrame(gameLoop);
        }
      });

      music.addEventListener("ended", () => {
        alert("曲が終了しました。曲選択画面に戻ります。");
        location.href = "select.html";
      });

      // スタートメッセージ表示
      const info = document.createElement("div");
      info.id = "start-info";
      info.style.color = "#0ff";
      info.style.textAlign = "center";
      info.style.marginTop = "20px";
      info.textContent = "何かキーを押してゲーム開始";
      container.parentNode.insertBefore(info, container.nextSibling);

      async function startGame() {
        gameStarted = true;
        if (info.parentNode) info.parentNode.removeChild(info);

        try {
          await music.play(); // 確実に再生を始めてから gameLoop
        } catch (e) {
          console.error("音楽の再生に失敗しました:", e);
        }
        // startTime は 'playing' イベントで設定
      }

      function handleUserKeyDown(e) {
        const key = e.key.toLowerCase();
        if (!(key in keyMap)) return;

        // 最初のキー入力でAudioContextを有効にしウォームアップ
        if (!userReady) {
          userReady = true;
          if (audioCtx.state === "suspended") {
            audioCtx.resume();
          }
          warmUpAudioContext();

          if (audioReady && !gameStarted) {
            startGame();
          }
        }

        const cellIndex = keyMap[key];
        const cell = document.querySelectorAll(".grid-cell")[cellIndex];
        if (cell) cell.classList.add("active");

        if (!gameStarted) return;

        for (const note of currentNotes) {
          if (
            note.key === key &&
            !note.hit &&
            note.state === "holding"
          ) {
            let delta = 0;

            if (note.scale >= 0.98) {
              delta = 100;
            } else if (note.scale >= 0.9) {
              delta = 70;
            } else if (note.scale >= 0.8) {
              delta = 30;
            } else {
              delta = -50;
            }

            updateScore(delta);
            note.state = "fading";
            note.stateStart = performance.now();
            note.hit = true;
            break;
          }
        }
      }

      document.addEventListener("keydown", handleUserKeyDown);

      document.addEventListener("keyup", e => {
        const key = e.key.toLowerCase();
        if (!(key in keyMap)) return;
        const cellIndex = keyMap[key];
        const cell = document.querySelectorAll(".grid-cell")[cellIndex];
        if (cell) cell.classList.remove("active");
      });
    });
}

// 起動時にセッションストレージから曲情報取得しゲーム開始
document.addEventListener("DOMContentLoaded", () => {
  const chart = sessionStorage.getItem("selectedChart");
  const audio = sessionStorage.getItem("selectedAudio");
  console.log("chart:", chart); // ←これを追加
  console.log("audio:", audio); // ←これも追加
  if (chart && audio) {
    console.log("Calling playGame...");
    playGame(chart, audio);
  } else {
    alert("曲が選択されていません。曲選択画面に戻ります。");
    location.href = "select.html";
  }
});