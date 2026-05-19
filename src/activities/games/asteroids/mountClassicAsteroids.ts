import { createAsteroidsMusic } from "@/lib/acelyaAsteroidsMusic";
import { acelyaSounds } from "@/lib/acelyaSounds";

const FPS = 30;
const FRICTION = 0.7;
const GAME_LIVES = 3;
const LASER_DIST = 0.6;
const LASER_EXPLODE_DUR = 0.1;
const LASER_MAX = 10;
const LASER_SPD = 500;
const ROID_JAG = 0.4;
const ROID_PTS_LGE = 20;
const ROID_PTS_MED = 50;
const ROID_PTS_SML = 100;
const ROID_NUM = 3;
const ROID_SIZE = 100;
const ROID_SPD = 50;
const ROID_VERT = 10;
const SHIP_BLINK_DUR = 0.1;
const SHIP_EXPLODE_DUR = 0.3;
const SHIP_INV_DUR = 3;
const SHIP_SIZE = 30;
const SHIP_THRUST = 5;
const SHIP_TURN_SPD = 360;
const TEXT_FADE_TIME = 2.5;
const TEXT_SIZE = 40;

export type AsteroidsHooks = {
  onScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onNewGame?: () => void;
  getHighScore: () => number;
  setHighScore: (n: number) => void;
};

type Laser = { x: number; y: number; xv: number; yv: number; dist: number; explodeTime: number };
type Roid = {
  x: number;
  y: number;
  xv: number;
  yv: number;
  a: number;
  r: number;
  offs: number[];
  vert: number;
};
type Ship = {
  x: number;
  y: number;
  a: number;
  r: number;
  blinkNum: number;
  blinkTime: number;
  canShoot: boolean;
  dead: boolean;
  explodeTime: number;
  lasers: Laser[];
  rot: number;
  thrusting: boolean;
  thrust: { x: number; y: number };
};

