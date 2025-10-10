import { useEffect, useRef } from 'react';
import { GameLoop } from '../game/engine/GameLoop';
import { Input } from '../game/engine/Input';
import { applyGravity, integrate } from '../game/engine/Physics';
import { resolveAABBCollision, aabb } from '../game/engine/Collision';
import { Mario } from '../game/entities/Mario';
import { createDemoLevel } from '../game/state/LevelData';
import { COLORS } from '../utils/constants';

// PUBLIC_INTERFACE
export default function GameCanvas({ width = 960, height = 540, onTick }) {
  /**
   * Canvas game surface that orchestrates game loop and entities.
   * onTick({ score, lives, paused, gameOver }) is called each update to lift state.
   */
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const inputRef = useRef(null);
  const stateRef = useRef({
    mario: null, level: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // DPR scaling
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const input = new Input();
    input.attach();
    inputRef.current = input;

    const level = createDemoLevel();
    const mario = new Mario(level.spawn.x, level.spawn.y, input);
    stateRef.current = { mario, level, input, score: 0, lives: 3, paused: false, gameOver: false };

    const loop = new GameLoop({
      onUpdate: (dt) => {
        // Toggle pause
        if (input.pressedPause()) {
          stateRef.current.paused = !stateRef.current.paused;
        }
        if (stateRef.current.paused || stateRef.current.gameOver) return;

        input.update();
        updateWorld(dt);
        if (onTick) {
          onTick({
            score: stateRef.current.score,
            lives: stateRef.current.lives,
            paused: stateRef.current.paused,
            gameOver: stateRef.current.gameOver,
          });
        }
      },
      onRender: () => {
        renderWorld(ctx, width, height);
      },
    });

    loopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      input.detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const updateWorld = (dt) => {
    const S = stateRef.current;
    const { mario, level } = S;

    mario.update(dt);

    // Collide with solids
    mario.onGround = false;
    for (const solid of level.solids) {
      const side = resolveAABBCollision(mario, solid);
      if (side === 'top') {
        mario.onGround = true;
      }
    }

    // Death if falling out of world
    if (mario.y > level.world.height) {
      S.lives -= 1;
      if (S.lives <= 0) {
        S.lives = 0;
        S.gameOver = true;
      } else {
        // respawn
        mario.x = level.spawn.x;
        mario.y = level.spawn.y;
        mario.vx = 0;
        mario.vy = 0;
      }
    }

    // Enemies
    for (const e of level.enemies) e.update(dt);

    // Mario vs Enemies
    for (const e of level.enemies) {
      if (!e.alive) continue;
      if (aabb(mario, e)) {
        const marioBottom = mario.y + mario.h;
        const enemyTop = e.y;
        const wasStomp = mario.vy > 0 && marioBottom - enemyTop < 14;
        if (wasStomp) {
          e.kill();
          mario.stomp();
          S.score += 100;
        } else {
          // lose life and respawn
          S.lives -= 1;
          if (S.lives <= 0) {
            S.lives = 0;
            S.gameOver = true;
          } else {
            mario.x = level.spawn.x;
            mario.y = level.spawn.y;
            mario.vx = mario.vy = 0;
          }
        }
      }
    }

    // Coins
    for (const c of level.coins) c.update(dt);
    for (const c of level.coins) {
      if (!c.collected && aabb(mario, c.getRect())) {
        c.collect();
        S.score += 10;
      }
    }
  };

  const renderWorld = (ctx, width, height) => {
    const { mario, level } = stateRef.current;
    ctx.clearRect(0, 0, width, height);

    // Sky background
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, width, height);

    // Solids
    for (const s of level.solids) s.render(ctx);

    // Coins
    for (const c of level.coins) c.render(ctx);

    // Enemies
    for (const e of level.enemies) e.render(ctx);

    // Mario
    mario.render(ctx);
  };

  // PUBLIC_INTERFACE
  const restart = () => {
    // Rebuild level and reset state
    const input = inputRef.current;
    const level = createDemoLevel();
    const mario = new Mario(level.spawn.x, level.spawn.y, input);
    stateRef.current = { mario, level, input, score: 0, lives: 3, paused: false, gameOver: false };
  };

  // Expose restart through element dataset for Overlay controls
  useEffect(() => {
    canvasRef.current.__restart = restart;
  });

  return (
    <div className="canvas-frame" style={{ width, height, position: 'relative' }}>
      <canvas ref={canvasRef} role="img" aria-label="Game canvas" />
    </div>
  );
}
