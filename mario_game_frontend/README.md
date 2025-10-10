# React Mario Platformer

A simple 2D platformer built with React and HTML5 Canvas. Control Mario to run, jump, collect coins, stomp enemies, and survive as long as you can. The app uses a fixed-timestep game loop, lightweight entity classes, and a clean “Ocean Professional” UI theme.

## Overview and features

This project renders a playable platformer inside a React single-page app. Key features include:
- Fixed-timestep loop for consistent physics (60 FPS target).
- Keyboard and on-screen touch controls.
- Basic physics with gravity, friction, coyote time, and jump buffering.
- AABB collision against static platforms and simple patrol enemies.
- Coins, score tracking, lives, pause/resume, and game over with overlay.
- Modern, minimal UI layer with the Ocean Professional theme.

## Getting started (install and run)

Prerequisites:
- Node.js 16+ and npm.

Install dependencies and start the dev server:
- npm install
- npm start

The app will run on http://localhost:3000. The game canvas is centered with a HUD at the top and an overlay for pause/game over.

Build for production:
- npm run build

Run unit tests:
- npm test

## Controls (keyboard and touch)

Keyboard:
- Move left: ArrowLeft or A
- Move right: ArrowRight or D
- Jump: ArrowUp, W, or Space
- Pause/Resume: P (toggles paused state)

Touch (mobile):
- Three on-screen buttons appear under the canvas for Left, Jump, and Right.
- Buttons simulate key presses through the Input emulation methods.

## Game mechanics

Scoring:
- +10 points per coin collected.
- +100 points for stomping an enemy.

Lives and respawn:
- You start with 3 lives.
- Falling off the world or colliding with an enemy from the side/underneath costs a life.
- If lives remain, Mario respawns at the level spawn point; otherwise, Game Over displays.

Coins:
- Coins float with a subtle bob animation and are removed when collected.

Enemies:
- Simple patrolling enemies reverse direction at bounds.
- Stomp enemies by landing on them while descending; Mario bounces slightly on a successful stomp.

Platforms and collision:
- Axis-aligned platforms act as static solids.
- Collision resolution places Mario on top, below, left, or right of platforms, zeroing the appropriate velocity and setting grounded state when landing on top.

Pause, resume, and restart:
- Press P to toggle pause at any time.
- When paused, a modal overlay appears with a Resume button.
- On Game Over, press the Restart button or call the in-canvas Restart to reset score, lives, entities, and state.
- Programmatic restart is exposed via the canvas element as __restart and is wired by the App’s Restart button in the overlay.

## UI and theming (Ocean Professional variables and layout)

The UI follows a modern aesthetic with the Ocean Professional theme:
- Primary: #2563EB (blue)
- Secondary/success accent: #F59E0B (amber)
- Error: #EF4444 (red)
- Background: #f9fafb
- Surface: #ffffff
- Text: #111827
- Rounded corners and soft shadows for cards, buttons, and the canvas frame.
- Subtle gradient background from blue to gray-50.

Theme location:
- src/theme/theme.css holds CSS variables, utilities, and component styles (buttons, cards, overlay, HUD).
- src/App.css contains minor layout overrides for the app container and text styles.

Layout:
- Centered canvas inside a framed surface with a top HUD for score and lives.
- Overlay for paused and game over states.
- On mobile, touch controls appear at the bottom of the canvas.

## Project structure (folders and key files)

Top-level app:
- src/index.js: React app bootstrap.
- src/App.js: Main app shell that renders the canvas, HUD, on-screen controls, and overlays, and lifts game state for UI.
- src/index.css and src/theme/theme.css: Base and theme styles.
- src/App.css: App-specific layout styles.

Components:
- src/components/GameCanvas.jsx: Sets up the game loop, input, level, entities, update/render stages, and exposes __restart on the canvas element.
- src/components/HUD.jsx: Displays lives and score.
- src/components/Overlay.jsx: Handles paused/game over overlays and buttons.
- src/components/Controls.jsx: Mobile-friendly on-screen controls that emulate key presses.

Game engine and state:
- src/game/engine/GameLoop.js: Fixed timestep loop with requestAnimationFrame for render.
- src/game/engine/Input.js: Keyboard mapping and emulation for touch.
- src/game/engine/Physics.js: Gravity, friction, horizontal movement, jump buffering, coyote time, and integration.
- src/game/engine/Collision.js: AABB detection and resolution with side determination.
- src/game/state/LevelData.js: Demo level layout with platforms, coins, enemies, and spawn.
- src/game/state/GameState.js: Score/lives/pause/gameOver model (lightweight, some state also lives in GameCanvas).

Entities:
- src/game/entities/Mario.js: Player entity with physics and render.
- src/game/entities/Platform.js: Static solid rectangles.
- src/game/entities/Enemy.js: Patrolling enemies that can be stomped.
- src/game/entities/Coin.js: Collectible coins with bob animation.

Utilities and tests:
- src/utils/constants.js: Tunable constants for physics, colors, input mappings, sizes.
- src/utils/helpers.js: Small helpers (clamp, sign, rectIntersect).
- src/__tests__/physics.test.js and src/__tests__/collision.test.js: Unit tests for physics and collision behaviors.
- src/App.test.js: Basic render test for canvas and HUD.

## Testing (how to run tests)

- npm test: Runs the test runner in watch mode using react-scripts and @testing-library/jest-dom.
- Tests cover gravity and terminal velocity, jump buffering, and AABB collision resolution.

Tips:
- If tests hang in CI, use CI=true npm test to run once in non-interactive mode.

## Troubleshooting and tips

Common issues:
- Blank page or no canvas: Check browser console for errors. Ensure npm install completed successfully.
- Controls not responding: Make sure the canvas is focused and the browser tab is active. On mobile, use the on-screen controls.
- Performance dips: Reduce canvas size via GameCanvas props in App.js, or lower physics constants in src/utils/constants.js.
- “Module not found” errors: Reinstall dependencies with rm -rf node_modules && npm install.
- Build issues on older Node versions: Use Node.js 16+ for best compatibility with react-scripts 5.

Developer notes:
- Pause is edge-triggered via Input.pressedPause; the overlay’s Resume button simply toggles paused off through App.
- Restart is exposed as canvas.__restart and reinitializes level, Mario, score, and lives.
- Physics constants (gravity, friction, jump force) can be tuned in src/utils/constants.js to adjust feel.

License:
- This project is for demonstration purposes and contains no external API integrations.