/** Açelya asteroids.html motoru — bire bir */
export function mountClassicAsteroids(
  canvas: HTMLCanvasElement,
  hooks: AsteroidsHooks,
  isActive: () => boolean,
): () => void {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;

  let level = 0;
  let lives = GAME_LIVES;
  let roids: Roid[] = [];
  let score = 0;
  let scoreHigh = hooks.getHighScore();
  let ship: Ship;
  let text = "";
  let textAlpha = 0;
  let gameOverReported = false;
  let roidsLeft = 0;
  let roidsTotal = 0;

  const music = createAsteroidsMusic(FPS);

  const distBetweenPoints = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const newShip = (): Ship => ({
    x: W / 2,
    y: H / 2,
    a: (90 / 180) * Math.PI,
    r: SHIP_SIZE / 2,
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    canShoot: true,
    dead: false,
    explodeTime: 0,
    lasers: [],
    rot: 0,
    thrusting: false,
    thrust: { x: 0, y: 0 },
  });

  const newAsteroid = (x: number, y: number, r: number): Roid => {
    const lvlMult = 1 + 0.1 * level;
    const roid: Roid = {
      x,
      y,
      xv: ((Math.random() * ROID_SPD * lvlMult) / FPS) * (Math.random() < 0.5 ? 1 : -1),
      yv: ((Math.random() * ROID_SPD * lvlMult) / FPS) * (Math.random() < 0.5 ? 1 : -1),
      a: Math.random() * Math.PI * 2,
      r,
      offs: [],
      vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2),
    };
    for (let i = 0; i < roid.vert; i++) {
      roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
    }
    return roid;
  };

  const createAsteroidBelt = () => {
    roids = [];
    roidsTotal = (ROID_NUM + level) * 7;
    roidsLeft = roidsTotal;
    for (let i = 0; i < ROID_NUM + level; i++) {
      let x: number;
      let y: number;
      do {
        x = Math.floor(Math.random() * W);
        y = Math.floor(Math.random() * H);
      } while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r);
      roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 2)));
    }
  };

  const drawShipShape = (x: number, y: number, a: number, colour = "white") => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo(x + ((4 / 3) * ship.r * Math.cos(a)), y - ((4 / 3) * ship.r * Math.sin(a)));
    ctx.lineTo(
      x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
      y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a)),
    );
    ctx.lineTo(
      x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
      y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a)),
    );
    ctx.closePath();
    ctx.stroke();
  };

  const syncScore = () => {
    hooks.onScore(score);
    if (score > scoreHigh) {
      scoreHigh = score;
      hooks.setHighScore(score);
    }
  };

  const destroyAsteroid = (index: number) => {
    const { x, y, r } = roids[index];
    if (r === Math.ceil(ROID_SIZE / 2)) {
      roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
      roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
      score += ROID_PTS_LGE;
    } else if (r === Math.ceil(ROID_SIZE / 4)) {
      roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
      roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
      score += ROID_PTS_MED;
    } else {
      score += ROID_PTS_SML;
    }
    syncScore();
    roids.splice(index, 1);
    acelyaSounds.hit();
    roidsLeft--;
    music.setAsteroidRatio(roidsLeft / roidsTotal);
    if (roids.length === 0) {
      level++;
      newLevel();
    }
  };

  const shootLaser = () => {
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
      ship.lasers.push({
        x: ship.x + ((4 / 3) * ship.r * Math.cos(ship.a)),
        y: ship.y - ((4 / 3) * ship.r * Math.sin(ship.a)),
        xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
        yv: (-LASER_SPD * Math.sin(ship.a)) / FPS,
        dist: 0,
        explodeTime: 0,
      });
      acelyaSounds.laser();
    }
    ship.canShoot = false;
  };

  const newLevel = () => {
    music.setAsteroidRatio(1);
    text = `Level ${level + 1}`;
    textAlpha = 1.0;
    createAsteroidBelt();
  };

  const newGame = () => {
    level = 0;
    lives = GAME_LIVES;
    score = 0;
    ship = newShip();
    scoreHigh = hooks.getHighScore();
    gameOverReported = false;
    syncScore();
    newLevel();
    hooks.onNewGame?.();
  };

  const gameOver = () => {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
    if (!gameOverReported) {
      gameOverReported = true;
      hooks.onGameOver(score);
    }
  };

  const explodeShip = () => {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
    acelyaSounds.explode();
  };

  const keyDown = (ev: KeyboardEvent) => {
    if (!isActive() || ship.dead) return;
    switch (ev.keyCode) {
      case 32:
        shootLaser();
        break;
      case 37:
        ship.rot = (SHIP_TURN_SPD / 180) * (Math.PI / FPS);
        break;
      case 38:
        ship.thrusting = true;
        break;
      case 39:
        ship.rot = (-SHIP_TURN_SPD / 180) * (Math.PI / FPS);
        break;
    }
  };

  const keyUp = (ev: KeyboardEvent) => {
    if (ship.dead) return;
    switch (ev.keyCode) {
      case 32:
        ship.canShoot = true;
        break;
      case 37:
      case 39:
        ship.rot = 0;
        break;
      case 38:
        ship.thrusting = false;
        break;
    }
  };

  const update = () => {
    const active = isActive();
    music.tick();

    const blinkOn = ship.blinkNum % 2 === 0;
    const exploding = ship.explodeTime > 0;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, W, H);

    for (const roid of roids) {
      ctx.strokeStyle = "slategrey";
      ctx.lineWidth = SHIP_SIZE / 20;
      ctx.beginPath();
      ctx.moveTo(
        roid.x + roid.r * roid.offs[0] * Math.cos(roid.a),
        roid.y + roid.r * roid.offs[0] * Math.sin(roid.a),
      );
      for (let j = 1; j < roid.vert; j++) {
        ctx.lineTo(
          roid.x + roid.r * roid.offs[j] * Math.cos(roid.a + (j * Math.PI * 2) / roid.vert),
          roid.y + roid.r * roid.offs[j] * Math.sin(roid.a + (j * Math.PI * 2) / roid.vert),
        );
      }
      ctx.closePath();
      ctx.stroke();
    }

    if (ship.thrusting && !ship.dead && active) {
      ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
      ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;
      acelyaSounds.thrustStart();

      if (!exploding && blinkOn) {
        ctx.fillStyle = "red";
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = SHIP_SIZE / 10;
        ctx.beginPath();
        ctx.moveTo(
          ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
          ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a)),
        );
        ctx.lineTo(
          ship.x - ship.r * (5 / 3) * Math.cos(ship.a),
          ship.y + ship.r * (5 / 3) * Math.sin(ship.a),
        );
        ctx.lineTo(
          ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
          ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a)),
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
      ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
      acelyaSounds.thrustStop();
    }

    if (!exploding) {
      if (blinkOn && !ship.dead) drawShipShape(ship.x, ship.y, ship.a);
      if (ship.blinkNum > 0) {
        ship.blinkTime--;
        if (ship.blinkTime === 0) {
          ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
          ship.blinkNum--;
        }
      }
    } else {
      ctx.fillStyle = "darkred";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
      ctx.fill();
    }

    for (const laser of ship.lasers) {
      if (laser.explodeTime === 0) {
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
        ctx.fill();
      } else {
        ctx.fillStyle = "orangered";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, ship.r * 0.75, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "pink";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, ship.r * 0.25, 0, Math.PI * 2, false);
        ctx.fill();
      }
    }

    if (textAlpha >= 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
      ctx.font = `small-caps ${TEXT_SIZE}px dejavu sans mono, var(--font-nunito), sans-serif`;
      ctx.fillText(text, W / 2, H * 0.75);
      textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
    } else if (ship.dead) {
      newGame();
    }

    for (let i = 0; i < lives; i++) {
      const lifeColour = exploding && i === lives - 1 ? "red" : "white";
      drawShipShape(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = `${TEXT_SIZE}px dejavu sans mono, var(--font-nunito), monospace`;
    ctx.fillText(String(score), W - SHIP_SIZE / 2, SHIP_SIZE);

    ctx.textAlign = "center";
    ctx.font = `${TEXT_SIZE * 0.75}px dejavu sans mono, var(--font-nunito), monospace`;
    ctx.fillText(`BEST ${scoreHigh}`, W / 2, SHIP_SIZE);

    if (!active) return;

    for (let i = roids.length - 1; i >= 0; i--) {
      const ax = roids[i].x;
      const ay = roids[i].y;
      const ar = roids[i].r;
      for (let j = ship.lasers.length - 1; j >= 0; j--) {
        const lx = ship.lasers[j].x;
        const ly = ship.lasers[j].y;
        if (ship.lasers[j].explodeTime === 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
          destroyAsteroid(i);
          ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
          break;
        }
      }
    }

    if (!exploding) {
      if (ship.blinkNum === 0 && !ship.dead) {
        for (let i = 0; i < roids.length; i++) {
          if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
            explodeShip();
            destroyAsteroid(i);
            break;
          }
        }
      }
      ship.a += ship.rot;
      ship.x += ship.thrust.x;
      ship.y += ship.thrust.y;
    } else {
      ship.explodeTime--;
      if (ship.explodeTime === 0) {
        lives--;
        if (lives === 0) gameOver();
        else ship = newShip();
      }
    }

    if (ship.x < 0 - ship.r) ship.x = W + ship.r;
    else if (ship.x > W + ship.r) ship.x = 0 - ship.r;
    if (ship.y < 0 - ship.r) ship.y = H + ship.r;
    else if (ship.y > H + ship.r) ship.y = 0 - ship.r;

    for (let i = ship.lasers.length - 1; i >= 0; i--) {
      const laser = ship.lasers[i];
      if (laser.dist > LASER_DIST * W) {
        ship.lasers.splice(i, 1);
        continue;
      }
      if (laser.explodeTime > 0) {
        laser.explodeTime--;
        if (laser.explodeTime === 0) ship.lasers.splice(i, 1);
      } else {
        laser.x += laser.xv;
        laser.y += laser.yv;
        laser.dist += Math.sqrt(laser.xv ** 2 + laser.yv ** 2);
      }
      if (laser.x < 0) laser.x = W;
      else if (laser.x > W) laser.x = 0;
      if (laser.y < 0) laser.y = H;
      else if (laser.y > H) laser.y = 0;
    }

    for (const roid of roids) {
      roid.x += roid.xv;
      roid.y += roid.yv;
      if (roid.x < 0 - roid.r) roid.x = W + roid.r;
      else if (roid.x > W + roid.r) roid.x = 0 - roid.r;
      if (roid.y < 0 - roid.r) roid.y = H + roid.r;
      else if (roid.y > H + roid.r) roid.y = 0 - roid.r;
    }
  };

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  newGame();
  const id = setInterval(update, 1000 / FPS);

  return () => {
    clearInterval(id);
    document.removeEventListener("keydown", keyDown);
    document.removeEventListener("keyup", keyUp);
    acelyaSounds.thrustStop();
    music.stop();
  };
}
