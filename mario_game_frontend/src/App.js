import React, { useEffect, useMemo, useRef, useState } from "react";
import "./game.css";

/**
 * Game state enum.
 * @readonly
 * @enum {string}
 */
const GAME_STATE = {
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
  GAME_FINISHED: "GAME_FINISHED",
};

/**
 * Clamp a number between min/max.
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Simple AABB intersection.
 * @param {{x:number,y:number,w:number,h:number}} a
 * @param {{x:number,y:number,w:number,h:number}} b
 * @returns {boolean}
 */
function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Creates 3 levels with increasing difficulty (more enemies, higher scroll speed).
 * Coordinates are within the 1086x657 viewport space.
 * @returns {Array<any>}
 */
function createLevels() {
  return [
    {
      id: 1,
      name: "Level 1",
      scrollSpeed: 3.0,
      goalX: 980,
      enemies: [{ id: "e1", x: 640, y: 510, w: 44, h: 34, vx: 1.2, minX: 560, maxX: 760 }],
    },
    {
      id: 2,
      name: "Level 2",
      scrollSpeed: 3.6,
      goalX: 1000,
      enemies: [
        { id: "e1", x: 560, y: 510, w: 44, h: 34, vx: 1.6, minX: 500, maxX: 720 },
        { id: "e2", x: 820, y: 510, w: 44, h: 34, vx: 1.3, minX: 780, maxX: 980 },
      ],
    },
    {
      id: 3,
      name: "Level 3",
      scrollSpeed: 4.2,
      goalX: 1020,
      enemies: [
        { id: "e1", x: 520, y: 510, w: 44, h: 34, vx: 1.8, minX: 460, maxX: 700 },
        { id: "e2", x: 740, y: 510, w: 44, h: 34, vx: 1.6, minX: 680, maxX: 940 },
        { id: "e3", x: 920, y: 510, w: 44, h: 34, vx: 1.4, minX: 860, maxX: 1040 },
      ],
    },
  ];
}

/**
 * Provides a simple consistent set of platforms (as rects) for the scene.
 * We keep the layout close to the extracted Figma “Play here” scene but also
 * add a few near-screen elements for gameplay.
 * @returns {Array<{id:string,x:number,y:number,w:number,h:number}>}
 */
function createPlatforms() {
  return [
    { id: "floor", x: -4000, y: 560, w: 12000, h: 120 }, // ground
    { id: "p1", x: 220, y: 470, w: 180, h: 28 },
    { id: "p2", x: 430, y: 410, w: 190, h: 28 },
    { id: "p3", x: 700, y: 450, w: 210, h: 28 },
  ];
}

/**
 * Default player physics constants (scaled to this simple world).
 */
const PHYS = {
  gravity: 0.75,
  moveSpeed: 4.2,
  jumpVelocity: -13.5,
  terminalVelocity: 16,
};

/**
 * Dimensions for the fixed Figma viewport.
 */
const VIEWPORT = { w: 1086, h: 657 };

/**
 * Player hitbox size (kept small relative to Figma Mario icon).
 */
const PLAYER = { w: 44, h: 60 };

/**
 * Core tuning constants to keep game flow consistent.
 */
const TUNE = {
  worldWidth: 9930, // extracted BG width
  respawn: { x: 120, y: 500 },
  hitGraceMs: 650, // i-frames after taking damage
  scoreTickMs: 250,
};

/**
 * Computes difficulty scaling for the current level (keeps “feel” but increases challenge).
 * @param {number} levelIndex
 * @returns {{moveSpeed:number, gravity:number, jumpVelocity:number, enemySpeedMult:number, scrollAssist:number}}
 */
function getDifficulty(levelIndex) {
  // Keep changes subtle to preserve playability and UI fidelity.
  const lv = clamp(levelIndex, 0, 10);
  return {
    moveSpeed: PHYS.moveSpeed + lv * 0.25,
    gravity: PHYS.gravity + lv * 0.03,
    jumpVelocity: PHYS.jumpVelocity - lv * 0.15, // slightly higher jump over time
    enemySpeedMult: 1 + lv * 0.12,
    scrollAssist: 1 + lv * 0.05,
  };
}

