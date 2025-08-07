const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.05; // 強くして重量感

class Tank {
  constructor(x, color, keys, initialAngle, angleDir) {
    this.x = x;
    this.y = canvas.height - 40;
    this.width = 40;
    this.height = 20;
    this.vx = 0;
    this.angle = initialAngle;
    this.angleDir = angleDir; // +1 or -1
    this.hp = 3;
    this.color = color;
    this.keys = keys;
    this.moving = { forward: false, backward: false };
    this.aiming = false;
    this.bullets = [];
    this.canShoot = true;
    this.shootCooldown = 500; // ms（調整可能）
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    const rad = this.angle * Math.PI / 180;
    const gunLength = 30;
    const cx = this.x + this.width / 2;
    const cy = this.y;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * gunLength, cy - Math.sin(rad) * gunLength);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  update() {
    // 重量感ある移動
    const acceleration = 0.05;
    const maxSpeed = 0.5;
    const friction = 0.05;

    if (this.moving.forward) this.vx += acceleration;
    if (this.moving.backward) this.vx -= acceleration;

    // 摩擦
    if (!this.moving.forward && !this.moving.backward) {
      if (this.vx > 0) this.vx = Math.max(0, this.vx - friction);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + friction);
    }

    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
    this.x += this.vx;

    // 砲台の角度往復（0〜180度を行ったり来たり）
    if (this.aiming) {
      this.angle += 0.5 * this.angleDir;
      if (this.angle >= 180) {
        this.angle = 180;
        this.angleDir = -1;
      } else if (this.angle <= 0) {
        this.angle = 0;
        this.angleDir = 1;
      }
    }

    this.bullets.forEach(b => b.update());
    this.bullets = this.bullets.filter(b => !b.outOfBounds());
  }
  shoot() {
    if (!this.canShoot) return;

    const rad = this.angle * Math.PI / 180;
    const vx = Math.cos(rad) * 3;
    const vy = -Math.sin(rad) * 3;
    const cx = this.x + this.width / 2 + Math.cos(rad) * 30;
    const cy = this.y - Math.sin(rad) * 30;
    this.bullets.push(new Bullet(cx, cy, vx, vy, this.color));

    this.canShoot = false;
    setTimeout(() => {
      this.canShoot = true;
    }, this.shootCooldown);
  }
}

class Bullet {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.color = color;
  }

  update() {
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.draw();
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  outOfBounds() {
    return this.x < 0 || this.x > canvas.width || this.y > canvas.height;
  }

  hits(tank) {
    return (
      this.x > tank.x &&
      this.x < tank.x + tank.width &&
      this.y > tank.y &&
      this.y < tank.y + tank.height
    );
  }
}

// 左は180度開始（逆回転）、右は0度開始（順回転）
const tank1 = new Tank(100, 'blue', {
  back: 'q',
  forward: 'e',
  aim: 'w',
  fire: 'a'
}, 0, -1);

const tank2 = new Tank(800, 'red', {
  back: 'z',
  forward: 'c',
  aim: 'x',
  fire: 'd'
}, 180, 1);

const tanks = [tank1, tank2];

function drawHP(tank, x, y) {
  ctx.fillStyle = tank.color;
  ctx.fillText(`HP: ${tank.hp}`, x, y);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const tank of tanks) {
    tank.update();
    tank.draw();
  }

  tank1.bullets.forEach(bullet => {
    if (bullet.hits(tank2)) {
      tank2.hp -= 1;
      bullet.y = canvas.height + 1;
    }
  });

  tank2.bullets.forEach(bullet => {
    if (bullet.hits(tank1)) {
      tank1.hp -= 1;
      bullet.y = canvas.height + 1;
    }
  });

  drawHP(tank1, 20, 20);
  drawHP(tank2, canvas.width - 80, 20);

  if (tank1.hp <= 0 || tank2.hp <= 0) {
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    const winner = tank1.hp <= 0 ? '赤の勝ち！' : '青の勝ち！';
    ctx.fillText(winner, canvas.width / 2 - 80, canvas.height / 2);
    return;
  }

  requestAnimationFrame(update);
}

document.addEventListener('keydown', e => {
  for (const tank of tanks) {
    if (e.key === tank.keys.forward) tank.moving.forward = true;
    if (e.key === tank.keys.back) tank.moving.backward = true;
    if (e.key === tank.keys.aim) tank.aiming = true;
    if (e.key === tank.keys.fire) tank.shoot();
  }
});

document.addEventListener('keyup', e => {
  for (const tank of tanks) {
    if (e.key === tank.keys.forward) tank.moving.forward = false;
    if (e.key === tank.keys.back) tank.moving.backward = false;
    if (e.key === tank.keys.aim) tank.aiming = false;
  }
});

update();
