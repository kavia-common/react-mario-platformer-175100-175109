import { useEffect, useRef, useState } from 'react';
import './App.css';
import './theme/theme.css';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';
import Overlay from './components/Overlay';

// PUBLIC_INTERFACE
export default function App() {
  /** Main app renders title, HUD, canvas, controls, and overlay. */
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    document.title = 'React Mario Platformer';
  }, []);

  const onTick = ({ score, lives, paused, gameOver }) => {
    setScore(score);
    setLives(lives);
    setPaused(paused);
    setGameOver(gameOver);
  };

  const onRestart = () => {
    const canvas = document.querySelector('canvas');
    canvas?.__restart?.();
    setScore(0);
    setLives(3);
    setPaused(false);
    setGameOver(false);
  };

  const onTogglePause = () => setPaused(false);

  return (
    <div className="app-root">
      <header className="header">
        <div className="badge">Ocean Professional</div>
        <h1 className="title">React Mario Platformer</h1>
        <p className="subtle">Use arrow keys or WASD to move, Space/Up to jump, P to pause</p>
      </header>

      <main className="main">
        <div className="game-wrapper">
          <div style={{ position: 'relative' }}>
            <GameCanvas ref={canvasRef} width={960} height={540} onTick={onTick} />
            <HUD score={score} lives={lives} />
            <Controls />
            <Overlay paused={paused} gameOver={gameOver} onRestart={onRestart} onTogglePause={onTogglePause} />
          </div>
        </div>
      </main>

      <footer className="footer">
        Built with React + Canvas. Theme: Ocean Professional.
      </footer>
    </div>
  );
}
