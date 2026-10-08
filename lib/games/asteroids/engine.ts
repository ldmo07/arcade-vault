import {
  H,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  W,
} from "./constants";
import {
  Asteroid,
  Bullet,
  dist,
  type Keys,
  Particle,
  PowerUp,
  rand,
  Ship,
} from "./entities";
import type { AsteroidsCallbacks, AsteroidsHandle } from "./types";

type State = "playing" | "dead" | "gameover";

const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);

function isTextTarget(target: EventTarget | null) {
  const tag = (target as HTMLElement | null)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function createAsteroids(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setPaused: () => {}, destroy: () => {} };

  // ── Input ───────────────────────────────────────────────────────────────────
  let keys: Keys = {};
  let justPressed: Keys = {};

  const pressed = (code: string) => {
    const val = !!justPressed[code];
    justPressed[code] = false;
    return val;
  };

  // ── Estado ──────────────────────────────────────────────────────────────────
  const ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = 3;
  let level = 1;
  let state: State = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;

  let paused = false;
  let destroyed = false;
  let rafId = 0;
  let lastTime: number | null = null;

  // Los callbacks solo se llaman cuando el valor cambia
  let emittedScore = -1;
  let emittedLives = -1;
  let emittedLevel = -1;

  const emit = () => {
    if (score !== emittedScore) {
      emittedScore = score;
      callbacks.onScore(score);
    }
    if (lives !== emittedLives) {
      emittedLives = lives;
      callbacks.onLives(lives);
    }
    if (level !== emittedLevel) {
      emittedLevel = level;
      callbacks.onLevel(level);
    }
  };

  const spawnAsteroids = (count: number) => {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  };

  const nextLevel = () => {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  };

  const explode = (x: number, y: number, count = 8) => {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  };

  const killShip = () => {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      state = "gameover";
      keys = {};
      justPressed = {};
      emit();
      callbacks.onGameOver(score);
    } else {
      state = "dead";
      deadTimer = 2;
    }
  };

  // ── Update ──────────────────────────────────────────────────────────────────
  const update = (dt: number) => {
    if (state === "gameover") {
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      return;
    }

    if (state === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        state = "playing";
        ship.reset();
      }
      return;
    }

    if (pressed("Space")) bullets.push(...ship.tryShoot());

    ship.update(dt, keys);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));

    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);

    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }

    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);

    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }

    // Nivel completado
    if (state === "playing" && asteroids.length === 0) nextLevel();

    emit();
  };

  // ── Draw ────────────────────────────────────────────────────────────────────
  const draw = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    particles.forEach((p) => p.draw(ctx));
    asteroids.forEach((a) => a.draw(ctx));
    powerUps.forEach((p) => p.draw(ctx));
    bullets.forEach((b) => b.draw(ctx));
    ship.draw(ctx);

    if (ship.tripleShot > 0) {
      ctx.font = "15px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#0ff";
      ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 26);
    }
  };

  // ── Loop ────────────────────────────────────────────────────────────────────
  const loop = (ts: number) => {
    if (destroyed) return;
    if (paused) {
      lastTime = null;
    } else {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      update(dt);
    }
    draw();
    rafId = requestAnimationFrame(loop);
  };

  // ── Listeners ───────────────────────────────────────────────────────────────
  const onKeyDown = (e: KeyboardEvent) => {
    if (paused || state === "gameover" || isTextTarget(e.target)) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!e.repeat && !keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (paused || state === "gameover" || isTextTarget(e.target)) return;
    // Espacio activa el botón enfocado al soltarlo; se cancela mientras se juega
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    keys[e.code] = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  spawnAsteroids(4);
  emit();
  rafId = requestAnimationFrame(loop);

  return {
    setPaused(value: boolean) {
      if (destroyed || value === paused) return;
      paused = value;
      lastTime = null;
      if (paused) {
        keys = {};
        justPressed = {};
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