/**
 * PUBLIC_INTERFACE
 * Main React App: renders the "Play here" styled game and level/game-state system.
 */
function App() {
  const levels = useMemo(() => createLevels(), []);
  const platforms = useMemo(() => createPlatforms(), []);

  const [gameState, setGameState] = useState(GAME_STATE.WAITING);
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  // World/scene scroll offset (0..(bgWidth-viewportWidth))
  const [scrollX, setScrollX] = useState(0);

  // Player state
  const [player, setPlayer] = useState(() => ({
    x: TUNE.respawn.x,
    y: TUNE.respawn.y,
    vx: 0,
    vy: 0,
    onGround: false,
  }));

  // Enemies are per-level stateful (patrolling)
  const [enemies, setEnemies] = useState(() => levels[0].enemies.map((e) => ({ ...e })));

  // Input state
  const inputRef = useRef({ left: false, right: false, jump: false });
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Keep “latest state” refs for checks inside RAF without depending on React update timing.
  const playerRef = useRef(player);
  const enemiesRef = useRef(enemies);
  const scrollXRef = useRef(scrollX);
  const levelIndexRef = useRef(levelIndex);
  const gameStateRef = useRef(gameState);
  const livesRef = useRef(lives);

  // Anti-double-trigger guards (win/fall/damage)
  const resolvingRef = useRef(false);
  const lastHitAtRef = useRef(0);

  const currentLevel = levels[levelIndex];
  const isLastLevel = levelIndex === levels.length - 1;
  const difficulty = useMemo(() => getDifficulty(levelIndex), [levelIndex]);

  // Sync refs whenever state changes
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);
  useEffect(() => {
    scrollXRef.current = scrollX;
  }, [scrollX]);
  useEffect(() => {
    levelIndexRef.current = levelIndex;
  }, [levelIndex]);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  /**
   * Reset a specific level index (defaults to current).
   * Keeps score/lives depending on opts.
   * @param {number} idx
   * @param {{keepScore?:boolean, keepLives?:boolean, nextState?:string}} opts
   */
  function resetLevelIndex(idx, opts = {}) {
    const keepScore = Boolean(opts.keepScore);
    const keepLives = Boolean(opts.keepLives);
    const nextState = opts.nextState || GAME_STATE.WAITING;

    resolvingRef.current = false;
    lastHitAtRef.current = 0;

    setScrollX(0);
    setPlayer({ x: TUNE.respawn.x, y: TUNE.respawn.y, vx: 0, vy: 0, onGround: false });
    setEnemies(levels[idx].enemies.map((e) => ({ ...e })));
    setGameState(nextState);

    if (!keepScore) setScore(0);
    if (!keepLives) setLives(3);
  }

  /**
   * PUBLIC_INTERFACE
   * Reset the current level to a clean state (keep lives/score optionally).
   * @param {{keepScore?:boolean, keepLives?:boolean}} opts
   */
  function resetLevel(opts = {}) {
    resetLevelIndex(levelIndexRef.current, opts);
  }

  /**
   * PUBLIC_INTERFACE
   * Start gameplay for the current level (S key or Start button).
   */
  function startGame() {
    const st = gameStateRef.current;
    if (st === GAME_STATE.GAME_OVER || st === GAME_STATE.GAME_FINISHED) return;
    setGameState(GAME_STATE.PLAYING);
  }

  /**
   * PUBLIC_INTERFACE
   * Proceed to next level or finish the game.
   * Ensures level transition resets level-specific entities reliably.
   */
  function completeLevel() {
    if (resolvingRef.current) return;
    resolvingRef.current = true;

    if (isLastLevel) {
      setGameState(GAME_STATE.GAME_FINISHED);
      return;
    }

    // Move to next level and reset level-specific state (keeping score/lives).
    setLevelIndex((idx) => idx + 1);
    setGameState(GAME_STATE.WAITING);
  }

  /**
   * PUBLIC_INTERFACE
   * Full restart from Level 1.
   */
  function restartFromBeginning() {
    resolvingRef.current = false;
    lastHitAtRef.current = 0;

    setLevelIndex(0);
    setScore(0);
    setLives(3);
    setScrollX(0);
    setPlayer({ x: TUNE.respawn.x, y: TUNE.respawn.y, vx: 0, vy: 0, onGround: false });
    setEnemies(levels[0].enemies.map((e) => ({ ...e })));
    setGameState(GAME_STATE.WAITING);
  }

  /**
   * PUBLIC_INTERFACE
   * Continue to next level from WAITING.
   * (Used by overlay when a level completes and we are waiting to start.)
   */
  function startNextLevel() {
    if (gameStateRef.current !== GAME_STATE.WAITING) return;
    startGame();
  }

  // When level changes, reset level-specific state reliably and clear guard.
  useEffect(() => {
    resolvingRef.current = false;
    lastHitAtRef.current = 0;
    setScrollX(0);
    setPlayer({ x: TUNE.respawn.x, y: TUNE.respawn.y, vx: 0, vy: 0, onGround: false });
    setEnemies(levels[levelIndex].enemies.map((e) => ({ ...e })));
  }, [levelIndex, levels]);

  // Keyboard listeners
  useEffect(() => {
    function onKeyDown(e) {
      // If an overlay is up, allow quick restart via R.
      if (e.code === "KeyR") {
        restartFromBeginning();
        return;
      }

      if (e.code === "ArrowLeft" || e.code === "KeyA") inputRef.current.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") inputRef.current.right = true;
      if (e.code === "Space") inputRef.current.jump = true;

      if (e.code === "KeyS") {
        // In extracted design: "Press s to start the game"
        if (gameStateRef.current === GAME_STATE.WAITING) startGame();
      }

      // Prevent page scroll on space
      if (e.code === "Space") e.preventDefault();
    }

    function onKeyUp(e) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") inputRef.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") inputRef.current.right = false;
      if (e.code === "Space") inputRef.current.jump = false;
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Resolve taking damage: decrement life, possibly GAME_OVER, otherwise respawn and continue.
   * Uses i-frames to avoid repeated collision-trigger while overlapping.
   */
  function applyDamage() {
    const now = performance.now();
    if (now - lastHitAtRef.current < TUNE.hitGraceMs) return;
    lastHitAtRef.current = now;

    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        setGameState(GAME_STATE.GAME_OVER);
        return 0;
      }
      // penalty + respawn, keep playing
      setScore((s) => Math.max(0, s - 50));
      setScrollX(0);
      setPlayer({ x: TUNE.respawn.x, y: TUNE.respawn.y, vx: 0, vy: 0, onGround: false });
      return next;
    });
  }

  // Core game loop (RAF)
  useEffect(() => {
    if (gameState !== GAME_STATE.PLAYING) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }

    function step(t) {
      if (gameStateRef.current !== GAME_STATE.PLAYING) return;

      if (lastTimeRef.current == null) lastTimeRef.current = t;
      // normalize dt to ~60fps steps
      const dt = clamp((t - lastTimeRef.current) / 16.6667, 0.5, 2.0);
      lastTimeRef.current = t;

      const worldMaxScroll = clamp(TUNE.worldWidth - VIEWPORT.w, 0, TUNE.worldWidth);

      // Update enemies (patrol) + scaling
      setEnemies((prev) =>
        prev.map((en) => {
          const speed = en.vx * difficulty.enemySpeedMult;
          let nx = en.x + speed * dt;

          if (nx < en.minX) {
            nx = en.minX;
            return { ...en, x: nx, vx: Math.abs(en.vx) };
          }
          if (nx > en.maxX) {
            nx = en.maxX;
            return { ...en, x: nx, vx: -Math.abs(en.vx) };
          }
          return { ...en, x: nx };
        })
      );

      // Update player
      setPlayer((p) => {
        const input = inputRef.current;

        let vx = 0;
        if (input.left) vx -= difficulty.moveSpeed;
        if (input.right) vx += difficulty.moveSpeed;

        // Jump (only when grounded)
        let vy = p.vy;
        let onGround = p.onGround;

        if (input.jump && onGround) {
          vy = difficulty.jumpVelocity;
          onGround = false;
        }

        // Gravity
        vy = clamp(vy + difficulty.gravity * dt, -100, PHYS.terminalVelocity);

        let nx = p.x + vx * dt;
        let ny = p.y + vy * dt;

        // Resolve collisions with platforms (simple: vertical only)
        let landed = false;
        const hitbox = { x: nx, y: ny, w: PLAYER.w, h: PLAYER.h };
        for (const plat of platforms) {
          const platBox = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };
          if (vy >= 0 && intersects(hitbox, platBox)) {
            ny = plat.y - PLAYER.h;
            vy = 0;
            landed = true;
          }
        }

        // Keep within viewport X bounds (screen space)
        nx = clamp(nx, 0, VIEWPORT.w - PLAYER.w);

        // Auto-scroll: keep player around center by shifting scrollX
        const worldX = nx + scrollXRef.current;
        const desiredScroll = clamp(worldX - VIEWPORT.w * 0.45, 0, worldMaxScroll);

        setScrollX((sx) => {
          const target = desiredScroll;
          const lerp = 0.18 * dt * difficulty.scrollAssist;
          return sx + (target - sx) * lerp;
        });

        // Win/lose checks from latest predicted values:
        // - falling beyond screen triggers damage (handled here to avoid missing frames)
        if (ny > VIEWPORT.h + 40) {
          // Do not also move player on the same frame; damage handler respawns.
          // We keep ny, but state update will happen after setPlayer resolves.
          applyDamage();
        }

        // Enemy collision check using *predicted* player position + latest enemies
        // (note: enemies are in screen-space relative to BG; collision should be in world-space)
        const sx = scrollXRef.current;
        const playerWorld = { x: nx + sx, y: ny, w: PLAYER.w, h: PLAYER.h };
        const ens = enemiesRef.current;
        const inIFrames = performance.now() - lastHitAtRef.current < TUNE.hitGraceMs;

        if (!inIFrames) {
          for (const en of ens) {
            const enemyWorld = { x: en.x + sx, y: en.y, w: en.w, h: en.h };
            if (intersects(playerWorld, enemyWorld)) {
              applyDamage();
              break;
            }
          }
        }

        // Win condition: reach goal X in world coords
        if (!resolvingRef.current && playerWorld.x >= currentLevel.goalX) {
          setScore((s) => s + 300 + levelIndexRef.current * 150);
          completeLevel();
        }

        return { x: nx, y: ny, vx, vy, onGround: landed };
      });

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [currentLevel.goalX, difficulty, gameState, platforms]);

  // Score tick while playing (small)
  useEffect(() => {
    if (gameState !== GAME_STATE.PLAYING) return;
    const id = window.setInterval(() => {
      // Prevent tick after end-state.
      if (gameStateRef.current !== GAME_STATE.PLAYING) return;
      setScore((s) => s + 1);
    }, TUNE.scoreTickMs);
    return () => window.clearInterval(id);
  }, [gameState]);

  // Render positions for extracted layers: apply scroll to BG so it feels like a side-scroller
  const bgLeft = -scrollX;

  const marioStyle = {
    left: `${player.x}px`,
    top: `${player.y}px`,
    filter:
      performance.now() - lastHitAtRef.current < TUNE.hitGraceMs
        ? "drop-shadow(0 0 10px rgba(239,68,68,0.45))"
        : "none",
    opacity: performance.now() - lastHitAtRef.current < TUNE.hitGraceMs ? 0.92 : 1,
  };

  const enemyStyles = enemies.map((en) => ({
    id: en.id,
    style: { left: `${en.x}px`, top: `${en.y}px` },
  }));

  const showWaitingOverlay = gameState === GAME_STATE.WAITING;
  const showGameOverOverlay = gameState === GAME_STATE.GAME_OVER;
  const showFinishedOverlay = gameState === GAME_STATE.GAME_FINISHED;

  return (
    <div className="gameApp">
      <div className="gameShell">
        <div className="topBar" role="region" aria-label="Game HUD">
          <div className="topBarLeft">
            <span className="pill">
              Level: <strong>{currentLevel.name}</strong>
            </span>
            <span className="pill pillAccent">
              Score: <strong>{score}</strong>
            </span>
            <span className={`pill ${lives <= 1 ? "pillError" : ""}`}>
              Lives: <strong>{lives}</strong>
            </span>
          </div>

          <div className="topBarRight">
            {gameState === GAME_STATE.WAITING && (
              <button className="smallBtn smallBtnPrimary" onClick={startGame} type="button">
                Start (S)
              </button>
            )}
            <button
              className="smallBtn"
              onClick={() => resetLevel({ keepScore: true, keepLives: true })}
              type="button"
              disabled={showGameOverOverlay || showFinishedOverlay}
              aria-disabled={showGameOverOverlay || showFinishedOverlay}
              title={showGameOverOverlay || showFinishedOverlay ? "Restart to play again" : "Reset current level"}
            >
              Reset Level
            </button>
            <button className="smallBtn" onClick={restartFromBeginning} type="button">
              Restart Game (R)
            </button>
          </div>
        </div>

        <div className="hintRow" aria-label="Controls help">
          <div>
            Controls: <strong>A/D</strong> or <strong>←/→</strong> to move, <strong>Space</strong> to jump,{" "}
            <strong>S</strong> to start. <strong>R</strong> restarts.
          </div>
          <div>Objective: reach the goal (right side). Avoid enemies or you lose lives.</div>
        </div>

        <div className="playHereStageWrap">
          <div className="play-here-viewport" aria-label="Play here game viewport">
            <div className="play-here-canvas" aria-hidden="false">
              {/* Scene root */}
              <div className="ph-component-3">
                {/* BG group (very wide). We shift it left based on scrollX */}
                <div className="ph-bg" style={{ left: `${bgLeft}px` }}>
                  <div className="ph-bg-base" aria-label="background base" />

                  {/* Extracted platform blocks (off-screen in original, but kept for fidelity) */}
                  <div
                    className="ph-rect8"
                    style={{ left: 9268.3057, top: 63.0332, width: 240.011, height: 523.6605 }}
                  />
                  <div
                    className="ph-rect6"
                    style={{ left: 7614.896, top: 424.2617, width: 121.2177, height: 60.6089 }}
                  />
                  <div
                    className="ph-rect3"
                    style={{ left: 6211.1953, top: 368.502, width: 528.5092, height: 218.1919 }}
                  />
                  <div
                    className="ph-rect4"
                    style={{ left: 6720.3096, top: 336.9854, width: 627.9077, height: 249.7085 }}
                  />
                  <div
                    className="ph-rect5"
                    style={{ left: 8475.542, top: 189.0996, width: 463.0516, height: 397.5941 }}
                  />
                  <div
                    className="ph-rect7"
                    style={{ left: 2630.4241, top: 324.8633, width: 157.583, height: 65.4576 }}
                  />
                  <div className="ph-reggr" style={{ left: 984.2878, top: 397.5938, width: 46.0627, height: 48.4871 }} />
                  <div
                    className="ph-535greg"
                    style={{ left: 1078.8375, top: 397.5938, width: 46.0627, height: 48.4871 }}
                  />

                  {/* Our gameplay platforms (visible and near-screen) */}
                  {platforms
                    .filter((p) => p.id !== "floor")
                    .map((p) => (
                      <div
                        key={p.id}
                        className="ph-rect7"
                        style={{
                          left: p.x,
                          top: p.y,
                          width: p.w,
                          height: p.h,
                          background: "#6b8cff",
                        }}
                        aria-label="platform"
                      />
                    ))}

                  {/* Enemy visuals */}
                  {enemyStyles.map((en) => (
                    <div key={en.id} className="ph-enemy" style={en.style} aria-label="Enemy">
                      <div className="ph-enemy-body" aria-hidden="true">
                        <div className="ph-enemy-black" />
                        <div className="ph-enemy-white" />
                        <div className="ph-enemy-green" />
                        <div className="ph-enemy-orange" />
                      </div>
                      <div className="ph-enemy-red" aria-hidden="true" />
                      <div className="ph-enemy-white2" aria-hidden="true" />
                      <div className="ph-enemy-black2" aria-hidden="true" />
                    </div>
                  ))}

                  {/* Goal marker */}
                  <div className="ph-princess" style={{ left: currentLevel.goalX, top: 450 }} aria-label="Goal">
                    <div className="ph-princess-base" aria-hidden="true" />
                    <img className="ph-princess-rect1" src="/assets/figma_image_34_361_30_176_22_234.svg" alt="" />
                    <div className="ph-princess-dot" aria-hidden="true">
                      .
                    </div>
                  </div>
                </div>

                {/* Instructions overlay */}
                <div className="ph-inst" aria-label="Instructions">
                  <img className="ph-inst-icon" src="/assets/figma_image_34_361_29_269.svg" alt="icon" />
                  <div className="ph-inst-bar" aria-hidden="true" />
                  <div className="ph-inst-text">
                    Press   s   to  start  the   game.{"\n"}
                    PRESS   SpACE  BAR   TO  JUMP.{"\n\n"}
                    You’re  IMMORTAL  HERE.   LOL:D
                  </div>
                </div>
              </div>

              {/* Mario */}
              <div className="ph-mario" style={marioStyle} aria-label="Mario">
                <div className="ph-mario-group" aria-hidden="true">
                  <div className="ph-mario-vector3" />
                  <div className="ph-mario-vector2" />
                  <img className="ph-mario-vector1" src="/assets/figma_image_34_419_1_51.svg" alt="" />
                </div>
              </div>

              {/* Overlays */}
              {showGameOverOverlay && (
                <div className="overlayScrim" role="dialog" aria-modal="true" aria-label="Game Over">
                  <div className="overlayCard">
                    <h2 className="overlayTitle overlayTitleGameOver">Game Over</h2>
                    <p className="overlayText">
                      You ran out of lives on <strong>{currentLevel.name}</strong>. Try again?
                    </p>
                    <div className="overlayActions">
                      <button className="bigBtn bigBtnPrimary" onClick={restartFromBeginning} type="button">
                        Restart Game
                      </button>
                      <button
                        className="bigBtn"
                        onClick={() => resetLevelIndex(0, { keepLives: false, keepScore: false, nextState: GAME_STATE.WAITING })}
                        type="button"
                      >
                        Back to Start
                      </button>
                    </div>
                    <p className="overlayHint">Tip: Press <strong>R</strong> to restart instantly.</p>
                  </div>
                </div>
              )}

              {showFinishedOverlay && (
                <div className="overlayScrim" role="dialog" aria-modal="true" aria-label="Game Finished">
                  <div className="overlayCard">
                    <h2 className="overlayTitle overlayTitleFinished">You finished!</h2>
                    <p className="overlayText">
                      Completed all levels. Final score: <strong>{score}</strong>.
                    </p>
                    <div className="overlayActions">
                      <button className="bigBtn bigBtnAccent" onClick={restartFromBeginning} type="button">
                        Play Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showWaitingOverlay && (
                <div className="overlayScrim overlayScrimWaiting" role="dialog" aria-modal="true" aria-label="Ready">
                  <div className="overlayCard">
                    <h2 className="overlayTitle">Ready: {currentLevel.name}</h2>
                    <p className="overlayText">
                      Reach the goal and avoid enemies. Difficulty scales each level.
                      <br />
                      Press <strong>S</strong> or click Start.
                    </p>
                    <div className="overlayActions">
                      <button className="bigBtn bigBtnPrimary" onClick={startNextLevel} type="button">
                        Start Level
                      </button>
                      <button className="bigBtn" onClick={restartFromBeginning} type="button">
                        Restart Game
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
