const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let players = [];
const maxPlayers = 4;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const playerConfigs = [
  { color: 'lime', keys: { left: 'a', right: 'd' }, startX: 5, startY: 5, dir: 'right' },
  { color: 'red', keys: { left: 'j', right: 'l' }, startX: 25, startY: 25, dir: 'left' },
  { color: 'blue', keys: { left: 'f', right: 'h' }, startX: 5, startY: 25, dir: 'right' },
  { color: 'yellow', keys: { left: 'left', right: 'right' }, startX: 25, startY: 5, dir: 'left' }
];

// プレイヤー作成
function createPlayer(config) {
  return {
    color: config.color,
    body: [{ x: config.startX, y: config.startY }],
    dir: config.dir,
    keys: config.keys,
    alive: true,
    growCounter: 0
  };
}

// 初期化
for (let i = 0; i < maxPlayers; i++) {
  players.push(createPlayer(playerConfigs[i]));
}

document.addEventListener('keydown', handleKey);

function handleKey(e) {
  players.forEach(p => {
    if (!p.alive) return;
    const leftKey = p.keys.left;
    const rightKey = p.keys.right;

    if (e.key === leftKey) {
      turn(p, -1);
    } else if (e.key === rightKey) {
      turn(p, 1);
    }
  });
}

function turn(player, dirChange) {
  const dirs = ['up', 'right', 'down', 'left'];
  let idx = dirs.indexOf(player.dir);
  idx = (idx + dirChange + 4) % 4;
  player.dir = dirs[idx];
}

function update() {
  players.forEach(player => {
    if (!player.alive) return;

    const head = player.body[0];
    const move = directions[player.dir];
    const newHead = { x: head.x + move.x, y: head.y + move.y };

    // 壁衝突
    if (
      newHead.x < 0 || newHead.x >= tileCount ||
      newHead.y < 0 || newHead.y >= tileCount
    ) {
      player.alive = false;
      return;
    }

    // 自分 or 他人の体に衝突
    for (let p of players) {
      for (let i = 0; i < p.body.length; i++) {
        const b = p.body[i];
        if (b.x === newHead.x && b.y === newHead.y) {
          player.alive = false;
          return;
        }
      }
    }

    // 成長処理
    player.body.unshift(newHead);
    player.growCounter++;
    if (player.growCounter % 10 !== 0) {
      player.body.pop();
    }
  });

  // 勝者チェック
  const alivePlayers = players.filter(p => p.alive);
  if (alivePlayers.length <= 1) {
    clearInterval(gameLoop);
    draw();
    if (alivePlayers.length === 1) {
      setTimeout(() => alert(`${alivePlayers[0].color}の勝ち！`), 100);
    } else {
      setTimeout(() => alert('引き分け！'), 100);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  players.forEach(player => {
    if (!player.alive) return;
    ctx.fillStyle = player.color;
    for (let segment of player.body) {
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    }
  });
}

const gameLoop = setInterval(() => {
  update();
  draw();
}, 150);
